import { describe, expect, it, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Case from '../src/modules/cases/Case.js';
import Institution from '../src/modules/institutions/Institution.js';
import { recordOfficerAction } from '../src/modules/actions/actionService.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';

beforeEach(async () => {
  await seedDemoAccounts();
  await seedRuleBook();
  await Institution.findOneAndUpdate(
    { pid: '1-7734299101' },
    {
      $set: {
        pid: '1-7734299101',
        name: 'Vidyapeeth Institute of Technology',
        state: 'Maharashtra',
        region: 'Western',
        type: 'Engineering',
        approvalStatus: 'approved',
        synthetic: true,
      }
    },
    { upsert: true, new: true }
  );
  await Case.deleteMany({ masterCaseId: { $in: ['NX-2026-930001', 'NX-2026-930002'] } });
});

describe('[A-N93] realistic, fast status updates and event-grounded stepper', () => {
  it('[A-N93] recording an officer action updates statusHistory and advances stage immediately', async () => {
    // Create a synthetic case
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-930001',
      reporterId: 'RP-9301',
      institutionPid: '1-7734299101',
      category: 'Fee Dispute',
      subCategory: 'Overcharging',
      narrative: 'Synthetic complaint narrative for N93 test verification',
      narrativeHash: 'hash-n93-01',
      status: 'ROUTED',
      owningBureau: 'PGRC',
      synthetic: true,
      statusHistory: [
        {
          status: 'SUBMITTED',
          at: new Date(Date.now() - 3600000),
          by: 'student1',
          office: 'Intake Portal',
          role: 'student',
        },
        {
          status: 'ROUTED',
          at: new Date(Date.now() - 1800000),
          by: 'system',
          office: 'NEXUS ROUTE Engine',
          role: 'system',
        },
      ],
    });

    const officerUser = {
      _id: '507f1f77bcf86cd799439022',
      id: '507f1f77bcf86cd799439022',
      username: 'pgrc_officer1',
      displayName: 'PGRC Officer',
      role: 'bureau_officer',
      bureau: 'Public Grievance Redressal Cell',
    };

    // Record NOTICE action
    const result = await recordOfficerAction(officerUser, {
      caseId: String(caseDoc._id),
      actionType: 'NOTICE',
      subject: 'Formal notice issued to institution regarding tuition fee refund',
      direction: 'ALLOW',
    });

    expect(result.action).toBeDefined();
    expect(result.action.actionType).toBe('NOTICE');

    // Reload caseDoc
    const updatedCase = await Case.findById(caseDoc._id);
    expect(updatedCase.status).toBe('UNDER_INVESTIGATION');
    expect(updatedCase.statusHistory.length).toBe(3);

    const latest = updatedCase.statusHistory[updatedCase.statusHistory.length - 1];
    expect(latest.status).toBe('NOTICE_ISSUED');
    expect(latest.action).toBe('NOTICE');
    expect(latest.office).toBe('Public Grievance Redressal Cell');
    expect(latest.role).toBe('bureau_officer');
    expect(latest.subject).toContain('Formal notice issued');
  });

  it('[A-N93] officer inspection and instruction actions map cleanly to accountable offices and roles', async () => {
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-930002',
      reporterId: 'RP-9302',
      institutionPid: '1-7734299101',
      category: 'Faculty Shortage',
      subCategory: 'Unfilled Positions',
      narrative: 'Faculty shortage test narrative for N93 action mapping',
      narrativeHash: 'hash-n93-02',
      status: 'UNDER_INVESTIGATION',
      owningBureau: 'AB',
      synthetic: true,
      statusHistory: [],
    });

    const regionalOfficer = {
      _id: '507f1f77bcf86cd799439033',
      id: '507f1f77bcf86cd799439033',
      username: 'regional_western',
      displayName: 'Regional Grievance Officer (Western)',
      role: 'regional_officer',
      region: 'Western',
    };

    // Record INSPECTION action
    await recordOfficerAction(regionalOfficer, {
      caseId: String(caseDoc._id),
      actionType: 'INSPECTION',
      subject: 'Surprise compliance inspection of campus department',
      direction: 'ALLOW',
    });

    const updated = await Case.findById(caseDoc._id);
    const lastEvent = updated.statusHistory[updated.statusHistory.length - 1];
    expect(lastEvent.status).toBe('INSPECTION_SCHEDULED');
    expect(lastEvent.action).toBe('INSPECTION');
    expect(lastEvent.office).toContain('Regional Office (Western)');
    expect(lastEvent.role).toBe('regional_officer');
  });
});
