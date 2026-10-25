import React, { useEffect, useState } from 'react';

export default function ResearchRegistrySummary() {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/v1/registry/research/summary', { credentials: 'include', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(value => { if (!controller.signal.aborted) setSummary(value); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!summary?.total) return null;
  return <section aria-label="Supplied institution dataset" className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
    <div className="bg-ink-950 px-5 py-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-saffron-300">Institution directory</p><h2 className="mt-1 text-lg font-bold">Explore institutions across India</h2><p className="mt-1 text-xs text-ink-200">{summary.source}</p></div>
    <dl className="grid grid-cols-3 divide-x divide-slate-100 px-3 py-4">
      {[[summary.total, 'Source records'], [summary.withPid, 'With source PID'], [summary.withIcid, 'Verified ICIDs']].map(([count,label]) => <div key={label} className="px-2 text-center"><dd className="text-xl font-extrabold text-ink-950 sm:text-2xl">{count.toLocaleString('en-IN')}</dd><dt className="mt-1 text-[11px] text-slate-500">{label}</dt></div>)}
    </dl>
    <p className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-900">Incomplete research list. Coverage and current approval are not certified. Missing PID or ICID values remain unavailable.</p>
  </section>;
}
