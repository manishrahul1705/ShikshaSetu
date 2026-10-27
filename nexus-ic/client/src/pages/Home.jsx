import PolishText from '../components/PolishText.jsx';
import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from '../components/ui/Icon.jsx';
import PresentStory from '../components/PresentStory.jsx';
import { useI18n } from '../i18n/index.js';

const JOURNEY = [
  { icon: 'fingerprint', title: 'Verified reporter', module: 'NEXUS TRUST', text: 'ABC/APAAR or employment check with local OTP; identity stays in a sealed vault.' },
  { icon: 'building', title: 'Right institution', module: 'PID + ICID', text: 'AICTE Permanent Institute ID is the key; ICID corroborates and never links alone.' },
  { icon: 'shield', title: 'No duplicate work', module: 'NEXUS PREVENT', text: 'Seven-signal overlap check before a case or an action is created.' },
  { icon: 'route', title: 'Right bureau', module: 'Explainable routing', text: 'Every routing decision names its RuleBook rule and its reason.' },
  { icon: 'shuffle', title: 'No lost transfers', module: 'NEXUS SYNC + TRACE', text: 'Sender stays accountable until the receiver accepts; nothing reverts to Submitted.' },
  { icon: 'check', title: 'Proven closure', module: 'PROOF + IMPACT', text: 'Evidence-gated closure, complainant feedback and a hash-chained audit trail.' },
];

const MODULES = [
  ['fingerprint', 'NEXUS TRUST', 'Verified students and faculty, consent records, identity vault, reveal requests with approval.'],
  ['shield', 'NEXUS PREVENT', 'Potential overlap detection with reasons and counter-signals; officers decide, never the system.'],
  ['link', 'NEXUS SYNC', 'Blind bureau-to-bureau notice, acknowledgement, lead assignment and shared tasks.'],
  ['shuffle', 'NEXUS TRACE', 'Four-step transfer timeline with SLA clock and escalation.'],
  ['life', 'NEXUS RESCUE', 'Stalled-case alerts for supervisors before deadlines slip.'],
  ['chart', 'NEXUS IMPACT', 'Bureau, region and institution analytics; every figure shows numerator, denominator and scope.'],
  ['book', 'NEXUS RULEBOOK', 'Versioned policies with what-if preview and two-person approval.'],
  ['lock', 'Tamper-evident audit', 'Every state change is an attributed event in a SHA-256 hash chain.'],
];

const EXPLORE = [
  ['trust_student_verified', 'Verified student', 'File and track a grievance', 'users'],
  ['rb_officer1', 'Bureau officer', 'Work the RB queue', 'inbox'],
  ['supervisor1', 'Supervisor', 'Oversee SLA and rescue', 'life'],
  ['authority1', 'Competent Authority', 'Approve and govern', 'gavel'],
  ['auditor1', 'Auditor', 'Verify the audit chain', 'lock'],
];

