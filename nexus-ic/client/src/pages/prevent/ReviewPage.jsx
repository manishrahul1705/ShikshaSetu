import React from 'react';
import { useI18n } from '../../i18n/index.js';
import { usePreventQuery } from './api.jsx';
import OverlapBanner from './OverlapBanner.jsx';
import ActionCheck from './ActionCheck.jsx';
import AlertList from './AlertList.jsx';
import { CoSign } from './CoSign.jsx';
import { Link } from 'react-router-dom';
import { PageHeader, EmptyState, StatusChip } from '../../components/ui/PageKit.jsx';

export default function ReviewPage() {
  const {t}=useI18n(), query=usePreventQuery('/prevent/overlaps');
  return <div className="mx-auto max-w-6xl space-y-6"><PageHeader eyebrow="NEXUS PREVENT" title={t('s4Review')} purpose="Review evidence for potential overlaps. Separate cases and bureau ownership remain unchanged until a human decides." /><OverlapBanner />
    {query.isLoading && <p role="status">Loading matching evidence…</p>}
    {query.error && <p>Not available: {t('s4Unavailable')}</p>}
    {query.data?.pairs.length===0 && <EmptyState icon="shield" title="No potential overlaps in this view" text="No recorded pair currently meets the review threshold within your access scope." to="/cases" action="Open case queue" />}
    {query.data?.pairs.map((pair,index)=><article className="card card-pad space-y-5" key={pair.cases.join(':') || index}>
      <header className="flex flex-wrap items-start justify-between gap-3"><div className="space-y-2"><div className="flex flex-wrap gap-2">{pair.cases.map(id=><Link className="id-pill underline" aria-label={`Open case ${id}`} key={id} to={`/cases/${id}`}>{id}</Link>)}</div><p className="text-xs text-ink-500">{t(`s4_${pair.identity}`)}</p></div><StatusChip value={`${pair.score.toFixed(2)} / 100 · review evidence`} /></header>
      <div className="grid gap-4 md:grid-cols-2">{pair.signals.map(signal=><section key={signal.name} className="rounded-xl border border-ink-100 p-4"><div className="flex justify-between gap-2 text-sm"><h3 className="font-semibold">{t(`s4_${signal.name}`)}</h3><span>{signal.contribution.toFixed(2)} / {signal.weight}</span></div><div role="meter" aria-label={t(`s4_${signal.name}`)} aria-valuemin={0} aria-valuemax={signal.weight} aria-valuenow={signal.contribution} className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-ink-700" style={{width:`${signal.weight ? Math.max(0,Math.min(100,signal.contribution/signal.weight*100)) : 0}%`}} /></div><p className="mt-2 text-xs text-ink-500">Weight {signal.weight} · contribution {signal.contribution.toFixed(2)} · {t(`s4_${signal.reason}`)}</p></section>)}</div>
      <div className="text-sm">{pair.reasons.map(reason=><p key={reason}>{t(`s4_${reason}`)}</p>)}</div>
      {pair.counterReasons.length>0 && <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-500"><h3 className="font-semibold">Counter-signals</h3>{pair.counterReasons.map(reason=><p key={reason}>{t(`s4_${reason}`)}</p>)}</div>}
      {pair.cases.map(id=><CoSign caseId={id} key={id}/>)}<footer className="border-t border-ink-100 pt-3 text-xs font-semibold text-ink-500">Advisory only · a human reviews the evidence and records the next action.</footer>
    </article>)}<ActionCheck/><AlertList/></div>;
}
