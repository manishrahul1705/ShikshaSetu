import React, { useState, useEffect } from 'react';
import InlinePreflight from '../../additions/n81-live-conflict-warning/InlinePreflight.jsx';
import { s5Request } from '../closure/api.jsx';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';

export default function QueryThread() {
  const { caseId } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();

  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Officer send query form
  const [recipientType, setRecipientType] = useState('complainant');
  const [queryText, setQueryText] = useState('');
  const [preflight, setPreflight] = useState(null), [proceedReason, setProceedReason] = useState('');
  useEffect(() => { setPreflight(null); setProceedReason(''); }, [queryText, recipientType]);

  // Response form
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [responseText, setResponseText] = useState('');

  const isOfficer = [
    'bureau_officer',
    'regional_officer',
    'supervisor',
    'competent_authority',
    'system_admin',
  ].includes(user?.role);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/queries/case/${encodeURIComponent(caseId)}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load queries');
      const json = await res.json();
      setQueries(Array.isArray(json) ? json : json.queries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) fetchQueries();
  }, [caseId]);

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    try {
      setError('');
      if (recipientType === 'institution' && !preflight) {
        setPreflight(await s5Request('/prevent/check-action', { method: 'POST', body: { caseId, actionType: 'DOCUMENT_REQUEST', details: { subject: queryText.trim() } } }));
        return;
      }
      const res = await fetch('/api/v1/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          recipientType,
          queryText: queryText.trim(),
          proceedReason,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to send query');
      }
      setQueryText('');
      await fetchQueries();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRespond = async (queryId) => {
    if (!responseText.trim()) return;
    try {
      setError('');
      const res = await fetch(`/api/v1/queries/${queryId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseText: responseText.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to submit response');
      }
      setActiveReplyId(null);
      setResponseText('');
      await fetchQueries();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('query.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Direct communication loop for case clarification and document requests.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Officer Send Query Form */}
      {isOfficer && (
        <form onSubmit={handleSendQuery} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">{t('query.sendQuery')}</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="recipientType"
                value="complainant"
                checked={recipientType === 'complainant'}
                onChange={(e) => setRecipientType(e.target.value)}
              />
              {t('query.complainant')}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="recipientType"
                value="institution"
                checked={recipientType === 'institution'}
                onChange={(e) => setRecipientType(e.target.value)}
              />
              {t('query.institution')}
            </label>
          </div>
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder={t('query.queryText')}
          />
          <InlinePreflight result={preflight} caseId={caseId} reason={proceedReason} onReason={setProceedReason} />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded"
          >
            {preflight?.result === 'REVIEW' ? 'Proceed anyway' : t('query.sendQuery')}
          </button>
        </form>
      )}

      {/* Queries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 py-8">Loading queries...</div>
        ) : queries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
            No queries found for this case.
          </div>
        ) : (
          queries.map((q) => (
            <div key={q._id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                    To: {q.recipientType}
                  </span>
                  <span className="text-xs text-slate-400 ml-3">
                    {new Date(q.queriedAt).toLocaleString()}
                  </span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    q.status === 'RESPONDED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {q.status === 'RESPONDED' ? t('query.responded') : t('query.pending')}
                </span>
              </div>

              <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap">
                {q.queryText}
              </div>

              {/* Response Display */}
              {q.status === 'RESPONDED' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded p-3 text-sm space-y-1">
                  <div className="flex justify-between text-xs text-emerald-800 font-medium">
                    <span>{t('query.response')} ({q.responderRole})</span>
                    <span>{new Date(q.respondedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-800 whitespace-pre-wrap">{q.responseText}</p>
                </div>
              )}

              {/* Response Form */}
              {q.status === 'PENDING' && (
                <div className="pt-2">
                  {activeReplyId === q._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder={t('query.replyPlaceholder')}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(q._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded"
                        >
                          {t('query.submitReply')}
                        </button>
                        <button
                          onClick={() => {
                            setActiveReplyId(null);
                            setResponseText('');
                          }}
                          className="text-slate-600 hover:bg-slate-100 text-xs font-semibold px-3 py-2 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveReplyId(q._id)}
                      className="text-blue-600 hover:underline text-xs font-semibold"
                    >
                      Reply to this query &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
