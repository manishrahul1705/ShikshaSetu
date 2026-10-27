import mongoose from 'mongoose';
import Case from '../cases/Case.js';
import User from '../auth/User.js';
import Institution from '../institutions/Institution.js';
import AuditEvent from '../audit/AuditEvent.js';
import { recordAudit } from '../audit/audit.js';
import { CaseAction } from '../prevent/models.js';
import { ClosureRecord } from '../closure/models.js';
import { FeedbackRecord } from '../feedback/models.js';
import { Appeal } from '../appeals/models.js';
import { RescueAlert } from '../rescue/models.js';
import { buildImpactReport } from '../impact/impactService.js';
import { fail, actorId, findCase, CLOSED_STATUSES } from '../closure/util.js';

/**
 * Competent Authority workspace (SPEC 12.2, route /authority) and members and
 * decisions (Appendix W, N80).
 *
 * S19: the Competent Authority cannot bypass field ABAC. Every case this
 * workspace returns goes through authorityCaseView, an allow-list with no
 * narrative, no reporter or vault identity, no internal notes and no
 * documents. Authority decisions never close a case; closure only goes
 * through the NEXUS PROOF gate.
 */
export const DECISION_KINDS = ['REVIEW_ESCALATED_CASE', 'FINAL_DECISION', 'APPROVE_CLOSURE', 'APPEAL_OUTCOME', 'APPROVE_REGULATORY_ACTION'];
const DIRECT_KINDS = ['REVIEW_ESCALATED_CASE', 'FINAL_DECISION', 'APPROVE_REGULATORY_ACTION'];

const decisionSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    masterCaseId: { type: String, required: true },
    kind: { type: String, enum: DECISION_KINDS, required: true },
    decision: { type: String, required: true },
    reason: { type: String, default: null },
    refId: { type: String, default: null },
    decidedBy: { type: String, required: true },
    designation: { type: String, default: null },
    at: { type: Date, required: true },
    synthetic: { type: Boolean, default: true },
  },
  { strict: 'throw' }
);
export const AuthorityDecision =
  mongoose.models.authority_decisions || mongoose.model('authority_decisions', decisionSchema, 'authority_decisions');

const AUTHORITY_CASE_FIELDS = [
  'masterCaseId', 'institutionPid', 'category', 'subCategory', 'status', 'analyticStatus', 'priority', 'channel',
  'owningBureau', 'transferStatus', 'isEscalated', 'createdAt', 'updatedAt',
];

/** S19 field policy for the Competent Authority: allow-list only. */
export function authorityCaseView(caseDoc) {
  const raw = caseDoc?.toObject ? caseDoc.toObject() : caseDoc;
  const view = {};
  for (const f of AUTHORITY_CASE_FIELDS) if (raw[f] !== undefined) view[f] = raw[f];
  view.accountableOwner = { office: raw.currentOwner?.office || raw.owningBureau || 'Unassigned', role: raw.currentOwner?.role || 'Intake / Triage' };
  return view;
}

async function designationOf(user) {
  const row = await User.findById(actorId(user)).select('authorityDesignation').lean().catch(() => null);
  return row?.authorityDesignation || null;
}

export async function recordDecision(user, caseDoc, { kind, decision, reason = null, refId = null }) {
  const row = await AuthorityDecision.create({
    caseId: caseDoc._id, masterCaseId: caseDoc.masterCaseId, kind, decision, reason, refId,
    decidedBy: actorId(user), designation: await designationOf(user), at: new Date(),
  });
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'authority.decision.recorded', targetType: 'Case', targetId: String(caseDoc._id),
    meta: { masterCaseId: caseDoc.masterCaseId, kind, decision, refId, designation: row.designation },
  });
  return row;
}

/** Direct decisions from the /authority workspace. Closure and appeal outcomes go through PROOF and appeals. */
export async function decide(user, caseRef, { kind, decision, reason, refId } = {}) {
  if (user.role !== 'competent_authority') throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  if (!DIRECT_KINDS.includes(kind)) throw fail(400, 'DECISION_KIND_INVALID');
  if (typeof decision !== 'string' || !decision.trim()) throw fail(400, 'DECISION_REQUIRED');
  if (typeof reason !== 'string' || !reason.trim()) throw fail(400, 'REASON_REQUIRED');
  const caseDoc = await findCase(caseRef);
  if (!caseDoc) throw fail(404, 'CASE_NOT_FOUND');
  if (kind === 'APPROVE_REGULATORY_ACTION') {
    if (!['APPROVED', 'NOT_APPROVED'].includes(decision)) throw fail(400, 'DECISION_INVALID');
    const action = await CaseAction.findById(refId).lean().catch(() => null);
    if (!action || String(action.caseId) !== String(caseDoc._id)) throw fail(404, 'ACTION_NOT_FOUND');
    // S20: the approver differs from the officer who recommended the action.
    if (action.actorId === actorId(user)) throw fail(403, 'APPROVER_MUST_DIFFER');
  }
  if (kind === 'REVIEW_ESCALATED_CASE' && !caseDoc.isEscalated && !(await RescueAlert.exists({ caseId: caseDoc._id }))) {
    throw fail(409, 'CASE_NOT_ESCALATED');
  }
  const row = await recordDecision(user, caseDoc, { kind, decision: decision.trim(), reason: reason.trim(), refId: refId || null });
  return { id: String(row._id), kind: row.kind, decision: row.decision, designation: row.designation, at: row.at, caseStatus: caseDoc.status };
}

