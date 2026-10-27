import mongoose from 'mongoose';
import Case from '../cases/Case.js';
import User from '../auth/User.js';
import Document from '../documents/Document.js';
import { recordAudit } from '../audit/audit.js';
import { canAccessSensitiveNarrative } from '../lifecycle/accessControl.js';
import { confirmedForm } from '../additions/n62-redaction/service.js';
import { queriesModel, respondToQuery } from '../closure/s3Adapter.js';
import { fail, actorId, findCase } from '../closure/util.js';
import Institution from '../institutions/Institution.js';
import InstitutionIdentifier from '../institutions/InstitutionIdentifier.js';
import ClosureRecord from '../closure/models.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';

/**
 * Institution admin scoped view (SPEC 12.3, N30) and Institute Nodal Officer
 * actions (Appendix W, N71).
 *
 * Can see: institution profile, cases about their institution in the redacted
 * institution-facing form, requests addressed to them.
 * Cannot see: reporter identity (S22), other bureaus' internal notes.
 * The redacted form is shown only after an officer confirmed it (N62), and
 * never for a confirmed-sensitive case (S25).
 */
const clarificationSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    masterCaseId: { type: String, required: true },
    institutionPid: { type: String, required: true, index: true },
    text: { type: String, required: true },
    documentIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    submittedBy: { type: String, required: true },
    at: { type: Date, required: true },
    synthetic: { type: Boolean, default: true },
  },
  { strict: 'throw' }
);
export const InstitutionClarification =
  mongoose.models.institution_clarifications || mongoose.model('institution_clarifications', clarificationSchema, 'institution_clarifications');

const label = (s) => (s === 'SUBMITTED' ? 'Registered' : s);

export async function linkedInstitution(user) {
  if (user.role !== 'institution_admin') throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const row = await User.findById(actorId(user)).select('institutionPid active').lean();
  if (!row?.active || !row.institutionPid) throw fail(403, 'INSTITUTION_NOT_LINKED');
  return row.institutionPid;
}

async function institutionCase(user, caseRef) {
  const pid = await linkedInstitution(user);
  const caseDoc = await findCase(caseRef);
  if (!caseDoc || caseDoc.institutionPid !== pid) {
    await recordAudit({
      actorId: actorId(user), actorRole: user.role, action: 'institution_view.access_denied', targetType: 'Case', targetId: String(caseRef).slice(0, 64),
      meta: { reason: 'OUT_OF_INSTITUTION_SCOPE' },
    });
    throw fail(404, 'CASE_NOT_FOUND');
  }
  return { pid, caseDoc };
}

/** The redacted institution-facing form: an allow-list, never the raw case. */
async function institutionFacing(user, caseDoc, { withQueries = false } = {}) {
  const sensitiveOk = await canAccessSensitiveNarrative(user, caseDoc);
  const form = sensitiveOk ? await confirmedForm(caseDoc) : null;
  const Query = await queriesModel();
  const queries = Query ? await Query.find({ caseId: caseDoc._id, recipientType: 'institution' }).sort({ queriedAt: 1 }).lean() : null;
  const view = {
    masterCaseId: caseDoc.masterCaseId,
    category: caseDoc.category,
    subCategory: caseDoc.subCategory,
    status: label(caseDoc.status),
    analyticStatus: caseDoc.analyticStatus || 'PENDING',
    createdAt: caseDoc.createdAt,
    accountableOwner: { office: caseDoc.currentOwner?.office || caseDoc.owningBureau || 'Unassigned', role: caseDoc.currentOwner?.role || 'Intake / Triage' },
    institutionFacingForm: !sensitiveOk
      ? { result: 'RESTRICTED', reason: 'SENSITIVE_CASE_RESTRICTED' }
      : form
        ? { redactedText: form.redactedText, releasedAt: form.confirmedAt }
        : { result: 'NOT_RELEASED', reason: 'AWAITING_OFFICER_REDACTION' },
    pendingRequests: queries === null ? { result: 'UNKNOWN', reason: 'QUERIES_NOT_AVAILABLE' } : queries.filter((q) => q.status === 'PENDING').length,
  };
  if (withQueries) {
    view.requests = queries === null
      ? { result: 'UNKNOWN', reason: 'QUERIES_NOT_AVAILABLE' }
      : queries.map((q) => ({ id: String(q._id), from: q.senderBureau, queryText: q.queryText, queriedAt: q.queriedAt, status: q.status, responseText: q.responseText, respondedAt: q.respondedAt }));
    view.clarifications = (await InstitutionClarification.find({ caseId: caseDoc._id }).sort({ at: 1 }).lean())
      .map((c) => ({ text: c.text, documentCount: c.documentIds.length, at: c.at }));
  }
  return view;
}

export async function listInstitutionCases(user) {
  const pid = await linkedInstitution(user);
  const rows = await Case.find({ institutionPid: pid }).sort({ createdAt: -1 });
  return { institutionPid: pid, synthetic: true, cases: await Promise.all(rows.map((c) => institutionFacing(user, c))) };
}

