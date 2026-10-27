import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import InstitutionIdentifier from '../src/modules/institutions/InstitutionIdentifier.js';
import RuleBookVersion from '../src/modules/rulebook/models.js';
import { createClockSegment } from '../src/modules/priority/priorityService.js';
import { evaluateRouting } from '../src/modules/routing/routingEngine.js';
import { checkInsiderActivity } from '../src/modules/insider/insiderService.js';
import { seedS3Fixtures } from '../src/modules/sync/seed.js';
import { setupS5, agent, makeCase, addTransfer, closeThroughProof, approveRule, PID, NARRATIVE } from './s5-helpers.js';
import Case from '../src/modules/cases/Case.js';

/** S7 release fixes from plans/FINAL_AUDIT_REPORT.md. */
let ctx;
beforeEach(async () => {
  ctx = await setupS5();
});
afterEach(() => {
  process.env.APP_MODE = 'demo';
});

describe('S3 fixes', () => {
  it('[N20] a transfer requested and accepted over HTTP records the sender and receiver from the session', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    const rb = await agent(ctx.app, ctx.officer);
    const res = await rb.post('/api/v1/transfers').send({ masterCaseId: c.masterCaseId, toBureau: 'Public Grievance Redressal Cell', reason: 'Synthetic transfer' }).expect(201);
    expect(String(res.body.transfer.senderOfficerId)).toBe(String(ctx.officer._id));
    const accepted = await (await agent(ctx.app, ctx.pgrc)).post(`/api/v1/transfers/${res.body.transfer._id}/accept`).expect(200);
    expect(JSON.stringify(accepted.body)).toContain(String(ctx.pgrc._id));
  });

  it('[N70] queries and internal notes sent over HTTP record the officer from the session', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    const rb = await agent(ctx.app, ctx.officer);
    const q = await rb.post('/api/v1/queries').send({ caseId: String(c._id), recipientType: 'institution', queryText: 'Synthetic request' }).expect(201);
    expect(String(q.body.senderOfficerId)).toBe(String(ctx.officer._id));
    await rb.post('/api/v1/sync/notes').send({ caseId: String(c._id), text: 'Synthetic note' }).expect((r) => expect([200, 201]).toContain(r.status));
  });

  it('[N21] the S3 demo seed runs on a fresh database, so npm run reset completes', async () => {
    await expect(seedS3Fixtures()).resolves.toMatchObject({ seeded: true });
    const transfers = await mongoose.connection.collection('transfers').find({}).toArray();
    expect(transfers.length).toBe(3);
    for (const t of transfers) {
      expect(t.senderOfficerId).toBeTruthy();
      expect(t.dueAt).toBeTruthy();
    }
  });
});

describe('S2 fixes: a missing approved rule gives POLICY_NOT_CONFIGURED, never invented values', () => {
  it('[N27] without an approved SLA rule no clock starts; in production DEMO SLA rules are not selected', async () => {
    expect(await createClockSegment('normal', 'Fee Dispute')).toMatchObject({ ruleVersion: 'DEMO-CASE-STANDARD-v1' });
    process.env.APP_MODE = 'production';
    expect(await createClockSegment('normal', 'Fee Dispute')).toBeNull();
    expect(await createClockSegment('urgent', 'Fee Dispute')).toBeNull();
    process.env.APP_MODE = 'demo';
    await RuleBookVersion.deleteMany({ family: 'SLA' });
    expect(await createClockSegment('high', 'Fee Dispute')).toBeNull();
  });

  it('[N18] without an approved jurisdiction rule the case goes to manual review with POLICY_NOT_CONFIGURED, no default bureau', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    process.env.APP_MODE = 'production';
    const decision = await evaluateRouting(c.toObject());
    expect(decision).toMatchObject({ primary: 'MANUAL_REVIEW', isManualReview: true, ruleVersion: 'POLICY_NOT_CONFIGURED', confidence: 0 });
  });

  it('[N54] without an approved INSIDER rule no insider alert is raised from invented thresholds', async () => {
    process.env.APP_MODE = 'production';
    expect(await checkInsiderActivity(ctx.officer._id)).toEqual([]);
  });
});

