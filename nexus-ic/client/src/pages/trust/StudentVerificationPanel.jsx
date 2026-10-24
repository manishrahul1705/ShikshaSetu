import React, { useState } from 'react';

const MESSAGES = {
  STUDENT_ID_NOT_FOUND: 'This ID was not found. Check it and try again here.',
  INVALID_FORMAT: 'Enter a 12-digit ID.', INVALID_TEST_AADHAAR: 'Use an Aadhaar-format test ID from the student dataset.',
  STUDENT_RECORD_NOT_ELIGIBLE: 'This student record is inactive or has unresolved details. Verification cannot complete with this record. Try an eligible ID here.',
  INSTITUTION_DOES_NOT_MATCH: 'The selected institution does not match the linked student record.',
  ID_ALREADY_LINKED: 'This identity is already linked to another account. Sign in with that account.',
  OTP_INVALID: 'That code is incorrect. Try again.', OTP_EXPIRED_OR_USED: 'The code has expired or was already used. Request a new code here.',
  PLEASE_WAIT_BEFORE_RETRY: 'Wait 30 seconds before requesting another code.', LOOKUP_REQUIRED: 'Enter your ID and fetch the linked details first.',
  LOOKUP_EXPIRED: 'The details session expired. Start again on this page.',
  ACCOUNT_NOT_ELIGIBLE: 'This account has an existing verification restriction. Verification has not been completed.',
  ALREADY_VERIFIED: 'Your account is already verified.',
};
async function call(action, body) {
  const response = await fetch(`/api/v1/identity/student/${action}`, {
    credentials: 'include', cache: 'no-store', ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(MESSAGES[result.error] || 'Verification is unavailable. Please retry on this page.');
  return result;
}
export default function StudentVerificationPanel({ onVerified, institutionPid = null }) {
  const [kind, setKind] = useState('abc');
  const [number, setNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [details, setDetails] = useState(null);
  const [channel, setChannel] = useState('email');
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async work => { setBusy(true); setError(''); try { await work(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const reset = () => { setDetails(null); setPending(null); setDelivery(null); setCode(''); setNumber(''); setConfirmed(false); setError(''); };
  const lookup = () => run(async () => { setDetails(await call('lookup', { kind, number, consent, ...(institutionPid ? { institutionPid } : {}) })); setNumber(''); });
  const send = () => run(async () => { setPending(await call('send-otp', { channel, consent: true, detailsAreMine: confirmed })); setDelivery(null); setCode(''); });
  const confirm = () => run(async () => { const result = await call('confirm-otp', { code }); setVerified(result); setCode(''); setDelivery(null); onVerified?.(result); });
  const step = verified ? 4 : pending ? 3 : details ? 2 : 1;
  return <section className="overflow-hidden rounded-2xl border border-saffron-200 bg-white shadow-sm" aria-label="Student ID verification">
    <div className="bg-ink-950 p-5 text-white sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-saffron-300">Student verification</p><h2 className="mt-1 text-2xl font-extrabold">Verify your ID in one place</h2><p className="mt-2 text-sm text-ink-200">Choose your ID, confirm your details, then enter the code sent to your linked email or phone.</p></div>
    <ol className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 p-3 text-center text-[11px] sm:text-xs" aria-label="Verification steps">
      {['Enter ID', 'Confirm details', 'Verify OTP', 'Completed'].map((text, i) => <li key={text} aria-current={step === i + 1 ? 'step' : undefined} className={step >= i + 1 ? 'font-bold text-saffron-800' : 'text-slate-400'}><span className={`mx-auto mb-1 grid h-6 w-6 place-items-center rounded-full ${step >= i + 1 ? 'bg-saffron-500 text-white' : 'bg-slate-200'}`}>{i + 1}</span>{text}</li>)}
    </ol>
    <div className="space-y-5 p-5 sm:p-6">
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Test verification: generated student records with local email/SMS delivery. No government service is contacted. Never enter a real Aadhaar number.</p>
      {!details && !verified && <form className="space-y-4" onSubmit={event => { event.preventDefault(); void lookup(); }}>
        <fieldset><legend className="mb-2 text-sm font-bold text-slate-800">1. Choose your student ID</legend><div className="flex flex-wrap gap-2">{[['abc', 'ABC ID'], ['apaar', 'APAAR ID'], ['aadhaar', 'Aadhaar-format test ID']].map(([value,text]) => <label key={value} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${kind === value ? 'border-saffron-500 bg-saffron-50 font-bold text-saffron-900' : 'border-slate-200'}`}><input type="radio" name="student-id-kind" checked={kind === value} onChange={() => { setKind(value); setNumber(''); setError(''); }} className="mr-2"/>{text}</label>)}</div></fieldset>
        <label className="block text-sm font-semibold">{kind === 'aadhaar' ? 'Aadhaar-format test ID' : `${kind.toUpperCase()} ID`}<input aria-label="Student ID number" className="mt-1 w-full rounded-lg border border-slate-300 p-3 font-mono" inputMode="numeric" autoComplete="off" maxLength={16} value={number} onChange={e => setNumber(e.target.value.replace(/[^\d\s-]/g,''))} placeholder="12 digits" required/></label>
        <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/>I consent to checking my linked student details and receiving a verification code.</label>
        <button className="btn-primary" disabled={busy || !consent || number.replace(/\D/g,'').length !== 12}>{busy ? 'Checking...' : 'Fetch linked details'}</button>
        <p className="text-xs text-slate-500">For checking: ABC / APAAR 1000-2000-3001. See the student dataset for additional IDs and linked contacts.</p>
      </form>}
      {details && !verified && <>
        <div><h3 className="text-base font-bold">2. Confirm the linked student record</h3><p className="mt-1 text-xs text-slate-500">{kind.toUpperCase()} ending {details.last4}. Email and phone come from this record and cannot be replaced with an unrelated contact.</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">{Object.entries({ Name: details.details.name, 'Institution PID': details.details.institutionPid, Programme: details.details.programme, Enrolment: details.details.enrolment }).map(([title,value]) => <div key={title} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">{title}</dt><dd className="mt-1 text-sm font-semibold">{value || 'UNKNOWN'}</dd></div>)}</dl>
        </div>
        {!pending && <><label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>These details belong to me.</label><fieldset><legend className="mb-2 text-sm font-bold">Send the code to</legend><div className="grid gap-2 sm:grid-cols-2">{[['email','Linked email'],['sms','Linked phone (SMS)']].map(([value,title]) => <label key={value} className={`cursor-pointer rounded-xl border p-3 text-sm ${channel === value ? 'border-saffron-500 bg-saffron-50' : 'border-slate-200'}`}><input type="radio" name="otp-channel" checked={channel === value} onChange={() => setChannel(value)} className="mr-2"/>{title}<span className="mt-1 block text-xs text-slate-500">{details.channels[value]}</span></label>)}</div></fieldset><div className="flex flex-wrap gap-2"><button type="button" className="btn-primary" disabled={busy || !confirmed} onClick={send}>{busy ? 'Sending...' : 'Send verification code'}</button><button type="button" className="btn-secondary" disabled={busy} onClick={reset}>These are not my details</button></div></>}
      </>}
      {pending && !verified && <div className="space-y-4 rounded-xl border border-saffron-200 p-4"><h3 className="font-bold">3. Enter the verification code</h3><p className="text-sm">Code addressed to {pending.destination} by {pending.channel === 'sms' ? 'SMS' : 'email'}. Expires at {new Date(pending.expiresAt).toLocaleTimeString()}.</p>
        <div className="rounded-lg bg-slate-50 p-3 text-xs"><p>Local {pending.channel === 'sms' ? 'SMS inbox' : 'email inbox'} — delivery preview on this page.</p>{delivery?.status === 'available' ? <p className="mt-2 font-mono text-xl font-bold tracking-[.3em]" aria-label="Local verification code">{delivery.code}</p> : <button type="button" className="mt-2 font-bold text-saffron-800 underline" disabled={busy} onClick={() => run(async () => { setDelivery(await call('local-delivery')); })}>Open received code</button>}</div>
        <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); void confirm(); }}><label className="text-sm font-semibold">One-time code<input aria-label="One-time code" className="mt-1 block w-48 rounded-lg border border-slate-300 p-3 font-mono tracking-[.3em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g,''))}/></label><button className="btn-primary" disabled={busy || code.length !== 6}>{busy ? 'Verifying...' : 'Verify and complete'}</button></form>
        <div className="flex gap-4 text-xs"><button type="button" className="font-semibold underline" disabled={busy} onClick={send}>Send a new code</button><button type="button" className="underline" disabled={busy} onClick={reset}>Start again here</button></div>
      </div>}
      {verified && <div role="status" className="rounded-xl border border-bharat-200 bg-bharat-50 p-5 text-bharat-900"><h3 className="text-lg font-bold">Verification completed</h3><p className="mt-2 font-bold">No proxy / verified reporter</p>{verified.reporterId && <p className="mt-2 text-sm">Reporter ID: <strong className="font-mono">{verified.reporterId}</strong></p>}<p className="mt-2 text-sm">Your student ID and linked {verified.channel === 'sms' ? 'phone' : 'email'} code have been checked. You can now submit a grievance. No officer referral is required.</p></div>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </div>
  </section>;
}
