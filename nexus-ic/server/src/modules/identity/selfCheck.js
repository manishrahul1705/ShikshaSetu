// N99 self-service identity check (SIMULATED, not a government verification).
// A student confirms details fetched from the local ABC simulator, or, without an
// ABC ID, enters a synthetic Aadhaar-style number checked locally (12 digits,
// Verhoeff checksum, simulator list). No UIDAI / ABC system is ever contacted.
// Only a keyed (salted) hash and the last four digits are stored; numbers are
// never logged, audited or returned in full.
import mongoose from 'mongoose';
import { Reporter } from './models.js';
import { Vault } from '../vault/models.js';
import { seal, fingerprint } from '../vault/crypto.js';
import { AbcApaarSimulator, SYNTHETIC_STUDENT_REGISTRY, validateApaarAbcFormat } from './simulators.js';
import { ensureReporter } from './reporters.js';
import { grant } from '../consent/service.js';
import { audit, fail } from './support.js';
import { claim, fraud } from './service.js';

export const SIMULATED_LABEL = 'Simulated check, not a government verification';
export const MAX_FAILED_TRIES = 3;

const { Schema } = mongoose;
export const SelfCheck = mongoose.models.identity_self_checks || mongoose.model('identity_self_checks', new Schema({
  reporterId: { type: String, required: true, unique: true, match: /^RP-[A-Z0-9]{4}$/ },
  kind: { type: String, enum: ['abc', 'aadhaar', null], default: null },
  numberHash: { type: String, default: null },
  last4: { type: String, default: null, match: /^\d{4}$/ },
  failedTries: { type: Number, default: 0 },
  state: { type: String, enum: ['started', 'looked_up', 'verified', 'manual_review'], default: 'started' },
}, { strict: 'throw', timestamps: true }), 'identity_self_checks');
SelfCheck.schema.index({ numberHash: 1 });

// Verhoeff checksum tables (dihedral group D5).
const D = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
const P = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 7, 6, 8, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
export function verhoeffValid(digits) {
  let c = 0;
  [...String(digits)].reverse().forEach((digit, i) => { c = D[c][P[i % 8][Number(digit)]]; });
  return c === 0;
}
export function verhoeffDigit(digits) {
  let c = 0;
  [...String(digits)].reverse().forEach((digit, i) => { c = D[c][P[(i + 1) % 8][Number(digit)]]; });
  return String(INV[c]);
}

// Synthetic Aadhaar-style test numbers. They start with "1", which no real
// Aadhaar number does, so they can never belong to a real person.
const AADHAAR_PEOPLE = [
  ['10000000001', '100020003001'], ['10000000002', '100020003005'], ['10000000003', '100020003007'],
  ['10000000004', '100020004001'], ['10000000005', '100020006001'], ['10000000006', '100020005001'],
];
export const SYNTHETIC_AADHAAR_REGISTRY = AADHAAR_PEOPLE.map(([base, personId]) => ({ number: base + verhoeffDigit(base), personId }));
// Programme shown on the confirmation screen (synthetic; UNKNOWN when absent).
const PROGRAMMES = { 100020003001: 'B.Tech Computer Science (synthetic)', 100020003005: 'B.Pharm (synthetic)', 100020003007: 'MBA (synthetic)', 100020003002: 'B.Tech Civil (synthetic)' };

const digitsOf = value => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : '');
const personRefOf = personId => `DEMO-person-${fingerprint(`selfcheck-person:${personId}`).slice(0, 24)}`;

async function rowFor(reporterId) {
  return (await SelfCheck.findOne({ reporterId })) || SelfCheck.create({ reporterId });
}

async function sealIdentity(reporterId, identity) {
  await Vault.updateOne({ reporterId }, { $set: seal(identity, reporterId) }, { upsert: true });
}

async function failedTry(user, reporter, row, code) {
  row.failedTries += 1;
  await row.save();
  await audit(user, 'identity.selfcheck.failed', 'reporter', reporter.pseudonymousReporterId);
  if (row.failedTries >= MAX_FAILED_TRIES) {
    await sealIdentity(reporter.pseudonymousReporterId, { synthetic: true, personRef: `DEMO-unresolved-${reporter.pseudonymousReporterId}`, status: 'MANUAL_REVIEW', currentEnrolment: true, selfCheckFailedTries: row.failedTries });
    row.state = 'manual_review'; await row.save();
    await fraud(reporter.pseudonymousReporterId, 'burst_submissions', {}, user);
    throw fail(409, 'TOO_MANY_FAILED_TRIES');
  }
  throw fail(400, code);
}

/** Resolve the number to a synthetic person, or record a failed try. */
async function resolve(user, reporter, row, { kind, number, institutionPid }) {
  const digits = digitsOf(number);
  if (!['abc', 'aadhaar'].includes(kind)) throw fail(400, 'INVALID_KIND');
  if (!/^\d{12}$/.test(digits)) return failedTry(user, reporter, row, 'INVALID_FORMAT');
  let personId = digits;
  if (kind === 'aadhaar') {
    if (!verhoeffValid(digits)) return failedTry(user, reporter, row, 'BAD_CHECKSUM');
    const entry = SYNTHETIC_AADHAAR_REGISTRY.find(item => item.number === digits);
    if (!entry) return failedTry(user, reporter, row, 'UNKNOWN_NUMBER');
    personId = entry.personId;
  } else if (!validateApaarAbcFormat(digits)) return failedTry(user, reporter, row, 'INVALID_FORMAT');
  const identity = AbcApaarSimulator.verify(personId, typeof institutionPid === 'string' && institutionPid ? institutionPid : null);
  if (!identity || identity.status === 'NOT_ENROLLED') return failedTry(user, reporter, row, 'UNKNOWN_NUMBER');
  const person = SYNTHETIC_STUDENT_REGISTRY.find(item => item.id === personId);
  return { digits, personId, identity, person, numberHash: fingerprint(`selfcheck:${kind}:${digits}`) };
}

