import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import { PageHeader, EmptyState } from '../../components/ui/PageKit.jsx';

export default function LeaveManagementPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [blockers, setBlockers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaveStatus, setLeaveStatus] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/absence/status', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        setLeaveStatus(json);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBlockers([]);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/absence/leave-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          reason,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        if (body.blockingCases && body.blockingCases.length > 0) {
          setBlockers(body.blockingCases);
          setError(body.error || t('absence.blockerWarning'));
        } else {
          throw new Error(body.error || 'Failed to apply for leave');
        }
      } else {
        setSuccess('Leave approved successfully.');
        await fetchStatus();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnFromLeave = async () => {
    try {
      const res = await fetch('/api/v1/absence/leave-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setSuccess('Returned from leave.');
        await fetchStatus();
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <PageHeader eyebrow="CONTINUITY OF OWNERSHIP" title={t('absence.title')} purpose="Hand over active cases through NEXUS TRACE before starting leave." />
      <section className="card card-pad space-y-3"><h2 className="card-title">Current absences in your scope</h2>{leaveStatus?.absences?.map(row=><article key={row.id} className="rounded-xl border border-ink-100 p-3 text-sm"><p className="font-semibold">{row.designation} · {row.office}</p><p>{row.startDate ? new Date(row.startDate).toLocaleDateString() : 'Start date unavailable'} – {row.endDate ? new Date(row.endDate).toLocaleDateString() : 'Return date not recorded'}</p></article>)}{leaveStatus?.absences?.length === 0 && <p className="text-sm text-ink-500">No current absences in your office scope.</p>}</section>

      {leaveStatus?.isOnLeave && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-lg flex justify-between items-center">
          <div>
            <span className="font-bold text-sm">Status: Currently on Leave</span>
            <p className="text-xs text-blue-700 mt-0.5">
              Reason: {leaveStatus.leaveDetails?.reason || 'Leave of absence'}
            </p>
          </div>
          <button
            onClick={handleReturnFromLeave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded"
          >
            Mark Returned
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded text-sm">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Blockers list */}
      {blockers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-amber-900">{t('absence.openCasesBlocked')}</h3>
            <Link
              to="/transfers"
              className="text-xs font-semibold text-blue-700 hover:underline bg-white px-2.5 py-1 rounded border border-blue-200"
            >
              Go to NEXUS TRACE Transfers &rarr;
            </Link>
          </div>
          <div className="divide-y divide-amber-100">
            {blockers.map((b) => (
              <div key={b.caseId} className="py-2 text-xs flex justify-between items-center text-amber-800">
                <span className="font-mono font-bold">{b.masterCaseId}</span>
                <span>Category: {b.category}</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-medium">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Form */}
      <form onSubmit={handleApplyLeave} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">{t('absence.requestLeave')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDateInput" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('absence.startDate')}
            </label>
            <input
              id="startDateInput"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="endDateInput" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('absence.endDate')}
            </label>
            <input
              id="endDateInput"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="reasonInput" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('absence.reason')}
          </label>
          <input
            id="reasonInput"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Official duty / medical leave"
            className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Validating Ownership...' : t('absence.requestLeave')}
        </button>
      </form>
    </div>
  );
}
