import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import { PageHeader, Metrics, EmptyState, QueueFilter, CodeText } from '../../components/ui/PageKit.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';

export default function InsiderAlertsPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [query, setQuery] = useState(''), [officerId, setOfficerId] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/insider/alerts', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load insider alerts');
      const json = await res.json();
      setAlerts(Array.isArray(json) ? json : json.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      setError('');
      const res = await fetch(`/api/v1/insider/scan/${encodeURIComponent(officerId || user.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to run insider audit scan');
      await fetchAlerts();
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <PageHeader eyebrow="ACCESS OVERSIGHT" title={t('insider.title')} purpose="Review recorded access patterns against approved thresholds. Warnings support supervision and never block an officer." />
      <Metrics items={[{ label: 'Recorded alerts', value: loading ? null : alerts.length, note: 'Visible access warnings' }, { label: 'Officers for review', value: loading ? null : new Set(alerts.map(row => String(row.officerId))).size }, { label: 'Active blocks', value: 0, note: 'Alerts never block officer operations' }]} />
      <QueueFilter query={query} setQuery={setQuery} />
      <div className="card card-pad flex flex-wrap items-end justify-between gap-4">
        <div>
          <label className="text-sm font-semibold">Officer to review<select className="ml-2 rounded-lg border border-ink-200 p-2" aria-label="Officer to review" value={officerId} onChange={event => setOfficerId(event.target.value)}><option value="">Current account</option>{[...new Map(alerts.map(row => [String(row.officerId), row])).values()].map(row => <option key={String(row.officerId)} value={String(row.officerId)}>{row.officerName || 'Recorded officer'}</option>)}</select></label>
          <p className="text-sm text-slate-500 mt-1">
            Supervisory detection for unusual access patterns, repeated reveals and bulk case views.
          </p>
        </div>
        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="mt-3 md:mt-0 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          {scanning ? 'Scanning...' : 'Run Audit Scan Now'}
        </button>
      </div>

      {/* Advisory Banner (N54 Invariant: alerts never block officers) */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm font-medium">
        {t('insider.advisoryNotice')}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-500 py-10">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <EmptyState icon="shield" title="No access alerts recorded" text="No recorded activity met the approved warning thresholds. You can review the selected account again." action="Run access scan" onAction={handleRunScan} />
      ) : (
        <div className="space-y-3">
          {alerts.filter(row => `${row.officerName} ${row.alertType} ${row.details}`.toLowerCase().includes(query.toLowerCase())).map((a) => (
            <div
              key={a._id}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 text-sm"><CodeText value={a.alertType} /></span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      a.severity === 'HIGH'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Supervisory warning
                  </span>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    <RuleVersion value={a.ruleVersion || a.ruleId} family="Insider rule" audit />
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4">
                  <span>Officer: <strong>{a.officerName || 'Recorded officer'}</strong></span>
                  <span>Count: <strong className="text-slate-700">{a.count}</strong></span>
                  {a.threshold != null && <span>Threshold: <strong>{a.threshold}</strong></span>}
                  <span>Detected: {new Date(a.alertedAt || a.detectedAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-ink-600">{a.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
