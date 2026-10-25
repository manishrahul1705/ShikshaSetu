import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useS5 } from '../../pages/closure/api.jsx';
import InstitutionPicker from '../../components/InstitutionPicker.jsx';
import './compare.css';

const labels = [
  ['lettersToCollege', 'Letters to the college'],
  ['acknowledgedTransfers', 'Acknowledged transfers'],
  ['repeatedDocumentRequestsFlagged', 'Repeated document requests flagged'],
];

function Counts({ values, source, scope }) {
  return <div className="mt-3"><div className="grid gap-2 sm:grid-cols-3">
    {labels.map(([key, label]) => <div className="rounded-xl border border-slate-200 bg-white p-4" key={key}>
      <p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-3xl font-extrabold text-ink-950">{values[key]}</p>
    </div>)}
  </div><p className="mt-2 text-xs opacity-80">Source: {source}. Scope: {scope}.</p></div>;
}

export default function ComparePage() {
  const [search, setSearch] = useSearchParams();
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(0);
  const selectedPid = search.get('pid') || '';
  const q = useS5(`/problem-comparison/${encodeURIComponent(selectedPid)}`, Boolean(selectedPid) && mode === 'demo');
  useEffect(() => { fetch('/api/v1/config/mode', { credentials: 'include' }).then((r) => r.json()).then((x) => setMode(x.mode)).catch(() => setMode('unknown')); }, []);
  if (mode === 'production') return <p>This walkthrough is not available in production mode.</p>;
  const fixed = q.data?.comparison?.illustrative || { lettersToCollege: 3, acknowledgedTransfers: 0, repeatedDocumentRequestsFlagged: 0 };
  const recorded = q.data?.recorded;
  return <div className="mx-auto max-w-7xl space-y-3">
    <header><p className="text-xs font-bold uppercase tracking-[.16em] text-saffron-700">Problem statement 26264</p>
      <h1 className="mt-1 text-3xl font-extrabold text-ink-950 sm:text-4xl">Today vs with ShikshaSetu</h1>
      <p className="mt-2 max-w-3xl text-slate-600">One college, two offices. Compare fragmented requests with the recorded coordinated workflow.</p></header>
    <details open={!selectedPid}><summary className="cursor-pointer text-sm">Choose another institution</summary><InstitutionPicker onSelect={i => { setSearch({pid:i.pid}); setStep(0); }} /></details>
    {selectedPid && <p className="text-sm text-slate-500">Institution {selectedPid}</p>}
    <div className="flex flex-wrap items-center gap-3"><button className="btn-primary" onClick={()=>setStep(s=>Math.min(4,s+1))} disabled={step===4}>Reveal next step</button><button className="btn-ghost" onClick={()=>setStep(0)}>Restart story</button><span aria-live="polite">{step} of 4 steps</span></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl bg-ink-950 p-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-saffron-300">Illustrative scenario</p>
        <h2 className="mt-2 text-2xl font-bold">Without coordination</h2><p className="mt-2 text-ink-200">Separate letters go out. A transfer is not acknowledged. The student sees “Submitted” for weeks. The same document is requested again.</p>
        <Counts values={fixed} source="scripted scenario" scope="illustrative sequence" />
      </section>
      <section className="rounded-3xl border border-saffron-200 bg-saffron-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-saffron-800">Recorded workflow</p>
        <h2 className="mt-2 text-2xl font-bold text-ink-950">With ShikshaSetu</h2><ol className="mt-3 space-y-1 text-sm text-slate-700">{['PREVENT warns before an overlapping action.', 'SYNC coordinates requests; the locker supports scoped document reuse.', 'The institution replies against each owning office item.', 'The student sees recorded status, next step and open queries.'].map((text,i)=><li key={text} className="ps-story-step" data-revealed={i<step}>{i+1}. {text}</li>)}</ol>
        {q.error && <p role="alert" className="mt-3">Recorded actions are unavailable for this institution.</p>}
        {recorded ? <Counts values={recorded} source={q.data.source} scope={`PID ${q.data.institutionPid}; ${q.data.scope.accessibleCases} accessible cases`} /> : <p className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Choose an institution with recorded actions to load its comparison.</p>}
        {q.data?.caseReferences?.[0] && <Link className="mt-4 inline-block underline" to={`/cases/${q.data.caseReferences[0]}`}>Open a recorded case</Link>}
      </section>
    </div>
  </div>;
}