describe('SPEC 12.1 workspaces and the ICID column', () => {
  it('[N09] the institution-wise report has an ICID column: the active mapping, or "not available"', async () => {
    await makeCase(ctx.student, ctx.officer);
    await makeCase(ctx.student, ctx.officer, { institutionPid: '1-1000000002', pidSnapshot: { region: 'Southern' } });
    await InstitutionIdentifier.create({ pid: PID, icid: 'IIC-DEMO0001', source: 'registry', status: 'active' });
    const sup = await agent(ctx.app, ctx.supervisor);
    const rows = (await sup.get('/api/v1/impact/summary').expect(200)).body.tiles.institutionWiseHistory.rows;
    expect(rows.find((r) => r.pid === PID).icid).toBe('IIC-DEMO0001');
    expect(rows.find((r) => r.pid === '1-1000000002').icid).toBe('not available');
    const csv = (await sup.get('/api/v1/impact/report.csv').expect(200)).text;
    expect(csv).toContain('rowId,institutionPid,icid,name,total,open,disposed');
    expect(csv).toContain('IIC-DEMO0001');
  });

  it('[N28] the officer dashboard and /cases queue show my cases, tasks, SLA and actions in my scope only', async () => {
    const mine = await makeCase(ctx.student, ctx.officer);
    const theirs = await makeCase(ctx.faculty, ctx.pgrc);
    await addTransfer(mine, ctx.pgrc, { status: 'REQUESTED', acknowledgedAt: null, toBureau: 'Regulation Bureau' });
    const res = await (await agent(ctx.app, ctx.officer)).get('/api/v1/workspace/queue').expect(200);
    expect(res.body.cases.map((c) => c.masterCaseId)).toEqual([mine.masterCaseId]);
    expect(res.body.cases[0]).toMatchObject({ assignedToMe: true, sla: { result: 'POLICY_NOT_CONFIGURED' } });
    expect(res.body.incomingTransfers).toHaveLength(1);
    expect(JSON.stringify(res.body)).not.toContain(NARRATIVE);
    expect(JSON.stringify(res.body)).not.toContain(theirs.masterCaseId);
    const regional = await (await agent(ctx.app, await (await import('../src/modules/auth/User.js')).default.findOne({ username: 'regional1' }))).get('/api/v1/workspace/queue').expect(200);
    expect(regional.body.scope).toMatch(/Regional view: cases in Northern region/);
    await (await agent(ctx.app, ctx.student)).get('/api/v1/workspace/queue').expect(403);
  });

  it('[S09] the /audit trail lists every action with the chain check, for audit roles only, without meta payloads', async () => {
    await makeCase(ctx.student, ctx.officer);
    const res = await (await agent(ctx.app, ctx.auditor)).get('/api/v1/audit-trail').expect(200);
    expect(res.body.chain.intact).toBe(true);
    expect(res.body.events.length).toBeGreaterThan(0);
    expect(res.body.events[0]).not.toHaveProperty('meta');
    await (await agent(ctx.app, ctx.officer)).get('/api/v1/audit-trail').expect(403);
    await (await agent(ctx.app, ctx.instAdmin)).get('/api/v1/audit-trail').expect(403);
  });

  it('[N35] the notification centre shows each user only their own notices, with no narrative', async () => {
    const c = await makeCase(ctx.student, ctx.officer, { status: 'Assigned' });
    const { transitionStatus } = await import('../src/modules/lifecycle/lifecycleService.js');
    await transitionStatus(c._id, 'Under Process', ctx.officer, 'synthetic');
    const student = (await (await agent(ctx.app, ctx.student)).get('/api/v1/notifications').expect(200)).body;
    expect(student.items.some((i) => i.kind === 'STATUS' && i.text.includes(c.masterCaseId))).toBe(true);
    expect(student.channels.sms).toMatch(/sandbox/);
    const faculty = (await (await agent(ctx.app, ctx.faculty)).get('/api/v1/notifications').expect(200)).body;
    expect(JSON.stringify(faculty)).not.toContain(c.masterCaseId);
    expect(JSON.stringify(student)).not.toContain(NARRATIVE);
  });
});

describe('U12 end to end', () => {
  it('[U12] the Master Case ID is unchanged after routing, transfer and appeal', async () => {
    const c = await makeCase(ctx.student, ctx.officer, { status: 'SUBMITTED', owningBureau: null, routingDecisionId: null, currentOwner: undefined });
    const id = c.masterCaseId;
    const sup = await agent(ctx.app, ctx.supervisor);
    const routed = await sup.post(`/api/v1/routing/${c._id}/decide`);
    expect([200, 201]).toContain(routed.status);
    await Case.updateOne({ _id: c._id }, { $set: { owningBureau: ctx.officer.bureau, currentOwner: { office: ctx.officer.bureau, role: 'bureau_officer', officerId: ctx.officer._id } } });
    const rb = await agent(ctx.app, ctx.officer);
    const t = await rb.post('/api/v1/transfers').send({ masterCaseId: id, toBureau: 'Public Grievance Redressal Cell', reason: 'Synthetic' }).expect(201);
    await (await agent(ctx.app, ctx.pgrc)).post(`/api/v1/transfers/${t.body.transfer._id}/accept`).expect(200);
    await Case.updateOne({ _id: c._id }, { $set: { owningBureau: ctx.officer.bureau } });
    const closed = await closeThroughProof(ctx, await Case.findById(c._id));
    expect(closed.masterCaseId).toBe(id);
    await approveRule({ family: 'APPEAL', version: 'TEST-APPEAL-U12', body: { windowDays: 30, levels: 1 } }, ctx.officer, ctx.supervisor);
    await (await agent(ctx.app, ctx.student)).post(`/api/v1/cases/${id}/appeals`).send({ grounds: 'Synthetic' }).expect(201);
    const after = await Case.findById(c._id).lean();
    expect(after.masterCaseId).toBe(id);
    expect(await Case.countDocuments({ masterCaseId: id })).toBe(1);
  });
});

