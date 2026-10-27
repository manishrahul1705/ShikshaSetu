import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/index.js';
export default function InlinePreflight({ result, caseId, reason, onReason }) {
  const { t } = useI18n();
  if (!result) return null;
  return <section role="status" className={`rounded-xl border p-4 space-y-2 ${result.result === 'REVIEW' ? 'border-amber-300 bg-amber-50' : result.result === 'CLEAR' ? 'border-bharat-200 bg-bharat-50' : 'border-slate-200 bg-slate-50'}`}>
    <h3 className="font-bold">{result.result === 'REVIEW' ? 'Potential overlapping action' : result.result === 'CLEAR' ? 'No overlapping action found' : 'Not available: the action check is incomplete'}</h3>
    {result.relatedCases?.map((a,i)=><p key={i} className="text-sm">{a.bureau} · {String(a.actionType || 'action').toLowerCase().replaceAll('_',' ')} · {new Date(a.at).toLocaleDateString()} · {a.caseId}</p>)}
    {result.reasons?.map(r=><p key={r} className="text-sm">{t(`s4_${r}`)}</p>)}
    {result.counterReasons?.map(r=><p key={r} className="text-sm text-slate-500">{t(`s4_${r}`)}</p>)}
    {result.lockerDocument && <Link className="underline" to={`/documents/locker?caseId=${encodeURIComponent(caseId)}`}>Already submitted, version {result.lockerDocument.version}. Request access instead?</Link>}
    {result.result === 'REVIEW' && <><Link className="btn-ghost" to={`/sync?pid=${encodeURIComponent(result.institutionPid || '')}&cases=${encodeURIComponent([caseId,...(result.relatedCases || []).map(c=>c.caseId)].join(','))}`}>Coordinate via NEXUS SYNC</Link><label className="block text-sm">Reason to proceed anyway<textarea className="block w-full mt-1" value={reason} onChange={e=>onReason(e.target.value)} required /></label></>}
  </section>;
}
