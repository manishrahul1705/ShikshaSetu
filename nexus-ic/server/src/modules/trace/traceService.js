import mongoose from 'mongoose';
import User from '../auth/User.js';
import Transfer from './models.js';
import Case from '../cases/Case.js';
import { transitionStatus } from '../lifecycle/lifecycleService.js';
import { getActiveRule } from '../rulebook/index.js';
import { recordAudit } from '../audit/audit.js';
import { addBusinessDays } from './businessDays.js';
import { canAccessCase } from '../../middleware/rbac.js';

function matchesBureau(b1, b2) {
  if (!b1 || !b2) return false;
  if (b1.toUpperCase() === b2.toUpperCase()) return true;
  const aliases = {
    PGRC: 'PUBLIC GRIEVANCE REDRESSAL CELL',
    'PUBLIC GRIEVANCE REDRESSAL CELL': 'PGRC',
    RB: 'REGULATION BUREAU',
    'REGULATION BUREAU': 'RB',
    AB: 'ACADEMIC BUREAU',
    'ACADEMIC BUREAU': 'AB',
    APB: 'APPROVAL BUREAU',
    'APPROVAL BUREAU': 'APB',
  };
  return aliases[b1.toUpperCase()] === b2.toUpperCase() || aliases[b2.toUpperCase()] === b1.toUpperCase();
}

/**
 * Accountable Owner Invariant Validator (N20, U20, SPEC 9.2)
 *
 * Verifies that at every moment:
 * 1. The case has a stable Master Case ID.
 * 2. Exactly one accountable owner exists, or an open transfer with a named sender who stays accountable.
 */
export function verifyOwnerInvariant(caseDoc, openTransfer = null) {
  if (!caseDoc.masterCaseId || !/^NX-\d{4}-\d{6}$/.test(caseDoc.masterCaseId)) {
    throw new Error('Invariant violation: Master Case ID missing or invalid format');
  }

  if (caseDoc.transferStatus === 'REQUESTED' || openTransfer) {
    // Open transfer: sender remains the accountable owner
    if (!caseDoc.currentOwner || !caseDoc.currentOwner.office) {
      throw new Error('Invariant violation: Sender must remain accountable owner during open transfer');
    }
  } else {
    // Standard state: exactly one current accountable owner
    if (!caseDoc.currentOwner || !caseDoc.currentOwner.office) {
      throw new Error('Invariant violation: Exactly one accountable owner required');
    }
  }
  return true;
}

/**
 * Request case transfer to another bureau (SPEC 9.2, N20)
 */
