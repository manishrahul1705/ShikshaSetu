import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function MasterInstitutions() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit modal
  const [selectedInst, setSelectedInst] = useState(null);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/institutions/master/institutions', {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Failed to load master institutions');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setActionError('Reason is required for master data modification');
      return;
    }
    setSubmitting(true);
    setActionError('');
    try {
      const res = await fetch(`/api/v1/institutions/master/institutions/${selectedInst.pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, region, reason: reason.trim() }),
      });
      if (res.ok) {
        setSelectedInst(null);
        setReason('');
        fetchInstitutions();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Update failed');
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
              Master Data: Institutions Registry
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative institution registry. Every modification produces a versioned audit trail.
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs uppercase tracking-wide">
            Institution registry
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading institutions...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">PID</th>
                <th className="p-3">Name</th>
                <th className="p-3">State</th>
                <th className="p-3">Region</th>
                <th className="p-3">ICID</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.institutions?.map((inst) => (
                <tr key={inst.pid} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-900">{inst.pid}</td>
                  <td className="p-3 font-semibold text-slate-900">{inst.name}</td>
                  <td className="p-3 text-slate-600">{inst.state}</td>
                  <td className="p-3 text-slate-600">{inst.region}</td>
                  <td className="p-3 font-mono text-slate-500">{inst.icid || '—'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedInst(inst);
                        setName(inst.name);
                        setRegion(inst.region);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-xs"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedInst && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Edit Master Institution: {selectedInst.pid}
            </h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Northern">Northern</option>
                  <option value="Western">Western</option>
                  <option value="Southern">Southern</option>
                  <option value="Central">Central</option>
                  <option value="Eastern">Eastern</option>
                  <option value="North Eastern">North Eastern</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Edit (Audited)
                </label>
                <textarea
                  rows="2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide required justification..."
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
                  onClick={() => setSelectedInst(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white font-bold rounded-lg text-xs hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
