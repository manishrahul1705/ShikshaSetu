import React, { useState } from 'react';

function flatten(value, path = '', result = new Map()) {
  if (value && typeof value === 'object' && Object.keys(value).length) {
    for (const [key, child] of Object.entries(value)) flatten(child, `${path}/${key.replaceAll('~','~0').replaceAll('/','~1')}`, result);
  } else result.set(path || '/', value);
  return result;
}
export function policyDifferences(before, after) {
  const a = flatten(before), b = flatten(after);
  return [...new Set([...a.keys(), ...b.keys()])].sort().filter(path => a.has(path) !== b.has(path) || JSON.stringify(a.get(path)) !== JSON.stringify(b.get(path))).map(path => ({path, before:a.get(path), after:b.get(path), kind:!a.has(path)?'Added':!b.has(path)?'Removed':'Changed'}));
}
const display = (value, missing) => missing ? 'Not present' : JSON.stringify(value);
export default function RuleComparison({ version, versions, activeVersion }) {
  const alternatives = versions.filter(v => v._id !== version._id);
  const [baselineId, setBaselineId] = useState((activeVersion?._id !== version._id && activeVersion?._id) || alternatives[0]?._id || '');
  const [search, setSearch] = useState('');
  const baseline = alternatives.find(v => v._id === baselineId);
  const changes = baseline ? policyDifferences(baseline.body, version.body) : [];
  const visible = changes.filter(row => row.path.toLowerCase().includes(search.trim().toLowerCase()));
  return <details className="rounded-xl border border-orange-200 bg-orange-50/30 p-4"><summary className="cursor-pointer text-sm font-bold text-orange-900">Compare policy versions</summary><div className="mt-4 space-y-4">
    {!alternatives.length ? <p className="text-sm text-slate-600">Add another version in this family to compare its parameters.</p> : <>
      <label className="block text-xs font-semibold">Compare against<select className="input mt-1 w-full" value={baselineId} onChange={e=>setBaselineId(e.target.value)}>{alternatives.map(v=><option key={v._id} value={v._id}>{v.version} ({v.status})</option>)}</select></label>
      <p className="text-xs text-slate-600">Baseline: {baseline?.version}. Inspecting: {version.version}. This comparison is read-only; it does not apply policy changes.</p>
      <label className="block text-xs font-semibold">Find a changed parameter<input type="search" className="input mt-1 w-full" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Parameter path"/></label>
      <p role="status" className="text-xs text-slate-600">{visible.length} of {changes.length} parameter changes</p>
      {visible.length ? <div className="max-h-96 overflow-auto"><table className="w-full text-left text-xs"><thead><tr><th scope="col">Parameter path</th><th scope="col">Change</th><th scope="col">Baseline value</th><th scope="col">Inspected value</th></tr></thead><tbody>{visible.map(row=><tr key={row.path}><th scope="row" className="break-all font-mono normal-case">{row.path}</th><td>{row.kind}</td><td className="break-all font-mono">{display(row.before,row.kind==='Added')}</td><td className="break-all font-mono">{display(row.after,row.kind==='Removed')}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">{changes.length ? 'No changed parameters match your search.' : 'These versions have identical parameter values.'}</p>}
    </>}
  </div></details>;
}