export async function overview(user, now = new Date()) {
  if (user.role !== 'competent_authority') throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const [cases, institutions, impact] = await Promise.all([Case.find({}).sort({ createdAt: -1 }).lean(), Institution.find({}).select('pid name region').lean(), buildImpactReport(user, now)]);
  const open = cases.filter((c) => !CLOSED_STATUSES.includes(c.status));
  const perInstitution = new Map(institutions.map((i) => [i.pid, { pid: i.pid, name: i.name, region: i.region, total: 0, open: 0 }]));
  for (const c of cases) {
    const row = perInstitution.get(c.institutionPid) || { pid: c.institutionPid, name: 'not available', region: 'UNKNOWN', total: 0, open: 0 };
    row.total++;
    if (!CLOSED_STATUSES.includes(c.status)) row.open++;
    perInstitution.set(c.institutionPid, row);
  }
  const ratings = await FeedbackRecord.find({}).select('rating').lean();
  const recentAudit = await AuditEvent.find({}).sort({ seq: -1 }).limit(50).select('seq at action actorRole targetType -_id').lean();
  return {
    synthetic: true,
    designation: await designationOf(user),
    institutions: [...perInstitution.values()],
    cases: cases.map(authorityCaseView),
    pending: open.filter((c) => (c.analyticStatus || 'PENDING') === 'PENDING').length,
    overdue: impact.tiles.overdueCases,
    transferred: cases.filter((c) => (c.transferStatus && c.transferStatus !== 'NONE') || c.transferHistory?.length).length,
    regionWise: impact.regionWise,
    bureauWise: impact.tiles.bureauWiseWorkload.rows,
    approvals: {
      closuresAwaitingApproval: (await ClosureRecord.find({ state: 'PROPOSED' }).select('masterCaseId proposedAt proposedByRole -_id').lean()),
      appealsAwaitingReview: await Appeal.countDocuments({ state: { $in: ['Appeal Filed', 'Under Appeal Review'] } }),
    },
    escalations: {
      openRescueAlerts: await RescueAlert.find({ state: 'OPEN' }).select('masterCaseId trigger reasonForDelay suggestedNextAction detectedAt').lean(),
      escalatedCases: cases.filter((c) => c.isEscalated).map((c) => c.masterCaseId),
    },
    notifications: await authorityNotifications(user),
    auditAndEvidence: {
      recentAudit,
      closurePackets: await ClosureRecord.find({ state: 'CLOSED' }).sort({ closedAt: -1 }).limit(50).select('masterCaseId packetHash closedAt -_id').lean(),
    },
    impact: { label: impact.label, tiles: impact.tiles, resolutionTime: impact.resolutionTime },
    feedback: { count: ratings.length, averageRating: ratings.length ? Math.round((ratings.reduce((a, r) => a + r.rating, 0) / ratings.length) * 10) / 10 : null },
    decisions: await AuthorityDecision.find({}).sort({ at: -1 }).limit(50).select('-_id -__v').lean(),
  };
}

async function authorityNotifications(user) {
  try {
    const { listRetaliationAlerts } = await import('../additions/n51-retaliation-watch/service.js');
    return { retaliationWatch: await listRetaliationAlerts(user) };
  } catch {
    return { retaliationWatch: { result: 'UNKNOWN', reason: 'RETALIATION_WATCH_NOT_AVAILABLE' } };
  }
}

export async function authorityCase(user, caseRef) {
  if (user.role !== 'competent_authority') throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const caseDoc = await findCase(caseRef);
  if (!caseDoc) throw fail(404, 'CASE_NOT_FOUND');
  return {
    ...authorityCaseView(caseDoc),
    decisions: await AuthorityDecision.find({ caseId: caseDoc._id }).sort({ at: 1 }).select('-_id -__v -caseId').lean(),
    closure: await ClosureRecord.find({ caseId: caseDoc._id }).select('state proposedAt approvedAt closedAt packetHash closureReason -_id').lean(),
    appeals: await Appeal.find({ caseId: caseDoc._id }).select('level state outcome filedAt decidedAt -_id').lean(),
  };
}
