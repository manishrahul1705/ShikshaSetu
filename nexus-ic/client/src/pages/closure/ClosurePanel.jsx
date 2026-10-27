import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useS5, useS5Action, ErrorLine } from './api.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';

/**
 * NEXUS PROOF closure panel (N22, N76) at /closure/:caseId.
 * Shows the four gate checks. The Close button stays disabled until all four
 * pass; the server refuses it anyway (the UI never decides).
 */
const CHECKS = [
  ['tasksComplete', 'Every task complete'],
  ['transfersAcknowledged', 'Every transfer acknowledged'],
  ['evidenceAttached', 'Evidence attached'],
  ['approvalExists', 'Approval exists (approver differs from proposer)'],
];

export default function ClosurePanel() {
  const { caseId } = useParams();
  const { user } = useAuth();
  const path = `/cases/${caseId}/closure`;
  const view = useS5(path);
  const [reason, setReason] = useState('');
  const [docs, setDocs] = useState('');
  const ids = () => docs.split(',').map((s) => s.trim()).filter(Boolean);
  const propose = useS5Action(`${path}/propose`, 'POST', [path]);
  const evidence = useS5Action(`${path}/evidence`, 'POST', [path]);
  const approve = useS5Action(`${path}/approve`, 'POST', [path]);
  const close = useS5Action(`${path}/close`, 'POST', [path]);
  if (view.isLoading) return <p>Loading...</p>;
  if (view.error) return <p>Case not found.</p>;
  const v = view.data;
  const current = [...v.records].reverse().find((r) => ['PROPOSED', 'APPROVED'].includes(r.state));
  const canApprove = ['supervisor', 'competent_authority'].includes(user?.role) && current?.state === 'PROPOSED';
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">NEXUS PROOF: {v.masterCaseId}</h1>
      <p>Status: <strong>{v.status}</strong>. The system never closes a case on its own.</p>
      <section aria-label="Closure gate" className="border rounded p-4 bg-white">
        <h2 className="font-semibold">Closure gate</h2>
        <ul>
          {CHECKS.map(([key, text]) => <li key={key}>{text}: <strong>{v.gate[key]}</strong></li>)}
        </ul>
        <p className="text-xs">Rule: <RuleVersion value={v.gate.ruleVersion} family="Closure rule" /></p>
      </section>
      {!current && v.status !== 'Closed' && (
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); propose.mutate({ closureReason: reason, evidenceDocumentIds: ids() }); }}>
          <h2 className="font-semibold">Propose resolution</h2>
          <label className="block text-sm">Closure reason (required)
            <textarea aria-label="Closure reason" required className="w-full border rounded p-2" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <label className="block text-sm">Evidence document IDs (comma separated)
            <input aria-label="Evidence document IDs" className="w-full border rounded p-1" value={docs} onChange={(e) => setDocs(e.target.value)} />
          </label>
          <button className="px-3 py-1 bg-blue-900 text-white rounded" type="submit">Propose</button>
          <ErrorLine error={propose.error} />
        </form>
      )}
      {current?.state === 'PROPOSED' && (
        <div className="space-y-2">
          <p>Proposed: {current.closureReason}. Packet hash <code>{current.packetHash.slice(0, 16)}</code></p>
          <input aria-label="More evidence document IDs" className="border rounded p-1" value={docs} onChange={(e) => setDocs(e.target.value)} />
          <button className="ml-2 px-3 py-1 border rounded" onClick={() => evidence.mutate({ documentIds: ids() })}>Attach evidence</button>
          {canApprove && <button className="ml-2 px-3 py-1 bg-green-800 text-white rounded" onClick={() => approve.mutate({})}>Approve</button>}
          <ErrorLine error={evidence.error || approve.error} />
        </div>
      )}
      {v.status !== 'Closed' && (
        <div>
          <button className="px-3 py-1 bg-slate-900 text-white rounded disabled:opacity-40" disabled={!v.gate.passed} onClick={() => close.mutate({})}>Close case</button>
          {!v.gate.passed && <p className="text-xs">Closing is blocked until all four checks pass.</p>}
          <ErrorLine error={close.error} />
        </div>
      )}
      <section>
        <h2 className="font-semibold">Complainant feedback (for reviewers)</h2>
        {v.feedback.length === 0 ? <p className="text-sm">No feedback yet.</p> : v.feedback.map((f, i) => <p key={i} className="text-sm">Rating {f.rating}: {f.text}</p>)}
      </section>
    </div>
  );
}
