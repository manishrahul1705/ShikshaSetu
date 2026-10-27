import Case from '../cases/Case.js';
import { validateStatusTransition, mapAnalyticStatus } from './lifecycleGuards.js';
import { recordAudit } from '../audit/audit.js';

/**
 * Transition case status with invariant checks and F09 analytic mapping (N28)
 */
export async function transitionStatus(caseId, nextStatus, user, reason) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  // Validate invariant transition rules
  validateStatusTransition(caseDoc, nextStatus);

  const prevStatus = caseDoc.status;
  caseDoc.status = nextStatus;
  caseDoc.analyticStatus = mapAnalyticStatus(nextStatus);

  await caseDoc.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.status.transitioned',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      prevStatus,
      nextStatus,
      analyticStatus: caseDoc.analyticStatus,
      reason,
    },
  });

  return caseDoc;
}

/**
 * Format true and transparent complainant status view (SPEC 9.1, N28)
 *
 * What the complainant sees:
 * - exact current status (no false closure)
 * - accountable owner shown as office and role only
 * - real-time updates and complete status history
 * - SLA clock and escalation summary
 * - internal notes, other bureaus' narratives and reporter identity stay hidden
 */
export function formatComplainantView(caseDoc) {
  const currentSegment = Array.isArray(caseDoc.slaClock) && caseDoc.slaClock.length > 0
    ? caseDoc.slaClock[caseDoc.slaClock.length - 1]
    : null;

  return {
    masterCaseId: caseDoc.masterCaseId,
    category: caseDoc.category,
    subCategory: caseDoc.subCategory,
    status: caseDoc.status === 'SUBMITTED' ? 'Registered' : caseDoc.status,
    nativeStatus: caseDoc.status,
    analyticStatus: caseDoc.analyticStatus || mapAnalyticStatus(caseDoc.status),
    transferStatus: caseDoc.transferStatus || 'NONE',
    accountableOwner: {
      office: caseDoc.currentOwner?.office || caseDoc.owningBureau || 'Unassigned',
      role: caseDoc.currentOwner?.role || 'Intake / Triage',
    },
    slaClockSummary: {
      targetResolutionDate: currentSegment?.targetResolutionDate || null,
      nearDueDate: currentSegment?.nearDueDate || null,
      isEscalated: !!caseDoc.isEscalated,
      status: currentSegment?.status || 'RUNNING',
    },
    createdAt: caseDoc.createdAt,
    updatedAt: caseDoc.updatedAt,
  };
}
