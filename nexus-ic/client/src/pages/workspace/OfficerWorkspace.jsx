import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useS5 } from '../closure/api.jsx';
import { QueueFilter, StatusChip, CodeText } from '../../components/ui/PageKit.jsx';

/**
 * Officer dashboard / bureau queue / regional view (SPEC 12.1): my cases,
 * tasks, SLA and actions, scoped on the server by bureau, region and case.
 * Also carries the Appendix V Layer 7 lifecycle lanes and warning box.
 */
const SLA_TEXT = { OVERDUE: 'Overdue', NEAR_DUE: 'Near due', ON_TRACK: 'On track' };

export default function OfficerWorkspace() {
  const q = useS5('/workspace/queue');
  const [search, setSearch] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(0);
  if (q.isLoading) return <p>Loading your queue...</p>;
  if (q.error || !q.data?.counts) return <p>Your queue is unavailable (UNKNOWN).</p>;
  const w = q.data;
  const filtered = w.cases.filter(c => (!status || c.status === status) && [c.masterCaseId,c.accountableOwner.office,c.status].join(' ').toLowerCase().includes(search.toLowerCase()));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 20) - 1));
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">My cases, tasks, SLA and actions</h2>
        <span className="text-xs">{w.scope}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
        <p className="border rounded p-2 bg-white">Open: <strong>{w.counts.open}</strong></p>
        <p className="border rounded p-2 bg-white">Assigned to me: <strong>{w.counts.assignedToMe}</strong></p>
        <p className="border rounded p-2 bg-white">Overdue: <strong>{w.counts.overdue}</strong></p>
        <p className="border rounded p-2 bg-white">Near due: <strong>{w.counts.nearDue}</strong></p>
        <p className="border rounded p-2 bg-white" title="POLICY_NOT_CONFIGURED">No approved SLA clock: <strong>{w.counts.noSlaClock}</strong></p>
      </div>
      <p className="text-xs border-l-4 border-amber-500 pl-2" role="note">
        Lanes: Case Status, Transfer Status, Current Owner, SLA Clock &amp; Escalation. Transferred cases must NEVER revert to Submitted status.
      </p>
      <QueueFilter query={search} setQuery={value=>{setSearch(value);setPage(0);}} status={status} setStatus={value=>{setStatus(value);setPage(0);}} statuses={[...new Set(w.cases.map(c=>c.status))]} />
      <div className="overflow-x-auto"><table className="w-full text-sm bg-white border rounded">
        <thead><tr className="text-left text-xs"><th>Case</th><th>Case Status</th><th>Transfer Status</th><th>Current Owner</th><th>SLA Clock &amp; Escalation</th><th /></tr></thead>
        <tbody>
          {filtered.slice(currentPage * 20, currentPage * 20 + 20).map((c) => (
            <tr key={c.masterCaseId} className="border-t">
              <td className="font-mono"><Link className="underline" to={`/cases/${c.masterCaseId}`}>{c.masterCaseId}</Link>{c.assignedToMe ? ' (me)' : ''}</td>
              <td><StatusChip value={c.status} /></td>
              <td><StatusChip value={c.transferStatus} /></td>
              <td>{c.accountableOwner.office} ({c.accountableOwner.role})</td>
              <td>{c.sla.result === 'POLICY_NOT_CONFIGURED' ? <CodeText value={c.sla.result} /> : <><StatusChip value={c.sla.state} /> <span className="text-xs">Target {new Date(c.sla.targetResolutionDate).toLocaleDateString()}</span></>}{c.isEscalated ? ', escalated' : ''}</td>
              <td><Link className="underline" to={`/closure/${c.masterCaseId}`}>PROOF</Link></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan="6">No open cases match this view in your scope.</td></tr>}
        </tbody>
      </table></div><div className="flex items-center justify-between gap-3 text-xs"><button className="btn-secondary" disabled={currentPage === 0} onClick={()=>setPage(currentPage-1)}>Previous</button><span>{filtered.length} cases · page {currentPage+1} of {Math.max(1,Math.ceil(filtered.length/20))}</span><button className="btn-secondary" disabled={(currentPage+1)*20>=filtered.length} onClick={()=>setPage(currentPage+1)}>Next</button></div>
      <div className="grid md:grid-cols-3 gap-3 text-sm">
        <section className="border rounded p-2 bg-white" aria-label="My tasks">
          <h3 className="font-semibold">Coordination tasks</h3>
          {Array.isArray(w.tasks) ? w.tasks.map((t) => <p key={t.id}>{t.title} ({t.status}) {t.masterCaseId}</p>) : <p>UNKNOWN ({w.tasks.reason})</p>}
        </section>
        <section className="border rounded p-2 bg-white" aria-label="Incoming transfers">
          <h3 className="font-semibold">Incoming transfers</h3>
          {Array.isArray(w.incomingTransfers) ? w.incomingTransfers.map((t) => <p key={t.id}>{t.masterCaseId} from {t.fromBureau}{t.isEscalated ? ' (escalated)' : ''}</p>) : <p>UNKNOWN ({w.incomingTransfers.reason})</p>}
          <Link className="underline text-xs" to="/transfers">Open NEXUS TRACE</Link>
        </section>
        <section className="border rounded p-2 bg-white" aria-label="My recent actions">
          <h3 className="font-semibold">My recent actions</h3>
          {w.myRecentActions.map((a, i) => <p key={i}>{a.actionType} on {a.masterCaseId || 'restricted case'}</p>)}
          {w.myRecentActions.length === 0 && <p>None yet.</p>}
        </section>
      </div>
    </div>
  );
}
