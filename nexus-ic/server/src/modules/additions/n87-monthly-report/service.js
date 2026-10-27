import { scopedCases, IMPACT_ROLES, scopeLabel } from '../../impact/impactService.js';
import { Transfer } from '../../trace/models.js';
import { ClosureRecord } from '../../closure/models.js';
import AuditEvent from '../../audit/AuditEvent.js';
import { fail, office } from '../n82-combined-request/service.js';
export const metrics = ['opening', 'received', 'disposed', 'transferredOut', 'transferredIn', 'escalated', 'closing', 'age0to15', 'age16to30', 'age31to60', 'ageOver60'];
const closed = s => /^(closed|disposed)$/i.test(s || '');
export function monthWindow(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) throw fail(400, 'MONTH_INVALID');
  const [year, m] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(year, m - 1, 1) - 19800000), end: new Date(Date.UTC(year, m, 1) - 19800000) };
}
export function monthlyLedger(cases, transfers, closures, events, { month, scope = 'all', value = '' }) {
  const { start, end } = monthWindow(month), rows = new Map();
  const group = (items,key) => { const map=new Map(); for(const item of items){const id=String(item[key]);if(!map.has(id))map.set(id,[]);map.get(id).push(item);}return map; };
  const transferGroups=group(transfers,'caseId'),closureGroups=group(closures,'caseId'),eventGroups=group(events,'targetId');
  const inMonth = d => d && new Date(d) >= start && new Date(d) < end;
  const row = (kind, name) => {
    const key = `${kind}:${name || 'Unassigned'}`;
    if (!rows.has(key)) rows.set(key, { key, kind, name: name || 'Unassigned', cells: Object.fromEntries(metrics.map(k => [k, []])) });
    return rows.get(key);
  };
  let incomplete = 0;
  for (const c of cases) {
    if (new Date(c.createdAt) >= end) continue;
    const caseEvents=eventGroups.get(String(c._id)) || [];
    const moves = (transferGroups.get(String(c._id)) || []).filter(t => t.status === 'ACCEPTED' && t.acknowledgedAt).sort((a,b) => new Date(a.acknowledgedAt) - new Date(b.acknowledgedAt));
    const stops = (closureGroups.get(String(c._id)) || []).filter(x => x.state === 'CLOSED' && x.closedAt).map(x => new Date(x.closedAt));
    const transitions = caseEvents.filter(e => e.action === 'case.status.transitioned').sort((a,b) => new Date(a.at) - new Date(b.at));
    const officeAt = date => office(moves.filter(t => new Date(t.acknowledgedAt) < date).at(-1)?.toBureau || moves[0]?.fromBureau || c.owningBureau);
    const region = c.pidSnapshot?.region || 'Not available';
    const openAt = date => {
      if (new Date(c.createdAt) >= date) return false;
      const last = transitions.filter(e => new Date(e.at) < date).at(-1);
      if (last) return !closed(last.meta?.nextStatus);
      return !stops.some(d => d < date);
    };
    const included = scope === 'all' || (scope === 'region' ? value === region : [officeAt(start),officeAt(end),...moves.flatMap(t=>[office(t.fromBureau),office(t.toBureau)])].includes(office(value)));
    if (included && closed(c.status) && stops.length === 0 && !transitions.some(e => closed(e.meta?.nextStatus))) incomplete++;
    const add = (metric, bureau, eventRef = '') => {
      for (const [kind, name] of [['bureau', bureau], ['region', region]]) {
        if (scope === 'bureau' && kind === 'region') continue;
        if (scope === 'bureau' && office(value) !== bureau || scope === 'region' && value !== region) continue;
        row(kind, name).cells[metric].push({ caseId: c.masterCaseId, eventRef });
      }
    };
    if (openAt(start)) add('opening', officeAt(start));
    if (inMonth(c.createdAt)) add('received', officeAt(new Date(new Date(c.createdAt).getTime() + 1)));
    for (const d of stops.filter(inMonth)) add('disposed', officeAt(new Date(d.getTime()+1)), d.toISOString());
    for (const t of moves.filter(t => inMonth(t.acknowledgedAt))) {
      if (office(t.fromBureau) === office(t.toBureau)) continue;
      for (const [metric, name] of [['transferredOut', office(t.fromBureau)], ['transferredIn', office(t.toBureau)]]) {
        if (scope === 'bureau' && office(value) !== name || scope === 'region' && value !== region) continue;
        row('bureau', name).cells[metric].push({ caseId: c.masterCaseId, eventRef: String(t._id) });
      }
    }
    for (const e of caseEvents.filter(e => /escalat/i.test(e.action) && inMonth(e.at))) add('escalated', officeAt(new Date(e.at)), String(e._id));
    if (openAt(end)) {
      add('closing', officeAt(end));
      const days = Math.floor((end - new Date(c.createdAt)) / 86400000);
      add(days <= 15 ? 'age0to15' : days <= 30 ? 'age16to30' : days <= 60 ? 'age31to60' : 'ageOver60', officeAt(end));
    }
  }
  return { month, timezone: 'Asia/Kolkata', start, end, source: 'Receipt, accepted TRACE transfers, PROOF closure records and lifecycle audit events', incompleteHistoryCases: incomplete,
    rows: [...rows.values()].map(r => { const counts = Object.fromEntries(metrics.map(k => [k, r.cells[k].length])); const difference = counts.opening + counts.received - counts.disposed - counts.transferredOut + counts.transferredIn - counts.closing;
      return { ...r, counts, difference, reconciles: difference === 0 && incomplete === 0 }; }) };
}
export async function monthlyReport(user, options) {
  if (!IMPACT_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  if (!['all', 'bureau', 'region'].includes(options.scope || 'all')) throw fail(400, 'SCOPE_INVALID');
  const cases = await scopedCases(user), ids = cases.map(c => c._id);
  const [transfers, closures, events] = await Promise.all([Transfer.find({ caseId: { $in: ids } }).lean(), ClosureRecord.find({ caseId: { $in: ids }, state: 'CLOSED' }).lean(), AuditEvent.find({ targetType: 'Case', targetId: { $in: ids.map(String) }, action: { $regex: 'transitioned|escalat' } }).lean()]);
  const selected=cases.filter(c=>options.scope==='region' ? (c.pidSnapshot?.region || 'Not available')===options.value : options.scope==='bureau' ? office(c.owningBureau)===office(options.value) || transfers.some(t=>String(t.caseId)===String(c._id) && t.status==='ACCEPTED' && [office(t.fromBureau),office(t.toBureau)].includes(office(options.value))) : true);
  return { ...monthlyLedger(selected, transfers, closures, events, options), scope: `${scopeLabel(user)}; ${options.scope || 'all'} ${options.value || ''}`, denominator: selected.length };
}