describe('Jury-audit hardening', () => {
  it('[S07] a case closed in any status spelling is out of identity-reveal scope', async () => {
    const { mapAnalyticStatus, CLOSED_STATUSES } = await import('../src/modules/lifecycle/lifecycleGuards.js');
    for (const s of CLOSED_STATUSES) expect(mapAnalyticStatus(s)).toBe('DISPOSED');
    const { requestReveal } = await import('../src/modules/vault/service.js');
    const asOfficer = { id: String(ctx.officer._id), _id: ctx.officer._id, role: ctx.officer.role, bureau: ctx.officer.bureau };
    for (const status of CLOSED_STATUSES) {
      const c = await makeCase(ctx.student, ctx.officer, { status });
      await expect(requestReveal(asOfficer, c.reporterId, 'Synthetic purpose for review')).rejects.toBeTruthy();
      await Case.deleteMany({});
    }
    const open = await makeCase(ctx.student, ctx.officer);
    await expect(requestReveal(asOfficer, open.reporterId, 'Synthetic purpose for review')).resolves.toBeTruthy();
  });

  it('[S16] state-changing requests from another site are refused (CSRF origin check); same-origin and non-browser clients pass', async () => {
    const supertest = (await import('supertest')).default;
    await supertest(ctx.app).post('/api/v1/auth/login').set('Origin', 'https://evil.example').send({ username: 'rb_officer1', password: 'demo1234' }).expect(403);
    await supertest(ctx.app).post('/api/v1/auth/login').set('Origin', 'http://localhost:5173').send({ username: 'rb_officer1', password: 'demo1234' }).expect(200);
    await supertest(ctx.app).post('/api/v1/auth/login').send({ username: 'rb_officer1', password: 'demo1234' }).expect(200);
    await supertest(ctx.app).get('/api/v1/health').set('Origin', 'https://evil.example').expect(200);
  });

  it('[S16] local dev logins pass from any loopback origin (127.0.0.1, other Vite ports); production keeps the strict list', async () => {
    const supertest = (await import('supertest')).default;
    const login = (origin) => supertest(ctx.app).post('/api/v1/auth/login').set('Origin', origin).send({ username: 'rb_officer1', password: 'demo1234' });
    for (const origin of ['http://127.0.0.1:5173', 'http://localhost:5174', 'http://[::1]:5173']) await login(origin).expect(200);
    await login('http://localhost.evil.example:5173').expect(403);
    process.env.APP_MODE = 'production';
    expect((await login('http://127.0.0.1:5174')).body.error).toBe('CSRF_ORIGIN_MISMATCH');
  });
});

describe('Matcher hard cases (N48)', () => {
  it('[A-N48] the hard-case benchmark reports precision and recall per stratum: same college other issue, paraphrase, code-mixed, new detail', async () => {
    const { evaluateHard, hardFixtures } = await import('../src/modules/benchmark/hardCases.js');
    const { overlapDefaults } = await import('../src/modules/prevent/defaults.js');
    const pairs = hardFixtures();
    expect(new Set(pairs.map((p) => p.stratum))).toEqual(new Set(['same_pid_different_issue', 'same_category_other_text', 'paraphrase', 'code_mixed', 'new_detail']));
    const r = await evaluateHard({ ...overlapDefaults, configured: true, synthetic: true, version: 'DEMO-OVERLAP-v1' }, pairs);
    expect(r.label).toMatch(/SYNTHETIC DATA/);
    expect(r.truePositive + r.falsePositive + r.trueNegative + r.falseNegative + r.unknown).toBe(pairs.length);
    expect(r.precision).toMatchObject({ numerator: r.truePositive, denominator: r.truePositive + r.falsePositive });
    expect(r.recall).toMatchObject({ numerator: r.truePositive, denominator: r.truePositive + r.falseNegative });
    // The containment signal keeps a re-sent complaint with a new sentence from looking like a new issue.
    expect(r.strata.new_detail.correctPercent).toBeGreaterThanOrEqual(95);
    expect(r.strata.same_pid_different_issue.correctPercent).toBeGreaterThanOrEqual(95);
    expect(r.method).toMatch(/no learned language model/);
  }, 300000);
});
