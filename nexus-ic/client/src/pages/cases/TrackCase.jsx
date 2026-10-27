import { metadataLabel } from '../../components/metadataLabel.js';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import ComplainantStatusCard from '../lifecycle/ComplainantStatusCard.jsx';

export default function TrackCase() {
  const { caseId } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCase() {
      if (!caseId) return;
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/v1/cases/${encodeURIComponent(caseId)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setCaseData(data);
        } else {
          // S21: 404 returned for IDOR denied
          setError(t('caseNotFound'));
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-slate-500 font-medium">
        Loading case journey...
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-red-200 rounded-xl p-8 shadow-sm text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">{t('caseNotFound')}</h2>
        <p className="mt-1 text-xs text-slate-500">
          Under zero-trust privacy rules, you can only track grievances you submitted.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block px-4 py-2 bg-blue-900 text-white font-semibold text-xs rounded-lg"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider font-mono">
            {t('masterCaseIdLabel')}
          </span>
          <h1 className="text-2xl font-black text-slate-900">{caseData.masterCaseId}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('submittedAt')}: {new Date(caseData.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 font-bold text-xs rounded-full uppercase tracking-wider">
            {caseData.status}
          </span>
        </div>
      </div>

      {/* N28 True & Transparent Complainant Lifecycle Status Card */}
      <ComplainantStatusCard caseId={caseData.masterCaseId} initialData={caseData} />

      {/* Institution Details */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          {t('institutionDetails')}
        </h3>
        <div className="text-xs space-y-1.5 text-slate-800">
          <div>
            <span className="text-slate-500">PID:</span>{' '}
            <span className="font-mono font-semibold">{caseData.institutionPid}</span>
          </div>
          {caseData.pidSnapshot && (
            <>
              <div>
                <span className="text-slate-500">{t('institutionName')}:</span>{' '}
                <span className="font-semibold">{caseData.pidSnapshot.name}</span>
              </div>
              <div>
                <span className="text-slate-500">{t('region')}:</span>{' '}
                <span>{caseData.pidSnapshot.region}</span> ({caseData.pidSnapshot.state})
              </div>
            </>
          )}
          {caseData.institutionIcid && (
            <div>
              <span className="text-slate-500">{t('icidLabel')}:</span>{' '}
              <span className="font-mono font-semibold">{caseData.institutionIcid}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grievance Details */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Complaint Classification
        </h3>
        <div className="text-xs space-y-1.5 text-slate-800">
          <div>
            <span className="text-slate-500">{t('category')}:</span>{' '}
            <span className="font-semibold">{caseData.category}</span>
          </div>
          <div>
            <span className="text-slate-500">{t('subCategory')}:</span>{' '}
            <span className="font-semibold">{metadataLabel(caseData.subCategory)}</span>
          </div>
          {caseData.languageTag && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Language Tag:</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded font-mono font-semibold uppercase text-[10px]">
                {caseData.languageTag}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
        <Link to="/dashboard" className="text-blue-900 font-semibold hover:underline">
          ← Back to Dashboard
        </Link>
        <span className="text-slate-400 font-mono">Channel: {caseData.channel || 'web'}</span>
      </div>
    </div>
  );
}
