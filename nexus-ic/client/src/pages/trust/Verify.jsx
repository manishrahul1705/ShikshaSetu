import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import InstitutionPicker from '../../components/InstitutionPicker.jsx';
import StudentVerificationPanel from './StudentVerificationPanel.jsx';
import { api, useText, useData, useAction, Frame, Button, ErrorNote, Field, inputClass } from './TrustUI.jsx';

export default function Verify() {
  const ui = useText(), { t } = ui, { user } = useAuth();
  const initialType = ['student', 'faculty', 'other_stakeholder'].includes(user?.role) ? user.role : 'authorized_user';
  const [type, setType] = useState(initialType);
  const [reference, setReference] = useState('1000-2000-3001');
  const [subtype, setSubtype] = useState('parent');
  const [institutionPid, setInstitutionPid] = useState('1-7734299133');
  const [institutionName, setInstitutionName] = useState('Arohan Vidyarekha Institute of Engineering, Lucknow') // fictional catalogue name for this PID; never a real college;
  const [consent, setConsent] = useState(false);
  const [otpConsent, setOtpConsent] = useState(false);
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const current = useData('/identity/me');

  const fixtures = manual || type === 'other_stakeholder'
    ? ['MANUAL-PERSON-1', 'MANUAL-PERSON-2', 'MANUAL-OTHER-1']
    : type === 'student'
      ? ['STUDENT-ACTIVE', 'STUDENT-INACTIVE', 'STUDENT-SECOND']
      : type === 'faculty'
        ? ['FACULTY-ACTIVE', 'FACULTY-INACTIVE', 'FACULTY-SECOND']
        : ['SSO-ACTIVE', 'SSO-SECOND'];

  const activeRef = reference.trim() || fixtures[0];

  const begin = useAction(() => api(`/auth/verify/${type}`, {
    userType: type,
    reference: activeRef,
    institutionPid,
    consent,
    manual,
    ...(type === 'other_stakeholder' ? { subtype } : {}),
    ...(deviceId ? { deviceId } : {})
  }));

  const send = useAction(() => api('/identity/otp', { consent: otpConsent }));
  const confirm = useAction(() => api('/identity/otp/confirm', { code }));
  const result = current.data;

  if (user?.role === 'student') return <Frame ui={ui} title="title">
    {result?.status === 'verified' ? <section className="rounded-xl border border-bharat-200 bg-bharat-50 p-6 text-bharat-900"><h2 className="text-xl font-bold">Student verification completed</h2><p className="mt-2 font-bold">{t('badge')}</p>{result.reporterId && <p className="mt-2">{t('reporterId')}: <strong className="font-mono">{result.reporterId}</strong></p>}<p className="mt-2 text-sm">Your account is verified. You can submit and track grievances.</p></section>
      : <StudentVerificationPanel onVerified={() => current.refetch?.()} />}
  </Frame>;

  return (
    <Frame ui={ui} title="title">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-saffron-50 border border-saffron-200 p-4">
        <p className="text-sm text-saffron-900 font-medium">{t('syntheticNote')}</p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-saffron-100 text-saffron-800 border border-saffron-300 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-saffron-600 status-pulse" />
          {t('simulatedCheckBadge')}
        </span>
      </div>

      <form className="space-y-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm" onSubmit={(e) => { e.preventDefault(); begin.mutate(); }}>
        <Field label={t('userType')}>
          <select className={inputClass} value={type} onChange={(e) => {
            const next = e.target.value;
            setType(next);
            if (next === 'student') setReference('1000-2000-3001');
            else if (next === 'faculty') setReference('FAC-2024-001');
            else setReference('');
          }}>
            {['student', 'faculty', 'authorized_user', 'other_stakeholder'].map((value) => (
              <option key={value} value={value}>{t(value)}</option>
            ))}
          </select>
        </Field>

        {type === 'other_stakeholder' ? (
          <Field label={t('subtype')}>
            <select className={inputClass} value={subtype} onChange={(e) => setSubtype(e.target.value)}>
              {['parent', 'alumni', 'citizen', 'other'].map((value) => (
                <option key={value} value={value}>{t(value)}</option>
              ))}
            </select>
          </Field>
        ) : (
          <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
            <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} className="rounded border-slate-300 text-saffron-600 focus:ring-saffron-500" />
            {t('manualLabel')}
          </label>
        )}

        {/* N91 Real Inputs + Presets */}
        {!manual && type === 'student' && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <Field label={t('apaarOrAbcLabel')}>
              <input
                className={`${inputClass} bg-white font-mono`}
                placeholder="1000-2000-3001 (12 digits)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
              />
              <span className="text-xs text-slate-500">12 digits without spaces or dashes. Validated against the local ABC/APAAR test registry. A valid match is self-service; only the OTP confirmation is required.</span>
              <span className="block text-xs text-amber-800">Aadhaar numbers are not accepted in this form. Without an ABC/APAAR ID, use the instant self-check above (test numbers only) or the manual-review path.</span>
            </Field>

            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-700">{t('quickSamples')}</span>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => { setReference('1000-2000-3001'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-300 font-medium">{t('sampleVerified')}</button>
                <button type="button" onClick={() => { setReference('1000-2000-4001'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-300 font-medium">{t('sampleInactive')}</button>
                <button type="button" onClick={() => { setReference('1000-2000-5001'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded border border-rose-300 font-medium">{t('sampleMismatch')}</button>
                <button type="button" onClick={() => { setReference('1000-2000-6001'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded border border-indigo-300 font-medium">{t('sampleReview')}</button>
                <button type="button" onClick={() => { setReference('9999-9999-9999'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-medium">{t('sampleNotFound')}</button>
              </div>
            </div>

            <div className="pt-2">
              <Field label={t('selectCollege')}>
                <InstitutionPicker showDetails onSelect={(row) => { setInstitutionPid(row.pid); setInstitutionName(row.name); }} />
                {institutionPid && (
                  <div className="text-xs text-slate-600 mt-1">
                    Selected PID: <span className="font-mono font-bold text-slate-900">{institutionPid}</span> {institutionName && `— ${institutionName}`}
                  </div>
                )}
              </Field>
            </div>
          </div>
        )}

        {!manual && type === 'faculty' && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <Field label={t('staffIdLabel')}>
              <input
                className={`${inputClass} bg-white font-mono`}
                placeholder="e.g. FAC-2024-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
              />
              <span className="text-xs text-slate-500">Alphanumeric Faculty Staff ID. Validated against local faculty test registry.</span>
            </Field>

            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-700">{t('quickSamples')}</span>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => { setReference('FAC-2024-001'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-300 font-medium">{t('sampleVerified')}</button>
                <button type="button" onClick={() => { setReference('FAC-2024-901'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-300 font-medium">{t('sampleInactive')}</button>
                <button type="button" onClick={() => { setReference('FAC-2024-801'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded border border-rose-300 font-medium">{t('sampleMismatch')}</button>
                <button type="button" onClick={() => { setReference('FAC-2024-701'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded border border-indigo-300 font-medium">{t('sampleReview')}</button>
                <button type="button" onClick={() => { setReference('FAC-UNKNOWN-99'); setInstitutionPid('1-7734299133'); }} className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-medium">{t('sampleNotFound')}</button>
              </div>
            </div>

            <div className="pt-2">
              <Field label={t('selectCollege')}>
                <InstitutionPicker showDetails onSelect={(row) => { setInstitutionPid(row.pid); setInstitutionName(row.name); }} />
                {institutionPid && (
                  <div className="text-xs text-slate-600 mt-1">
                    Selected PID: <span className="font-mono font-bold text-slate-900">{institutionPid}</span> {institutionName && `— ${institutionName}`}
                  </div>
                )}
              </Field>
            </div>
          </div>
        )}

        {(manual || (type !== 'student' && type !== 'faculty')) && (
          <Field label={t('simulator')}>
            <select className={inputClass} value={fixtures.includes(reference) ? reference : fixtures[0]} onChange={(e) => setReference(e.target.value)}>
              {fixtures.map((value) => <option key={value} value={value}>{t(value)}</option>)}
            </select>
          </Field>
        )}

        <Field label={t('deviceId')}>
          <input className={inputClass} maxLength={100} value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="Optional device label" />
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="rounded border-slate-300 text-saffron-600 focus:ring-saffron-500" />
          {t('consentLabel')}
        </label>

        <Button disabled={!consent || begin.isPending}>{t('begin')}</Button>
        <ErrorNote error={begin.error} t={t} />
      </form>

      {result && (
        <div className="card card-pad space-y-2 border-l-4 border-l-saffron-500" aria-live="polite">
          {result.reporterId && <p>{t('reporterId')}: <strong className="font-mono">{result.reporterId}</strong></p>}
          <p>{t('status')}: <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">{t(result.status)}</span></p>
          {result.status === 'verified' && <p className="text-green-800 font-bold">{t('badge')}</p>}
          {result.status === 'pending_otp' && result.verificationMethod === 'AbcApaarSimulator' && (
            <p className="text-sm text-emerald-800 font-semibold">ABC/APAAR matched in the local verification registry. No officer review is required; confirm the one-time code to finish verification.</p>
          )}
          {result.status === 'manual_review' && (
            <p className="text-sm text-amber-800">This record needs officer review because it is disputed or requires manual evidence. Valid ABC/APAAR matches do not use this path.</p>
          )}
        </div>
      )}

      {result?.status === 'pending_otp' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <p className="text-sm text-slate-600">{t('otpNote')}</p>
          <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
            <input type="checkbox" checked={otpConsent} onChange={(e) => setOtpConsent(e.target.checked)} className="rounded border-slate-300 text-saffron-600 focus:ring-saffron-500" />
            {t('otpConsent')}
          </label>
          <Button disabled={!otpConsent || send.isPending} onClick={() => send.mutate()}>{t('sendOtp')}</Button>
          <ErrorNote error={send.error} t={t} />
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); confirm.mutate(); setCode(''); }}>
            <Field label={t('otp')}>
              <input className={`${inputClass} tracking-widest font-mono text-center text-lg`} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" />
            </Field>
            <Button disabled={confirm.isPending}>{t('confirmOtp')}</Button>
          </form>
          <ErrorNote error={confirm.error} t={t} />
        </div>
      )}

      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
        <p>{t('eligibility')}: <strong>{t('POLICY_NOT_CONFIGURED')}</strong></p>
        <p>{t('policyNote')}</p>
      </div>
    </Frame>
  );
}
