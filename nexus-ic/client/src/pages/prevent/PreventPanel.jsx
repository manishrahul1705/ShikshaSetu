import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/index.js';
import { request } from './api.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
export default function PreventPanel({ draft, onContinue = () => {}, onCancel = () => {} }) {
  const { t } = useI18n(), navigate = useNavigate();
  const { user } = useAuth();
  const [stored, setStored] = useState(null), [error, setError] = useState('');
  const result = stored?.owner === user?.id ? stored?.value : null;
  const panel = useRef(null);
  const payload = JSON.stringify(draft);
  useEffect(() => {
    let current = true; const owner = user?.id; setStored(null); setError('');
    request('/grievances/check-similar', JSON.parse(payload)).then(value => { if (current) setStored({owner,value}); }).catch(() => { if (current) setError(t('s4Unavailable')); });
    return () => { current = false; };
  }, [payload, user?.id]);
  useEffect(() => {
    // Bridge the existing preview buttons without changing S1b's handlers or
    // blocking their actions. Only this panel owns the additional DOM listener.
    const preview = panel.current?.parentElement;
    const recordExistingChoice = event => {
      const button = event.target.closest?.('button');
      if (!result || !button || panel.current?.contains(button)) return;
      const label = button.textContent.trim();
      const choice = label === t('confirmAndSubmit') ? 'continue' : label === t('editGrievance') ? 'cancel' : null;
      if (choice) request('/grievances/check-similar/choice', {checkId: result.checkId, choice}).catch(() => setError(t('s4ChoiceUnavailable')));
    };
    preview?.addEventListener('click', recordExistingChoice, true);
    return () => preview?.removeEventListener('click', recordExistingChoice, true);
  }, [result, t]);
  async function choose(choice, caseId) {
    try { if (result) await request('/grievances/check-similar/choice', {checkId:result.checkId, choice, ...(caseId ? {caseId} : {})}); }
    catch { setError(t('s4ChoiceUnavailable')); }
    // Advice and logging availability never become a submission gate.
    if (choice === 'continue') onContinue();
    if (choice === 'cancel') onCancel();
    if (choice === 'view' && caseId) navigate(`/track/${encodeURIComponent(caseId)}`);
  }
  return <section ref={panel} className="border rounded-lg p-4 space-y-3 my-4" aria-label="AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)">
    <h3 className="font-bold">AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)</h3><p>{t('s4Advisory')}</p>
    <p role="status">{result?.result || 'UNKNOWN'} {result?.synthetic && t('s4Demo')}</p>
    {error && <p role="alert">{error}</p>}
    {result?.reasons?.map(reason => <p key={reason}>{t(`s4_${reason}`)}</p>)}
    {result?.hints?.map((hint, i) => <article key={hint.caseId || i} className="bg-amber-50 p-3 rounded">
      <p>{hint.generic ? 'a similar open matter exists' : hint.caseId}</p>
      {hint.signals?.map(signal => <p key={signal.name}>{t(`s4_${signal.name}`)}: {signal.contribution.toFixed(2)} / {signal.weight} — {t(`s4_${signal.reason}`)}</p>)}
      {hint.reasons?.map(reason => <p key={reason}>{t(`s4_${reason}`)}</p>)}
      {hint.counterReasons?.map(reason => <p key={reason}>{t(`s4_${reason}`)}</p>)}
      {!hint.generic && <button type="button" onClick={() => choose('view', hint.caseId)} className="underline">{t('s4ViewEarlier')}</button>}
    </article>)}
    <div className="flex flex-wrap gap-3"><button type="button" className="bg-blue-900 text-white rounded px-3 py-2" onClick={() => choose('continue')}>{t('s4Continue')}</button><button type="button" onClick={() => choose('cancel')}>{t('s4Cancel')}</button></div>
  </section>;
}