export async function requestTransfer(user, { masterCaseId, toBureau, reason, nominatedOfficerId }) {
  if (!toBureau || typeof toBureau !== 'string') {
    const err = new Error('Destination bureau is required');
    err.status = 400;
    throw err;
  }
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    const err = new Error('Transfer reason is required');
    err.status = 400;
    throw err;
  }

  const caseDoc = await Case.findOne({ masterCaseId });
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  // Authorization check
  const allowed = await canAccessCase(user, caseDoc);
  if (!allowed) {
    const err = new Error('Access denied to case');
    err.status = 403;
    throw err;
  }

  // Cannot transfer to same bureau
  const currentBureau = caseDoc.owningBureau || caseDoc.currentOwner?.office;
  if (nominatedOfficerId) {
    const receiver = await User.findById(nominatedOfficerId).lean().catch(() => null);
    if (user.role !== 'supervisor' || !matchesBureau(user.bureau, currentBureau) || !matchesBureau(currentBureau, toBureau) || !receiver?.active || receiver.isOnLeave || receiver.role !== 'bureau_officer' || !matchesBureau(receiver.bureau, currentBureau) || String(caseDoc.currentOwner?.officerId) === String(receiver._id)) {
      throw Object.assign(new Error('Invalid same-bureau handover nomination'), { status: 403 });
    }
  }
  if (currentBureau && matchesBureau(currentBureau, toBureau) && !nominatedOfficerId) {
    const err = new Error('Cannot transfer to the same owning bureau');
    err.status = 400;
    throw err;
  }

  // Cannot transfer if an open transfer already exists
  const existingOpen = await Transfer.findOne({
    caseId: caseDoc._id,
    status: 'REQUESTED',
  });
  if (existingOpen) {
    const err = new Error('An open transfer is already pending acknowledgement');
    err.status = 409;
    throw err;
  }

  // RuleBook: DEMO-TRANSFER-ACK-v1 window (2 business days)
  const rule = await getActiveRule('TRANSFER');
  const ackWindow = rule?.body?.ackWindowBusinessDays || 2;
  const now = new Date();
  const dueAt = addBusinessDays(now, ackWindow);

  // Initial owner snapshot if not populated
  if (!caseDoc.currentOwner?.office) {
    caseDoc.currentOwner = {
      office: currentBureau || user.bureau || 'PGRC',
      role: user.role || 'bureau_officer',
      officerId: (user._id || user.id),
      officerName: user.displayName || user.username,
      assignedAt: now,
    };
  }

  // Transition lifecycle status
  await transitionStatus(caseDoc._id, 'Transfer Requested', user, reason);

  // Create Transfer record
  const transfer = await Transfer.create({
    nominatedOfficerId: nominatedOfficerId || null,
    masterCaseId: caseDoc.masterCaseId,
    caseId: caseDoc._id,
    fromBureau: currentBureau || user.bureau || 'PGRC',
    toBureau,
    senderOfficerId: (user._id || user.id),
    senderName: user.displayName || user.username,
    reason: reason.trim(),
    requestedAt: now,
    dueAt,
    status: 'REQUESTED',
  });

  // Update Case transfer tracking
  caseDoc.transferStatus = 'REQUESTED';
  caseDoc.transferHistory = caseDoc.transferHistory || [];
  caseDoc.transferHistory.push({
    fromBureau: transfer.fromBureau,
    toBureau: transfer.toBureau,
    requestedAt: now,
    status: 'REQUESTED',
    reason: transfer.reason,
    officerId: (user._id || user.id),
  });
  await caseDoc.save();

  verifyOwnerInvariant(caseDoc, transfer);

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.transfer.requested',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      masterCaseId: caseDoc.masterCaseId,
      transferId: String(transfer._id),
      fromBureau: transfer.fromBureau,
      toBureau: transfer.toBureau,
      dueAt,
      reason: transfer.reason,
    },
  });

  return { transfer, case: caseDoc };
}

/**
 * Accept a pending transfer (SPEC 9.2, N20, Appendix V Layer 6: New Owner Active)
 */
