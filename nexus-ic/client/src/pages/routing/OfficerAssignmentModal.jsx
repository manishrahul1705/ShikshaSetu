import React, { useState, useEffect } from 'react';

/**
 * Assignment and Route Override Modal for Triage (U17, N18, N73)
 */
export default function OfficerAssignmentModal({ caseItem, onClose, onAssigned }) {
  const [bureaus, setBureaus] = useState([]);
  const [selectedBureau, setSelectedBureau] = useState(caseItem.suggestedBureau || 'PGRC');
  const [officers, setOfficers] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [mode, setMode] = useState('ASSIGN'); // 'ASSIGN' or 'OVERRIDE'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch bureaus
  useEffect(() => {
    async function loadBureaus() {
      try {
        const res = await fetch('/api/v1/bureaus', { credentials: 'include' });
        if (res.ok) {
          const list = await res.json();
          setBureaus(list);
        }
      } catch {
        setError('Failed to fetch bureaus');
      }
    }
    loadBureaus();
  }, []);

  // Fetch officers for selected bureau
  useEffect(() => {
    async function loadOfficers() {
      if (!selectedBureau) return;
      try {
        const res = await fetch(`/api/v1/bureaus/${selectedBureau}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setOfficers(data.officers || []);
          if (data.officers && data.officers.length > 0) {
            setSelectedOfficerId(data.officers[0]._id);
          } else {
            setSelectedOfficerId('');
          }
        }
      } catch {
        setError('Failed to fetch bureau officers');
      }
    }
    loadOfficers();
  }, [selectedBureau]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'OVERRIDE' && !overrideReason.trim()) {
      setError('A recorded reason is strictly required to override jurisdiction routing');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'OVERRIDE') {
        const res = await fetch(`/api/v1/routing/${caseItem._id}/override`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            targetBureau: selectedBureau,
            reason: overrideReason,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Override failed');
        }
      }

      // If officer selected, assign officer
      if (selectedOfficerId) {
        const selOfficer = officers.find((o) => o._id === selectedOfficerId);
        const res = await fetch(`/api/v1/routing/${caseItem._id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            officerId: selectedOfficerId,
            officerName: selOfficer?.username || 'Bureau Officer',
            bureau: selectedBureau,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Officer assignment failed');
        }
      }

      onAssigned();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full flex flex-col overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Triage Jurisdiction & Assignment</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Case: {caseItem.masterCaseId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">{error}</div>}

          {/* Mode Switcher */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('ASSIGN')}
              className={`flex-1 py-1.5 font-bold rounded-md ${
                mode === 'ASSIGN' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
              }`}
            >
              Confirm / Assign Bureau Officer
            </button>
            <button
              type="button"
              onClick={() => setMode('OVERRIDE')}
              className={`flex-1 py-1.5 font-bold rounded-md ${
                mode === 'OVERRIDE' ? 'bg-white shadow text-red-700' : 'text-slate-500'
              }`}
            >
              Override Route Bureau
            </button>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Assigned Bureau / Cell</label>
            <select
              value={selectedBureau}
              onChange={(e) => setSelectedBureau(e.target.value)}
              disabled={mode === 'ASSIGN'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-800 outline-none"
            >
              {bureaus.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>

          {mode === 'OVERRIDE' && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Override Justification Reason (Audited & Invariant) <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Specify regulatory or jurisdictional grounds for routing override..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Assign Named Officer</label>
            {officers.length > 0 ? (
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-800 outline-none"
              >
                {officers.map((off) => (
                  <option key={off._id} value={off._id}>
                    {off.username} ({off.role})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-slate-400 italic text-[11px]">No active officers found in this bureau pool.</p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white font-semibold text-xs rounded-lg ${
                mode === 'OVERRIDE' ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              {loading ? 'Processing...' : mode === 'OVERRIDE' ? 'Confirm Route Override' : 'Assign & Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
