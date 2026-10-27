import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/index.js';
import CaseStepper from '../../components/CaseStepper.jsx';

/**
 * N28 Complainant True & Transparent Status Card
 * SPEC Section 9.1:
 * - Shows true current status (never false closure)
 * - Accountable owner displayed as office and role only
 * - SLA targets and escalation indicators
 */
export default function ComplainantStatusCard({ caseId, initialData }) {
  const { t } = useI18n();
  const [statusInfo, setStatusInfo] = useState(
    initialData
      ? {
          masterCaseId: initialData.masterCaseId,
          status: initialData.status,
          analyticStatus: initialData.analyticStatus || 'PENDING',
          transferStatus: initialData.transferStatus || 'NONE',
          accountableOwner: initialData.currentOwner || { office: initialData.owningBureau || 'Triage', role: 'Assigned Cell' },
          slaClockSummary: { status: 'RUNNING', isEscalated: false },
        }
      : null
  );
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch(`/api/v1/cases/${encodeURIComponent(caseId)}/complainant-status`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setStatusInfo(data);
        } else {
          // Fallback to initial data if available
          if (initialData) {
            setStatusInfo({
              masterCaseId: initialData.masterCaseId,
              status: initialData.status,
              analyticStatus: initialData.analyticStatus || 'PENDING',
              transferStatus: initialData.transferStatus || 'NONE',
              accountableOwner: initialData.currentOwner || { office: initialData.owningBureau || 'Triage', role: 'Assigned Cell' },
              slaClockSummary: { status: 'RUNNING', isEscalated: false },
            });
          }
        }
      } catch {
        if (initialData) {
          setStatusInfo({
            masterCaseId: initialData.masterCaseId,
            status: initialData.status,
            analyticStatus: initialData.analyticStatus || 'PENDING',
            transferStatus: initialData.transferStatus || 'NONE',
            accountableOwner: { office: initialData.owningBureau || 'Triage', role: 'Assigned Cell' },
            slaClockSummary: { status: 'RUNNING', isEscalated: false },
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
    const timer = setInterval(loadStatus, 5000);
    return () => clearInterval(timer);
  }, [caseId, initialData]);

  if (loading && !statusInfo) {
    return <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">Loading live status...</div>;
  }

  if (!statusInfo) return null;

  const analyticBadgeColor =
    statusInfo.analyticStatus === 'DISPOSED'
      ? 'bg-emerald-100 text-emerald-800'
      : statusInfo.analyticStatus === 'IN_PROCESS'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-blue-100 text-blue-800';

  return (
    <div className="p-5 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200 rounded-xl shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
            {t('lifecycle.status.title')}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-lg font-bold text-slate-900">{statusInfo.status}</h3>
            <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${analyticBadgeColor}`}>
              Analytic: {statusInfo.analyticStatus}
            </span>
          </div>
        </div>
        {statusInfo.slaClockSummary?.isEscalated && (
          <span className="px-2.5 py-1 bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold rounded-lg animate-pulse">
            ESCALATED TO REGIONAL SUPERVISOR
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Accountable Owner (Role & Office only) */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <span className="text-slate-500 block mb-1 font-semibold">{t('lifecycle.status.accountableOffice')}</span>
          <p className="font-bold text-slate-800 text-sm">
            {statusInfo.accountableOwner?.office || 'AICTE Grievance Intake & Triage'}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Role: <span className="font-semibold">{statusInfo.accountableOwner?.role || 'Assigned Officer / Cell'}</span>
          </p>
        </div>

        {/* SLA Clock & Targets */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <span className="text-slate-500 block mb-1 font-semibold">{t('lifecycle.status.slaTarget')}</span>
          <p className="font-bold text-slate-800 text-sm">
            {statusInfo.slaClockSummary?.targetResolutionDate
              ? new Date(statusInfo.slaClockSummary.targetResolutionDate).toLocaleDateString()
              : 'Active under AICTE Standard Resolution Matrix'}
          </p>
          {statusInfo.slaClockSummary?.nearDueDate && (
            <p className="text-[11px] text-amber-700 mt-0.5">
              Near-due warning date: {new Date(statusInfo.slaClockSummary.nearDueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {statusInfo.transferStatus && statusInfo.transferStatus !== 'NONE' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
          <span>
            Transfer Status: <strong className="font-semibold">{statusInfo.transferStatus}</strong>
          </span>
          <span className="text-[11px] text-amber-800">
            Jurisdictional transfer active across operational bureaus
          </span>
        </div>
      )}

      {/* N93 Event-Grounded Stepper */}
      <CaseStepper caseData={statusInfo} />
    </div>
  );
}
