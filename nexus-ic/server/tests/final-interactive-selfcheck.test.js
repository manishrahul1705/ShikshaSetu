import crypto from 'node:crypto';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { Reporter, Fraud } from '../src/modules/identity/models.js';
import { Vault } from '../src/modules/vault/models.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import logger from '../src/config/logger.js';
import { serial } from '../src/modules/identity/support.js';
import { SelfCheck, SIMULATED_LABEL, SYNTHETIC_AADHAAR_REGISTRY, selfCheckConfirm, selfCheckLookup, verhoeffDigit, verhoeffValid } from '../src/modules/identity/selfCheck.js';

const ABC = '1000-2000-3001';
const ABC_DIGITS = '100020003001';
const AADHAAR = SYNTHETIC_AADHAAR_REGISTRY[1].number; // synthetic, starts with 1: never a real Aadhaar
let app;

beforeAll(async () => { await Promise.all([Reporter.init(), Vault.init(), SelfCheck.init()]); });
beforeEach(async () => {
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
});
afterEach(async () => { await serial(async () => {}); vi.restoreAllMocks(); });

async function student() {
  const agent = supertest.agent(app);
  await agent.post('/api/v1/auth/login').send({ username: 'student1', password: 'demo1234' }).expect(200);
  return agent;
}
const fakeStudent = () => ({ id: new mongoose.Types.ObjectId().toString(), role: 'student', username: 'synthetic-student' });

async function allStoredText() {
  const names = (await mongoose.connection.db.listCollections().toArray()).map(row => row.name);
  const dumps = await Promise.all(names.map(name => mongoose.connection.db.collection(name).find({}).toArray()));
  return JSON.stringify(dumps);
}

