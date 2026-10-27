import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';
import Case from '../src/modules/cases/Case.js';
import { LIFECYCLE_STATUSES, mapAnalyticStatus } from '../src/modules/lifecycle/lifecycleGuards.js';
import { transitionStatus, formatComplainantView } from '../src/modules/lifecycle/lifecycleService.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
});

describe('S2: Case Lifecycle & Complainant Transparency (N28)', () => {
  it('[N28] nine statuses and F09 mapping; transferred case never reverts', async () => {
    // 1. Verify 9 standard statuses
    expect(LIFECYCLE_STATUSES).toEqual([
      'Registered',
      'Submitted',
      'Assigned',
      'Under Process',
      'Transfer Requested',
      'Transfer Accepted',
      'Under Review',
      'Resolution Proposed',
      'Verified/Approved',
      'Closed',
    ]);

    // 2. F09 analytic mapping checks
    expect(mapAnalyticStatus('Registered')).toBe('PENDING');
    expect(mapAnalyticStatus('Submitted')).toBe('PENDING');
    expect(mapAnalyticStatus('Assigned')).toBe('PENDING');
    expect(mapAnalyticStatus('Under Process')).toBe('IN_PROCESS');
    expect(mapAnalyticStatus('Transfer Requested')).toBe('IN_PROCESS');
    expect(mapAnalyticStatus('Resolution Proposed')).toBe('IN_PROCESS');
    expect(mapAnalyticStatus('Closed')).toBe('DISPOSED');

    // 3. Create a case and simulate lifecycle transitions
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000028',
      reporterId: 'reporter_n28',
      institutionPid: '1-1000000001',
      category: 'Ragging',
      subCategory: 'Hostel',
      narrative: 'Freshers subjected to ragging in common room',
      narrativeHash: 'hash_n28_001',
      status: 'SUBMITTED',
      owningBureau: 'PGRC',
      synthetic: true,
    });

    const userOfficer = { _id: '507f191e810c19729de860ea', role: 'bureau_officer' };

    // Transition to Assigned
    await transitionStatus(caseDoc._id, 'Assigned', userOfficer, 'Assigned to PGRC officer');
    let updated = await Case.findById(caseDoc._id);
    expect(updated.status).toBe('Assigned');
    expect(updated.analyticStatus).toBe('PENDING');

    // Transition to Under Process
    await transitionStatus(caseDoc._id, 'Under Process', userOfficer, 'Investigation commenced');
    updated = await Case.findById(caseDoc._id);
    expect(updated.status).toBe('Under Process');
    expect(updated.analyticStatus).toBe('IN_PROCESS');

    // Simulate transfer acceptance
    updated.transferStatus = 'ACCEPTED';
    updated.transferHistory = [{ fromBureau: 'PGRC', toBureau: 'RO', status: 'ACCEPTED', requestedAt: new Date(), acknowledgedAt: new Date() }];
    await updated.save();

    // Invariant check: Transferred case must NEVER revert to Registered or Submitted
    await expect(
      transitionStatus(caseDoc._id, 'Submitted', userOfficer, 'Illegal rollback')
    ).rejects.toThrow(/transferred case can never revert to 'Submitted'/i);

    await expect(
      transitionStatus(caseDoc._id, 'Registered', userOfficer, 'Illegal rollback')
    ).rejects.toThrow(/transferred case can never revert to 'Registered'/i);

    // Complainant view formatting: Shows transparent status and role/office only
    const complainantView = formatComplainantView(updated);
    expect(complainantView.masterCaseId).toBe('NX-2026-000028');
    expect(complainantView.accountableOwner.office).toBeDefined();
    expect(complainantView.accountableOwner.role).toBeDefined();
    // Complainant view never exposes internal raw reporter identity
    expect(complainantView.reporterId).toBeUndefined();
  });
});
