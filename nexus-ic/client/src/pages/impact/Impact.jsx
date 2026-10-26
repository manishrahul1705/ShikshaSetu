import React from 'react';
import { useS5, Pct } from '../closure/api.jsx';
import DrillLink from '../../additions/n47-drilldown/DrillLink.jsx';
import PatternAlerts from '../../additions/n61-patterns/PatternAlerts.jsx';
import ImpactCharts from './ImpactCharts.jsx';
import { PageHeader, CodeText } from '../../components/ui/PageKit.jsx';
import { KpiRow } from '../../components/dashboard/CommandCharts.jsx';
import Icon from '../../components/ui/Icon.jsx';

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
    <div className="mx-auto max-w-6xl space-y-6 font-sans text-sm leading-6">
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
      <section aria-label="Resolution time and duplicate actions" className="overflow-hidden rounded-2xl border border-saffron-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-saffron-100 bg-saffron-50/70 px-5 py-4 sm:px-6"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-saffron-700"><Icon name="clock" className="h-5 w-5"/></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-saffron-700">Resolution and coordination</p><h2 className="text-lg font-bold tracking-tight text-ink-950">Resolution time and duplicate actions</h2></div></div>
        <div className="grid gap-0 divide-y divide-slate-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          <div className="space-y-3 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Median resolution time</p><p className="text-3xl font-extrabold tabular-nums text-ink-950">{r.resolutionTime.result === 'UNKNOWN' ? 'UNKNOWN' : <>{r.resolutionTime.medianDays}<span className="ml-2 text-sm font-medium text-slate-500">days</span></>}</p><p className="text-xs leading-6 text-slate-600">{r.resolutionTime.result === 'UNKNOWN' ? <>Resolution time: Not available: <CodeText value={r.resolutionTime.reason} /></> : `Median ${r.resolutionTime.medianDays} days over ${r.resolutionTime.closedCases} closed cases (${r.resolutionTime.scope})`}</p></div>
          <div className="space-y-3 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Potential duplicate actions</p><p className="text-3xl font-extrabold tabular-nums text-saffron-700">{r.duplicateActions.flagged ?? 'UNKNOWN'}</p><p className="text-xs leading-6 text-slate-600">Duplicate actions flagged: {r.duplicateActions.flagged} (<Pct p={r.duplicateActions.flaggedShare} />)</p></div>
          <div className="space-y-3 bg-slate-50/50 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmed prevention</p><p className="text-xl font-bold text-slate-500">Not available</p><p className="text-xs leading-6 text-slate-600">Duplicate actions avoided: Not available: <CodeText value={r.duplicateActions.avoided.reason} />. A flagged action is never counted as avoided.</p></div>
        </div>
      </section>
      <section aria-label="Region-wise insights" className="overflow-hidden rounded-2xl border border-saffron-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-saffron-100 bg-saffron-50/70 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-saffron-700"><Icon name="map" className="h-5 w-5"/></span><h2 className="text-lg font-bold tracking-tight text-ink-950">Region-wise insights</h2></div><p className="text-xs text-slate-500">Select a total to inspect its cases</p></div>
        <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">{r.regionWise.map(x => <li key={x.rowId} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-saffron-300 hover:bg-saffron-50/30"><div className="mb-4 flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-ink-950">{x.region}</h3><span className="h-2 w-2 rounded-full bg-saffron-400" aria-hidden="true"/></div><dl className="grid grid-cols-3 gap-3"><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total cases</dt><dd className="mt-1 text-2xl font-extrabold tabular-nums text-saffron-800"><DrillLink row={x.rowId}>{x.total ?? 'UNKNOWN'}</DrillLink></dd></div><div className="border-l border-slate-100 pl-3"><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Open</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-ink-900">{x.open ?? 'UNKNOWN'}</dd></div><div className="border-l border-slate-100 pl-3"><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Overdue</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-saffron-700">{x.overdue ?? 'UNKNOWN'}</dd></div></dl></li>)}</ul>
        {r.regionWise.length === 0 && <p className="px-6 pb-5 text-sm text-slate-500">No regional records in your current scope.</p>}
      </section>
      <PatternAlerts />
      <section aria-label="Policy-level recommendations" className="overflow-hidden rounded-2xl border border-saffron-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-saffron-100 bg-saffron-50/70 px-5 py-5 sm:px-6"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-saffron-700"><Icon name="book" className="h-5 w-5"/></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-saffron-700">From evidence to review</p><h2 className="mt-1 text-lg font-bold tracking-tight text-ink-950">Policy-level recommendations</h2><p className="mt-1 text-xs leading-5 text-slate-500">Decision support grounded in the records within your access scope.</p></div></div>
        <div className="p-5 sm:p-6">{r.recommendations.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No recommendation: no cited rows support one.</p>}
          <ul className="grid items-start gap-4 xl:grid-cols-2">{r.recommendations.map((x,index) => <li key={x.id} className="flex min-w-0 gap-3 rounded-xl border border-slate-200 p-4 sm:p-5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-saffron-100 text-xs font-bold tabular-nums text-saffron-800">{String(index + 1).padStart(2,'0')}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium leading-6 text-ink-900">{x.text}</p><details className="mt-3 rounded-lg bg-slate-50 px-3 py-2"><summary className="cursor-pointer text-xs font-semibold text-saffron-800">View supporting measures</summary><ul className="mt-2 space-y-2 text-xs leading-5 text-slate-600">{x.citedRows.map(row => <li key={row} className="break-words"><DrillLink row={row}>{row.startsWith('region:') ? `${row.slice(7)} region` : row.startsWith('bureau:') ? row.slice(7) : row.startsWith('tile:') ? (TILE_NAMES.find(([id]) => id === row.slice(5))?.[1] || row.slice(5)) : row}</DrillLink></li>)}</ul></details></div></li>)}</ul>
        </div>
      </section>
    </div>
  );
}
