import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/index.js';
import { request } from './api.jsx';
export default function ActionCheck({ onProceed = () => {} }) {
  const { t } = useI18n();
  const [caseId, setCaseId] = useState(''), [actionType, setType] = useState('DOCUMENT_REQUEST'), [subject, setSubject] = useState(''), [direction, setDirection] = useState('ALLOW');
  const [result, setResult] = useState(null), [message, setMessage] = useState(''), [reason, setReason] = useState('');
  async function check(event) {
    event.preventDefault(); setMessage(''); setResult(null); setReason('');
    try { setResult(await request('/prevent/check-action', {caseId,actionType,details:{subject,...(actionType==='INSTRUCTION'?{direction}:{})}})); }
    catch { setMessage(t('s4Unavailable')); }
  }
  async function proceed() {
    try { if (result?.checkId) { await request(`/prevent/check-action/${result.checkId}/proceed`, { reason }); setMessage(t('s4Proceeded')); } else setMessage(t('s4ChoiceUnavailable')); }
    catch { setMessage(t('s4ChoiceUnavailable')); }
    onProceed();
  }
  const bureauLabel = (value) => ({ RB: 'Regulation Bureau', PGRC: 'PGRC', AB: 'Academic Bureau', APB: 'Approval Bureau', regional_officer: 'Regional Office' }[value] || value);
  const actionLabel = (value) => ({ INSPECTION: 'inspection', DOCUMENT_REQUEST: 'document request', NOTICE: 'notice', INSTRUCTION: 'instruction' }[value] || 'action');
  return <section className="border rounded-xl border-slate-200 bg-white p-4 space-y-3 shadow-sm"><h2 className="font-bold text-lg">{t('s4CheckAction')}</h2><p>{t('s4Advisory')}</p>
    <form onSubmit={check} className="space-y-3"><label className="block">{t('s4CaseId')}<input className="border p-2 block" value={caseId} onChange={e=>{setCaseId(e.target.value);setResult(null);}} required /></label>
      <label className="block">{t('s4ActionType')}<select className="border p-2 block" value={actionType} onChange={e=>{setType(e.target.value);setResult(null);}}>{['DOCUMENT_REQUEST','INSTRUCTION','INSPECTION','NOTICE','OTHER'].map(type=><option key={type} value={type}>{t(`s4_${type}`)}</option>)}</select></label>
      <label className="block">{t('s4Subject')}<input className="border p-2 block" value={subject} onChange={e=>{setSubject(e.target.value);setResult(null);}} required /></label>
      {actionType==='INSTRUCTION' && <label>{t('s4Direction')}<select value={direction} onChange={e=>{setDirection(e.target.value);setResult(null);}}><option value="ALLOW">{t('s4_ALLOW')}</option><option value="DENY">{t('s4_DENY')}</option></select></label>}
      <button type="submit" className="border rounded px-3 py-2">{t('s4Check')}</button></form>
    {result && <div className={`rounded-lg border p-3 ${result.result === 'REVIEW' ? 'border-amber-300 bg-amber-50' : result.result === 'CLEAR' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`} role="status">
      {result.result === 'REVIEW' ? <><h3 className="font-bold text-amber-950">Potential overlapping action</h3>
        {result.relatedCases.map((row, i) => <p key={`${row.caseId}-${i}`} className="mt-1 text-sm">{bureauLabel(row.bureau)} {actionLabel(row.actionType)} at this college on {new Date(row.at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, case {row.caseId}</p>)}
        <div className="mt-2 text-sm">{result.reasons.map(code => <p key={code}>{t(`s4_${code}`)}</p>)}</div>
        <div className="mt-1 text-sm text-slate-500">{result.counterReasons.map(code => <p key={code}>{t(`s4_${code}`)}</p>)}</div>
        <div className="mt-3 flex flex-wrap gap-2"><Link className="rounded-lg border border-amber-500 bg-white px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2" to={`/sync?pid=${encodeURIComponent(result.institutionPid || '')}&cases=${encodeURIComponent([caseId, ...result.relatedCases.map(row => row.caseId)].join(','))}`}>Coordinate via NEXUS SYNC</Link>
          <label className="flex-1 text-sm">Reason to proceed anyway<textarea aria-label="Reason to proceed anyway" className="mt-1 block w-full rounded border p-2" value={reason} onChange={e => setReason(e.target.value)} required /></label>
          <button type="button" disabled={!reason.trim()} className="rounded-lg bg-ink-900 px-3 py-2 text-white disabled:opacity-50" onClick={proceed}>Proceed anyway</button></div>
      </> : <><p className="text-sm font-medium">{result.result === 'CLEAR' ? 'No overlapping action found' : 'Not available: the action check is incomplete'}</p><div className="mt-2 text-sm">{result.reasons?.map(code=><p key={code}>{t(`s4_${code}`)}</p>)}</div><div className="mt-1 text-sm text-slate-500">{result.counterReasons?.map(code=><p key={code}>{t(`s4_${code}`)}</p>)}</div></>}
    </div>}
    {result && result.result !== 'REVIEW' && <button type="button" className="rounded-lg bg-ink-900 px-3 py-2 text-white" onClick={proceed}>{t('s4Proceed')}</button>}{message && <p role="alert">{message}</p>}
  </section>;
}
