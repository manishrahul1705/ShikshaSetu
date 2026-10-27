import { it, expect, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { recordAudit } from '../src/modules/audit/audit.js';

/**
 * [JUDGE] The docs/JUDGE_SCRIPT.md story through the HTTP API, from a fresh
 * Judge Mode reset, three times in a row. No database edits: every step is an
 * API call a judge's clicks would make. (The browser version needs Playwright,
 * which is not installed yet.)
 */
let app;
beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  process.env.DOCS_KEY = crypto.randomBytes(32).toString('hex');
  await seedDemoAccounts();
  // Wait for any audit appends still queued from earlier test files in this worker, so the
  // Judge Mode reset below starts a clean chain (record() is serialized per process).
  await recordAudit({ actorId: 'judge-test', actorRole: 'system', action: 'test.flush', targetType: 'Test', targetId: 'flush' });
  app = createApp(process.env.MONGODB_URI);
});

async function login(username) {
  const a = supertest.agent(app);
  await a.post('/api/v1/auth/login').send({ username, password: 'demo1234' }).expect(200);
  return a;
}

async function judgeRun() {
  // 0:00 One click: reset and tour.
  const reset = await (await login('supervisor1')).post('/api/v1/judge/reset').expect(200);
  const { institutionPid: pid, cases } = reset.body.scenario;
  const rbCase = cases.find((c) => c.bureau === 'Regulation Bureau').masterCaseId;
  expect(reset.body.banner).toBe('Potential Overlapping Cases – Coordination Required');
  expect(reset.body.scenario.preventResult).toBe('REVIEW');

  // 2:20 Bureau A: Institution 360 and the overlap timeline with the conflict point.
  const rb = await login('rb_officer1');
  await rb.get(`/api/v1/institutions/${pid}/360`).expect(200);
  const timeline = await rb.get(`/api/v1/overlap-timeline/${pid}`).expect(200);
  expect(timeline.body.conflicts.length).toBeGreaterThanOrEqual(1);
  expect(timeline.body.lanes).toHaveLength(2);

  // 3:00 NEXUS TRACE: RB transfers to PGRC, PGRC accepts; the Master Case ID stays.
  const transfer = await rb.post('/api/v1/transfers').send({ masterCaseId: rbCase, toBureau: 'Public Grievance Redressal Cell', reason: 'Judge flow: coordinate in one bureau' });
  expect([transfer.status, transfer.body.error]).toEqual([201, undefined]);
  const pgrc = await login('pgrc_officer1');
  await pgrc.post(`/api/v1/transfers/${transfer.body.transfer._id}/accept`).expect(200);

  // 3:30 PROOF: the gate blocks, evidence and a proposal, a different officer approves, closed.
  const sup = await login('supervisor1');
  const blocked = await sup.post(`/api/v1/cases/${rbCase}/closure/close`).expect(409);
  expect(blocked.body.details.passed).toBe(false);
  const caseId = (await pgrc.get(`/api/v1/cases/${rbCase}`).expect(200)).body._id;
  const upload = await pgrc.post('/api/v1/documents/upload').send({
    bufferBase64: Buffer.from('%PDF-1.4\n% synthetic judge evidence\n%%EOF\n').toString('base64'), originalName: 'evidence.pdf', mimeType: 'application/pdf', caseId,
  }).expect(201);
  await pgrc.post(`/api/v1/cases/${rbCase}/closure/propose`).send({ closureReason: 'Refund paid; both bureaus agreed (synthetic)', evidenceDocumentIds: [String(upload.body.documentId)] }).expect(200);
  await sup.post(`/api/v1/cases/${rbCase}/closure/approve`).expect(200);
  const closed = await sup.post(`/api/v1/cases/${rbCase}/closure/close`).expect(200);
  expect(closed.body.case).toMatchObject({ masterCaseId: rbCase, status: 'Closed', analyticStatus: 'DISPOSED' });

  // 4:00 Student: true status, receipt, feedback.
  const student = await login('trust_student_verified');
  const track = await student.get(`/api/v1/track/${rbCase}`).expect(200);
  expect(track.body.status).toBe('Closed');
  expect(track.body.statusHistory.map((h) => h.status)).toContain('Transfer Accepted');
  await student.get(`/api/v1/track/${rbCase}/receipt`).expect(200);
  await student.post(`/api/v1/cases/${rbCase}/feedback`).send({ rating: 5, text: 'Synthetic judge feedback' }).expect(201);

  // 4:20 Authority: /authority, /impact, click a number.
  const authority = await login('authority1');
  await authority.get('/api/v1/authority/overview').expect(200);
  const impact = await authority.get('/api/v1/impact/summary').expect(200);
  const drill = await authority.get('/api/v1/impact/cases').query({ row: 'tile:disposedCases' }).expect(200);
  expect(drill.body.count).toBe(impact.body.tiles.disposedCases.count);
  expect(drill.body.cases.map((c) => c.masterCaseId)).toContain(rbCase);

  // 4:45 Auditor: the audit chain is intact.
  const chain = await (await login('auditor1')).get('/api/v1/audit/verify').expect(200);
  expect(chain.body.intact).toBe(true);
  return rbCase;
}

it('[JUDGE] the judge script runs end to end from a fresh Judge Mode reset, three times in a row, without database edits', async () => {
  const runs = [];
  for (let i = 0; i < 3; i++) runs.push(await judgeRun());
  expect(runs).toHaveLength(3);
}, 600000);
