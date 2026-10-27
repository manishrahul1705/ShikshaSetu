import { Consent } from './models.js';
import { Otp } from '../identity/models.js';
import { Reporter } from '../identity/models.js';
import { clearOtpInbox } from '../identity/otpSink.js';
import { audit, fail } from '../identity/support.js';
export async function grant(user, reporter, purpose) {
  const row = await Consent.create({ reporterId: reporter.pseudonymousReporterId, purpose, scope: reporter.userType });
  await audit(user, 'consent.granted', 'consent', row.id);
  return view(row);
}
export async function hasConsent(reporterId, purpose) {
  const grants = await Consent.find({ reporterId, purpose, withdrawalOf: null });
  for (const entry of grants) if (!await Consent.exists({ withdrawalOf: entry._id })) return true;
  return false;
}
function view(row, withdrawnAt = null) {
  return { id: row.id, reporterId: row.reporterId, purpose: row.purpose, scope: row.scope, grantedAt: row.grantedAt, withdrawnAt, state: withdrawnAt ? 'withdrawn' : 'granted' };
}
export async function list(reporterId) {
  const rows = await Consent.find({ reporterId }).sort({ grantedAt: 1, _id: 1 });
  return rows.filter((row) => !row.withdrawalOf).map((row) => view(row, rows.find((event) => String(event.withdrawalOf) === row.id)?.withdrawnAt || null));
}
export async function applyRetentionPolicy(_reporterId) {
  return { result: 'POLICY_NOT_CONFIGURED' };
}
export async function withdraw(user, reporterId, id) {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw fail(404, 'CONSENT_NOT_FOUND');
  const row = await Consent.findOne({ _id: id, reporterId, withdrawalOf: null });
  if (!row) throw fail(404, 'CONSENT_NOT_FOUND');
  let event = await Consent.findOne({ withdrawalOf: row._id });
  if (!event) {
    event = await Consent.create({ reporterId, purpose: row.purpose, scope: row.scope, grantedAt: row.grantedAt, withdrawnAt: new Date(), withdrawalOf: row._id });
    await audit(user, 'consent.withdrawn', 'consent', row.id);
    await Otp.updateMany({ reporterId, consumedAt: null }, { $set: { consumedAt: new Date() } });
    const reporter = await Reporter.findOne({ pseudonymousReporterId: reporterId });
    if (reporter) clearOtpInbox(reporter.userId);
    await audit(user, 'identity.otp.invalidated', 'reporter', reporterId);
  }
  const retention = await applyRetentionPolicy(reporterId);
  await audit(user, 'consent.retention.requested', 'reporter', reporterId);
  return { ...view(row, event.withdrawnAt), retention };
}
