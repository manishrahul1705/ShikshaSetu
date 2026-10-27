import IndiaMap from '../../components/IndiaMap.jsx';
import React from 'react';
import { PageHeader } from '../../components/ui/PageKit.jsx';
import { KpiRow } from '../../components/dashboard/CommandCharts.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useS5 } from '../closure/api.jsx';
import DrillLink from '../../additions/n47-drilldown/DrillLink.jsx';
import OfficerWorkspace from '../workspace/OfficerWorkspace.jsx';
import ImpactCharts from '../impact/ImpactCharts.jsx';

/**
 * Regional view (SPEC 12.1 "Region-wise cases and analytics", R50). A regional officer sees only
 * the delegated region: the server scopes both the IMPACT figures and the queue. Supervisors and
 * the Competent Authority see every region side by side.
 */
export default function RegionalView() {
  const { user } = useAuth();
  const q = useS5('/impact/summary');
  const regionLabel = user?.role === 'regional_officer' ? `${user.region || 'No'} region` : 'All regions';
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <PageHeader eyebrow="REGIONAL OVERSIGHT" title={`Regional view: ${regionLabel}`} purpose="Inspect delegated casework, workload and institution trends within your access scope." />
      {q.error && <p>Regional figures are unavailable for your role.</p>}
      {q.data && (
        <>
          <p className="text-sm">Scope: {q.data.scope}</p>
          <KpiRow report={q.data} />
          {/* N94 India Map Choropleth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IndiaMap
              selectedRegion={user?.role === 'regional_officer' ? user.region : null}
              regionCounts={(q.data.regionWise || []).reduce((acc, r) => { acc[r.region] = r.open; return acc; }, {})}
              interactive={true}
            />
            <section aria-label="Region-wise" className="border rounded-xl p-4 bg-white shadow-sm text-sm">
              <h2 className="font-bold text-base mb-2">Region-wise Case Breakdown</h2>
              <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left border-b pb-2"><th>Region</th><th>Total</th><th>Open</th><th>Overdue</th></tr></thead>
                <tbody>{q.data.regionWise.map((r) => <tr key={r.rowId} className="border-b last:border-0 hover:bg-slate-50"><td><span className="font-semibold">{r.region}</span></td><td><DrillLink row={r.rowId}>{r.total}</DrillLink></td><td><span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800">{r.open}</span></td><td>{r.overdue}</td></tr>)}</tbody></table></div>
            </section>
          </div>
          <ImpactCharts report={q.data} showContext={false} variant="regional" />
          <section aria-label="Institutions in scope" className="border rounded p-3 bg-white text-sm">
            <h2 className="font-semibold">Institutions in scope</h2>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left"><th>PID</th><th>ICID</th><th>Name</th><th>Total</th><th>Open</th></tr></thead>
              <tbody>{q.data.tiles.institutionWiseHistory.rows.slice(0, 50).map((x) => <tr key={x.rowId}><td>{x.pid}</td><td>{x.icid}</td><td>{x.name}</td><td><DrillLink row={x.rowId}>{x.total}</DrillLink></td><td>{x.open}</td></tr>)}</tbody></table></div>
          </section>
        </>
      )}
      <OfficerWorkspace />
    </div>
  );
}
