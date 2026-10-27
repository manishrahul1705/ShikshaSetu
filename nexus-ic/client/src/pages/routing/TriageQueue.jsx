import { metadataLabel } from '../../components/metadataLabel.js';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import OfficerAssignmentModal from './OfficerAssignmentModal.jsx';
import RuleVersion, { policyText } from '../../components/RuleVersion.jsx';

export default function TriageQueue() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [triageCases, setTriageCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchTriage = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/routing/triage', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTriageCases(data);
      } else {
        setError('Failed to fetch triage queue');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriage();
  }, []);

  // Sensitivity confirmation (S20, U18)
  const handleConfirmSensitive = async (caseId, flagIndex) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/v1/priority/${caseId}/confirm-sensitive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ flagIndex, reason: 'Confirmed by Triage Supervisor' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Sensitivity flag confirmed. Priority elevated to ${data.priority} and handling restricted.`);
        fetchTriage();
      } else {
        setError(data.error || 'Failed to confirm sensitivity');
      }
    } catch {
      setError('Error confirming sensitivity');
    }
  };

  // Sensitivity dismissal (U18)
  const handleDismissSensitive = async (caseId, flagIndex) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/v1/priority/${caseId}/dismiss-sensitive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ flagIndex, reason: 'Dismissed by Triage Supervisor as false positive' }),
      });
      if (res.ok) {
        setSuccessMsg('Sensitivity flag dismissed.');
        fetchTriage();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to dismiss sensitivity');
      }
    } catch {
      setError('Error dismissing sensitivity');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider font-mono">
            {t('routing.triage.title')}
          </span>
          <h1 className="text-2xl font-black text-slate-900">Jurisdiction & Triage Management</h1>
          <p className="text-xs text-slate-500 mt-1">{t('routing.triage.subtitle')}</p>
        </div>
        <div>
          <button
            onClick={fetchTriage}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg"
          >
            ↻ Refresh Queue
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Triage Cases Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Pending Human Triage ({triageCases.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Cases below the RuleBook confidence threshold, ambiguous, or with no approved rule
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading triage queue...</div>
        ) : triageCases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No cases currently pending manual triage. All submissions resolved deterministically by NEXUS ROUTE.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">{t('routing.triage.masterCaseId')}</th>
                  <th className="p-3.5">{t('routing.triage.category')}</th>
                  <th className="p-3.5">{t('routing.triage.suggestedBureau')}</th>
                  <th className="p-3.5">{t('routing.triage.confidence')}</th>
                  <th className="p-3.5">{t('routing.triage.flags')}</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {triageCases.map((c) => {
                  const decision = c.routingDecision;
                  const suggestedBureau = decision?.suggestedBureau || c.owningBureau || 'UNKNOWN';
                  // A missing confidence is UNKNOWN, never a number (Rule 5).
                  const confidence = typeof decision?.confidence === 'number' ? decision.confidence : null;
                  const hasSensitivity = Array.isArray(c.sensitivityFlags) && c.sensitivityFlags.some((f) => f.status === 'SUGGESTED');

                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-900">
                        {c.masterCaseId}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{c.category}</div>
                        <div className="text-[11px] text-slate-500">{metadataLabel(c.subCategory)}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded text-[11px]">
                          {suggestedBureau}
                        </span>
                        <details className="mt-1 text-[11px]">
                          <summary className="cursor-pointer font-semibold">Routing Decision (Explainable)</summary>
                          <dl>
                            <dt className="font-semibold">Primary Bureau / Cell</dt><dd>{decision?.primary || suggestedBureau}</dd>
                            <dt className="font-semibold">Secondary Bureau (if required)</dt><dd>{decision?.secondary || 'none'}</dd>
                            <dt className="font-semibold">Manual review (if ambiguous)</dt><dd>{decision?.isManualReview || c.requiresManualReview ? 'Yes' : 'No'}</dd>
                            <dt className="font-semibold">Reason for routing</dt><dd>{policyText((decision?.reasons || []).join('; ')) || 'UNKNOWN'} {decision?.ruleVersion && <RuleVersion value={decision.ruleVersion} family="Routing rule" />}</dd>
                          </dl>
                        </details>
                      </td>
                      <td className="p-3.5">
                        {confidence === null ? (
                          <span className="font-mono text-[11px] text-slate-700">UNKNOWN</span>
                        ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                confidence >= 0.70 ? 'bg-emerald-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.round(confidence * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-700">
                            {Math.round(confidence * 100)}%
                          </span>
                        </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {c.requiresManualReview && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                              LOW_CONFIDENCE
                            </span>
                          )}
                          {hasSensitivity && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold text-[10px]">
                              SENSITIVITY_DETECTED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasSensitivity && (
                            <button
                              onClick={() => handleConfirmSensitive(c._id, 0)}
                              className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded font-bold text-[10px]"
                            >
                              Confirm Sensitive
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedCase({ ...c, suggestedBureau })}
                            className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded font-semibold text-[11px]"
                          >
                            Assign / Override
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCase && (
        <OfficerAssignmentModal
          caseItem={selectedCase}
          onClose={() => setSelectedCase(null)}
          onAssigned={() => {
            setSelectedCase(null);
            setSuccessMsg('Case assigned and dispatched to operational bureau successfully.');
            fetchTriage();
          }}
        />
      )}
    </div>
  );
}
