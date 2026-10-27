import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InstitutionPicker from '../../components/InstitutionPicker.jsx';
import IndiaMap from '../../components/IndiaMap.jsx';

export default function InstitutionLookup() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  async function lookup(pid) {
    if (!pid.trim()) return;
    setLoading(true); setError(''); setResult(null); setMatches([]);
    try {
      const isIcid = /^IIC-[A-Z0-9]{8}$/i.test(pid.trim());
      const endpoint = isIcid
        ? '/api/v1/registry/public/institutions/by-icid/' + encodeURIComponent(pid.trim())
        : '/api/v1/institutions/public/' + encodeURIComponent(pid.trim());
      const response = await fetch(endpoint, { credentials: 'include' });
      if (response.status === 401) { setError('Sign in to look up institutions in the registry.'); return; }
      const data = await response.json();
      if (data.status === 'UNKNOWN') setResult(data);
      else if (response.ok && (data.institution || (data.found && data.profile) || data.pid)) setResult({ status: 'AVAILABLE', institution: data.institution || data.profile || data });
      else setError('The institution could not be found. Check its PID or choose a result above.');
    } catch { setError('The registry could not be reached. Please try again.'); }
    finally { setLoading(false); }
  }
  async function handleSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    if (/^1-\d{10}$/.test(value)) {
      void lookup(value);
      return;
    }

    setLoading(true); setError(''); setResult(null); setMatches([]);
    try {
      const response = await fetch(`/api/v1/institutions/public-search?q=${encodeURIComponent(value)}`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The institution search is unavailable.');
      const found = Array.isArray(data.institutions) ? data.institutions : [];
      if (found.length === 0) {
        setError('The institution could not be found. Check the name, PID or ICID.');
      } else if (found.length === 1) {
        await lookup(found[0].pid);
      } else {
        setMatches(found);
      }
    } catch (err) {
      setError(err.message || 'The registry could not be reached. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 mb-2 border-b-4 border-saffron-500 pb-2">
          Institution Master Registry Lookup
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Find institutions by Permanent Institute ID (PID) or Innovation Council ID (ICID).
        </p>

        <InstitutionPicker onSelect={row => { setQuery(row.pid); void lookup(row.pid); }} />
        <form onSubmit={handleSearch} className="mt-4 flex flex-wrap gap-2">
          <label className="min-w-0 flex-1"><span className="mb-1 block text-xs font-semibold text-ink-500">Or enter an exact PID or ICID</span>
          <input type="text" value={query} onChange={event => setQuery(event.target.value)} placeholder="Enter AICTE Permanent Institute ID (PID), e.g., 1-1234567890" className="w-full rounded-lg border border-ink-200 px-4 py-2 text-sm" />
          </label>
          <button type="submit" disabled={loading} className="btn-primary self-end">{loading ? 'Searching...' : 'Lookup'}</button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
        {matches.length > 0 && (
          <div className="mt-4 space-y-2" aria-label="Institution search results">
            <p className="text-xs font-semibold text-slate-700">Select the institution to fetch its complete registry profile:</p>
            {matches.map((row) => (
              <button
                type="button"
                key={row.pid}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs hover:border-saffron-400 hover:bg-saffron-50"
                onClick={() => { setQuery(row.name); void lookup(row.pid); }}
              >
                <strong className="block text-sm text-slate-900">{row.name}</strong>
                <span>{[row.city, row.state, row.region, row.type].filter(Boolean).join(' · ')}</span>
                <span className="mt-1 block font-mono">{row.pid} · {row.icid || 'ICID not available'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* N100: explore colleges by state before choosing one */}
      {!result && !loading && (
        <IndiaMap explorer interactive={false} onSelectInstitution={row => { setQuery(row.pid); void lookup(row.pid); }} />
      )}

      {/* Results Panel */}
      {result && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Registry Result</h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                result.status === 'AVAILABLE'
                  ? 'bg-green-100 text-green-900'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {result.status}
            </span>
          </div>

          {result.status === 'UNKNOWN' ? (
            <div className="p-6 bg-amber-50 rounded-lg border border-amber-200 text-center space-y-2">
              <div className="text-2xl font-black text-amber-900">UNKNOWN</div>
              <p className="text-xs text-amber-800 font-medium">
                Reason: {result.reason || 'Master registry feed unavailable'}
              </p>
              <p className="text-[11px] text-amber-700">
                Notice: Missing feeds never render as zeros or empty panels.
              </p>
            </div>
          ) : result.institution ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Institution Name</span>
                  <div className="text-sm font-bold text-slate-900">{result.institution.name}</div>
                  {result.institution.aliases && result.institution.aliases.length > 0 && (
                    <div className="mt-1 text-[11px] text-slate-600">
                      Verified Aliases: {result.institution.aliases.join(', ')}
                    </div>
                  )}
                  {result.institution.aliases?.length > 0 && (
                    <div className="mt-1 text-[11px] text-slate-600">
                      Search names: {result.institution.aliases.join(', ')}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Permanent Institute ID (PID)</span>
                  <div className="text-sm font-mono font-bold text-blue-900">{result.institution.pid}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">State & District</span>
                  <div className="text-slate-900 font-semibold">
                    {result.institution.district ? `${result.institution.district}, ` : ''}{result.institution.state}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">City</span>
                  <div className="text-slate-900 font-semibold">{result.institution.city || 'UNKNOWN'}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">AICTE Region</span>
                  <div className="text-slate-900 font-semibold">{result.institution.region}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Institution Type</span>
                  <div className="text-slate-900 font-semibold">{result.institution.type || 'UNKNOWN'}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Innovation Council ID (ICID)</span>
                  <div className="text-slate-900 font-mono">
                    {result.institution.icid || 'not available'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Approval Status</span>
                  <div className="text-green-700 font-bold">
                    {result.institution.approvalStatus || 'UNKNOWN'}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2 text-xs font-semibold text-saffron-900">
                Source: {result.institution.source?.label || (result.institution.synthetic ? 'Fictional demo data' : 'Registry record')}
              </div>

              {/* SPEC Appendix V, stage 2: auto-fetch checklist and region-wise classification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div aria-label="Fetch Institution Details (Auto)" className="border rounded-lg p-3">
                  <h3 className="font-bold text-slate-900 mb-1">Fetch Institution Details (Auto)</h3>
                  <ul>
                    {[
                      ['College name', result.institution.name],
                      ['State / district', [result.institution.district, result.institution.state].filter(Boolean).join(', ')],
                      ['AICTE region', result.institution.region],
                      ['Institution type', result.institution.type],
                      ['Campus details (if any)', (result.institution.campuses || []).length ? `${result.institution.campuses.length} campus(es)` : null],
                      ['IIC ID / ICID (if available)', result.institution.icid],
                      ['Approval status', result.institution.approvalStatus],
                      ['Programmes', result.institution.programmes?.length ? result.institution.programmes.join(', ') : null],
                    ].map(([label, value]) => (
                      <li key={label}>{value ? '✓' : '○'} {label}: {value || (label.includes('ICID') || label.includes('Campus') ? 'not available' : 'UNKNOWN')}</li>
                    ))}
                  </ul>
                </div>
                <div aria-label="REGION-WISE CLASSIFICATION" className="border rounded-lg p-3">
                  <h3 className="font-bold text-slate-900 mb-1">REGION-WISE CLASSIFICATION</h3>
                  <div className="flex flex-wrap gap-1">
                    {['Northern', 'Western', 'Southern', 'Central', 'Eastern', 'North Eastern'].map((r) => (
                      <span key={r} className={`px-2 py-0.5 rounded-full border ${r === result.institution.region ? 'bg-blue-900 text-white font-bold' : 'bg-slate-50 text-slate-600'}`}>{r}</span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">State-to-region mapping from the versioned reference table (Region rule v1).</p>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Link
                  to={`/institutions/${encodeURIComponent(result.institution.pid)}`}
                  className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-800"
                >
                  View Institution 360 →
                </Link>
              </div>
              <IndiaMap
                selectedRegion={result.institution.region}
                selectedState={result.institution.state}
                selectedCity={result.institution.city}
                institutionName={result.institution.name}
                institutionPid={result.institution.pid}
                interactive={false}
                explorer
                onSelectInstitution={row => { setQuery(row.pid); void lookup(row.pid); }}
                className="mt-2"
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
