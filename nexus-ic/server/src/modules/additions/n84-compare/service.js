import Case from '../../cases/Case.js';
import { CaseAction, PreventAlert } from '../../prevent/models.js';
import { Transfer } from '../../trace/models.js';
import { canAccessCase } from '../../../middleware/rbac.js';
import { recordAudit } from '../../audit/audit.js';
import { fail, actorId } from '../../closure/util.js';
import Query from '../../queries/models.js';
import { CombinedRequest } from '../n82-combined-request/service.js';

export const COMPARE_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor', 'system_admin'];

export function comparisonScenarios(recorded) {
  return {
    illustrative: { lettersToCollege: 3, acknowledgedTransfers: 0, repeatedDocumentRequestsFlagged: 0 },
    recorded: recorded || { lettersToCollege: 0, acknowledgedTransfers: 0, repeatedDocumentRequestsFlagged: 0 },
  };
}

export async function compareRun(user, pid) {
  if (process.env.APP_MODE === 'production') throw fail(404, 'NOT_FOUND');
  if (!COMPARE_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  if (!/^1-\d{10}$/.test(pid || '')) throw fail(400, 'PID_INVALID');
  const institutionCases = await Case.find({ institutionPid: pid }).lean();
  const visibleCases = [];
  for (const row of institutionCases) if (await canAccessCase(user, row)) visibleCases.push(row);
  const ids = visibleCases.map((row) => row._id);
  const masterCaseIds = visibleCases.map((row) => row.masterCaseId);
  const [actions, acceptedTransfers, alerts] = await Promise.all([
    CaseAction.find({ institutionPid: pid, caseId: { $in: ids } }).lean(),
    Transfer.countDocuments({ caseId: { $in: ids }, status: 'ACCEPTED', acknowledgedAt: { $ne: null } }),
    PreventAlert.find({ caseId: { $in: ids }, result: 'REVIEW', reasons: 'REPEATED_DOCUMENT_REQUEST' }).select('checkId').lean(),
  ]);
  const combined = await CombinedRequest.find({ institutionPid: pid, status: 'ISSUED', 'items.caseId': { $in: ids } }).lean();
  const combinedIds = combined.flatMap(r => r.items.filter(i => i.decision === 'CONFIRMED').map(i => i.queryId));
  const separate = await Query.countDocuments({ caseId: { $in: ids }, recipientType: 'institution', _id: { $nin: combinedIds } });
  const letters = separate + combined.length;
  const repeatedChecks = new Set(alerts.map((alert) => String(alert.checkId))).size;
  await recordAudit({ actorId: actorId(user), actorRole: user.role, action: 'problem_comparison.viewed', targetType: 'Institution', targetId: pid,
    meta: { visibleCaseCount: visibleCases.length, actionCount: actions.length, acceptedTransfers } });
  const recorded = { lettersToCollege: letters, acknowledgedTransfers: acceptedTransfers, repeatedDocumentRequestsFlagged: repeatedChecks };
  return {
    institutionPid: pid,
    scope: { institutionPid: pid, accessibleCases: visibleCases.length },
    recorded,
    comparison: comparisonScenarios(recorded),
    source: 'Issued combined covers, separate N70 queries, PREVENT alerts and accepted TRACE transfers',
    caseReferences: masterCaseIds,
  };
}
