import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.jsx';
import { request } from '../channels/api.js';
import RuleVersion from '../../components/RuleVersion.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PageHeader, Metrics, EmptyState, CodeText } from '../../components/ui/PageKit.jsx';
const scopeText = value => String(value || '').replace(/\bSynthetic generated\b/g, 'Generated');
export default function Benchmark() {
  const { user } = useAuth(), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ['s6a-benchmark', user?.id], queryFn: () => request('/benchmark'), retry: false, gcTime: 0 });
  const data = query.data;
  const rows = Object.entries(data?.hardCases?.strata || {}).map(([name, row]) => ({ name: name.replaceAll('_', ' '), ...row }));
  return <section className="mx-auto max-w-6xl space-y-6"><PageHeader eyebrow="NEXUS PREVENT · QUALITY" title="Matcher accuracy benchmark" purpose="Inspect matching results against labelled reference pairs, including difficult and differently phrased cases." />
    {['system_admin','supervisor'].includes(user.role) && <button className="btn-primary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await request('/benchmark', {}); await query.refetch(); } catch (e) { setError(e.message); } finally { setBusy(false); } }}>{busy ? 'Evaluating…' : 'Run benchmark'}</button>}
    {(error || query.error) && <p role="alert" className="card card-pad text-rose-700">Not available: <CodeText value={error || query.error.message} /></p>}
    {data?.denominator === undefined && data && <EmptyState icon="sparkle" title="No evaluation recorded" text="Run the reference pairs to see accuracy, coverage and the cases the matcher finds difficult." to="/review" action="Open matching review" />}
    {data?.denominator !== undefined && <><Metrics items={[
      { label: 'Accuracy', value: data.accuracyPercent == null ? null : `${data.accuracyPercent}%`, note: `${data.numerator}/${data.denominator} · all labelled pairs` },
      { label: 'Coverage', value: data.coveragePercent == null ? null : `${data.coveragePercent}%`, note: `${data.evaluated}/${data.denominator} · pairs evaluated` },
      { label: 'False matches', value: data.falseMatches, note: `${data.falseMatches}/${data.nonDuplicatePairs} · pairs labelled as different matters` },
    ]} /><p className="text-xs text-ink-500">{scopeText(data.scope)}</p><details className="card card-pad text-xs"><summary>Evaluation record</summary><p>Evaluated-only accuracy: {data.numerator}/{data.evaluated} ({data.evaluatedAccuracyPercent ?? 'Not available'}%)</p><p>Matching rule: <RuleVersion value={data.ruleVersion} family="Matching rule" /></p><p className="break-all">Fixture SHA-256: {data.fixtureHash}</p></details></>}
    {data?.nonDuplicatePairs!==undefined && <p>False matches / total non-duplicate pairs: {data.falseMatches}/{data.nonDuplicatePairs} ({data.falseMatchRatePercent ?? 'UNKNOWN'}%) — {scopeText(data.scope)}</p>}
    {data?.runtimeMs!==undefined && <p>Run time: {data.runtimeMs.toFixed(2)} ms at {data.runAt}</p>}
    {rows.length > 0 && <section className="card card-pad"><h2 className="card-title">Accuracy by scenario</h2><div className="mt-4 h-72 w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} layout="vertical" margin={{ left: 8, right: 25 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} /><Tooltip formatter={value => [`${value}%`, 'Accuracy']} /><Bar dataKey="correctPercent" fill="#1e3a8a" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></section>}
    {data?.hardCases && <section aria-label="Hard cases" className="card card-pad space-y-4"><h2 className="text-xl font-bold">Hard cases</h2><p>{data.hardCases.reason ? <CodeText value={data.hardCases.reason} /> : 'Reference evaluation by scenario; not a measured real-world outcome.'}</p>
      {data.hardCases.precision && <><p>Precision: {data.hardCases.precision.numerator}/{data.hardCases.precision.denominator} ({data.hardCases.precision.value ?? 'UNKNOWN'}%), {data.hardCases.precision.scope}</p><p>Recall: {data.hardCases.recall.numerator}/{data.hardCases.recall.denominator} ({data.hardCases.recall.value ?? 'UNKNOWN'}%), {data.hardCases.recall.scope}</p>
      <div className="space-y-4">{rows.map(row => <article key={row.name} className="rounded-xl border border-ink-100 p-4"><h3 className="font-semibold capitalize">{row.name}</h3><div className="mt-3 grid gap-3 sm:grid-cols-3">{['accuracy', 'precision', 'recall'].map(key => <div key={key} className="rounded-lg bg-ink-50 p-3"><p className="text-xs font-semibold capitalize text-ink-500">{key}</p><p className="mt-1 text-xl font-bold">{row[key]?.value == null ? 'Not available' : `${row[key].value}%`}</p><p className="mt-1 text-xs text-ink-500">{row[key] ? `${row[key].numerator}/${row[key].denominator} · ${row[key].scope}` : 'No evaluated records for this measure.'}</p></div>)}</div></article>)}</div><details className="text-xs"><summary>Matching method</summary><p>{data.hardCases.method}</p></details></>}</section>}
  </section>;
}
