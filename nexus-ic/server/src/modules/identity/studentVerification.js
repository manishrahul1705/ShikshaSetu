import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { studentVerificationRecords } from './studentDataset.js';
import { simulatorStoreLoaded, findSimulatorRecordByHash } from './SimulatorStore.js';
import { fingerprint, seal } from '../vault/crypto.js';
import { Vault } from '../vault/models.js';
import { ensureReporter } from './reporters.js';
import { grant } from '../consent/service.js';
import { claim } from './service.js';
import { audit, fail } from './support.js';
import { config, demoMode } from './config.js';
import { verhoeffValid } from './selfCheck.js';

export const StudentVerification = mongoose.models.student_verification_sessions || mongoose.model('student_verification_sessions', new mongoose.Schema({
  userId: { type: String, unique: true, required: true }, reporterId: { type: String, required: true },
  studentKey: String, referenceHash: String, kind: String, last4: String,
  state: { type: String, enum: ['details', 'otp_pending', 'verified'], default: 'details' },
  channel: String, otpHash: String, nonce: String, expiresAt: Date, attempts: { type: Number, default: 0 },
  consumedAt: Date, sentAt: Date, detailsExpiresAt: Date,
}, { timestamps: true }), 'student_verification_sessions');
// Plaintext codes stay in this short-lived, session-scoped local delivery sink.
const deliveries = new Map();
const label = 'Test verification · no government email or SMS connection';

