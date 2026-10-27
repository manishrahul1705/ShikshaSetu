import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import RuleChangeModal from './RuleChangeModal.jsx';
import WhatIfPreviewModal from './WhatIfPreviewModal.jsx';
import RuleVersion, { policyText } from '../../components/RuleVersion.jsx';
import PolicyTable from './PolicyTable.jsx';
import { CodeText } from '../../components/ui/PageKit.jsx';

export default function RuleBook() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState('JURISDICTION');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showChangeModal, setShowChangeModal] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);

  // Load families and active rules
  useEffect(() => {
    async function loadFamilies() {
      try {
        const res = await fetch('/api/v1/rulebook/families', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setFamilies(data.families || []);
          if (data.families && data.families.length > 0 && !selectedFamily) {
            setSelectedFamily(data.families[0]);
          }
        }
      } catch {
        setError('Failed to load rule families');
      }
    }
    loadFamilies();
  }, []);

  // Load versions for selected family
  const loadVersions = async (family) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/v1/rulebook/versions?family=${encodeURIComponent(family)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const list = await res.json();
        setVersions(list);
      } else {
        setError('Failed to fetch versions');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFamily) {
      loadVersions(selectedFamily);
    }
  }, [selectedFamily]);

  // Run dry run
  const handleDryRun = async (versionId) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/v1/rulebook/versions/${versionId}/dry-run`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.passed) {
        setSuccessMsg(`Dry-run PASSED: ${data.passedCases}/${data.totalCases} cases verified.`);
        loadVersions(selectedFamily);
      } else {
        setError(`Dry-run FAILED: ${data.error || 'One or more fixture test cases failed.'}`);
      }
    } catch {
      setError('Failed to execute dry-run test');
    }
  };

  // Approve version
  const handleApprove = async (versionId) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/v1/rulebook/versions/${versionId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Version approved and activated as active policy!`);
        loadVersions(selectedFamily);
      } else {
        setError(data.error || 'Approval rejected');
      }
    } catch {
      setError('Failed to approve version');
    }
  };

  const activeVersion = versions.find((v) => v.status === 'approved');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider font-mono">
            {t('rulebook.title')}
          </span>
          <h1 className="text-2xl font-black text-slate-900">AICTE RuleBook Policy Manager</h1>
          <p className="text-xs text-slate-500 mt-1">{t('rulebook.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChangeModal(true)}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-sm"
          >
            + {t('rulebook.requestChange')}
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

      {/* Family Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {families.map((fam) => (
          <button
            key={fam}
            onClick={() => setSelectedFamily(fam)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              selectedFamily === fam
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CodeText value={fam} />
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Versions List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Version Registry ({versions.length})
          </h3>

          {loading ? (
            <div className="p-6 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
              Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
              No versions found for {selectedFamily}.
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((ver) => {
                const isApproved = ver.status === 'approved';
                const isDraft = ver.status === 'draft';
                return (
                  <div
                    key={ver._id}
                    className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                      isApproved
                        ? 'bg-white border-emerald-300 shadow-sm ring-1 ring-emerald-200'
                        : isDraft
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-sm block">
                          <RuleVersion value={ver.version} />
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Effective: {new Date(ver.effectiveFrom).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDraft
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {ver.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>
                        Requested by:{' '}
                        <span className="font-semibold">{ver.requestedBy?.username || ver.requestedBy || 'System Seed'}</span>
                      </div>
                      {ver.approvedBy && (
                        <div>
                          Approved by:{' '}
                          <span className="font-semibold text-emerald-700">
                            {ver.approvedBy?.username || ver.approvedBy}
                          </span>
                        </div>
                      )}
                      <div>
                        Dry-run status:{' '}
                        {ver.dryRunPassed ? (
                          <span className="text-emerald-700 font-bold">✓ PASSED</span>
                        ) : (
                          <span className="text-amber-700 font-bold">Pending test pass</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons for draft versions */}
                    {isDraft && (
                      <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleDryRun(ver._id)}
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded font-semibold text-[10px]"
                        >
                          Run Dry-Run
                        </button>
                        <button
                          onClick={() => setPreviewVersion(ver)}
                          className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded font-semibold text-[10px]"
                        >
                          What-If Preview
                        </button>
                        <button
                          onClick={() => handleApprove(ver._id)}
                          disabled={!ver.dryRunPassed}
                          className={`px-2.5 py-1 rounded font-semibold text-[10px] text-white ${
                            ver.dryRunPassed
                              ? 'bg-emerald-700 hover:bg-emerald-800'
                              : 'bg-slate-300 cursor-not-allowed'
                          }`}
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected / Active Rule Inspector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Active Configuration for {selectedFamily}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Version: <RuleVersion value={activeVersion?.version} />
                </p>
              </div>
              {activeVersion && (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase rounded-full">
                  ACTIVE VERSION
                </span>
              )}
            </div>

            {activeVersion ? (
              <div className="space-y-4 text-xs">
                <PolicyTable version={activeVersion} />
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px]">
                  <strong>Policy Provenance:</strong> Created by {activeVersion.requestedBy?.username || activeVersion.requestedBy || 'Seed'} on{' '}
                  {new Date(activeVersion.createdAt).toLocaleString()}. Approved by{' '}
                  {activeVersion.approvedBy?.username || activeVersion.approvedBy || 'Initial Policy'}.
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No approved version active for this policy family.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showChangeModal && (
        <RuleChangeModal
          family={selectedFamily}
          initialBody={activeVersion?.body}
          onClose={() => setShowChangeModal(false)}
          onCreated={() => {
            setShowChangeModal(false);
            loadVersions(selectedFamily);
          }}
        />
      )}

      {previewVersion && (
        <WhatIfPreviewModal
          version={previewVersion}
          onClose={() => setPreviewVersion(null)}
        />
      )}
    </div>
  );
}
