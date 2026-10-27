import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import RuleBookVersion from '../src/modules/rulebook/models.js';
import Case from '../src/modules/cases/Case.js';
import { getActiveRule } from '../src/modules/rulebook/index.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRuleBook();
});

describe('S2: NEXUS RULEBOOK (N27, N78, N65, U29, S20)', () => {
  it('[N27] editing rule creates new version; APP_MODE=production cannot select DEMO-*', async () => {
    // 1. Verify getActiveRule works for seeded DEMO rule in demo mode
    const activeRouteRule = await getActiveRule('JURISDICTION');
    expect(activeRouteRule).toBeDefined();
    expect(activeRouteRule.version).toBe('DEMO-ROUTE-v1');
    expect(activeRouteRule.status).toBe('approved');

    // 2. In production mode, DEMO-* versions are blocked from being returned as active policy
    process.env.APP_MODE = 'production';
    const prodRule = await getActiveRule('JURISDICTION');
    expect(prodRule.result).toBe('POLICY_NOT_CONFIGURED');
    process.env.APP_MODE = 'demo';

    // 3. Immutability guard: Attempting to mutate an approved version throws error
    const approved = await RuleBookVersion.findOne({ version: 'DEMO-ROUTE-v1' });
    approved.reason = 'illegal in-place modification';
    await expect(approved.save()).rejects.toThrow(/Cannot modify approved RuleBookVersion/);
  });

  it('[N78] overlap detection and closure requirements families loaded', async () => {
    // Check OVERLAP_DETECTION family seeded
    const overlapRule = await getActiveRule('OVERLAP_DETECTION');
    expect(overlapRule).toBeDefined();
    expect(overlapRule.version).toBe('DEMO-OVERLAP-v1');
    expect(overlapRule.body.overlapThreshold).toBe(55);
    expect(overlapRule.body.gramSize).toBe(3);

    // Check CLOSURE_REQUIREMENTS family seeded
    const closureRule = await getActiveRule('CLOSURE_REQUIREMENTS');
    expect(closureRule).toBeDefined();
    expect(closureRule.version).toBe('DEMO-CLOSURE-v1');
    expect(closureRule.body.requireEvidence).toBe(true);
    expect(closureRule.body.approverDiffersFromProposer).toBe(true);

    // GET /api/v1/rulebook/families via supertest
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get('/api/v1/rulebook/families').expect(200);
    expect(res.body.families).toContain('OVERLAP_DETECTION');
    expect(res.body.families).toContain('CLOSURE_REQUIREMENTS');
    expect(res.body.families).toContain('JURISDICTION');
    expect(res.body.families).toContain('SLA');
  });

  it('[A-N65] what-if preview lists affected open cases and changes nothing', async () => {
    // 1. Create open test cases
    const openCase1 = await Case.create({
      masterCaseId: 'NX-2026-000001',
      reporterId: 'reporter_n65',
      institutionPid: '1-1000000001',
      category: 'Ragging',
      subCategory: 'Hostel',
      narrative: 'Severe ragging in hostel block A',
      narrativeHash: 'hash_n65_001',
      status: 'SUBMITTED',
      owningBureau: 'PGRC',
      synthetic: true,
    });

    const openCase2 = await Case.create({
      masterCaseId: 'NX-2026-000002',
      reporterId: 'reporter_n65',
      institutionPid: '1-1000000001',
      category: 'Faculty Grievance',
      subCategory: 'Salary',
      narrative: 'Salary withheld without notice',
      narrativeHash: 'hash_n65_002',
      status: 'SUBMITTED',
      owningBureau: 'PGRC',
      synthetic: true,
    });

    // 2. Create a draft rulebook version modifying bureau mapping
    const draft = await RuleBookVersion.create({
      family: 'JURISDICTION',
      version: 'DRAFT-ROUTE-V2',
      status: 'draft',
      body: {
        confidenceThreshold: 0.8,
        bureauMapping: {
          'Ragging': { primary: 'RB', secondary: 'PGRC' }, // Modified from PGRC to RB
        },
      },
      effectiveFrom: new Date(),
      requestedBy: new mongoose.Types.ObjectId(),
      reason: 'Reorganizing ragging jurisdiction to RB',
      dryRunPassed: true,
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    // 3. Run What-If Preview
    const res = await agent.get(`/api/v1/rulebook/versions/${draft._id}/preview`).expect(200);
    expect(res.body.simulation).toBe(true);
    expect(res.body.totalOpenCases).toBeGreaterThanOrEqual(2);
    expect(res.body.affectedCasesCount).toBeGreaterThanOrEqual(1);

    const affected = res.body.affectedCases.find((c) => c.masterCaseId === 'NX-2026-000001');
    expect(affected).toBeDefined();
    expect(affected.currentOutcome).toBe('PGRC');
    expect(affected.simulatedOutcome).toBe('RB');

    // 4. Verify ZERO modifications were persisted to open cases in the DB
    const checkCase1 = await Case.findById(openCase1._id);
    expect(checkCase1.owningBureau).toBe('PGRC');
    expect(checkCase1.status).toBe('SUBMITTED');
  });

  it('[U29] rulebook edit creates version with dry-run and two-step approval', async () => {
    const agentRequester = supertest.agent(app);
    await agentRequester
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    // 1. Create a draft version
    const createRes = await agentRequester
      .post('/api/v1/rulebook/versions')
      .send({
        family: 'ROUTING',
        version: 'DEMO-ROUTE-CUSTOM-v2',
        body: {
          confidenceThreshold: 0.75,
          bureauMapping: {
            'Ragging': { primary: 'PGRC', secondary: 'RO' },
          },
        },
        effectiveFrom: new Date().toISOString(),
        reason: 'Adjust confidence threshold',
        synthetic: true,
      })
      .expect(201);

    const draftId = createRes.body._id;
    expect(createRes.body.status).toBe('draft');
    expect(createRes.body.dryRunPassed).toBe(false);

    // 2. Approving before dry-run is rejected
    const agentApprover = supertest.agent(app);
    await agentApprover
      .post('/api/v1/auth/login')
      .send({ username: 'supervisor1', password: DEMO_PASSWORD })
      .expect(200);

    const prematureApprove = await agentApprover
      .post(`/api/v1/rulebook/versions/${draftId}/approve`)
      .expect(400);
    expect(prematureApprove.body.error).toMatch(/dry-run/i);

    // 3. Execute dry-run test
    const dryRunRes = await agentRequester
      .post(`/api/v1/rulebook/versions/${draftId}/dry-run`)
      .expect(200);
    expect(dryRunRes.body.passed).toBe(true);
    expect(dryRunRes.body.totalCases).toBe(5);

    // 4. Two-step approval by a DIFFERENT user (supervisor1 approves sysadmin1's draft)
    const approveRes = await agentApprover
      .post(`/api/v1/rulebook/versions/${draftId}/approve`)
      .expect(200);
    expect(approveRes.body.status).toBe('approved');
    expect(approveRes.body.approvedBy).toBeDefined();
  });

  it('[S20] approval of rulebook version by requester rejected with 403', async () => {
    const agentSupervisor = supertest.agent(app);
    await agentSupervisor
      .post('/api/v1/auth/login')
      .send({ username: 'supervisor1', password: DEMO_PASSWORD })
      .expect(200);

    // 1. Create a draft version as supervisor1
    const createRes = await agentSupervisor
      .post('/api/v1/rulebook/versions')
      .send({
        family: 'SLA',
        version: 'DEMO-SLA-TEST-v2',
        body: { normal: { resolutionDays: 25 } },
        effectiveFrom: new Date().toISOString(),
        reason: 'Accelerate standard SLA',
        synthetic: true,
      })
      .expect(201);

    const draftId = createRes.body._id;

    // Run dry-run
    await agentSupervisor.post(`/api/v1/rulebook/versions/${draftId}/dry-run`).expect(200);

    // 2. Self-approval: Requester tries to approve their own version -> 403 Forbidden
    const selfApproveRes = await agentSupervisor
      .post(`/api/v1/rulebook/versions/${draftId}/approve`)
      .expect(403);
    expect(selfApproveRes.body.error).toMatch(/Requester cannot approve their own rule change request/i);
  });
});
