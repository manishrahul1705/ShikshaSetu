import Case from '../../cases/Case.js';
import Institution from '../../institutions/Institution.js';
import { canAccessCase } from '../../../middleware/rbac.js';
import { applyFieldPolicy } from '../../../middleware/abac.js';
import { recordAudit } from '../../audit/audit.js';
import { fail } from '../../prevent/access.js';
import { watermarkExport } from '../n55-watermark/service.js';
export const SEARCH_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor'];
const aliases = { RB: 'Regulation Bureau', PGRC: 'Public Grievance Redressal Cell', AB: 'Academic Bureau', APB: 'Approval Bureau' };
export const bureauNames = b => [b, aliases[b], ...Object.keys(aliases).filter(k => aliases[k] === b)].filter(Boolean);
export const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function dayBoundary(value, nextDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw fail(400, 'DATE_INVALID');
  const utc = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(+utc) || utc.toISOString().slice(0, 10) !== value) throw fail(400, 'DATE_INVALID');
  return new Date(+utc - 19800000 + (nextDay ? 86400000 : 0));
}
export async function searchCases(user, options = {}) {
  if (!SEARCH_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  for (const key of ['q', 'pid', 'caseId', 'bureau', 'region', 'category', 'status', 'from', 'to', 'page', 'pageSize']) if (options[key] !== undefined && (typeof options[key] !== 'string' || options[key].length > 200)) throw fail(400, 'FILTER_INVALID');
  const page = Math.max(1, Number.parseInt(options.page, 10) || 1), pageSize = Math.min(50, Math.max(1, Number.parseInt(options.pageSize, 10) || 20));
  const and = [];
  const masters = await Institution.find({}).select('pid name region').lean();
  const byPid = new Map(masters.map(i => [i.pid, i]));
  if (options.q) {
    const regex = new RegExp(escapeRegex(options.q.trim()), 'i');
    and.push({ $or: [{ institutionPid: { $in: masters.filter(i => regex.test(i.name)).map(i => i.pid) } }, { 'pidSnapshot.name': regex }] });
  }
  for (const [key, field] of [['pid', 'institutionPid'], ['caseId', 'masterCaseId'], ['category', 'category'], ['status', 'status']]) if (options[key]) and.push({ [field]: options[key] });
  if (options.bureau) and.push({ owningBureau: { $in: bureauNames(options.bureau) } });
  const regionFilter = region => ({ $or: [{ 'pidSnapshot.region': region }, { 'pidSnapshot.region': { $in: [null, ''] }, institutionPid: { $in: masters.filter(i => i.region === region).map(i => i.pid) } }] });
  if (options.region) and.push(regionFilter(options.region));
  if (user.role === 'bureau_officer') and.push({ owningBureau: { $in: bureauNames(user.bureau) } });
  if (user.role === 'regional_officer') and.push(regionFilter(user.region || '__NO_REGION__'));
  if (options.from || options.to) {
    const range = { ...(options.from ? { $gte: dayBoundary(options.from) } : {}), ...(options.to ? { $lt: dayBoundary(options.to, true) } : {}) };
    if (range.$gte && range.$lt && range.$gte >= range.$lt) throw fail(400, 'DATE_RANGE_INVALID');
    and.push({ createdAt: range });
  }
  const candidates = await Case.find(and.length ? { $and: and } : {}).select('-narrative -narrativeHash -internalNotes').sort({ createdAt: -1, _id: -1 }).lean();
  const visible = [];
  for (const c of candidates) if (await canAccessCase(user, c)) visible.push(c);
  const rows = visible.slice((page - 1) * pageSize, page * pageSize).map(c => {
    const safe = applyFieldPolicy(c, user.role), institution = byPid.get(c.institutionPid);
    const segment = c.slaClock?.filter(s => !s.endedAt && !['COMPLETED'].includes(s.status)).at(-1);
    return { masterCaseId: safe.masterCaseId, institutionPid: safe.institutionPid, institutionName: institution?.name || safe.pidSnapshot?.name || 'Not available', region: safe.pidSnapshot?.region || institution?.region || 'UNKNOWN', owningBureau: safe.owningBureau || null, category: safe.category, status: safe.status, createdAt: safe.createdAt, slaTarget: segment?.targetResolutionDate || null };
  });
  await recordAudit({ actorId: String(user.id || user._id), actorRole: user.role, action: 'case_search.checked', targetType: 'CaseSearch', targetId: 'filtered', meta: { total: visible.length, page } });
  return { total: visible.length, page, rows };
}
export async function exportSearchCsv(user, options = {}) {
  const rows = [];
  for (let page = 1; ; page++) {
    const result = await searchCases(user, { ...options, page: String(page), pageSize: '50' });
    rows.push(...result.rows);
    if (!result.rows.length || page * 50 >= result.total) break;
  }
  const keys = ['masterCaseId', 'institutionName', 'institutionPid', 'region', 'owningBureau', 'category', 'status', 'createdAt', 'slaTarget'];
  const cell = v => `"${String(v ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
  const mark = await watermarkExport(user, { kind: 'CASE_SEARCH_CSV', rowCount: rows.length, scope: `${user.role}; ${user.bureau || user.region || 'all permitted cases'}` });
  return [keys, ...rows.map(r => keys.map(k => r[k])), [mark.footer + mark.invisible]].map(r => r.map(cell).join(',')).join('\r\n');
}
