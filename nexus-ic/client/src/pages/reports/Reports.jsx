import React from 'react';
import { PageHeader } from '../../components/ui/PageKit.jsx';
import { KpiRow } from '../../components/dashboard/CommandCharts.jsx';
import { useS5, Pct } from '../closure/api.jsx';
import DrillLink from '../../additions/n47-drilldown/DrillLink.jsx';
import ImpactCharts from '../impact/ImpactCharts.jsx';

/**
 * Reports and analytics at /reports (SPEC 12.1): trends, performance and
 * region-wise insights, with the ICID column when permitted (SPEC 3
 * touchpoint 10). Built on the same IMPACT query, so the numbers match /impact.
 */
export default function Reports() {
  const q = useS5('/impact/summary');
  if (q.isLoading) return <p>Loading...</p>;
  if (q.error) return <p>Reports are unavailable for your role.</p>;
  const r = q.data;
  const t = r.tiles;
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <PageHeader eyebrow="NEXUS IMPACT" title="Reports and analytics" purpose="Review trends and export the cases supporting each measure." />
        <a className="px-3 py-1 border rounded text-sm" href="/api/v1/impact/report.csv" download>Download CSV</a>
      </div>
      <p className="text-sm">Scope: {r.scope}</p>
      <KpiRow report={r} /><ImpactCharts report={r} showContext={false} />
      <section aria-label="Trends" className="border rounded p-3 bg-white text-sm">
        <h2 className="font-semibold">Trends</h2>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left"><th>Month</th><th>Registered</th><th>Disposed</th></tr></thead>
          <tbody>{t.trendsAndInsights.rows.map((m) => <tr key={m.rowId}><td>{m.month}</td><td><DrillLink row={m.rowId}>{m.registered}</DrillLink></td><td>{m.disposed}</td></tr>)}</tbody></table></div>
      </section>
      <section aria-label="Performance" className="border rounded p-3 bg-white text-sm">
        <h2 className="font-semibold">Performance by bureau</h2>
        <p>Resolution time: {r.resolutionTime.result === 'UNKNOWN' ? `UNKNOWN (${r.resolutionTime.reason})` : `median ${r.resolutionTime.medianDays} days over ${r.resolutionTime.closedCases} closed cases`}</p>
        <p>Overdue: <Pct p={t.overdueCases.share} /></p>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left"><th>Bureau</th><th>Total</th><th>Open</th><th>Overdue</th><th>Transfers in</th><th>Transfers delayed</th></tr></thead>
          <tbody>{t.bureauWiseWorkload.rows.map((b) => <tr key={b.rowId}><td>{b.bureau}</td><td><DrillLink row={b.rowId}>{b.total}</DrillLink></td><td>{b.open}</td><td>{b.overdue}</td><td>{b.transfersIn}</td><td>{b.transfersDelayed}</td></tr>)}</tbody></table></div>
      </section>
      <section aria-label="Region-wise insights" className="border rounded p-3 bg-white text-sm">
        <h2 className="font-semibold">Region-wise insights</h2>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left"><th>Region</th><th>Total</th><th>Open</th><th>Overdue</th></tr></thead>
          <tbody>{r.regionWise.map((x) => <tr key={x.rowId}><td>{x.region}</td><td><DrillLink row={x.rowId}>{x.total}</DrillLink></td><td>{x.open}</td><td>{x.overdue}</td></tr>)}</tbody></table></div>
      </section>
      <section aria-label="Institution-wise report" className="border rounded p-3 bg-white text-sm">
        <h2 className="font-semibold">Institution-wise</h2>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left"><th>PID</th><th>ICID</th><th>Name</th><th>Total</th><th>Open</th><th>Disposed</th></tr></thead>
          <tbody>{t.institutionWiseHistory.rows.map((x) => <tr key={x.rowId}><td>{x.pid}</td><td>{x.icid}</td><td>{x.name}</td><td><DrillLink row={x.rowId}>{x.total}</DrillLink></td><td>{x.open}</td><td>{x.disposed}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}
