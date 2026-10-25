import React from 'react';
import Icon from './ui/Icon.jsx';

/**
 * N93 Realistic Event-Grounded Stepper
 * Maps 8-10 discrete case lifecycle stages with exact timestamps,
 * accountable office/role, and live status.
 */

const STAGES = [
  { id: 'INTAKE', label: 'Intake & Registration', defaultOffice: 'Intake Portal', defaultRole: 'Complainant / System' },
  { id: 'TRIAGE', label: 'Triage & Verification', defaultOffice: 'AICTE Triage Desk', defaultRole: 'Triage Officer' },
  { id: 'ROUTING', label: 'Jurisdiction Routing', defaultOffice: 'NEXUS ROUTE Engine', defaultRole: 'RuleBook Jurisdiction' },
  { id: 'ACKNOWLEDGEMENT', label: 'Bureau Acknowledgement', defaultOffice: 'Assigned Bureau / RO', defaultRole: 'Receiving Officer' },
  { id: 'INVESTIGATION', label: 'Investigation & Actions', defaultOffice: 'Competent Cell', defaultRole: 'Investigating Officer' },
  { id: 'HEARING', label: 'Hearing & Explanation', defaultOffice: 'Regional Grievance Cell', defaultRole: 'Hearing Authority' },
  { id: 'PROVISIONAL_FINDINGS', label: 'Provisional Findings', defaultOffice: 'Assigned Bureau', defaultRole: 'Case Officer' },
  { id: 'FINAL_RESOLUTION', label: 'Resolution & Proof', defaultOffice: 'Competent Authority', defaultRole: 'Approving Authority' },
  { id: 'CLOSURE', label: 'Disposed & Closed', defaultOffice: 'AICTE Grievance System', defaultRole: 'System' },
  { id: 'APPEAL', label: 'Appeal Review', defaultOffice: 'Appellate Authority', defaultRole: 'Appellate Officer' },
];

function resolveStageState(stageIndex, currentStatus, history = [], closure = null, appeals = []) {
  const normStatus = (currentStatus || '').toUpperCase();
  const isClosed = /CLOSED|DISPOSED/.test(normStatus);

  // Status mapping to stage indices (0 to 9)
  let activeIndex = 0;
  if (normStatus === 'SUBMITTED') activeIndex = 0;
  else if (normStatus === 'REGISTERED') activeIndex = 1;
  else if (normStatus === 'ROUTED') activeIndex = 2;
  else if (normStatus === 'ACKNOWLEDGED' || normStatus === 'TRANSFERRED') activeIndex = 3;
  else if (['UNDER_INVESTIGATION', 'NOTICE_ISSUED', 'INSTRUCTION_ISSUED', 'INSPECTION_SCHEDULED', 'ACTION_RECORDED', 'IN_PROCESS'].includes(normStatus)) activeIndex = 4;
  else if (normStatus === 'HEARING' || normStatus === 'HEARING_SCHEDULED') activeIndex = 5;
  else if (normStatus === 'PROPOSED' || normStatus === 'PROVISIONAL') activeIndex = 6;
  else if (normStatus === 'APPROVED' || normStatus === 'RESOLVED') activeIndex = 7;
  else if (isClosed) activeIndex = appeals && appeals.length > 0 ? 9 : 8;

  // A later status does not prove every intervening step actually happened.
  const matchingHistory = history.find(h => {
    const s = (h.status || h.kind || '').toUpperCase();
    if (stageIndex === 0 && /SUBMIT|INTAKE|CREATE/.test(s)) return true;
    if (stageIndex === 1 && /REGISTER|TRIAGE/.test(s)) return true;
    if (stageIndex === 2 && /ROUT/.test(s)) return true;
    if (stageIndex === 3 && /ACK|TRANS/.test(s)) return true;
    if (stageIndex === 4 && /INVESTIGAT|NOTICE|INSTRUCT|INSPECT|ACTION/.test(s)) return true;
    if (stageIndex === 5 && /HEAR/.test(s)) return true;
    if (stageIndex === 6 && /PROPOS|FINDING/.test(s)) return true;
    if (stageIndex === 7 && /APPROV|RESOLV/.test(s)) return true;
    if (stageIndex === 8 && /CLOS|DISPOS/.test(s)) return true;
    if (stageIndex === 9 && /APPEAL/.test(s)) return true;
    return false;
  });

  let state = 'upcoming';
  if (stageIndex < activeIndex && matchingHistory) state = 'completed';
  else if (stageIndex === activeIndex) state = isClosed && stageIndex === 8 && (!appeals || appeals.length === 0) ? 'completed' : 'active';

  return { state, historyEntry: matchingHistory };
}

export default function CaseStepper({
  caseData = {},
  compact = false,
}) {
  const {
    status = 'SUBMITTED',
    createdAt,
    statusHistory = [],
    milestones = [],
    accountableOwner = {},
    closure = null,
    appeals = [],
  } = caseData;

  const allHistory = [...statusHistory, ...milestones];
  if (createdAt && !allHistory.some(h => /SUBMIT|CREATE/.test(h.status || h.kind || ''))) {
    allHistory.unshift({ status: 'SUBMITTED', at: createdAt, office: 'Intake Portal', role: 'Complainant' });
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-700">Lifecycle Progress</span>
          <h3 className="text-base font-bold text-slate-900">Event-Grounded Case Journey</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 status-pulse" />
          <span className="text-xs font-semibold text-slate-700">Recorded case history</span>
        </div>
      </div>

      <ol className={`relative ${compact ? 'space-y-3' : 'space-y-4'} border-l-2 border-slate-200 ml-3.5 pl-5 sm:pl-6`}>
        {STAGES.map((stage, idx) => {
          const { state, historyEntry } = resolveStageState(idx, status, allHistory, closure, appeals);
          const isCompleted = state === 'completed';
          const isActive = state === 'active';

          const circleColor = isCompleted
            ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
            : isActive
            ? 'bg-saffron-500 text-white ring-4 ring-saffron-100 status-pulse'
            : 'bg-slate-200 text-slate-500';

          const officeText = historyEntry?.office;
          const roleText = historyEntry?.role;
          const timeText = historyEntry?.at ? new Date(historyEntry.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;

          return (
            <li key={stage.id} className="relative group">
              <span className={`absolute -left-[29px] sm:-left-[33px] top-1 grid h-6 w-6 place-items-center rounded-full text-xs font-bold transition-all ${circleColor}`}>
                {isCompleted ? <Icon name="check" className="h-3.5 w-3.5" /> : idx + 1}
              </span>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isActive ? 'text-saffron-900 font-extrabold' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                      {stage.label}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-saffron-100 text-saffron-800 border border-saffron-300">
                        In Progress
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[11px] font-semibold text-emerald-700">✓ Done</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {officeText ? <>Accountable: <span className="font-medium text-slate-700">{officeText}</span>{roleText ? ` (${roleText})` : ''}</> : isActive ? 'Accountable office not recorded yet' : 'Awaiting recorded event'}
                  </p>
                  {historyEntry?.subject && (
                    <p className="text-xs text-slate-600 italic mt-0.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      Action: {historyEntry.subject}
                    </p>
                  )}
                </div>

                {timeText && (
                  <span className="text-[11px] font-mono text-slate-500 shrink-0 mt-0.5 sm:mt-0">
                    {timeText}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
