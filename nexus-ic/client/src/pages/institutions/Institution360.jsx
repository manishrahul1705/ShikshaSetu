import { metadataLabel } from '../../components/metadataLabel.js';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import OverlapBanner from '../prevent/OverlapBanner.jsx';
import InstitutionCaseJourney from './InstitutionCaseJourney.jsx';
import { InstitutionGraphView } from '../graph/InstitutionGraph.jsx';
import InstitutionTrend from '../../components/InstitutionTrend.jsx';
import ResponseRecord from '../../additions/n88-first-redressal/ResponseRecord.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';
import { CodeText } from '../../components/ui/PageKit.jsx';

export default function Institution360() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Reclassification modal state (for regional officers / supervisors)
  const [reclassModalOpen, setReclassModalOpen] = useState(false);
  const [newRegion, setNewRegion] = useState('');
  const [reclassReason, setReclassReason] = useState('');
  const [reclassSubmitting, setReclassSubmitting] = useState(false);
  const [reclassError, setReclassError] = useState('');

  const fetch360 = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/institutions/${encodeURIComponent(id)}/360`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setNewRegion(json.institution.region);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to load Institution 360');
      }
    } catch {
      setError('Network error loading Institution 360');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetch360();
  }, [id]);

  const handleReclassify = async (e) => {
    e.preventDefault();
    if (!reclassReason.trim()) {
      setReclassError('Reason is required for region reclassification');
      return;
    }
    setReclassSubmitting(true);
    setReclassError('');

    try {
      const res = await fetch(`/api/v1/institutions/${encodeURIComponent(id)}/reclassify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newRegion, reason: reclassReason }),
      });
      if (res.ok) {
        setReclassModalOpen(false);
        setReclassReason('');
        await fetch360();
      } else {
        const err = await res.json();
        setReclassError(err.error || 'Failed to reclassify region');
      }
    } catch {
      setReclassError('Network error');
    } finally {
      setReclassSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-500 font-medium">
        Loading Institution 360 composite view...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-red-200 rounded-xl p-8 shadow-sm text-center">
        <h2 className="text-xl font-bold text-red-900">Institution Not Found</h2>
        <p className="mt-2 text-sm text-slate-600">{error || 'Could not load record'}</p>
        <Link to="/dashboard" className="inline-block mt-4 text-sm font-semibold text-blue-900 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { institution, jurisdiction, icidMapping, attentionIndicators, grievances } = data;
  const canReclassify = ['supervisor', 'competent_authority', 'system_admin'].includes(user?.role);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <OverlapBanner institutionPid={id} />
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-mono">
              PID: {institution.pid}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              {institution.approvalStatus}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">{institution.name}</h1>
          <p className="mt-2 text-xs font-mono">ICID: {institution.icid || t('notAvailable')} · {institution.icid ? (icidMapping?.some(mapping => mapping.icid === institution.icid && mapping.mappedPid === institution.pid && mapping.status === 'active') ? 'MATCH' : 'IDENTITY_REVIEW') : 'NOT_AVAILABLE'}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            <span aria-hidden="true">📍 </span>{institution.state} • {institution.region} Region • {institution.type}
          </p>
        </div>

        {canReclassify && (
          <button
            onClick={() => setReclassModalOpen(true)}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors self-start md:self-auto"
          >
            Reclassify Region
          </button>
        )}
      </div>

      <InstitutionTrend grievances={grievances} />
      {['bureau_officer','regional_officer','supervisor','competent_authority','institution_admin'].includes(user?.role) && <ResponseRecord pid={id} />}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile & Identification */}
        <div className="space-y-6">
          {/* IIC ID Mapping Block (N09 Touchpoint 3) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {t('icidMapping')}
            </h2>
            {icidMapping && icidMapping.length > 0 ? (
              <div className="space-y-3">
                {icidMapping.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-blue-900">{m.icid}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 font-semibold rounded">
                        {m.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Source: {m.source}</div>
                    <div className="text-[11px] text-slate-500">Verified: {new Date(m.lastVerifiedDate).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No secondary ICIDs mapped</p>
            )}
          </div>

          {/* Aliases & Campuses (F02, F03) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {t('aliases')}
              </h2>
              {institution.aliases && institution.aliases.length > 0 ? (
                <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                  {institution.aliases.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">{t('noAliases')}</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Campus Hierarchy
              </h2>
              {institution.campuses && institution.campuses.length > 0 ? (
                <div className="space-y-2">
                  {institution.campuses.map((c, i) => (
                    <div key={i} className="text-xs p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="font-semibold text-slate-800">{c.name}</div>
                      <div className="text-[10px] text-slate-500">ID: {c.campusId}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Main single campus only</p>
              )}
            </div>
          </div>

          {/* Jurisdiction / Region Classification (N11) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t('jurisdiction')}
            </h2>
            <div className="text-xs space-y-2 text-slate-700">
              <div>
                <span className="text-slate-500">AICTE Region:</span>{' '}
                <span className="font-semibold text-slate-900">{jurisdiction.region}</span>
              </div>
              <div>
                <span className="text-slate-500">State:</span>{' '}
                <span className="font-semibold text-slate-900">{jurisdiction.statesUnderRegion}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Ref: <RuleVersion value={jurisdiction.referenceTable} family="Region rule" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols wide): Attention Indicators & Related Grievances */}
        <div className="md:col-span-2 space-y-6">
          {/* Attention Indicators (N12, E07 - NO Guilt/Risk Score!) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('attentionIndicators')}
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">
                Transparent operational reasons • Never an institutional score
              </span>
            </div>

            {attentionIndicators && attentionIndicators.length > 0 ? (
              <div className="space-y-2">
                {attentionIndicators.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
                      item.status === 'UNKNOWN'
                        ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="mt-0.5 font-bold">
                      {item.status === 'UNKNOWN' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.status === 'UNKNOWN' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 font-mono font-bold rounded">
                            UNKNOWN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5"><CodeText value={item.reason} /></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">{t('noAttentionIndicators')}</p>
            )}
          </div>

          {/* Related Grievances (N12, Single-Window Contract) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('relatedGrievances')}
                </h2>
                <span className="text-xs text-slate-500">Total: {grievances.total}</span>
              </div>
              {grievances.restrictedNotice && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                  {grievances.restrictedNotice}
                </span>
              )}
            </div>

            {grievances.visible && grievances.visible.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                {grievances.visible.map((g, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                    <div>
                      {g.opaqueCounterpart ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-500">{g.masterCaseId}</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                            {t('counterpartOpaque')} ({g.owningBureau})
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/track/${g.masterCaseId}`}
                              className="font-mono font-bold text-blue-900 hover:underline"
                            >
                              {g.masterCaseId}
                            </Link>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[10px] font-semibold">
                              {g.status}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            {g.category} {g.subCategory ? `• ${metadataLabel(g.subCategory)}` : ''}
                          </div>
                          {['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor'].includes(user?.role) && <InstitutionCaseJourney masterCaseId={g.masterCaseId} />}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-4 text-center">No complaints filed for this institution</p>
            )}
          </div>
        </div>
      </div>

      {['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor'].includes(user?.role) && <InstitutionGraphView pid={id} />}
      {/* Region Reclassification Modal (N11) */}
      {reclassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reclassify Region</h3>
            <p className="text-xs text-slate-500 mb-4">
              Reviewer action with a mandatory, audited reason.
            </p>

            {reclassError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs rounded-lg">
                {reclassError}
              </div>
            )}

            <form onSubmit={handleReclassify} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  New Region
                </label>
                <select
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Reclassification *
                </label>
                <textarea
                  rows="3"
                  value={reclassReason}
                  onChange={(e) => setReclassReason(e.target.value)}
                  placeholder="State official AICTE administrative or jurisdictional transfer order reference..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReclassModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reclassSubmitting}
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg"
                >
                  {reclassSubmitting ? 'Saving...' : 'Confirm Reclassification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
