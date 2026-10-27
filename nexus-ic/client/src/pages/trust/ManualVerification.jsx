import React, { useState } from 'react';
import { api, useText, useData, useAction, Frame, Button, ErrorNote, StateNote, Field, inputClass } from './TrustUI.jsx';
import { Metrics, EmptyState } from '../../components/ui/PageKit.jsx';
function Decision({ row, t }) {
  const [reason, setReason] = useState('');
  const action = useAction((decision) => api(`/identity/manual-verification/${row.reporterId}/decide`, { decision, reason }));
  return <article className="bg-white rounded border p-5 space-y-3"><h2 className="font-bold">{row.reporterId}</h2><p>{t(row.userType)} · {t(row.status)}</p><p>{t('signals')}: {row.signals.map((signal) => t(signal.type)).join(', ') || t('empty')}</p><Field label={t('reason')}><textarea className={inputClass} maxLength={500} required value={reason} onChange={(e) => setReason(e.target.value)} /></Field><div className="flex gap-3">{['approve', 'reject'].map((value) => <Button key={value} disabled={!reason.trim() || action.isPending} onClick={() => action.mutate(value)}>{t(value)}</Button>)}</div><ErrorNote error={action.error} t={t} /></article>;
}
export default function ManualVerification() {
  const ui = useText(), { t } = ui, query = useData('/identity/manual-verification');
  return <Frame ui={ui} title="manualQueue"><p>{t('fraudNote')}</p><Metrics items={[{label:'Awaiting review',value:query.data?.length,note:'Decisions require an attributed reason'}]} /><StateNote query={query} t={t} />{query.data?.length === 0 && <EmptyState icon="check" title={t('empty')} text="No identity verification is awaiting a decision in this queue." to="/dashboard" action="Return to command centre" />}{query.data?.map((row) => <Decision key={row.reporterId} row={row} t={t} />)}</Frame>;
}
