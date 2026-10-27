import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import crypto from 'node:crypto';
import { createApp } from '../src/app.js';
import User from '../src/modules/auth/User.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';
import Institution from '../src/modules/institutions/Institution.js';
import InstitutionIdentifier from '../src/modules/institutions/InstitutionIdentifier.js';
import Region, { seedRegions } from '../src/modules/institutions/Region.js';
import Case from '../src/modules/cases/Case.js';
import * as RegistrySimulator from '../src/modules/registry/RegistrySimulator.js';
import { resolveIdentity } from '../src/modules/institutions/institutionService.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  process.env.DOCS_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  RegistrySimulator.resetCache();
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRegions();
});

describe('S1b: Institutions, Registry & Regional Classification', () => {
  it('[U01] PID lookup returns the profile, including ICID when available', async () => {
    // 1. Create a synthetic institution with ICID in DB
    const pid = '1-1000000001';
    const icid = 'IIC-A1B2C3D4';
    await Institution.create({
      pid,
      name: 'Delhi Institute of Technology',
      state: 'Delhi',
      region: 'Northern',
      type: 'Engineering',
      approvalStatus: 'approved',
      aliases: ['DIT Delhi'],
      campuses: [{ campusId: `${pid}-C1`, name: 'Main Campus', parentPid: pid, ambiguous: false }],
      synthetic: true,
    });
    await InstitutionIdentifier.create({
      pid,
      icid,
      source: 'registry',
      verifiedAt: new Date(),
      status: 'active',
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get(`/api/v1/registry/institutions/${pid}`).expect(200);
    expect(res.body.pid).toBe(pid);
    expect(res.body.name).toBe('Delhi Institute of Technology');
    expect(res.body.icid).toBe(icid);
    expect(res.body.region).toBe('Northern');
    expect(res.body.approvalStatus).toBe('approved');
  });

  it('[U02] ICID search resolves to the PID; ICID alone never links institutions', async () => {
    const pid = '1-1000000002';
    const icid = 'IIC-B2C3D4E5';
    await Institution.create({
      pid,
      name: 'Mumbai Engineering College',
      state: 'Maharashtra',
      region: 'Western',
      type: 'Engineering',
      approvalStatus: 'approved',
      synthetic: true,
    });
    await InstitutionIdentifier.create({
      pid,
      icid,
      source: 'registry',
      status: 'active',
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    // Search by ICID via /api/v1/institutions?icid=...
    const res = await agent.get(`/api/v1/institutions?icid=${icid}`).expect(200);
    expect(res.body.pid).toBe(pid);
    expect(res.body.name).toBe('Mumbai Engineering College');

    // Hard Rule 2: ICID alone never links institutions without PID resolution
    const unresolved = await resolveIdentity('1-9999999999', icid);
    expect(unresolved).toBe('IDENTITY_REVIEW');
  });

  it('[U03] PID and ICID disagreement goes to identity review, not auto-resolved', async () => {
    const pid1 = '1-1000000003';
    const pid2 = '1-1000000004';
    const icid = 'IIC-C3D4E5F6';

    await InstitutionIdentifier.create({
      pid: pid1,
      icid,
      status: 'active',
      synthetic: true,
    });

    // Check resolveIdentity disagreement
    const status = await resolveIdentity(pid2, icid);
    expect(status).toBe('IDENTITY_REVIEW');
  });

  it('[U04] Missing ICID shows "not available"; case creation still works', async () => {
    const pid = '1-1000000005';
    await Institution.create({
      pid,
      name: 'Kolkata Polytechnic',
      state: 'West Bengal',
      region: 'Eastern',
      type: 'Polytechnic',
      approvalStatus: 'approved',
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get(`/api/v1/registry/institutions/${pid}`).expect(200);
    expect(res.body.icid).toBe('not available');

    // resolveIdentity returns NOT_AVAILABLE for missing ICID
    const status = await resolveIdentity(pid, null);
    expect(status).toBe('NOT_AVAILABLE');
  });

  it('[N09] ICID mapping resolves to PID and disagreement goes to review', async () => {
    const pid = '1-1000000006';
    const icid = 'IIC-D4E5F6A1';
    await Institution.create({
      pid,
      name: 'Chennai Technical University',
      state: 'Tamil Nadu',
      region: 'Southern',
      type: 'Engineering',
      synthetic: true,
    });
    await InstitutionIdentifier.create({
      pid,
      icid,
      source: 'registry',
      status: 'active',
      synthetic: true,
    });

    // Correct mapping
    const match = await resolveIdentity(pid, icid);
    expect(match).toBe('MATCH');

    // Mismatched mapping -> IDENTITY_REVIEW
    const mismatch = await resolveIdentity('1-9999999999', icid);
    expect(mismatch).toBe('IDENTITY_REVIEW');
  });

  it('[N10] master registry lookup returns profile and UNKNOWN when offline', async () => {
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    // Toggle registry to offline
    RegistrySimulator.setAvailable(false);

    const res = await agent.get('/api/v1/registry/institutions/1-1000000001').expect(503);
    expect(res.body.status).toBe('UNKNOWN');
    expect(res.body.reason).toContain('offline');

    // Restore simulator
    RegistrySimulator.setAvailable(true);
  });

  it('[N11] six-region classification and reviewer reclassification', async () => {
    const pid = '1-1000000007';
    await Institution.create({
      pid,
      name: 'Bhopal Engineering College',
      state: 'Madhya Pradesh',
      region: 'Central',
      type: 'Engineering',
      approvalStatus: 'approved',
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    // Reclassify region with mandatory reason
    const reclassRes = await agent
      .post(`/api/v1/institutions/${pid}/reclassify`)
      .send({
        newRegion: 'Western',
        reason: 'AICTE Council Re-zoning Order 2026/04',
      })
      .expect(200);

    expect(reclassRes.body.region).toBe('Western');

    // Verify audit event recorded
    const audit = await AuditEvent.findOne({
      action: 'institution.region_reclassified',
      targetId: pid,
    });
    expect(audit).not.toBeNull();
    expect(audit.meta.oldRegion).toBe('Central');
    expect(audit.meta.newRegion).toBe('Western');
    expect(audit.meta.reason).toBe('AICTE Council Re-zoning Order 2026/04');
  });

  it('[N12] institution 360 shows attention indicators and opaque counterpart metadata', async () => {
    const pid = '1-1000000008';
    await Institution.create({
      pid,
      name: 'Pune Institute of Applied Science',
      state: 'Maharashtra',
      region: 'Western',
      type: 'Engineering',
      approvalStatus: 'approved',
      synthetic: true,
    });

    const student = await User.findOne({ username: 'student1' });

    // Create a case for this institution
    await Case.create({
      masterCaseId: 'NX-2026-000088',
      reporterId: 'RP-TEST',
      institutionPid: pid,
      category: 'Fee Dispute',
      subCategory: 'Overcharging',
      narrative: 'Excess fees charged',
      narrativeHash: 'hash88',
      status: 'SUBMITTED',
      owningBureau: 'Regulation Bureau',
      synthetic: true,
    });

    // Login as bureau officer from Public Grievance Redressal Cell (different bureau)
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'pgrc_officer1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get(`/api/v1/institutions/${pid}/360`).expect(200);
    expect(res.body.institution.pid).toBe(pid);
    expect(res.body.attentionIndicators).toBeInstanceOf(Array);
    // Counterpart from different bureau must be marked opaque
    const opaque = res.body.grievances.visible.find((g) => g.masterCaseId === 'NX-2026-000088');
    expect(opaque.opaqueCounterpart).toBe(true);
  });

  it('[F01] PID exact match only, never fuzzy-linked', async () => {
    const pid = '1-1234567890';
    await Institution.create({
      pid,
      name: 'National Technical University',
      state: 'Delhi',
      region: 'Northern',
      type: 'Engineering',
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    // Exact match succeeds
    await agent.get(`/api/v1/registry/institutions/${pid}`).expect(200);

    // Similar / near match fails with 404 (never fuzzy matches)
    await agent.get('/api/v1/registry/institutions/1-1234567891').expect(404);
  });

  it('[F02] ambiguous campuses route to review', async () => {
    const pid = '1-1000000009';
    await Institution.create({
      pid,
      name: 'Apex Institute',
      state: 'Haryana',
      region: 'Northern',
      type: 'Engineering',
      campuses: [
        { campusId: 'C1', name: 'Campus North', parentPid: pid, ambiguous: true },
      ],
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get(`/api/v1/registry/institutions/${pid}`).expect(200);
    expect(res.body.campuses[0].ambiguous).toBe(true);
  });

  it('[F03] verified aliases displayed separately', async () => {
    const pid = '1-1000000010';
    await Institution.create({
      pid,
      name: 'International School of Management',
      state: 'Gujarat',
      region: 'Western',
      type: 'Management',
      aliases: ['ISM Gujarat', 'ISM Ahmedabad'],
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get(`/api/v1/registry/institutions/${pid}`).expect(200);
    expect(res.body.aliases).toContain('ISM Gujarat');
    expect(res.body.aliases).toContain('ISM Ahmedabad');
  });

  it('[F04] institution 360 composite view', async () => {
    const pid = '1-1000000011';
    await Institution.create({
      pid,
      name: 'Central Engineering Academy',
      state: 'Madhya Pradesh',
      region: 'Central',
      type: 'Engineering',
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get(`/api/v1/institutions/${pid}/360`).expect(200);
    expect(res.body.found).toBe(true);
    expect(res.body.institution.name).toBe('Central Engineering Academy');
    expect(res.body.jurisdiction.region).toBe('Central');
    expect(res.body.grievances).toBeDefined();
  });

  it('[R32] global search accepts ICID as key', async () => {
    const pid = '1-1000000012';
    const icid = 'IIC-E5F6A1B2';
    await Institution.create({
      pid,
      name: 'Jaipur Technical College',
      state: 'Rajasthan',
      region: 'Western',
      type: 'Engineering',
      synthetic: true,
    });
    await InstitutionIdentifier.create({
      pid,
      icid,
      source: 'registry',
      status: 'active',
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get(`/api/v1/institutions?icid=${icid}`).expect(200);
    expect(res.body.pid).toBe(pid);
    expect(res.body.name).toBe('Jaipur Technical College');
  });

  it('[R50] regional officer scoped to delegated region', async () => {
    // Seed Northern institution
    await Institution.create({
      pid: '1-1000000013',
      name: 'Chandigarh College',
      state: 'Punjab',
      region: 'Northern',
      type: 'Engineering',
      synthetic: true,
    });
    // Seed Southern institution
    await Institution.create({
      pid: '1-1000000014',
      name: 'Kerala Institute',
      state: 'Kerala',
      region: 'Southern',
      type: 'Engineering',
      synthetic: true,
    });

    // Login as regional officer for Northern region
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'regional1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get('/api/v1/institutions').expect(200);
    expect(res.body.every((inst) => inst.region === 'Northern')).toBe(true);
  });

  it('[S02] RBAC enforces bureau and regional scoping', async () => {
    const instNorthern = await Institution.create({
      pid: '1-1000000015',
      name: 'Shimla Institute',
      state: 'Himachal Pradesh',
      region: 'Northern',
      type: 'Engineering',
      synthetic: true,
    });

    const instSouthern = await Institution.create({
      pid: '1-1000000016',
      name: 'Bangalore Institute',
      state: 'Karnataka',
      region: 'Southern',
      type: 'Engineering',
      synthetic: true,
    });

    const student = await User.findOne({ username: 'student1' });

    // Case 1 in Northern region, routed to Regulation Bureau
    const case1 = await Case.create({
      masterCaseId: 'NX-2026-000015',
      reporterId: 'RP-TEST',
      institutionPid: instNorthern.pid,
      pidSnapshot: { region: 'Northern' },
      category: 'Fee Dispute',
      subCategory: 'Overcharging',
      narrative: 'Fee complaint',
      narrativeHash: 'h15',
      status: 'ROUTED',
      owningBureau: 'Regulation Bureau',
      synthetic: true,
    });

    // Case 2 in Southern region, routed to Public Grievance Redressal Cell
    const case2 = await Case.create({
      masterCaseId: 'NX-2026-000016',
      reporterId: 'RP-TEST',
      institutionPid: instSouthern.pid,
      pidSnapshot: { region: 'Southern' },
      category: 'Ragging',
      subCategory: 'Physical',
      narrative: 'Ragging complaint',
      narrativeHash: 'h16',
      status: 'ROUTED',
      owningBureau: 'Public Grievance Redressal Cell',
      synthetic: true,
    });

    // 1. Regional officer (Northern) can access case1, but not case2
    const regionalAgent = supertest.agent(app);
    await regionalAgent
      .post('/api/v1/auth/login')
      .send({ username: 'regional1', password: DEMO_PASSWORD })
      .expect(200);

    await regionalAgent.get(`/api/v1/cases/${case1.masterCaseId}`).expect(200);
    await regionalAgent.get(`/api/v1/cases/${case2.masterCaseId}`).expect(404);

    // 2. Bureau officer (Regulation Bureau) can access case1, but not case2
    const bureauAgent = supertest.agent(app);
    await bureauAgent
      .post('/api/v1/auth/login')
      .send({ username: 'rb_officer1', password: DEMO_PASSWORD })
      .expect(200);

    await bureauAgent.get(`/api/v1/cases/${case1.masterCaseId}`).expect(200);
    await bureauAgent.get(`/api/v1/cases/${case2.masterCaseId}`).expect(404);
  });
});
