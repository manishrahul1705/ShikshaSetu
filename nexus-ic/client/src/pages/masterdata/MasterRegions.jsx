import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';

export default function MasterRegions() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit modal
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [name, setName] = useState('');
  const [states, setStates] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/institutions/master/regions', {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Failed to load regions master data');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setActionError('Reason is required for region master data update');
      return;
    }
    setSubmitting(true);
    setActionError('');
    try {
      const stateList = states
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/v1/institutions/master/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: selectedRegion.code,
          name,
          states: stateList,
          reason: reason.trim(),
        }),
      });

      if (res.ok) {
        setSelectedRegion(null);
        setReason('');
        fetchRegions();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to update region');
      }
    } catch {
      setActionError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Master Data: AICTE Six-Region Classification
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Versioned reference table: Northern, Western, Southern, Central, Eastern, North Eastern.
            </p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs uppercase tracking-wide">
              <RuleVersion value={data?.version || 'DEMO-REGIONS-v1'} family="Region rule" />
            </span>
            <div className="text-[10px] text-slate-400 mt-1">
              Versioned reference table
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading regions...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.regions?.map((reg) => (
            <div
              key={reg.code}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-900 font-mono uppercase tracking-wider">
                    {reg.code} Region
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{reg.name}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedRegion(reg);
                    setName(reg.name);
                    setStates(reg.states?.join(', ') || '');
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-xs"
                >
                  Edit
                </button>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Covered States / UTs
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {reg.states?.map((st) => (
                    <span
                      key={st}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRegion && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Edit Master Region: {selectedRegion.code}
            </h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Region Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  States / Union Territories (comma-separated)
                </label>
                <textarea
                  rows="3"
                  value={states}
                  onChange={(e) => setStates(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Update (Audited)
                </label>
                <textarea
                  rows="2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mandatory justification for region realignment..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded">{actionError}</div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRegion(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white font-bold rounded-lg text-xs hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Region Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