describe('[A-N99] self-service ABC / Aadhaar check (simulated)', () => {
  it('[A-N99] ABC happy path: details fetched for the student to confirm, then verified with no manual review and no OTP', async () => {
    const agent = await student();
    const lookup = await agent.post('/api/v1/identity/self-check/lookup').send({ kind: 'abc', number: ABC, consent: true }).expect(200);
    expect(lookup.body).toMatchObject({ status: 'confirm_details', last4: '3001', label: SIMULATED_LABEL, details: { name: 'Aarav Sharma', institutionPid: '1-7734299133', enrolment: 'Active' } });
    expect(JSON.stringify(lookup.body)).not.toContain(ABC_DIGITS);
    const confirm = await agent.post('/api/v1/identity/self-check/confirm').send({ kind: 'abc', number: ABC, consent: true, detailsAreMine: true }).expect(200);
    expect(confirm.body).toMatchObject({ status: 'verified', selfService: true, last4: '3001', label: SIMULATED_LABEL });
    const reporter = await Reporter.findOne({});
    expect(reporter.status).toBe('verified');
    expect(await Fraud.countDocuments()).toBe(0);
    expect((await agent.get('/api/v1/identity/me').expect(200)).body.status).toBe('verified');
  });

  it('[A-N99] a student without an ABC ID is verified with a synthetic Aadhaar-style number (Verhoeff checksum)', async () => {
    expect(AADHAAR).toMatch(/^1\d{11}$/);
    expect(verhoeffValid(AADHAAR)).toBe(true);
    const agent = await student();
    const lookup = await agent.post('/api/v1/identity/self-check/lookup').send({ kind: 'aadhaar', number: AADHAAR, consent: true }).expect(200);
    expect(lookup.body.details.name).toBe('Vikram Singh');
    const confirm = await agent.post('/api/v1/identity/self-check/confirm').send({ kind: 'aadhaar', number: AADHAAR, consent: true, detailsAreMine: true }).expect(200);
    expect(confirm.body).toMatchObject({ status: 'verified', kind: 'aadhaar', last4: AADHAAR.slice(-4) });
  });

  it('[A-N99] a bad checksum and an unknown number are refused without verifying', async () => {
    const agent = await student();
    const bad = AADHAAR.slice(0, 11) + String((Number(AADHAAR[11]) + 1) % 10);
    expect(verhoeffValid(bad)).toBe(false);
    expect((await agent.post('/api/v1/identity/self-check/lookup').send({ kind: 'aadhaar', number: bad, consent: true }).expect(400)).body.error).toBe('BAD_CHECKSUM');
    const unknownBase = '10000000999';
    const unknown = unknownBase + verhoeffDigit(unknownBase);
    expect((await agent.post('/api/v1/identity/self-check/lookup').send({ kind: 'aadhaar', number: unknown, consent: true }).expect(400)).body.error).toBe('UNKNOWN_NUMBER');
    expect((await Reporter.findOne({})).status).not.toBe('verified');
  });

  it('[A-N99] an institution mismatch, "these are not my details", a reused number or too many failed tries go to the existing manual review', async () => {
    const mismatch = fakeStudent();
    expect(await selfCheckLookup(mismatch, { kind: 'abc', number: ABC, consent: true, institutionPid: '1-7734299101' })).toMatchObject({ status: 'manual_review', reason: 'enrolment_mismatch' });
    const denies = fakeStudent();
    await selfCheckLookup(denies, { kind: 'abc', number: '1000-2000-3002', consent: true });
    expect(await selfCheckConfirm(denies, { kind: 'abc', number: '1000-2000-3002', consent: true, detailsAreMine: false })).toMatchObject({ status: 'manual_review' });
    const first = fakeStudent(), second = fakeStudent();
    await selfCheckLookup(first, { kind: 'aadhaar', number: AADHAAR, consent: true });
    expect((await selfCheckConfirm(first, { kind: 'aadhaar', number: AADHAAR, consent: true, detailsAreMine: true })).status).toBe('verified');
    await selfCheckLookup(second, { kind: 'aadhaar', number: AADHAAR, consent: true });
    expect(await selfCheckConfirm(second, { kind: 'aadhaar', number: AADHAAR, consent: true, detailsAreMine: true })).toMatchObject({ status: 'manual_review', reason: 'proxy_attempt' });
    const guesser = fakeStudent();
    for (let i = 0; i < 2; i++) await expect(selfCheckLookup(guesser, { kind: 'aadhaar', number: '123456789012', consent: true })).rejects.toMatchObject({ status: 400 });
    await expect(selfCheckLookup(guesser, { kind: 'aadhaar', number: '123456789012', consent: true })).rejects.toMatchObject({ code: 'TOO_MANY_FAILED_TRIES' });
    expect(await Reporter.countDocuments({ status: 'manual_review' })).toBe(4);
    const officer = supertest.agent(app);
    await officer.post('/api/v1/auth/login').send({ username: 'rb_officer1', password: 'demo1234' }).expect(200);
    const queue = await officer.get('/api/v1/identity/manual-verification').expect(200);
    expect(queue.body.length).toBe(4);
  });

  it('[A-N99] no raw ABC or Aadhaar number is stored, logged or audited; only a salted hash and the last four digits', async () => {
    const logged = [];
    for (const level of ['info', 'warn', 'error', 'debug']) vi.spyOn(logger, level).mockImplementation((...args) => { logged.push(JSON.stringify(args)); });
    const agent = await student();
    await agent.post('/api/v1/identity/self-check/lookup').send({ kind: 'abc', number: ABC, consent: true }).expect(200);
    await agent.post('/api/v1/identity/self-check/confirm').send({ kind: 'abc', number: ABC, consent: true, detailsAreMine: true }).expect(200);
    await selfCheckLookup(fakeStudent(), { kind: 'aadhaar', number: AADHAAR, consent: true });
    const stored = await allStoredText();
    for (const raw of [ABC_DIGITS, ABC, AADHAAR]) {
      expect(stored).not.toContain(raw);
      expect(logged.join('\n')).not.toContain(raw);
    }
    const audits = JSON.stringify(await AuditEvent.find({}).lean());
    expect(audits).not.toContain(ABC_DIGITS);
    expect(audits).toContain('identity.selfcheck.abc.verified');
    const row = await SelfCheck.findOne({ kind: 'abc' }).lean();
    expect(row.last4).toBe('3001');
    expect(row.numberHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('[A-N99] every response carries the simulated label and consent is required', async () => {
    const agent = await student();
    expect((await agent.post('/api/v1/identity/self-check/lookup').send({ kind: 'abc', number: ABC, consent: false }).expect(400)).body.error).toBe('CONSENT_REQUIRED');
    expect((await agent.get('/api/v1/identity/self-check/me').expect(200)).body.label).toBe('Simulated check, not a government verification');
    const faculty = supertest.agent(app);
    await faculty.post('/api/v1/auth/login').send({ username: 'faculty1', password: 'demo1234' }).expect(200);
    await faculty.post('/api/v1/identity/self-check/lookup').send({ kind: 'abc', number: ABC, consent: true }).expect(403);
  });

  it('[A-N99] the existing officer-assisted path still works beside the self-service path', async () => {
    const agent = await student();
    const started = await agent.post('/api/v1/auth/verify/student').send({ userType: 'student', reference: 'MANUAL-PERSON-1', consent: true, manual: true }).expect(200);
    expect(started.body).toMatchObject({ status: 'manual_review', verificationMethod: 'officer_assisted' });
    expect((await agent.post('/api/v1/identity/self-check/lookup').send({ kind: 'abc', number: ABC, consent: true }).expect(409)).body.error).toBe('MANUAL_REVIEW_PENDING');
  });
});
