import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { s5Request } from '../../pages/closure/api.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { goToStep } from '../../components/tour/TourDock.jsx';
import { withExtraSteps } from '../../components/tour/tourStore.js';

/**
 * N46 Judge Demo Mode at /judge: one click resets demo data and plays a
 * captioned tour of the two-bureau overlap scenario. Hidden in production mode.
 * "Take me there" switches to the step's demo account and opens its page,
 * with a floating tour card that follows the jury across pages.
 */
export default function JudgeMode() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [tour, setTour] = useState(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/config/mode', { credentials: 'include' }).then((r) => r.json()).then((m) => setMode(m.mode)).catch(() => setMode('unknown'));
  }, []);

  useEffect(() => {
    if (mode !== 'demo') return;
    // A scenario that is already seeded (for example the showcase data) can be toured without a reset.
    s5Request('/judge/tour').then((t) => { if (t?.steps?.length) setTour((cur) => cur || t); }).catch(() => {});
  }, [mode]);

  if (mode === null) return <p>Loading...</p>;
  if (mode === 'production') return <p>Guided Walkthrough is not available in production mode.</p>;

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      setTour(await s5Request('/judge/reset', { method: 'POST', body: {} }));
      setStep(0);
    } catch (err) {
      setError(err.message === 'DEMO_DATABASE_REQUIRED' ? 'Reset is unavailable for this database. Start the prepared walkthrough below.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  const steps = tour ? withExtraSteps(tour) : [];
  const current = steps[step];
  const takeMeThere = async (index) => {
    setBusy(true);
    try {
      await goToStep(auth, navigate, { steps, index, active: true }, index);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-ink-950 p-8 text-white shadow-lift">
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 85% 10%, rgba(255,125,16,.45), transparent 40%)' }} />
        <div className="relative space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-saffron-300">For the jury</p>
          <h1 className="text-3xl font-extrabold text-white">Guided Walkthrough</h1>
          <p className="max-w-2xl text-sm text-ink-200">Follow one institution's complaint through coordinated bureau action.</p>
          <p className="max-w-2xl text-sm text-ink-200">Each step opens the right workspace and keeps the next action visible.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button className="btn border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-40" disabled={busy} onClick={start}>
              {busy ? 'Resetting...' : 'Prepare walkthrough'}
            </button>
            {current && (
              <button className="btn-accent disabled:opacity-40" disabled={busy} onClick={() => takeMeThere(0)}>
                <Icon name="play" className="h-4 w-4" /> Play guided tour from step 1
              </button>
            )}
          </div>
        </div>
      </section>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {current && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section aria-label="Tour step" className="card card-pad space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-saffron-700">Step {current.n} of {steps.length}</p>
            <p className="text-lg text-ink-950">{current.caption}</p>
            {current.look?.length > 0 && (
              <ul className="space-y-1 text-sm text-slate-600">{current.look.map((l) => <li key={l} className="flex gap-2"><Icon name="eye" className="mt-0.5 h-4 w-4 shrink-0 text-saffron-600" />{l}</li>)}</ul>
            )}
            <p className="text-sm">Log in as <span className="font-mono">{current.loginAs}</span>, then open <Link className="underline" to={current.link}>{current.link}</Link>.</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
              <button className="btn-ghost" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>Next</button>
              <button className="btn-primary" disabled={busy} onClick={() => takeMeThere(step)}>Take me there <Icon name="arrow" className="h-4 w-4" /></button>
            </div>
            
          </section>
          <section aria-label="All steps" className="card card-pad">
            <h2 className="card-title mb-3">The tour</h2>
            <ol className="space-y-1.5">
              {steps.map((s, i) => (
                <li key={s.n}>
                  <button onClick={() => setStep(i)} className={`flex w-full items-start gap-3 rounded-xl p-2 text-left text-xs transition ${i === step ? 'bg-saffron-50 ring-1 ring-saffron-200' : 'hover:bg-slate-50'}`}>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${i === step ? 'bg-saffron-500 text-white' : 'bg-ink-50 text-ink-700'}`}>{s.n}</span>
                    <span className="min-w-0"><span className="block font-mono text-[11px] text-slate-500">{s.loginAs} · {s.link}</span></span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
