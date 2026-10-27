import React, { useState } from 'react';
import TransferTimeline from '../trace/TransferTimeline.jsx';
import RuleVersion, { policyText } from '../../components/RuleVersion.jsx';

/** Only server-authorized case, routing and transfer views are used. */
export default function InstitutionCaseJourney({ masterCaseId }) {
  const [view, setView] = useState(null), [error, setError] = useState(false), [loading, setLoading] = useState(false);
  async function read(url) {
    const response = await fetch(`/api/v1${url}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Unavailable');
    return response.json();
  }
  async function open(event) {
    if (!event.currentTarget.open || view || loading) return;
    setLoading(true); setError(false);
    try {
      const c = await read(`/cases/${encodeURIComponent(masterCaseId)}`);
      const [decisions, transfers] = await Promise.all([read(`/routing/${c._id}/decision`), read(`/transfers/case/${encodeURIComponent(masterCaseId)}`)]);
      setView({ c, decisions, transfers });
    } catch { setError(true); }
    finally { setLoading(false); }
  }
  return <details className="mt-3 text-xs" onToggle={open}>
    <summary className="cursor-pointer font-semibold">Case journey: {masterCaseId}</summary>
    {loading && <p>Loading authorized case journey...</p>}
    {error && <p>UNKNOWN: case journey unavailable for this role.</p>}
    {view && <div className="space-y-3 mt-2">
      <p>Priority: {view.c.priority || 'UNKNOWN'}. Reason: {view.decisions[0]?.factors?.priority?.value === view.c.priority ? policyText(view.decisions[0].factors.priority.reason) : 'UNKNOWN (no matching recorded priority reason)'}.</p>
      {view.decisions.length === 0 && <p>Routing: UNKNOWN (no recorded decision).</p>}
      {view.decisions.map(d => <section key={d._id} aria-label={`Routing decision ${masterCaseId}`}>
        <h3 className="font-semibold">Routing Decision (Explainable)</h3>
        <p>Primary: {d.primary}. Secondary: {d.secondary || 'none'}. Confidence: {d.confidence}.</p>
        <p>Reason: {policyText(d.reasons.join('; '))}. Rule: <RuleVersion value={d.ruleVersion} family="Routing rule" />.</p>
      </section>)}
      <h3 className="font-semibold">Transfer history</h3>
      {view.transfers.length === 0 ? <p>No recorded transfers.</p> : view.transfers.map(t => <TransferTimeline key={t._id} transfer={t} />)}
    </div>}
  </details>;
}
