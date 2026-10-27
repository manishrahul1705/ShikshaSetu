import Case from '../cases/Case.js';
import User from '../auth/User.js';
import { recordAudit } from '../audit/audit.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';

/**
 * Check if officer can take leave or be moved (ADDITIONS.md N60)
 *
 * Invariant:
 * An officer cannot be marked on leave while they still own open cases.
 * Every owned case must first be handed over through NEXUS TRACE.
 */
export async function checkAbsenceBlockers(officerId) {
  const user = await User.findById(officerId);
  if (!user) {
    const err = new Error('Officer not found');
    err.status = 404;
    throw err;
  }

  // Find all active, non-closed cases where officer is the current accountable owner
  const openCases = await Case.find({
    status: { $nin: CLOSED_STATUSES },
    $or: [
      { 'currentOwner.officerId': user._id },
      { assignedOfficerId: user._id },
    ],
  }).lean();

  const blockingCases = openCases.map((c) => ({
    caseId: c._id,
    masterCaseId: c.masterCaseId,
    status: c.status,
    transferStatus: c.transferStatus || 'NONE',
    owningBureau: c.owningBureau || c.currentOwner?.office,
  }));

  return {
    officerId: user._id,
    officerName: user.displayName || user.username,
    eligible: blockingCases.length === 0,
    blockingCases,
    message: blockingCases.length > 0
      ? `Cannot mark leave: ${blockingCases.length} open cases must first be handed over via NEXUS TRACE (N60)`
      : 'Officer has no active case ownership and is eligible for leave/movement',
  };
}

/**
 * Request or mark officer leave (N60)
 */
export async function requestLeave(user, { startDate, endDate, reason }) {
  const check = await checkAbsenceBlockers(user._id);

  if (!check.eligible) {
    const err = new Error(
      `Leave request refused: Officer owns ${check.blockingCases.length} open cases that must first be handed over through NEXUS TRACE (N60)`
    );
    err.status = 409;
    err.blockingCases = check.blockingCases;
    throw err;
  }

  user.isOnLeave = true;
  user.leaveDetails = {
    startDate: new Date(startDate || Date.now()),
    endDate: endDate ? new Date(endDate) : null,
    reason: reason || 'Scheduled leave',
    markedAt: new Date(),
  };
  await user.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'officer.leave.approved',
    targetType: 'User',
    targetId: String(user._id),
    meta: {
      startDate: user.leaveDetails.startDate,
      endDate: user.leaveDetails.endDate,
      blockingCaseCount: 0,
    },
  });

  return {
    success: true,
    message: 'Leave approved successfully',
    leaveDetails: user.leaveDetails,
  };
}

/**
 * Return from leave
 */
export async function returnFromLeave(user) {
  user.isOnLeave = false;
  user.leaveDetails = null;
  await user.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'officer.leave.returned',
    targetType: 'User',
    targetId: String(user._id),
  });

  return { success: true, message: 'Returned from leave' };
}
