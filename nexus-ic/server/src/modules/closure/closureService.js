import Document from '../documents/Document.js';
import { CaseAction } from '../prevent/models.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { recordAudit } from '../audit/audit.js';
import { getActiveRule } from '../rulebook/index.js';
import { ClosureRecord } from './models.js';
import { transferState, taskState } from './s3Adapter.js';
import { fail, actorId, sha256, findCase, setCaseStatus, OFFICER_ROLES, CLOSED_STATUSES } from './util.js';

/**
 * NEXUS PROOF: evidence-based closure (SPEC 10.1, N22, N76).
 *
 * propose -> (attach evidence) -> approve (approver differs from proposer)
 * -> close (human action, refused until the gate passes).
 * The system never closes a case on its own: nothing here runs on a timer.
 */

export const APPROVER_ROLES = ['supervisor', 'competent_authority'];
const ACTIVE = ['PROPOSED', 'APPROVED'];

async function loadCaseFor(user, caseRef) {
  const caseDoc = await findCase(caseRef);
  if (!caseDoc || !(await canAccessCase(user, caseDoc))) throw fail(404, 'CASE_NOT_FOUND');
  return caseDoc;
}

async function activeRecord(caseDoc) {
  return ClosureRecord.findOne({ caseId: caseDoc._id, state: { $in: ACTIVE } }).sort({ createdAt: -1 });
}

function packetHashOf(caseDoc, record) {
  return sha256({
    masterCaseId: caseDoc.masterCaseId,
    closureReason: record.closureReason,
    actionRecordIds: record.actionRecordIds.map(String),
    evidence: record.evidenceRefs.map((e) => [String(e.documentId), e.originalHash, e.scrubbedHash]),
    proposedBy: record.proposedBy,
  });
}

async function evidenceFor(caseDoc, documentIds = []) {
  if (!Array.isArray(documentIds)) throw fail(400, 'EVIDENCE_INVALID');
  const refs = [];
  for (const id of documentIds) {
    const doc = await Document.findById(id).lean().catch(() => null);
    if (!doc || String(doc.caseId) !== String(caseDoc._id) || doc.malwareScanStatus !== 'clean') {
      throw fail(400, 'EVIDENCE_INVALID');
    }
    refs.push({ documentId: doc._id, originalHash: doc.originalHash, scrubbedHash: doc.scrubbedHash });
  }
  return refs;
}

/**
 * The closure gate: every task complete, every transfer acknowledged,
 * evidence attached, approval exists. Each check is PASS, FAIL or UNKNOWN;
 * only four PASS results let a human close the case.
 */
export async function evaluateGate(caseDoc, record) {
  const [tasks, transfers, rule] = await Promise.all([taskState(caseDoc), transferState(caseDoc), getActiveRule('CLOSURE_REQUIREMENTS')]);
  let evidenceAttached = 'FAIL';
  if (record?.evidenceRefs?.length) {
    const present = await Document.countDocuments({ _id: { $in: record.evidenceRefs.map((e) => e.documentId) }, caseId: caseDoc._id });
    evidenceAttached = present === record.evidenceRefs.length ? 'PASS' : 'FAIL';
  }
  const approvalExists = record?.state === 'APPROVED' && record.approvedBy && record.approvedBy !== record.proposedBy ? 'PASS' : 'FAIL';
  const gate = {
    tasksComplete: tasks.result === 'UNKNOWN' ? 'UNKNOWN' : tasks.result === 'ALL_COMPLETE' ? 'PASS' : 'FAIL',
    transfersAcknowledged: transfers.result === 'UNKNOWN' ? 'UNKNOWN' : transfers.result === 'ALL_ACKNOWLEDGED' ? 'PASS' : 'FAIL',
    evidenceAttached,
    approvalExists,
    ruleVersion: rule.result === 'POLICY_NOT_CONFIGURED' ? 'POLICY_NOT_CONFIGURED' : rule.version,
    checkedAt: new Date(),
  };
  gate.passed = [gate.tasksComplete, gate.transfersAcknowledged, gate.evidenceAttached, gate.approvalExists].every((v) => v === 'PASS');
  return gate;
}

export async function proposeClosure(user, caseRef, { closureReason, evidenceDocumentIds = [] } = {}) {
  if (!OFFICER_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const caseDoc = await loadCaseFor(user, caseRef);
  if (CLOSED_STATUSES.includes(caseDoc.status)) throw fail(409, 'CASE_ALREADY_CLOSED');
  if (await activeRecord(caseDoc)) throw fail(409, 'CLOSURE_ALREADY_PROPOSED');
  // N76: a closure reason is required at PROOF.
  if (typeof closureReason !== 'string' || !closureReason.trim()) throw fail(400, 'CLOSURE_REASON_REQUIRED');
  // Mandatory action records: the actions performed on this case.
  const actions = await CaseAction.find({ caseId: caseDoc._id }).select('_id').lean();
  if (actions.length === 0) throw fail(400, 'ACTION_RECORDS_REQUIRED');
  const evidenceRefs = await evidenceFor(caseDoc, evidenceDocumentIds);

  const record = new ClosureRecord({
    caseId: caseDoc._id,
    masterCaseId: caseDoc.masterCaseId,
    closureReason: closureReason.trim(),
    actionRecordIds: actions.map((a) => a._id),
    evidenceRefs,
    proposedBy: actorId(user),
    proposedByRole: user.role,
    proposedAt: new Date(),
    packetHash: 'pending',
  });
  record.packetHash = packetHashOf(caseDoc, record);
  await record.save();
  await setCaseStatus(caseDoc, 'Resolution Proposed', user, { reason: 'closure.proposed' });
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'closure.proposed', targetType: 'Case', targetId: String(caseDoc._id),
    meta: { masterCaseId: caseDoc.masterCaseId, closureRecordId: String(record._id), actionCount: actions.length, evidenceCount: evidenceRefs.length, packetHash: record.packetHash },
  });
  return record;
}

