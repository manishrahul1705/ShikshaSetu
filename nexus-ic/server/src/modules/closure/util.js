import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Case from '../cases/Case.js';
import { recordAudit } from '../audit/audit.js';
import { validateStatusTransition, mapAnalyticStatus } from '../lifecycle/lifecycleGuards.js';

/**
 * Small helpers shared by the S5 modules (closure, feedback, appeals, rescue,
 * impact, track, institutionview, authority, notices).
 */

export const COMPLAINANT_ROLES = ['student', 'faculty', 'other_stakeholder'];
export const OFFICER_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];
export { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';

export function fail(status, code, message = code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

export function actorId(user) {
  return String(user?._id || user?.id || user?.username || 'unknown');
}

export function sha256(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value), 'utf8').digest('hex');
}

/** Find a case by Mongo _id or Master Case ID. */
export async function findCase(idOrMaster) {
  const id = String(idOrMaster || '');
  if (mongoose.isValidObjectId(id) && /^[0-9a-fA-F]{24}$/.test(id)) {
    const byId = await Case.findById(id);
    if (byId) return byId;
  }
  return Case.findOne({ masterCaseId: id });
}

/**
 * Status change used by S5 (PROOF, appeals). Writes the same
 * 'case.status.transitioned' audit action as S2's transitionStatus, so the
 * complainant's status history stays uniform. `gate` marks a closure that
 * passed the PROOF gate (see plugins/case.plugin.js).
 */
export async function setCaseStatus(caseDoc, nextStatus, user, { reason = null, gate = false } = {}) {
  validateStatusTransition(caseDoc, nextStatus);
  const prevStatus = caseDoc.status;
  caseDoc.status = nextStatus;
  caseDoc.analyticStatus = mapAnalyticStatus(nextStatus);
  if (gate) caseDoc.$locals.s5ClosureGate = true;
  await caseDoc.save();
  delete caseDoc.$locals.s5ClosureGate;
  await recordAudit({
    actorId: actorId(user),
    actorRole: user.role,
    action: 'case.status.transitioned',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: { prevStatus, nextStatus, analyticStatus: caseDoc.analyticStatus, reason },
  });
  return caseDoc;
}

export function send(res, err) {
  res.status(err.status || 500).json({ error: err.code || err.message, ...(err.details ? { details: err.details } : {}) });
}
