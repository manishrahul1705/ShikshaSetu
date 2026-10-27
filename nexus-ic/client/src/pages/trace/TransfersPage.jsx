import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import TransferTimeline from './TransferTimeline.jsx';

export default function TransfersPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState('incoming');
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bureaus, setBureaus] = useState([]);
  const [caseRef, setCaseRef] = useState('');
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [acceptedTransfer, setAcceptedTransfer] = useState(null);
  useEffect(() => {
    let live = true;
    fetch('/api/v1/bureaus').then(r => r.ok ? r.json() : []).then(rows => {
      if (live) setBureaus(Array.isArray(rows) ? rows : []);
    }).catch(() => { if (live) setError('Destination bureaus are unavailable.'); });
    return () => { live = false; };
  }, []);
  async function requestTransfer(event) {
    event.preventDefault(); setRequesting(true); setRequested(false); setError('');
    try {
      const response = await fetch('/api/v1/transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterCaseId: caseRef.trim(), toBureau: destination, reason: reason.trim() }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Transfer request failed');
      setRequested(true); setActiveTab('outgoing'); await fetchTransfers();
    } catch (error) { setError(error.message); }
    finally { setRequesting(false); }
  }

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/transfers/${activeTab === 'incoming' ? 'inbox' : 'outbox'}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load transfers');
      const data = await res.json();
      setTransfers(Array.isArray(data) ? data : data.transfers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [activeTab]);

  const handleAccept = async (transferId) => {
    try {
      setError('');
      const res = await fetch(`/api/v1/transfers/${transferId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to accept transfer');
      }
      const accepted = await res.json();
      if (accepted.transfer) setAcceptedTransfer(accepted.transfer);
      await fetchTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (transferId) => {
    if (!rejectReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    try {
      setError('');
      const res = await fetch(`/api/v1/transfers/${transferId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to reject transfer');
      }
      setRejectId(null);
      setRejectReason('');
      await fetchTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('trace.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            NEXUS TRACE: Transfer cases between bureaus while guaranteeing exactly one accountable owner at every moment.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
          {error}
        </div>
      )}
      {acceptedTransfer && <section aria-label="Accepted transfer" className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold">{acceptedTransfer.masterCaseId}: ACCEPTED</h2>
        <TransferTimeline transfer={acceptedTransfer} />
      </section>}

      <form aria-label="Request transfer" onSubmit={requestTransfer} className="bg-white border rounded-lg p-4 space-y-3 mb-6">
        <h2 className="font-bold">Request transfer</h2>
        <p className="text-sm">The sender remains accountable until the receiving bureau accepts.</p>
        <label className="block text-sm">Master Case ID<input required aria-label="Transfer Master Case ID" className="border rounded p-2 block" value={caseRef} onChange={e => setCaseRef(e.target.value)} /></label>
        <label className="block text-sm">Destination bureau<select required aria-label="Destination bureau" className="border rounded p-2 block" value={destination} onChange={e => setDestination(e.target.value)}>
          <option value="">Choose bureau</option>{bureaus.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
        </select></label>
        <label className="block text-sm">Transfer reason<textarea required aria-label="Transfer reason" className="border rounded p-2 block w-full" value={reason} onChange={e => setReason(e.target.value)} /></label>
        <button disabled={requesting} className="bg-blue-900 text-white rounded px-3 py-2" type="submit">Request transfer</button>
        {requested && <p role="status">Transfer requested; acceptance pending. Sender remains accountable.</p>}
      </form>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'incoming'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('trace.incoming')}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'outgoing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('trace.outgoing')}
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-12 text-center text-sm">Loading transfers...</div>
      ) : transfers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
          {t('trace.noTransfers')}
        </div>
      ) : (
        <div className="space-y-4">
          {transfers.map((item) => {
            const isOverdue =
              item.status === 'REQUESTED' &&
              item.escalationDueAt &&
              new Date(item.escalationDueAt).getTime() < Date.now();

            return (
              <div
                key={item._id}
                data-testid="transfer-card"
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <TransferTimeline transfer={item} />
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-900">
                      {item.masterCaseId || 'NX-TRANSFER'}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        item.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                    {isOverdue && (
                      <span className="bg-red-600 text-white text-xs px-2.5 py-0.5 rounded font-bold animate-pulse">
                        {t('trace.overdue')}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
                    <div>
                      <span className="text-slate-400">{t('trace.sender')}:</span>{' '}
                      <span className="font-medium text-slate-700">{item.fromBureau}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">{t('trace.recipient')}:</span>{' '}
                      <span className="font-medium text-slate-700">{item.toBureau}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">{t('trace.accountableOwner')}:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {item.status === 'ACCEPTED'
                          ? t('trace.activeOwner')
                          : t('trace.senderRemains')}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="font-medium text-slate-500">{t('trace.reason')}:</span>{' '}
                    {item.reason}
                  </p>

                  {item.rejectionReason && (
                    <p className="text-sm text-rose-700 bg-rose-50 p-2.5 rounded border border-rose-100">
                      <span className="font-medium text-rose-900">Rejection Note:</span>{' '}
                      {item.rejectionReason}
                    </p>
                  )}
                </div>

                {/* Actions for recipient on pending incoming transfer */}
                {activeTab === 'incoming' && item.status === 'REQUESTED' && (
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <button
                      onClick={() => handleAccept(item._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
                    >
                      {t('trace.accept')}
                    </button>
                    <button
                      onClick={() => setRejectId(item._id)}
                      className="bg-white hover:bg-slate-50 border border-rose-300 text-rose-700 text-sm font-semibold px-4 py-2 rounded transition-colors"
                    >
                      {t('trace.reject')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t('trace.reject')}</h3>
            <p className="text-sm text-slate-600 mb-4">{t('trace.rejectPrompt')}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none mb-4"
              placeholder="Explain why this transfer is not accepted..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectId)}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
