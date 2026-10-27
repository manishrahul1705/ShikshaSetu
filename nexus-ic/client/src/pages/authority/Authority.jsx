import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useS5, useS5Action, ErrorLine } from '../closure/api.jsx';
import { PageHeader, Metrics, StatusChip, QueueFilter, EmptyState } from '../../components/ui/PageKit.jsx';

/**
 * Competent Authority workspace (SPEC 12.2, N80) at /authority.
 * Cases appear without narrative or reporter identity (S19). Decisions never
 * close a case; closure goes through NEXUS PROOF.
 */
function DecisionForm({ caseId }) {
  const [kind, setKind] = useState('REVIEW_ESCALATED_CASE');
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [refId, setRefId] = useState('');
  const save = useS5Action(`/authority/cases/${caseId}/decisions`, 'POST', ['/authority/overview']);
  return (
    <form className="flex flex-wrap gap-2 text-sm" onSubmit={(e) => { e.preventDefault(); save.mutate({ kind, decision, reason, refId: refId || undefined }); }}>
      <select aria-label="Decision kind" value={kind} onChange={(e) => setKind(e.target.value)} className="border rounded">
        <option value="REVIEW_ESCALATED_CASE">Review escalated case</option>
        <option value="FINAL_DECISION">Final decision</option>
        <option value="APPROVE_REGULATORY_ACTION">Approve regulatory action</option>
      </select>
      <input aria-label="Decision" placeholder="Decision" className="border rounded p-1" value={decision} onChange={(e) => setDecision(e.target.value)} />
      <input aria-label="Reason" placeholder="Reason" className="border rounded p-1" value={reason} onChange={(e) => setReason(e.target.value)} />
      {kind === 'APPROVE_REGULATORY_ACTION' && <input aria-label="Action ID" placeholder="Action ID" className="border rounded p-1" value={refId} onChange={(e) => setRefId(e.target.value)} />}
      <button className="px-2 py-1 bg-blue-900 text-white rounded" type="submit">Record</button>
      {save.isSuccess && <span>Recorded.</span>}
      <ErrorLine error={save.error} />
    </form>
  );
}

