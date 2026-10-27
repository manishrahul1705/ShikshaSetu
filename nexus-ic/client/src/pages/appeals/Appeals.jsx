import React, { useState } from 'react';
import { useS5, useS5Action, ErrorLine } from '../closure/api.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';
import { Link } from 'react-router-dom';
import { PageHeader, Metrics, EmptyState, QueueFilter, StatusChip } from '../../components/ui/PageKit.jsx';

/**
 * Appeal review (N25) at /review/appeals. The reviewer must differ from the
 * original resolver; the server enforces it.
 */
function Decide({ appeal }) {
  const [outcome, setOutcome] = useState('Upheld');
  const [note, setNote] = useState('');
  const start = useS5Action(`/appeals/${appeal.id}/review`, 'POST', ['/appeals']);
  const decide = useS5Action(`/appeals/${appeal.id}/decide`, 'POST', ['/appeals']);
  if (appeal.state === 'Appeal Filed') {
    return (
      <div>
        <button className="px-3 py-1 border rounded" onClick={() => start.mutate({})}>Start review</button>
        <ErrorLine error={start.error} />
      </div>
    );
  }
  if (appeal.state !== 'Under Appeal Review') return null;
  return (
    <form onSubmit={(e) => { e.preventDefault(); decide.mutate({ outcome, decisionNote: note }); }} className="space-x-2">
      <select aria-label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} className="border rounded">
        {['Upheld', 'Modified', 'Remanded'].map((o) => <option key={o}>{o}</option>)}
      </select>
      <input aria-label="Decision note" className="border rounded p-1" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="px-3 py-1 bg-blue-900 text-white rounded" type="submit">Decide</button>
      <ErrorLine error={decide.error} />
    </form>
  );
}

export default function Appeals() {
  const list = useS5('/appeals');
  const [query, setQuery] = useState(''), [status, setStatus] = useState('');
  const rows = (list.data || []).filter(row => (!status || row.state === status) && row.masterCaseId.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PageHeader eyebrow="INDEPENDENT REVIEW" title="Appeal and review" purpose="Review the recorded grounds and evidence. The reviewer must differ from the original resolver and closure approver." />
      <Metrics items={[{ label: 'Recorded appeals', value: list.data?.length, note: 'Visible appeal records' }, { label: 'Awaiting review', value: list.data?.filter(row => row.state === 'Appeal Filed').length }, { label: 'Under review', value: list.data?.filter(row => row.state === 'Under Appeal Review').length }]} />
      <QueueFilter query={query} setQuery={setQuery} status={status} setStatus={setStatus} statuses={['Appeal Filed', 'Under Appeal Review', 'Upheld', 'Modified', 'Remanded']} />
      {list.error && <p>Appeals are unavailable.</p>}
      {list.isLoading && <p className="card card-pad">Loading appeal records…</p>}
      {list.data && rows.length === 0 && <EmptyState icon="scale" title="No appeals in this view" text="No appeal records match the selected filters. Earlier case and closure events remain unchanged." to="/dashboard" action="Return to command centre" />}
      {rows.map((a) => (
        <article key={a.id} className="card card-pad space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><Link to={`/cases/${a.masterCaseId}`} className="font-mono font-bold underline">{a.masterCaseId}</Link><StatusChip value={a.state} /></div>
          <p className="text-xs text-ink-500">Review level {a.level} · <RuleVersion value={a.ruleVersion} family="Appeal rule" /> · Reviewer must differ from original resolver and approver.</p>
          <p className="text-sm" data-jury-private>Grounds: {a.grounds || 'No written grounds recorded'}. Extra evidence: {a.evidenceCount}</p>
          <Decide appeal={a} />
        </article>
      ))}
    </div>
  );
}
