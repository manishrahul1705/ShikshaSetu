import crypto from 'node:crypto';
import request from 'supertest';
import { expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedIdentityReporters } from '../src/modules/identity/seed.js';
import { seedInstitutionsAndRegions } from '../src/modules/institutions/seed.js';
import { listInstitutions } from '../src/modules/registry/RegistrySimulator.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';

async function fixture() {
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  process.env.DOCS_KEY = crypto.randomBytes(32).toString('hex');
  await seedDemoAccounts();
  await seedIdentityReporters();
  await seedInstitutionsAndRegions();
  await seedRuleBook();
  const app = createApp(process.env.MONGODB_URI), owner = request.agent(app), other = request.agent(app);
  await owner.post('/api/v1/auth/login').send({ username: 'trust_student_verified', password: 'demo1234' }).expect(200);
  const made = await owner.post('/api/v1/grievances').send({ institutionPid: listInstitutions(1)[0].pid, category: 'Fee Dispute', subCategory: 'Refund Denial', narrative: 'Synthetic receipt verification grievance', documentIds: [] }).expect(201);
  const master = made.body.masterCaseId;
  return { app, owner, other, master };
}

it('[A-N63] a real own-case receipt contains the QR SVG and authenticated tracking link, while another reporter gets 404', async () => {
  const { app, owner, other, master } = await fixture();
  const receipt = await owner.get(`/api/v1/track/${master}/receipt`).expect(200);
  expect(receipt.text.includes('<svg')).toBe(true);
  expect(receipt.text.includes('aria-label="QR code to track this case"')).toBe(true);
  expect(receipt.text.includes(`/track/${master}`)).toBe(true);
  expect(receipt.text.includes('SYNTHETIC DATA')).toBe(false);
  expect(receipt.text.includes('Synthetic receipt verification grievance')).toBe(false);
  await other.post('/api/v1/auth/login').send({ username: 'trust_faculty_verified', password: 'demo1234' }).expect(200);
  await other.get(`/api/v1/track/${master}/receipt`).expect(404);
  await request(app).get(`/api/v1/track/${master}/receipt`).expect(401);
});

it('[S02] transfer history authorizes its case before reading and audits indistinguishable 404 denials', async () => {
  const { app, owner, other, master } = await fixture();
  await other.post('/api/v1/auth/login').send({ username: 'trust_faculty_verified', password: 'demo1234' }).expect(200);
  const ownCase = await owner.get(`/api/v1/cases/${master}`).expect(200);
  await owner.get(`/api/v1/transfers/case/${master}`).expect(200);
  await other.get(`/api/v1/transfers/case/${master}`).expect(404);
  await other.get(`/api/v1/transfers/case/${ownCase.body._id}`).expect(404);
  await other.get('/api/v1/transfers/case/not-a-case').expect(404);
  await request(app).get(`/api/v1/transfers/case/${master}`).expect(401);
  expect(await AuditEvent.countDocuments({ action: 'case.transfer.history.denied' })).toBe(3);
});

it('[N19] the immutable routing decision retains the actual computed priority reason', async () => {
  const { app, master } = await fixture();
  const supervisor = request.agent(app);
  await supervisor.post('/api/v1/auth/login').send({ username: 'supervisor1', password: 'demo1234' }).expect(200);
  const c = await supervisor.get(`/api/v1/cases/${master}`).expect(200);
  const decisions = await supervisor.get(`/api/v1/routing/${c.body._id}/decision`).expect(200);
  expect(decisions.body[0].factors.priority).toEqual({ value: c.body.priority, reason: 'Standard priority assigned for general grievance (DEMO-CASE-STANDARD-v1)' });
});

for (const action of ['accept', 'reject']) {
  it(`[S03] transfer request and ${action} responses apply the officer case field policy`, async () => {
    const { app, master } = await fixture();
    const supervisor = request.agent(app);
    await supervisor.post('/api/v1/auth/login').send({ username: 'supervisor1', password: 'demo1234' }).expect(200);
    const c = await supervisor.get(`/api/v1/cases/${master}`).expect(200);
    const regulation = /Regulation|^RB$/.test(c.body.owningBureau);
    const sender = request.agent(app), recipient = request.agent(app);
    await sender.post('/api/v1/auth/login').send({ username: regulation ? 'rb_officer1' : 'pgrc_officer1', password: 'demo1234' }).expect(200);
    await recipient.post('/api/v1/auth/login').send({ username: regulation ? 'pgrc_officer1' : 'rb_officer1', password: 'demo1234' }).expect(200);
    const made = await sender.post('/api/v1/transfers').send({ masterCaseId: master, toBureau: regulation ? 'Public Grievance Redressal Cell' : 'Regulation Bureau', reason: 'Synthetic coordination' }).expect(201);
    expect(made.body.case.masterCaseId).toBe(master);
    expect(made.body.case).not.toHaveProperty('narrative');
    expect(made.body.case).not.toHaveProperty('userId');
    const handled = await recipient.post(`/api/v1/transfers/${made.body.transfer._id}/${action}`).send(action === 'reject' ? { reason: 'Synthetic jurisdiction decision' } : {}).expect(200);
    expect(handled.body.case.masterCaseId).toBe(master);
    expect(handled.body.case).not.toHaveProperty('narrative');
    expect(handled.body.case).not.toHaveProperty('userId');
  });
}