export default function Authority() {
  const q = useS5('/authority/overview');
  const appeals = useS5('/appeals');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [decisionLimit, setDecisionLimit] = useState(12);
  if (q.isLoading) return <p>Loading...</p>;
  if (q.error) return <p>The Competent Authority workspace is unavailable.</p>;
  const o = q.data;
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <PageHeader eyebrow="GOVERNANCE & APPROVALS" title="Competent Authority workspace" purpose="Review proposed closures, escalations and appeals with an independently attributed decision." />
      <p className="text-sm">Signed in as: {o.designation || 'Competent Authority member'}</p>
      <Metrics items={[{label:'Pending',value:o.pending},{label:'Overdue',value:o.overdue.count},{label:'Transferred',value:o.transferred},{label:'Feedback',value:o.feedback.count,note:o.feedback.averageRating==null?'Average rating not available: no feedback received':`Average rating ${o.feedback.averageRating} across ${o.feedback.count} responses`}]} />
      <section className="card card-pad text-sm space-y-4">
        <h2 className="font-semibold">Approvals and escalations</h2>
        <QueueFilter query={search} setQuery={value=>{setSearch(value);setDecisionLimit(12);}} />
        <div className="grid gap-3 md:grid-cols-2">{o.approvals.closuresAwaitingApproval.filter(c=>c.masterCaseId.toLowerCase().includes(search.toLowerCase())).slice(0,decisionLimit).map(c => <article key={c.masterCaseId} className="rounded-xl border border-ink-100 p-4"><StatusChip value="Awaiting closure approval" /><Link className="mt-2 block font-mono font-semibold underline" to={`/closure/${c.masterCaseId}`}>{c.masterCaseId}</Link><p className="mt-2 text-xs text-ink-500">Approver must differ from proposer.</p></article>)}</div>
        <p>Appeals awaiting review: {o.approvals.appealsAwaitingReview} (<Link className="underline" to="/review/appeals">open</Link>)</p>
        <div className="grid gap-3 md:grid-cols-2">{(Array.isArray(appeals.data)?appeals.data:[]).filter(row=>/Appeal Filed|Under Appeal Review/.test(row.state)&&row.masterCaseId.toLowerCase().includes(search.toLowerCase())).slice(0,decisionLimit).map(row=><article className="rounded-xl border border-ink-100 p-4" key={row.id}><StatusChip value={row.state} /><Link className="mt-2 block font-mono font-semibold underline" to={`/cases/${row.masterCaseId}`}>{row.masterCaseId}</Link><p className="mt-2 text-xs">Review level {row.level} · reviewer must differ from the original resolver and closure approver.</p><Link className="mt-2 inline-block underline" to="/review/appeals">Open appeal queue</Link></article>)}</div>
        <p><Link to="/rescue" className="underline">Open RESCUE alerts: {o.escalations.openRescueAlerts.length}</Link></p><div className="grid gap-3 md:grid-cols-2">{o.escalations.escalatedCases.filter(id=>id.toLowerCase().includes(search.toLowerCase())).slice(0,decisionLimit).map(id=><article key={id} className="rounded-xl border border-amber-200 bg-amber-50 p-4"><StatusChip value="Escalated" /><Link className="mt-2 block font-mono font-semibold underline" to={`/cases/${id}`}>{id}</Link><p className="mt-2 text-xs">Approver must differ from requester for any regulatory action.</p></article>)}</div>
        <button className="btn-secondary" onClick={()=>setDecisionLimit(value=>value+12)}>Show more decisions</button><p>Retaliation Watch: {Array.isArray(o.notifications.retaliationWatch) ? `${o.notifications.retaliationWatch.length} advisory alerts` : `UNKNOWN (${o.notifications.retaliationWatch.reason})`}</p>
      </section>
      <section className="card card-pad text-sm space-y-4">
        <h2 className="font-semibold">All cases</h2>
        <QueueFilter query={search} setQuery={setSearch} />
        <div className="overflow-x-auto"><table className="w-full text-left">
          <thead><tr><th>Case</th><th>Institution</th><th>Status</th><th>Owner</th><th /></tr></thead>
          <tbody>
            {o.cases.filter(c=>[c.masterCaseId,c.institutionPid,c.status,c.accountableOwner.office].join(' ').toLowerCase().includes(search.toLowerCase())).slice(0,30).map((c) => (
              <tr key={c.masterCaseId}>
                <td className="font-mono"><Link className="underline" aria-label={`Open case ${c.masterCaseId}`} to={`/cases/${c.masterCaseId}`}>{c.masterCaseId}</Link></td><td>{c.institutionPid}</td><td><StatusChip value={c.status} /></td><td>{c.accountableOwner.office}</td>
                <td><button className="underline" onClick={() => setSelected(c.masterCaseId)}>Decide</button></td>
              </tr>
            ))}
          </tbody>
        </table></div><p className="text-xs text-ink-500">Showing up to 30 matching cases. Narrow the search by case, institution, status or office.</p>
        {selected && <div className="mt-2"><p>Decision on {selected}</p><DecisionForm caseId={selected} /></div>}
      </section>
      <section className="border rounded p-3 bg-white text-sm">
        <h2 className="font-semibold">Region-wise and bureau-wise</h2>
        <ul>{o.regionWise.map((r) => <li key={r.rowId}>{r.region}: {r.total} (open {r.open})</li>)}</ul>
        <ul>{o.bureauWise.map((b) => <li key={b.rowId}>{b.bureau}: {b.total} (open {b.open})</li>)}</ul>
      </section>
      <section className="border rounded p-3 bg-white text-sm">
        <h2 className="font-semibold">Audit and evidence history</h2>
        <p>{o.auditAndEvidence.recentAudit.length} recent audit events; {o.auditAndEvidence.closurePackets.length} closure evidence packets. <Link className="underline" to="/audit">Open audit trail</Link></p>
      </section>
      <p className="text-xs"><Link className="underline" to="/impact">Open NEXUS IMPACT</Link></p>
    </div>
  );
}