export async function getInstitutionCase(user, caseRef) {
  const { caseDoc } = await institutionCase(user, caseRef);
  return institutionFacing(user, caseDoc, { withQueries: true });
}

/** N71: track institution-wise case status. */
export async function institutionStatusSummary(user) {
  const pid = await linkedInstitution(user);
  const rows = await Case.find({ institutionPid: pid }).select('status analyticStatus createdAt').lean();
  const institution = await Institution.findOne({ pid }).select('pid icid name region state').lean();
  const mapping = institution?.icid ? await InstitutionIdentifier.findOne({ icid: institution.icid, status: 'active' }).select('pid').lean() : null;
  const icidCheck = !institution?.icid ? 'NOT_AVAILABLE' : mapping?.pid === pid ? 'MATCH' : 'IDENTITY_REVIEW';
  const closed = await ClosureRecord.find({ caseId: { $in: rows.map(row => row._id) }, state: 'CLOSED', closedAt: { $ne: null } }).select('caseId closedAt').lean();
  const received = new Map(rows.map(row => [String(row._id), new Date(row.createdAt).getTime()]));
  const days = closed.map(row => (new Date(row.closedAt).getTime() - received.get(String(row.caseId))) / 86400000).filter(value => Number.isFinite(value) && value >= 0);
  const Query = await queriesModel();
  const pendingClarifications = Query ? await Query.countDocuments({ caseId: { $in: rows.map(row => row._id) }, recipientType: 'institution', status: 'PENDING' }) : null;
  const monthRows = new Map();
  const now = new Date();
  for (let offset = 11; offset >= 0; offset--) {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1)).toISOString().slice(0, 7);
    monthRows.set(month, { month, registered: 0 });
  }
  for (const row of rows) {
    const month = new Date(row.createdAt).toISOString().slice(0, 7);
    if (monthRows.has(month)) monthRows.get(month).registered++;
  }
  const byStatus = {};
  const byAnalytic = { PENDING: 0, IN_PROCESS: 0, DISPOSED: 0 };
  for (const r of rows) {
    byStatus[label(r.status)] = (byStatus[label(r.status)] || 0) + 1;
    byAnalytic[r.analyticStatus || 'PENDING']++;
  }
  return { institutionPid: pid, institution, icidCheck, total: rows.length, byStatus, byAnalytic, synthetic: true,
    open: rows.filter(row => !CLOSED_STATUSES.includes(row.status)).length,
    closed: rows.filter(row => CLOSED_STATUSES.includes(row.status)).length,
    pendingClarifications, monthlyTrend: [...monthRows.values()],
    resolution: { averageDays: days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length * 10) / 10 : null, records: days.length, scope: 'Own institution; closed through NEXUS PROOF' } };
}

/** N71: submit clarifications and documents. */
export async function submitClarification(user, caseRef, { text, documentIds = [] } = {}) {
  const { pid, caseDoc } = await institutionCase(user, caseRef);
  if (typeof text !== 'string' || !text.trim() || text.length > 4000) throw fail(400, 'TEXT_REQUIRED');
  if (!Array.isArray(documentIds)) throw fail(400, 'DOCUMENTS_INVALID');
  for (const id of documentIds) {
    const doc = await Document.findById(id).lean().catch(() => null);
    if (!doc || String(doc.caseId) !== String(caseDoc._id) || String(doc.uploadedBy) !== actorId(user) || doc.malwareScanStatus !== 'clean') throw fail(400, 'DOCUMENTS_INVALID');
  }
  const row = await InstitutionClarification.create({ caseId: caseDoc._id, masterCaseId: caseDoc.masterCaseId, institutionPid: pid, text: text.trim(), documentIds, submittedBy: actorId(user), at: new Date() });
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'institution.clarification.submitted', targetType: 'Case', targetId: String(caseDoc._id),
    meta: { masterCaseId: caseDoc.masterCaseId, documentCount: documentIds.length },
  });
  return { id: String(row._id), at: row.at, documentCount: documentIds.length };
}

/** N71 / N70: respond to an AICTE query addressed to this institution (through S3). */
export async function respondAsInstitution(user, queryId, body = {}) {
  const pid = await linkedInstitution(user);
  const Query = await queriesModel();
  if (!Query) throw fail(503, 'QUERIES_NOT_AVAILABLE');
  const query = await Query.findById(queryId).lean().catch(() => null);
  if (!query || query.recipientType !== 'institution') throw fail(404, 'QUERY_NOT_FOUND');
  const caseDoc = await Case.findById(query.caseId).lean();
  if (!caseDoc || caseDoc.institutionPid !== pid) throw fail(404, 'QUERY_NOT_FOUND');
  const answered = await respondToQuery({ _id: actorId(user), id: actorId(user), role: user.role, institutionPid: pid }, queryId, body);
  return { id: String(answered._id), status: answered.status, respondedAt: answered.respondedAt };
}
