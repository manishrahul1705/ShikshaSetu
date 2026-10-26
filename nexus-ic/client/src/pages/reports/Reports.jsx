import React from 'react';
import { PageHeader, SortableTable } from '../../components/ui/PageKit.jsx';
import { KpiRow } from '../../components/dashboard/CommandCharts.jsx';
import { useS5, Pct } from '../closure/api.jsx';
import DrillLink from '../../additions/n47-drilldown/DrillLink.jsx';
import ImpactCharts from '../impact/ImpactCharts.jsx';
import StatusWise from '../../additions/n107-quarterly-reports/StatusWise.jsx';

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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <PageHeader eyebrow="NEXUS IMPACT" title="Reports and analytics" purpose="Review trends and export the cases supporting each measure." />
        <a className="px-3 py-1 border rounded text-sm" href="/api/v1/impact/report.csv" download>Download CSV</a>
      </div>
      <p className="text-sm">Scope: {r.scope}</p>
      <KpiRow report={r} /><ImpactCharts report={r} showContext={false} />
      <nav aria-label="Report sections" className="flex flex-wrap gap-2">{[['trends','Trends'],['performance','Bureau performance'],['regions','Regions'],['institutions','Institutions'],['status','Status-wise']].map(([id,label]) => <a key={id} href={`#report-${id}`} className="rounded-lg border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-saffron-800 no-underline hover:bg-saffron-50">{label}</a>)}</nav>
      <section id="report-trends" aria-label="Trends" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:p-5">
        <h2 className="font-semibold">Trends</h2>
        <div className="mt-3"><SortableTable label="Search monthly trends" rows={t.trendsAndInsights.rows} columns={[{ key: 'month', label: 'Month' }, { key: 'registered', label: 'Registered', render: (value,row) => <DrillLink row={row.rowId}>{value}</DrillLink> }, { key: 'disposed', label: 'Disposed' }]} /></div>
      </section>
      <section id="report-performance" aria-label="Performance" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:p-5">
        <h2 className="font-semibold">Performance by bureau</h2>
        <p>Resolution time: {r.resolutionTime.result === 'UNKNOWN' ? `UNKNOWN (${r.resolutionTime.reason})` : `median ${r.resolutionTime.medianDays} days over ${r.resolutionTime.closedCases} closed cases`}</p>
        <p>Overdue: <Pct p={t.overdueCases.share} /></p>
        <div className="mt-3"><SortableTable label="Search bureau performance" rows={t.bureauWiseWorkload.rows} columns={[{ key: 'bureau', label: 'Bureau' }, { key: 'total', label: 'Total', render: (value,row) => <DrillLink row={row.rowId}>{value}</DrillLink> }, { key: 'open', label: 'Open' }, { key: 'overdue', label: 'Overdue' }, { key: 'transfersIn', label: 'Transfers in' }, { key: 'transfersDelayed', label: 'Transfers delayed' }]} /></div>
      </section>
      <section id="report-regions" aria-label="Region-wise insights" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:p-5">
        <h2 className="font-semibold">Region-wise insights</h2>
        <div className="mt-3"><SortableTable label="Search regional insights" rows={r.regionWise} columns={[{ key: 'region', label: 'Region' }, { key: 'total', label: 'Total', render: (value,row) => <DrillLink row={row.rowId}>{value}</DrillLink> }, { key: 'open', label: 'Open' }, { key: 'overdue', label: 'Overdue' }]} /></div>
      </section>
      <section id="report-institutions" aria-label="Institution-wise report" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:p-5">
        <h2 className="font-semibold">Institution-wise</h2>
        <div className="mt-3"><SortableTable label="Search institution report" rows={t.institutionWiseHistory.rows} columns={[{ key: 'pid', label: 'PID' }, { key: 'icid', label: 'ICID' }, { key: 'name', label: 'Name' }, { key: 'total', label: 'Total', render: (value,row) => <DrillLink row={row.rowId}>{value}</DrillLink> }, { key: 'open', label: 'Open' }, { key: 'disposed', label: 'Disposed' }]} /></div>
      </section>
      <StatusWise />
    </div>
  );
}
