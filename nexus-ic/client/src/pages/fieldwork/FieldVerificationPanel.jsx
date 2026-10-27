import React, { useState, useEffect } from 'react';
import InlinePreflight from '../../additions/n81-live-conflict-warning/InlinePreflight.jsx';
import { s5Request } from '../closure/api.jsx';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';

export default function FieldVerificationPanel() {
  const { caseId } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Schedule visit form
  const [visitDate, setVisitDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [preflight, setPreflight] = useState(null), [proceedReason, setProceedReason] = useState('');
  useEffect(() => { setPreflight(null); setProceedReason(''); }, [purpose, visitDate]);

  // Report submission form
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [siteReport, setSiteReport] = useState('');
  const [regionalInputs, setRegionalInputs] = useState('');

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/fieldwork/case/${encodeURIComponent(caseId)}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load field visits');
      const json = await res.json();
      setVisits(Array.isArray(json) ? json : json.visits || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) fetchVisits();
  }, [caseId]);

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    if (!visitDate || !purpose.trim()) return;
    try {
      setError('');
      if (!preflight) {
        setPreflight(await s5Request('/prevent/check-action', { method: 'POST', body: { caseId, actionType: 'INSPECTION', details: { subject: purpose.trim() } } }));
        return;
      }
      const res = await fetch('/api/v1/fieldwork/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          visitDate,
          purpose: purpose.trim(),
          proceedReason,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to schedule visit');
      }
      setVisitDate('');
      setPurpose('');
      await fetchVisits();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedVisitId || !siteReport.trim()) return;
    try {
      setError('');
      const res = await fetch(`/api/v1/fieldwork/visits/${selectedVisitId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteReport: siteReport.trim(),
          regionalInputs: regionalInputs.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to submit report');
      }
      setSelectedVisitId(null);
      setSiteReport('');
      setRegionalInputs('');
      await fetchVisits();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('fieldwork.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Regional Office physical site verification, infrastructure scrutiny and inspection reporting.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Schedule Form */}
      <form onSubmit={handleScheduleVisit} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">{t('fieldwork.scheduleInspection')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('fieldwork.visitDate')}
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('fieldwork.purpose')}
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Laboratory and safety inspection"
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>
        <InlinePreflight result={preflight} caseId={caseId} reason={proceedReason} onReason={setProceedReason} />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded"
        >
          {preflight?.result === 'REVIEW' ? 'Proceed anyway' : t('fieldwork.scheduleInspection')}
        </button>
      </form>

      {/* Visits List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 py-6">Loading field visits...</div>
        ) : visits.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
            No field visits recorded for this case.
          </div>
        ) : (
          visits.map((v) => (
            <div key={v._id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-slate-800 text-sm">{v.purpose}</span>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Region: {v.regionalOffice} &middot; Date: {new Date(v.visitDate).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    v.status === 'REPORT_SUBMITTED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {v.status === 'REPORT_SUBMITTED'
                    ? t('fieldwork.statusSubmitted')
                    : t('fieldwork.statusScheduled')}
                </span>
              </div>

              {v.siteReport && (
                <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm space-y-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-600">
                      {t('fieldwork.siteReport')}:
                    </span>
                    <p className="text-slate-800 text-xs mt-0.5 whitespace-pre-wrap">{v.siteReport}</p>
                  </div>
                  {v.regionalInputs && (
                    <div>
                      <span className="text-xs font-semibold text-slate-600">
                        {t('fieldwork.regionalInputs')}:
                      </span>
                      <p className="text-slate-800 text-xs mt-0.5 whitespace-pre-wrap">
                        {v.regionalInputs}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {v.status === 'SCHEDULED' && selectedVisitId !== v._id && (
                <button
                  onClick={() => setSelectedVisitId(v._id)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  {t('fieldwork.submitReport')} &rarr;
                </button>
              )}

              {/* Submit Report Form */}
              {selectedVisitId === v._id && (
                <form onSubmit={handleSubmitReport} className="pt-3 border-t space-y-3">
                  <h3 className="text-xs font-bold text-slate-900">{t('fieldwork.submitReport')}</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('fieldwork.siteReport')}
                    </label>
                    <textarea
                      value={siteReport}
                      onChange={(e) => setSiteReport(e.target.value)}
                      rows={3}
                      className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('fieldwork.regionalInputs')}
                    </label>
                    <textarea
                      value={regionalInputs}
                      onChange={(e) => setRegionalInputs(e.target.value)}
                      rows={2}
                      className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded"
                    >
                      Submit Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVisitId(null)}
                      className="text-slate-600 hover:bg-slate-100 text-xs font-semibold px-3 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
