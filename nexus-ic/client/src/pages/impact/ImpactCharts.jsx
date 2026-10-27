import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, Rectangle, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { CodeText } from '../../components/ui/PageKit.jsx';

const COUNTS = [
  ['totalComplaints', 'Total Complaints'], ['pendingCases', 'Pending Cases'],
  ['disposedCases', 'Disposed Cases'], ['overdueCases', 'Overdue Cases'],
  ['transferDelays', 'Transfer Delays'], ['potentialOverlaps', 'Potential Overlaps'],
];
export const drillPath = row => `/impact/cases?row=${encodeURIComponent(row)}`;

function Mark({ row, children }) {
  const navigate = useNavigate();
  return <a role="link" tabIndex={0} href={drillPath(row.rowId)} aria-label={`Open ${row.label}: ${row.value} ${row.unit || 'cases'}`}
    onClick={event => { event.preventDefault(); navigate(drillPath(row.rowId)); }}
    onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); navigate(drillPath(row.rowId)); } }}>
    <title>{row.label}: {row.value} {row.unit || 'cases'}</title>{children}
  </a>;
}
function LinkedBar({ x, y, width, height, payload }) {
  if (!payload || !Number.isFinite(height)) return null;
  return <Mark row={payload}><Rectangle x={x} y={y} width={width} height={Math.max(0, height)} fill="#1e40af" /></Mark>;
}
function LinkedDot({ cx, cy, payload }) {
  if (!payload) return null;
  return <Mark row={payload}><circle cx={cx} cy={cy} r={6} fill="#0f766e" stroke="white" strokeWidth={2} /></Mark>;
}
function CountChart({ title, rows, line = false, unknownReason }) {
  const visible = rows.slice(0, 12);
  return <section aria-label={`${title} chart`} className="card card-pad min-w-0 space-y-2">
    <h2 className="font-semibold">{title}</h2>
    {rows.length > 12 && <p className="text-xs">Showing the first 12 of {rows.length} rows; the figures and tables retain their full scope.</p>}
    {unknownReason ? <p className="text-sm">Not available: <CodeText value={unknownReason} /></p> : rows.length === 0 ? <p className="text-sm">No rows in scope.</p> : <div className="h-80 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{width: 720, height: 320}}>{line ? <LineChart data={visible} margin={{ top: 15, right: 15, left: 0, bottom: 45 }}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" angle={-15} textAnchor="end" height={60} /><YAxis allowDecimals={false} /><Tooltip />
        <Line isAnimationActive={false} type="linear" dataKey="value" name="Registered cases" stroke="#0f766e" dot={<LinkedDot />} activeDot={<LinkedDot />} />
      </LineChart> : <BarChart data={visible} margin={{ top: 15, right: 15, left: 0, bottom: 65 }}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" angle={-20} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip />
        <Bar isAnimationActive={false} dataKey="value" name="Count" shape={<LinkedBar />} />
      </BarChart>}</ResponsiveContainer>
    </div>}
  </section>;
}

export function chartRows(report) {
  const tiles = report.tiles || {};
  return {
    counts: COUNTS.flatMap(([id, label]) => {
      const value = id === 'potentialOverlaps' ? tiles[id]?.pairs : tiles[id]?.count;
      return Number.isFinite(value) && tiles[id]?.result !== 'UNKNOWN' ? [{ rowId: `tile:${id}`, label, value, unit: id === 'potentialOverlaps' ? 'pairs' : 'cases' }] : [];
    }),
    bureaus: (tiles.bureauWiseWorkload?.rows || []).map(row => ({ rowId: row.rowId, label: row.bureau, value: row.total })),
    regions: (report.regionWise || []).map(row => ({ rowId: row.rowId, label: row.region, value: row.total })),
    institutions: (tiles.institutionWiseHistory?.rows || []).map(row => ({ rowId: row.rowId, label: row.pid, value: row.total })),
    trends: (tiles.trendsAndInsights?.rows || []).map(row => ({ rowId: row.rowId, label: row.month, value: row.registered })),
  };
}
export default function ImpactCharts({ report, showContext = true, variant = 'full' }) {
  const rows = chartRows(report);
  const missing = COUNTS.filter(([id]) => report.tiles?.[id]?.result === 'UNKNOWN' || !Number.isFinite(id === 'potentialOverlaps' ? report.tiles?.[id]?.pairs : report.tiles?.[id]?.count));
  const missingRows = tile => tile?.result === 'UNKNOWN' ? tile.reason : !Array.isArray(tile?.rows) ? 'ROWS_UNAVAILABLE' : undefined;
  return <section aria-label="Interactive report charts" className="space-y-4">
    <p className="text-sm">{showContext && <>Scope: {report.scope}. </>}{variant === 'regional' ? 'Select a point to open the cases for that month.' : 'Select a bar or point to open the same cases as its linked number. Counts are cases except Potential Overlaps, which counts pairs.'}</p>
    {missing.map(([id, label]) => <p className="text-xs" key={id}>{label}: UNKNOWN ({report.tiles?.[id]?.reason || 'VALUE_UNAVAILABLE'})</p>)}
    {variant === 'regional' ? <CountChart title="Regional case trend" rows={rows.trends} unknownReason={missingRows(report.tiles?.trendsAndInsights)} line /> : <>
      <CountChart title="Case and coordination counts" rows={rows.counts} />
      <div className="grid xl:grid-cols-2 gap-4"><CountChart title="Bureau-wise Workload" rows={rows.bureaus} unknownReason={missingRows(report.tiles?.bureauWiseWorkload)} /><CountChart title="Region-wise cases" rows={rows.regions} unknownReason={!Array.isArray(report.regionWise) ? 'REGION_ROWS_UNAVAILABLE' : undefined} /></div>
      <div className="grid xl:grid-cols-2 gap-4"><CountChart title="Institution-wise History" rows={rows.institutions} unknownReason={missingRows(report.tiles?.institutionWiseHistory)} /><CountChart title="Trends and Insights" rows={rows.trends} unknownReason={missingRows(report.tiles?.trendsAndInsights)} line /></div>
    </>}
  </section>;
}
