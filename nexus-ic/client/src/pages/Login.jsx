import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from '../components/ui/Icon.jsx';
import Logo from '../components/ui/Logo.jsx';

const DEMO_PRESETS = [
  { username: 'trust_student_verified', label: 'Verified student', role: 'student' },
  { username: 'student1', label: 'Student (unverified)', role: 'student' },
  { username: 'faculty1', label: 'Faculty', role: 'faculty' },
  { username: 'inst_admin1', label: 'Institution Admin', role: 'institution_admin' },
  { username: 'rb_officer1', label: 'RB Officer', role: 'bureau_officer (RB)' },
  { username: 'pgrc_officer1', label: 'PGRC Officer', role: 'bureau_officer (PGRC)' },
  { username: 'regional1', label: 'Regional Officer', role: 'regional_officer' },
  { username: 'supervisor1', label: 'Supervisor', role: 'supervisor' },
  { username: 'authority1', label: 'Competent Authority', role: 'competent_authority' },
  { username: 'auditor1', label: 'Auditor', role: 'auditor' },
  { username: 'sysadmin1', label: 'System Admin', role: 'system_admin' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preset = DEMO_PRESETS.find((p) => p.username === params.get('as'));
  const [username, setUsername] = useState(preset?.username || 'sysadmin1');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const next = params.get('next');
  const from = location.state?.from?.pathname || (next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (p) => {
    setUsername(p.username);
    setPassword('demo1234');
  };

  return (
    <div className="grid min-h-[calc(100vh-140px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,125,16,.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(70,97,166,.6), transparent 50%)' }} />
        <div className="relative"><Logo dark /></div>
        <div className="relative space-y-5">
          <p className="font-serif text-3xl italic leading-snug text-white">"Every voice, at the right door."</p>
          <ul className="space-y-3 text-sm text-ink-200">
            {[['fingerprint', 'Verified reporters, sealed identity vault'], ['building', 'Institution identity by PID, corroborated by ICID'], ['shuffle', 'No lost transfers: sender stays accountable'], ['lock', 'Every action in a tamper-evident audit chain']].map(([i, t]) => (
              <li key={t} className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-saffron-300"><Icon name={i} className="h-4 w-4" /></span>{t}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-ink-400">AICTE PS 26264 · Integrated grievance resolution</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-ink-950">Sign In</h1>
            <p className="text-sm text-slate-500">AWAAZ DASTAK — powered by NEXUS-IC</p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">Username</label>
              <input id="login-username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-100" />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">Password</label>
              <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-100" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="border-t border-slate-200 pt-5">
            <p className="mb-2 text-xs font-semibold text-slate-600">Choose your workspace:</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_PRESETS.map((p) => (
                <button key={p.username} type="button" onClick={() => selectPreset(p)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs transition ${username === p.username ? 'border-saffron-400 bg-saffron-50 font-bold text-ink-950 ring-2 ring-saffron-100' : 'border-slate-200 bg-white text-slate-700 hover:border-ink-300 hover:bg-ink-50'}`}>
                  {p.label}
                  <span className="block font-mono text-[10px] font-normal text-slate-400">{p.username}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">Use the credentials assigned to your role.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
