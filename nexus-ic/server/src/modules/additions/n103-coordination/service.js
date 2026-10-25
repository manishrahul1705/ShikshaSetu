import Case from '../../cases/Case.js';
import Institution from '../../institutions/Institution.js';
import { CLOSED_STATUSES } from '../../lifecycle/lifecycleGuards.js';
import { canAccessCase } from '../../../middleware/rbac.js';
import { recordAudit } from '../../audit/audit.js';
import { officerRoles, fail } from '../../prevent/access.js';

const aliases = { RB: 'Regulation Bureau', PGRC: 'Public Grievance Redressal Cell', AB: 'Academic Bureau', APB: 'Approval Bureau' };
const bureauOf = c => aliases[c.currentOwner?.office || c.owningBureau] || c.currentOwner?.office || c.owningBureau;

export async function coordinationFlags(user, institutionPid) {
  if (!officerRoles.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  if (institutionPid && !/^1-\d{10}$/.test(institutionPid)) throw fail(400, 'PID_INVALID');
  const rows = await Case.find({ status: { $nin: CLOSED_STATUSES }, ...(institutionPid ? { institutionPid } : {}) }).select('masterCaseId institutionPid pidSnapshot currentOwner owningBureau routingDecisionId status').lean();
  const groups = new Map();
  for (const c of rows) {
    if (!groups.has(c.institutionPid)) groups.set(c.institutionPid, []);
    groups.get(c.institutionPid).push(c);
  }
  const institutions = await Institution.find({ pid: { $in: [...groups.keys()] } }).select('pid name region').lean();
  const byPid = new Map(institutions.map(i => [i.pid, i]));
  const flags = [];
  for (const [pid, cases] of groups) {
    const bureaus = [...new Set(cases.map(bureauOf).filter(Boolean))].sort();
    if (bureaus.length < 2) continue;
    const allowed = await Promise.all(cases.map(c => canAccessCase(user, c)));
    const visible = cases.filter((_, i) => allowed[i]);
    if (!visible.length) continue;
    const institution = byPid.get(pid);
    flags.push({ institutionPid: pid, institutionName: institution?.name || visible[0].pidSnapshot?.name || 'Not available', region: institution?.region || visible[0].pidSnapshot?.region || 'UNKNOWN',
      bureaus, cases: visible.map(c => ({ masterCaseId: c.masterCaseId, bureau: bureauOf(c) || 'Unassigned', status: c.status })),
      restrictedCount: cases.length - visible.length, level: 'COORDINATION_REQUIRED' });
  }
  flags.sort((a, b) => a.institutionPid.localeCompare(b.institutionPid));
  await recordAudit({ actorId: String(user.id || user._id), actorRole: user.role, action: 'coordination.checked', targetType: 'Institution', targetId: institutionPid || 'all', meta: { count: flags.length } });
  return { flags, count: flags.length };
}
