import { metadataLabel } from '../../components/metadataLabel.js';
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useS5 } from '../../pages/closure/api.jsx';
import { PageHeader, CodeText, StatusChip } from '../../components/ui/PageKit.jsx';

/** N47 at /impact/cases?row=...: the cases behind one IMPACT number, within the viewer's own access. */
export default function DrillDown() {
  const [params] = useSearchParams();
  const row = params.get('row') || '';
  const q = useS5(`/impact/cases?row=${encodeURIComponent(row)}`, !!row);
  if (!row) return <section className="mx-auto max-w-4xl space-y-6"><PageHeader eyebrow="NEXUS IMPACT" title="Explore the cases behind a number" purpose="Choose a measure to inspect its cases within your access scope." /><div className="grid gap-4 sm:grid-cols-2">{[['totalComplaints', 'All cases'], ['pendingCases', 'Pending cases'], ['disposedCases', 'Disposed cases'], ['overdueCases', 'Overdue cases']].map(([id, label]) => <Link className="card card-pad font-semibold hover:border-saffron-400" key={id} to={`?row=tile:${id}`}>{label} →</Link>)}</div></section>;
  if (q.isLoading) return <p>Loading...</p>;
  if (q.error) return <p>This number cannot be opened ({q.error.message}).</p>;
  const d = q.data;
  if (d.result === 'UNKNOWN') return <p>Not available: <CodeText value={d.reason} /></p>;
  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <h1 className="text-xl font-bold">Cases behind {d.rowId}</h1>
      <p className="text-sm">{d.count} cases. Scope: {d.scope}</p>
      {d.transfers && <p className="text-sm">{d.transfers.length} delayed transfers across these cases.</p>}
      {d.pairs && <p className="text-sm">{d.pairs.length} overlap pairs; restricted entries {d.restrictedEntries}.</p>}
      <div className="card overflow-x-auto"><table className="w-full text-sm bg-white">
        <thead><tr className="text-left"><th>Case</th><th>Category</th><th>Status</th><th>Bureau</th><th>Institution</th></tr></thead>
        <tbody>
          {d.cases.map((c) => (
            <tr key={c.masterCaseId}>
              <td className="font-mono">{c.masterCaseId}</td><td>{c.category} / {metadataLabel(c.subCategory)}</td><td><StatusChip value={c.status} /></td><td>{c.owningBureau || 'Unrouted'}</td>
              <td><Link className="underline" to={`/institutions/${c.institutionPid}`}>{c.institutionPid}</Link></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
