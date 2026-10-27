import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import en from '../../i18n/s1a.en.json';
import hi from '../../i18n/s1a.hi.json';
import { useAuth } from '../../context/AuthContext.jsx';
export async function api(path, body, method = 'POST') {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', cache: 'no-store', ...(body === undefined ? {} : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'error');
  return result;
}
export function useText() {
  const [language, setLanguage] = useState(document.documentElement.lang === 'hi' ? 'hi' : 'en');
  const dictionary = language === 'hi' ? hi : en;
  return { t: (key) => dictionary[key] || dictionary.error, language, setLanguage };
}
export function useData(path) {
  const { user } = useAuth();
  return useQuery({ queryKey: ['s1a', user?.id, path], queryFn: () => api(path), retry: false, gcTime: 0 });
}
export function useAction(work) {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({ mutationFn: work, gcTime: 0, onSuccess: () => client.invalidateQueries({ queryKey: ['s1a', user?.id] }) });
}
export function Frame({ ui, title, children }) {
  const { t, language, setLanguage } = ui;
  return <section className="max-w-4xl mx-auto space-y-6">
    <header className="card card-pad flex flex-wrap justify-between gap-4 items-center"><div><p className="eyebrow">NEXUS TRUST</p><h1 className="mt-2 text-2xl font-extrabold text-ink-950">{t(title)}</h1><p className="mt-2 text-sm text-ink-500">{language === 'hi' ? 'सहमति, सत्यापन और उद्देश्य-आधारित पहचान सुरक्षा।' : 'Consent, verification and purpose-bound identity protection.'}</p></div><label className="text-sm">{t('language')}<select className="ml-2 border rounded-lg p-2" value={language} onChange={(e) => setLanguage(e.target.value)}><option value="en">{t('en')}</option><option value="hi">{t('hi')}</option></select></label></header>
    {children}
  </section>;
}
export function Button({ children, ...props }) { return <button className="btn-primary disabled:opacity-40" {...props}>{children}</button>; }
export function ErrorNote({ error, t }) { return error ? <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{t(error.message)}</p> : null; }
export function StateNote({ query, t }) { return <>{query.isPending && <p>{t('loading')}</p>}<ErrorNote error={query.error} t={t} /></>; }
export function Field({ label, children }) { return <label className="block space-y-1"><span className="block font-medium">{label}</span>{children}</label>; }
export const inputClass = 'border border-slate-300 rounded p-2 w-full';
