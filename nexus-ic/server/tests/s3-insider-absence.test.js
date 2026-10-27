import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import Case from '../src/modules/cases/Case.js';
import User from '../src/modules/auth/User.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { checkInsiderActivity, listInsiderAlerts } from '../src/modules/insider/insiderService.js';
import { checkAbsenceBlockers, requestLeave, returnFromLeave } from '../src/modules/absence/absenceService.js';
import { requestTransfer, acceptTransfer } from '../src/modules/trace/traceService.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRuleBook();
});

describe('S3: Insider Alerts & Absence-Aware Ownership (A-N54, A-N60)', () => {
  it('[A-N54] repeated reveal requests and bulk case opening raise a supervisor alert with the rule ID and counts, and never block the officer', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const supervisor = await User.findOne({ username: 'supervisor1' });
    const now = new Date();

    // 1. Simulate 3 repeated reveal requests (reading S1a identity.reveal.* audit events)
    for (let i = 1; i <= 3; i++) {
      await AuditEvent.create({
        seq: 5000 + i,
        actorId: String(pgrcOfficer._id),
        actorRole: pgrcOfficer.role,
        action: 'identity.reveal.requested',
        targetType: 'Vault',
        targetId: `vault_target_${i}`,
        meta: { purpose: 'Legal inquiry' },
        prevHash: `hash_prev_${i}`,
        hash: `hash_curr_${i}`,
        at: new Date(now.getTime() - i * 60000),
      });
    }

    // 2. Simulate bulk case opening (11 cases accessed in 30 minutes)
    for (let i = 1; i <= 11; i++) {
      await AuditEvent.create({
        seq: 6000 + i,
        actorId: String(pgrcOfficer._id),
        actorRole: pgrcOfficer.role,
        action: 'case.accessed',
        targetType: 'Case',
        targetId: `NX-2026-0099${i}`,
        meta: {},
        prevHash: `hash_prev_bulk_${i}`,
        hash: `hash_curr_bulk_${i}`,
        at: new Date(now.getTime() - i * 60000),
      });
    }

    // Trigger insider scan
    const alerts = await checkInsiderActivity(pgrcOfficer._id, now);
    expect(alerts.length).toBeGreaterThanOrEqual(2);

    const revealAlert = alerts.find((a) => a.alertType === 'REPEATED_REVEAL_REQUESTS');
    expect(revealAlert).toBeDefined();
    expect(revealAlert.ruleVersion).toBe('DEMO-INSIDER-v1');
    expect(revealAlert.count).toBe(3);
    expect(revealAlert.threshold).toBe(3);

    const bulkAlert = alerts.find((a) => a.alertType === 'BULK_CASE_ACCESS');
    expect(bulkAlert).toBeDefined();
    expect(bulkAlert.ruleVersion).toBe('DEMO-INSIDER-v1');
    expect(bulkAlert.count).toBe(11);
    expect(bulkAlert.threshold).toBe(10);

    // Invariant check: Officer is NEVER blocked
    // The officer account remains active and functional
    const freshOfficer = await User.findById(pgrcOfficer._id);
    expect(freshOfficer.active).toBe(true);

    // Supervisor views insider alerts list
    const supervisorAlerts = await listInsiderAlerts(supervisor);
    expect(supervisorAlerts.length).toBeGreaterThanOrEqual(2);
  });

  it('[A-N60] marking leave with an owned open case is refused and lists the case; after a TRACE handover it succeeds', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const rbOfficer = await User.findOne({ username: 'rb_officer1' });

    // Create an open case owned by pgrcOfficer
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000340',
      reporterId: 'RP-0340',
      institutionPid: '1-1000000001',
      category: 'Curriculum',
      subCategory: 'Syllabus',
      narrative: 'Absence blocker test case',
      narrativeHash: 'hash_an60_040',
      status: 'Under Process',
      owningBureau: 'PGRC',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer._id,
        officerName: pgrcOfficer.displayName,
      },
    });

    // 1. Check blockers: officer owns caseDoc -> not eligible
    const blockerCheck = await checkAbsenceBlockers(pgrcOfficer._id);
    expect(blockerCheck.eligible).toBe(false);
    expect(blockerCheck.blockingCases.length).toBe(1);
    expect(blockerCheck.blockingCases[0].masterCaseId).toBe('NX-2026-000340');

    // 2. Requesting leave is refused with 409
    await expect(
      requestLeave(pgrcOfficer, {
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-10'),
        reason: 'Annual medical leave',
      })
    ).rejects.toThrow(/open cases that must first be handed over/);

    // 3. Hand over case ownership through NEXUS TRACE
    const { transfer } = await requestTransfer(pgrcOfficer, {
      masterCaseId: caseDoc.masterCaseId,
      toBureau: 'RB',
      reason: 'Handover prior to leave',
    });

    await acceptTransfer(rbOfficer, transfer._id);

    // 4. After TRACE acceptance: pgrcOfficer no longer owns any open cases
    const postHandoverCheck = await checkAbsenceBlockers(pgrcOfficer._id);
    expect(postHandoverCheck.eligible).toBe(true);
    expect(postHandoverCheck.blockingCases.length).toBe(0);

    // 5. Leave request now succeeds
    const leaveResult = await requestLeave(pgrcOfficer, {
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-10'),
      reason: 'Annual medical leave',
    });

    expect(leaveResult.success).toBe(true);
    const updatedOfficer = await User.findById(pgrcOfficer._id);
    expect(updatedOfficer.isOnLeave).toBe(true);

    // 6. Return from leave
    const returnResult = await returnFromLeave(updatedOfficer);
    expect(returnResult.success).toBe(true);
    const returnedOfficer = await User.findById(pgrcOfficer._id);
    expect(returnedOfficer.isOnLeave).toBe(false);
  });
});
