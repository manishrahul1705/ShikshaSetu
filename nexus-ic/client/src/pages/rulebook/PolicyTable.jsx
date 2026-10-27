import React, { useState } from 'react';
import { CodeText } from '../../components/ui/PageKit.jsx';
import { metadataLabel } from '../../components/metadataLabel.js';

function fields(body, prefix = '') {
  return Object.entries(body || {}).flatMap(([key, value]) => {
    if (['_comment', 'source', 'approvedFor'].includes(key)) return [];
    const label = [prefix, key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ')].filter(Boolean).join(' / ');
    return value && typeof value === 'object' ? fields(value, label) : [{ label: metadataLabel(label), value }];
  });
}
export default function PolicyTable({ version }) {
  const [expanded, setExpanded] = useState(false);
  const rows = fields(version.body);
  return <section className="space-y-4">
    {version.body?.calendarDays && <h2 className="text-lg font-bold">{version.version === 'DEMO-CASE-STANDARD-v1' ? `Standard case policy v1 (${version.body.calendarDays} days)` : `Priority case policy (${version.body.calendarDays} days)`}</h2>}
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-ink-50 text-xs text-ink-500"><tr><th className="p-3">Rule</th><th className="p-3">Approved value</th></tr></thead><tbody>{rows.slice(0, expanded ? rows.length : 12).map(row => <tr key={row.label} className="border-b border-ink-100"><td className="p-3 capitalize">{row.label}</td><td className="p-3 font-semibold">{typeof row.value === 'boolean' ? row.value ? 'Yes' : 'No' : <CodeText value={row.value} />}</td></tr>)}</tbody></table></div>
    {rows.length > 12 && <button className="btn-ghost" onClick={() => setExpanded(value => !value)}>{expanded ? 'Show key parameters' : `Show all ${rows.length} parameters`}</button>}
    <details className="rounded-xl border border-ink-200 p-4"><summary className="cursor-pointer font-semibold">View source</summary><pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-ink-950 p-4 text-xs text-ink-100">{JSON.stringify(version.body, null, 2)}</pre></details>
  </section>;
}
