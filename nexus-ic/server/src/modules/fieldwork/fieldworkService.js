import FieldVisit from './models.js';
import Case from '../cases/Case.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { recordAudit } from '../audit/audit.js';
import mongoose from 'mongoose';
import { checkAction, proceedAction } from '../prevent/stage2.js';
const findCaseReference = reference => Case.findOne(mongoose.isValidObjectId(reference) ? { _id: reference } : { masterCaseId: reference });

const RO_ROLES = [
  'regional_officer',
  'bureau_officer',
  'supervisor',
  'competent_authority',
  'system_admin',
];

/**
 * Schedule a field inspection / site verification (N74)
 */
export async function scheduleInspection(user, {
  caseId,
  visitDate,
  purpose,
  regionalOffice,
  inspectorOfficerId,
  inspectorName,
  proceedReason,
}) {
  if (!RO_ROLES.includes(user.role)) {
    const err = new Error('Access denied: Only regional officers and authorized supervisors can schedule inspections');
    err.status = 403;
    throw err;
  }
  if (!caseId || !visitDate || !purpose) {
    const err = new Error('caseId, visitDate, and purpose are required');
    err.status = 400;
    throw err;
  }

  const caseDoc = await findCaseReference(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  if (!await canAccessCase(user, caseDoc)) { const error = new Error('Access denied to case'); error.status = 403; throw error; }
  const region = regionalOffice || user.region || 'North';
  const preflight = await checkAction(user, { caseId: String(caseDoc._id), actionType: 'INSPECTION', details: { subject: purpose.trim() } });
  await proceedAction(user, preflight.checkId, proceedReason);

  const visit = await FieldVisit.create({
    caseId: caseDoc._id,
    institutionPid: caseDoc.institutionPid,
    regionalOffice: region,
    inspectorOfficerId: inspectorOfficerId || (user._id || user.id),
    inspectorName: inspectorName || user.displayName || user.username,
    visitDate: new Date(visitDate),
    purpose: purpose.trim(),
    status: 'SCHEDULED',
  });

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'fieldwork.inspection.scheduled',
    targetType: 'FieldVisit',
    targetId: String(visit._id),
    meta: {
      caseId: String(caseDoc._id),
      masterCaseId: caseDoc.masterCaseId,
      institutionPid: caseDoc.institutionPid,
      visitDate: visit.visitDate,
      regionalOffice: region,
    },
  });

  return visit;
}

/**
 * Submit field report with regional inputs and uploaded documents (N74)
 */
export async function submitFieldReport(user, visitId, {
  siteReport,
  regionalInputs,
  documentIds = [],
}) {
  if (!siteReport || typeof siteReport !== 'string' || !siteReport.trim()) {
    const err = new Error('siteReport is required');
    err.status = 400;
    throw err;
  }

  const visit = await FieldVisit.findById(visitId);
  if (!visit) {
    const err = new Error('Field visit not found');
    err.status = 404;
    throw err;
  }

  const caseDoc = await Case.findById(visit.caseId);
  if (!caseDoc || !await canAccessCase(user, caseDoc)) { const error = new Error('Access denied to case'); error.status = 403; throw error; }

  visit.siteReport = siteReport.trim();
  visit.regionalInputs = regionalInputs ? regionalInputs.trim() : null;
  visit.documentIds = documentIds;
  visit.status = 'REPORT_SUBMITTED';
  await visit.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'fieldwork.report.submitted',
    targetType: 'FieldVisit',
    targetId: String(visit._id),
    meta: {
      caseId: String(visit.caseId),
      institutionPid: visit.institutionPid,
      documentCount: documentIds.length,
    },
  });

  return visit;
}

/**
 * Get field visits for a case
 */
export async function getVisitsForCase(user, caseId) {
  const caseDoc = await findCaseReference(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const allowed = await canAccessCase(user, caseDoc);
  if (!allowed) {
    const err = new Error('Access denied to case');
    err.status = 403;
    throw err;
  }

  return FieldVisit.find({ caseId: caseDoc._id }).sort({ visitDate: -1 }).lean();
}

/**
 * Get field visits for a region
 */
export async function getVisitsForRegion(user, region) {
  const queryRegion = region || user.region;
  const query = queryRegion ? { regionalOffice: queryRegion } : {};
  return FieldVisit.find(query).sort({ visitDate: -1 }).lean();
}