async function toReview(user, reporter, row, resolved, signal) {
  await grant(user, reporter, 'verification');
  await sealIdentity(reporter.pseudonymousReporterId, { synthetic: true, personRef: personRefOf(resolved.personId), name: resolved.person?.name, institutionPid: resolved.person?.pid, status: 'MANUAL_REVIEW', currentEnrolment: true, selfCheckSignal: signal });
  row.state = 'manual_review'; await row.save();
  await fraud(reporter.pseudonymousReporterId, signal, {}, user);
  return { status: 'manual_review', routedTo: 'officer_review', reason: signal, label: SIMULATED_LABEL };
}

async function prepare(user, body) {
  if (body.consent !== true) throw fail(400, 'CONSENT_REQUIRED');
  const reporter = await ensureReporter(user, 'student');
  if (reporter.status === 'verified') throw fail(409, 'ALREADY_VERIFIED');
  if (reporter.status === 'manual_review') throw fail(409, 'MANUAL_REVIEW_PENDING');
  const row = await rowFor(reporter.pseudonymousReporterId);
  if (row.state === 'manual_review') throw fail(409, 'MANUAL_REVIEW_PENDING');
  return { reporter, row };
}

/** Step 1: fetch the synthetic details for the student to confirm. */
export async function selfCheckLookup(user, body) {
  const { reporter, row } = await prepare(user, body);
  const resolved = await resolve(user, reporter, row, body);
  const { identity, person } = resolved;
  if (identity.status === 'MANUAL_REVIEW') return toReview(user, reporter, row, resolved, 'enrolment_mismatch');
  if (identity.status === 'MISMATCH') return toReview(user, reporter, row, resolved, 'enrolment_mismatch');
  if (identity.status === 'INACTIVE') return failedTry(user, reporter, row, 'INACTIVE');
  Object.assign(row, { kind: body.kind, numberHash: resolved.numberHash, last4: resolved.digits.slice(-4), state: 'looked_up' });
  await row.save();
  await audit(user, `identity.selfcheck.${body.kind}.lookup`, 'reporter', reporter.pseudonymousReporterId);
  return {
    status: 'confirm_details', kind: body.kind, last4: row.last4, label: SIMULATED_LABEL,
    details: { name: person?.name || 'UNKNOWN', institutionPid: person?.pid || 'UNKNOWN', programme: PROGRAMMES[resolved.personId] || 'UNKNOWN', enrolment: 'Active' },
  };
}

/** Step 2: the student confirms; the happy path completes with no officer. */
export async function selfCheckConfirm(user, body) {
  if (typeof body.detailsAreMine !== 'boolean') throw fail(400, 'CONFIRMATION_REQUIRED');
  const { reporter, row } = await prepare(user, body);
  const resolved = await resolve(user, reporter, row, body);
  if (row.state !== 'looked_up' || row.numberHash !== resolved.numberHash) throw fail(409, 'LOOKUP_REQUIRED');
  if (resolved.identity.status !== 'VERIFIED') return toReview(user, reporter, row, resolved, 'enrolment_mismatch');
  if (!body.detailsAreMine) return toReview(user, reporter, row, resolved, 'enrolment_mismatch');
  const reused = await SelfCheck.exists({ numberHash: resolved.numberHash, reporterId: { $ne: reporter.pseudonymousReporterId }, state: { $in: ['looked_up', 'verified', 'manual_review'] } });
  if (reused) return toReview(user, reporter, row, resolved, 'proxy_attempt');
  await grant(user, reporter, 'verification');
  await sealIdentity(reporter.pseudonymousReporterId, { synthetic: true, personRef: personRefOf(resolved.personId), name: resolved.person?.name, institutionPid: resolved.person?.pid, status: 'VERIFIED', currentEnrolment: true, method: `self_service_${body.kind}` });
  await audit(user, 'identity.evidence.sealed', 'reporter', reporter.pseudonymousReporterId);
  reporter.verificationMethod = 'AbcApaarSimulator';
  await reporter.save();
  let result;
  try {
    result = await claim(user, reporter);
  } catch (err) {
    if (err.code === 'PROXY_ATTEMPT') { row.state = 'manual_review'; await row.save(); return { status: 'manual_review', routedTo: 'officer_review', reason: 'proxy_attempt', label: SIMULATED_LABEL }; }
    throw err;
  }
  row.state = 'verified'; row.failedTries = 0; await row.save();
  await audit(user, `identity.selfcheck.${body.kind}.verified`, 'reporter', reporter.pseudonymousReporterId);
  return { ...result, status: (await Reporter.findById(reporter._id)).status, selfService: true, kind: body.kind, last4: row.last4, label: SIMULATED_LABEL };
}

export async function selfCheckMine(user) {
  const reporter = await Reporter.findOne({ userId: user.id });
  const row = reporter ? await SelfCheck.findOne({ reporterId: reporter.pseudonymousReporterId }).lean() : null;
  return { label: SIMULATED_LABEL, state: row?.state || 'none', kind: row?.kind || null, last4: row?.last4 || null };
}
