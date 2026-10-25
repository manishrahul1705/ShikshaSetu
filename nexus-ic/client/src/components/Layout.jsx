import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuditChainCheck from '../additions/n66-integrity-banner/AuditChainCheck.jsx';

// Manish's 25 Oct override: data disclosure lives in the documents and script.
import { I18nProvider, useI18n } from '../i18n/index.js';
import Icon from './ui/Icon.jsx';
import Logo from './ui/Logo.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import DemoSwitcher from './DemoSwitcher.jsx';
import TourDock from './tour/TourDock.jsx';
import { navFor, ROLE_LABELS } from './navigation.js';
import { SyntheticDataBadge } from './ui/PageKit.jsx';

// Public pages (landing, login, registry lookup without a session) keep a
// full-width top bar; signed-in users get the sidebar workspace shell.
function LangToggle({ dark }) {
  const { lang, toggleLang } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label="Toggle Language"
      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${dark ? 'border border-white/15 text-white hover:bg-white/10' : 'border border-ink-200 bg-white text-ink-900 hover:bg-ink-50'}`}
    >
      {lang === 'en' ? 'हिन्दी' : 'English'}
    </button>
  );
}

function Sidebar({ user, open, onClose }) {
  const [navigationQuery, setNavigationQuery] = useState('');
  const location = useLocation();
  useEffect(() => { setNavigationQuery(''); }, [location.pathname]);
  const groups = navFor(user.role).map(group => ({ ...group, items: group.items.filter(item => !navigationQuery.trim() || `${item.label} ${group.title}`.toLowerCase().includes(navigationQuery.trim().toLowerCase())) })).filter(group => group.items.length);
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden ${open ? '' : 'hidden'}`} onClick={onClose} />
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink-950 text-ink-100 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <Link to="/" className="no-underline" onClick={onClose}><Logo dark /></Link>
          <button className="rounded-lg p-1.5 text-ink-300 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close menu"><Icon name="x" className="h-5 w-5" /></button>
        </div>
        <div className="px-4 pb-4"><label className="sr-only" htmlFor="workspace-navigation-search">Find a page</label><div className="relative"><input id="workspace-navigation-search" placeholder="Find a page..." value={navigationQuery} onChange={e => setNavigationQuery(e.target.value)} className="min-h-10 w-full rounded-xl border border-white/15 bg-white/5 py-2 pl-3 pr-9 text-xs text-white placeholder:text-ink-400 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/30"/>{navigationQuery && <button type="button" aria-label="Clear page search" className="absolute right-1 top-1 rounded-lg p-2 text-ink-300 hover:bg-white/10" onClick={() => setNavigationQuery('')}><Icon name="x" className="h-3 w-3"/></button>}</div></div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
          {groups.length === 0 && <p className="px-3 text-xs leading-5 text-ink-300">No matching pages in your workspace. Try another name.</p>}
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-ink-400">{g.title}</p>
              <div className="space-y-0.5">
                {g.items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} onClick={onClose}
                    className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                    <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0 opacity-80" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && <span className="rounded-md bg-saffron-500/20 px-1.5 py-0.5 text-[10px] font-bold text-saffron-300">{item.badge}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-[11px] leading-relaxed text-ink-400">
          <p className="font-semibold text-ink-200">Connecting Institutions. Coordinating Action. Resolving Grievances.</p>
          <p>AICTE PS 26264</p>
        </div>
      </aside>
    </>
  );
}

function UserMenu({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const displayName = /synthetic|demo|fake|sample/i.test(user.displayName || '') ? (ROLE_LABELS[user.role] || 'Officer') : user.displayName || ROLE_LABELS[user.role] || 'Account';
  const initials = displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div className="hidden whitespace-nowrap text-right xl:block">
        <p className="text-sm font-semibold leading-tight text-ink-950">{displayName}</p>
        <p className="text-[11px] leading-tight text-slate-500">
          <Link to="/dashboard" className="no-underline hover:text-ink-700">Command centre · {ROLE_LABELS[user.role] || 'Account'}</Link>
          {user.bureau ? ` · ${user.bureau}` : ''}{user.region ? ` · ${user.region}` : ''}
        </p>
      </div>
      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 text-xs font-bold text-white ring-2 ring-white" title={ROLE_LABELS[user.role] || user.role}>{initials}</div>
      <button
        onClick={async () => { await logout(); navigate('/login'); }}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink-900"
        aria-label="Logout" title="Logout"
      >
        <Icon name="logout" className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

function AppShell({ user }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { window.scrollTo?.(0, 0); }, [location.pathname]);
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="h-[3px] bg-gradient-to-r from-saffron-500 via-amber-500 to-saffron-600 w-full shrink-0" />
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button className="rounded-lg p-2 text-ink-900 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" className="h-5 w-5" /></button>
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <span className="hidden whitespace-nowrap md:inline-flex"><AuditChainCheck userRole={user.role} /></span>
              <DemoSwitcher />
              <LangToggle />
              <Link to="/notifications" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink-900" aria-label="Notifications"><Icon name="bell" className="h-[18px] w-[18px]" /></Link>
              <span className="hidden h-6 w-px bg-slate-200 sm:block" />
              <UserMenu user={user} />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 animate-rise" key={location.pathname}>
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 px-6 py-2 text-center text-[11px] text-slate-500">
          ShikshaSetu — powered by NEXUS-IC <SyntheticDataBadge className="ml-2 align-middle" />
        </footer>
      </div>
      <TourDock />
    </div>
  );
}

function PublicShell() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <Link to="/" className="no-underline"><Logo header /></Link>
          <nav className="flex items-center gap-2 text-sm font-medium sm:gap-4">
            <Link to="/" className="hidden text-slate-600 no-underline hover:text-ink-900 sm:inline">Home</Link>
            <Link to="/institutions/lookup" className="hidden text-slate-600 no-underline hover:text-ink-900 sm:inline">Institution registry</Link>
            <LangToggle />
            {user
              ? <Link to="/dashboard" aria-label="Open workspace" className="btn-primary whitespace-nowrap py-1.5"><span className="sm:hidden">Workspace</span><span className="hidden sm:inline">Open workspace</span><Icon name="arrow" className="hidden h-4 w-4 sm:block" /></Link>
              : <Link to="/login" className="btn-primary whitespace-nowrap py-1.5">Sign In</Link>}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-ink-950 px-4 py-3 text-center text-[11px] text-ink-300">
        <span className="font-semibold text-white">ShikshaSetu — powered by NEXUS-IC</span> · <span className="italic">Connecting Institutions. Coordinating Action. Resolving Grievances.</span> <SyntheticDataBadge className="ml-2 border-saffron-400 bg-saffron-500/20 text-saffron-100" />
      </footer>
    </div>
  );
}

const PUBLIC_PATHS = ['/', '/login'];

function LayoutInner() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center"><div className="flex flex-col items-center gap-3"><Logo /></div></div>;
  return user && !PUBLIC_PATHS.includes(pathname) ? <AppShell user={user} /> : <PublicShell />;
}

export default function Layout() {
  return (
    <I18nProvider>
      <LayoutInner />
    </I18nProvider>
  );
}
