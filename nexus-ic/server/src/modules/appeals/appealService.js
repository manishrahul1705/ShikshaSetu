import Document from '../documents/Document.js';
import { getActiveRule } from '../rulebook/index.js';
import { recordAudit } from '../audit/audit.js';
import { ClosureRecord } from '../closure/models.js';
import { ownCase } from '../feedback/feedbackService.js';
import { fail, actorId, setCaseStatus } from '../closure/util.js';
import { Appeal, APPEAL_OUTCOMES } from './models.js';

/**
 * Appeal and review (SPEC 10.3, N25).
 *
 * Closed -> Appeal Filed -> Under Appeal Review (level 1 to n) -> Upheld,
 * Modified or Remanded (reopened). Appeals are new events; the closure record
 * and the case's earlier events are never edited. The reviewer must differ
 * from the original resolver. The window and the number of levels come only
 * from the RuleBook family APPEAL; it is not seeded (SPEC 11), so without an
 * approved rule the answer is POLICY_NOT_CONFIGURED.
 */
export const REVIEWER_ROLES = ['supervisor', 'competent_authority'];
const DAY = 24 * 60 * 60 * 1000;

export async function appealRule(at = new Date()) {
  const rule = await getActiveRule('APPEAL', at);
  const windowDays = Number(rule.body?.windowDays);
  const levels = Number(rule.body?.levels);
  if (rule.result === 'POLICY_NOT_CONFIGURED' || !Number.isInteger(windowDays) || windowDays < 1 || !Number.isInteger(levels) || levels < 1) {
    return { result: 'POLICY_NOT_CONFIGURED' };
  }
  return { result: 'CONFIGURED', version: rule.version, windowDays, levels };
}

function event(appeal, state, user) {
  appeal.state = state;
  appeal.events.push({ state, at: new Date(), actorRole: user.role });
}

export async function fileAppeal(user, caseRef, { grounds = '', evidenceDocumentIds = [] } = {}, now = new Date()) {
  const { caseDoc, reporterId } = await ownCase(user, caseRef);
  if (caseDoc.status !== 'Closed') throw fail(409, 'APPEAL_NOT_OPEN');
  const rule = await appealRule(now);
  if (rule.result !== 'CONFIGURED') throw fail(409, 'POLICY_NOT_CONFIGURED');
  const closure = await ClosureRecord.findOne({ caseId: caseDoc._id, state: 'CLOSED' }).sort({ closedAt: -1 }).lean();
  if (!closure) throw fail(409, 'APPEAL_NOT_OPEN');
  const earlier = await Appeal.find({ caseId: caseDoc._id, closureRecordId: closure._id }).sort({ level: 1 }).lean();
  if (earlier.some((a) => !APPEAL_OUTCOMES.includes(a.state))) throw fail(409, 'APPEAL_ALREADY_OPEN');
  const level = earlier.length + 1;
  if (level > rule.levels) throw fail(409, 'APPEAL_LEVELS_EXHAUSTED');
  const from = earlier.length ? earlier[earlier.length - 1].decidedAt : closure.closedAt;
  if (now.getTime() - new Date(from).getTime() > rule.windowDays * DAY) throw fail(409, 'APPEAL_WINDOW_CLOSED');
  if (typeof grounds !== 'string' || grounds.length > 4000) throw fail(400, 'GROUNDS_INVALID');
  if (!Array.isArray(evidenceDocumentIds)) throw fail(400, 'EVIDENCE_INVALID');
  for (const id of evidenceDocumentIds) {
    const doc = await Document.findById(id).lean().catch(() => null);
    if (!doc || String(doc.caseId) !== String(caseDoc._id) || String(doc.uploadedBy) !== actorId(user) || doc.malwareScanStatus !== 'clean') {
      throw fail(400, 'EVIDENCE_INVALID');
    }
  }

  const appeal = new Appeal({
    caseId: caseDoc._id, masterCaseId: caseDoc.masterCaseId, closureRecordId: closure._id, level, reporterId,
    grounds: grounds.trim(), evidenceRefs: evidenceDocumentIds, filedAt: now, ruleVersion: rule.version,
  });
  event(appeal, 'Appeal Filed', user);
  await appeal.save();
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'appeal.filed', targetType: 'Case', targetId: String(caseDoc._id),
    meta: { masterCaseId: caseDoc.masterCaseId, appealId: String(appeal._id), level, ruleVersion: rule.version, evidenceCount: evidenceDocumentIds.length },
  });
  return appeal;
}