function JourneyCard() {
  const steps = [
    ['Registered', 'Verified student · web channel', true],
    ['PREVENT check', '1 potential overlap shown to officer', true],
    ['Routed to RB', 'Routing rule v1 · reason recorded', true],
    ['Transfer accepted', 'PGRC → RB · sender accountable until accepted', true],
    ['Closure proposed', 'Evidence attached · awaiting approval', false],
  ];
  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/[.06] p-5 shadow-2xl backdrop-blur-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-saffron-300"><PolishText>Complaint journey</PolishText></p>
          <p className="mt-1 font-mono text-lg font-semibold text-white">NX-2026-000804</p>
        </div>
        <span className="chip bg-bharat-500/20 text-bharat-200"><PolishText>On track</PolishText></span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl bg-white/5 p-2.5"><p className="text-ink-300">PID</p><p className="font-mono font-semibold text-white">1-7734299133</p></div>
        <div className="rounded-xl bg-white/5 p-2.5"><p className="text-ink-300">ICID</p><p className="font-mono font-semibold text-white">IIC-228M6C2D</p></div>
        <div className="rounded-xl bg-white/5 p-2.5"><p className="text-ink-300"><PolishText>Source</PolishText></p><p className="font-semibold text-white">WEB · intake receipt</p></div>
        <div className="rounded-xl bg-white/5 p-2.5"><p className="text-ink-300"><PolishText>Owner now</PolishText></p><p className="font-semibold text-white">Regulation Bureau</p></div>
      </div>
      <ol className="mt-5 space-y-3">
        {steps.map(([t, d, done], i) => (
          <li key={t} className="flex gap-3">
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${done ? 'bg-saffron-500 text-white' : 'border-2 border-dashed border-ink-400 text-ink-300'}`}>{done ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white"><PolishText>{t}</PolishText></p>
              <p className="text-xs text-ink-300"><PolishText>{d}</PolishText></p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [presenting, setPresenting] = useState(false);
  const closePresentation = useCallback(() => setPresenting(false), []);

  return (
    <div>
      {presenting && <PresentStory onClose={closePresentation} />}
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[.35]" style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(255,125,16,.35), transparent 40%), radial-gradient(circle at 85% 70%, rgba(70,97,166,.55), transparent 45%)' }} />
        <div className="pointer-events-none absolute inset-0 opacity-[.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-8 lg:py-24">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.14em] text-saffron-200">
              <span className="h-1.5 w-1.5 rounded-full bg-saffron-400 animate-pulseRing" /> AICTE · Smart India Hackathon · PS 26264
            </p>
            <div>
              <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">AWAAZ DASTAK</h1>
              <p className="mt-3 text-sm font-bold uppercase tracking-[.3em] text-saffron-300">powered by NEXUS-IC</p>
            </div>
            <p className="font-serif text-2xl italic text-ink-100 sm:text-3xl">"Every voice, at the right door."</p>
            <div className="max-w-xl space-y-2 border-l-2 border-saffron-500 pl-4">
              <p className="text-lg font-semibold text-white"><PolishText>One Institution, One View, One Complaint Journey, Real Resolution</PolishText></p>
              <p className="text-sm text-ink-200"><PolishText>Verified People • Verified Institutions • Coordinated Bureaus • No Lost Transfers • Faster, Accountable Resolution</PolishText></p>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <button className="btn-accent px-6 py-3 text-base" onClick={() => setPresenting(true)}>{lang === 'hi' ? 'प्रस्तुत करें' : 'Present'}</button>
              {user ? (
                <Link to="/dashboard" className="btn-accent px-6 py-3 text-base">Go to Dashboard ({user.role}) →</Link>
              ) : (
                <Link to="/login" className="btn-accent px-6 py-3 text-base"><PolishText>Sign In to Your Workspace →</PolishText></Link>
              )}
              <Link to={user ? '/judge' : '/login?next=/judge'} className="btn border border-white/20 bg-white/5 px-6 py-3 text-base text-white hover:bg-white/10">
                <Icon name="play" className="h-4 w-4" /> Guided Walkthrough
              </Link>
            </div>
          </div>
          <JourneyCard />
        </div>
      </section>

      {/* Journey */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow"><PolishText>One complaint journey</PolishText></p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink-950 sm:text-4xl"><PolishText>From a student's voice to a proven resolution</PolishText></h2>
          <p className="mt-3 text-slate-600"><PolishText>Six checkpoints, each visible to the right person, each recorded in the audit chain.</PolishText></p>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {JOURNEY.map((s, i) => (
            <li key={s.title} className="card card-pad group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className="absolute right-4 top-3 font-display text-5xl font-extrabold text-ink-50 transition group-hover:text-saffron-100">{i + 1}</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-950 text-saffron-300"><Icon name={s.icon} className="h-5 w-5" /></span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-saffron-700">{s.module}</p>
              <h3 className="mt-1 text-lg font-bold text-ink-950"><PolishText>{s.title}</PolishText></h3>
              <p className="mt-1 text-sm text-slate-600"><PolishText>{s.text}</PolishText></p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pillars */}
      <section aria-label="Pillars" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-slate-200 md:grid-cols-4">
          {['Transparent, Accountable', 'Student & Faculty Focused', 'Institution-Centric View', 'Actionable Insights for Better Governance'].map((p, i) => (
            <p key={p} className="flex items-center gap-3 bg-white px-6 py-6 text-sm font-bold text-ink-950">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-saffron-50 text-saffron-700">{['eye', 'users', 'building', 'chart'][i] && <Icon name={['eye', 'users', 'building', 'chart'][i]} className="h-4 w-4" />}</span>
              <PolishText>{p}</PolishText>
            </p>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow"><PolishText>Built and verified</PolishText></p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink-950"><PolishText>The NEXUS modules</PolishText></h2>
          </div>
          <p className="max-w-md text-sm text-slate-600"><PolishText>Humans decide; the system gates and explains. No guilt scores, no auto-closure, no silent ownership moves.</PolishText></p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map(([icon, name, text]) => (
            <div key={name} className="card card-pad">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-saffron-50 text-saffron-700"><Icon name={icon} className="h-5 w-5" /></span>
              <h3 className="mt-3 font-bold text-ink-950">{name}</h3>
              <p className="mt-1 text-sm text-slate-600"><PolishText>{text}</PolishText></p>
            </div>
          ))}
        </div>
      </section>

      {/* Outcomes */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
        <div aria-label="Key outcomes" className="card card-pad">
          <h3 className="font-bold text-slate-900"><PolishText>KEY OUTCOMES</PolishText></h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {['Verified and authentic complaints', 'Correct institution and region mapping', 'No duplicate registrations or actions', 'Intelligent and explainable routing', 'No lost transfers with full accountability', 'Coordinated actions across bureaus'].map((x) => (
              <li key={x} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-bharat-600" strokeWidth={2.4} /><PolishText>{x}</PolishText></li>
            ))}
          </ul>
        </div>
        <div aria-label="Manager expectations" className="card card-pad">
          <h3 className="font-bold text-slate-900"><PolishText>Manager Expectations Implemented</PolishText></h3>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            {['Institution-centric single window', 'Truthful status tracking', 'Cross-bureau overlap detection', 'Exact ownership at every stage', 'Pending / disposed / transferred / escalated monitoring', 'Alerts for nearing timelines', 'Complete audit history', 'Decision support'].map((x) => (
              <li key={x} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-bharat-600" strokeWidth={2.4} /><PolishText>{x}</PolishText></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500"><PolishText>Verified workflows with attributable decisions and complete audit history.</PolishText></p>
        </div>
      </section>

      {/* Explore as */}
      <section className="bg-gradient-to-br from-ink-900 to-ink-950 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-white"><PolishText>See it from every desk</PolishText></h2>
          <p className="mt-1 text-sm text-ink-200"><PolishText>Choose a role to open its workspace.</PolishText></p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {EXPLORE.map(([u, role, text, icon]) => (
              <Link key={u} to={`/login?as=${u}`} className="group rounded-2xl border border-white/10 bg-white/5 p-4 no-underline transition hover:border-saffron-400/60 hover:bg-white/10">
                <Icon name={icon} className="h-5 w-5 text-saffron-300" />
                <p className="mt-3 font-semibold text-white"><PolishText>{role}</PolishText></p>
                <p className="text-xs text-ink-300"><PolishText>{text}</PolishText></p>
                <p className="mt-3 font-mono text-[11px] text-ink-400 group-hover:text-saffron-200">{u} →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Zero trust */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        {[['lock', 'Zero-Trust Security', 'Every request re-authorized server-side. HttpOnly Secure session cookies with zero tokens stored on the client.'],
          ['layers', 'Tamper-Evident Audit', 'Cryptographic SHA-256 hash chain records every state change. Fully verifiable via admin dashboard.'],
          ['eye', 'Privacy & Protection', 'Reporter identity separated. Complainant narrative, name, and PII are never logged or exposed.']].map(([icon, t, d]) => (
          <div key={t} className="flex gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-950 text-saffron-300"><Icon name={icon} className="h-5 w-5" /></span>
            <div><h3 className="font-bold text-slate-900"><PolishText>{t}</PolishText></h3><p className="mt-1 text-sm text-slate-600"><PolishText>{d}</PolishText></p></div>
          </div>
        ))}
      </section>

      <footer aria-label="Design goals" className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-6 text-center text-[11px] font-bold tracking-wider text-ink-900">
        RIGHT INSTITUTION | VERIFIED REPORTER | RIGHT BUREAU | NO LOST TRANSFERS | FASTER ACCOUNTABLE RESOLUTION | TRANSPARENT GOVERNANCE
      </footer>
    </div>
  );
}
