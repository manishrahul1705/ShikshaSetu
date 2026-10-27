import React from 'react';
import { useS5, Pct } from '../closure/api.jsx';
import DrillLink from '../../additions/n47-drilldown/DrillLink.jsx';
import PatternAlerts from '../../additions/n61-patterns/PatternAlerts.jsx';
import ImpactCharts from './ImpactCharts.jsx';
import { PageHeader, CodeText } from '../../components/ui/PageKit.jsx';
import { KpiRow } from '../../components/dashboard/CommandCharts.jsx';

/**
 * NEXUS IMPACT (N26) with the nine management tiles (N77) at /impact.
 * Synthetic label, numerator / denominator / scope on every percentage,
 * UNKNOWN instead of zero, flagged never counted as avoided.
 */
const TILE_NAMES = [
  ['totalComplaints', 'Total Complaints'],
  ['pendingCases', 'Pending Cases'],
  ['disposedCases', 'Disposed Cases'],
  ['overdueCases', 'Overdue Cases'],
  ['transferDelays', 'Transfer Delays'],
  ['potentialOverlaps', 'Potential Overlaps'],
  ['bureauWiseWorkload', 'Bureau-wise Workload'],
  ['institutionWiseHistory', 'Institution-wise History'],
  ['trendsAndInsights', 'Trends and Insights'],
];

function TileBody({ id, tile }) {
  if (tile.result === 'UNKNOWN') return <p>Not available: <CodeText value={tile.reason} /></p>;
  if (tile.rows) {
    return (
      <ul className="text-xs">
        {tile.rows.slice(0, 8).map((r) => <li key={r.rowId}>{r.bureau || r.name || r.month}: <DrillLink row={r.rowId}>{r.total ?? r.registered}</DrillLink>{r.open !== undefined ? `, open ${r.open}` : ''}{r.disposed !== undefined ? `, disposed ${r.disposed}` : ''}</li>)}
        {tile.rows.length === 0 && <li>No rows in scope</li>}
      </ul>
    );
  }
  if (id === 'potentialOverlaps') return <p className="text-2xl font-bold"><DrillLink row={`tile:${id}`}>{tile.pairs}</DrillLink> <span className="text-xs font-normal">pairs; restricted entries {tile.restrictedEntries}</span></p>;
  return (
    <div>
      <p className="text-2xl font-bold"><DrillLink row={`tile:${id}`}>{tile.count}</DrillLink></p>
      {tile.share && <p className="text-xs"><Pct p={tile.share} /></p>}
    </div>
  );
}

export default function Impact() {
  const q = useS5('/impact/summary');
  if (q.isLoading) return <p>Loading...</p>;
  if (q.error) return <p>IMPACT is unavailable for your role.</p>;
  const r = q.data;
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <PageHeader eyebrow="MANAGEMENT INSIGHTS" title="NEXUS IMPACT" purpose="Explore case progress, coordination and resolution using the records within your access scope."><a className="btn-secondary" href="/api/v1/impact/report.csv" download>Download report (CSV)</a></PageHeader>
      <p className="text-sm">Scope: {r.scope}</p>
      <KpiRow report={r} />
      <ImpactCharts report={r} showContext={false} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TILE_NAMES.map(([id, name]) => (
          <section key={id} aria-label={name} className="card card-pad">
            <h2 className="font-semibold text-sm">{name}</h2>
            <TileBody id={id} tile={r.tiles[id]} />
          </section>
        ))}
      </div>
      <section className="border rounded p-3 bg-white text-sm space-y-1">
        <h2 className="font-semibold">Resolution time and duplicate actions</h2>
        <p>{r.resolutionTime.result === 'UNKNOWN' ? <>Resolution time: Not available: <CodeText value={r.resolutionTime.reason} /></> : `Median ${r.resolutionTime.medianDays} days over ${r.resolutionTime.closedCases} closed cases (${r.resolutionTime.scope})`}</p>
        <p>Duplicate actions flagged: {r.duplicateActions.flagged} (<Pct p={r.duplicateActions.flaggedShare} />)</p>
        <p>Duplicate actions avoided: Not available: <CodeText value={r.duplicateActions.avoided.reason} />. A flagged action is never counted as avoided.</p>
      </section>
      <section className="border rounded p-3 bg-white text-sm">
        <h2 className="font-semibold">Region-wise insights</h2>
        <ul>{r.regionWise.map((x) => <li key={x.rowId}>{x.region}: <DrillLink row={x.rowId}>{x.total}</DrillLink> cases, open {x.open}, overdue {x.overdue}</li>)}</ul>
      </section>
      <PatternAlerts />
      <section className="border rounded p-3 bg-white text-sm">
        <h2 className="font-semibold">Policy-level recommendations</h2>
        {r.recommendations.length === 0 && <p>No recommendation: no cited rows support one.</p>}
        <ul>{r.recommendations.map((x) => <li key={x.id}>{x.text} <span className="text-xs">(cites {x.citedRows.join(', ')})</span></li>)}</ul>
      </section>
    </div>
  );
}