function getRecord(hash, kind = 'abc') {
  if (simulatorStoreLoaded()) return findSimulatorRecordByHash(hash, kind);
  return studentVerificationRecords().find(row => (kind === 'aadhaar' ? row.aadhaarHash : row.referenceHash) === hash);
}
function assertRecord(record) {
  if (!record) throw fail(404, 'STUDENT_ID_NOT_FOUND');
  if (record.status !== 'VERIFIED' || !record.active) throw fail(409, 'STUDENT_RECORD_NOT_ELIGIBLE');
  if (!record.linkedEmail || !record.linkedPhone) throw fail(503, 'LINKED_CONTACT_NOT_CONFIGURED');
}
function masked(record) {
  const [local, domain] = record.linkedEmail.split('@');
  return { email: `${local.slice(0, 2)}***@${domain}`, sms: `Phone ending ${record.linkedPhone.slice(-4)}` };
}
async function reporterFor(user) {
  if (!demoMode()) throw fail(503, 'STUDENT_VERIFICATION_PROVIDER_NOT_CONNECTED');
  const reporter = await ensureReporter(user, 'student');
  if (reporter.status === 'verified') throw fail(409, 'ALREADY_VERIFIED');
  if (reporter.status === 'manual_review' || reporter.status === 'rejected') throw fail(409, 'ACCOUNT_NOT_ELIGIBLE');
  return reporter;
}
export async function lookupStudent(user, body) {
  if (body.consent !== true) throw fail(400, 'CONSENT_REQUIRED');
  const reporter = await reporterFor(user);
  if (!['abc', 'apaar', 'aadhaar'].includes(body.kind)) throw fail(400, 'INVALID_KIND');
  if (typeof body.number !== 'string' || body.number.length > 20) throw fail(400, 'INVALID_FORMAT');
  const digits = body.number.replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(digits)) throw fail(400, 'INVALID_FORMAT');
  if (body.kind === 'aadhaar' && (!digits.startsWith('1') || !verhoeffValid(digits))) throw fail(400, 'INVALID_TEST_AADHAAR');
  const hash = fingerprint(`${body.kind === 'aadhaar' ? 'aadhaar-student-simulator' : 'abc-apaar-simulator'}:${digits}`);
  const record = getRecord(hash, body.kind === 'aadhaar' ? 'aadhaar' : 'abc');
  assertRecord(record);
  if (body.institutionPid && body.institutionPid !== record.pid) throw fail(409, 'INSTITUTION_DOES_NOT_MATCH');
  // Cross-ID duplicate prevention uses the same key for ABC, APAAR and Aadhaar.
  const claimed = await Vault.exists({ claimedFingerprint: { $in: [fingerprint(`LOCAL-STUDENT-${record.studentKey}`), ...(record.priorClaimHashes || [])] }, reporterId: { $ne: reporter.pseudonymousReporterId } });
  if (claimed) throw fail(409, 'ID_ALREADY_LINKED');
  const previous = await StudentVerification.findOne({ userId: user.id });
  if (previous?.sentAt && Date.now() - previous.sentAt.getTime() < 30000) throw fail(429, 'PLEASE_WAIT_BEFORE_RETRY');
  await StudentVerification.updateOne({ userId: user.id }, { $set: {
    reporterId: reporter.pseudonymousReporterId, studentKey: record.studentKey, referenceHash: record.referenceHash,
    kind: body.kind, last4: digits.slice(-4), state: 'details', attempts: 0, detailsExpiresAt: new Date(Date.now() + 30 * 60_000),
  }, $unset: { otpHash: '', nonce: '', expiresAt: '', consumedAt: '', channel: '' } }, { upsert: true });
  deliveries.delete(user.id);
  await grant(user, reporter, 'verification');
  await audit(user, 'identity.student.details_loaded', 'reporter', reporter.pseudonymousReporterId);
  return { status: 'confirm_details', label, last4: digits.slice(-4), channels: masked(record),
    details: { name: record.name, institutionPid: record.pid, programme: record.programme, enrolment: 'Active' } };
}
export async function sendStudentOtp(user, body) {
  const reporter = await reporterFor(user);
  if (body.consent !== true || body.detailsAreMine !== true) throw fail(400, 'CONFIRM_DETAILS_AND_CONSENT');
  if (!['email', 'sms'].includes(body.channel)) throw fail(400, 'INVALID_CHANNEL');
  const row = await StudentVerification.findOne({ userId: user.id });
  if (!row || !['details', 'otp_pending'].includes(row.state)) throw fail(409, 'LOOKUP_REQUIRED');
  if (!row.detailsExpiresAt || row.detailsExpiresAt <= new Date()) throw fail(409, 'LOOKUP_EXPIRED');
  if (row.sentAt && Date.now() - row.sentAt.getTime() < 30000) throw fail(429, 'PLEASE_WAIT_BEFORE_RETRY');
  const record = getRecord(row.referenceHash); assertRecord(record);
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  row.nonce = crypto.randomBytes(16).toString('hex');
  row.otpHash = fingerprint(`student-otp:${user.id}:${row.nonce}:${code}`);
  row.expiresAt = new Date(Date.now() + config.otpLifetimeMs); row.attempts = 0; row.consumedAt = null;
  row.channel = body.channel; row.sentAt = new Date(); row.state = 'otp_pending';
  await row.save();
  await grant(user, reporter, 'otp');
  await audit(user, `identity.student.otp_${body.channel}_sent`, 'reporter', row.reporterId);
  deliveries.set(user.id, { code, expiresAt: row.expiresAt, nonce: row.nonce });
  return { status: 'otp_pending', channel: row.channel, destination: masked(record)[row.channel], expiresAt: row.expiresAt,
    deliveryMode: 'local', label };
}
export async function readStudentDelivery(user) {
  if (!demoMode()) throw fail(404, 'LOCAL_DELIVERY_DISABLED');
  const row = await StudentVerification.findOne({ userId: user.id });
  const delivery = deliveries.get(user.id);
  if (!row || row.state !== 'otp_pending' || !delivery || row.consumedAt || row.attempts >= config.otpAttempts || delivery.expiresAt <= new Date() || delivery.nonce !== row.nonce) {
    deliveries.delete(user.id); return { status: 'empty', label };
  }
  return { status: 'available', code: delivery.code, channel: row.channel, expiresAt: delivery.expiresAt, label };
}
export async function confirmStudentOtp(user, body) {
  const reporter = await reporterFor(user);
  // Reserve an attempt atomically so concurrent guesses cannot lose increments.
  const row = await StudentVerification.findOneAndUpdate({
    userId: user.id, state: 'otp_pending', consumedAt: null,
    expiresAt: { $gt: new Date() }, attempts: { $lt: config.otpAttempts },
  }, { $inc: { attempts: 1 } }, { new: true });
  if (!row) throw fail(400, 'OTP_EXPIRED_OR_USED');
  const valid = typeof body.code === 'string' && /^\d{6}$/.test(body.code) && crypto.timingSafeEqual(Buffer.from(row.otpHash, 'hex'), Buffer.from(fingerprint(`student-otp:${user.id}:${row.nonce}:${body.code}`), 'hex'));
  if (!valid) {
    if (row.attempts >= config.otpAttempts) {
      await StudentVerification.updateOne({ _id: row._id, nonce: row.nonce, consumedAt: null }, { $set: { consumedAt: new Date() } });
      deliveries.delete(user.id);
    }
    await audit(user, 'identity.student.otp_failed', 'reporter', row.reporterId);
    throw fail(400, 'OTP_INVALID');
  }
  // Exactly one confirmation may consume this nonce. A resend/lookup invalidates it.
  const consumed = await StudentVerification.findOneAndUpdate({
    _id: row._id, nonce: row.nonce, state: 'otp_pending', consumedAt: null,
    expiresAt: { $gt: new Date() },
  }, { $set: { consumedAt: new Date() } }, { new: true });
  if (!consumed) throw fail(400, 'OTP_EXPIRED_OR_USED');
  deliveries.delete(user.id);
  const record = getRecord(row.referenceHash); assertRecord(record);
  const personRef = `LOCAL-STUDENT-${record.studentKey}`;
  if (await Vault.exists({ claimedFingerprint: { $in: [fingerprint(personRef), ...(record.priorClaimHashes || [])] }, reporterId: { $ne: reporter.pseudonymousReporterId } })) throw fail(409, 'ID_ALREADY_LINKED');
  await Vault.updateOne({ reporterId: row.reporterId }, { $set: seal({ synthetic: true, personRef, name: record.name,
    institutionPid: record.pid, status: 'VERIFIED', currentEnrolment: true, method: `student_${row.kind}_${row.channel}_otp` }, row.reporterId) }, { upsert: true });
  reporter.verificationMethod = 'AbcApaarSimulator'; await reporter.save();
  const result = await claim(user, reporter, { duplicateMode: 'reject' });
  await StudentVerification.updateOne({ _id: row._id, nonce: row.nonce, consumedAt: consumed.consumedAt }, { $set: { state: 'verified' } });
  await audit(user, 'identity.student.self_service_completed', 'reporter', row.reporterId);
  return { ...result, status: 'verified', selfService: true, channel: row.channel, kind: row.kind, last4: row.last4, label };
}
