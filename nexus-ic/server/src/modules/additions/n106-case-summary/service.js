import Institution from '../../institutions/Institution.js';
import { CaseAction } from '../../prevent/models.js';
import { findCase, fail, actorId } from '../../closure/util.js';
import { canAccessCase } from '../../../middleware/rbac.js';
import { recordAudit } from '../../audit/audit.js';
import { nextStepView } from '../n86-next-step/service.js';
export async function caseSummary(user, id) {
  const c = await findCase(id);
  if (!c || !(await canAccessCase(user, c))) {
    if (c) await recordAudit({ actorId: actorId(user), actorRole: user.role, action: 'case.access_denied_idor', targetType: 'Case', targetId: c.masterCaseId, meta: { reason: 'IDOR_DENIED', view: 'summary' } });
    throw fail(404, 'CASE_NOT_FOUND');
  }
  const [institution, action, next] = await Promise.all([
    Institution.findOne({ pid: c.institutionPid }).select('name').lean(),
    CaseAction.findOne({ caseId: c._id }).sort({ at: -1 }).select('actionType at').lean(),
    nextStepView(c),
  ]);
  const history = [...(c.statusHistory || [])].sort((a, b) => new Date(b.at) - new Date(a.at))[0];
  const last = action && (!history || new Date(action.at) >= new Date(history.at)) ? { text: action.actionType, at: action.at } : history ? { text: history.action || history.status, at: history.at } : { text: 'Not available', at: null };
  const segment = c.slaClock?.filter(s => !s.endedAt && !['COMPLETED'].includes(s.status)).at(-1);
  await recordAudit({ actorId: actorId(user), actorRole: user.role, action: 'case.summary.viewed', targetType: 'Case', targetId: c.masterCaseId, meta: {} });
  return { masterCaseId: c.masterCaseId, institutionName: institution?.name || c.pidSnapshot?.name || 'Not available', institutionPid: c.institutionPid,
    receivedAt: c.createdAt, category: c.category, subCategory: c.subCategory, status: c.status,
    bureau: c.currentOwner?.office || c.owningBureau || 'Unassigned', officer: c.currentOwner?.officerName || 'Not assigned',
    lastAction: last, nextStepKey: next.nextStepKey, expectedDisposalDate: segment?.targetResolutionDate || null,
    disposalUnavailableReason: segment?.targetResolutionDate ? null : 'Not available: POLICY_NOT_CONFIGURED' };
}
