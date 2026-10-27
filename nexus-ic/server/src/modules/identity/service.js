import crypto from 'node:crypto';
import { Reporter, Otp, Fraud, Device } from './models.js';
import { Vault } from '../vault/models.js';
import { seal, open, fingerprint } from '../vault/crypto.js';
import { config, demoMode } from './config.js';
import { AbcApaarSimulator, StaffRegistrySimulator, SsoSimulator, manualIdentity, validateApaarAbcFormat, validateStaffIdFormat } from './simulators.js';
import { ensureReporter, ownReporter, toOfficerView } from './reporters.js';
import { grant, hasConsent } from '../consent/service.js';
import { audit, fail } from './support.js';
import logger from '../../config/logger.js';
import { otpInbox as inbox } from './otpSink.js';

// The only plaintext OTP sink is ephemeral process memory, never MongoDB.
const system = { id: 'identity-service', role: 'system' };
const types = ['repeated_registration', 'enrolment_mismatch', 'employment_mismatch', 'burst_submissions', 'shared_device', 'proxy_attempt'];
export async function fraud(reporterId, type, _meta = {}, actor = system) {
  if (!/^RP-[A-Z0-9]{4}$/.test(reporterId) || !types.includes(type)) throw fail(400, 'INVALID_FRAUD_SIGNAL');
  const reporter = await Reporter.findOne({ pseudonymousReporterId: reporterId });
  if (!reporter) throw fail(404, 'REPORTER_NOT_FOUND');
  const row = await Fraud.create({ reporterId, type });
  reporter.status = 'manual_review'; reporter.verifiedAt = null;
  await reporter.save();
  await Otp.updateMany({ reporterId, consumedAt: null }, { $set: { consumedAt: new Date() } });
  inbox.delete(String(reporter.userId));
  await audit(actor, `identity.fraud.${type}`, 'reporter', reporterId);
  return { reporterId, signalId: row.id, type, status: reporter.status };
}
export async function start(user, { userType, reference, consent, subtype, manual = false, deviceId, institutionPid, apaarId, abcId, staffId }) {
  if (consent !== true) throw fail(400, 'CONSENT_REQUIRED');
  if (typeof manual !== 'boolean') throw fail(400, 'INVALID_INPUT');
  if (deviceId !== undefined && (typeof deviceId !== 'string' || deviceId.length > 100)) throw fail(400, 'INVALID_DEVICE');
  if (subtype !== undefined && !['parent', 'alumni', 'citizen', 'other'].includes(subtype)) throw fail(400, 'INVALID_SUBTYPE');
  if (userType === 'other_stakeholder' && !subtype) throw fail(400, 'SUBTYPE_REQUIRED');
  const reporter = await ensureReporter(user, userType);
  const reporterId = reporter.pseudonymousReporterId;
  if (['verified', 'pending_otp'].includes(reporter.status)) {
    await fraud(reporterId, 'repeated_registration', {}, user);
    return toOfficerView(await ownReporter(user));
  }
  if (reporter.status === 'manual_review') throw fail(409, 'MANUAL_REVIEW_PENDING');
  await grant(user, reporter, manual || userType === 'other_stakeholder' ? 'manual_verification' : 'verification');
  let identity;
  let method;
  if (manual || userType === 'other_stakeholder') {
    identity = manualIdentity(reference, subtype); method = 'officer_assisted';
  } else if (userType === 'student') {
    const studentRef = (apaarId || abcId || reference || '').trim();
    if (apaarId || abcId) {
      if (!validateApaarAbcFormat(studentRef)) throw fail(400, 'INVALID_APAAR_FORMAT');
    } else if (studentRef && !['STUDENT-ACTIVE', 'STUDENT-INACTIVE', 'STUDENT-SECOND'].includes(studentRef) && !studentRef.startsWith('COSIGN-')) {
      if (/^\d/.test(studentRef) && !validateApaarAbcFormat(studentRef)) throw fail(400, 'INVALID_APAAR_FORMAT');
    }
    identity = AbcApaarSimulator.verify(studentRef, institutionPid);
    method = identity?.status === 'MANUAL_REVIEW' ? 'officer_assisted' : 'AbcApaarSimulator';
  } else if (userType === 'faculty') {
    const facultyRef = (staffId || reference || '').trim();
    if (staffId) {
      if (!validateStaffIdFormat(facultyRef)) throw fail(400, 'INVALID_STAFF_ID_FORMAT');
    } else if (facultyRef && !['FACULTY-ACTIVE', 'FACULTY-INACTIVE', 'FACULTY-SECOND'].includes(facultyRef) && !facultyRef.startsWith('COSIGN-')) {
      if ((facultyRef.startsWith('FAC-') || facultyRef.startsWith('STF-')) && !validateStaffIdFormat(facultyRef)) throw fail(400, 'INVALID_STAFF_ID_FORMAT');
    }
    identity = StaffRegistrySimulator.verify(facultyRef, institutionPid);
    method = identity?.status === 'MANUAL_REVIEW' ? 'officer_assisted' : 'StaffRegistrySimulator+SsoSimulator';
    if (!SsoSimulator.verify(facultyRef, user.role)) identity = null;
  } else {
    identity = SsoSimulator.verify(reference, user.role); method = 'SsoSimulator';
  }
  if (!identity) throw fail(400, 'SIMULATOR_REFERENCE_INVALID');
  if (identity.status === 'NOT_ENROLLED') throw fail(404, 'NOT_ENROLLED');
  if (identity.status === 'MISMATCH') throw fail(400, 'MISMATCH');
  if (identity.status === 'INACTIVE' && !['STUDENT-INACTIVE', 'FACULTY-INACTIVE'].includes(reference)) {
    throw fail(400, 'INACTIVE');
  }
  // Fail closed when VAULT_KEY is absent; no identity fallback storage.
  const encrypted = seal(identity, reporterId);
  const previous = await Vault.findOne({ reporterId });
  if (previous) {
    const old = open(previous, reporterId);
    Object.assign(encrypted, seal({ ...identity, ...(old.revealPurposes ? { revealPurposes: old.revealPurposes } : {}), ...(old.manualDecisionHistory ? { manualDecisionHistory: old.manualDecisionHistory } : {}) }, reporterId));
  }
  await Vault.updateOne({ reporterId }, { $set: encrypted }, { upsert: true });
  await audit(user, 'identity.evidence.sealed', 'reporter', reporterId);
  reporter.verificationMethod = method;
  reporter.status = method === 'officer_assisted' ? 'manual_review' : 'pending_otp';
  reporter.verifiedAt = null;
  await reporter.save();
  await audit(user, 'identity.verification.started', 'reporter', reporterId);
  if (deviceId) {
    const digest = fingerprint(deviceId);
    const other = await Device.exists({ digest, reporterId: { $ne: reporterId } });
    await Device.updateOne({ digest, reporterId }, { $setOnInsert: { digest, reporterId } }, { upsert: true });
    await audit(user, 'identity.device.checked', 'reporter', reporterId);
    if (other) await fraud(reporterId, 'shared_device', {}, user);
  }
  const duplicate = await Vault.exists({ claimedFingerprint: fingerprint(identity.personRef), reporterId: { $ne: reporterId } });
  if (duplicate) await fraud(reporterId, 'proxy_attempt', {}, user);
  if (identity.currentEnrolment === false) await fraud(reporterId, 'enrolment_mismatch', {}, user);
  if (identity.currentEmployment === false) {
    await fraud(reporterId, 'employment_mismatch', {}, user);
    // Inactive employment is an explicit N02/U06 rejection, not a fraud verdict.
    await Reporter.updateOne({ _id: reporter._id }, { $set: { status: 'rejected' } });
    await audit(user, 'identity.employment.inactive', 'reporter', reporterId);
  }
  return toOfficerView(await ownReporter(user));
}
export async function issueOtp(user, consent) {
  if (consent !== true) throw fail(400, 'CONSENT_REQUIRED');
  const reporter = await ownReporter(user);
  if (reporter.status !== 'pending_otp' || !await hasConsent(reporter.pseudonymousReporterId, 'verification')) throw fail(409, 'VERIFICATION_NOT_READY');
  await grant(user, reporter, 'otp');
  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const nonce = crypto.randomBytes(16).toString('hex');
  const hash = fingerprint(`${nonce}:${otp}`);
  const expiresAt = new Date(Date.now() + config.otpLifetimeMs);
  await Otp.updateOne({ userId: user.id }, { $set: { reporterId: reporter.pseudonymousReporterId, hash, nonce, expiresAt, attempts: 0, consumedAt: null } }, { upsert: true });
  if (demoMode()) {
    inbox.set(user.id, { otp, expiresAt });
    logger.info({ action: 'identity.demo.otp', reporterId: reporter.pseudonymousReporterId, otp });
  }
  await audit(user, 'identity.otp.issued', 'reporter', reporter.pseudonymousReporterId);
  return { reporterId: reporter.pseudonymousReporterId, expiresAt };
}
export function readInbox(user) {
  if (!demoMode()) throw fail(404, 'NOT_FOUND');
  const row = inbox.get(user.id);
  if (!row || row.expiresAt <= new Date()) { inbox.delete(user.id); return { entries: [] }; }
  return { entries: [{ ...row }] };
}
export async function claim(user, reporter) {
  const row = await Vault.findOne({ reporterId: reporter.pseudonymousReporterId });
  if (!row) throw fail(409, 'EVIDENCE_REQUIRED');
  const identity = open(row, row.reporterId);
  if (identity.currentEnrolment === false || identity.currentEmployment === false) throw fail(409, 'CURRENT_STATUS_INVALID');
  try {
    await Vault.updateOne({ _id: row._id }, { $set: { claimedFingerprint: fingerprint(identity.personRef) } });
  } catch (err) {
    if (err.code !== 11000) throw err;
    await fraud(row.reporterId, 'proxy_attempt', {}, user);
    throw fail(409, 'PROXY_ATTEMPT');
  }
  reporter.status = 'verified'; reporter.verifiedAt = new Date();
  await reporter.save();
  await audit(user, 'identity.verified', 'reporter', row.reporterId);
  await (await import('./senders.js')).bindSyntheticSender(reporter.userId, user);
  return toOfficerView(reporter);
}
export async function confirmOtp(user, code) {
  const row = await Otp.findOne({ userId: user.id });
  if (!row || row.consumedAt || row.expiresAt <= new Date() || row.attempts >= config.otpAttempts) throw fail(400, 'OTP_INVALID');
  row.attempts++;
  const candidate = fingerprint(`${row.nonce}:${typeof code === 'string' ? code : ''}`);
  const valid = crypto.timingSafeEqual(Buffer.from(row.hash), Buffer.from(candidate));
  if (valid || row.attempts >= config.otpAttempts) row.consumedAt = new Date();
  await row.save();
  if (row.consumedAt) inbox.delete(user.id);
  await audit(user, valid ? 'identity.otp.consumed' : 'identity.otp.failed', 'reporter', row.reporterId);
  if (!valid) throw fail(400, 'OTP_INVALID');
  inbox.delete(user.id);
  const reporter = await ownReporter(user);
  if (reporter.status !== 'pending_otp' || !await hasConsent(row.reporterId, 'verification') || !await hasConsent(row.reporterId, 'otp')) throw fail(409, 'VERIFICATION_NOT_READY');
  return claim(user, reporter);
}
export async function manualQueue() {
  const pendingIds = await Fraud.distinct('reporterId', { state: 'pending' });
  const reporters = await Reporter.find({ $or: [{ status: 'manual_review' }, { pseudonymousReporterId: { $in: pendingIds } }] });
  return Promise.all(reporters.map(async (row) => ({ ...toOfficerView(row), signals: (await Fraud.find({ reporterId: row.pseudonymousReporterId, state: 'pending' })).map((s) => ({ id: s.id, type: s.type })) })));
}
export async function decideManual(user, reporterId, decision, reason) {
  if (!['approve', 'reject'].includes(decision)) throw fail(400, 'INVALID_DECISION');
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 500) throw fail(400, 'REASON_REQUIRED');
  const reporter = await Reporter.findOne({ pseudonymousReporterId: reporterId, status: { $in: ['manual_review', 'rejected'] } });
  if (!reporter) throw fail(404, 'MANUAL_REQUEST_NOT_FOUND');
  if (reporter.status === 'rejected' && !await Fraud.exists({ reporterId, state: 'pending' })) throw fail(404, 'MANUAL_REQUEST_NOT_FOUND');
  if (String(reporter.userId) === user.id) throw fail(403, 'SELF_REVIEW_FORBIDDEN');
  if (!await hasConsent(reporterId, 'manual_verification') && !await hasConsent(reporterId, 'verification')) throw fail(409, 'CONSENT_REQUIRED');
  const vault = await Vault.findOne({ reporterId });
  if (!vault) throw fail(409, 'EVIDENCE_REQUIRED');
  const evidence = open(vault, reporterId);
  // Required reason is sealed inside the vault; never echoed or logged.
  await Vault.updateOne({ _id: vault._id }, { $set: seal({ ...evidence, manualDecisionHistory: [...(evidence.manualDecisionHistory || []), { decision, reason: reason.trim(), officerId: user.id, at: new Date().toISOString() }] }, reporterId) });
  await audit(user, 'identity.manual.evidence.recorded', 'reporter', reporterId);
  let result;
  if (decision === 'approve') result = await claim(user, reporter);
  else { reporter.status = 'rejected'; reporter.verifiedAt = null; await reporter.save(); result = toOfficerView(reporter); }
  await Fraud.updateMany({ reporterId, state: 'pending' }, { $set: { state: 'reviewed' } });
  await audit(user, `identity.manual.${decision}`, 'reporter', reporterId);
  return result;
}
