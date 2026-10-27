import mongoose from 'mongoose';
import Query from './models.js';
import Case from '../cases/Case.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { recordAudit } from '../audit/audit.js';
import User from '../auth/User.js';
import { checkAction, proceedAction } from '../prevent/stage2.js';

async function queryCaseAccess(user, row) {
  if (user.role !== 'institution_admin') return canAccessCase(user, row);
  const account = await User.findById(user._id || user.id).select('institutionPid active').lean();
  return Boolean(account?.active && account.institutionPid && account.institutionPid === row.institutionPid);
}

const OFFICER_ROLES = [
  'bureau_officer',
  'regional_officer',
  'supervisor',
  'competent_authority',
  'system_admin',
];

/**
 * Send an information request / query (N70)
 */
export async function sendQuery(officerUser, { caseId, recipientType, queryText, proceedReason }) {
  if (!OFFICER_ROLES.includes(officerUser.role)) {
    const err = new Error('Access denied: Only officers can send queries');
    err.status = 403;
    throw err;
  }
  if (!['complainant', 'institution'].includes(recipientType)) {
    const err = new Error('recipientType must be "complainant" or "institution"');
    err.status = 400;
    throw err;
  }
  if (!queryText || typeof queryText !== 'string' || !queryText.trim()) {
    const err = new Error('queryText is required');
    err.status = 400;
    throw err;
  }

  const caseDoc = await Case.findOne(mongoose.isValidObjectId(caseId) ? { _id: caseId } : { masterCaseId: caseId });
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const allowed = await canAccessCase(officerUser, caseDoc);
  if (!allowed) {
    const err = new Error('Access denied to case');
    err.status = 403;
    throw err;
  }

  if (recipientType === 'institution') {
    const preflight = await checkAction(officerUser, { caseId: String(caseDoc._id), actionType: 'DOCUMENT_REQUEST', details: { subject: queryText.trim() } });
    await proceedAction(officerUser, preflight.checkId, proceedReason);
  }
  const query = await Query.create({
    caseId: caseDoc._id,
    masterCaseId: caseDoc.masterCaseId,
    senderOfficerId: (officerUser._id || officerUser.id),
    senderRole: officerUser.role,
    senderBureau: officerUser.bureau || 'PGRC',
    recipientType,
    queryText: queryText.trim(),
    queriedAt: new Date(),
    status: 'PENDING',
  });

  await recordAudit({
    actorId: String(officerUser._id || officerUser.id),
    actorRole: officerUser.role,
    action: 'query.sent',
    targetType: 'Query',
    targetId: String(query._id),
    meta: {
      masterCaseId: caseDoc.masterCaseId,
      recipientType,
      queriedAt: query.queriedAt,
    },
  });

  return query;
}

/**
 * Respond to a query with clarifications and optional documents (N70)
 */
export async function respondToQuery(user, queryId, { responseText, documentIds = [] }) {
  if (!responseText || typeof responseText !== 'string' || !responseText.trim()) {
    const err = new Error('responseText is required');
    err.status = 400;
    throw err;
  }

  const query = await Query.findById(queryId);
  if (!query) {
    const err = new Error('Query not found');
    err.status = 404;
    throw err;
  }
  if (query.status === 'RESPONDED') {
    const err = new Error('Query has already been answered');
    err.status = 400;
    throw err;
  }

  const caseDoc = await Case.findById(query.caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  // Authorization:
  // If recipientType is complainant: only complainant owning case
  // If recipientType is institution: institution_admin for that institution
  // Officers may also record replies on behalf of communication channels
  if (!await queryCaseAccess(user, caseDoc)) { const error = new Error('Access denied to case'); error.status = 403; throw error; }
  if (query.recipientType === 'complainant') {
    const isOwner = ['student', 'faculty', 'other_stakeholder'].includes(user.role) && await canAccessCase(user, caseDoc);
    const isOfficer = OFFICER_ROLES.includes(user.role);
    if (!isOwner && !isOfficer) {
      const err = new Error('Access denied: You cannot answer queries addressed to another complainant');
      err.status = 403;
      throw err;
    }
  } else if (query.recipientType === 'institution') {
    const isInstAdmin = user.role === 'institution_admin';
    const isOfficer = OFFICER_ROLES.includes(user.role);
    if (!isInstAdmin && !isOfficer) {
      const err = new Error('Access denied: You cannot answer queries addressed to another institution');
      err.status = 403;
      throw err;
    }
  }

  const now = new Date();
  query.responseText = responseText.trim();
  query.responderId = (user._id || user.id);
  query.responderRole = user.role;
  query.respondedAt = now;
  query.status = 'RESPONDED';
  query.documentIds = documentIds;
  await query.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'query.responded',
    targetType: 'Query',
    targetId: String(query._id),
    meta: {
      masterCaseId: caseDoc.masterCaseId,
      recipientType: query.recipientType,
      respondedAt: now,
    },
  });

  return query;
}

/**
 * Get queries for a case (SPEC 12.3, N70)
 *
 * Invariants:
 * - Complainant sees ONLY queries with recipientType === 'complainant'
 * - Institution admin sees ONLY queries with recipientType === 'institution'
 * - Neither sees the other party's queries or replies.
 */
export async function getQueriesForCase(user, caseId) {
  const caseDoc = await Case.findOne(
    mongoose.isValidObjectId(caseId) ? { _id: caseId } : { masterCaseId: caseId }
  );
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const isComplainant = ['student', 'faculty', 'other_stakeholder'].includes(user.role);
  const isInstAdmin = user.role === 'institution_admin';
  if (!await queryCaseAccess(user, caseDoc)) { const error = new Error('Access denied to case'); error.status = 403; throw error; }

  let filter = { caseId: caseDoc._id };

  if (isComplainant) {
    // Only queries addressed to complainant
    filter.recipientType = 'complainant';
  } else if (isInstAdmin) {
    // Only queries addressed to institution
    filter.recipientType = 'institution';
  } else {
    // Officers check case access
    const allowed = await canAccessCase(user, caseDoc);
    if (!allowed) {
      const err = new Error('Access denied to case');
      err.status = 403;
      throw err;
    }
  }

  return Query.find(filter).sort({ queriedAt: 1 }).lean();
}
