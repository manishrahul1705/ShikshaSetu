import React from 'react';
import { useParams } from 'react-router-dom';
import { useS5 } from '../../pages/closure/api.jsx';

/**
 * N50 at /overlap-timeline/:pid: two bureaus' actions side by side by time,
 * conflict points (existing PREVENT REVIEW checks) marked. Read-only.
 */
const when = (d) => new Date(d).toLocaleString();

function Event({ e }) {
  return (
    <li className="border rounded p-2 bg-white text-sm">
      <span className="font-semibold">{e.actionType}</span> at {when(e.at)}
      {e.opaque ? <span className="ml-1 text-slate-500">(other bureau, details withheld)</span> : e.restricted ? <span className="ml-1 text-slate-500">(restricted case)</span> : <span className="ml-1 font-mono">{e.masterCaseId}</span>}
    </li>
  );
}

export default function OverlapTimeline() {
  const { pid } = useParams();
  const q = useS5(`/overlap-timeline/${pid}`);
  if (q.isLoading) return <p>Loading...</p>;
  if (q.error) return <p>The timeline is unavailable.</p>;
  const t = q.data;
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Overlap timeline: {t.institutionPid}</h1>
      <p className="text-xs">Read-only view of PREVENT and SYNC actions.</p>
      <div className="grid grid-cols-2 gap-4">
        {t.lanes.map((lane) => (
          <section key={lane.bureau} aria-label={`Lane ${lane.bureau}`}>
            <h2 className="font-semibold">{lane.bureau}</h2>
            <ol className="space-y-2">{lane.events.map((e, i) => <Event key={i} e={e} />)}</ol>
          </section>
        ))}
        {t.lanes.length === 0 && <p>No recorded actions for this institution.</p>}
      </div>
      <section aria-label="Conflict points">
        <h2 className="font-semibold text-red-800">Conflict points</h2>
        {t.conflicts.length === 0 && <p className="text-sm">None recorded by PREVENT.</p>}
        <ul>
          {t.conflicts.map((c, i) => (
            <li key={i} className="text-sm border-l-4 border-red-600 pl-2 my-1">
              {when(c.at)}: {c.source} {c.result} for {c.actionType} by {c.bureau || 'unknown bureau'} ({c.reasons.join(', ') || 'no reasons'}){c.proceeded ? '; the officer proceeded' : ''}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
