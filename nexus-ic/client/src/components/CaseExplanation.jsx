import React, { useState } from 'react';
import { useS5 } from '../pages/closure/api.jsx';
import { useI18n } from '../i18n/index.js';
import RuleVersion, { policyText } from './RuleVersion.jsx';

const names = {
  issue: ['Issue evidence', 'विषय के साक्ष्य'], timeWindow: ['Time window', 'समय अवधि'], category: ['Category', 'श्रेणी'],
  documentOrSubject: ['Document or subject', 'दस्तावेज़ या विषय'], remedy: ['Requested remedy', 'माँगा गया समाधान'],
  sharedEntities: ['Shared entities', 'साझा इकाइयाँ'], semantic: ['Text similarity', 'पाठ की समानता'],
};
export default function CaseExplanation({ journey }) {
  const [open, setOpen] = useState(false);
  const { lang, t } = useI18n(), hi = lang === 'hi';
  const pid = journey.institution.pid;
  const overlaps = useS5(`/prevent/overlaps?institutionPid=${encodeURIComponent(pid)}`, open);
  const pairs = (overlaps.data?.pairs || []).filter(pair => pair.cases?.includes(journey.case.masterCaseId));
  const waiting = journey.transfers.filter(t => t.status === 'REQUESTED').at(-1);
  const owner = journey.case.currentOwner?.office || journey.case.owningBureau;
  return <details className="card card-pad space-y-3" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer text-lg font-bold">{t("polish.Explain this case")}</summary>
    <h2 className="font-semibold">{t("polish.Recorded routing reasons")}</h2>
    {journey.routing.length ? journey.routing.map((decision, index) => <div key={index}>
      <p>{decision.primary} · <RuleVersion value={decision.ruleVersion} family={t("polish.Routing rule")} /></p>
      <ul className="list-disc pl-5">{decision.reasons.map((reason, i) => <li key={i}>{policyText(reason)}</li>)}</ul>
    </div>) : <p>UNKNOWN — {t("polish.no routing decision recorded")}</p>}
    <h2 className="font-semibold">{t("polish.Seven signals for potential overlap")}</h2>
    <p className="text-xs text-slate-500">{t("polish.Current comparison of recorded cases using the cited rule; this is not a historical decision record. Advisory; officers decide.")}</p>
    {overlaps.isLoading && <p>{t("polish.Checking…")}</p>}
    {(overlaps.error || overlaps.data?.result === 'UNKNOWN') && <p>UNKNOWN — {overlaps.data?.reasons?.join(', ') || 'MATCHING_UNAVAILABLE'}</p>}
    {pairs.map((pair, index) => <section key={index} className="overflow-x-auto rounded-lg border p-3">
      <p>{pair.cases.join(' ↔ ')} · <RuleVersion value={pair.ruleVersion} family={t("polish.Matching rule")} /></p>
      <table className="w-full text-sm"><thead><tr><th>{t("polish.Signal")}</th><th>{t("polish.Value")}</th><th>{t("polish.Weight")}</th><th>{t("polish.Contribution")}</th></tr></thead>
        <tbody>{Object.entries(names).map(([key, label]) => {
          const signal = pair.signals?.find(item => item.name === key);
          return <tr key={key}><td>{label[hi ? 1 : 0]}</td><td>{signal?.value ?? 'UNKNOWN'}</td><td>{signal?.weight ?? 'UNKNOWN'}</td><td>{signal?.contribution ?? 'UNKNOWN'}</td></tr>;
        })}</tbody></table>
      <p className="text-xs">{pair.reasons?.map(reason => t(`s4_${reason}`)).join(' · ')}</p>
      <ul className="text-xs">{pair.counterReasons?.map(reason => {
        const [signal, code] = reason.split(':');
        return <li key={reason}>{code ? `${t(`s4_${signal}`)}: ${t(`s4_${code}`)}` : t(`s4_${reason}`)}</li>;
      })}</ul>
    </section>)}
    {overlaps.data && !pairs.length && overlaps.data.result !== 'UNKNOWN' && <p>{t("polish.No potential-overlap pair for this case is available in this authorized view.")}</p>}
    <h2 className="font-semibold">{t("polish.Next accountable step")}</h2>
    <p>{waiting ? `${t("polish.Acceptance pending")}: ${waiting.toBureau}. ${t("polish.Sender remains accountable")}: ${waiting.fromBureau}.` :
      journey.case.status === 'Closed' ? (t("polish.Recorded status: Closed. No open transfer recorded.")) :
        `${t("polish.Recorded accountable office")}: ${owner || 'UNKNOWN'}. ${t("polish.Next specific action is not recorded — UNKNOWN")}`}</p>
  </details>;
}
