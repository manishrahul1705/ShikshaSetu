import crypto from 'node:crypto';
import Case from '../cases/Case.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { getReporterId } from '../identity/index.js';
import { record } from '../audit/audit.js';
export const officerRoles = ['supervisor', 'competent_authority', 'regional_officer', 'bureau_officer'];
export const fail = (status, code) => Object.assign(new Error(code), { status, code });
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export const uid = user => String(user.id || user._id);
export async function audit(user, action, targetId, meta = {}) {
  return record({ actorId: uid(user), actorRole: user.role, action: `prevent.${action}`, targetType: 'prevent', targetId: String(targetId), meta });
}
export async function caseAccess(user, row) {
  const reporterId = await getReporterId(uid(user));
  return canAccessCase({ ...(typeof user.toObject === 'function' ? user.toObject() : user), reporterId }, row);
}
export async function readCase(user, id) {
  if (typeof id !== 'string' || !/^(?:[a-f\d]{24}|NX-\d{4}-\d{6})$/i.test(id)) throw fail(404, 'CASE_NOT_FOUND');
  const row = await Case.findOne(/^[a-f\d]{24}$/i.test(id) ? { _id: id } : { masterCaseId: id }).lean();
  const allowed = row && await caseAccess(user, row);
  if (!allowed) { await audit(user, 'access.denied', 'case'); throw fail(404, 'CASE_NOT_FOUND'); }
  return row;
}
