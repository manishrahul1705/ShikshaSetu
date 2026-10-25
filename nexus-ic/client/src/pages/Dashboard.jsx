import { metadataLabel } from '../components/metadataLabel.js';
import PolishText from '../components/PolishText.jsx';
import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Workload from '../additions/n89-workload/Workload.jsx';
import CoordinationBanner from '../additions/n103-coordination/CoordinationBanner.jsx';
import CombinedCounter from '../additions/n82-combined-request/CombinedCounter.jsx';
import { Link } from 'react-router-dom';
import OverlapBanner from './prevent/OverlapBanner.jsx';
import OfficerWorkspace from './workspace/OfficerWorkspace.jsx';
import { useS5 } from './closure/api.jsx';
import CommandCharts, { KpiRow } from '../components/dashboard/CommandCharts.jsx';
import Icon from '../components/ui/Icon.jsx';
import { ROLE_LABELS } from '../components/navigation.js';
import { useI18n } from '../i18n/index.js';
import { InstitutionSummary } from './institution/InstitutionWorkspace.jsx';
import { nextStep } from './track/Track.jsx';
import { EmptyState } from '../components/ui/PageKit.jsx';

const OFFICER_LINKS = [['/cases', 'Bureau / Cell queue', 'inbox'], ['/sync', 'NEXUS SYNC', 'link'], ['/transfers', 'NEXUS TRACE', 'shuffle'], ['/review', 'PREVENT review', 'shield'], ['/impact', 'NEXUS IMPACT', 'chart'], ['/reports', 'Reports', 'file']];
const WORKSPACE_LINKS = {
  student: [['/track', 'My cases', 'route'], ['/grievances/new', 'New grievance', 'plus']],
  faculty: [['/track', 'My cases', 'route'], ['/grievances/new', 'New grievance', 'plus']],
  other_stakeholder: [['/track', 'My cases', 'route']],
  institution_admin: [['/institution', 'Institution workspace', 'building']],
  bureau_officer: OFFICER_LINKS,
  regional_officer: [['/regional', 'Regional view', 'map'], ...OFFICER_LINKS],
  supervisor: [...OFFICER_LINKS, ['/rescue', 'NEXUS RESCUE', 'life'], ['/review/appeals', 'Appeals', 'scale'], ['/audit', 'Audit trail', 'lock']],
  competent_authority: [['/authority', 'Competent Authority workspace', 'gavel'], ...OFFICER_LINKS, ['/audit', 'Audit trail', 'lock']],
  auditor: [['/audit', 'Audit trail', 'lock'], ['/impact', 'NEXUS IMPACT', 'chart'], ['/reports', 'Reports', 'file'], ['/integrity', 'Integrity', 'check']],
  system_admin: [['/admin', 'Administration', 'users'], ['/rulebook', 'NEXUS RULEBOOK', 'book'], ['/audit', 'Audit trail', 'lock']],
};
const IMPACT_ROLES = ['supervisor', 'competent_authority', 'auditor', 'system_admin', 'bureau_officer', 'regional_officer'];
const OFFICER_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];
const REPORTER_ROLES = ['student', 'faculty', 'other_stakeholder'];

const getRoleDescription = (user) => {
  switch (user?.role) {
    case 'student':
      return 'Student Grievance Workspace: File and track grievances with ABC/APAAR verification.';
    case 'faculty':
      return 'Faculty Grievance Workspace: File and track faculty grievances with institutional employment verification.';
    case 'institution_admin':
      return 'Institution Nodal Officer Workspace: View and respond to grievances routed to your institution.';
    case 'bureau_officer':
      return `Bureau Officer Workspace (${user?.bureau || 'General'}): Process assigned cases, coordinate with other bureaus via NEXUS SYNC.`;
    case 'regional_officer':
      return `Regional Officer Workspace (${user?.region || 'All Regions'}): Coordinate regional field verifications and institution monitoring.`;
    case 'supervisor':
      return 'Supervisor Workspace: Oversee bureau queues, transfer handovers, and NEXUS RESCUE stalled-case alerts.';
    case 'competent_authority':
      return 'Competent Authority Governance Dashboard: Strategic oversight, high-level approvals, and policy reviews.';
    case 'auditor':
      return 'Auditor Workspace: Cryptographic audit log verification, compliance logs, and tamper monitoring.';
    case 'system_admin':
      return 'System Administrator Workspace: User management, RuleBook policy management, and system operations.';
    default:
      return 'Standard User Dashboard.';
  }
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function Hero({ user }) {
  const { lang } = useI18n();
  const displayName = /synthetic|demo|fake|sample/i.test(user?.displayName || '') ? ROLE_LABELS[user?.role] : user?.displayName;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-ink-950 p-6 text-white shadow-lift sm:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 90% 0%, rgba(255,125,16,.35), transparent 40%), radial-gradient(circle at 0% 100%, rgba(70,97,166,.5), transparent 45%)' }} />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-ink-200"><PolishText>{greeting()}</PolishText>,</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-white">{displayName}</h1>
            <span className="chip bg-saffron-500/20 uppercase tracking-wide text-saffron-200">{ROLE_LABELS[user?.role] || user?.role}</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-ink-200">{getRoleDescription(user)}</p>
          <p className="mt-2 text-xs text-ink-300">
            Username: <span className="font-mono text-ink-100">{user?.username}</span>
            {user?.bureau && ` • Bureau: ${user.bureau}`}
            {user?.region && ` • Region: ${user.region}`}
            {` • ${ROLE_LABELS[user?.role] || ''}`}
          </p>
        </div>
        <Link to="/judge" className="btn shrink-0 border border-white/20 bg-white/10 text-white hover:bg-white/20"><Icon name="play" className="h-4 w-4" /> {lang === 'hi' ? 'निर्देशित प्रस्तुति' : 'Guided Walkthrough'}</Link>
      </div>
    </section>
  );
}