export async function acceptTransfer(user, transferId) {
  const transfer = await Transfer.findById(transferId);
  if (!transfer) {
    const err = new Error('Transfer not found');
    err.status = 404;
    throw err;
  }
  if (transfer.status !== 'REQUESTED') {
    const err = new Error(`Transfer is already ${transfer.status}`);
    err.status = 400;
    throw err;
  }
  if (transfer.nominatedOfficerId && transfer.nominatedOfficerId !== String(user._id || user.id)) throw Object.assign(new Error('Only the nominated officer can accept this handover'), { status: 403 });

  // Must belong to receiving bureau, or supervisor/system_admin
  const userBureau = user.bureau;
  const isSupervisor = ['supervisor', 'competent_authority', 'system_admin'].includes(user.role);
  if (!isSupervisor && userBureau && !matchesBureau(userBureau, transfer.toBureau)) {
    const err = new Error('Only the receiving bureau can acknowledge transfer');
    err.status = 403;
    throw err;
  }

  const caseDoc = await Case.findById(transfer.caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const now = new Date();

  // Transition lifecycle status
  await transitionStatus(caseDoc._id, 'Transfer Accepted', user, 'Transfer accepted by receiving bureau');

  // Mark transfer accepted
  transfer.status = 'ACCEPTED';
  transfer.acknowledgedAt = now;
  transfer.receiverOfficerId = (user._id || user.id);
  transfer.receiverName = user.displayName || user.username;
  await transfer.save();

  // "New Owner Active" (Appendix V Layer 6):
  // Record last accountable owner and switch current owner to receiving officer
  const prevOwner = caseDoc.currentOwner;
  caseDoc.lastAccountableOwner = {
    office: prevOwner?.office || transfer.fromBureau,
    role: prevOwner?.role || 'bureau_officer',
    officerId: prevOwner?.officerId || transfer.senderOfficerId,
    officerName: prevOwner?.officerName || transfer.senderName,
    at: now,
  };

  caseDoc.currentOwner = {
    office: transfer.toBureau,
    role: user.role || 'bureau_officer',
    officerId: (user._id || user.id),
    officerName: user.displayName || user.username,
    assignedAt: now,
  };
  caseDoc.owningBureau = transfer.toBureau;
  caseDoc.transferStatus = 'ACCEPTED';
  caseDoc.status = 'Under Process';

  // Update transfer history entry
  const histEntry = (caseDoc.transferHistory || []).find(
    (h) => h.status === 'REQUESTED' && h.toBureau === transfer.toBureau
  );
  if (histEntry) {
    histEntry.status = 'ACCEPTED';
    histEntry.acknowledgedAt = now;
  }

  await caseDoc.save();
  verifyOwnerInvariant(caseDoc);

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.transfer.accepted',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      masterCaseId: caseDoc.masterCaseId,
      transferId: String(transfer._id),
      fromBureau: transfer.fromBureau,
      toBureau: transfer.toBureau,
      newOwnerOffice: caseDoc.currentOwner.office,
      newOwnerRole: caseDoc.currentOwner.role,
    },
  });

  return { transfer, case: caseDoc };
}

/**
 * Reject a transfer with mandatory reason (SPEC 9.2, N20, U21)
 *
 * Rejection returns case to sender queue with its reason; nothing reassigned silently.
 */
export async function rejectTransfer(user, transferId, { reason }) {
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    const err = new Error('Rejection reason is mandatory (U21)');
    err.status = 400;
    throw err;
  }

  const transfer = await Transfer.findById(transferId);
  if (!transfer) {
    const err = new Error('Transfer not found');
    err.status = 404;
    throw err;
  }
  if (transfer.status !== 'REQUESTED') {
    const err = new Error(`Transfer is already ${transfer.status}`);
    err.status = 400;
    throw err;
  }

  // Check receiving bureau / supervisor authorization
  const userBureau = user.bureau;
  const isSupervisor = ['supervisor', 'competent_authority', 'system_admin'].includes(user.role);
  if (!isSupervisor && userBureau && !matchesBureau(userBureau, transfer.toBureau)) {
    const err = new Error('Only the receiving bureau can reject transfer');
    err.status = 403;
    throw err;
  }

  const caseDoc = await Case.findById(transfer.caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const now = new Date();

  // Mark transfer rejected
  transfer.status = 'REJECTED';
  transfer.rejectionReason = reason.trim();
  transfer.acknowledgedAt = now;
  transfer.receiverOfficerId = (user._id || user.id);
  transfer.receiverName = user.displayName || user.username;
  await transfer.save();

  // Case returns to sender queue without owner switch
  caseDoc.transferStatus = 'REJECTED';
  caseDoc.status = 'Under Process';
  await transitionStatus(caseDoc._id, 'Under Process', user, `Transfer rejected: ${reason.trim()}`);

  const histEntry = (caseDoc.transferHistory || []).find(
    (h) => h.status === 'REQUESTED' && h.toBureau === transfer.toBureau
  );
  if (histEntry) {
    histEntry.status = 'REJECTED';
    histEntry.acknowledgedAt = now;
    histEntry.reason = reason.trim();
  }

  await caseDoc.save();
  verifyOwnerInvariant(caseDoc);

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.transfer.rejected',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      masterCaseId: caseDoc.masterCaseId,
      transferId: String(transfer._id),
      fromBureau: transfer.fromBureau,
      toBureau: transfer.toBureau,
      reason: transfer.rejectionReason,
    },
  });

  return { transfer, case: caseDoc };
}

