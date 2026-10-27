import React, { useState, useEffect } from 'react';
import RuleVersion from '../../components/RuleVersion.jsx';

/**
 * N65 RuleBook What-If Preview Modal
 * Evaluates open cases under a proposed rule version without mutations.
 */
export default function WhatIfPreviewModal({ version, onClose }) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPreview() {
      if (!version?._id) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/v1/rulebook/versions/${version._id}/preview`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setPreviewData(data);
        } else {
          const err = await res.json();
          setError(err.error || 'Failed to generate preview');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchPreview();
  }, [version]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              RuleBook What-If Preview (Simulation)
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Version: <RuleVersion value={version.version} /> ({version.family})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
            <strong>Read-Only Simulation Invariant:</strong>
            <p className="mt-0.5 text-[11px] text-blue-800">
              This preview runs in-memory against active open cases. Zero records are modified or written to the database.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 font-medium">
              Simulating impact across open cases...
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              {error}
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <div className="text-lg font-black text-slate-800">{previewData.totalOpenCases}</div>
                  <div className="text-[11px] text-slate-500">Total Open Cases Examined</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-lg font-black text-amber-900">{previewData.affectedCasesCount}</div>
                  <div className="text-[11px] text-amber-700">Cases Affected By Proposed Rules</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Affected Cases Breakdown
                </h4>
                {previewData.affectedCases && previewData.affectedCases.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                    {previewData.affectedCases.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                        <div>
                          <span className="font-mono font-bold text-blue-900">{item.masterCaseId}</span>
                          <span className="ml-2 text-slate-500">[{item.category}]</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 line-through mr-2">{item.currentOutcome}</span>
                          <span className="font-bold text-emerald-700">➔ {item.simulatedOutcome}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                    No active open cases would experience routing or SLA deviation under this version.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg"
          >
            Close Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