export async function attachEvidence(user, caseRef, { documentIds = [] } = {}) {
  if (!OFFICER_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const caseDoc = await loadCaseFor(user, caseRef);
  const record = await activeRecord(caseDoc);
  if (!record) throw fail(409, 'NO_CLOSURE_PROPOSAL');
  // Evidence is frozen once approved: a change would invalidate the approval.
  if (record.state !== 'PROPOSED') throw fail(409, 'EVIDENCE_FROZEN_AFTER_APPROVAL');
  const refs = await evidenceFor(caseDoc, documentIds);
  const known = new Set(record.evidenceRefs.map((e) => String(e.documentId)));
  for (const ref of refs) if (!known.has(String(ref.documentId))) record.evidenceRefs.push(ref);
  record.packetHash = packetHashOf(caseDoc, record);
  await record.save();
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'closure.evidence.attached', targetType: 'Case', targetId: String(caseDoc._id),
    meta: { masterCaseId: caseDoc.masterCaseId, evidenceCount: record.evidenceRefs.length, packetHash: record.packetHash },
  });
  return record;
}

export async function approveClosure(user, caseRef) {
  if (!APPROVER_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const caseDoc = await loadCaseFor(user, caseRef);
  const record = await activeRecord(caseDoc);
  if (!record || record.state !== 'PROPOSED') throw fail(409, 'NO_CLOSURE_PROPOSAL');
  // S20 / U25: the approver must differ from the proposer.
  if (actorId(user) === record.proposedBy) {
    await recordAudit({
      actorId: actorId(user), actorRole: user.role, action: 'closure.approval_refused', targetType: 'Case', targetId: String(caseDoc._id),
      meta: { masterCaseId: caseDoc.masterCaseId, reason: 'APPROVER_MUST_DIFFER' },
    });
    throw fail(403, 'APPROVER_MUST_DIFFER');
  }
  record.state = 'APPROVED';
  record.approvedBy = actorId(user);
  record.approvedByRole = user.role;
  record.approvedAt = new Date();
  await record.save();
  await setCaseStatus(caseDoc, 'Verified/Approved', user, { reason: 'closure.approved' });
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'closure.approved', targetType: 'Case', targetId: String(caseDoc._id),
    meta: { masterCaseId: caseDoc.masterCaseId, closureRecordId: String(record._id), packetHash: record.packetHash },
  });
  if (user.role === 'competent_authority') {
    const { recordDecision } = await import('../authority/authorityService.js');
    await recordDecision(user, caseDoc, { kind: 'APPROVE_CLOSURE', decision: 'APPROVED', refId: String(record._id) });
  }
  return record;
}

export async function closeCase(user, caseRef) {
  if (!OFFICER_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const caseDoc = await loadCaseFor(user, caseRef);
  if (CLOSED_STATUSES.includes(caseDoc.status)) throw fail(409, 'CASE_ALREADY_CLOSED');
  const record = await activeRecord(caseDoc);
  const gate = await evaluateGate(caseDoc, record);
  if (record) {
    record.gateResults.push(gate);
    await record.save();
  }
  if (!gate.passed) {
    await recordAudit({
      actorId: actorId(user), actorRole: user.role, action: 'closure.blocked', targetType: 'Case', targetId: String(caseDoc._id),
      meta: { masterCaseId: caseDoc.masterCaseId, gate: { ...gate, checkedAt: gate.checkedAt.toISOString() } },
    });
    const err = fail(409, 'CLOSURE_GATE_BLOCKED');
    err.details = gate;
    throw err;
  }
  caseDoc.closureRecordId = record._id;
  // N76: "Mark case as disposed (as per workflow)": Closed maps to DISPOSED (F09).
  await setCaseStatus(caseDoc, 'Closed', user, { reason: 'closure.closed', gate: true });
  record.state = 'CLOSED';
  record.closedBy = actorId(user);
  record.closedAt = new Date();
  await record.save();
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'closure.closed', targetType: 'Case', targetId: String(caseDoc._id),
    meta: { masterCaseId: caseDoc.masterCaseId, closureRecordId: String(record._id), packetHash: record.packetHash, analyticStatus: caseDoc.analyticStatus },
  });
  return { record, case: { masterCaseId: caseDoc.masterCaseId, status: caseDoc.status, analyticStatus: caseDoc.analyticStatus }, gate };
}

/** Officer / reviewer view: the record, the live gate, and the complainant's feedback (N23). */
export async function getClosureView(user, caseRef) {
  if (!OFFICER_ROLES.includes(user.role) && user.role !== 'auditor') throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const caseDoc = await loadCaseFor(user, caseRef);
  const records = await ClosureRecord.find({ caseId: caseDoc._id }).sort({ createdAt: 1 }).lean();
  const current = records.filter((r) => ACTIVE.includes(r.state)).pop() || null;
  const gate = await evaluateGate(caseDoc, current);
  const { FeedbackRecord } = await import('../feedback/models.js');
  const feedback = await FeedbackRecord.find({ caseId: caseDoc._id }).sort({ at: 1 }).select('rating text at -_id').lean();
  return {
    masterCaseId: caseDoc.masterCaseId,
    status: caseDoc.status,
    analyticStatus: caseDoc.analyticStatus,
    records,
    gate,
    feedback,
  };
}
