import React from 'react';
import { Link } from 'react-router-dom';
import { useS5 } from '../../pages/closure/api.jsx';
import { PageHeader, SortableTable } from '../../components/ui/PageKit.jsx';
export default function Coordination() {
  const q = useS5('/coordination');
  return <div className="space-y-4"><PageHeader title="Cross-bureau coordination" purpose="Coordinate open cases concerning the same institution, including different issues." />
    {q.isLoading ? <p role="status">Loading coordination…</p> : q.error ? <p role="alert">UNKNOWN: coordination feed unavailable.</p> : <SortableTable label="Search cross-bureau institutions" rows={q.data?.flags || []} columns={[
      { key: 'institutionName', label: 'Institution', render: (v, r) => <Link to={`/institutions/${r.institutionPid}`}>{v}</Link> }, { key: 'institutionPid', label: 'PID' }, { key: 'region', label: 'Region' },
      { key: 'bureaus', label: 'Bureaus / cells', render: v => v.join(', ') }, { key: 'cases', label: 'Visible cases', render: v => <div className="flex flex-wrap gap-2">{v.map(c => <Link key={c.masterCaseId} to={`/cases/${c.masterCaseId}`}>{c.masterCaseId}</Link>)}</div> }, { key: 'restrictedCount', label: 'Restricted entries' },
    ]} />}</div>;
}
