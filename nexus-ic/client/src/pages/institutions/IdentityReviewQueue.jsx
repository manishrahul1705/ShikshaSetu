import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';

export default function IdentityReviewQueue() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [selectedReview, setSelectedReview] = useState(null);
  const [resolution, setResolution] = useState('CONFIRM_AUTHORITATIVE_PID');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/institutions/identity-reviews', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load identity reviews');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setActionError('Reason is required');
      return;
    }
    setSubmitting(true);
    setActionError('');
    try {
      const res = await fetch(`/api/v1/institutions/identity-reviews/${selectedReview._id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resolution, reason: reason.trim() }),
      });
      if (res.ok) {
        setSelectedReview(null);
        setReason('');
        fetchReviews();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to resolve review');
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
        <h1 className="text-2xl font-black text-slate-900 mb-1">
          Identity Review Queue (PID / ICID Disagreements & Ambiguous Campuses)
        </h1>
        <p className="text-xs text-slate-500">
          Under AICTE zero-trust identity rules, conflicts between Permanent Institute IDs (PID) and
          Innovation Council IDs (ICID) or campus hierarchy disagreements are never auto-resolved.
          Every resolution is an audited reviewer action with a mandatory justification.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading review queue...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">PID</th>
                <th className="p-3">ICID</th>
                <th className="p-3">Conflict Type</th>
                <th className="p-3">Institution / Details</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-900">{r.pid}</td>
                  <td className="p-3 font-mono text-slate-700">{r.icid || '—'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-900">
                      {r.conflictType}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{r.institutionName}</div>
                    <div className="text-[11px] text-slate-500">{r.details}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        r.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-900'
                          : 'bg-red-100 text-red-900'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {r.status === 'PENDING' ? (
                      <button
                        onClick={() => setSelectedReview(r)}
                        className="px-3 py-1 bg-blue-900 text-white font-bold rounded text-xs hover:bg-blue-800"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">
                    No pending identity reviews in the queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Resolve Identity Review: {selectedReview.pid}
            </h2>
            <p className="text-xs text-slate-600">
              Institution: <span className="font-semibold">{selectedReview.institutionName}</span>
              <br />
              Conflict: <span className="font-semibold">{selectedReview.details}</span>
            </p>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution Decision
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="CONFIRM_AUTHORITATIVE_PID">
                    Enforce PID as authoritative; disregard conflicting ICID
                  </option>
                  <option value="UPDATE_ICID_MAPPING">
                    Update institution_identifiers mapping with verified alias
                  </option>
                  <option value="SEPARATE_CAMPUS_ENTRY">
                    Register campus as distinct sub-unit with primary campus reference
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reviewer Justification / Reason (Mandatory & Audited)
                </label>
                <textarea
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide verifiable reason for identity conflict resolution..."
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-xs">{actionError}</div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 text-white font-bold rounded-lg text-xs hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
