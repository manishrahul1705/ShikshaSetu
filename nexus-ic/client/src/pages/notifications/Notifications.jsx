import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useS5 } from '../closure/api.jsx';
import { PageHeader, EmptyState, CodeText } from '../../components/ui/PageKit.jsx';

export default function Notifications() {
  const q = useS5('/notifications');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [oldest, setOldest] = useState(false);
  if (q.isLoading) return <p role="status">Loading notifications...</p>;
  if (q.error) return <div className="card card-pad" role="alert">Notifications are unavailable. <button className="btn-secondary ml-2" onClick={() => q.refetch()}>Try again</button></div>;
  const items = q.data?.items || [];
  const kinds = [...new Set(items.map(i => i.kind))].sort();
  const filtered = items.filter(i => (!kind || i.kind === kind) && `${i.kind} ${i.text}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (new Date(b.at) - new Date(a.at)) * (oldest ? -1 : 1));
  return <div className="max-w-3xl mx-auto space-y-4">
    <PageHeader eyebrow="YOUR WORKSPACE" title="Notifications" purpose="Updates and requests that need your attention." />
    <div className="card card-pad border-t-4 border-t-orange-400 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Search notifications<input type="search" className="input w-full mt-1" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search an update or request" /></label>
        <label className="text-sm">Notification type<select className="input w-full mt-1" value={kind} onChange={e => setKind(e.target.value)}><option value="">All types</option>{kinds.map(k => <option key={k} value={k}>{k.replaceAll('_', ' ')}</option>)}</select></label>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm"><span role="status">{filtered.length} of {items.length} notifications</span><button className="btn-secondary" onClick={() => setOldest(!oldest)}>{oldest ? 'Oldest first' : 'Newest first'}</button>{(search || kind) && <button className="text-orange-800 underline" onClick={() => {setSearch(''); setKind('');}}>Clear filters</button>}</div>
    </div>
    <p className="text-xs text-slate-500">Email and SMS delivery: sandbox</p>
    {items.length === 0 && <EmptyState icon="bell" title="You are up to date" text="New case updates and requests will appear here." to="/dashboard" action="Open command centre" />}
    {items.length > 0 && filtered.length === 0 && <p className="card card-pad" role="status">No notifications match your filters.</p>}
    <ul className="space-y-3">{filtered.map((i, k) => <li key={`${i.at}-${k}`} className="card card-pad text-sm border-l-4 border-l-orange-300 transition-shadow hover:shadow-md">
      <span className="block text-xs font-bold text-orange-800 mb-2"><CodeText value={i.kind} /></span>
      <p>{String(i.text || '').replace(/^AWAAZ DASTAK(?=: case )/, 'ShikshaSetu')}</p>
      <div className="flex flex-wrap justify-between items-center gap-3 mt-3"><time dateTime={i.at} className="text-xs text-slate-500">{new Date(i.at).toLocaleString()}</time><Link className="btn-secondary" aria-label={`Open notification: ${i.kind}`} to={i.link}>View update</Link></div>
    </li>)}</ul>
  </div>;
}
