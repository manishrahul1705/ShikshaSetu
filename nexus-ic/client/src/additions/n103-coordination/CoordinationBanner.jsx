import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useS5 } from '../../pages/closure/api.jsx';
import { StatCard } from '../../components/dashboard/CommandCharts.jsx';
export const COORDINATION_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];
export default function CoordinationBanner({ pid, showCount = false }) {
  const { user } = useAuth();
  const allowed = COORDINATION_ROLES.includes(user?.role);
  const q = useS5('/coordination' + (pid ? `?pid=${encodeURIComponent(pid)}` : ''), allowed);
  const overlaps = useS5('/prevent/overlaps' + (pid ? `?institutionPid=${encodeURIComponent(pid)}` : ''), allowed);
  if (!allowed) return null;
  if (q.isLoading) return <p role="status">Loading cross-bureau coordination…</p>;
  if (q.error) return <p role="status">UNKNOWN: coordination feed unavailable.</p>;
  const hasExisting = overlaps.isLoading || !overlaps.data || Boolean(overlaps.data?.pairs?.length || overlaps.data?.restrictedCount);
  return <div className="space-y-3">
    {showCount && <StatCard icon="link" label="Cross-bureau institutions" value={q.data?.count} to="/coordination" sub="Open cases handled by two or more bureaus/cells in your access scope" />}
    {!!q.data?.flags?.length && <aside className="max-h-80 overflow-y-auto rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3" role="status" tabIndex={0} aria-label="Cross-bureau coordination flags">
      <h2 className="font-bold">{hasExisting ? 'Cross-bureau coordination' : 'Potential Overlapping Cases – Coordination Required'}</h2>
      {q.data.flags.map(f => <div key={f.institutionPid}><p className="font-semibold">{f.institutionName} · {f.institutionPid}</p><p className="text-sm">{f.bureaus.join(' · ')}</p><nav className="flex flex-wrap gap-3 text-sm">{f.cases.map(c => <Link key={c.masterCaseId} to={`/cases/${c.masterCaseId}`}>{c.masterCaseId}</Link>)}</nav>{!!f.restrictedCount && <p className="text-xs">{f.restrictedCount} restricted entries</p>}<nav className="flex gap-3 text-sm"><Link to={`/sync/${f.institutionPid}`}>NEXUS SYNC</Link><Link to={`/overlap-timeline/${f.institutionPid}`}>Overlap timeline</Link></nav></div>)}
    </aside>}
  </div>;
}
