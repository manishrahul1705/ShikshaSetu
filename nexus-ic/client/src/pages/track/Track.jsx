import { metadataLabel } from '../../components/metadataLabel.js';
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useS5, useS5Action, ErrorLine } from '../closure/api.jsx';
import ReceiptLink from '../../additions/n63-receipt/ReceiptLink.jsx';
import NextStep from '../../additions/n86-next-step/NextStep.jsx';
import { useI18n } from '../../i18n/index.js';
import RuleVersion from '../../components/RuleVersion.jsx';
import CaseStepper from '../../components/CaseStepper.jsx';
import { PageHeader, Metrics, StatusChip, EmptyState, CodeText, QueueFilter, Pagination } from '../../components/ui/PageKit.jsx';

export const nextStep = status => /closed|disposed/i.test(status) ? 'Read the closure record and review any available feedback or appeal options.' : /clarification|query/i.test(status) ? 'Open your case and respond to the recorded request.' : /proposed|approved/i.test(status) ? 'The responsible office is reviewing the resolution evidence.' : 'The accountable office will record the next case update here.';

/**
 * Complainant workspace (N29) at /track/:caseId: own cases only (S21).
 * Shows the exact status, owner as office and role, status history, SLA summary,
 * closure reason, feedback (N23) and appeals (N25). No internal notes (S24).
 */
export function TrackList() {
  const {t}=useI18n();
  const list = useS5('/track');
  const [search, setSearch] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(0);
  const rows = (list.data || []).filter(c=>(!status || c.status===status) && [c.masterCaseId,c.category,c.subCategory].join(' ').toLowerCase().includes(search.toLowerCase()));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(rows.length/12)-1));
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader eyebrow="YOUR CASE JOURNEY" title={t('ps.trackTitle')} purpose={t('ps.trackPurpose')}><Link className="btn-primary" to="/grievances/new">{t('ps.file')}</Link></PageHeader>
      <Metrics items={[{label:t('ps.filed'),value:list.data?.length},{label:t('ps.open'),value:list.data?.filter(c=>!/closed|disposed/i.test(c.status)).length},{label:t('ps.closed'),value:list.data?.filter(c=>/closed|disposed/i.test(c.status)).length}]} />
      {list.error && <p>Could not load your cases.</p>}
      <QueueFilter query={search} setQuery={value=>{setSearch(value);setPage(0);}} status={status} setStatus={value=>{setStatus(value);setPage(0);}} statuses={[...new Set((list.data||[]).map(c=>c.status))]} />
      <ul className="space-y-2">
        {rows.slice(currentPage*12,currentPage*12+12).map((c) => (
          <li key={c.masterCaseId} className="card card-pad space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><Link className="font-mono font-semibold text-ink-900 underline" to={`/track/${c.masterCaseId}`}>{c.masterCaseId}</Link><StatusChip value={c.status} /></div><p className="text-sm">{c.category} / {metadataLabel(c.subCategory)}</p>
            <NextStep data={c} onReply={list.refetch} />
          </li>
        ))}
      </ul>
      <Pagination page={currentPage} setPage={setPage} total={rows.length} />
      {list.data?.length>0 && rows.length===0 && <EmptyState icon="search" title="No cases match these filters" text="Clear the filters to return to your full case list." onAction={()=>{setSearch('');setStatus('');setPage(0);}} action="Clear filters" />}
      {list.data?.length===0 && <EmptyState icon="route" title="Your case journey starts here" text="Verify your identity once, then file and follow every step of your grievance." to="/grievances/new" action="File a grievance" />}
    </div>
  );
}

function FeedbackForm({ caseId }) {
  const [rating, setRating] = useState('5');
  const [text, setText] = useState('');
  const submit = useS5Action(`/cases/${caseId}/feedback`, 'POST', [`/track/${caseId}`]);
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); submit.mutate({ rating: Number(rating), text }); }}>
      <h3 className="font-semibold">Your feedback</h3>
      <p className="text-xs text-slate-600">Feedback is shown to reviewers. It does not close, reopen or change your case.</p>
      <label className="block text-sm">Rating
        <select aria-label="Rating" value={rating} onChange={(e) => setRating(e.target.value)} className="ml-2 border rounded">
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <textarea aria-label="Feedback text" className="w-full border rounded p-2" value={text} onChange={(e) => setText(e.target.value)} />
      <button className="px-3 py-1 bg-blue-900 text-white rounded" type="submit">Send feedback</button>
      {submit.isSuccess && <p>Feedback recorded.</p>}
      <ErrorLine error={submit.error} />
    </form>
  );
}