async function loadAppeal(id) {
  const appeal = await Appeal.findById(id).catch(() => null);
  if (!appeal) throw fail(404, 'APPEAL_NOT_FOUND');
  return appeal;
}

async function assertNotResolver(user, appeal) {
  const closure = await ClosureRecord.findById(appeal.closureRecordId).lean();
  const resolvers = [closure?.proposedBy, closure?.approvedBy].filter(Boolean);
  if (resolvers.includes(actorId(user))) {
    await recordAudit({
      actorId: actorId(user), actorRole: user.role, action: 'appeal.reviewer_refused', targetType: 'Appeal', targetId: String(appeal._id),
      meta: { masterCaseId: appeal.masterCaseId, reason: 'REVIEWER_MUST_DIFFER' },
    });
    throw fail(403, 'REVIEWER_MUST_DIFFER');
  }
}

export async function startReview(user, appealId) {
  if (!REVIEWER_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const appeal = await loadAppeal(appealId);
  if (appeal.state !== 'Appeal Filed') throw fail(409, 'APPEAL_NOT_FILED');
  await assertNotResolver(user, appeal);
  appeal.reviewerId = actorId(user);
  appeal.reviewerRole = user.role;
  appeal.reviewStartedAt = new Date();
  event(appeal, 'Under Appeal Review', user);
  await appeal.save();
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'appeal.review_started', targetType: 'Appeal', targetId: String(appeal._id),
    meta: { masterCaseId: appeal.masterCaseId, level: appeal.level },
  });
  return appeal;
}

export async function decideAppeal(user, appealId, { outcome, decisionNote } = {}) {
  if (!REVIEWER_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const appeal = await loadAppeal(appealId);
  if (appeal.state !== 'Under Appeal Review') throw fail(409, 'APPEAL_NOT_UNDER_REVIEW');
  await assertNotResolver(user, appeal);
  if (appeal.reviewerId !== actorId(user)) throw fail(403, 'NOT_ASSIGNED_REVIEWER');
  if (!APPEAL_OUTCOMES.includes(outcome)) throw fail(400, 'OUTCOME_INVALID');
  if (typeof decisionNote !== 'string' || !decisionNote.trim()) throw fail(400, 'DECISION_NOTE_REQUIRED');

  appeal.outcome = outcome;
  appeal.decisionNote = decisionNote.trim();
  appeal.decidedAt = new Date();
  event(appeal, outcome, user);
  await appeal.save();
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'appeal.decided', targetType: 'Appeal', targetId: String(appeal._id),
    meta: { masterCaseId: appeal.masterCaseId, level: appeal.level, outcome },
  });

  const { default: Case } = await import('../cases/Case.js');
  const caseDoc = await Case.findById(appeal.caseId);
  if (outcome === 'Remanded') {
    // Remanded (reopened): the case returns to processing; the closure record stays as it was.
    await setCaseStatus(caseDoc, 'Under Process', user, { reason: 'appeal.remanded' });
  }
  if (user.role === 'competent_authority') {
    const { recordDecision } = await import('../authority/authorityService.js');
    await recordDecision(user, caseDoc, { kind: 'APPEAL_OUTCOME', decision: outcome, refId: String(appeal._id) });
  }
  return appeal;
}

/** Complainant-safe view: no reviewer identity beyond role. */
export function appealView(a) {
  return {
    id: String(a._id), level: a.level, state: a.state, filedAt: a.filedAt, reviewerRole: a.reviewerRole,
    outcome: a.outcome, decisionNote: a.decisionNote, decidedAt: a.decidedAt,
    events: (a.events || []).map((e) => ({ state: e.state, at: e.at })),
  };
}

export async function listAppealsForReview(user, { state } = {}) {
  if (!REVIEWER_ROLES.includes(user.role) && user.role !== 'auditor') throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const filter = state ? { state } : {};
  const rows = await Appeal.find(filter).sort({ filedAt: -1 }).limit(200).lean();
  return rows.map((a) => ({ ...appealView(a), masterCaseId: a.masterCaseId, evidenceCount: a.evidenceRefs.length, grounds: a.grounds, ruleVersion: a.ruleVersion }));
}
