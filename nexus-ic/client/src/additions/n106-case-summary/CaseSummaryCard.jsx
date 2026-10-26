import React from 'react';
import { useS5 } from '../../pages/closure/api.jsx';
import { useI18n } from '../../i18n/index.js';
const date = value => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not available';
export function SummaryFields({ data: d }) {
  const { t } = useI18n();
  const fields = [['Case ID', d.masterCaseId], ['Institution', `${d.institutionName} · ${d.institutionPid}`], ['Date of receipt', date(d.receivedAt)], ['Category / sub-category', `${d.category} / ${d.subCategory}`], ['Current status', d.status], ['Presently assigned bureau / cell', d.bureau], ['Assigned officer', d.officer], ['Last action taken', d.lastAction.text], ['Date of last action', date(d.lastAction.at)], ['Next action required', t(`ps.next.${d.nextStepKey}`)], ['Expected disposal date', d.expectedDisposalDate ? date(d.expectedDisposalDate) : d.disposalUnavailableReason]];
  return <section aria-label="Case summary" className="card card-pad"><h2 className="card-title">Case summary</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value}</dd></div>)}</dl></section>;
}
export default function CaseSummaryCard({ caseId }) {
  const q = useS5(`/cases/${encodeURIComponent(caseId)}/summary`);
  if (q.isLoading) return <p role="status">Loading case summary…</p>;
  if (q.error) return <p role="alert">Case summary unavailable.</p>;
  return q.data ? <SummaryFields data={q.data} /> : null;
}
