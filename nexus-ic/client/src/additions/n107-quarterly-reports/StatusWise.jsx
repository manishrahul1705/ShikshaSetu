import React from 'react';
import { useS5 } from '../../pages/closure/api.jsx';
import { SortableTable } from '../../components/ui/PageKit.jsx';
import DrillLink from '../n47-drilldown/DrillLink.jsx';
export default function StatusWise() {
  const q = useS5('/reports/status-wise');
  return <section id="report-status" aria-label="Status-wise" className="card card-pad"><h2 className="card-title">Status-wise</h2>{q.isLoading ? <p>Loading status report…</p> : q.error ? <p>UNKNOWN: status report unavailable.</p> : <><p className="text-xs">{q.data?.scope} · {q.data?.total} cases</p><SortableTable label="Search case statuses" rows={q.data?.rows || []} columns={[{ key: 'status', label: 'Case status' }, { key: 'count', label: 'Cases', render: (v, r) => <DrillLink row={r.rowId}>{v}</DrillLink> }]} /></>}</section>;
}
