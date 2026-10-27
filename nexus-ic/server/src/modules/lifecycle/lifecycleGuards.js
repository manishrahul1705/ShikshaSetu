/**
 * SPEC Section 9.1 (N28, F09) Lifecycle Status Definitions & Invariant Guards
 */

export const LIFECYCLE_STATUSES = [
  'Registered',
  'Submitted',
  'Assigned',
  'Under Process',
  'Transfer Requested',
  'Transfer Accepted',
  'Under Review',
  'Resolution Proposed',
  'Verified/Approved',
  'Closed',
];

/**
 * The one closed-status vocabulary (S7 fix). 'Closed' is the SPEC 9.1 status; 'CLOSED' and
 * 'DISPOSED' arrive from imports and older data. Every module checks closure through this list,
 * so a closed case can never count as open (for example for identity-reveal scope).
 */
export const CLOSED_STATUSES = Object.freeze(['Closed', 'CLOSED', 'DISPOSED']);
export const isClosedStatus = (status) => CLOSED_STATUSES.includes(status);

/**
 * F09 Analytic status mapping (SPEC 9.1)
 */
export function mapAnalyticStatus(status) {
  if (isClosedStatus(status)) return 'DISPOSED';
  const s = String(status || '').toLowerCase();
  if (s === 'registered' || s === 'submitted') return 'PENDING';
  if (s === 'assigned') return 'PENDING';
  if (s === 'closed') return 'DISPOSED';
  return 'IN_PROCESS';
}

/**
 * Invariant transition guard:
 * A transferred case must never revert to Registered or Submitted (SPEC 9.1, U22)
 */
export function validateStatusTransition(caseDoc, nextStatus) {
  const normNext = String(nextStatus || '').trim();

  // Check if case has ever had a transfer
  const hasTransferred =
    caseDoc.transferStatus !== 'NONE' ||
    (Array.isArray(caseDoc.transferHistory) && caseDoc.transferHistory.length > 0);

  if (hasTransferred) {
    if (['Registered', 'Submitted', 'SUBMITTED'].includes(normNext)) {
      const err = new Error(
        `Invariant violation: A transferred case can never revert to '${normNext}' (SPEC Section 9.1)`
      );
      err.status = 400;
      throw err;
    }
  }

  return true;
}
