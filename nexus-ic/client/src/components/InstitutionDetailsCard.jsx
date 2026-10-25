import React, { useEffect, useState } from 'react';
import IndiaMap from './IndiaMap.jsx';
import { registryLabel } from './registryLabel.js';

const sourceLabel = registryLabel;

/** N97: the full details card shown after a college is chosen, with its map pin. */
export default function InstitutionDetailsCard({ institution, showMap = true }) {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('');
  useEffect(() => {
    if (!institution?.pid) return undefined;
    const controller = new AbortController();
    setProfile(null); setStatus('Loading details…');
    fetch(`/api/v1/institutions/public/${encodeURIComponent(institution.pid)}`, { credentials: 'include', signal: controller.signal })
      .then(response => (response.ok ? response.json() : null))
      .then(data => { if (!controller.signal.aborted) { setProfile(data); setStatus(data ? '' : 'Full profile unavailable (UNKNOWN); showing the search result.'); } })
      .catch(() => { if (!controller.signal.aborted) setStatus('Full profile unavailable (UNKNOWN); showing the search result.'); });
    return () => controller.abort();
  }, [institution?.pid]);
  if (!institution) return null;
  const row = { ...institution, ...(profile || {}) };
  const programmes = row.programmes?.length ? row.programmes.join(', ') : null;
  const approvalAsOf = row.source?.listDate || row.registrySnapshot?.fetchedAt?.slice?.(0, 10) || null;
  const fields = [
    ['Permanent Institute ID (PID)', row.pid, true],
    ['IIC ID / ICID', row.icid || 'ICID not available', true],
    ['Address', row.address || [row.city, row.district].filter(Boolean).join(', ') || null],
    ['State', row.state],
    ['District', row.district],
    ['AICTE region', row.region],
    ['Institution type', row.type],
    ['Programmes', programmes],
    ['Approval status', row.approvalStatus ? `${row.approvalStatus}${approvalAsOf ? ` (as of ${approvalAsOf})` : row.approvalValidUntil ? ` (valid until ${row.approvalValidUntil})` : ''}` : null],
  ].filter(([, value]) => value);
  return (
    <section aria-label="Selected institution details" data-testid="institution-details-card" className="rounded-xl border border-saffron-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-saffron-100 pb-2">
        <h3 className="text-base font-bold text-slate-900">{row.name}</h3>
        <span className="rounded-full border border-saffron-300 bg-saffron-50 px-2 py-0.5 text-[11px] font-semibold text-saffron-900">{sourceLabel(row)}</span>
      </div>
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
        {fields.map(([label, value, mono]) => (
          <div key={label}>
            <dt className="font-medium text-slate-500">{label}</dt>
            <dd className={`font-semibold text-slate-900 ${mono ? 'flex items-center gap-2 font-mono' : ''}`}>
              {value}
              {mono && value !== 'ICID not available' && (
                <button type="button" className="rounded border border-slate-200 px-1.5 text-[10px] font-sans text-slate-600 hover:border-saffron-400" aria-label={`Copy ${label}`}
                  onClick={() => navigator.clipboard?.writeText(String(value)).catch(() => {})}>Copy</button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {row.source?.kind === 'research' && <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
        <p className="font-semibold">Incomplete research export; current AICTE approval is not certified.</p>
        <p>ICID: {row.missingReasons?.icid || 'Not publicly verified in source'}. {row.region ? 'Region derived from the configured reference table; jurisdiction is not officially certified.' : 'Region unavailable in the configured reference table.'}</p>
        <p>Source: {row.provenance?.sourceFileName || row.source.sourceFileName}, sheet {row.provenance?.sheet || row.source.sheet}, row {row.provenance?.row || row.source.row}. Verification date: {row.provenance?.verificationDate || 'UNKNOWN'}.</p>
        {row.provenance?.sourceUrl?.startsWith('https://') && <a href={row.provenance.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold underline">Open institution source</a>}
        {!!row.courses?.length && <details><summary className="cursor-pointer font-semibold">View {row.courses.length} supplied course records</summary><ul className="mt-2 space-y-2">{row.courses.map((course,index) => <li key={index}>{[course.Level, course.Programme, course.Course, course['Academic Year']].filter(Boolean).join(' · ')} — intake: {course['Approved Intake (text)'] || 'UNKNOWN'}</li>)}</ul></details>}
      </div>}
      {status && <p className="mt-2 text-[11px] text-slate-500" role="status">{status}</p>}
      {showMap && (
        <IndiaMap className="mt-3" selectedRegion={row.region} selectedState={row.state} selectedCity={row.city}
          institutionName={row.name} institutionPid={row.pid} coordinates={row.coordinates || null} interactive={false} />
      )}
    </section>
  );
}
