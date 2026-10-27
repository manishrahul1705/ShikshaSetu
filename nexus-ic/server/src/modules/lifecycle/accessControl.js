import { getReporterId } from '../identity/index.js';

/**
 * S25 Anti-retaliation & Restricted Handling for Confirmed Sensitive Cases
 *
 * For confirmed sensitive cases:
 * - narrative and evidence are restricted to:
 *   - the complainant themselves
 *   - owning bureau officers
 *   - supervisor and competent authority
 * - institution_admin is strictly blocked from reading sensitive narrative or documents.
 */
export async function canAccessSensitiveNarrative(user, caseDoc) {
  // If not sensitive, standard RBAC applies
  const isConfirmedSensitive = Array.isArray(caseDoc.sensitivityFlags) &&
    caseDoc.sensitivityFlags.some((f) => f.status === 'CONFIRMED');

  if (!isConfirmedSensitive) return true;

  // Institution admin NEVER sees confirmed sensitive narrative or evidence
  if (user.role === 'institution_admin') {
    return false;
  }

  // Complainant sees own
  if (user.role === 'student' || user.role === 'faculty' || user.role === 'other_stakeholder') {
    const reporterId = await getReporterId(user._id || user.id);
    return reporterId && reporterId === caseDoc.reporterId;
  }

  // Supervisors, Competent Authority, and System Admin
  if (['supervisor', 'competent_authority', 'system_admin'].includes(user.role)) {
    return true;
  }

  // Owning bureau officer
  if (user.role === 'bureau_officer' && user.bureau && user.bureau === caseDoc.owningBureau) {
    return true;
  }

  return false;
}