function AppealForm({ caseId }) {
  const [grounds, setGrounds] = useState('');
  const file = useS5Action(`/cases/${caseId}/appeals`, 'POST', [`/track/${caseId}`]);
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); file.mutate({ grounds }); }}>
      <h3 className="font-semibold">File an appeal</h3>
      <textarea aria-label="Appeal grounds" className="w-full border rounded p-2" value={grounds} onChange={(e) => setGrounds(e.target.value)} />
      <button className="px-3 py-1 bg-blue-900 text-white rounded" type="submit">File appeal</button>
      <ErrorLine error={file.error} />
    </form>
  );
}

export default function Track() {
  const {t}=useI18n();
  const { caseId } = useParams();
  const q = useS5(`/track/${caseId}`, true, { refetchInterval: 5000, refetchOnWindowFocus: true });
  if (q.isLoading) return <p className="text-center text-slate-500">{t('ps.loading')}</p>;
  if (q.error || !q.data) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-red-200 rounded p-6 text-center">
        <h2 className="font-bold">{t('ps.notFound')}</h2>
        <p className="text-xs text-slate-500">{t('ps.ownOnly')}</p>
      </div>
    );
  }
  const c = q.data;
  return (
    <div className="max-w-3xl mx-auto bg-white border rounded p-6 space-y-5">
      <header className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold uppercase text-blue-900">{t('ps.masterId')}</p>
          <h1 className="text-2xl font-black font-mono">{c.masterCaseId}</h1>
          <p className="text-sm">{c.category} / {metadataLabel(c.subCategory)}</p>
        </div>
        <ReceiptLink caseId={c.masterCaseId} />
      </header>
      <NextStep data={c} onReply={q.refetch} />
      <section>
        <p>{t('ps.current')}: <strong data-testid="track-status">{c.status}</strong></p>
        <p>{t('ps.owner')}: {c.accountableOwner.office} ({c.accountableOwner.role})</p>
        <p>SLA target: {c.slaClockSummary?.targetResolutionDate ? new Date(c.slaClockSummary.targetResolutionDate).toLocaleDateString() : 'not set'}{c.slaClockSummary?.isEscalated ? ' (escalated)' : ''}</p>
        {c.closure?.closureReason && <p>Closure reason: {c.closure.closureReason}</p>}
      </section>
      {/* N93 Event-Grounded Stepper */}
      <CaseStepper caseData={c} />
      <section>
        <h2 className="font-semibold">{t('ps.history')}</h2>
        <ol className="border-l-2 border-saffron-300 pl-5 space-y-4 text-sm">
          {c.statusHistory.map((h, i) => <li key={i}>{h.status}: {new Date(h.at).toLocaleString()}</li>)}
        </ol>
      </section>
      {c.feedbackOpen && <FeedbackForm caseId={c.masterCaseId} />}
      {c.feedback?.length > 0 && <p className="text-sm">Feedback sent: {c.feedback.length}</p>}
      <section>
        <h2 className="font-semibold">Appeals</h2>
        {c.appealRule?.result === 'POLICY_NOT_CONFIGURED' && <p className="text-sm">Appeal rules: <CodeText value={c.appealRule.result} />. The appeal window and levels are not set in the RuleBook yet.</p>}
        {c.appealRule?.windowDays && <p className="text-sm">Appeal window {c.appealRule.windowDays} days, up to {c.appealRule.levels} levels (<RuleVersion value={c.appealRule.version} family="Appeal rule" />).</p>}
        {c.appeals.map((a) => <p key={a.id} className="text-sm">Level {a.level}: {a.state}{a.decisionNote ? `. ${a.decisionNote}` : ''}</p>)}
        {c.appealOpen && <AppealForm caseId={c.masterCaseId} />}
      </section>
    </div>
  );
}
