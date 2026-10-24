import crypto from 'node:crypto';
import { beforeEach, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { studentVerificationRecords } from '../src/modules/identity/studentDataset.js';
import { StudentVerification, confirmStudentOtp } from '../src/modules/identity/studentVerification.js';
import { Reporter, Fraud } from '../src/modules/identity/models.js';
import { Vault } from '../src/modules/vault/models.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import User from '../src/modules/auth/User.js';

let app;
beforeEach(async () => {
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  process.env.APP_MODE = 'demo';
  await seedDemoAccounts();
  const first = await User.findOne({ username: 'student1' });
  await User.create({ username: 'student2', passwordHash: first.passwordHash, role: 'student', displayName: 'Second Student', active: true, synthetic: true });
  await Vault.init();
  app = createApp(process.env.MONGODB_URI);
});
async function login(username = 'student1') {
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/login').send({ username, password: 'demo1234' }).expect(200);
  return agent;
}
const lookup = (agent, overrides = {}) => agent.post('/api/v1/identity/student/lookup').send({ kind: 'abc', number: '100020003001', consent: true, ...overrides });
const send = (agent, channel = 'email') => agent.post('/api/v1/identity/student/send-otp').send({ channel, consent: true, detailsAreMine: true });
async function complete(agent, channel = 'email') {
  await send(agent, channel).expect(200);
  const delivery = await agent.get('/api/v1/identity/student/local-delivery').expect(200);
  return agent.post('/api/v1/identity/student/confirm-otp').send({ code: delivery.body.code }).expect(200);
}
it('[A-N91] 1515 generated students have linked ABC/APAAR, unique Aadhaar-format test IDs and reserved contacts', () => {
  const rows = studentVerificationRecords();
  expect(rows).toHaveLength(1515);
  expect(new Set(rows.map(row => row.aadhaar)).size).toBe(rows.length);
  expect(new Set(rows.map(row => row.studentKey)).size).toBe(rows.length);
  for (const row of rows) {
    expect(row.abcId).toBe(row.apaarId);
    expect(row.aadhaar).toMatch(/^1\d{11}$/);
    expect(row.linkedEmail).toMatch(/@example\.invalid$/);
    expect(row.linkedPhone).toMatch(/^\+91 00000 \d{5}$/);
  }
});
it('[A-N99] student email OTP completes verification on the same flow; no identity is verified before OTP', async () => {
  const agent = await login();
  const result = await lookup(agent).expect(200);
  expect(result.body).toMatchObject({ status: 'confirm_details', details: { enrolment: 'Active' } });
  expect(result.body.channels.email).toContain('***');
  await agent.post('/api/v1/identity/student/confirm-otp').send({ code: '123456' }).expect(400);
  await agent.post('/api/v1/identity/self-check/confirm').send({ kind: 'abc', number: '100020003001', consent: true, detailsAreMine: true }).expect(409);
  expect(await Reporter.countDocuments({ status: 'verified' })).toBe(0);
  await agent.post('/api/v1/identity/student/send-otp').send({ channel: 'email', consent: true, detailsAreMine: false }).expect(400);
  const sent = await send(agent).expect(200);
  expect(sent.body.deliveryMode).toBe('local');
  expect(sent.body.code).toBeUndefined();
  const inbox = await agent.get('/api/v1/identity/student/local-delivery').expect(200);
  expect(inbox.body.code).toMatch(/^\d{6}$/);
  await agent.post('/api/v1/identity/student/confirm-otp').send({ code: 'wrong' }).expect(400);
  const done = await agent.post('/api/v1/identity/student/confirm-otp').send({ code: inbox.body.code }).expect(200);
  expect(done.body).toMatchObject({ status: 'verified', selfService: true, channel: 'email' });
  expect(done.body.routedTo).toBeUndefined();
  expect(await Fraud.countDocuments()).toBe(0);
  expect((await agent.get('/api/v1/identity/student/local-delivery')).body.status).toBe('empty');
  const row = await StudentVerification.findOne().lean();
  expect(JSON.stringify(row)).not.toContain(inbox.body.code);
  expect(JSON.stringify(row)).not.toContain('100020003001');
  const audit = JSON.stringify(await AuditEvent.find().lean());
  expect(audit).not.toContain(inbox.body.code);
  expect(audit).not.toContain('100020003001');
});
it('[A-N99] Aadhaar-format SMS OTP resolves the same student identity and completes without referral', async () => {
  const agent = await login();
  const row = studentVerificationRecords()[0];
  await lookup(agent, { kind: 'aadhaar', number: row.aadhaar }).expect(200);
  const done = await complete(agent, 'sms');
  expect(done.body).toMatchObject({ status: 'verified', channel: 'sms', kind: 'aadhaar', selfService: true });
  expect(await Fraud.countDocuments()).toBe(0);
});
it('[A-N99] inactive, unknown and mismatched IDs stay unverified without an automatic officer referral', async () => {
  const agent = await login();
  await lookup(agent, { number: '100020004001' }).expect(409);
  await lookup(agent, { number: '999999999999' }).expect(404);
  await lookup(agent, { institutionPid: '1-7734299101' }).expect(409);
  await lookup(agent, { consent: false }).expect(400);
  expect(await Reporter.countDocuments({ status: 'verified' })).toBe(0);
  expect(await Fraud.countDocuments()).toBe(0);
});
it('[A-N99] OTP expiry, resend cooldown, guessed codes and cross-session inbox access cannot bypass verification', async () => {
  const first = await login();
  const second = await login('student2');
  await lookup(first).expect(200); await send(first).expect(200);
  await send(first).expect(429);
  expect((await second.get('/api/v1/identity/student/local-delivery')).body.status).toBe('empty');
  await second.post('/api/v1/identity/student/confirm-otp').send({ code: '123456' }).expect(400);
  await StudentVerification.updateOne({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  await first.post('/api/v1/identity/student/confirm-otp').send({ code: '123456' }).expect(400);
  expect(await Reporter.countDocuments({ status: 'verified' })).toBe(0);
});
it('[A-N99] the same identity cannot verify another account through its Aadhaar alias', async () => {
  const first = await login();
  await lookup(first).expect(200); await complete(first);
  const second = await login('student2');
  const aadhaar = studentVerificationRecords()[0].aadhaar;
  await lookup(second, { kind: 'aadhaar', number: aadhaar }).expect(409);
  expect(await Reporter.countDocuments({ status: 'verified' })).toBe(1);
});
it('[S01] student verification reauthorizes every endpoint and rejects caller-supplied contact destinations', async () => {
  await request(app).post('/api/v1/identity/student/lookup').send({}).expect(401);
  const officer = await login('sysadmin1');
  await officer.get('/api/v1/identity/student/local-delivery').expect(403);
  const student = await login();
  await lookup(student).expect(200);
  await student.post('/api/v1/identity/student/send-otp').send({ channel: 'email', consent: true, detailsAreMine: true, email: 'replacement@example.invalid' }).expect(400);
});

it('[A-N99] concurrent OTP guesses reserve no more than five attempts', async () => {
  const agent = await login(); await lookup(agent).expect(200); await send(agent).expect(200);
  const delivery = await agent.get('/api/v1/identity/student/local-delivery');
  const wrong = delivery.body.code === '000000' ? '111111' : '000000';
  const student = await User.findOne({ username: 'student1' });
  const responses = await Promise.allSettled(Array.from({ length: 12 }, () => confirmStudentOtp({ id: student.id, role: 'student' }, { code: wrong })));
  expect(responses.every(response => response.status === 'rejected' && response.reason.status === 400)).toBe(true);
  const row = await StudentVerification.findOne().lean();
  expect(row.attempts).toBe(5); expect(row.consumedAt).toBeTruthy();
  expect(await Reporter.countDocuments({ status: 'verified' })).toBe(0);
});
it('[A-N99] simultaneous valid OTP submissions consume the nonce only once', async () => {
  const agent = await login(); await lookup(agent).expect(200); await send(agent).expect(200);
  const delivery = await agent.get('/api/v1/identity/student/local-delivery');
  const student = await User.findOne({ username: 'student1' });
  const responses = await Promise.allSettled(Array.from({ length: 4 }, () => confirmStudentOtp({ id: student.id, role: 'student' }, { code: delivery.body.code })));
  expect(responses.filter(response => response.status === 'fulfilled')).toHaveLength(1);
  expect(responses.filter(response => response.status === 'rejected').every(response => [400, 409].includes(response.reason.status))).toBe(true);
  expect(await AuditEvent.countDocuments({ action: 'identity.student.self_service_completed' })).toBe(1);
});
