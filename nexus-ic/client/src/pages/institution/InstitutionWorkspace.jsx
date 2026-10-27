import { metadataLabel } from '../../components/metadataLabel.js';
import React, { useState } from 'react';
import ResponseRecord from '../../additions/n88-first-redressal/ResponseRecord.jsx';
import { Link } from 'react-router-dom';
import { useS5, useS5Action, ErrorLine } from '../closure/api.jsx';
import { PageHeader, Metrics, StatusChip, EmptyState } from '../../components/ui/PageKit.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export function InstitutionSummary() {
  const query = useS5('/institution-workspace/status-summary');
  const data = query.data;
  if (query.isLoading) return <p role="status">Loading institution summary…</p>;
  if (!data) return <p>Institution summary is unavailable.</p>;
  const institution = data.institution;
  return <section className="space-y-5"><PageHeader eyebrow="INSTITUTION WORKSPACE" title={institution?.name || 'Institution workspace'} purpose="Monitor your institution’s case progress and respond to requests addressed to your office." /><div className="card card-pad flex flex-wrap gap-3 text-sm"><span className="font-mono">{data.institutionPid}</span><span>{institution?.icid || 'ICID not available'}</span><span title={data.icidCheck} className={`chip ${data.icidCheck==='MATCH'?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800'}`}>{data.icidCheck==='MATCH'?'ICID matches PID':data.icidCheck==='IDENTITY_REVIEW'?'Identity review required':'ICID not available'}</span><span>{institution?.region || 'Region not available'} · {institution?.state}</span></div><Metrics items={[{label:'Open cases',value:data.open},{label:'Closed cases',value:data.closed},{label:'Pending clarifications',value:data.pendingClarifications},{label:'Average resolution days',value:data.resolution?.averageDays,note:data.resolution?.records ? `${data.resolution.records} closure records · ${data.resolution.scope}` : 'Not available: no completed closure evidence'}]} /><section className="card card-pad min-w-0"><h2 className="card-title">Monthly case registrations</h2><div className="mt-4 h-60 min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.monthlyTrend || []}><XAxis dataKey="month" tick={{fontSize:10}} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="registered" name="Registered cases" fill="#1e3a8a" /></BarChart></ResponsiveContainer></div></section></section>;
}

/**
 * Institution workspace (N30, N71) at /institution: own institution only, in the
 * redacted institution-facing form. Never shows reporter identity (S22).
 */
function FormText({ form }) {
  if (form.result === 'RESTRICTED') return <p className="text-sm">Restricted: this case has restricted handling.</p>;
  if (form.result === 'NOT_RELEASED') return <p className="text-sm">Not yet released: an officer must confirm the redaction first.</p>;
  return <p className="text-sm whitespace-pre-wrap">{form.redactedText}</p>;
}

function CaseDetail({ caseId }) {
  const path = `/institution-workspace/cases/${caseId}`;
  const q = useS5(path);
  const [text, setText] = useState('');
  const [answers, setAnswers] = useState({});
  const clarify = useS5Action(`${path}/clarifications`, 'POST', [path]);
  const respond = useS5Action((b) => `/institution-workspace/queries/${b.id}/respond`, 'POST', [path]);
  if (!q.data) return null;
  const c = q.data;
  return (
    <div className="border-t pt-2 space-y-2">
      <FormText form={c.institutionFacingForm} />
      <h3 className="font-semibold text-sm">Requests addressed to you</h3>
      {Array.isArray(c.requests) && c.requests.map((r) => (
        <div key={r.id} className="text-sm">
          <p>{r.from}: {r.queryText} ({r.status})</p>
          {r.status === 'PENDING' && (
            <form onSubmit={(e) => { e.preventDefault(); respond.mutate({ id: r.id, payload: { responseText: answers[r.id] || '' } }); }}>
              <input aria-label="Response" className="border rounded p-1" value={answers[r.id] || ''} onChange={(e) => setAnswers({ ...answers, [r.id]: e.target.value })} />
              <button className="ml-2 px-2 py-1 border rounded" type="submit">Respond</button>
            </form>
          )}
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); clarify.mutate({ text }); }}>
        <textarea aria-label="Clarification" className="w-full border rounded p-1" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="px-2 py-1 bg-blue-900 text-white rounded" type="submit">Submit clarification</button>
      </form>
      <ErrorLine error={clarify.error || respond.error} />
    </div>
  );
}

export default function InstitutionWorkspace() {
  const list = useS5('/institution-workspace/cases');
  const summary = useS5('/institution-workspace/status-summary');
  const [open, setOpen] = useState(null);
  if (list.error?.message === 'INSTITUTION_NOT_LINKED') return <p>Your account is not linked to an institution yet.</p>;
  if (list.error) return <p>The institution workspace is unavailable.</p>;
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <InstitutionSummary />
      {summary.data?.institutionPid && <ResponseRecord pid={summary.data.institutionPid} />}
      <nav className="flex flex-wrap gap-3"><Link className="btn-primary" to="/requests/combined">Combined requests</Link><Link className="btn-ghost" to="/documents/locker">Submit once: document locker</Link></nav>
      {summary.data && (
        <p className="text-sm">{summary.data.total} cases: {Object.entries(summary.data.byStatus).map(([s, n]) => `${s} ${n}`).join(', ') || 'none'}</p>
      )}
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Case</th><th>Category</th><th>Status</th><th>Accountable office</th><th>Pending requests</th></tr></thead><tbody>{(list.data?.cases || []).map(c=><React.Fragment key={c.masterCaseId}><tr><td><button className="font-mono underline" onClick={()=>setOpen(open===c.masterCaseId?null:c.masterCaseId)}>{c.masterCaseId}</button></td><td>{c.category} / {metadataLabel(c.subCategory)}</td><td><StatusChip value={c.status} /></td><td>{c.accountableOwner.office}</td><td>{typeof c.pendingRequests==='number'?c.pendingRequests:'Not available'}</td></tr>{open===c.masterCaseId && <tr><td colSpan={5}><CaseDetail caseId={c.masterCaseId} /></td></tr>}</React.Fragment>)}</tbody></table></div>
      {list.data?.cases.length === 0 && <EmptyState icon="building" title="No cases awaiting your office" text="Cases and clarification requests for your institution will appear here." to="/dashboard" action="Return to command centre" />}
    </div>
  );
}
