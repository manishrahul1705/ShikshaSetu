import React, { useState } from 'react';

/**
 * U29 RuleBook Change Request Modal
 * Creates a new draft version requiring dry-run fixture pass and two-step approval.
 */
export default function RuleChangeModal({ family, initialBody, onClose, onCreated }) {
  const [version, setVersion] = useState(`DEMO-${family}-${Date.now().toString().slice(-4)}`);
  const [bodyText, setBodyText] = useState(
    JSON.stringify(initialBody || { comment: 'Proposed policy change', parameters: {} }, null, 2)
  );
  const [reason, setReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch {
      setError('Rule body must be valid JSON');
      return;
    }

    if (!reason.trim()) {
      setError('Recorded justification reason is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/rulebook/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          family,
          version,
          body: parsedBody,
          effectiveFrom,
          reason,
          synthetic: true,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        onCreated(created);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to create draft version');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full flex flex-col overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Request RuleBook Change</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Family: {family}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">{error}</div>}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">New Version Identifier</label>
            <input
              type="text"
              value={version.replace(/^DEMO-/, '')}
              onChange={(e) => setVersion(`DEMO-${e.target.value.replace(/^DEMO-/, '')}`)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-800 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Effective Date</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-800 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Rule Policy Configuration (JSON)</label>
            <textarea
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-800 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Justification Reason</label>
            <input
              type="text"
              placeholder="e.g. AICTE 2026 Updated Intake Jurisdiction Norms"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-800 outline-none"
              required
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
            <strong>Two-Step Approval Requirement:</strong>
            <p className="mt-0.5 text-[11px] text-amber-800">
              Creating this draft does not activate it. It will require passing the dry-run validation and approval by a second authorized official before taking effect.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg"
            >
              {submitting ? 'Submitting Draft...' : 'Submit Draft Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
