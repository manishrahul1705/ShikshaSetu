import Institution from '../modules/institutions/Institution.js';
import { getReporterId } from '../modules/identity/index.js';

/**
 * S02: RBAC by bureau, region, and case level.
 *
 * Centralized authorization function canAccessCase(user, caseDoc).
 * Used by:
 * - Case tracking and retrieval (/api/v1/track/:caseId, /api/v1/cases/:id)
 * - Document downloads (/api/v1/documents/:id/download)
 * - Institution 360 case lists (/api/v1/institutions/:pid/360)
 *
 * Scoping rules:
 * - Complainant (student, faculty): own cases only.
 * - Supervisor, Competent Authority, Auditor, System Admin: all cases.
 * - Regional Officer: cases in their delegated region (when routed/assigned).
 * - Bureau Officer: cases whose owningBureau matches their bureau (when routed).
 * - Institution Admin: cases regarding their institution in redacted form.
 *
 * Note on unrouted cases (before S2):
 * Per specification guidance, unrouted cases (owningBureau == null) are accessible only
 * to the complainant (own case) and supervisor / competent_authority / sysadmin / auditor.
 */
export async function canAccessCase(user, caseDoc) {
  if (!user || !caseDoc) return false;

  const role = user.role;

  // Global administrative & audit roles
  if (['supervisor', 'competent_authority', 'auditor', 'system_admin'].includes(role)) {
    return true;
  }

  // Complainant: own cases only (S21, strictly pseudonymous reporterId comparison)
  if (role === 'student' || role === 'faculty' || role === 'other_stakeholder') {
    const userReporterId = user.reporterId || (await getReporterId(user._id || user.id));
    return Boolean(userReporterId && caseDoc.reporterId === userReporterId);
  }

  // Unrouted cases: not yet routed to any bureau or regional queue
  const isUnrouted = !caseDoc.owningBureau && !caseDoc.routingDecisionId;
  if (isUnrouted) {
    // Unrouted cases are only visible to supervisor/authority/admin and the owning complainant
    return false;
  }

  // Regional officer: scoped to their assigned region
  if (role === 'regional_officer') {
    if (!user.region) return false;
    let caseRegion = caseDoc.pidSnapshot?.region;
    if (!caseRegion && caseDoc.institutionPid) {
      const inst = await Institution.findOne({ pid: caseDoc.institutionPid }).lean();
      caseRegion = inst?.region;
    }
    return caseRegion === user.region;
  }

  // Bureau officer: scoped to cases routed to their bureau
  if (role === 'bureau_officer') {
    if (!user.bureau) return false;
    if (caseDoc.owningBureau === user.bureau) return true;
    const aliases = {
      PGRC: 'Public Grievance Redressal Cell',
      'Public Grievance Redressal Cell': 'PGRC',
      RB: 'Regulation Bureau',
      'Regulation Bureau': 'RB',
      AB: 'Academic Bureau',
      'Academic Bureau': 'AB',
      APB: 'Approval Bureau',
      'Approval Bureau': 'APB',
    };
    return aliases[caseDoc.owningBureau] === user.bureau || aliases[user.bureau] === caseDoc.owningBureau;
  }

  // Institution admin: scoped to their institution
  if (role === 'institution_admin') {
    if (!user.institutionPid) {
      // In demo mode, if inst_admin1 has no institutionPid, match if explicit
      return (process.env.APP_MODE || 'demo') === 'demo';
    }
    return caseDoc.institutionPid === user.institutionPid;
  }

  return false;
}
