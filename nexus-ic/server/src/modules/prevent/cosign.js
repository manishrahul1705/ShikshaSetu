import Case from '../cases/Case.js';
import { getReporterId, getVerifiedInstitutionPid, isVerified } from '../identity/index.js';
import { CoSign } from './models.js';
import { caseAccess, officerRoles, uid, audit, fail } from './access.js';
async function eligibility(user, id) {
  if (!/^(?:[a-f\d]{24}|NX-\d{4}-\d{6})$/i.test(id || '')) throw fail(404, 'CASE_NOT_FOUND');
  const row = await Case.findOne(/^[a-f\d]{24}$/i.test(id) ? { _id: id } : { masterCaseId: id }).lean();
  if (!row) throw fail(404, 'CASE_NOT_FOUND');
  const accessible = await caseAccess(user, row);
  const reporterId = await getReporterId(uid(user));
  // Same-institution anonymous endorsement is an explicit narrow capability,
  // not permission to open another student's case or read its narrative.
  const eligible = user.role === 'student' && await isVerified(uid(user)) &&
    await getVerifiedInstitutionPid(uid(user)) === row.institutionPid && row.reporterId !== reporterId;
  if (!eligible && !accessible) throw fail(404, 'CASE_NOT_FOUND');
  return { row, reporterId, eligible, accessible };
}
export async function coSign(user, id) {
  const { row, reporterId, eligible } = await eligibility(user, id);
  if (!eligible) throw fail(403, 'COSIGN_NOT_ELIGIBLE');
  try { const sign = await CoSign.create({ caseId: row._id, reporterId }); await audit(user, 'cosign.created', sign.id); }
  catch (error) { if (error.code === 11000) throw fail(409, 'ALREADY_COSIGNED'); throw error; }
  return { signed: true };
}
export async function coSignSummary(user, id) {
  const { row, reporterId, eligible, accessible } = await eligibility(user, id);
  if (officerRoles.includes(user.role) && accessible) return { count: await CoSign.countDocuments({ caseId: row._id }) };
  return { eligible, signed: !!await CoSign.exists({ caseId: row._id, reporterId }) };
}
