// Role-aware navigation for the app shell. Paths and roles mirror src/routes/*;
// the server still re-checks every request, this only decides what is shown.
import phaseRoutes from '../routes/index.jsx';
const OFFICERS = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];
const REPORTERS = ['student', 'faculty', 'other_stakeholder'];

export const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Command centre', icon: 'grid' },
      { to: '/judge', label: 'Guided Walkthrough', icon: 'play' },
    ],
  },
  {
    title: 'My grievances',
    items: [
      { to: '/grievances/new', label: 'File a grievance', icon: 'plus', roles: ['student', 'faculty'] },
      { to: '/track', label: 'Track my cases', icon: 'route', roles: REPORTERS },
      { to: '/verify', label: 'Verify identity', icon: 'fingerprint', roles: ['student', 'faculty', 'other_stakeholder'] },
      { to: '/my/consents', label: 'My consents', icon: 'key', roles: REPORTERS },
    ],
  },
  {
    title: 'Case work',
    items: [
      { to: '/cases', label: 'Bureau / Cell queue', icon: 'inbox', roles: OFFICERS },
      { to: '/institution', label: 'Institution workspace', icon: 'building', roles: ['institution_admin'] },
      { to: '/authority', label: 'Authority workspace', icon: 'gavel', roles: ['competent_authority'] },
      { to: '/regional', label: 'Regional view', icon: 'map', roles: ['regional_officer', 'supervisor', 'competent_authority'] },
      { to: '/triage', label: 'Triage', icon: 'layers', roles: ['supervisor', 'competent_authority'] },
      { to: '/officer/manual-verification', label: 'Identity verification queue', icon: 'fingerprint', roles: ['bureau_officer', 'regional_officer'] },
      { to: '/review/identity', label: 'Institution identity review', icon: 'fingerprint', roles: ['supervisor', 'regional_officer'] },
      { to: '/officer/reveal-requests', label: 'Reveal requests', icon: 'eye', roles: [...OFFICERS] },
      { to: '/cases/search', label: 'Search cases', icon: 'search', roles: [...OFFICERS, 'auditor'] },
    ],
  },
  {
    title: 'NEXUS modules',
    items: [
      { to: '/institutions/lookup', label: 'Institution registry (PID / ICID)', icon: 'building' },
      { to: '/review', label: 'NEXUS PREVENT', icon: 'shield', roles: OFFICERS },
      { to: '/sync', label: 'NEXUS SYNC', icon: 'link', roles: [...OFFICERS, 'system_admin'] },
      { to: '/transfers', label: 'NEXUS TRACE', icon: 'shuffle', roles: [...OFFICERS, 'system_admin'] },
      { to: '/rescue', label: 'NEXUS RESCUE', icon: 'life', roles: ['supervisor', 'competent_authority', 'auditor'] },
      { to: '/review/appeals', label: 'Appeals', icon: 'scale', roles: ['supervisor', 'competent_authority', 'auditor'] },
      { to: '/impact', label: 'NEXUS IMPACT', icon: 'chart', roles: [...OFFICERS, 'auditor', 'system_admin'] },
      { to: '/rulebook', label: 'NEXUS RULEBOOK', icon: 'book', roles: ['system_admin', 'supervisor', 'competent_authority', 'auditor'] },
    ],
  },
  {
    title: 'Trust & oversight',
    items: [
      { to: '/reports', label: 'Reports', icon: 'file', roles: [...OFFICERS, 'auditor', 'system_admin'] },
      { to: '/reports/monthly', label: 'Monthly pendency', icon: 'chart', roles: [...OFFICERS, 'auditor', 'system_admin'] },
      { to: '/coverage', label: 'Problem coverage', icon: 'check', roles: [...OFFICERS, 'auditor', 'system_admin'] },
      { to: '/requests/combined', label: 'Combined requests', icon: 'inbox', roles: [...OFFICERS, 'institution_admin'] },
      { to: '/documents/locker', label: 'Document locker', icon: 'file', roles: [...OFFICERS, 'institution_admin'] },
      { to: '/officer-workload', label: 'Officer workload', icon: 'users', roles: ['supervisor', 'bureau_officer'] },
      { to: '/audit', label: 'Audit trail', icon: 'lock', roles: ['auditor', 'system_admin', 'competent_authority', 'supervisor'] },
      { to: '/integrity', label: 'Integrity check', icon: 'check' },
      { to: '/insider/alerts', label: 'Insider alerts', icon: 'alert', roles: ['supervisor', 'system_admin', 'competent_authority'] },
      { to: '/benchmark', label: 'Matcher benchmark', icon: 'sparkle', roles: ['system_admin', 'supervisor'] },
      { to: '/channels', label: 'Channels', icon: 'globe' },
      { to: '/admin', label: 'Administration', icon: 'users', roles: ['system_admin'] },
      { to: '/admin/registry/import', label: 'Official list import', icon: 'file', roles: ['system_admin'] },
      { to: '/notifications', label: 'Notifications', icon: 'bell' },
    ],
  },
];

export function navFor(role) {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.to === '/dashboard') return true;
    return phaseRoutes.some(route => route.path === item.to && (!route.roles || route.roles.includes(role)));
  }) })).filter((g) => g.items.length);
}

export const ROLE_LABELS = {
  student: 'Student', faculty: 'Faculty', other_stakeholder: 'Stakeholder', institution_admin: 'Institution nodal officer',
  bureau_officer: 'Bureau officer', regional_officer: 'Regional officer', supervisor: 'Supervisor',
  competent_authority: 'Competent Authority', auditor: 'Auditor', system_admin: 'System admin',
};

export const DEMO_ACCOUNTS = [
  { username: 'trust_student_verified', label: 'Verified student' },
  { username: 'student1', label: 'Student (unverified)' },
  { username: 'faculty1', label: 'Faculty' },
  { username: 'inst_admin1', label: 'Institution Admin' },
  { username: 'rb_officer1', label: 'RB Officer' },
  { username: 'pgrc_officer1', label: 'PGRC Officer' },
  { username: 'regional1', label: 'Regional Officer' },
  { username: 'supervisor1', label: 'Supervisor' },
  { username: 'authority1', label: 'Competent Authority' },
  { username: 'auditor1', label: 'Auditor' },
  { username: 'sysadmin1', label: 'System Admin' },
];
