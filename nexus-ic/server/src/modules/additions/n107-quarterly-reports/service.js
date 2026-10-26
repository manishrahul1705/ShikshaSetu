import { monthlyReport, metrics } from '../n87-monthly-report/service.js';
import { scopedCases, IMPACT_ROLES, scopeLabel } from '../../impact/impactService.js';
import { fail } from '../../closure/util.js';
export function disposalRate(counts) {
  const numerator = counts.disposed, denominator = counts.opening + counts.received;
  return { numerator, denominator, value: denominator ? Math.round(numerator / denominator * 1000) / 10 : null, ...(denominator ? {} : { reason: 'NO_DENOMINATOR' }) };
}
export const withDisposalRates = report => ({ ...report, disposalRates: report.rows.map(r => ({ key: r.key, kind: r.kind, name: r.name, ...disposalRate(r.counts) })) });
export function quarterMonths(quarter) {
  if (!/^\d{4}-Q[1-4]$/.test(quarter || '')) throw fail(400, 'QUARTER_INVALID');
  const [year, q] = quarter.split('-Q');
  return [0, 1, 2].map(i => `${year}-${String((Number(q) - 1) * 3 + i + 1).padStart(2, '0')}`);
}
export function composeQuarter(quarter, months) {
  const keys = [...new Set(months.flatMap(m => m.rows.map(r => r.key)))];
  const rows = keys.map(key => {
    const group = months.map(m => m.rows.find(r => r.key === key));
    const first = group.find(Boolean), cells = {};
    for (const metric of metrics) cells[metric] = metric === 'opening' ? group[0]?.cells[metric] || [] : metric === 'closing' || metric.startsWith('age') ? group[2]?.cells[metric] || [] : group.flatMap(r => r?.cells[metric] || []);
    const counts = Object.fromEntries(metrics.map(k => [k, cells[k].length]));
    const difference = counts.opening + counts.received - counts.disposed - counts.transferredOut + counts.transferredIn - counts.closing;
    return { key, kind: first.kind, name: first.name, cells, counts, difference, reconciles: difference === 0 && months.every(m => m.incompleteHistoryCases === 0), disposalRate: disposalRate(counts) };
  });
  return withDisposalRates({ ...months[2], quarter, months: quarterMonths(quarter), start: months[0].start, end: months[2].end, incompleteHistoryCases: Math.max(...months.map(m => m.incompleteHistoryCases)), rows });
}
export async function quarterlyReport(user, options) {
  const months = quarterMonths(options.quarter), ledgers = [];
  for (const month of months) ledgers.push(await monthlyReport(user, { ...options, month }));
  return composeQuarter(options.quarter, ledgers);
}
export async function statusWise(user) {
  if (!IMPACT_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const cases = await scopedCases(user), counts = new Map();
  for (const c of cases) counts.set(c.status, (counts.get(c.status) || 0) + 1);
  return { total: cases.length, scope: scopeLabel(user), rows: [...counts].map(([status, count]) => ({ rowId: `status:${status}`, status, count })) };
}
