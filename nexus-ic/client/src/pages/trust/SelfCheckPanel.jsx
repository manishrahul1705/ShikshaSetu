import React, { useState } from 'react';

export const SIMULATED_LABEL = 'Simulated check, not a government verification';
const ERRORS = {
  BAD_CHECKSUM: 'That number fails the checksum. Check the digits and try again.',
  UNKNOWN_NUMBER: 'That number is not in the simulated registry.',
  INVALID_FORMAT: 'Enter exactly 12 digits.',
  INACTIVE: 'The simulated registry shows this enrolment as inactive.',
  TOO_MANY_FAILED_TRIES: 'Too many failed tries. Your request has gone to an officer for review.',
  MANUAL_REVIEW_PENDING: 'An officer review is already pending for your account.',
  ALREADY_VERIFIED: 'Your identity is already verified.',
  CONSENT_REQUIRED: 'Please give consent first.',
  LOOKUP_REQUIRED: 'Fetch your details again before confirming.',
};

async function post(path, body) {
  const response = await fetch(`/api/v1/identity/self-check/${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'IDENTITY_OPERATION_FAILED');
  return data;
}

/** N99: instant simulated self-check for students (ABC ID, or a synthetic Aadhaar-style number). */
export default function SelfCheckPanel({ institutionPid = null, onVerified = null }) {
  const [kind, setKind] = useState('abc');
  const [number, setNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [lookup, setLookup] = useState(null);
  const [heldNumber, setHeldNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async work => { setBusy(true); setError(''); try { await work(); } catch (err) { setError(ERRORS[err.message] || 'The simulated check could not be completed.'); } finally { setBusy(false); } };
  const fetchDetails = () => run(async () => {
    const data = await post('lookup', { kind, number, consent, ...(institutionPid ? { institutionPid } : {}) });
    // The full number is never shown back: the field is cleared and only the last four digits remain.
    setHeldNumber(number); setNumber('');
    if (data.status === 'manual_review') { setResult(data); setLookup(null); return; }
    setLookup(data);
  });
  const answer = detailsAreMine => run(async () => {
    const data = await post('confirm', { kind, number: heldNumber, consent, detailsAreMine, ...(institutionPid ? { institutionPid } : {}) });
    setHeldNumber(''); setLookup(null); setResult(data);
    if (data.status === 'verified') onVerified?.(data);
  });
  return (
    <section aria-label="Instant self-check" className="space-y-4 rounded-xl border-2 border-saffron-300 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">Instant self-check (no officer needed)</h2>
        <span className="rounded-full border border-saffron-300 bg-saffron-50 px-3 py-1 text-xs font-bold text-saffron-900" data-testid="simulated-label">{SIMULATED_LABEL}</span>
      </div>
      {!lookup && !result && (
        <>
          <div role="tablist" aria-label="Identity number type" className="inline-flex rounded-lg border border-slate-200 p-1">
            {[['abc', 'I have an ABC ID'], ['aadhaar', 'I don’t have an ABC ID']].map(([value, label]) => (
              <button key={value} type="button" role="tab" aria-selected={kind === value} onClick={() => { setKind(value); setNumber(''); setError(''); }}
                className={`min-h-10 rounded-md px-3 text-sm font-semibold ${kind === value ? 'bg-saffron-500 text-white' : 'text-slate-700 hover:bg-saffron-50'}`}>{label}</button>
            ))}
          </div>
          <label className="block space-y-1 text-sm font-medium text-slate-800">
            {kind === 'abc' ? 'Your ABC ID (12 digits)' : 'Aadhaar number (synthetic test number only, 12 digits)'}
            <input className="w-full rounded-lg border border-slate-300 p-2 font-mono focus:ring-2 focus:ring-saffron-400" inputMode="numeric" autoComplete="off" maxLength={14}
              value={number} onChange={event => setNumber(event.target.value.replace(/[^\d\s-]/g, ''))} aria-describedby="selfcheck-help" />
          </label>
          <p id="selfcheck-help" className="text-xs text-slate-600">
            {kind === 'abc'
              ? 'Your details are fetched from the local ABC simulator for you to confirm. Nothing is sent to any government system.'
              : 'Checked on this server only: 12 digits, the Verhoeff checksum, and the simulator’s list of synthetic numbers. Never enter a real Aadhaar number. Only the last four digits and a salted hash are kept.'}
          </p>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1" />
            I consent to this simulated identity check for raising grievances.
          </label>
          <button type="button" className="btn-primary" disabled={busy || !consent || number.replace(/\D/g, '').length !== 12} onClick={fetchDetails}>{busy ? 'Checking…' : 'Fetch my details'}</button>
        </>
      )}
      {lookup && (
        <div className="space-y-3" aria-label="Confirm your details">
          <p className="text-sm text-slate-700">Number ending <span className="font-mono font-bold">••••{lookup.last4}</span>. Are these your details?</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[['Name', lookup.details.name], ['Institution (PID)', lookup.details.institutionPid], ['Programme', lookup.details.programme], ['Enrolment status', lookup.details.enrolment]].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 p-2"><dt className="text-xs text-slate-500">{label}</dt><dd className="font-semibold text-slate-900" data-jury-private={label === 'Name' ? '' : undefined}>{value}</dd></div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={busy} onClick={() => answer(true)}>Yes, these are my details</button>
            <button type="button" className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-saffron-400" disabled={busy} onClick={() => answer(false)}>No, these are not mine</button>
          </div>
        </div>
      )}
      {result?.status === 'verified' && <p role="status" className="rounded-lg border border-bharat-200 bg-bharat-50 p-3 text-sm font-semibold text-bharat-800">Verified instantly (simulated). Number ending ••••{result.last4}. You can now file a grievance.</p>}
      {result?.status === 'manual_review' && <p role="status" className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-800">Your request has gone to an officer for review (the existing manual review). You will be notified of the decision.</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </section>
  );
}
