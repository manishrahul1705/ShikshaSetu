import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/modules/auth/User.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import { seedBureaus } from '../src/modules/bureaus/seed.js';
import Case from '../src/modules/cases/Case.js';
import RoutingDecision from '../src/modules/routing/models.js';
import { routeCaseOnSubmission, overrideRoute } from '../src/modules/routing/routingService.js';
import * as RegistrySimulator from '../src/modules/registry/RegistrySimulator.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  RegistrySimulator.resetCache();
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRuleBook();
  await seedBureaus();
});

describe('S2: NEXUS ROUTE & Jurisdiction Routing (N18, U16, U17, F48, F56)', () => {
  it('[N18] every decision has primary, reason and ruleVersion; immutable', async () => {
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000018',
      reporterId: 'reporter_n18',
      institutionPid: '1-1000000001',
      category: 'Ragging',
      subCategory: 'Hostel Harassment',
      narrative: 'Senior students harassing fresher students in mess',
      narrativeHash: 'hash_n18_001',
      status: 'SUBMITTED',
      synthetic: true,
    });

    const inst = {
      pid: '1-1000000001',
      state: 'Tamil Nadu',
      region: 'Southern',
      type: 'Engineering',
      approvalStatus: 'approved',
    };

    const routingRes = await routeCaseOnSubmission(caseDoc._id, inst);
    expect(routingRes.decision).toBeDefined();
    expect(routingRes.decision.primaryBureau).toBe('PGRC');
    expect(routingRes.decision.reason).toBeDefined();
    expect(routingRes.decision.ruleVersion).toBe('DEMO-ROUTE-v1');

    // Immutability: direct update throws
    const decisionDoc = await RoutingDecision.findById(routingRes.decision._id);
    decisionDoc.primaryBureau = 'RB';
    await expect(decisionDoc.save()).rejects.toThrow(/immutable/i);
  });

  it('[U16] routing returns primary, secondary and reason; ambiguous to triage', async () => {
    // 1. Clear-cut case: Approval Process / Intake seats -> APB primary, RO secondary
    const clearCase = await Case.create({
      masterCaseId: 'NX-2026-000016',
      reporterId: 'reporter_u16',
      institutionPid: '1-1000000001',
      category: 'Approval Process',
      subCategory: 'Seat Intake',
      narrative: 'Unauthorized increase of intake seats beyond approved norms',
      narrativeHash: 'hash_u16_001',
      status: 'SUBMITTED',
      synthetic: true,
    });

    const inst = {
      pid: '1-1000000001',
      state: 'Karnataka',
      region: 'South-Western',
      type: 'Engineering',
      approvalStatus: 'approved',
    };

    const clearRes = await routeCaseOnSubmission(clearCase._id, inst);
    expect(clearRes.decision.primaryBureau).toBe('APB');
    expect(clearRes.decision.secondaryBureau).toBe('RO');
    expect(clearRes.decision.reason).toMatch(/Approval Process/i);
    expect(clearRes.requiresManualReview).toBe(false);

    // 2. Ambiguous case: unspecified generic query -> goes to triage with requiresManualReview: true
    const ambiguousCase = await Case.create({
      masterCaseId: 'NX-2026-000116',
      reporterId: 'reporter_u16_2',
      institutionPid: '1-1000000001',
      category: 'General Inquiry / Ambiguous Jurisdiction',
      subCategory: 'Miscellaneous',
      narrative: 'A general question about administrative procedure',
      narrativeHash: 'hash_u16_002',
      status: 'SUBMITTED',
      synthetic: true,
    });

    const ambiguousRes = await routeCaseOnSubmission(ambiguousCase._id, inst);
    expect(ambiguousRes.requiresManualReview).toBe(true);

    // Check triage endpoint returns ambiguous case
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'supervisor1', password: DEMO_PASSWORD })
      .expect(200);

    const triageList = await agent.get('/api/v1/routing/triage').expect(200);
    const found = triageList.body.find((c) => c.masterCaseId === 'NX-2026-000116');
    expect(found).toBeDefined();
    expect(found.requiresManualReview).toBe(true);
  });

  it('[U17] route override requires reason and records audit', async () => {
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000017',
      reporterId: 'reporter_u17',
      institutionPid: '1-1000000001',
      category: 'Ragging',
      subCategory: 'Discipline',
      narrative: 'Disciplinary hearing incident',
      narrativeHash: 'hash_u17_001',
      status: 'SUBMITTED',
      owningBureau: 'PGRC',
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'supervisor1', password: DEMO_PASSWORD })
      .expect(200);

    // 1. Override without reason is rejected
    const noReasonRes = await agent
      .post(`/api/v1/routing/${caseDoc._id}/override`)
      .send({ targetBureau: 'RB', reason: '' })
      .expect(400);
    expect(noReasonRes.body.error).toMatch(/reason is required/i);

    // 2. Override with recorded reason succeeds and updates case owningBureau
    const successRes = await agent
      .post(`/api/v1/routing/${caseDoc._id}/override`)
      .send({
        targetBureau: 'RB',
        reason: 'Statutory regulatory violation takes precedence over discipline',
      })
      .expect(200);

    expect(successRes.body.success).toBe(true);
    expect(successRes.body.targetBureau).toBe('RB');

    const updated = await Case.findById(caseDoc._id);
    expect(updated.owningBureau).toBe('RB');
    expect(updated.routingHistory.length).toBeGreaterThanOrEqual(1);
    expect(updated.routingHistory[updated.routingHistory.length - 1].reason).toMatch(/Statutory regulatory violation/);
  });

  it('[F48] registry unavailable causes routing to flag manual review UNKNOWN', async () => {
    // Simulate registry offline toggle
    RegistrySimulator.setOnlineStatus(false);

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000048',
      reporterId: 'reporter_f48',
      institutionPid: '1-9999999999',
      category: 'Ragging',
      subCategory: 'Hostel',
      narrative: 'Ragging incident reported while registry is offline',
      narrativeHash: 'hash_f48_001',
      status: 'SUBMITTED',
      synthetic: true,
    });

    // When registry is down, inst has status UNKNOWN
    const offlineInst = {
      pid: '1-9999999999',
      status: 'UNKNOWN',
      name: 'UNKNOWN',
    };

    const res = await routeCaseOnSubmission(caseDoc._id, offlineInst);
    expect(res.decision.reasons).toEqual(
      expect.arrayContaining([expect.stringMatching(/REGISTRY_OFFLINE_UNKNOWN/i)])
    );
    expect(res.requiresManualReview).toBe(true);

    RegistrySimulator.setOnlineStatus(true);
  });

  it('[F56] registry down produces no zero values in routing', async () => {
    RegistrySimulator.setOnlineStatus(false);

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000056',
      reporterId: 'reporter_f56',
      institutionPid: '1-8888888888',
      category: 'Approval Process',
      subCategory: 'Affiliation',
      narrative: 'Affiliation dispute during registry outage',
      narrativeHash: 'hash_f56_001',
      status: 'SUBMITTED',
      synthetic: true,
    });

    const offlineInst = {
      pid: '1-8888888888',
      status: 'UNKNOWN',
      name: 'UNKNOWN',
    };

    const res = await routeCaseOnSubmission(caseDoc._id, offlineInst);
    // Confidence score must never default to 0 or null; produces explainable fallback
    expect(res.decision.confidence).toBeGreaterThan(0);
    expect(res.decision.primaryBureau).toBeDefined();
    expect(res.decision.primaryBureau).not.toBeNull();

    RegistrySimulator.setOnlineStatus(true);
  });
});
