import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import InstitutionPicker from '../../components/InstitutionPicker.jsx';
import CombinedRequests from '../../additions/n82-combined-request/CombinedRequests.jsx';
import Icon from '../../components/ui/Icon.jsx';

const SYNC_GUIDE = [
  { icon: 'building', title: 'One institution, one shared view', text: 'Find a college to see its accessible cases, participating bureaus and current coordination records.', detail: 'Search by college name, city, state, PID or ICID. Select a matching institution to open its coordination workspace.' },
  { icon: 'users', title: 'Agree on the next steps', text: 'Review the accountable lead and record a clear plan with the participating teams.', detail: 'The institution workspace brings lead bureaus, participating offices and agreed next steps together. Each team retains its own responsibilities.' },
  { icon: 'check', title: 'Keep shared work moving', text: 'Follow coordination tasks, acknowledgements and the progress recorded by each bureau.', detail: 'Review assigned tasks, acknowledge requests and record completion. Restricted case details remain protected by your existing access scope.' },
];

export default function SyncPage() {
  const { institutionPid } = useParams();
  const [searchParams] = useSearchParams();
  const [selectedPid, setSelectedPid] = useState('');
  const [guideStep, setGuideStep] = useState(0);
  const pid = institutionPid || selectedPid || searchParams.get('pid') || '';
  const preselectedCases = new Set((searchParams.get('cases') || '').split(',').filter(Boolean));
  const { user } = useAuth();
  const { t } = useI18n();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Agreement form
  const [selectedCoordId, setSelectedCoordId] = useState('');
  const [nextStepsText, setNextStepsText] = useState('');

  // Internal Note form
  const [noteCaseId, setNoteCaseId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [internalNotes, setInternalNotes] = useState([]);

  // Blind Notice form
  const [targetBureau, setTargetBureau] = useState('RB');
  const [noticeSent, setNoticeSent] = useState(false);

  const fetchSyncData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/sync/institution/${encodeURIComponent(pid)}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load institution sync data');
      const json = await res.json();
      setData(json);
      if (json.coordinations && json.coordinations.length > 0) {
        setSelectedCoordId(json.coordinations[0]._id);
      }
      if (json.accessibleCases && json.accessibleCases.length > 0) {
        setNoteCaseId(json.accessibleCases[0]._id);
        fetchInternalNotes(json.accessibleCases[0]._id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInternalNotes = async (caseId) => {
    try {
      const res = await fetch(`/api/v1/sync/notes/${encodeURIComponent(caseId)}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        setInternalNotes(Array.isArray(json) ? json : json.notes || []);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (!pid) { setLoading(false); return; }
    fetchSyncData();
  }, [pid]);

  const handleAgreeNextSteps = async (e) => {
    e.preventDefault();
    if (!selectedCoordId || !nextStepsText.trim()) return;
    try {
      setError('');
      const res = await fetch(`/api/v1/sync/coordinations/${selectedCoordId}/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextSteps: nextStepsText.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to record agreement');
      }
      setNextStepsText('');
      await fetchSyncData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteCaseId || !noteText.trim()) return;
    try {
      setError('');
      const res = await fetch('/api/v1/sync/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: noteCaseId, text: noteText.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to add internal note');
      }
      setNoteText('');
      await fetchInternalNotes(noteCaseId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendBlindNotice = async () => {
    try {
      setError('');
      const res = await fetch('/api/v1/sync/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionPid: pid,
          targetBureau,
          caseId: noteCaseId || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to send notice');
      }
      setNoticeSent(true);
      setTimeout(() => setNoticeSent(false), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAcknowledgeTask = async (taskId) => {
    try {
      const res = await fetch(`/api/v1/sync/tasks/${taskId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) await fetchSyncData();
    } catch (e) {
      // ignore
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/v1/sync/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) await fetchSyncData();
    } catch (e) {
      // ignore
    }
  };

  if (!pid) return <div className="mx-auto max-w-6xl space-y-6 font-sans">
    <header className="space-y-2"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-saffron-700">Cross-bureau coordination</p><h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-950">NEXUS SYNC</h1><p className="max-w-3xl text-sm leading-6 text-slate-600">Choose an institution to review shared work, accountable leads and coordination tasks.</p></header>
    <section className="relative rounded-2xl border border-saffron-200 bg-white shadow-sm" aria-label="Start institution coordination">
      <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-saffron-600 via-saffron-400 to-amber-200"/>
      <div className="grid lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5 p-5 sm:p-7"><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-saffron-100 text-saffron-700"><Icon name="search" className="h-5 w-5"/></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-saffron-700">Start with an institution</p><h2 className="mt-1 text-xl font-bold tracking-tight text-ink-950">Bring every team to the same page</h2><p className="mt-2 text-sm leading-6 text-slate-600">Find the college you want to coordinate on. Its shared work and accountable teams will appear here.</p></div></div>
          <div className="rounded-xl border border-saffron-200 bg-saffron-50/60 p-4"><InstitutionPicker onSelect={row => setSelectedPid(row.pid)} /><p className="mt-2 text-xs leading-5 text-slate-500">Type at least two characters. You can use a name, acronym, location or institution ID.</p></div>
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-saffron-700"/>You will see only the cases and coordination records allowed for your role.</p>
        </div>
        <div className="flex flex-col justify-center rounded-b-2xl border-t border-saffron-100 bg-gradient-to-br from-saffron-50 to-amber-50/50 p-6 sm:p-8 lg:rounded-bl-none lg:rounded-tr-none lg:border-l lg:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-saffron-800">Connected work. Clear ownership.</p>
          <div className="mx-auto my-6 flex w-full max-w-sm flex-col items-center" aria-hidden="true"><div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-saffron-200 bg-white text-saffron-700 shadow-sm"><Icon name="building" className="h-8 w-8"/></div><div className="h-5 w-px bg-saffron-300"/><div className="h-4 w-3/4 rounded-t-xl border-x border-t border-saffron-300"/><div className="grid w-full grid-cols-3 gap-3">{[['users','Shared teams'],['route','Clear lead'],['check','Tracked tasks']].map(([icon,title]) => <div key={title} className="rounded-xl border border-saffron-200 bg-white p-3 text-center shadow-sm"><Icon name={icon} className="mx-auto h-5 w-5 text-saffron-700"/><p className="mt-2 text-[11px] font-semibold text-ink-900">{title}</p></div>)}</div></div>
          <p className="text-center text-sm leading-6 text-slate-600">One college connects the cases, teams and next steps that belong together.</p>
        </div>
      </div>
    </section>
    <section aria-label="How NEXUS SYNC works" className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-2"><h2 className="text-lg font-bold text-ink-950">A clearer way to coordinate</h2><p className="text-xs text-slate-500">Select a step to explore the workflow</p></div><div className="grid gap-3 md:grid-cols-3">{SYNC_GUIDE.map((step,index) => <button key={step.title} type="button" onClick={() => setGuideStep(index)} aria-pressed={guideStep === index} className={`flex h-full items-start gap-3 rounded-xl border p-5 text-left transition focus-visible:ring-4 focus-visible:ring-saffron-100 ${guideStep === index ? 'border-saffron-400 bg-saffron-50 shadow-sm' : 'border-slate-200 bg-white hover:border-saffron-300 hover:bg-saffron-50/40'}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${guideStep === index ? 'bg-saffron-600 text-white' : 'bg-slate-50 text-saffron-700'}`}><Icon name={step.icon} className="h-4 w-4"/></span><span><span className="block text-[10px] font-bold uppercase tracking-wider text-saffron-700">Step {index + 1}</span><span className="mt-1 block text-sm font-bold leading-5 text-ink-950">{step.title}</span><span className="mt-2 block text-xs leading-5 text-slate-600">{step.text}</span></span></button>)}</div><div className="flex items-start gap-3 rounded-xl border border-saffron-100 bg-white px-5 py-4" aria-live="polite"><Icon name={SYNC_GUIDE[guideStep].icon} className="mt-0.5 h-5 w-5 shrink-0 text-saffron-700"/><p className="text-sm leading-6 text-slate-600">{SYNC_GUIDE[guideStep].detail}</p></div></section>
  </div>;
  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading sync coordination...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('sync.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('sync.institution360')} &middot; PID <span className="font-mono font-semibold">{pid}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Institution 360 Summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Cases at this Institution</h2>
          {data?.restrictedCount > 0 && (
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
              {data.restrictedCount} {t('sync.restrictedEntries')}
            </span>
          )}
        </div>
        {preselectedCases.size > 0 && <p className="rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2 text-sm text-saffron-950">{preselectedCases.size} related cases preselected for coordination: {[...preselectedCases].join(', ')}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-y">
              <tr>
                <th className="py-2.5 px-3">Master Case ID</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Owning Bureau</th>
                <th className="py-2.5 px-3">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.accessibleCases?.map((c) => (
                <tr key={c._id} className={`${preselectedCases.has(c.masterCaseId) || preselectedCases.has(c._id) ? 'bg-saffron-50 ring-1 ring-inset ring-saffron-300' : ''} hover:bg-slate-50/50`}>
                  <td className="py-2.5 px-3 font-mono font-medium text-blue-900">
                    {c.masterCaseId}
                  </td>
                  <td className="py-2.5 px-3">{c.category}</td>
                  <td className="py-2.5 px-3">{c.status}</td>
                  <td className="py-2.5 px-3">{c.owningBureau}</td>
                  <td className="py-2.5 px-3">{c.priority || 'NORMAL'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Bureau Coordination & Agreement (N75) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">{t('sync.coordinations')}</h2>
          {data?.coordinations?.length === 0 ? (
            <p className="text-sm text-slate-500">No active coordinations for this institution.</p>
          ) : (
            <div className="space-y-3">
              {data?.coordinations?.map((coord) => (
                <div key={coord._id} className="border border-slate-200 rounded p-3 text-sm space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Lead: {coord.leadBureau}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {coord.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs">
                    Participating: {coord.participatingBureaus?.join(', ')}
                  </div>
                  {coord.agreedNextSteps?.steps && (
                    <div className="mt-2 bg-slate-50 p-2 rounded text-xs text-slate-700">
                      <strong>Agreed Steps:</strong> {coord.agreedNextSteps.steps}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Agree on Next Steps form (N75) */}
          <form onSubmit={handleAgreeNextSteps} className="space-y-2 pt-3 border-t">
            <label className="block text-xs font-semibold text-slate-700">
              {t('sync.agreeNextSteps')}
            </label>
            <textarea
              value={nextStepsText}
              onChange={(e) => setNextStepsText(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder={t('sync.nextStepsPlaceholder')}
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded"
            >
              {t('sync.submitAgreement')}
            </button>
          </form>
        </div>

        {/* Coordination Tasks with RuleBook Clocks */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">{t('sync.tasks')}</h2>
          {data?.tasks?.length === 0 ? (
            <p className="text-sm text-slate-500">No coordination tasks found.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {data?.tasks?.map((t) => (
                <div key={t._id} className="border border-slate-200 rounded p-3 text-sm space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{t.title}</span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Bureau: <span className="font-medium text-slate-700">{t.assignedBureau}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {t.status === 'PENDING' && (
                      <button
                        onClick={() => handleAcknowledgeTask(t._id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded"
                      >
                        Acknowledge
                      </button>
                    )}
                    {t.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleCompleteTask(t._id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1 rounded"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Blind Notices (S17) */}
          <div className="pt-3 border-t space-y-2">
            <h3 className="text-xs font-semibold text-slate-700">{t('sync.blindNotices')}</h3>
            <div className="flex gap-2">
              <select
                value={targetBureau}
                onChange={(e) => setTargetBureau(e.target.value)}
                className="border border-slate-300 rounded text-xs p-1.5 flex-1"
              >
                <option value="RB">Regulation Bureau (RB)</option>
                <option value="PGRC">Public Grievance Redressal Cell (PGRC)</option>
                <option value="AB">Academic Bureau (AB)</option>
                <option value="APB">Approval Bureau (APB)</option>
              </select>
              <button
                onClick={handleSendBlindNotice}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded"
              >
                Send Notice
              </button>
            </div>
            {noticeSent && (
              <p className="text-xs text-emerald-600 font-medium">
                Opaque blind notice logged (zero narrative/identity leaked).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Internal Notes Section (S24, U23) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{t('sync.internalNotes')}</h2>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
              CONFIDENTIAL
            </span>
          </div>
          <p className="text-xs text-amber-700 mt-1">{t('sync.internalNotesWarning')}</p>
        </div>

        <div className="space-y-3">
          {internalNotes.map((note) => (
            <div key={note._id} className="bg-amber-50/50 border border-amber-200 rounded p-3 text-sm">
              <div className="flex justify-between text-xs text-amber-800 mb-1">
                <span>{note.authorRole} ({note.authorBureau || 'Officer'})</span>
                <span>{new Date(note.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-slate-800 text-sm whitespace-pre-wrap">{note.text || note.noteText}</p>
            </div>
          ))}
        </div>

        {['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'].includes(user?.role) && <CombinedRequests key={pid} institutionPid={pid} />}
        <form onSubmit={handleAddNote} className="space-y-2 pt-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
            placeholder="Add internal officer note (never visible to complainant)..."
          />
          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded"
          >
            {t('sync.addNote')}
          </button>
        </form>
      </div>
    </div>
  );
}
