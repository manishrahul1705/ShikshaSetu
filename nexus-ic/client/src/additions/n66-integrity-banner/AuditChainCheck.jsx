import React, { useState, useEffect } from 'react';

const ADMIN_ROLES = ['system_admin', 'auditor', 'competent_authority'];

export default function AuditChainCheck({ userRole, appMode }) {
  const [mode, setMode] = useState(appMode || null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (appMode) {
      setMode(appMode);
      return;
    }
    fetch('/api/v1/config/mode')
      .then((res) => res.json())
      .then((data) => setMode(data.mode))
      .catch(() => setMode('demo'));
  }, [appMode]);

  // Hide the button when in production mode
  if (mode === 'production') {
    return null;
  }

  // Only authorized admin roles can see the audit chain check button
  if (!userRole || !ADMIN_ROLES.includes(userRole)) {
    return null;
  }

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/v1/audit/verify', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Verification failed (${res.status})`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 text-xs ml-4">
      <button
        onClick={handleVerify}
        disabled={loading}
        className="px-2 py-1 bg-amber-900 text-amber-100 rounded hover:bg-amber-800 disabled:opacity-50 font-medium transition-colors"
      >
        {loading ? 'Verifying chain...' : 'Check audit chain'}
      </button>

      {result && (
        <span
          className={`font-semibold px-2 py-0.5 rounded ${
            result.intact ? 'bg-emerald-800 text-emerald-100' : 'bg-red-800 text-red-100'
          }`}
        >
          {result.intact ? `Intact (${result.count || 0} events)` : `Broken at seq ${result.brokenSeq}`}
        </span>
      )}

      {error && <span className="text-red-700 font-medium">{error}</span>}
    </div>
  );
}
