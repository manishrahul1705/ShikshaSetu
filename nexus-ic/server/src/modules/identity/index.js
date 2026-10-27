import { Reporter } from './models.js';
import { Vault } from '../vault/models.js';
import { fraud } from './service.js';
import { serial } from './support.js';
import { open } from '../vault/crypto.js';
export async function getReporterId(userId) {
  const row = await Reporter.findOne({ userId });
  return row?.pseudonymousReporterId || null;
}
export async function isVerified(userId) {
  const row = await Reporter.findOne({ userId, status: 'verified', verifiedAt: { $ne: null } });
  return !!row && !!await Vault.exists({ reporterId: row.pseudonymousReporterId, claimedFingerprint: { $type: 'string' } });
}
// Narrow S4 contract: derive institution from verified encrypted evidence only.
// Never expose the decrypted identity, and never trust a session/client PID.
export async function getVerifiedInstitutionPid(userId) {
  if (!await isVerified(userId)) return null;
  const row = await Reporter.findOne({ userId, userType: 'student' });
  if (!row) return null;
  const vault = await Vault.findOne({ reporterId: row.pseudonymousReporterId });
  const pid = open(vault, row.pseudonymousReporterId).institutionPid;
  return typeof pid === 'string' && /^1-\d{10}$/.test(pid) ? pid : null;
}
export const recordFraudSignal = (reporterId, type, meta) => serial(() => fraud(reporterId, type, meta));
export async function resolveVerifiedSender(email) {
  return (await import('./senders.js')).lookupSender(email);
}
export async function resolveVerifiedReporter(reporterId) {
  if (!/^RP-[A-Z0-9]{4}$/.test(reporterId || '')) return null;
  const reporter = await Reporter.findOne({ pseudonymousReporterId: reporterId });
  if (!reporter || !await isVerified(reporter.userId)) return null;
  const { default: User } = await import('../auth/User.js');
  if (!await User.exists({ _id: reporter.userId, active: true })) return null;
  return { reporterId, userId: String(reporter.userId) };
}
export { toOfficerView } from './reporters.js';
export async function checkEligibility(_reporterId, _context) {
  // S2 owns ELIGIBILITY. No approved RuleBook adapter exists in S1a.
  return { result: 'POLICY_NOT_CONFIGURED' };
}

// N51 contract: re-check a verified reporter's enrolment or employment through the N01/N02 simulators.
// Returns only a status, never identity.
export async function recheckReporterStatus(reporterId) {
  const reporter = await Reporter.findOne({ pseudonymousReporterId: reporterId }).lean();
  if (!reporter || !['student', 'faculty'].includes(reporter.userType)) return { status: 'UNKNOWN', reason: 'NO_SIMULATOR_FOR_USER_TYPE' };
  // Only reporters verified as active at intake: a later inactive result is then a change after the complaint.
  if (reporter.status !== 'verified') return { status: 'UNKNOWN', reason: 'NOT_VERIFIED' };
  const vault = await Vault.findOne({ reporterId });
  if (!vault) return { status: 'UNKNOWN', reason: 'NO_VERIFIED_EVIDENCE' };
  const personRef = open(vault, reporterId).personRef || '';
  const reference = personRef.replace(/^DEMO-(student|faculty)-/, '');
  const { recheckSimulated } = await import('./simulators.js');
  return recheckSimulated(reporter.userType, reference);
}
