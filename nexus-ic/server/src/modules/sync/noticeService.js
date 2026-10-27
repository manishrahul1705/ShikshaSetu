import { CommunicationLog } from './models.js';
import { recordAudit } from '../audit/audit.js';

/**
 * Blind, opaque cross-bureau notice service (SPEC 13 S17)
 *
 * Invariant:
 * The counterpart bureau learns only that a related matter exists and who to contact,
 * never the narrative, documents, reporterId or complainant identity.
 */
export async function sendBlindNotice(user, { targetBureau, institutionPid, caseId }) {
  if (!targetBureau || !institutionPid) {
    const err = new Error('targetBureau and institutionPid are required');
    err.status = 400;
    throw err;
  }

  const senderBureau = user.bureau || user.role;
  const now = new Date();

  // Create append-only communication log (no complaint narrative or identity, SPEC 15.1, S28)
  const logEntry = await CommunicationLog.create({
    caseId: caseId || null,
    from: `${user.role}:${senderBureau}`,
    to: `bureau_officer:${targetBureau}`,
    channel: 'EMAIL_NOTICE',
    at: now,
  });

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'sync.blind_notice.sent',
    targetType: 'Bureau',
    targetId: targetBureau,
    meta: {
      fromBureau: senderBureau,
      toBureau: targetBureau,
      institutionPid,
      logId: String(logEntry._id),
      // Narrative, documents, reporterId and complainant identity strictly omitted
    },
  });

  // Opaque payload returned to caller / recipient
  return {
    notice: 'Related open matter exists',
    institutionPid,
    contactOffice: senderBureau,
    at: now,
    // Zero complaint narrative or PII
  };
}
