import React, { useState, useEffect } from 'react';
import { Metrics, QueueFilter, EmptyState } from '../../components/ui/PageKit.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, useText, useData, useAction, Frame, Button, ErrorNote, StateNote, Field, inputClass } from './TrustUI.jsx';
export default function RevealRequests() {
  const ui = useText(), { t } = ui, { user } = useAuth();
  const [reporterId, setReporterId] = useState(''), [purpose, setPurpose] = useState(''), [visible, setVisible] = useState(null);
  const [search, setSearch] = useState(''), [status, setStatus] = useState('');
  const query = useData('/identity/reveal-requests');
  const request = useAction(() => api('/identity/reveal-requests', { reporterId, purpose }));
  const approve = useAction((id) => api(`/identity/reveal-requests/${id}/approve`, {}));
  // Reveal payload never enters the shared Query cache or browser storage.
  const [viewError, setViewError] = useState(null);
  useEffect(() => {
    const hide = () => setVisible(null);
    const timer = setInterval(() => { if (visible && Date.parse(visible.expiresAt) <= Date.now()) { hide(); query.refetch(); } }, 250);
    document.addEventListener('visibilitychange', hide);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', hide); };
  }, [visible, query.refetch]);
  async function view(id) {
    setVisible(null); setViewError(null);
    try { const result = await api(`/identity/reveal-requests/${id}/view`); if (document.visibilityState !== 'hidden' && Date.parse(result.expiresAt) > Date.now()) setVisible(result); }
    catch (error) { setViewError(error); }
  }
  const rows = (query.data || []).filter(row => (!status || row.state === status) && row.reporterId.toLowerCase().includes(search.toLowerCase()));
  return <Frame ui={ui} title="reveals"><p className="text-sm text-ink-500">{t('revealNote')}</p><Metrics items={[{label:'Recorded requests',value:query.data?.length},{label:'Awaiting approval',value:query.data?.filter(row=>row.state==='pending').length},{label:'Active approvals',value:query.data?.filter(row=>row.state==='approved').length}]} /><QueueFilter query={search} setQuery={setSearch} status={status} setStatus={setStatus} statuses={['pending','approved','expired']} /><details className="card card-pad"><summary className="cursor-pointer font-semibold">Request purpose-bound identity access</summary><form className="bg-white border p-5 rounded space-y-3" onSubmit={(e) => { e.preventDefault(); request.mutate(undefined, { onSuccess: () => setPurpose('') }); }}><Field label={t('reporterId')}><input className={inputClass} value={reporterId} pattern="RP-[A-Z0-9]{4}" required onChange={(e) => setReporterId(e.target.value)} /></Field><Field label={t('purpose')}><textarea className={inputClass} maxLength={500} required value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field><Button disabled={request.isPending}>{t('requestReveal')}</Button><ErrorNote error={request.error} t={t} /></form></details>
    <StateNote query={query} t={t} /><ErrorNote error={approve.error || viewError} t={t} />{query.data && rows.length === 0 && <EmptyState icon="key" title="No requests in this view" text="No identity requests match the selected filters. A new request needs a recorded purpose and a different approver." to="/dashboard" action="Return to workspace" />}
    {rows.map((row) => <article key={row.id} className="card card-pad space-y-3"><h2 className="font-bold">{row.reporterId}</h2><p>{t('status')}: {t(row.state)}</p><p>{t('purposeRecorded')}</p>{row.expiresAt && <p>{t('expiresAt')}: {new Date(row.expiresAt).toLocaleString()}</p>}<div className="flex gap-3">{row.state === 'pending' && row.canApprove !== false && ['supervisor', 'competent_authority'].includes(user.role) && <Button onClick={() => approve.mutate(row.id)} disabled={approve.isPending}>{t('approve')}</Button>}{row.state === 'approved' && row.canView !== false && <Button onClick={() => view(row.id)}>{t('viewIdentity')}</Button>}</div></article>)}
    {visible && Date.parse(visible.expiresAt) > Date.now() && <article className="border-2 border-amber-600 bg-amber-50 rounded p-6"><h2 className="font-bold">{t('identity')}</h2><p>{visible.reporterId}</p><dl>{Object.entries(visible.identity).map(([key, value]) => <div key={key} className="py-1"><dt className="font-semibold">{t(key)}</dt><dd>{typeof value === 'boolean' || value === null ? t(String(value)) : String(value)}</dd></div>)}</dl><Button onClick={() => setVisible(null)}>{t('hideIdentity')}</Button></article>}
  </Frame>;
}
