import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import Case from '../src/modules/cases/Case.js';
import User from '../src/modules/auth/User.js';
import Document from '../src/modules/documents/Document.js';
import { recordOfficerAction, getCaseActions } from '../src/modules/actions/actionService.js';
import {
  scheduleInspection,
  submitFieldReport,
  getVisitsForCase,
} from '../src/modules/fieldwork/fieldworkService.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRuleBook();
});

describe('S3: Officer Actions & Field Verification (N72, N74)', () => {
  it('[N72] Process the Complaint with role-specific officer actions (PGRC, RB, other bureaus)', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const rbOfficer = await User.findOne({ username: 'rb_officer1' });

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000330',
      reporterId: 'RP-0330',
      institutionPid: '1-1000000001',
      category: 'Governance',
      subCategory: 'Affiliation',
      narrative: 'Non-compliance with faculty cadre ratio',
      narrativeHash: 'hash_n72_030',
      status: 'Under Process',
      owningBureau: 'PGRC',
    });

    const doc = await Document.create({
      originalName: 'scrutiny_finding.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      originalHash: 'dummy_orig_hash_scrutiny',
      scrubbedHash: 'dummy_scrub_hash_scrutiny',
      encryptedOriginal: 'enc_orig_scrutiny',
      originalIv: 'iv_scrutiny_1',
      originalTag: 'tag_scrutiny_1',
      encryptedScrubbed: 'enc_scrub_scrutiny',
      scrubbedIv: 'iv_scrutiny_2',
      scrubbedTag: 'tag_scrutiny_2',
      uploadedBy: pgrcOfficer._id,
      malwareScanStatus: 'clean',
    });

    // 1. PGRC Officer conducts preliminary scrutiny action
    const { action: act1, preCheck: pre1 } = await recordOfficerAction(pgrcOfficer, {
      caseId: caseDoc._id,
      actionType: 'NOTICE',
      actionSubtype: 'PRELIMINARY_SCRUTINY',
      subject: 'Preliminary document audit for cadre ratio',
      remark: 'Verified AICTE faculty database against reported strength',
      evidenceRefs: [doc._id],
    });

    expect(act1.actionType).toBe('NOTICE');
    expect(act1.actionSubtype).toBe('PRELIMINARY_SCRUTINY');
    expect(act1.remark).toBe('Verified AICTE faculty database against reported strength');
    expect(act1.evidenceRefs.length).toBe(1);
    expect(act1.at).toBeInstanceOf(Date);
    expect(pre1).toBeDefined();

    // 2. Transfer ownership to RB for regulatory review
    caseDoc.owningBureau = 'RB';
    await caseDoc.save();

    const { action: act2, preCheck: pre2 } = await recordOfficerAction(rbOfficer, {
      caseId: caseDoc._id,
      actionType: 'INSTRUCTION',
      actionSubtype: 'REGULATORY_REVIEW',
      subject: 'Formal inspection instruction to Regional Office',
      direction: 'ALLOW',
      remark: 'Regulatory review recommends expert visit and detailed faculty verification',
    });

    expect(act2.actionType).toBe('INSTRUCTION');
    expect(act2.actionSubtype).toBe('REGULATORY_REVIEW');
    expect(['RB', 'Regulation Bureau']).toContain(act2.bureau);
    expect(act2.remark).toContain('recommends expert visit');
    expect(pre2).toBeDefined();

    // 3. List actions for case
    const actions = await getCaseActions(rbOfficer, caseDoc._id);
    expect(actions.length).toBe(2);
    expect(actions[0].actionSubtype).toBe('PRELIMINARY_SCRUTINY');
    expect(actions[1].actionSubtype).toBe('REGULATORY_REVIEW');
  });

  it('[N74] Regional Office field verification (inspections / site verification, field documents)', async () => {
    const roOfficer = await User.findOne({ username: 'regional1' });

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000331',
      reporterId: 'RP-0331',
      institutionPid: '1-1000000001',
      pidSnapshot: { region: roOfficer.region || 'Northern' },
      category: 'Infrastructure',
      subCategory: 'Safety',
      narrative: 'Campus safety and structural integrity concerns',
      narrativeHash: 'hash_n74_031',
      status: 'Under Process',
      owningBureau: 'PGRC',
    });

    const inspectionDoc = await Document.create({
      originalName: 'field_inspection_photo.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4096,
      originalHash: 'dummy_orig_hash_photo',
      scrubbedHash: 'dummy_scrub_hash_photo',
      encryptedOriginal: 'enc_orig_photo',
      originalIv: 'iv_photo_1',
      originalTag: 'tag_photo_1',
      encryptedScrubbed: 'enc_scrub_photo',
      scrubbedIv: 'iv_photo_2',
      scrubbedTag: 'tag_photo_2',
      uploadedBy: roOfficer._id,
      malwareScanStatus: 'clean',
    });

    // 1. RO arranges inspection / site verification
    const visitDate = new Date('2026-11-05T10:00:00Z');
    const visit = await scheduleInspection(roOfficer, {
      caseId: caseDoc._id,
      visitDate,
      purpose: 'Physical verification of newly constructed engineering block',
      regionalOffice: 'North',
    });

    expect(visit.status).toBe('SCHEDULED');
    expect(visit.regionalOffice).toBe('North');
    expect(visit.purpose).toContain('Physical verification');

    // 2. RO submits field report with regional inputs and uploaded documents
    const updatedVisit = await submitFieldReport(roOfficer, visit._id, {
      siteReport: 'Inspected premises on 5th Nov. Found fire safety certificate expired in Aug 2026.',
      regionalInputs: 'Immediate notice recommended to institution management for renewal within 15 days.',
      documentIds: [inspectionDoc._id],
    });

    expect(updatedVisit.status).toBe('REPORT_SUBMITTED');
    expect(updatedVisit.siteReport).toContain('fire safety certificate expired');
    expect(updatedVisit.regionalInputs).toContain('Immediate notice recommended');
    expect(updatedVisit.documentIds.length).toBe(1);

    // 3. Verify visits retrievable for case
    const visits = await getVisitsForCase(roOfficer, caseDoc._id);
    expect(visits.length).toBe(1);
    expect(visits[0]._id.toString()).toBe(visit._id.toString());
  });
});
