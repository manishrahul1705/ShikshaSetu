import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import InstitutionPicker from '../../components/InstitutionPicker.jsx';
import { useS5, s5Request } from '../../pages/closure/api.jsx';

export default function CombinedRequests({ institutionPid }) {
  const { user } = useAuth();
  const [search] = useSearchParams();
  const [pid, setPid] = useState(institutionPid || search.get('pid') || '');
  const [selected, setSelected] = useState([]), [cover, setCover] = useState('Please respond to each item below. Each office will review its own response.');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [responses, setResponses] = useState({});
  const institution = user?.role === 'institution_admin';
  const locker = useS5('/locker', institution);
  const [documents, setDocuments] = useState({});
  const q = useS5(`/combined-requests?pid=${encodeURIComponent(pid)}`, institution || !!pid);
  const eligible = useS5(`/combined-requests/eligible?pid=${encodeURIComponent(pid)}`, !institution && !!pid);
  const counts = useS5(`/combined-requests/counts?pid=${encodeURIComponent(pid)}`, !institution && !!pid);
  async function act(path, body) {
    setBusy(true); setError('');
    try { await s5Request(path, { method: 'POST', body }); await q.refetch(); if (!institution) { await eligible.refetch(); await counts.refetch(); } setSelected([]); }
    catch (e) { setError(e.message.replaceAll('_', ' ').toLowerCase()); }
    finally { setBusy(false); }
  }
  return <div className="max-w-6xl mx-auto space-y-6">
    <header><p className="eyebrow">NEXUS SYNC</p><h1 className="text-3xl font-bold text-ink-950">One combined request</h1><p className="text-slate-600 mt-2">One reference for the institution. Each office keeps responsibility for its own items.</p></header>
    {!institution && !institutionPid && <InstitutionPicker onSelect={i => { setPid(i.pid); setSelected([]); }} />}
    {counts.data && <p className="card card-pad font-semibold">Requests combined: {counts.data.numerator} of {counts.data.denominator} eligible <span className="block text-sm font-normal text-slate-500">{counts.data.scope}; counted as query items.</span></p>}
    {(error || q.error) && <p role="alert" className="text-red-700">{error || 'Requests could not be loaded.'}</p>}
    {q.isLoading && <p role="status">Loading requests…</p>}
    {!institution && eligible.data?.length > 0 && <form className="card card-pad space-y-4" onSubmit={e => { e.preventDefault(); act('/combined-requests', { institutionPid: pid, queryIds: selected, coverNote: cover }); }}>
      <h2 className="card-title">Combine into one request to the institution</h2>
      {eligible.data.map(i => <label className="flex gap-3 p-3 border rounded" key={i.queryId}><input type="checkbox" checked={selected.includes(i.queryId)} onChange={e => setSelected(e.target.checked ? [...selected, i.queryId] : selected.filter(id => id !== i.queryId))} /><span><strong>{i.office}</strong> · {i.caseId}<span className="block">{i.text}</span></span></label>)}
      <label className="block">Cover note<textarea className="block w-full mt-1" value={cover} onChange={e => setCover(e.target.value)} required maxLength={2000} /></label>
      <button className="btn-primary" disabled={busy || selected.length < 2}>Propose selected items</button><p className="text-sm text-slate-500">Select items from at least two offices. Each owning office must confirm.</p>
    </form>}
    {q.data?.length === 0 && <p className="card card-pad">No combined requests yet. Requests appear here after the offices propose their items.</p>}
    {q.data?.map(r => <section key={r.id} className="card card-pad space-y-4"><div className="flex justify-between gap-3"><h2 className="card-title">{r.reference}</h2><span className="chip bg-ink-50">{r.status === 'ISSUED' ? 'Issued' : 'Awaiting office decisions'}</span></div><p>{r.coverNote}</p>
      {r.items.map(i => <article key={i.id} className="border rounded-xl p-4 space-y-2"><p className="text-sm text-slate-500">{i.office} · {i.role.replaceAll('_', ' ')} · {i.caseId}</p><p className="font-medium">{i.text}</p><p className="text-sm">Reply by: {i.replyBy ? new Date(i.replyBy).toLocaleDateString() : 'policy not configured'}</p>
        <p className="text-sm">{i.decision === 'WITHDRAWN' ? 'Withdrawn' : i.status === 'RESPONDED' ? 'Reply received' : i.decision === 'CONFIRMED' ? 'Confirmed by owning office' : 'Awaiting owning office'}</p>
        {i.canDecide && <div className="flex gap-2"><button className="btn-primary" disabled={busy} onClick={() => act(`/combined-requests/${r.id}/items/${i.id}/decision`, { decision: 'CONFIRMED' })}>Confirm own item</button><button className="btn-ghost" disabled={busy} onClick={() => act(`/combined-requests/${r.id}/items/${i.id}/decision`, { decision: 'WITHDRAWN' })}>Withdraw own item</button></div>}
        {i.documents?.map(v=><p key={v.id} className="text-sm"><Link className="underline" to={`/documents/locker?caseId=${encodeURIComponent(i.caseId)}`}>{v.documentType}, version {v.version}: view document access</Link></p>)}{i.response && <p className="bg-bharat-50 p-3 rounded">{i.response}</p>}
        {institution && i.status === 'PENDING' && <form onSubmit={e => { e.preventDefault(); act(`/combined-requests/${r.id}/items/${i.id}/reply`, { responseText: responses[i.id], lockerVersionIds: documents[i.id] || [] }); }}><label className="block">Reply to this item<textarea required className="w-full block mt-1" value={responses[i.id] || ''} onChange={e => setResponses({ ...responses, [i.id]: e.target.value })} /></label><fieldset className="my-3"><legend>Reuse submitted documents (optional)</legend>{locker.data?.versions.map(v=><label key={v.id} className="block text-sm"><input type="checkbox" checked={(documents[i.id] || []).includes(v.id)} onChange={e=>setDocuments({...documents,[i.id]:e.target.checked?[...(documents[i.id] || []),v.id]:(documents[i.id] || []).filter(id=>id!==v.id)})} /> {v.documentType}, version {v.version}</label>)}<p className="text-xs text-slate-500">Officers still need a case-specific access grant from the locker.</p></fieldset><button className="btn-primary mt-2" disabled={busy}>Send reply</button></form>}
      </article>)}
      {!institution && r.status === 'PROPOSED' && <button className="btn-accent" disabled={busy || r.items.some(i => i.decision === 'PENDING')} onClick={() => act(`/combined-requests/${r.id}/issue`, {})}>Issue combined request</button>}
    </section>)}
  </div>;
}
