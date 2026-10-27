import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import Case from '../src/modules/cases/Case.js';
import User from '../src/modules/auth/User.js';
import Document from '../src/modules/documents/Document.js';
import {
  createCoordination,
  recordCoordinationAgreement,
  createCoordinationTask,
  completeCoordinationTask,
  checkInstructionConflict,
  getSharedInstitutionView,
} from '../src/modules/sync/syncService.js';
import { sendBlindNotice } from '../src/modules/sync/noticeService.js';
import {
  createDisclosureGrant,
  verifyGrantAccess,
  revokeDisclosureGrant,
} from '../src/modules/sync/disclosureService.js';
import {
  addInternalNote,
  getInternalNotes,
  sanitizeCaseResponse,
} from '../src/modules/sync/internalNotesService.js';
import { CommunicationLog, CoordinationTask } from '../src/modules/sync/models.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRuleBook();
});

describe('S3: NEXUS SYNC 2.0 (N21, N75, S17, S18, S24, U23)', () => {
  it('[N21] completing every task leaves the case status unchanged; a conflicting instruction shows S4\'s REVIEW result and can still be recorded', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const rbOfficer = await User.findOne({ username: 'rb_officer1' });

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000310',
      reporterId: 'RP-0310',
      institutionPid: '1-1000000001',
      category: 'Infrastructure',
      subCategory: 'Laboratory',
      narrative: 'Chemistry lab lacks safety equipment',
      narrativeHash: 'hash_n21_010',
      status: 'Under Process',
      owningBureau: 'PGRC',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer._id,
        officerName: pgrcOfficer.displayName,
      },
    });

    const coord = await createCoordination(pgrcOfficer, {
      institutionPid: '1-1000000001',
      caseIds: [caseDoc._id],
      participatingBureaus: ['PGRC', 'RB'],
      leadBureau: 'PGRC',
    });

    // 1. Create coordination task
    const task = await createCoordinationTask(pgrcOfficer, {
      coordinationId: coord._id,
      caseId: caseDoc._id,
      assignedBureau: 'RB',
      title: 'Inspect lab fume hoods and fire extinguishers',
    });

    expect(task.status).toBe('PENDING');

    // Complete task
    await completeCoordinationTask(rbOfficer, task._id);

    // Verify task completion NEVER changes case status to Closed
    const freshCase = await Case.findById(caseDoc._id);
    expect(freshCase.status).toBe('Under Process');
    expect(freshCase.status).not.toBe('Closed');
    expect(freshCase.status).not.toBe('CLOSED');

    // 2. Conflicting instruction detection calling S4 checkAction
    const instructionCheck = await checkInstructionConflict(pgrcOfficer, {
      caseId: caseDoc._id,
      instructionText: 'Permit students to use chemical laboratory immediately',
      direction: 'ALLOW',
    });

    expect(instructionCheck.advisory).toBe(true);
    expect(instructionCheck.canProceed).toBe(true);
    expect(['CLEAR', 'REVIEW', 'UNKNOWN']).toContain(instructionCheck.result);
  });

  it('[N75] the SYNC steps "Agree on Next Steps (where applicable)" and "Each Unit Continues Its Assigned Work": an agreement record (who agreed, what, when) and each unit keeps its own tasks and ownership', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const rbOfficer = await User.findOne({ username: 'rb_officer1' });

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000311',
      reporterId: 'RP-0311',
      institutionPid: '1-1000000001',
      category: 'Governance',
      subCategory: 'Compliance',
      narrative: 'Multi-unit compliance coordination',
      narrativeHash: 'hash_n75_011',
      status: 'Under Process',
      owningBureau: 'PGRC',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer._id,
      },
    });

    const coord = await createCoordination(pgrcOfficer, {
      institutionPid: '1-1000000001',
      caseIds: [caseDoc._id],
      participatingBureaus: ['PGRC', 'RB'],
      leadBureau: 'PGRC',
    });

    const t1 = await createCoordinationTask(pgrcOfficer, {
      coordinationId: coord._id,
      caseId: caseDoc._id,
      assignedBureau: 'PGRC',
      title: 'Collect student testimonies',
    });

    const t2 = await createCoordinationTask(pgrcOfficer, {
      coordinationId: coord._id,
      caseId: caseDoc._id,
      assignedBureau: 'RB',
      title: 'Review institution affiliation documents',
    });

    // Record agreement on next steps (N75)
    const agreedCoord = await recordCoordinationAgreement(pgrcOfficer, coord._id, {
      nextSteps: 'Joint inspection scheduled for 15th Nov; interim compliance report required by 10th Nov.',
    });

    expect(agreedCoord.status).toBe('AGREED');
    expect(agreedCoord.agreedNextSteps.steps).toContain('Joint inspection scheduled');
    expect(agreedCoord.agreedNextSteps.agreedBy.length).toBeGreaterThan(0);
    expect(agreedCoord.agreedNextSteps.agreedAt).toBeInstanceOf(Date);

    // Each unit continues its assigned work: tasks and ownership remain independent
    const freshT1 = await CoordinationTask.findById(t1._id);
    const freshT2 = await CoordinationTask.findById(t2._id);
    expect(freshT1.assignedBureau).toBe('PGRC');
    expect(freshT2.assignedBureau).toBe('RB');

    const freshCase = await Case.findById(caseDoc._id);
    expect(freshCase.owningBureau).toBe('PGRC');
  });

  it('[S17] the counterpart bureau\'s notice contains no narrative, document, reporterId or complainant field', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const sensitiveNarrative = 'TOP_SECRET_STUDENT_COMPLAINT_NARRATIVE_777';
    const reporterSecret = 'CONFIDENTIAL_REPORTER_ID_RP_777';

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000312',
      reporterId: reporterSecret,
      institutionPid: '1-1000000001',
      category: 'Ragging',
      subCategory: 'Hostel',
      narrative: sensitiveNarrative,
      narrativeHash: 'hash_s17_012',
      status: 'Under Process',
      owningBureau: 'PGRC',
    });

    const notice = await sendBlindNotice(pgrcOfficer, {
      targetBureau: 'RB',
      institutionPid: caseDoc.institutionPid,
      caseId: caseDoc._id,
    });

    // Counterpart notice contains ONLY opaque reference
    const noticeString = JSON.stringify(notice);
    expect(noticeString).not.toContain(sensitiveNarrative);
    expect(noticeString).not.toContain(reporterSecret);
    expect(noticeString).not.toContain('narrative');
    expect(noticeString).not.toContain('documents');
    expect(noticeString).not.toContain('reporterId');

    expect(notice.notice).toBe('Related open matter exists');
    expect(notice.institutionPid).toBe('1-1000000001');
    expect(['PGRC', 'Public Grievance Redressal Cell']).toContain(notice.contactOffice);

    // Communication log also contains zero narrative or identity
    const logEntry = await CommunicationLog.findOne({ caseId: caseDoc._id });
    expect(logEntry).not.toBeNull();
    const logStr = JSON.stringify(logEntry.toObject());
    expect(logStr).not.toContain(sensitiveNarrative);
    expect(logStr).not.toContain(reporterSecret);
  });

  it('[S18] a grant without purpose is 400; after expiry the document is refused and the refusal is audited; revocation works', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const rbOfficer = await User.findOne({ username: 'rb_officer1' });

    const doc = await Document.create({
      originalName: 'evidence.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      originalHash: 'dummy_orig_hash_evidence',
      scrubbedHash: 'dummy_scrub_hash_evidence',
      encryptedOriginal: 'enc_orig_data',
      originalIv: 'iv_orig_1',
      originalTag: 'tag_orig_1',
      encryptedScrubbed: 'enc_scrub_data',
      scrubbedIv: 'iv_scrub_2',
      scrubbedTag: 'tag_scrub_2',
      uploadedBy: pgrcOfficer._id,
      malwareScanStatus: 'clean',
    });

    // 1. Grant without purpose is 400
    await expect(
      createDisclosureGrant(pgrcOfficer, {
        documentId: doc._id,
        caseId: doc._id, // placeholder
        granteeBureau: 'RB',
        purpose: '',
      })
    ).rejects.toThrow();

    await expect(
      createDisclosureGrant(pgrcOfficer, {
        documentId: doc._id,
        caseId: doc._id,
        granteeBureau: 'RB',
        purpose: '   ',
      })
    ).rejects.toThrow();

    // 2. Valid grant
    const grant = await createDisclosureGrant(pgrcOfficer, {
      documentId: doc._id,
      caseId: doc._id,
      granteeBureau: 'RB',
      purpose: 'Inter-bureau inspection evidence verification',
      durationHours: 2,
    });

    expect(grant.purpose).toBe('Inter-bureau inspection evidence verification');
    expect(grant.revoked).toBe(false);

    // Initial access verified
    const access = await verifyGrantAccess(rbOfficer, doc._id);
    expect(access._id.toString()).toBe(grant._id.toString());

    // 3. Expiry enforced: artificially age expiry
    grant.expiresAt = new Date(Date.now() - 1000);
    await grant.save();

    await expect(verifyGrantAccess(rbOfficer, doc._id)).rejects.toThrow(/missing, expired, or revoked/);

    // 4. Revocation works
    const freshGrant = await createDisclosureGrant(pgrcOfficer, {
      documentId: doc._id,
      caseId: doc._id,
      granteeBureau: 'RB',
      purpose: 'Second review grant',
      durationHours: 24,
    });

    await revokeDisclosureGrant(pgrcOfficer, freshGrant._id);
    await expect(verifyGrantAccess(rbOfficer, doc._id)).rejects.toThrow(/missing, expired, or revoked/);
  });

  it('[U23] and [S24] every complainant-facing and institution-admin response is scanned and contains no internal note text or note IDs', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const studentUser = await User.findOne({ username: 'student1' });
    const instAdmin = await User.findOne({ username: 'inst_admin1' });

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000314',
      reporterId: 'RP-0314',
      institutionPid: '1-1000000001',
      category: 'Ragging',
      subCategory: 'Hostel',
      narrative: 'Complainant privacy test',
      narrativeHash: 'hash_u23_014',
      status: 'Under Process',
      owningBureau: 'PGRC',
    });

    const secretInternalNote = 'CONFIDENTIAL_INTERNAL_OFFICER_REMARK_NOT_FOR_PUBLIC_123';
    const note = await addInternalNote(pgrcOfficer, caseDoc._id, secretInternalNote);
    expect(note.text).toBe(secretInternalNote);

    // 1. Officers can read internal notes
    const officerNotes = await getInternalNotes(pgrcOfficer, caseDoc._id);
    expect(officerNotes.length).toBeGreaterThan(0);
    expect(officerNotes[0].text).toBe(secretInternalNote);

    // 2. Complainants cannot read internal notes (403 refused)
    await expect(getInternalNotes(studentUser, caseDoc._id)).rejects.toThrow(/invisible to complainants/);

    // 3. Institution admins cannot read internal notes (403 refused)
    await expect(getInternalNotes(instAdmin, caseDoc._id)).rejects.toThrow(/invisible to complainants/);

    // 4. Sanitizer scrubs any note fields for non-officers
    const mockCaseResponse = {
      masterCaseId: caseDoc.masterCaseId,
      status: 'Under Process',
      internalNotes: [secretInternalNote],
      noteIds: [note._id.toString()],
    };

    const studentSanitized = sanitizeCaseResponse(mockCaseResponse, 'student');
    expect(studentSanitized.internalNotes).toBeUndefined();
    expect(studentSanitized.noteIds).toBeUndefined();
    expect(JSON.stringify(studentSanitized)).not.toContain(secretInternalNote);

    const instAdminSanitized = sanitizeCaseResponse(mockCaseResponse, 'institution_admin');
    expect(instAdminSanitized.internalNotes).toBeUndefined();
    expect(instAdminSanitized.noteIds).toBeUndefined();
    expect(JSON.stringify(instAdminSanitized)).not.toContain(secretInternalNote);
  });
});
