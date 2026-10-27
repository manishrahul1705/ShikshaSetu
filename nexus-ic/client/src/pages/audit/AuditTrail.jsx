import React, { useState } from 'react';
import { useS5 } from '../closure/api.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';
import { PageHeader } from '../../components/ui/PageKit.jsx';
import { ROLE_LABELS } from '../../components/navigation.js';

/** Audit trail at /audit (SPEC 12.1): complete history of all actions, with the hash-chain check (S09). */
export default function AuditTrail() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const q = useS5(`/audit-trail?limit=300${action ? `&action=${encodeURIComponent(action)}` : ''}`);
  const events = (q.data?.events || []).filter(event => `${event.seq} ${event.actorRole} ${event.action} ${event.targetType} ${event.targetId}`.toLowerCase().includes(query.trim().toLowerCase()));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(events.length / 25) - 1));
  return (
    <div className="max-w-6xl mx-auto space-y-3">
      <PageHeader eyebrow="ACCOUNTABILITY & EVIDENCE" title="Audit trail" purpose="Inspect attributed events and verify the tamper-evident chain. Narrow the action filter to examine a particular workflow." />
      <label className="card card-pad block text-sm">Filter by action <input aria-label="Action filter" className="border rounded p-1 ml-2 max-w-full" value={action} onChange={(e) => {setAction(e.target.value);setPage(0);}} placeholder="e.g. closure.closed" /></label>
      <label className="block rounded-xl border border-saffron-100 bg-saffron-50/40 p-3 text-xs font-semibold text-slate-600">Search loaded events<input aria-label="Search loaded audit events" className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm" placeholder="Sequence, action, role or target" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }}/></label>
      {q.error && <p>The audit trail is unavailable for your role.</p>}
      {q.data && (
        <>
          <p className={`text-sm font-semibold ${q.data.chain.intact ? 'text-green-800' : 'text-red-800'}`}>
            Hash chain: {q.data.chain.intact ? `intact (${q.data.chain.count} events)` : `broken at seq ${q.data.chain.brokenSeq}`}. Loaded {q.data.events.length} of {q.data.total}.
          </p>
          <div className="card overflow-x-auto"><table className="w-full text-xs bg-white">
            <thead><tr className="text-left"><th>Seq</th><th>Time</th><th>Actor role</th><th>Action</th><th>Target</th><th>Hash</th></tr></thead>
            <tbody>{events.slice(currentPage*25,currentPage*25+25).map((e) => <tr key={e.seq} className="border-t"><td>{e.seq}</td><td>{new Date(e.at).toLocaleString()}</td><td title={e.actorRole}>{ROLE_LABELS[e.actorRole] || e.actorRole}</td><td className="font-mono">{e.action}</td><td>{e.targetType} {String(e.targetId || '').startsWith('DEMO-') ? <RuleVersion value={e.targetId} audit /> : e.targetId}</td><td className="font-mono">{e.hash.slice(0, 12)}</td></tr>)}</tbody>
          </table>{events.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No loaded events match your search.</p>}</div><nav aria-label="Audit pages" className="flex items-center justify-between gap-3 text-xs"><button className="btn-secondary" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</button><span>Page {currentPage+1} of {Math.max(1,Math.ceil(events.length/25))} · 25 events per page</span><button className="btn-secondary" disabled={(currentPage+1)*25>=events.length} onClick={()=>setPage(currentPage+1)}>Next</button></nav>
        </>
      )}
    </div>
  );
}
