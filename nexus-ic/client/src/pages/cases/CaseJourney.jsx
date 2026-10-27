import PolishText from '../../components/PolishText.jsx';
import OfficerAction from '../../additions/n81-live-conflict-warning/OfficerAction.jsx';
import IndiaMap from '../../components/IndiaMap.jsx';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useS5 } from '../closure/api.jsx';
import Icon from '../../components/ui/Icon.jsx';
import RuleVersion, { ruleLabel, policyText } from '../../components/RuleVersion.jsx';
import CaseExplanation from '../../components/CaseExplanation.jsx';
import { metadataLabel } from '../../components/metadataLabel.js';
import { CodeText } from '../../components/ui/PageKit.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABELS } from '../../components/navigation.js';

/**
 * Officer case journey at /cases/:caseId: the case's identity (Master Case ID,
 * PID and ICID with the identity check), its source trail, ownership path and
 * the case-scoped audit history. Read-only; no narrative or reporter identity.
 */
const ICID_RESULT = {
  MATCH: ['ICID matches PID', 'bg-bharat-50 text-bharat-700 border-bharat-200'],
  NOT_AVAILABLE: ['ICID not available', 'bg-slate-50 text-slate-600 border-slate-200'],
  IDENTITY_REVIEW: ['PID / ICID disagree: identity review', 'bg-amber-50 text-amber-800 border-amber-200'],
};

