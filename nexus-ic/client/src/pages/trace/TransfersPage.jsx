import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import TransferTimeline from './TransferTimeline.jsx';
import Icon from '../../components/ui/Icon.jsx';

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
  const [showPreview, setShowPreview] = useState(false);
  const ready = Boolean(caseRef.trim() && destination && reason.trim() && destination !== user?.bureau);
  const completeFields = [Boolean(caseRef.trim()), Boolean(destination && destination !== user?.bureau), Boolean(reason.trim())];
  const completed = completeFields.filter(Boolean).length;
  useEffect(() => {
    let live = true;
    fetch('/api/v1/bureaus').then(r => r.ok ? r.json() : []).then(rows => {
      if (live) setBureaus(Array.isArray(rows) ? rows : []);
    }).catch(() => { if (live) setError('Destination bureaus are unavailable.'); });
    return () => { live = false; };
  }, []);
  async function requestTransfer(event) {
    event.preventDefault();
    if (!ready || requesting) return;
    setRequesting(true); setRequested(false); setError('');
    try {
      const response = await fetch('/api/v1/transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterCaseId: caseRef.trim(), toBureau: destination, reason: reason.trim() }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Transfer request failed');
      setRequested(true); setActiveTab('outgoing'); await fetchTransfers('outgoing');
    } catch (error) { setError(error.message); }
    finally { setRequesting(false); }
  }

  const fetchTransfers = async (tab = activeTab) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/transfers/${tab === 'incoming' ? 'inbox' : 'outbox'}`, {
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
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
          {error}
        </div>
      )}
      {acceptedTransfer && <section aria-label="Accepted transfer" className="bg-white border rounded p-4 mb-6">
        <h2 className="font-semibold">{acceptedTransfer.masterCaseId}: ACCEPTED</h2>
        <TransferTimeline transfer={acceptedTransfer} />
      </section>}

      <form aria-label="Request transfer" onSubmit={requestTransfer} className="mb-8 overflow-hidden rounded-2xl border border-saffron-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-saffron-600 via-saffron-400 to-amber-200" />
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-saffron-100 bg-gradient-to-r from-saffron-50 to-white px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-saffron-200 bg-white text-saffron-700 shadow-sm"><Icon name="shuffle" className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-saffron-700">Accountable handover</p><h2 className="mt-1 text-xl font-extrabold text-ink-950">Request transfer</h2><p className="mt-1 max-w-xl text-sm text-slate-600">Move a case to the right bureau with a clear reason and a visible ownership trail.</p></div></div>
          <span className="rounded-full border border-saffron-200 bg-white px-3 py-1.5 text-xs font-semibold text-saffron-800" aria-live="polite">{completed}/3 details ready</span>
        </div>
        <div className="grid lg:grid-cols-[1.45fr_1fr]">
          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink-900"><span className="mb-2 flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-saffron-100 text-[10px] text-saffron-800">1</span>Master Case ID</span><input required aria-label="Transfer Master Case ID" aria-describedby="transfer-case-hint" placeholder="NX-2026-000001" className="block min-h-11 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm focus:border-saffron-500 focus:ring-4 focus:ring-saffron-100" value={caseRef} disabled={requesting} onChange={e => { setCaseRef(e.target.value); setRequested(false); }} /><span id="transfer-case-hint" className="mt-1.5 block text-xs font-normal text-slate-500">Use the master ID from the case record.</span></label>
              <label className="block text-sm font-semibold text-ink-900"><span className="mb-2 flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-saffron-100 text-[10px] text-saffron-800">2</span>Destination bureau</span><select required aria-label="Destination bureau" className="block min-h-11 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-saffron-500 focus:ring-4 focus:ring-saffron-100" value={destination} disabled={requesting} onChange={e => { setDestination(e.target.value); setRequested(false); }}>
                <option value="">Choose bureau</option>{bureaus.map(b => <option key={b.code} value={b.name} disabled={b.name === user?.bureau}>{b.name}{b.name === user?.bureau ? ' (your bureau)' : ''}</option>)}
              </select><span className="mt-1.5 block text-xs font-normal text-slate-500">Choose the bureau that should receive this case.</span></label>
            </div>
            <label className="block text-sm font-semibold text-ink-900"><span className="mb-2 flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-saffron-100 text-[10px] text-saffron-800">3</span>Transfer reason</span><textarea required aria-label="Transfer reason" aria-describedby="transfer-reason-hint" rows={4} placeholder="Explain why this bureau should handle the case and what needs attention next..." className="block w-full resize-y rounded-xl border border-slate-300 p-3 text-sm font-normal focus:border-saffron-500 focus:ring-4 focus:ring-saffron-100" disabled={requesting} value={reason} onChange={e => { setReason(e.target.value); setRequested(false); }} /><span id="transfer-reason-hint" className="mt-1.5 flex justify-between gap-3 text-xs font-normal text-slate-500"><span>A clear reason helps the receiving team assess the handover.</span><span className="shrink-0 font-mono">{reason.trim().length} characters</span></span></label>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-saffron-800 hover:bg-saffron-50 focus-visible:ring-4 focus-visible:ring-saffron-100" aria-expanded={showPreview} aria-controls="transfer-preview" onClick={() => setShowPreview(value => !value)}><Icon name="eye" className="h-4 w-4"/>{showPreview ? 'Hide preview' : 'Preview handover'}</button><button disabled={!ready || requesting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-saffron-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-saffron-800 focus-visible:ring-4 focus-visible:ring-saffron-200 disabled:cursor-not-allowed disabled:opacity-40" type="submit"><Icon name="shuffle" className={`h-4 w-4 ${requesting ? 'motion-safe:animate-pulse' : ''}`} />{requesting ? 'Sending request...' : 'Request transfer'}</button></div>
          </div>
          <aside className="border-t border-saffron-100 bg-saffron-50/60 p-5 sm:p-6 lg:border-l lg:border-t-0" aria-label="Transfer ownership guidance">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-saffron-800">What happens next</p>
            <ol className="mt-4 space-y-5 text-sm">{[['Request recorded', 'Your reason is saved with the handover request.'], ['Receiving bureau reviews', 'The receiving team accepts or returns the request with a reason.'], ['Ownership changes on acceptance', 'The accepted handover activates the new accountable owner.']].map(([title, text], index) => <li key={title} className="flex gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${index === 0 ? 'bg-saffron-600 text-white' : 'border border-saffron-200 bg-white text-saffron-700'}`}>{index + 1}</span><div><p className="font-semibold text-ink-900">{title}</p><p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p></div></li>)}</ol>
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-saffron-200 bg-white p-3 text-xs leading-relaxed text-saffron-900"><Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0"/><p>The sender remains accountable until the receiving bureau accepts.</p></div>
          </aside>
        </div>
        {showPreview && <section id="transfer-preview" aria-label="Handover preview" className="border-t border-saffron-100 bg-white p-5 sm:px-6"><h3 className="text-sm font-bold text-ink-900">Handover preview</h3><div className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Case</p><p className="mt-1 break-all font-mono text-sm font-semibold">{caseRef.trim() || 'Enter a Master Case ID'}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Accountable now</p><p className="mt-1 text-sm font-semibold">{user?.bureau || 'Current case owner'}</p></div><div className="rounded-xl border border-saffron-200 bg-saffron-50 p-3"><p className="text-[10px] font-bold uppercase text-saffron-700">Requested destination</p><p className="mt-1 text-sm font-semibold">{destination || 'Choose a bureau'}</p></div></div><p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">{reason.trim() || 'Your transfer reason will appear here.'}</p><p className="mt-2 text-xs text-slate-500">Preview only. A transfer is created when you select Request transfer.</p></section>}
        {requested && <p role="status" className="flex items-center gap-2 border-t border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800"><Icon name="check" className="h-5 w-5"/>Transfer requested; acceptance pending. Sender remains accountable.</p>}
      </form>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'incoming'
              ? 'border-saffron-600 text-saffron-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('trace.incoming')}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'outgoing'
              ? 'border-saffron-600 text-saffron-800'
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
