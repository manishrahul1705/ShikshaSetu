import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { switchAccount } from '../DemoSwitcher.jsx';
import Icon from '../ui/Icon.jsx';
import { readTour, writeTour, subscribe } from './tourStore.js';

/** Go to a tour step: switch demo account when the step needs another role, then open its page. */
export async function goToStep(auth, navigate, tour, index) {
  const step = tour.steps[index];
  if (!step) return;
  writeTour({ ...tour, index, active: true });
  if (step.loginAs && auth.user?.username !== step.loginAs) await switchAccount(auth, step.loginAs);
  navigate(step.link);
}

// Floating card that walks a jury member through the demo, page by page.
export default function TourDock() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tour, setTour] = useState(readTour);
  const [busy, setBusy] = useState(false);
  const [min, setMin] = useState(false);
  useEffect(() => subscribe(setTour), []);
  if (!tour?.active || location.pathname === '/judge') return null;
  const step = tour.steps[tour.index];
  if (!step) return null;
  const go = async (i) => {
    setBusy(true);
    try { await goToStep(auth, navigate, tour, i); } finally { setBusy(false); }
  };

  if (min) {
    return (
      <button onClick={() => setMin(false)} className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lift">
        <Icon name="play" className="h-4 w-4 text-saffron-300" /> Jury tour · step {tour.index + 1} of {tour.steps.length}
      </button>
    );
  }
  return (
    <aside aria-label="Guided jury tour" className="fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-ink-950 text-white shadow-2xl">
      <div className="h-1 bg-white/10"><div className="h-full bg-saffron-500 transition-all" style={{ width: `${((tour.index + 1) / tour.steps.length) * 100}%` }} /></div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-saffron-300">Jury tour · step {tour.index + 1} of {tour.steps.length}</p>
          <div className="flex gap-1">
            <button onClick={() => setMin(true)} className="rounded p-1 text-ink-300 hover:bg-white/10" aria-label="Minimise tour"><Icon name="menu" className="h-4 w-4" /></button>
            <button onClick={() => writeTour(null)} className="rounded p-1 text-ink-300 hover:bg-white/10" aria-label="End tour"><Icon name="x" className="h-4 w-4" /></button>
          </div>
        </div>
        <p className="text-[15px] leading-snug text-white">{step.caption}</p>
        {location.pathname === '/verify' && <Link to="/dev/otp-inbox" className="inline-flex rounded-lg border border-white/20 px-3 py-2 text-sm text-white">Open verification code inbox</Link>}
        {step.look?.length > 0 && (
          <ul className="space-y-1 text-xs text-ink-200">
            {step.look.map((l) => <li key={l} className="flex gap-2"><Icon name="eye" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron-300" />{l}</li>)}
          </ul>
        )}
        <p className="text-[11px] text-ink-400">Viewing as <span className="font-mono text-ink-200">{auth.user?.username}</span></p>
        <div className="flex gap-2 pt-1">
          <button disabled={busy || tour.index === 0} onClick={() => go(tour.index - 1)} className="btn border border-white/15 bg-white/5 px-3 py-2 text-white hover:bg-white/10 disabled:opacity-40">Back</button>
          {tour.index < tour.steps.length - 1 ? (
            <button disabled={busy} onClick={() => go(tour.index + 1)} className="btn-accent flex-1 py-2">{busy ? 'Switching…' : 'Next step'} <Icon name="arrow" className="h-4 w-4" /></button>
          ) : (
            <button onClick={() => { writeTour(null); navigate('/judge'); }} className="btn-accent flex-1 py-2">Finish tour</button>
          )}
        </div>
      </div>
    </aside>
  );
}
