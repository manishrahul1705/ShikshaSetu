import React from 'react';
import { api, useText, useData, useAction, Frame, Button, ErrorNote, StateNote } from './TrustUI.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Metrics, EmptyState } from '../../components/ui/PageKit.jsx';
export default function Consents() {
  const ui = useText(), { t } = ui, query = useData('/consents');
  const withdraw = useAction((id) => api(`/consents/${id}/withdraw`, {}));
  const { user } = useAuth();
  // N51 opt-in: Retaliation Watch runs only while this consent is active; withdrawing it stops the watch.
  const watch = useAction(() => api('/consents', { userType: user?.role, purpose: 'retaliation_watch' }));
  const watching = query.data?.some((row) => row.purpose === 'retaliation_watch' && row.state === 'granted');
  return <Frame ui={ui} title="consents"><p className="bg-amber-50 p-4 rounded">{t('legalNote')}</p><StateNote query={query} t={t} /><ErrorNote error={withdraw.error || watch.error} t={t} />
    <Metrics items={[{label:'Recorded consents',value:query.data?.length},{label:'Active',value:query.data?.filter(row=>row.state==='granted').length},{label:'Withdrawn',value:query.data?.filter(row=>row.state==='withdrawn').length}]} />
    {['student', 'faculty'].includes(user?.role) && !watching && <section className="bg-white border rounded p-4 space-y-2"><p>{t('retaliationWatchHelp')}</p><Button disabled={watch.isPending} onClick={() => watch.mutate()}>{t('retaliationWatchOn')}</Button></section>}
    {query.data?.length === 0 && <EmptyState icon="lock" title={t('empty')} text="Purpose-bound consent records appear when you begin verification." to="/verify" action={t('verify')} />}{query.data?.map((row) => <article className="card card-pad space-y-2" key={row.id}><p>{t('reporterId')}: {row.reporterId}</p><p>{t('purpose')}: {t(row.purpose)}</p><p>{t('scope')}: {t(row.scope)}</p><p>{t('grantedAt')}: {new Date(row.grantedAt).toLocaleString()}</p><p>{t('status')}: {t(row.state)}</p>{row.withdrawnAt && <p>{t('withdrawnAt')}: {new Date(row.withdrawnAt).toLocaleString()}</p>}<Button disabled={row.state === 'withdrawn' || withdraw.isPending} onClick={() => withdraw.mutate(row.id)}>{t('withdraw')}</Button></article>)}
  </Frame>;
}