export function humanAction(action) {
  const map = {
    'case.created': 'Case registered', 'case.journey.viewed': 'Case journey viewed', 'case.access_denied_idor': 'Access denied (out of scope)',
    'routing.decided': 'Routed by RuleBook', 'transfer.requested': 'Transfer requested', 'transfer.accepted': 'Transfer accepted', 'transfer.rejected': 'Transfer rejected',
    'closure.proposed': 'Closure proposed', 'closure.approved': 'Closure approved', 'case.closed': 'Case closed',
  };
  if (map[action]) return map[action];
  const words = action.replace(/[._]/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function tone(action) {
  if (/denied|reject|fail/.test(action)) return 'bg-red-500';
  if (/clos|approv|accept|resolv/.test(action)) return 'bg-bharat-500';
  if (/transfer|rout|assign/.test(action)) return 'bg-saffron-500';
  if (/view/.test(action)) return 'bg-slate-300';
  return 'bg-ink-500';
}

const fmt = (d) => (d ? new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

function Field({ label, children, mono }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"><PolishText>{label}</PolishText></p>
      <p className={`mt-0.5 text-sm font-semibold text-ink-950 ${mono ? 'font-mono' : ''}`}>{children ?? 'UNKNOWN'}</p>
    </div>
  );
}

function OwnershipPath({ data }) {
  const stops = [{ label: 'Intake', sub: data.case.channel.toUpperCase(), at: data.case.createdAt }];
  const first = data.routing[0];
  if (first) stops.push({ label: first.primary, sub: `Routed · ${ruleLabel(first.ruleVersion, 'Routing rule')}`, at: first.at });
  for (const t of data.transfers) stops.push({ label: t.toBureau, sub: `Transfer ${t.status} · from ${t.fromBureau}`, at: t.acknowledgedAt || t.requestedAt, pending: t.status === 'REQUESTED' });
  const owner = data.case.currentOwner?.office || data.case.owningBureau;
  if (owner && stops[stops.length - 1].label !== owner) stops.push({ label: owner, sub: 'Current owner', at: data.case.updatedAt });
  return (
    <ol className="flex flex-wrap items-stretch gap-2">
      {stops.map((s, i) => (
        <React.Fragment key={`${s.label}-${i}`}>
          {i > 0 && <li aria-hidden="true" className="flex items-center text-slate-300"><Icon name="arrow" className="h-5 w-5" /></li>}
          <li className={`min-w-[150px] rounded-2xl border p-3 ${i === stops.length - 1 ? 'border-saffron-300 bg-saffron-50' : s.pending ? 'border-dashed border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
            <p className="text-sm font-bold text-ink-950">{s.label}</p>
            <p className="text-[11px] text-slate-500">{s.sub}</p>
            <p className="mt-1 text-[10px] text-slate-400">{fmt(s.at)}</p>
          </li>
        </React.Fragment>
      ))}
    </ol>
  );
}

export default function CaseJourney() {
  const {user}=useAuth();
  const { caseId } = useParams();
  const q = useS5(`/cases/${encodeURIComponent(caseId)}/journey`);
  const [showViews, setShowViews] = useState(false);

  if (q.isLoading) return <div className="space-y-4"><div className="skeleton h-40" /><div className="skeleton h-64" /></div>;
  if (q.error || !q.data?.case) {
    return (
      <div className="card card-pad mx-auto max-w-lg text-center">
        <Icon name="lock" className="mx-auto h-8 w-8 text-slate-400" />
        <h1 className="mt-2 text-xl font-bold"><PolishText>Case not found</PolishText></h1>
        <p className="mt-1 text-sm text-slate-500"><PolishText>The case does not exist or is outside your bureau, region or role scope. The attempt is recorded in the audit trail.</PolishText></p>
        <Link to="/cases" className="btn-primary mt-4"><PolishText>Back to queue</PolishText></Link>
      </div>
    );
  }
  const d = q.data;
  const inst = d.institution;
  const [icidText, icidClass] = ICID_RESULT[inst.icidResult] || [inst.icidResult, 'bg-slate-50 text-slate-600 border-slate-200'];
  const name = inst.registry?.name || inst.snapshot?.name;
  const events = d.events.filter((e) => showViews || e.action !== 'case.journey.viewed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card overflow-hidden">
        <div className="relative bg-ink-950 p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(255,125,16,.4), transparent 45%)' }} />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-saffron-300"><PolishText>Master Case ID</PolishText></p>
              <h1 className="mt-1 font-mono text-3xl font-semibold text-white">{d.case.masterCaseId}</h1>
              <p className="mt-1 text-sm text-ink-200">{d.case.category} / {metadataLabel(d.case.subCategory)} · priority {d.case.priority} · registered {fmt(d.case.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="chip bg-white/10 px-3 py-1 text-sm text-white">{d.case.status}</span>
              <span className="chip bg-saffron-500/20 px-3 py-1 text-sm text-saffron-100">Transfer: <CodeText value={d.case.transferStatus} /></span>
              <span className="chip bg-white/10 px-3 py-1 text-sm text-white">Owner: {d.case.currentOwner ? `${d.case.currentOwner.office} (${ROLE_LABELS[d.case.currentOwner.role] || d.case.currentOwner.role})` : d.case.owningBureau || 'Unrouted'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-sm">
          {user?.role!=='system_admin' && <><Link to={`/closure/${d.case.masterCaseId}`} className="btn-ghost py-1.5"><Icon name="check" className="h-4 w-4" /><PolishText>Closure & proof</PolishText></Link>
          <Link to={`/institutions/${inst.pid}`} className="btn-ghost py-1.5"><Icon name="building" className="h-4 w-4" /><PolishText>Institution 360</PolishText></Link>
          <Link to={`/overlap-timeline/${inst.pid}`} className="btn-ghost py-1.5"><Icon name="layers" className="h-4 w-4" /><PolishText>Overlap timeline</PolishText></Link></>}
          {user?.role!=='auditor' && <><Link to={`/sync/${inst.pid}`} className="btn-ghost py-1.5"><Icon name="link" className="h-4 w-4" />NEXUS SYNC</Link>
          <Link to="/transfers" className="btn-ghost py-1.5"><Icon name="shuffle" className="h-4 w-4" />NEXUS TRACE</Link></>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity */}
        <section aria-label="Institution identity" className="card card-pad space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title"><PolishText>Institution identity</PolishText></h2>
            <Icon name="building" className="h-5 w-5 text-ink-300" />
          </div>
          <p className="text-lg font-bold leading-snug text-ink-950">{name || 'not available'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500"><PolishText>PID (authoritative)</PolishText></p>
              <p className="mt-1 font-mono text-sm font-semibold text-ink-950">{inst.pid}</p>
            </div>
            <div className="rounded-xl border border-saffron-200 bg-saffron-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-saffron-700">ICID / IIC ID</p>
              <p className="mt-1 font-mono text-sm font-semibold text-ink-950">{inst.icid || 'not available'}</p>
            </div>
          </div>
          <p className={`rounded-xl border px-3 py-2 text-xs font-semibold ${icidClass}`}>{icidText}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Region">{inst.registry?.region || inst.snapshot?.region || 'UNKNOWN'}</Field>
            <Field label="State">{inst.registry?.state || inst.snapshot?.state || 'UNKNOWN'}</Field>
          </div>
                    <IndiaMap
            selectedRegion={inst.registry?.region || inst.snapshot?.region}
            selectedState={inst.registry?.state || inst.snapshot?.state}
            selectedCity={inst.registry?.city || inst.snapshot?.city}
            institutionName={name}
            institutionPid={inst.pid}
            interactive={false}
          />
          <p className="text-[11px] text-slate-500">PID is the only key; ICID corroborates and never links institutions on its own. {inst.registry ? 'Registry record found.' : 'No registry record for this PID (shown as not available, never as zero).'}</p>
        </section>

        {/* Source trail */}
        {d.case.institutionRedressal && <section className="card card-pad space-y-2"><h2 className="card-title">Institution first-level redressal</h2><p>Complainant reported: {d.case.institutionRedressal.answer}</p>{d.case.institutionRedressal.raisedAt && <p>Date: {fmt(d.case.institutionRedressal.raisedAt)}</p>}{d.case.institutionRedressal.outcome && <p>{d.case.institutionRedressal.outcome}</p>}<p className="text-sm text-slate-500">Optional record; policy not configured.</p></section>}
        <section aria-label="Source trail" className="card card-pad space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title"><PolishText>Source trail</PolishText></h2>
            <Icon name="route" className="h-5 w-5 text-ink-300" />
          </div>
          <ol className="relative space-y-4 border-l-2 border-dashed border-ink-100 pl-5">
            {d.sources.map((s, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-0.5 grid h-5 w-5 place-items-center rounded-full bg-ink-950 text-[10px] text-saffron-300"><Icon name={s.kind === 'CHANNEL' ? 'globe' : 'link'} className="h-3 w-3" /></span>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s.kind === 'CHANNEL' ? 'Intake channel' : 'External source reference'}</p>
                <p className="text-sm font-semibold text-ink-950"><CodeText value={s.system} /></p>
                <p className="text-xs text-slate-600"><CodeText value={s.ref} /></p>
                {s.at && <p className="text-[10px] text-slate-400">{fmt(s.at)}</p>}
              </li>
            ))}
          </ol>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <Field label="Evidence documents">{d.case.documentCount}</Field>
            <Field label="Language tag" mono>{d.case.languageTag || 'en'}</Field>
          </div>
          <p className="text-[11px] text-slate-500"><PolishText>Source IDs are kept as received; linking cases never overwrites them.</PolishText></p>
        </section>

        {/* Routing */}
        <section aria-label="Routing decision" className="card card-pad space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="card-title"><PolishText>Routing decision</PolishText></h2>
            <Icon name="book" className="h-5 w-5 text-ink-300" />
          </div>
          {d.routing.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">No routing decision recorded for this case (UNKNOWN). Ownership: {d.case.owningBureau || 'unrouted'}.</p>
          ) : d.routing.slice(-2).reverse().map((r, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-ink-950">{r.primary}{r.secondary ? ` + ${r.secondary}` : ''}</p>
                <span className="chip bg-ink-50 font-mono text-ink-800"><RuleVersion value={r.ruleVersion} family="Routing rule" /></span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-saffron-500" style={{ width: `${Math.round((r.confidence || 0) * 100)}%` }} /></div>
              <p className="mt-1 text-[11px] text-slate-500">Confidence {Math.round((r.confidence || 0) * 100)}%{r.manualReview ? ' · sent to human triage' : ''}{r.overridden ? ' · overridden by an officer' : ''}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">{(r.reasons || []).map((x) => <li key={x} className="flex gap-1.5"><Icon name="check" className="mt-0.5 h-3 w-3 shrink-0 text-bharat-600" />{policyText(x)}</li>)}</ul>
            </div>
          ))}
        </section>
      </div>

      <CaseExplanation journey={d} />
      {/* Ownership path */}
      <section aria-label="Ownership path" className="card card-pad">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="card-title"><PolishText>Ownership path</PolishText></h2>
            <p className="text-xs text-slate-500"><PolishText>The sender stays accountable until the receiver accepts. A transferred case never reverts to Submitted.</PolishText></p>
          </div>
          <Icon name="shuffle" className="h-5 w-5 text-ink-300" />
        </div>
        <OwnershipPath data={d} />
      </section>

      {/* Timeline */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-label="Case timeline" className="card card-pad">
          <div className="mb-4">
            <h2 className="card-title"><PolishText>Case timeline</PolishText></h2>
            <p className="text-xs text-slate-500"><PolishText>Dated from the case's own records: registration, routing, transfers and PROOF closure.</PolishText></p>
          </div>
          <ol className="relative">
            {(d.milestones || []).map((m, i, all) => (
              <li key={`${m.kind}-${i}`} className="relative flex gap-4 pb-6">
                {i < all.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-ink-200 to-slate-100" />}
                <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ring-4 ring-white ${tone(m.kind.toLowerCase())}`}>
                  <Icon name={m.kind.startsWith('TRANSFER') ? 'shuffle' : m.kind.startsWith('CLOS') ? 'check' : m.kind === 'ROUTED' ? 'route' : 'inbox'} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm font-semibold text-ink-950">{policyText(m.label)}</p>
                  <p className="text-[11px] text-slate-500">{fmt(m.at)} · {m.by}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Audit chain entries" className="card card-pad">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="card-title"><PolishText>Audit chain entries</PolishText></h2>
              <p className="text-xs text-slate-500"><PolishText>Attributed events in the SHA-256 hash-chained audit log, as recorded.</PolishText></p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={showViews} onChange={(e) => setShowViews(e.target.checked)} /> Show view events</label>
          </div>
          {events.length === 0 ? <p className="text-sm text-slate-500"><PolishText>No recorded events for this case yet.</PolishText></p> : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.seq} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${tone(e.action)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink-950">{humanAction(e.action)}</p>
                    <p className="text-[11px] text-slate-500">{fmt(e.at)} · {e.actorRole} · <span className="font-mono">#{e.seq} · {e.hash}…</span></p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {['bureau_officer','regional_officer','supervisor','competent_authority'].includes(user?.role) && <OfficerAction caseId={d.case.masterCaseId} />}
      <p className="text-center text-[11px] text-slate-500">Narrative and reporter identity are never shown here.</p>
    </div>
  );
}