/**
 * Periodic or on-demand escalation checker (SPEC 9.2, U20, DEMO-TRANSFER-ACK-v1)
 *
 * Escalates unacknowledged transfers after deadline without moving the case.
 */
export async function checkTransferEscalations(now = new Date()) {
  const overdueTransfers = await Transfer.find({
    status: 'REQUESTED',
    dueAt: { $lte: now },
    isEscalated: false,
  });

  const escalated = [];

  for (const transfer of overdueTransfers) {
    transfer.isEscalated = true;
    transfer.escalatedAt = now;
    transfer.escalationRecipients = [
      `supervisor_${transfer.fromBureau.toLowerCase()}`,
      `supervisor_${transfer.toBureau.toLowerCase()}`,
    ];
    await transfer.save();

    const caseDoc = await Case.findById(transfer.caseId);
    if (caseDoc) {
      caseDoc.isEscalated = true;
      await caseDoc.save();
      // Owner invariant: sender remains accountable owner
      verifyOwnerInvariant(caseDoc, transfer);
    }

    await recordAudit({
      actorId: 'system',
      actorRole: 'system',
      action: 'case.transfer.escalated',
      targetType: 'Transfer',
      targetId: String(transfer._id),
      meta: {
        masterCaseId: transfer.masterCaseId,
        fromBureau: transfer.fromBureau,
        toBureau: transfer.toBureau,
        overdueSince: transfer.dueAt,
        escalatedAt: now,
      },
    });

    escalated.push(transfer);
  }

  return escalated;
}

/**
 * Get transfer history formatted for audience (SPEC 9.1, 9.2)
 *
 * Complainant sees office and role only (no internal officer names or emails).
 */
export async function getTransferHistory(caseId, user) {
  const caseQuery = mongoose.isValidObjectId(caseId) ? { _id: caseId } : /^NX-\d{4}-\d{6}$/.test(caseId) ? { masterCaseId: caseId } : null;
  const caseDoc = caseQuery ? await Case.findOne(caseQuery).lean() : null;
  if (!caseDoc || !(await canAccessCase(user, caseDoc))) {
    await recordAudit({ actorId: String(user.id || user._id), actorRole: user.role,
      action: 'case.transfer.history.denied', targetType: 'Case', targetId: caseDoc ? String(caseDoc._id) : 'unresolved',
      meta: { reason: 'CASE_NOT_FOUND_OR_FORBIDDEN' } });
    throw Object.assign(new Error('Case not found'), { status: 404 });
  }
  const transfers = await Transfer.find({
    caseId: caseDoc._id,
  }).sort({ requestedAt: -1 });

  const isComplainant = ['student', 'faculty', 'other_stakeholder'].includes(user.role);

  if (isComplainant) {
    return transfers.map((t) => ({
      masterCaseId: t.masterCaseId,
      fromBureau: t.fromBureau,
      toBureau: t.toBureau,
      status: t.status,
      requestedAt: t.requestedAt,
      acknowledgedAt: t.acknowledgedAt,
      isEscalated: t.isEscalated,
      // Internal officer names and employee IDs are scrubbed
    }));
  }

  return transfers;
}

/**
 * Helper for S5 Closure Gate (SPEC 10.1, N22)
 *
 * S5's closure gate must refuse while any transfer is open.
 */
export async function hasOpenTransfers(caseId) {
  const query = mongoose.isValidObjectId(caseId) ? { caseId } : { masterCaseId: caseId };
  const count = await Transfer.countDocuments({ ...query, status: 'REQUESTED' });
  return count > 0;
}
