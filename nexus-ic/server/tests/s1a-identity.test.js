import { beforeAll, beforeEach, afterEach, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/modules/auth/User.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { Reporter, Otp, Fraud, RateBucket } from '../src/modules/identity/models.js';
import { Vault, Reveal } from '../src/modules/vault/models.js';
import { Consent } from '../src/modules/consent/models.js';
import { getReporterId, isVerified, recordFraudSignal, toOfficerView, checkEligibility } from '../src/modules/identity/index.js';
import { config } from '../src/modules/identity/config.js';
import { serial } from '../src/modules/identity/support.js';
import { setRevealScopeResolver } from '../src/modules/vault/service.js';
import { verifyChain } from '../src/modules/audit/audit.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { AbcApaarSimulator, StaffRegistrySimulator, SsoSimulator } from '../src/modules/identity/simulators.js';
import { seal, open } from '../src/modules/vault/crypto.js';
import logger from '../src/config/logger.js';
let app;
const defaults = { ...config };
beforeAll(async () => { await Promise.all([Reporter.init(), Vault.init(), Consent.init(), Otp.init(), Fraud.init(), RateBucket.init()]); });
beforeEach(async () => {
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  process.env.APP_MODE = 'demo';
  Object.assign(config, defaults);
  setRevealScopeResolver(async () => false);
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
});
afterEach(async () => { await serial(async () => {}); vi.restoreAllMocks(); });
async function login(username = 'student1') {
  const agent = supertest.agent(app);
  const response = await agent.post('/api/v1/auth/login').send({ username, password: 'demo1234' }).expect(200);
  await serial(async () => {});
  return { agent, user: response.body.user };
}
async function begin(agent, type = 'student', extra = {}) {
  return agent.post(`/api/v1/auth/verify/${type}`).send({ userType: type, reference: type === 'student' ? 'STUDENT-ACTIVE' : type === 'faculty' ? 'FACULTY-ACTIVE' : 'SSO-ACTIVE', consent: true, ...extra });
}
async function complete(agent) {
  await agent.post('/api/v1/identity/otp').send({ consent: true }).expect(200);
  const inbox = await agent.get('/api/v1/dev/otp-inbox').expect(200);
  return agent.post('/api/v1/identity/otp/confirm').send({ code: inbox.body.entries[0].otp });
}
async function verified() {
  const session = await login();
  await begin(session.agent);
  const result = await complete(session.agent);
  expect(result.status).toBe(200);
  return { ...session, reporterId: result.body.reporterId };
}
async function revealFlow(reporterId) {
  const requester = await login('supervisor1');
  const approver = await login('authority1');
  const request = await requester.agent.post('/api/v1/identity/reveal-requests').send({ reporterId, purpose: 'Synthetic verification review' }).expect(200);
  await approver.agent.post(`/api/v1/identity/reveal-requests/${request.body.id}/approve`).send({}).expect(200);
  return { requester, approver, id: request.body.id };
}
const assertPrivate = (body) => {
  const json = JSON.stringify(body);
  for (const secret of ['Synthetic student STUDENT-ACTIVE', 'DEMO-APAAR-STUDENT-ACTIVE', 'encryptedPayload', 'claimedFingerprint', 'personRef', 'passwordHash', 'revealPurposes', 'manualDecision']) expect(json).not.toContain(secret);
};
it('[N01] AbcApaarSimulator checks current enrolment before OTP verification', async () => {
  expect(AbcApaarSimulator.verify('STUDENT-ACTIVE').currentEnrolment).toBe(true);
  expect(AbcApaarSimulator.verify('STUDENT-INACTIVE').currentEnrolment).toBe(false);
  const { user } = await verified(); expect(await isVerified(user.id)).toBe(true);
});
it('[N02] faculty needs current staff employment and institutional SSO', async () => {
  expect(StaffRegistrySimulator.verify('FACULTY-ACTIVE').currentEmployment).toBe(true);
  expect(SsoSimulator.verify('FACULTY-ACTIVE', 'faculty').sso).toBe(true);
  const { agent, user } = await login('faculty1'); await begin(agent, 'faculty');
  await complete(agent).then((res) => expect(res.status).toBe(200)); expect(await isVerified(user.id)).toBe(true);
});
it('[N03] other authorized roles verify through SSO and cannot spoof a student role', async () => {
  const { agent, user } = await login('inst_admin1');
  await begin(agent, 'student').then((r) => expect(r.status).toBe(403));
  await begin(agent, 'authorized_user').then((r) => expect(r.status).toBe(200));
  await complete(agent).then((r) => expect(r.status).toBe(200)); expect(await isVerified(user.id)).toBe(true);
});
it('[N04] OTP is hashed, user-scoped, expiring, single-use and attempt-limited', async () => {
  const { agent } = await login(); await begin(agent);
  await agent.post('/api/v1/identity/otp').send({ consent: true }).expect(200);
  const code = (await agent.get('/api/v1/dev/otp-inbox')).body.entries[0].otp;
  const row = await Otp.findOne().lean(); expect(JSON.stringify(row)).not.toContain(code);
  await agent.post('/api/v1/identity/otp/confirm').send({ code }).expect(200);
  await agent.post('/api/v1/identity/otp/confirm').send({ code }).expect(400);
  process.env.APP_MODE = 'production'; await agent.get('/api/v1/dev/otp-inbox').expect(404); process.env.APP_MODE = 'demo';
});
it('[N05] burst signals route to manual review and discard untrusted metadata', async () => {
  const { user, reporterId } = await verified();
  await recordFraudSignal(reporterId, 'burst_submissions', { name: 'NEVER STORE THIS', narrative: 'NEVER STORE THIS' });
  expect(await isVerified(user.id)).toBe(false);
  expect((await Reporter.findOne()).status).toBe('manual_review'); expect(JSON.stringify(await Fraud.find())).not.toContain('NEVER STORE THIS');
});
it('[N06] reporter ID is random, unique and independent of provider identity', async () => {
  const { user, reporterId } = await verified(); expect(reporterId).toMatch(/^RP-[A-Z0-9]{4}$/); expect(await getReporterId(user.id)).toBe(reporterId);
  const faculty = await login('faculty1'); const second = await begin(faculty.agent, 'faculty'); expect(second.body.reporterId).not.toBe(reporterId);
});
it('[N07] each verification and OTP step appends a consent visible to its owner', async () => {
  const { agent } = await verified(); const rows = (await agent.get('/api/v1/consents').expect(200)).body;
  expect(rows.map((r) => r.purpose)).toEqual(['verification', 'otp']); expect(rows.every((r) => r.state === 'granted')).toBe(true);
});
it('[N08] manual review requires an officer and a reason and records the decision', async () => {
  const { agent, user } = await login(); const request = await begin(agent, 'student', { manual: true, reference: 'MANUAL-PERSON-1' });
  expect(request.body.status).toBe('manual_review'); const officer = await login('rb_officer1');
  const path = `/api/v1/identity/manual-verification/${request.body.reporterId}/decide`;
  await agent.post(path).send({ decision: 'approve', reason: 'Synthetic review' }).expect(403);
  await officer.agent.post(path).send({ decision: 'approve' }).expect(400);
  await officer.agent.post(path).send({ decision: 'approve', reason: 'Synthetic review completed' }).expect(200);
  expect(await isVerified(user.id)).toBe(true);
});
it('[N68] Other Stakeholder subtype uses officer-assisted verification', async () => {
  const user = await User.create({ username: 'stakeholder', displayName: 'Synthetic account', passwordHash: await User.hashPassword('demo1234'), role: 'other_stakeholder' });
  const { agent } = await login(user.username); const result = await begin(agent, 'other_stakeholder', { subtype: 'parent', reference: 'MANUAL-OTHER-1' });
  expect(result.body.status).toBe('manual_review'); expect(await isVerified(user.id)).toBe(false);
  expect(open(await Vault.findOne(), result.body.reporterId).subtype).toBe('parent');
});
it('[N69] missing eligibility policy returns POLICY_NOT_CONFIGURED without blocking verification', async () => {
  const { agent, reporterId, user } = await verified(); expect(await checkEligibility(reporterId, {})).toEqual({ result: 'POLICY_NOT_CONFIGURED' });
  expect((await agent.get('/api/v1/identity/me')).body.eligibility.result).toBe('POLICY_NOT_CONFIGURED'); expect(await isVerified(user.id)).toBe(true);
});
it('[N79] system admin manages roles, sees denominated metrics and runs an audited BackupSimulator', async () => {
  const student = await login(); await student.agent.get('/api/v1/sysadmin/system').expect(403);
  const admin = await login('sysadmin1');
  const created = await admin.agent.post('/api/v1/sysadmin/accounts').send({ role: 'student' }).expect(200);
  await admin.agent.patch(`/api/v1/sysadmin/accounts/${created.body.id}`).send({ role: 'faculty', active: false }).expect(200);
  const system = (await admin.agent.get('/api/v1/sysadmin/system').expect(200)).body;
  expect(system.failedLogins.denominator).toBeGreaterThan(0); expect(system.fraudSignals.denominator).toBe(0); expect(system.performance.status).toBe('UNKNOWN');
  expect((await admin.agent.post('/api/v1/sysadmin/backup').send({}).expect(200)).body).toMatchObject({ simulated: true, recoverable: false });
  expect(await AuditEvent.exists({ action: 'sysadmin.backup.simulated' })).toBeTruthy();
});
it('[S04] reporter schema is minimal and APIs reject unknown identity fields', async () => {
  const { agent } = await login(); await begin(agent, 'student', { name: 'Injected' }).then((r) => expect(r.status).toBe(400));
  expect(Object.keys(Reporter.schema.paths).sort()).toEqual(['_id', '__v', 'createdAt', 'pseudonymousReporterId', 'status', 'updatedAt', 'userId', 'userType', 'verificationMethod', 'verifiedAt'].sort());
});
it('[S05] verification and OTP refuse missing consent', async () => {
  const { agent } = await login(); await begin(agent, 'student', { consent: false }).then((r) => expect(r.status).toBe(400));
  await begin(agent); await agent.post('/api/v1/identity/otp').send({ consent: false }).expect(400);
});
it('[S06] allowlisted officer serializer drops identity and unknown fields', () => {
  expect(toOfficerView({ reporterId: 'RP-7K2Q', name: 'Secret', encryptedPayload: 'Secret', userId: 'Secret', status: 'verified' })).toEqual({ reporterId: 'RP-7K2Q', status: 'verified' });
});
it('[S07] vault bytes are encrypted and ordinary APIs contain no vault payload', async () => {
  const { agent } = await verified(); const row = await Vault.findOne().lean();
  assertPrivate(row.encryptedPayload); expect(row.encryptedPayload).not.toContain('STUDENT-ACTIVE');
  expect(open(row, row.reporterId).name).toBe('Synthetic student STUDENT-ACTIVE');
  assertPrivate((await agent.get('/api/v1/identity/me')).body); assertPrivate((await agent.get('/api/v1/consents')).body);
  const altered = { ...row, tag: Buffer.alloc(16).toString('base64') }; expect(() => open(altered, row.reporterId)).toThrow();
  expect(() => open(row, 'RP-0000')).toThrow();
});
it('[S14] session alone and pending OTP do not create verified status', async () => {
  const { agent, user } = await login(); await begin(agent); expect(await isVerified(user.id)).toBe(false);
  await agent.post('/api/v1/identity/otp').send({ consent: true }).expect(200);
  await Otp.updateOne({ userId: user.id }, { $set: { expiresAt: new Date(0) } });
  await agent.post('/api/v1/identity/otp/confirm').send({ code: '000000' }).expect(400); expect(await isVerified(user.id)).toBe(false);
});
it('[S15] login, verification and OTP routes enforce configured DEMO limits', async () => {
  const { agent } = await login(); config.verificationLimit = 1;
  await begin(agent).then((r) => expect(r.status).toBe(200)); await begin(agent).then((r) => expect(r.status).toBe(429));
  config.otpLimit = 1; await agent.post('/api/v1/identity/otp').send({ consent: true }).expect(200); await agent.post('/api/v1/identity/otp').send({ consent: true }).expect(429);
  config.loginLimit = 1; await supertest(app).post('/api/v1/auth/login').send({ username: 'student1', password: 'demo1234' }).expect(429);
});
it('[S26] consent withdrawal appends a record and invokes unconfigured retention', async () => {
  const { agent } = await verified(); const grants = (await agent.get('/api/v1/consents')).body;
  const response = await agent.post(`/api/v1/consents/${grants[0].id}/withdraw`).send({}).expect(200);
  expect(response.body.retention.result).toBe('POLICY_NOT_CONFIGURED'); expect(response.body.withdrawnAt).toBeTruthy();
  expect((await Consent.findById(grants[0].id)).withdrawnAt).toBeNull(); expect(await Consent.countDocuments()).toBe(3);
});
it('[U05] student with no current enrolment has no verified reporter account', async () => {
  const { agent, user } = await login(); const result = await begin(agent, 'student', { reference: 'STUDENT-INACTIVE' });
  expect(result.body.status).toBe('manual_review'); expect(await isVerified(user.id)).toBe(false); expect(await Reporter.countDocuments({ status: 'verified' })).toBe(0);
});
it('[U06] inactive faculty is rejected with no verified employment status', async () => {
  const { agent, user } = await login('faculty1'); const result = await begin(agent, 'faculty', { reference: 'FACULTY-INACTIVE' });
  expect(result.body.status).toBe('rejected'); expect(await isVerified(user.id)).toBe(false);
});
it('[U07] second account for one verified person is blocked and flagged', async () => {
  await verified(); await User.create({ username: 'proxy', displayName: 'Synthetic proxy', role: 'student', passwordHash: await User.hashPassword('demo1234') });
  const { agent, user } = await login('proxy'); const response = await begin(agent);
  expect(response.body.status).toBe('manual_review'); expect(await isVerified(user.id)).toBe(false);
  await agent.post('/api/v1/identity/otp').send({ consent: true }).expect(409); expect(await Fraud.exists({ type: 'proxy_attempt' })).toBeTruthy();
});
it('[U08] officer queues and reveal summaries use RP IDs and contain no identity fields', async () => {
  const { agent, reporterId } = await verified(); await recordFraudSignal(reporterId, 'burst_submissions', {});
  const officer = await login('rb_officer1'); const queue = (await officer.agent.get('/api/v1/identity/manual-verification').expect(200)).body;
  expect(queue[0].reporterId).toMatch(/^RP-[A-Z0-9]{4}$/); assertPrivate(queue);
  const supervisor = await login('supervisor1'); const req = await supervisor.agent.post('/api/v1/identity/reveal-requests').send({ reporterId, purpose: 'Synthetic purpose' }).expect(200); assertPrivate(req.body);
  assertPrivate((await supervisor.agent.get('/api/v1/identity/reveal-requests')).body); assertPrivate((await agent.get('/api/v1/identity/me')).body);
});
it('[U09] reveal requires purpose, different approver, requester scope, expiry and audit chain', async () => {
  const { reporterId } = await verified(); const supervisor = await login('supervisor1'); const inst = await login('inst_admin1');
  await supervisor.agent.post('/api/v1/identity/reveal-requests').send({ reporterId }).expect(400);
  await inst.agent.post('/api/v1/identity/reveal-requests').send({ reporterId, purpose: 'Forbidden' }).expect(403);
  const request = await supervisor.agent.post('/api/v1/identity/reveal-requests').send({ reporterId, purpose: 'Synthetic review' }).expect(200);
  const path = `/api/v1/identity/reveal-requests/${request.body.id}`;
  await supervisor.agent.post(`${path}/approve`).send({}).expect(403);
  await supervisor.agent.get(`${path}/view`).expect(403);
  const authority = await login('authority1'); await authority.agent.post(`${path}/approve`).send({}).expect(200);
  expect((await supervisor.agent.get(`${path}/view`).expect(200)).body.identity.name).toContain('Synthetic');
  await authority.agent.get(`${path}/view`).expect(403); await inst.agent.get(`${path}/view`).expect(403);
  await Reveal.updateOne({ _id: request.body.id }, { $set: { expiresAt: new Date(0) } });
  await supervisor.agent.get(`${path}/view`).expect(403);
  for (const action of ['requested', 'approved', 'viewed', 'expired']) expect(await AuditEvent.exists({ action: `identity.reveal.${action}` })).toBeTruthy();
  expect(await AuditEvent.countDocuments({ action: 'identity.reveal.denied' })).toBeGreaterThanOrEqual(5);
  expect((await verifyChain()).intact).toBe(true);
});
it('[U10] withdrawal is owner-scoped, idempotent and visible without deleting history', async () => {
  const { agent } = await verified(); const id = (await agent.get('/api/v1/consents')).body[0].id; const other = await login('faculty1'); await begin(other.agent, 'faculty');
  await other.agent.post(`/api/v1/consents/${id}/withdraw`).send({}).expect(404);
  await agent.post(`/api/v1/consents/${id}/withdraw`).send({}).expect(200); await agent.post(`/api/v1/consents/${id}/withdraw`).send({}).expect(200);
  expect((await agent.get('/api/v1/consents')).body[0].state).toBe('withdrawn'); expect(await Consent.countDocuments({ withdrawalOf: id })).toBe(1);
});
it('[S28 regression] verification and approved reveals never write identity values to the safe logger', async () => {
  const spies = ['info', 'warn', 'error', 'debug'].map((key) => vi.spyOn(logger, key).mockImplementation(() => {}));
  const { reporterId } = await verified(); const { requester, id } = await revealFlow(reporterId); await requester.agent.get(`/api/v1/identity/reveal-requests/${id}/view`).expect(200);
  const calls = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
  expect(calls).not.toContain('Synthetic student'); expect(calls).not.toContain('DEMO-APAAR'); expect(calls).not.toContain('personRef');
});
it('[S07] missing VAULT_KEY fails closed and never uses a fallback encryption key', () => {
  delete process.env.VAULT_KEY; expect(() => seal({ name: 'Secret' }, 'RP-7K2Q')).toThrow('VAULT_KEY_NOT_CONFIGURED');
});
it('[S07] counterpart bureaus cannot request or reuse an owning-office reveal', async () => {
  const { reporterId } = await verified(); setRevealScopeResolver(async (user) => user.bureau === 'Regulation Bureau');
  const owner = await login('rb_officer1'); const counterpart = await login('pgrc_officer1');
  await counterpart.agent.post('/api/v1/identity/reveal-requests').send({ reporterId, purpose: 'Forbidden' }).expect(403);
  const request = await owner.agent.post('/api/v1/identity/reveal-requests').send({ reporterId, purpose: 'Synthetic assigned-office review' }).expect(200);
  const authority = await login('authority1'); await authority.agent.post(`/api/v1/identity/reveal-requests/${request.body.id}/approve`).send({}).expect(200);
  await counterpart.agent.get(`/api/v1/identity/reveal-requests/${request.body.id}/view`).expect(403);
  setRevealScopeResolver(async () => false); await owner.agent.get(`/api/v1/identity/reveal-requests/${request.body.id}/view`).expect(403);
});
it('[U07] simultaneous OTP claims for the same person yield exactly one verified account', async () => {
  const first = await login();
  await User.create({ username: 'parallel', displayName: 'Synthetic parallel account', role: 'student', passwordHash: await User.hashPassword('demo1234') });
  const second = await login('parallel');
  await begin(first.agent); await begin(second.agent);
  const results = await Promise.all([complete(first.agent), complete(second.agent)]);
  expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  expect(await Reporter.countDocuments({ status: 'verified' })).toBe(1);
  expect(await Vault.countDocuments({ claimedFingerprint: { $type: 'string' } })).toBe(1);
  expect(await Fraud.exists({ type: 'proxy_attempt' })).toBeTruthy();
});
it('[N05] shared devices and repeated verification attempts require human review', async () => {
  const first = await login(); await begin(first.agent, 'student', { deviceId: 'DEMO-DEVICE-A' });
  const second = await login('faculty1'); await begin(second.agent, 'faculty', { deviceId: 'DEMO-DEVICE-A' });
  expect(await Fraud.exists({ type: 'shared_device' })).toBeTruthy(); expect(await isVerified(second.user.id)).toBe(false);
  await complete(first.agent).then((r) => expect(r.status).toBe(200));
  await begin(first.agent); expect(await Fraud.exists({ type: 'repeated_registration' })).toBeTruthy(); expect(await isVerified(first.user.id)).toBe(false);
});
it('[N04] wrong OTP attempts exhaust the configured allowance and cannot be replayed by another account', async () => {
  const first = await login(); await begin(first.agent);
  await first.agent.post('/api/v1/identity/otp').send({ consent: true }).expect(200);
  const code = (await first.agent.get('/api/v1/dev/otp-inbox')).body.entries[0].otp;
  const second = await login('faculty1');
  expect((await second.agent.get('/api/v1/dev/otp-inbox')).body.entries).toEqual([]);
  await second.agent.post('/api/v1/identity/otp/confirm').send({ code }).expect(400);
  config.otpAttempts = 2;
  for (let i = 0; i < 2; i++) await first.agent.post('/api/v1/identity/otp/confirm').send({ code: 'not-an-otp' }).expect(400);
  await first.agent.post('/api/v1/identity/otp/confirm').send({ code }).expect(400);
  expect(await isVerified(first.user.id)).toBe(false);
});
it('[N68] manual verification cannot create a second claim for the same synthetic person', async () => {
  const officer = await login('rb_officer1');
  for (const username of ['manual-a', 'manual-b']) {
    await User.create({ username, displayName: 'Synthetic manual account', role: 'other_stakeholder', passwordHash: await User.hashPassword('demo1234') });
    const { agent, user } = await login(username);
    const request = await begin(agent, 'other_stakeholder', { reference: 'MANUAL-OTHER-1', subtype: 'citizen' });
    await officer.agent.post(`/api/v1/identity/manual-verification/${request.body.reporterId}/decide`).send({ decision: 'approve', reason: 'Synthetic evidence review' }).expect(username === 'manual-a' ? 200 : 409);
    expect(await isVerified(user.id)).toBe(username === 'manual-a');
  }
});
it('[S26] withdrawing verification consent invalidates an outstanding OTP and blocks reveal', async () => {
  const { agent } = await login(); await begin(agent);
  await agent.post('/api/v1/identity/otp').send({ consent: true }).expect(200);
  const code = (await agent.get('/api/v1/dev/otp-inbox')).body.entries[0].otp;
  const id = (await agent.get('/api/v1/consents')).body[0].id;
  await agent.post(`/api/v1/consents/${id}/withdraw`).send({}).expect(200);
  await agent.post('/api/v1/identity/otp/confirm').send({ code }).expect(400);
});
