import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useS5, useS5Action, ErrorLine } from '../closure/api.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';
import { PageHeader, Metrics, EmptyState, QueueFilter, StatusChip, CodeText } from '../../components/ui/PageKit.jsx';
import { policyText } from '../../components/RuleVersion.jsx';

/**
 * NEXUS RESCUE (N24) at /rescue: stalled-case alerts for supervisors.
 * Reasons point to work items, never to misconduct.
 */
export default function RescueAlerts() {
  const [query, setQuery] = useState(''), [status, setStatus] = useState(''), [limit, setLimit] = useState(12);
  const alerts = useS5('/rescue/alerts');
  const scan = useS5Action('/rescue/scan', 'POST', ['/rescue/alerts']);
  const ack = useS5Action((b) => `/rescue/alerts/${b.id}/acknowledge`, 'POST', ['/rescue/alerts']);
  const all = alerts.data || [];
  const rows = all.filter(row => (!status || row.state === status) && `${row.masterCaseId} ${row.reasonForDelay} ${row.trigger}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PageHeader eyebrow="RECOVERY & ACCOUNTABILITY" title="NEXUS RESCUE: stalled cases" purpose="Review stalled work, confirm the responsible office and record the next action. Alerts indicate delay, never misconduct."><button className="btn-primary" disabled={scan.isPending} onClick={() => scan.mutate({})}>Run scan now</button></PageHeader>
      <Metrics items={[{ label: 'Recorded alerts', value: alerts.data ? all.length : null, note: 'Alerts visible to this role' }, { label: 'Awaiting review', value: alerts.data ? all.filter(row => row.state === 'OPEN').length : null }, { label: 'Acknowledged', value: alerts.data ? all.filter(row => row.state !== 'OPEN').length : null }]} />
      <QueueFilter query={query} setQuery={setQuery} status={status} setStatus={setStatus} statuses={['OPEN', 'ACKNOWLEDGED']} />
      {scan.data?.result === 'POLICY_NOT_CONFIGURED' && <p>Not available: no approved recovery policy.</p>}
      <ErrorLine error={scan.error || ack.error} />
      {rows.slice(0, limit).map((a) => (
        <article key={a._id} className="card card-pad space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><Link to={`/cases/${a.masterCaseId}`} className="font-mono font-bold text-ink-900 underline">{a.masterCaseId}</Link><StatusChip value={a.state} /></div>
          <p className="font-semibold"><CodeText value={a.trigger} /> <span className="text-xs font-normal text-ink-500">· <RuleVersion value={a.ruleVersion} family="Rescue rule" /></span></p>
          <p className="text-sm">Reason for delay: {policyText(a.reasonForDelay)}</p>
          <p className="text-sm">Suggested next action: {a.suggestedNextAction}</p>
          {a.delayAttribution === 'LATE_FEED' && <p className="text-xs">Late-arriving feed: not counted as officer delay.</p>}
          {a.state === 'OPEN' && <button className="mt-1 px-2 py-1 border rounded text-sm" onClick={() => ack.mutate({ id: a._id, payload: {} })}>Acknowledge</button>}
        </article>
      ))}
      {alerts.isLoading && <p className="card card-pad">Loading recovery alerts…</p>}
      {alerts.error && <p role="alert">Not available: the recovery queue could not be loaded.</p>}
      {alerts.data && rows.length === 0 && <EmptyState icon="life" title="No alerts in this view" text="No recorded recovery alerts match the current filters. You can check for newly stalled work." action="Scan for updates" onAction={() => scan.mutate({})} />}
      {rows.length > limit && <button className="btn-ghost" onClick={() => setLimit(value => value + 12)}>Show next 12 alerts</button>}
    </div>
  );
}
