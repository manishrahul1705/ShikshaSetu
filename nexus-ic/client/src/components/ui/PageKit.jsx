import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export const codeLabel = value => ({
  CPGRAMS_SIMULATOR: 'CPGRAMS reference',
  EMAIL_SIMULATOR: 'Email reference', ABC_SIMULATOR: 'ABC verification reference',
  'Email intake (EmailSimulator)': 'Email intake',
  'External biometric feed simulator not connected in this phase': 'Not available: attendance feed is not connected',
  POLICY_NOT_CONFIGURED: 'No approved policy', NO_BENCHMARK_RUN: 'No benchmark has been recorded',
  LOW_CONFIDENCE: 'Routing needs review', IDENTITY_REVIEW: 'Identity review required',
  UNKNOWN: 'Not available', REQUESTED: 'Awaiting acceptance', NONE: 'No transfer',
  BULK_CASE_ACCESS: 'High volume of case views', REPEATED_REVEAL_REQUESTS: 'Repeated identity requests',
  OUT_OF_SCOPE_SEARCH: 'Repeated searches outside scope', UNUSUAL_EXPORT: 'Unusual export activity',
  NO_EVENT_FOR_DAYS: 'No recent progress recorded', TRANSFER_ACK_OVERDUE: 'Transfer acknowledgement overdue',
  TASK_OVERDUE_TWICE: 'Task deadlines missed', THREE_OR_MORE_TRANSFERS: 'Repeated transfers',
  RB: 'Regulation Bureau', PGRC: 'Public Grievance Redressal Cell', AB: 'Academic Bureau', APB: 'Approval Process Bureau', SEB: 'Skill Education Bureau', TL: 'Training and Learning', RO: 'Regional Office',
}[value] || (/^[A-Z_]+$/.test(String(value)) ? String(value).replaceAll('_', ' ').toLowerCase().replace(/^\w/, char => char.toUpperCase()) : String(value ?? 'Not available')));
export function CodeText({ value }) { return <span title={String(value ?? '')}>{codeLabel(value)}</span>; }
export function StatusChip({ value }) {
  const done = /closed|accepted|approved|complete|upheld/i.test(value || '');
  return <span title={String(value || '')} className={`chip ${done ? 'bg-bharat-50 text-bharat-700' : 'bg-saffron-50 text-saffron-800'}`}>{codeLabel(value)}</span>;
}
export function PageHeader({ eyebrow, title, purpose, children }) {
  return <header className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="eyebrow">{eyebrow}</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{purpose}</p></div>{children}</header>;
}
export function Metrics({ items }) {
  const columns=items.length===4?'sm:grid-cols-2 xl:grid-cols-4':items.length===1?'':'sm:grid-cols-3';
  return <div className={`grid grid-cols-1 gap-4 ${columns}`}>{items.map(item => <div key={item.label} className="card card-pad"><p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{item.label}</p><p className={`mt-3 font-extrabold text-ink-950 ${String(item.value??'Not available').length>9?'text-xl':'text-3xl'}`}>{item.value ?? 'Not available'}</p>{item.note && <p className="mt-2 text-xs text-ink-500">{item.note}</p>}</div>)}</div>;
}
export function EmptyState({ icon = 'inbox', title, text, to, action, onAction }) {
  return <div className="card card-pad flex flex-col items-center gap-3 py-10 text-center"><div className="rounded-2xl bg-ink-50 p-4 text-ink-700"><Icon name={icon} className="h-7 w-7" /></div><h2 className="text-lg font-bold text-ink-950">{title}</h2><p className="max-w-lg text-sm text-ink-500">{text}</p>{to ? <Link to={to} className="btn-primary">{action || 'Open workspace'}</Link> : onAction ? <button onClick={onAction} className="btn-primary">{action || 'Refresh'}</button> : null}</div>;
}
export function SyntheticDataBadge({ className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border border-saffron-200 bg-saffron-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-saffron-800 ${className}`} title="Local environment; not an official government record">Local environment</span>;
}
export function LoadingSkeleton({ rows = 3 }) {
  return <div className="card card-pad space-y-3" aria-label="Loading"><div className="h-4 w-1/3 animate-pulse rounded bg-ink-100" />{Array.from({ length: rows }, (_, index) => <div key={index} className="h-10 animate-pulse rounded bg-ink-50" />)}</div>;
}
export function SortableTable({ rows = [], columns = [], empty = 'No records match the current filters.', label = 'Filter table', pageSize = 12 }) {
  const [sort, setSort] = React.useState({ key: columns[0]?.key || '', direction: 'asc' });
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const filtered = rows.filter(row => !query || columns.some(column => String(row[column.key] ?? '').toLowerCase().includes(query.toLowerCase())));
  const sorted = [...filtered].sort((a, b) => {
    const left = String(a[sort.key] ?? '').toLowerCase(), right = String(b[sort.key] ?? '').toLowerCase();
    return left.localeCompare(right, undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1);
  });
  const toggle = key => { setSort(current => current.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }); setPage(0); };
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize)), currentPage = Math.min(page, pages - 1);
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3"><label className="min-w-0 flex-1 text-xs font-semibold text-slate-500">{label}<input aria-label={label} value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Type to filter records" className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 p-2 text-sm sm:max-w-sm" /></label><span className="text-xs text-slate-500" aria-live="polite">{sorted.length} of {rows.length} records</span>{query && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-saffron-800 hover:bg-saffron-50" onClick={() => { setQuery(''); setPage(0); }}>Clear search</button>}</div>{sorted.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-saffron-50/60 text-xs uppercase tracking-wide text-ink-500"><tr>{columns.map(column => <th key={column.key} scope="col" aria-sort={sort.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-4 py-3"><button type="button" className="whitespace-nowrap font-bold hover:text-saffron-700" onClick={() => toggle(column.key)}>{column.label} {sort.key === column.key ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</button></th>)}</tr></thead><tbody className="divide-y divide-slate-100">{sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((row, index) => <tr key={row.id || row.rowId || index} className="hover:bg-saffron-50/40">{columns.map(column => <td key={column.key} className="px-4 py-3 text-ink-800">{column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '—')}</td>)}</tr>)}</tbody></table></div> : <p className="p-8 text-center text-sm text-slate-500">{empty}</p>}<nav aria-label={`${label} pages`} className="flex items-center justify-between gap-3 border-t border-slate-100 p-3 text-xs"><button type="button" className="btn-secondary text-xs" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span className="text-slate-500">Page {currentPage + 1} of {pages}</span><button type="button" className="btn-secondary text-xs" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></nav></div>;
}
export function QueueFilter({ query, setQuery, status, setStatus, statuses = [] }) {
  return <div className="card card-pad flex flex-wrap gap-3"><label className="min-w-0 flex-1 text-xs font-semibold text-ink-500">Search queue<input aria-label="Search queue" value={query} onChange={event => setQuery(event.target.value)} placeholder="Case ID, office or reason" className="mt-1 block w-full rounded-lg border border-ink-200 p-2.5 text-sm text-ink-950" /></label>{statuses.length > 0 && <label className="text-xs font-semibold text-ink-500">Status<select aria-label="Queue status" value={status} onChange={event => setStatus(event.target.value)} className="mt-1 block rounded-lg border border-ink-200 p-2.5 text-sm text-ink-950"><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{codeLabel(value)}</option>)}</select></label>}</div>;
}
export function Pagination({ page, setPage, total, size = 12 }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return <nav aria-label="Case pages" className="flex items-center justify-between gap-3 text-xs"><button className="btn-secondary" disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span>{total} cases · page {page+1} of {pages}</span><button className="btn-secondary" disabled={page+1>=pages} onClick={()=>setPage(page+1)}>Next</button></nav>;
}
