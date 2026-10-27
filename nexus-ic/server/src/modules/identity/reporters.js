import crypto from 'node:crypto';
import { Reporter } from './models.js';
import { audit, fail } from './support.js';
export function allowedType(user, type) {
  const allowed = user.role === 'student' ? ['student'] : user.role === 'faculty' ? ['faculty'] : user.role === 'other_stakeholder' ? ['other_stakeholder'] : ['authorized_user'];
  if (!allowed.includes(type)) throw fail(403, 'USER_TYPE_NOT_ALLOWED');
}
export async function ensureReporter(user, type) {
  allowedType(user, type);
  let row = await Reporter.findOne({ userId: user.id });
  if (row) {
    if (row.userType !== type) throw fail(409, 'USER_TYPE_FIXED');
    return row;
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = 'RP-' + Array.from({ length: 4 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
    try {
      row = await Reporter.create({ userId: user.id, pseudonymousReporterId: id, userType: type });
      await audit(user, 'identity.reporter.created', 'reporter', id);
      return row;
    } catch (err) {
      if (err.code !== 11000) throw err;
      const existing = await Reporter.findOne({ userId: user.id });
      if (existing) return existing;
    }
  }
  throw fail(503, 'REPORTER_ID_UNAVAILABLE');
}
export function toOfficerView(row) {
  const reporterId = row.pseudonymousReporterId || row.reporterId;
  if (!/^RP-[A-Z0-9]{4}$/.test(reporterId || '')) throw fail(400, 'INVALID_REPORTER');
  const result = { reporterId };
  if (['student', 'faculty', 'authorized_user', 'other_stakeholder'].includes(row.userType)) result.userType = row.userType;
  if (['unverified', 'pending_otp', 'manual_review', 'verified', 'rejected'].includes(row.status)) result.status = row.status;
  if (['AbcApaarSimulator', 'StaffRegistrySimulator+SsoSimulator', 'SsoSimulator', 'officer_assisted'].includes(row.verificationMethod)) result.verificationMethod = row.verificationMethod;
  if (row.verifiedAt && Number.isFinite(new Date(row.verifiedAt).getTime())) result.verifiedAt = new Date(row.verifiedAt).toISOString();
  return result;
}
export async function ownReporter(user) {
  const row = await Reporter.findOne({ userId: user.id });
  if (!row) throw fail(404, 'REPORTER_NOT_FOUND');
  return row;
}
