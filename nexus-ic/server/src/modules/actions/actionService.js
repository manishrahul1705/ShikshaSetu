import { CaseAction, ACTION_TYPES } from '../prevent/models.js';
import { checkAction } from '../prevent/stage2.js';
import Case from '../cases/Case.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { recordAudit } from '../audit/audit.js';
import caseActionPlugin from './plugins/caseAction.plugin.js';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { validateProceedReason } from '../additions/n81-live-conflict-warning/service.js';

// Ensure schema plugin is active on CaseAction
caseActionPlugin(CaseAction.schema);
for (const key of ['actionSubtype', 'remark', 'evidenceRefs']) {
  if (!(key in CaseAction.prototype)) {
    Object.defineProperty(CaseAction.prototype, key, {
      get() { return this.get(key); },
      set(v) { return this.set(key, v); },
      configurable: true,
      enumerable: true,
    });
  }
}

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Record a role-specific officer action (N72, SPEC 9.4)
 *
 * Runs S4's "Check before acting" first and persists into case_actions.
 */
export async function recordOfficerAction(user, {
  caseId,
  actionType = 'OTHER',
  actionSubtype = 'OTHER',
  subject,
  remark = '',
  evidenceRefs = [],
  direction = 'ALLOW',
  proceedReason,
}) {
  const caseDoc = await Case.findOne(mongoose.isValidObjectId(caseId) ? {_id:caseId} : {masterCaseId:caseId});
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const allowed = await canAccessCase(user, caseDoc);
  if (!allowed) {
    const err = new Error('Access denied to case');
    err.status = 403;
    throw err;
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    const err = new Error('subject is required');
    err.status = 400;
    throw err;
  }

  // 1. S4 "Check before acting" checkAction call
  let preCheck = null;
  const userObj = user.toObject ? { ...user.toObject(), id: String(user._id || user.id), role: user.role, bureau: user.bureau } : user;
  try {
    preCheck = await checkAction(userObj, {
      caseId: String(caseDoc._id),
      actionType,
      details: {
        subject: subject.trim(),
        direction,
      },
    });
  } catch (err) {
    // If S4 check returns an error or unconfigured, log and continue advisory
    preCheck = { result: 'UNKNOWN', error: err.message, advisory: true, canProceed: true };
  }

  if (preCheck.result === 'REVIEW') {
    const reason = validateProceedReason(proceedReason);
    await recordAudit({ actorId: String(user._id || user.id), actorRole: user.role, action: 'action.overlap_override', targetType: 'Case', targetId: String(caseDoc._id), meta: { reason, checkId: preCheck.checkId } });
  }
  // Generate safe subjectKey hash
  const normSubject = subject.trim().toLowerCase();
  const subjectKey = actionType === 'INSTRUCTION'
    ? `${direction}:${hash(normSubject)}`
    : hash(normSubject);

  const now = new Date();
  const actionDoc = await CaseAction.create({
    caseId: caseDoc._id,
    institutionPid: caseDoc.institutionPid,
    bureau: user.bureau || user.role,
    actorId: String(user._id || user.id),
    actorRole: user.role,
    actionType,
    subjectKey,
    at: now,
    actionSubtype,
    remark: remark ? remark.trim() : null,
    evidenceRefs,
  });

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.action.recorded',
    targetType: 'CaseAction',
    targetId: String(actionDoc._id),
    meta: {
      caseId: String(caseDoc._id),
      masterCaseId: caseDoc.masterCaseId,
      actionType,
      actionSubtype,
      preCheckResult: preCheck?.result || 'UNKNOWN',
    },
  });

  // N93: Update case with recorded action milestone & advance active investigation stage
  const stageMap = {
    NOTICE: 'NOTICE_ISSUED',
    INSTRUCTION: 'INSTRUCTION_ISSUED',
    INSPECTION: 'INSPECTION_SCHEDULED',
    DOCUMENT_REQUEST: 'DOCUMENT_REQUESTED',
    OTHER: 'ACTION_RECORDED',
  };
  const newStatus = stageMap[actionType] || 'INVESTIGATION';

  if (!Array.isArray(caseDoc.statusHistory)) {
    caseDoc.statusHistory = [];
  }
  caseDoc.statusHistory.push({
    status: newStatus,
    at: now,
    by: user.displayName || user.username || user.role,
    office: user.bureau || (user.region ? `Regional Office (${user.region})` : 'Assigned Cell'),
    role: user.role,
    action: actionType,
    subject: subject.trim(),
  });
  if (['ROUTED', 'REGISTERED', 'SUBMITTED'].includes(caseDoc.status)) {
    caseDoc.status = 'UNDER_INVESTIGATION';
  }
  await caseDoc.save();

  return {
    action: actionDoc,
    preCheck,
    canProceed: true,
  };
}

/**
 * Get actions recorded for a case (SPEC 9.4, N72)
 */
export async function getCaseActions(user, caseId) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const allowed = await canAccessCase(user, caseDoc);
  if (!allowed) {
    const err = new Error('Access denied to case');
    err.status = 403;
    throw err;
  }

  return CaseAction.find({ caseId: caseDoc._id }).sort({ at: 1 }).lean();
}
