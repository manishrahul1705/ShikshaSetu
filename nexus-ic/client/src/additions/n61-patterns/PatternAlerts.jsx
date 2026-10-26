import React, { useState } from 'react';
import { useS5, Pct } from '../../pages/closure/api.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';
import { metadataText } from '../../components/metadataLabel.js';
import Icon from '../../components/ui/Icon.jsx';

/** N61: cross-institution pattern alerts beside IMPACT. Advisory; cites cases; synthetic. */
export default function PatternAlerts() {
  const q = useS5('/impact/patterns');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [visible, setVisible] = useState(6);
  if (q.isLoading || q.error || !Array.isArray(q.data?.alerts)) return null;
  const p = q.data;
  const regions = [...new Set(p.alerts.map(a => a.region).filter(Boolean))].sort();
  const filtered = p.alerts.filter(a => (!region || a.region === region) && (!query.trim() || metadataText(`${a.issueConcept || ''} ${a.suggestion || ''} ${a.region || ''}`).toLowerCase().includes(query.trim().toLowerCase())));
  return (
    <section aria-label="Cross-institution patterns" className="overflow-hidden rounded-2xl border border-saffron-200 bg-white font-sans shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-saffron-100 bg-saffron-50/70 px-5 py-5 sm:px-6"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-saffron-700"><Icon name="pulse" className="h-5 w-5"/></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-saffron-700">Signals for human review</p><h2 className="mt-1 text-lg font-bold tracking-tight text-ink-950">Cross-institution pattern alerts</h2><p className="mt-1 text-xs leading-5 text-slate-600"><RuleVersion value={p.ruleVersion} family="Pattern rule" />. Window {p.windowDays} days, minimum {p.minInstitutions} institutions.</p></div></div><span className="rounded-full border border-saffron-200 bg-white px-3 py-1 text-xs font-semibold text-saffron-800">{p.alerts.length} alerts in scope</span></header>
      <div className="space-y-4 p-5 sm:p-6">
        {p.alerts.length > 0 && <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">Search alerts<input aria-label="Search pattern alerts" placeholder="Issue, region or keyword" className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-saffron-400 focus:ring-4 focus:ring-saffron-100" value={query} onChange={e => { setQuery(e.target.value); setVisible(6); }}/></label><label className="text-xs font-semibold text-slate-600">Region<select aria-label="Filter patterns by region" className="mt-1 block min-h-10 rounded-lg border border-slate-200 p-2 text-sm" value={region} onChange={e => { setRegion(e.target.value); setVisible(6); }}><option value="">All regions</option>{regions.map(name => <option key={name}>{name}</option>)}</select></label><p className="pb-2 text-xs text-slate-500">{filtered.length} matching alerts</p></div>}
        {p.alerts.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No rising pattern in scope.</p>}
        {p.alerts.length > 0 && filtered.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No alerts match these filters.</p>}
        <div className="grid items-start gap-4 xl:grid-cols-2">{filtered.slice(0, visible).map(a => <article key={a.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 border-l-4 border-l-saffron-400 bg-white p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="rounded-md bg-saffron-50 px-2 py-1 text-[11px] font-bold text-saffron-800">{a.region || 'Regional pattern'}</span><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Advisory</span></div>
          {a.issueConcept && <h3 className="mb-2 text-sm font-bold leading-6 text-ink-950">{metadataText(a.issueConcept)}</h3>}
          <p className="text-sm leading-6 text-slate-600">{metadataText(a.suggestion)}.</p>
          {a.institutionsNow != null && <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-xs"><div><span className="block text-slate-500">Current window</span><strong className="mt-1 block text-lg font-bold tabular-nums text-saffron-800">{a.institutionsNow} <span className="text-xs font-medium text-slate-500">institutions</span></strong></div><div><span className="block text-slate-500">Previous window</span><strong className="mt-1 block text-lg font-bold tabular-nums text-slate-700">{a.institutionsBefore ?? 'UNKNOWN'}</strong></div></div>}
          <details className="mt-4 rounded-lg border border-saffron-100 bg-saffron-50/40 p-3"><summary className="cursor-pointer text-xs font-semibold text-saffron-800">Evidence and scope · {a.citedRows?.length || 0} cited cases</summary><div className="mt-3 space-y-3 text-xs leading-6 text-slate-600"><p>Share of institutions: <Pct p={a.share} /></p><p className="break-words font-mono text-[11px]">Cites: {(a.citedRows || []).join(', ')}</p></div></details>
        </article>)}</div>
        {filtered.length > visible && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs text-slate-500">Showing {Math.min(visible, filtered.length)} of {filtered.length} matching alerts</p><button type="button" className="btn-secondary border-saffron-200 text-saffron-800 hover:bg-saffron-50" onClick={() => setVisible(count => count + 6)}>Show more alerts</button></div>}
        <p className="text-xs leading-5 text-slate-500">Patterns suggest a review. They do not determine an institution's outcome or change case ownership.</p>
      </div>
    </section>
  );
}
