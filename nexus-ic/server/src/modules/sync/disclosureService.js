import { DisclosureGrant, CommunicationLog } from './models.js';
import Document from '../documents/Document.js';
import { recordAudit } from '../audit/audit.js';

/**
 * Purpose-bound, time-boxed disclosure grants (SPEC 13 S18)
 */
export async function createDisclosureGrant(user, { documentId, caseId, granteeBureau, granteeOfficerId, purpose, durationHours = 24 }) {
  if (!purpose || typeof purpose !== 'string' || !purpose.trim()) {
    const err = new Error('Disclosure purpose is mandatory (SPEC 13 S18)');
    err.status = 400;
    throw err;
  }
  if (!documentId || !caseId || !granteeBureau) {
    const err = new Error('documentId, caseId, and granteeBureau are required');
    err.status = 400;
    throw err;
  }

  const doc = await Document.findById(documentId);
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000);

  const grant = await DisclosureGrant.create({
    documentId: doc._id,
    caseId,
    grantedBy: (user._id || user.id),
    granteeBureau,
    granteeOfficerId: granteeOfficerId || null,
    purpose: purpose.trim(),
    grantedAt: now,
    expiresAt,
  });

  await CommunicationLog.create({
    caseId,
    from: `${user.role}:${user.bureau || 'PGRC'}`,
    to: `bureau:${granteeBureau}`,
    channel: 'DISCLOSURE',
    at: now,
  });

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'disclosure.grant.created',
    targetType: 'Document',
    targetId: String(documentId),
    meta: {
      grantId: String(grant._id),
      granteeBureau,
      purpose: grant.purpose,
      expiresAt,
    },
  });

  return grant;
}

const BUREAU_ALIASES = {
  PGRC: ['PGRC', 'Public Grievance Redressal Cell'],
  'Public Grievance Redressal Cell': ['PGRC', 'Public Grievance Redressal Cell'],
  RB: ['RB', 'Regulation Bureau'],
  'Regulation Bureau': ['RB', 'Regulation Bureau'],
  AB: ['AB', 'Academic Bureau'],
  'Academic Bureau': ['AB', 'Academic Bureau'],
  APB: ['APB', 'Approval Bureau'],
  'Approval Bureau': ['APB', 'Approval Bureau'],
};

function getBureauAliases(bureau) {
  if (!bureau) return [];
  return BUREAU_ALIASES[bureau] || [bureau];
}

/**
 * Verify document access under disclosure grant (S18)
 *
 * Enforces expiry and revocation on every download attempt.
 */
export async function verifyGrantAccess(user, documentId) {
  const now = new Date();
  const bureauAliases = getBureauAliases(user.bureau);

  const grant = await DisclosureGrant.findOne({
    documentId,
    granteeBureau: { $in: bureauAliases },
    revoked: false,
    expiresAt: { $gt: now },
  }).sort({ grantedAt: -1 });

  if (!grant) {
    await recordAudit({
      actorId: String(user._id || user.id),
      actorRole: user.role,
      action: 'disclosure.access.refused',
      targetType: 'Document',
      targetId: String(documentId),
      meta: {
        reason: 'EXPIRED_OR_REVOKED_GRANT',
        attemptedAt: now,
      },
    });

    const err = new Error('Disclosure grant is missing, expired, or revoked (S18)');
    err.status = 403;
    throw err;
  }

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'disclosure.access.granted',
    targetType: 'Document',
    targetId: String(documentId),
    meta: {
      grantId: String(grant._id),
      purpose: grant.purpose,
      expiresAt: grant.expiresAt,
    },
  });

  return grant;
}

/**
 * Revoke a disclosure grant (S18)
 */
export async function revokeDisclosureGrant(user, grantId) {
  const grant = await DisclosureGrant.findById(grantId);
  if (!grant) {
    const err = new Error('Disclosure grant not found');
    err.status = 404;
    throw err;
  }

  grant.revoked = true;
  grant.revokedAt = new Date();
  grant.revokedBy = (user._id || user.id);
  await grant.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'disclosure.grant.revoked',
    targetType: 'DisclosureGrant',
    targetId: String(grant._id),
    meta: {
      revokedBy: (user._id || user.id),
      revokedAt: grant.revokedAt,
    },
  });

  return grant;
}
