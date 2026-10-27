/**
 * S03: Field-level ABAC on read, write, search, export and file.
 *
 * One field policy per role.
 * - Complainant: sees own case, status, documents, but never internal officer notes.
 * - Institution admin: never receives reporterId detail, original unscrubbed attachments,
 *   or other bureaus' internal notes. Receives redacted institution-facing form.
 * - Officers: receive pseudonymous reporterId (RP-xxxx), never raw vault identity.
 * - Sockets: do not exist yet (noted in audit/features).
 */

export const FIELD_POLICIES = {
  complainant: {
    allowedFields: [
      '_id',
      'masterCaseId',
      'category',
      'subCategory',
      'status',
      'priority',
      'channel',
      'institutionPid',
      'pidSnapshot',
      'institutionIcid',
      'icidSnapshot',
      'languageTag',
      'externalRefs',
      'createdAt',
      'updatedAt',
      'documentIds',
    ],
    redactedFields: ['internalNotes', 'officerRemarks', 'routingDebug'],
  },
  institution_admin: {
    allowedFields: [
      '_id',
      'masterCaseId',
      'category',
      'subCategory',
      'status',
      'priority',
      'institutionPid',
      'institutionIcid',
      'createdAt',
      'updatedAt',
      'documentIds',
    ],
    redactedFields: [
      'reporterId',
      'userId',
      'internalNotes',
      'otherBureausNotes',
      'rawComplainantIdentity',
    ],
  },
  officer: {
    allowedFields: [
      '_id',
      'masterCaseId',
      'reporterId',
      'category',
      'subCategory',
      'status',
      'priority',
      'channel',
      'institutionPid',
      'pidSnapshot',
      'institutionIcid',
      'icidSnapshot',
      'languageTag',
      'externalRefs',
      'routingDecisionId',
      'owningBureau',
      'createdAt',
      'updatedAt',
      'documentIds',
      'internalNotes',
    ],
    redactedFields: ['userId', 'rawComplainantIdentity', 'identityVaultKey'],
  },
  admin: {
    allowedFields: [
      '_id',
      'masterCaseId',
      'reporterId',
      'category',
      'subCategory',
      'status',
      'priority',
      'channel',
      'institutionPid',
      'pidSnapshot',
      'institutionIcid',
      'icidSnapshot',
      'languageTag',
      'externalRefs',
      'routingDecisionId',
      'owningBureau',
      'createdAt',
      'updatedAt',
      'documentIds',
      'internalNotes',
    ],
    redactedFields: ['userId', 'rawComplainantIdentity'],
  },
};

/**
 * Apply field-level ABAC policy to a case object.
 *
 * @param {Object} caseObj - The case document (POJO)
 * @param {string} role - The user's role
 * @returns {Object} Filtered case object
 */
export function applyFieldPolicy(caseObj, role) {
  if (!caseObj) return null;
  const raw = caseObj.toObject ? caseObj.toObject() : { ...caseObj };
  delete raw.userId; // Enforce contract: case responses to any role NEVER contain userId

  if (role === 'institution_admin') {
    // Redacted institution-facing form (SPEC 12.3)
    const policy = FIELD_POLICIES.institution_admin;
    const filtered = {};
    for (const field of policy.allowedFields) {
      if (raw[field] !== undefined) filtered[field] = raw[field];
    }
    // Explicitly mask reporterId
    filtered.reporterId = '[REDACTED]';
    return filtered;
  }

  if (role === 'student' || role === 'faculty') {
    const policy = FIELD_POLICIES.complainant;
    const filtered = {};
    for (const field of policy.allowedFields) {
      if (raw[field] !== undefined) filtered[field] = raw[field];
    }
    return filtered;
  }

  if (['bureau_officer', 'regional_officer'].includes(role)) {
    const policy = FIELD_POLICIES.officer;
    const filtered = {};
    for (const field of policy.allowedFields) {
      if (raw[field] !== undefined) filtered[field] = raw[field];
    }
    return filtered;
  }

  // S19 / D16 (S7 fix): the Competent Authority never gains automatic access to
  // private narratives or internal notes; it gets the officer field set without notes.
  if (role === 'competent_authority') {
    const filtered = {};
    for (const field of FIELD_POLICIES.officer.allowedFields) {
      if (field !== 'internalNotes' && raw[field] !== undefined) filtered[field] = raw[field];
    }
    return filtered;
  }

  // Supervisor, system_admin, auditor
  return raw;
}
