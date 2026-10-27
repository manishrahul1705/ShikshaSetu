import User from '../../auth/User.js';
import Case from '../../cases/Case.js';
import { getActiveRule } from '../../rulebook/index.js';
import { requestTransfer } from '../../trace/traceService.js';
import { CLOSED_STATUSES } from '../../lifecycle/lifecycleGuards.js';
import { actor, office, fail, event } from '../n82-combined-request/service.js';
export async function workload(user, now = new Date()) {
  if (!['supervisor', 'bureau_officer'].includes(user.role) || !user.bureau) throw fail(403, 'BUREAU_SCOPE_REQUIRED');
  const people = (await User.find({ active: true, role: 'bureau_officer' }).lean()).filter(u => office(u.bureau) === office(user.bureau));
  const cases = (await Case.find({ status: { $nin: CLOSED_STATUSES } }).select('masterCaseId owningBureau currentOwner assignedOfficerId slaClock transferStatus').lean()).filter(c => office(c.owningBureau) === office(user.bureau));
  const rule = await getActiveRule('OFFICER_WORKLOAD');
  const configured = rule?.status === 'approved' && Number.isInteger(rule.body?.openCaseThreshold) && rule.body.openCaseThreshold > 0 && (process.env.APP_MODE !== 'production' || !rule.version.startsWith('DEMO-'));
  const rows = people.map(u => {
    const owned = cases.filter(c => String(c.currentOwner?.officerId || c.assignedOfficerId) === String(u._id));
    let nearDue = 0, overdue = 0, unknown = 0;
    for (const c of owned) { const clock = c.slaClock?.at(-1); if (!clock?.targetResolutionDate) { unknown++; continue; } if (new Date(clock.targetResolutionDate) < now) overdue++; else if (clock.nearDueDate && new Date(clock.nearDueDate) <= now) nearDue++; }
    return { officerId: String(u._id), label: u.displayName || 'Bureau officer', open: owned.length, nearDue, overdue, unknownClock: unknown, onLeave: !!u.isOnLeave, cases: owned.filter(c => c.transferStatus !== 'REQUESTED').map(c => c.masterCaseId) };
  });
  const suggestions = [];
  for (const row of rows) {
    if (!row.onLeave && (!configured || row.open <= rule.body.openCaseThreshold)) continue;
    const target = rows.filter(r => !r.onLeave && r.officerId !== row.officerId).sort((a,b) => a.open - b.open || a.officerId.localeCompare(b.officerId))[0];
    if (target) for (const caseId of row.cases) suggestions.push({ caseId, fromOfficerId: row.officerId, toOfficerId: target.officerId, toLabel: target.label, reason: row.onLeave ? 'Recorded leave' : 'Above configured workload threshold' });
  }
  return { rows, suggestions, threshold: configured ? rule.body.openCaseThreshold : null, policy: configured ? 'configured' : 'policy not configured', scope: `Bureau ${office(user.bureau)}; open assigned cases`, total: cases.length };
}
export async function confirm(user, { caseId, toOfficerId, reason }) {
  if (user.role !== 'supervisor') throw fail(403, 'SUPERVISOR_REQUIRED');
  const data = await workload(user);
  if (!data.suggestions.some(s => s.caseId === caseId && s.toOfficerId === toOfficerId)) throw fail(409, 'SUGGESTION_NO_LONGER_AVAILABLE');
  const result = await requestTransfer(user, { masterCaseId: caseId, toBureau: user.bureau, nominatedOfficerId: toOfficerId, reason });
  await event(user, 'workload.handover_confirmed', result.transfer.id, { nominatedOfficerId: toOfficerId });
  return { transferId: result.transfer.id, status: result.transfer.status, accountableOffice: result.case.currentOwner.office };
}
