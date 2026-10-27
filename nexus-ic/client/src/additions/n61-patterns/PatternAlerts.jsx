import React from 'react';
import { useS5, Pct } from '../../pages/closure/api.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';
import { metadataText } from '../../components/metadataLabel.js';

/** N61: cross-institution pattern alerts beside IMPACT. Advisory; cites cases; synthetic. */
export default function PatternAlerts() {
  const q = useS5('/impact/patterns');
  if (q.isLoading || q.error || !Array.isArray(q.data?.alerts)) return null;
  const p = q.data;
  return (
    <section aria-label="Cross-institution patterns" className="border rounded p-3 bg-white text-sm space-y-1">
      <h2 className="font-semibold">Cross-institution pattern alerts</h2>
      <p className="text-xs"><RuleVersion value={p.ruleVersion} family="Pattern rule" />. Window {p.windowDays} days, minimum {p.minInstitutions} institutions.</p>
      {p.alerts.length === 0 && <p>No rising pattern in scope.</p>}
      {p.alerts.map((a) => (
        <div key={a.id} className="border-l-4 border-amber-500 pl-2">
          <p>{metadataText(a.suggestion)}.</p>
          <p className="text-xs">Share of institutions: <Pct p={a.share} />. Cites: {a.citedRows.join(', ')}</p>
        </div>
      ))}
    </section>
  );
}
