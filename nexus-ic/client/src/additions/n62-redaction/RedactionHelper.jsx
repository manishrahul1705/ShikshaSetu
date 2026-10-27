import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useS5, useS5Action, ErrorLine } from '../../pages/closure/api.jsx';

/**
 * N62 Redaction helper at /cases/:caseId/redaction. Highlights names, roll
 * numbers and phone numbers; the officer accepts or keeps each one. Confirm is
 * enabled only once every highlight has a decision.
 */
export default function RedactionHelper() {
  const { caseId } = useParams();
  const path = `/cases/${caseId}/redaction`;
  const q = useS5(path);
  const [decisions, setDecisions] = useState({});
  const confirm = useS5Action(`${path}/confirm`, 'POST', [path]);
  if (q.isLoading) return <p>Loading...</p>;
  if (q.error) return <p>Case not found.</p>;
  const { highlights, narrative, currentForm } = q.data;
  const complete = highlights.every((h) => typeof decisions[h.id] === 'boolean');
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Redaction helper: {q.data.masterCaseId}</h1>
      <p className="text-sm bg-slate-50 p-2 whitespace-pre-wrap">{narrative}</p>
      <ul className="space-y-1">
        {highlights.map((h) => (
          <li key={h.id} className="text-sm">
            <mark>{h.text}</mark> ({h.type.replace('_', ' ').toLowerCase()})
            <label className="ml-3"><input type="radio" name={h.id} aria-label={`Redact ${h.text}`} checked={decisions[h.id] === true} onChange={() => setDecisions({ ...decisions, [h.id]: true })} /> Redact</label>
            <label className="ml-3"><input type="radio" name={h.id} aria-label={`Keep ${h.text}`} checked={decisions[h.id] === false} onChange={() => setDecisions({ ...decisions, [h.id]: false })} /> Keep</label>
          </li>
        ))}
        {highlights.length === 0 && <li className="text-sm">No highlights found. Read the text yourself before confirming.</li>}
      </ul>
      <button className="px-3 py-1 bg-blue-900 text-white rounded disabled:opacity-40" disabled={!complete}
        onClick={() => confirm.mutate({ decisions: highlights.map((h) => ({ id: h.id, accept: decisions[h.id] })) })}>
        Confirm institution-facing form
      </button>
      <ErrorLine error={confirm.error} />
      {(confirm.data || currentForm) && <p className="text-sm border rounded p-2">Institution-facing form: {(confirm.data || currentForm).redactedText}</p>}
    </div>
  );
}
