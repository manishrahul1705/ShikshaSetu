import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './ui/Icon.jsx';
import { DEMO_ACCOUNTS } from './navigation.js';

let modePromise;
export function appMode() {
  modePromise = modePromise || fetch('/api/v1/config/mode', { credentials: 'include' }).then((r) => r.json()).then((m) => m.mode).catch(() => 'unknown');
  return modePromise;
}

// Demo mode only: lets a jury member switch to another synthetic demo account
// with one click (a normal logout and login; the server checks everything).
export async function switchAccount({ logout, login }, username) {
  await logout();
  return login(username, 'demo1234');
}

export default function DemoSwitcher() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const ref = useRef(null);

  useEffect(() => { appMode().then(setMode); }, []);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  if (mode !== 'demo') return null;

  const pick = async (username) => {
    setBusy(username);
    try {
      await switchAccount(auth, username);
      setOpen(false);
      navigate('/dashboard');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="hidden items-center gap-1.5 whitespace-nowrap rounded-lg border border-saffron-200 bg-saffron-50 px-2.5 py-1.5 text-xs font-bold text-saffron-800 hover:bg-saffron-100 md:inline-flex">
        <Icon name="users" className="h-3.5 w-3.5" /> Switch role
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lift">
          <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch workspace</p>
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.username} type="button" onClick={() => pick(a.username)} disabled={!!busy}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-ink-50 ${auth.user?.username === a.username ? 'bg-ink-50 font-semibold' : ''}`}>
              <span>{a.label}</span>
              <span className="font-mono text-[11px] text-slate-400">{busy === a.username ? '…' : a.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
