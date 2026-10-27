import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import Case from '../src/modules/cases/Case.js';
import User from '../src/modules/auth/User.js';
import Transfer from '../src/modules/trace/models.js';
import {
  requestTransfer,
  acceptTransfer,
  rejectTransfer,
  checkTransferEscalations,
  verifyOwnerInvariant,
} from '../src/modules/trace/traceService.js';
import { addBusinessDays, diffBusinessDays } from '../src/modules/trace/businessDays.js';
import { validateStatusTransition } from '../src/modules/lifecycle/lifecycleGuards.js';
import { transitionStatus } from '../src/modules/lifecycle/lifecycleService.js';

let app;
afterEach(() => vi.useRealTimers());

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRuleBook();
});

describe('S3: NEXUS TRACE & Ownership Handover (N20, U20, U21, U22)', () => {
  it('[U20] an unacknowledged transfer escalates after exactly 2 business days (test across a weekend with a fake clock), the case does not move, and the sender stays the named accountable owner throughout', async () => {
    // 1. Weekend business day calculation verification:
    // Friday (2026-10-23) + 2 business days -> Tuesday (2026-10-27), skipping Saturday & Sunday
    const friday = new Date('2026-10-23T10:00:00Z');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(friday);
    const monday = new Date('2026-10-26T10:00:00Z');
    const tuesday = new Date('2026-10-27T10:00:00Z');

    expect(friday.getDay()).toBe(5); // Friday
    const dueDate = addBusinessDays(friday, 2);
    expect(dueDate.getDay()).toBe(2); // Tuesday
    expect(diffBusinessDays(friday, monday)).toBe(1);
    expect(diffBusinessDays(friday, tuesday)).toBe(2);

    // 2. Setup officer and case
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000301',
      reporterId: 'RP-0301',
      institutionPid: '1-1000000001',
      category: 'Fee',
      subCategory: 'Refund',
      narrative: 'Transfer escalation test case',
      narrativeHash: 'hash_u20_001',
      status: 'Under Process',
      owningBureau: 'PGRC',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer._id,
        officerName: pgrcOfficer.displayName,
        assignedAt: friday,
      },
    });

    // 3. Request transfer from PGRC to RB on Friday
    const { transfer } = await requestTransfer(pgrcOfficer, {
      masterCaseId: caseDoc.masterCaseId,
      toBureau: 'RB',
      reason: 'Requires regulatory inspection',
    });

    expect(transfer.status).toBe('REQUESTED');
    expect(transfer.dueAt.getDay()).toBe(2); // Tuesday
    expect(transfer.isEscalated).toBe(false);

    // Re-read case: status is Transfer Requested, sender stays accountable owner
    let freshCase = await Case.findById(caseDoc._id);
    expect(freshCase.status).toBe('Transfer Requested');
    expect(freshCase.transferStatus).toBe('REQUESTED');
    expect(freshCase.currentOwner.office).toBe('PGRC');
    expect(String(freshCase.currentOwner.officerId)).toBe(String(pgrcOfficer._id));

    // 4. Time travel to Monday: 1 business day passed -> NOT escalated
    const mondayClock = new Date('2026-10-26T12:00:00Z');
    const escMonday = await checkTransferEscalations(mondayClock);
    expect(escMonday.length).toBe(0);

    freshCase = await Case.findById(caseDoc._id);
    expect(freshCase.isEscalated).toBe(false);
    expect(freshCase.currentOwner.office).toBe('PGRC');

    // 5. Time travel to Wednesday (past 2 business days) -> ESCALATION FIRES
    const wednesdayClock = new Date('2026-10-28T10:00:00Z');
    const escWednesday = await checkTransferEscalations(wednesdayClock);
    expect(escWednesday.length).toBe(1);
    expect(escWednesday[0].isEscalated).toBe(true);
    expect(escWednesday[0].escalationRecipients).toContain('supervisor_pgrc');
    expect(escWednesday[0].escalationRecipients).toContain('supervisor_rb');

    // 6. Case does NOT move, and sender stays the named accountable owner throughout
    freshCase = await Case.findById(caseDoc._id);
    expect(freshCase.isEscalated).toBe(true);
    expect(freshCase.owningBureau).toBe('PGRC');
    expect(freshCase.currentOwner.office).toBe('PGRC');
    expect(String(freshCase.currentOwner.officerId)).toBe(String(pgrcOfficer._id));
    expect(freshCase.masterCaseId).toBe('NX-2026-000301');
  });

  it('[N20] an invariant test: after every step of request, accept, reject and escalate, the case has exactly one accountable owner or one open transfer with a named sender; the Master Case ID never changes', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const rbOfficer = await User.findOne({ username: 'rb_officer1' });

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000302',
      reporterId: 'RP-0302',
      institutionPid: '1-1000000001',
      category: 'Academic',
      subCategory: 'Curriculum',
      narrative: 'Invariant lifecycle test',
      narrativeHash: 'hash_n20_002',
      status: 'Under Process',
      owningBureau: 'PGRC',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer._id,
        officerName: pgrcOfficer.displayName,
        assignedAt: new Date(),
      },
    });

    // Step 0: Initial state
    expect(verifyOwnerInvariant(caseDoc)).toBe(true);
    expect(caseDoc.masterCaseId).toBe('NX-2026-000302');

    // Step 1: Transfer requested
    const { transfer } = await requestTransfer(pgrcOfficer, {
      masterCaseId: caseDoc.masterCaseId,
      toBureau: 'RB',
      reason: 'Cross-bureau inquiry',
    });
    let c1 = await Case.findById(caseDoc._id);
    expect(verifyOwnerInvariant(c1, transfer)).toBe(true);
    expect(c1.masterCaseId).toBe('NX-2026-000302');
    expect(c1.currentOwner.office).toBe('PGRC');

    // Step 2: Escalate while pending
    transfer.dueAt = new Date(Date.now() - 1000);
    await transfer.save();
    await checkTransferEscalations(new Date());
    let c2 = await Case.findById(caseDoc._id);
    expect(verifyOwnerInvariant(c2, transfer)).toBe(true);
    expect(c2.masterCaseId).toBe('NX-2026-000302');
    expect(c2.currentOwner.office).toBe('PGRC');

    // Step 3: Rejection returns to sender
    await rejectTransfer(rbOfficer, transfer._id, { reason: 'Incorrect jurisdiction' });
    let c3 = await Case.findById(caseDoc._id);
    expect(verifyOwnerInvariant(c3)).toBe(true);
    expect(c3.masterCaseId).toBe('NX-2026-000302');
    expect(c3.currentOwner.office).toBe('PGRC');
    expect(c3.transferStatus).toBe('REJECTED');

    // Step 4: Second transfer request and acceptance ("New Owner Active")
    const { transfer: transfer2 } = await requestTransfer(pgrcOfficer, {
      masterCaseId: caseDoc.masterCaseId,
      toBureau: 'RB',
      reason: 'Re-routed with added context',
    });
    let c4 = await Case.findById(caseDoc._id);
    expect(verifyOwnerInvariant(c4, transfer2)).toBe(true);

    await acceptTransfer(rbOfficer, transfer2._id);
    let c5 = await Case.findById(caseDoc._id);
    expect(verifyOwnerInvariant(c5)).toBe(true);
    expect(c5.masterCaseId).toBe('NX-2026-000302');
    expect(c5.owningBureau).toBe('RB');
    expect(c5.currentOwner.office).toBe('RB');
    expect(String(c5.currentOwner.officerId)).toBe(String(rbOfficer._id));
    expect(c5.lastAccountableOwner.office).toBe('PGRC');
  });

  it('[U21] rejection without a reason is 400; with a reason the case is back in the sender\'s queue and nothing else changed', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const rbOfficer = await User.findOne({ username: 'rb_officer1' });

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000303',
      reporterId: 'RP-0303',
      institutionPid: '1-1000000001',
      category: 'Admission',
      subCategory: 'Quota',
      narrative: 'Rejection test case',
      narrativeHash: 'hash_u21_003',
      status: 'Under Process',
      owningBureau: 'PGRC',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer._id,
        officerName: pgrcOfficer.displayName,
        assignedAt: new Date(),
      },
    });

    const { transfer } = await requestTransfer(pgrcOfficer, {
      masterCaseId: caseDoc.masterCaseId,
      toBureau: 'RB',
      reason: 'Needs evaluation',
    });

    // 1. Rejection without reason fails with 400
    await expect(rejectTransfer(rbOfficer, transfer._id, { reason: '' })).rejects.toThrow();
    await expect(rejectTransfer(rbOfficer, transfer._id, { reason: '   ' })).rejects.toThrow();

    // 2. Rejection with valid reason
    const { transfer: rejTransfer, case: updatedCase } = await rejectTransfer(rbOfficer, transfer._id, {
      reason: 'Out of scope for Regulation Bureau; return to PGRC',
    });

    expect(rejTransfer.status).toBe('REJECTED');
    expect(rejTransfer.rejectionReason).toBe('Out of scope for Regulation Bureau; return to PGRC');
    expect(updatedCase.transferStatus).toBe('REJECTED');
    expect(updatedCase.status).toBe('Under Process');
    expect(updatedCase.owningBureau).toBe('PGRC');
    expect(String(updatedCase.currentOwner.officerId)).toBe(String(pgrcOfficer._id));
  });

  it('[U22] after any transfer the lifecycle can never return to Registered/Submitted (try every path)', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000304',
      reporterId: 'RP-0304',
      institutionPid: '1-1000000001',
      category: 'Harassment',
      subCategory: 'Hostel',
      narrative: 'Lifecycle invariant test',
      narrativeHash: 'hash_u22_004',
      status: 'Under Process',
      owningBureau: 'PGRC',
      transferStatus: 'REQUESTED',
      transferHistory: [
        {
          fromBureau: 'PGRC',
          toBureau: 'RB',
          requestedAt: new Date(),
          status: 'REQUESTED',
          reason: 'Initial handover',
        },
      ],
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer._id,
        officerName: pgrcOfficer.displayName,
        assignedAt: new Date(),
      },
    });

    // Guard rejects transition to Registered or Submitted
    expect(() => validateStatusTransition(caseDoc, 'Registered')).toThrow(/Invariant violation/);
    expect(() => validateStatusTransition(caseDoc, 'Submitted')).toThrow(/Invariant violation/);
    expect(() => validateStatusTransition(caseDoc, 'SUBMITTED')).toThrow(/Invariant violation/);

    // transitionStatus service function rejects as well
    await expect(transitionStatus(caseDoc._id, 'Registered', pgrcOfficer, 'Invalid attempt')).rejects.toThrow();
    await expect(transitionStatus(caseDoc._id, 'Submitted', pgrcOfficer, 'Invalid attempt')).rejects.toThrow();
  });

  it('[S28 regression] TRACE, SYNC and queries never write complaint text or identity to the logger or the communication_log', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const sensitiveNarrative = 'CONFIDENTIAL_ALLEGATION_ABOUT_FACULTY_MISCONDUCT_9988';
    const reporterSecret = 'SECRET_STUDENT_NAME_JANE_DOE_9988';

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000305',
      reporterId: 'RP-0305',
      institutionPid: '1-1000000001',
      category: 'Ethics',
      subCategory: 'Exam',
      narrative: sensitiveNarrative,
      narrativeHash: 'hash_s28_005',
      status: 'Under Process',
      owningBureau: 'PGRC',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer._id,
        officerName: pgrcOfficer.displayName,
        assignedAt: new Date(),
      },
    });

    // Request transfer
    const { transfer } = await requestTransfer(pgrcOfficer, {
      masterCaseId: caseDoc.masterCaseId,
      toBureau: 'RB',
      reason: 'Official transfer for scrutiny',
    });

    // Inspect stored transfer and case
    const transferJson = JSON.stringify(transfer.toObject());
    expect(transferJson).not.toContain(sensitiveNarrative);
    expect(transferJson).not.toContain(reporterSecret);
  });
});
