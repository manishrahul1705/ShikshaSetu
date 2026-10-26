import { metadataLabel } from '../../components/metadataLabel.js';
import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useS5 } from '../../pages/closure/api.jsx';
import { PageHeader, CodeText, StatusChip } from '../../components/ui/PageKit.jsx';
import Icon from '../../components/ui/Icon.jsx';

const MEASURE_NAMES = { totalComplaints: 'All complaints', pendingCases: 'Pending cases', disposedCases: 'Disposed cases', overdueCases: 'Overdue cases', transferDelays: 'Delayed transfers', potentialOverlaps: 'Potential overlaps', bureauWiseWorkload: 'Bureau workload', institutionWiseHistory: 'Institution history', trendsAndInsights: 'Case trends' };
function measureName(value) {
  const [kind, ...parts] = String(value || '').split(':');
  const name = parts.join(':');
  if (kind === 'tile') return MEASURE_NAMES[name] || name.replace(/([a-z])([A-Z])/g, '$1 $2');
  if (kind === 'bureau') return `${name} cases`;
  if (kind === 'region') return `${name} region cases`;
  return String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll(':', ' · ');
}

/** N47 at /impact/cases?row=...: the cases behind one IMPACT number, within the viewer's own access. */
export default function DrillDown() {
  const [params] = useSearchParams();
  const row = params.get('row') || '';
  const q = useS5(`/impact/cases?row=${encodeURIComponent(row)}`, !!row);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [bureau, setBureau] = useState('');
  const [sort, setSort] = useState({ key: 'masterCaseId', asc: true });
  const [page, setPage] = useState(0);
  if (!row) return <section className="mx-auto max-w-4xl space-y-6"><PageHeader eyebrow="NEXUS IMPACT" title="Explore the cases behind a number" purpose="Choose a measure to inspect its cases within your access scope." /><div className="grid gap-4 sm:grid-cols-2">{[['totalComplaints', 'All cases'], ['pendingCases', 'Pending cases'], ['disposedCases', 'Disposed cases'], ['overdueCases', 'Overdue cases']].map(([id, label]) => <Link className="card card-pad font-semibold hover:border-saffron-400" key={id} to={`?row=tile:${id}`}>{label} →</Link>)}</div></section>;
  if (q.isLoading) return <p>Loading...</p>;
  if (q.error) return <p>This number cannot be opened ({q.error.message}).</p>;
  const d = q.data;
  if (d.result === 'UNKNOWN') return <p>Not available: <CodeText value={d.reason} /></p>;
  const cases = d.cases || [];
  const filtered = cases.filter(c => (!status || c.status === status) && (!bureau || (c.owningBureau || 'Unrouted') === bureau) && (!query.trim() || [c.masterCaseId, c.category, metadataLabel(c.subCategory), c.owningBureau, c.institutionPid].join(' ').toLowerCase().includes(query.trim().toLowerCase())));
  const sorted = [...filtered].sort((a,b) => String(a[sort.key] || '').localeCompare(String(b[sort.key] || ''), undefined, { numeric: true }) * (sort.asc ? 1 : -1));
  const size = 12, pages = Math.max(1, Math.ceil(sorted.length / size)), currentPage = Math.min(page, pages - 1);
  const updateSort = key => { setSort(current => ({ key, asc: current.key === key ? !current.asc : true })); setPage(0); };
  return (
    <div className="mx-auto max-w-6xl space-y-5 font-sans">
      <Link to="/impact" className="inline-flex items-center gap-2 text-xs font-semibold text-saffron-800 hover:underline"><Icon name="arrow" className="h-3 w-3 rotate-180"/>Back to insights</Link>
      <header className="overflow-hidden rounded-2xl border border-saffron-200 bg-white shadow-sm"><div className="h-1 bg-gradient-to-r from-saffron-500 to-amber-200"/><div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6"><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-saffron-50 text-saffron-700"><Icon name="inbox" className="h-5 w-5"/></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-saffron-700">Explore the records</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-950">{measureName(d.rowId || row)}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{d.count} cases. Scope: {d.scope}</p></div></div><span className="rounded-full border border-saffron-200 bg-saffron-50 px-3 py-1.5 text-xs font-semibold text-saffron-800">{d.count} cases in scope</span></div>
        {(d.transfers || d.pairs) && <div className="border-t border-saffron-100 bg-saffron-50/40 px-5 py-3 text-xs leading-6 text-slate-600 sm:px-6">{d.transfers && <p>{d.transfers.length} delayed transfers across these cases.</p>}{d.pairs && <p>{d.pairs.length} overlap pairs; restricted entries {d.restrictedEntries}.</p>}</div>}
      </header>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Case explorer">
        <div className="grid items-end gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_auto] sm:p-5"><label className="text-xs font-semibold text-slate-600">Search cases<input aria-label="Search cases" className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-saffron-400 focus:ring-4 focus:ring-saffron-100" placeholder="Case ID, category or institution PID" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }}/></label><label className="text-xs font-semibold text-slate-600">Status<select aria-label="Filter cases by status" className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 p-2 text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">All statuses</option>{[...new Set(cases.map(c => c.status).filter(Boolean))].sort().map(value => <option key={value}>{value}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Bureau<select aria-label="Filter cases by bureau" className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 p-2 text-sm" value={bureau} onChange={e => { setBureau(e.target.value); setPage(0); }}><option value="">All bureaus</option>{[...new Set(cases.map(c => c.owningBureau || 'Unrouted'))].sort().map(value => <option key={value}>{value}</option>)}</select></label><button type="button" className="min-h-10 rounded-lg px-3 text-xs font-semibold text-saffron-800 hover:bg-saffron-50 disabled:opacity-40" disabled={!query && !status && !bureau} onClick={() => { setQuery(''); setStatus(''); setBureau(''); setPage(0); }}>Clear filters</button></div>
        <div className="flex flex-wrap justify-between gap-2 px-5 py-3 text-xs text-slate-500"><span aria-live="polite">{sorted.length} of {cases.length} loaded cases match</span><span>Select a case to open its journey · click a heading to sort</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm bg-white">
        <thead><tr className="text-left">{[['masterCaseId','Case'],['category','Category'],['status','Status'],['owningBureau','Bureau'],['institutionPid','Institution']].map(([key,label]) => <th key={key} scope="col" aria-sort={sort.key === key ? (sort.asc ? 'ascending' : 'descending') : 'none'}><button type="button" className={`inline-flex items-center gap-2 py-1 text-[11px] font-bold uppercase tracking-wide hover:text-saffron-700 ${sort.key === key ? 'text-saffron-800' : ''}`} onClick={() => updateSort(key)}>{label}<span aria-hidden="true">{sort.key === key ? (sort.asc ? '↑' : '↓') : '↕'}</span></button></th>)}</tr></thead>
        <tbody>
          {sorted.slice(currentPage * size, (currentPage + 1) * size).map(c => (
            <tr key={c.masterCaseId} className="transition hover:bg-saffron-50/70">
              <td className="whitespace-nowrap font-mono text-xs"><Link className="font-semibold text-saffron-800 underline decoration-saffron-200 underline-offset-4" to={`/cases/${c.masterCaseId}`}>{c.masterCaseId}</Link></td><td className="max-w-xs leading-6">{c.category} / {metadataLabel(c.subCategory)}</td><td><StatusChip value={c.status} /></td><td className="text-xs leading-5 text-slate-600">{c.owningBureau || 'Unrouted'}</td>
              <td className="whitespace-nowrap font-mono text-xs"><Link className="text-saffron-800 underline decoration-saffron-200 underline-offset-4" to={`/institutions/${c.institutionPid}`}>{c.institutionPid}</Link></td>
            </tr>
          ))}
          {sorted.length === 0 && <tr><td colSpan={5}><div className="py-10 text-center"><Icon name="search" className="mx-auto mb-3 h-7 w-7 text-saffron-500"/><p className="font-semibold text-ink-900">No cases match these filters</p><p className="mt-1 text-xs text-slate-500">Try another keyword or clear the filters.</p></div></td></tr>}
        </tbody>
      </table></div>
      <nav aria-label="Case explorer pages" className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 text-xs"><button className="btn-secondary text-xs" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span className="text-slate-500">Page {currentPage + 1} of {pages}</span><button className="btn-secondary text-xs" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>Next</button></nav>
      </section>
    </div>
  );
}