function QuickLinks({ role }) {
  return (
    <nav aria-label="Workspaces" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {[...(WORKSPACE_LINKS[role] || []), ['/notifications', 'Notifications', 'bell']].map(([to, text, icon]) => (
        <Link key={to} to={to} className="card group flex items-center gap-3 p-3.5 no-underline transition hover:-translate-y-0.5 hover:border-saffron-300 hover:shadow-lift">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-950 text-saffron-300 transition group-hover:bg-saffron-500 group-hover:text-white"><Icon name={icon} className="h-4 w-4" /></span>
          <span className="text-sm font-semibold text-ink-950"><PolishText>{text}</PolishText></span>
        </Link>
      ))}
    </nav>
  );
}

function ImpactPanel() {
  const { lang } = useI18n();
  const q = useS5('/impact/summary');
  if (q.isLoading) return <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-28" />)}</div>;
  if (q.error) return <p className="card card-pad text-sm text-slate-600">NEXUS IMPACT is unavailable for this role right now (UNKNOWN).</p>;
  if (!q.data?.tiles) return <EmptyState icon="chart" title="Command centre data is not available yet" text="UNKNOWN: the reporting source has not returned summary data. Recorded cases will appear here once the reporting service is available." to="/reports" action="Open reports" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">NEXUS IMPACT · live</p>
          <h2 className="text-xl font-extrabold text-ink-950">{lang === 'hi' ? 'नियंत्रण केंद्र' : 'Command centre'}</h2>
        </div>
        <p className="text-xs text-slate-500">{q.data.scope}</p>
      </div>
      <KpiRow report={q.data} />
      <CommandCharts report={q.data} />
    </div>
  );
}

function MyCasesPanel() {
  const list = useS5('/track');
  const cases = Array.isArray(list.data) ? list.data : [];
  return (
    <section className="card card-pad">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="card-title"><PolishText>My grievances</PolishText></h2>
        <Link to="/grievances/new" className="btn-accent py-1.5"><Icon name="plus" className="h-4 w-4" /> File a grievance</Link>
      </div>
      {list.isLoading && <div className="skeleton h-16" />}
      {list.error && <p className="text-sm text-slate-600"><PolishText>Could not load your cases.</PolishText></p>}
      {!list.isLoading && !list.error && cases.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
          <Icon name="route" className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-2 font-semibold text-ink-950"><PolishText>No grievances yet</PolishText></p>
          <p className="text-sm text-slate-500"><PolishText>Verify your identity once, then file. You will see every step of your case here.</PolishText></p>
          <Link to="/verify" className="mt-3 inline-block text-sm font-semibold text-ink-700"><PolishText>Verify identity →</PolishText></Link>
        </div>
      )}
      <ul className="space-y-2">
        {cases.slice(0,6).map((c) => (
          <li key={c.masterCaseId}>
            <Link to={`/track/${c.masterCaseId}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 no-underline transition hover:border-saffron-300 hover:bg-saffron-50/40">
              <div>
                <p className="font-mono text-sm font-semibold text-ink-950">{c.masterCaseId}</p>
                <p className="text-xs text-slate-500">{c.category} / {metadataLabel(c.subCategory)}</p>
                <p className="mt-2 text-xs text-ink-500">{nextStep(c.status)}</p>
              </div>
              <span className="chip bg-ink-50 text-ink-800">{c.status}</span>
            </Link>
          </li>
        ))}
      </ul>
      {cases.length>6 && <Link to="/track" className="btn-secondary mt-4">View all {cases.length} cases</Link>}
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <div className="space-y-6">
      <Hero user={user} />
      <OverlapBanner />
      <CoordinationBanner showCount />
      <QuickLinks role={role} />
      {['bureau_officer','regional_officer','supervisor','competent_authority','institution_admin'].includes(role) && <CombinedCounter />}
      {IMPACT_ROLES.includes(role) && <ImpactPanel />}
      {REPORTER_ROLES.includes(role) && <MyCasesPanel />}
      {role === 'institution_admin' && <InstitutionSummary />}
      {role === 'supervisor' && <Workload />}
      {/* Role workspace (SPEC 12.1): officer dashboard and regional view for officers. */}
      {OFFICER_ROLES.includes(role) && (
        <section className="card card-pad max-h-[720px] overflow-y-auto">
          <OfficerWorkspace />
        </section>
      )}
    </div>
  );
}
