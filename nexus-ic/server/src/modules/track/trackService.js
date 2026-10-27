import Case from '../cases/Case.js';
import AuditEvent from '../audit/AuditEvent.js';
import { recordAudit } from '../audit/audit.js';
import { getReporterId } from '../identity/index.js';
import { formatComplainantView } from '../lifecycle/lifecycleService.js';
import { ClosureRecord } from '../closure/models.js';
import { ownFeedback, FEEDBACK_STATUSES } from '../feedback/feedbackService.js';
import { Appeal } from '../appeals/models.js';
import { appealRule, appealView } from '../appeals/appealService.js';
import { fail, actorId, findCase, COMPLAINANT_ROLES } from '../closure/util.js';
import { nextStepView, nextStepList } from '../additions/n86-next-step/service.js';

/**
 * Complainant workspace (SPEC 12.1, 12.3, N29) behind GET /api/v1/track/:caseId.
 *
 * Own cases only (S21): any other case, by Master Case ID or _id, is a 404
 * with an audited denial. Shows what SPEC 9.1 lets the complainant see: the
 * exact status, the accountable owner as office and role, the status history,
 * the SLA summary, closure reason, own feedback and own appeals. Internal
 * notes, other bureaus' narratives, officer identities and reporter identity
 * stay hidden (S24).
 */
const label = (s) => (s === 'SUBMITTED' ? 'Registered' : s);

export async function statusHistory(caseDoc) {
  const events = await AuditEvent.find({ targetType: 'Case', targetId: String(caseDoc._id), action: 'case.status.transitioned' })
    .sort({ seq: 1 })
    .select('at meta.nextStatus')
    .lean();
  return [
    { status: 'Registered', at: caseDoc.createdAt },
    ...events.filter((e) => e.meta?.nextStatus).map((e) => ({ status: label(e.meta.nextStatus), at: e.at })),
  ];
}

async function deny(user, ref) {
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'track.access_denied_idor', targetType: 'Case', targetId: String(ref).slice(0, 64),
    meta: { reason: 'IDOR_DENIED' },
  });
  return fail(404, 'CASE_NOT_FOUND');
}

export async function trackCase(user, caseRef) {
  if (!COMPLAINANT_ROLES.includes(user.role)) throw await deny(user, caseRef);
  const reporterId = await getReporterId(actorId(user));
  const caseDoc = await findCase(caseRef);
  if (!caseDoc || !reporterId || caseDoc.reporterId !== reporterId) throw await deny(user, caseRef);

  const closure = await ClosureRecord.findOne({ caseId: caseDoc._id }).sort({ createdAt: -1 }).lean();
  const appeals = await Appeal.find({ caseId: caseDoc._id }).sort({ filedAt: 1 }).lean();
  const rule = await appealRule();
  const openAppeal = appeals.some((a) => ['Appeal Filed', 'Under Appeal Review'].includes(a.state));
  return {
    ...formatComplainantView(caseDoc),
    ...await nextStepView(caseDoc),
    statusHistory: await statusHistory(caseDoc),
    closure: closure
      ? { state: closure.state, closureReason: closure.state === 'CLOSED' || closure.state === 'APPROVED' ? closure.closureReason : null, closedAt: closure.closedAt }
      : null,
    feedback: await ownFeedback(caseDoc, reporterId),
    feedbackOpen: FEEDBACK_STATUSES.includes(caseDoc.status),
    appeals: appeals.map(appealView),
    appealRule: rule.result === 'CONFIGURED' ? { windowDays: rule.windowDays, levels: rule.levels, version: rule.version } : { result: 'POLICY_NOT_CONFIGURED' },
    appealOpen: caseDoc.status === 'Closed' && rule.result === 'CONFIGURED' && !openAppeal,
    documentIds: caseDoc.documentIds || [],
    synthetic: true,
  };
}

export async function listOwnCases(user) {
  if (!COMPLAINANT_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const reporterId = await getReporterId(actorId(user));
  if (!reporterId) return [];
  const rows = await Case.find({ reporterId }).sort({ createdAt: -1 }).lean();
  return nextStepList(rows);
}
