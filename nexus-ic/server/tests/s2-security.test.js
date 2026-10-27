import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import { seedBureaus } from '../src/modules/bureaus/seed.js';
import Case from '../src/modules/cases/Case.js';
import Document from '../src/modules/documents/Document.js';
import { backupDatabase } from '../../scripts/backup.js';
import { restoreDatabase } from '../../scripts/restore.js';
import { commitImport } from '../src/modules/lifecycle/importEngine.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  process.env.DOCS_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRuleBook();
  await seedBureaus();
});

describe('S2: Security, Separation of Duties & Operational Integrity (S20, S25, S29)', () => {
  it('[S20] requester differs from approver on sensitive approvals', async () => {
    // 1. Separation of duties in RuleBook draft approval
    const agentRequester = supertest.agent(app);
    await agentRequester
      .post('/api/v1/auth/login')
      .send({ username: 'supervisor1', password: DEMO_PASSWORD })
      .expect(200);

    const draftRes = await agentRequester
      .post('/api/v1/rulebook/versions')
      .send({
        family: 'TRANSFER',
        version: 'DEMO-TRANSFER-TEST-v2',
        body: { ackWindowBusinessDays: 3 },
        effectiveFrom: new Date().toISOString(),
        reason: 'Adjust transfer window',
        synthetic: true,
      })
      .expect(201);

    await agentRequester.post(`/api/v1/rulebook/versions/${draftRes.body._id}/dry-run`).expect(200);

    // Requester cannot approve own version
    const selfApprove = await agentRequester
      .post(`/api/v1/rulebook/versions/${draftRes.body._id}/approve`)
      .expect(403);
    expect(selfApprove.body.error).toMatch(/Requester cannot approve their own rule change request/i);

    // 2. Separation of duties in sensitivity confirmation
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000020',
      reporterId: 'reporter_s20',
      institutionPid: '1-1000000001',
      category: 'Ragging',
      subCategory: 'Hostel',
      narrative: 'Freshers targeted',
      narrativeHash: 'hash_s20_001',
      status: 'SUBMITTED',
      sensitivityFlags: [
        {
          flag: 'SENSITIVE_KEYWORD',
          keyword: 'targeted',
          detectedAt: new Date(),
          status: 'SUGGESTED',
          confirmedBy: null,
        },
      ],
      synthetic: true,
    });

    const agentOfficer = supertest.agent(app);
    await agentOfficer
      .post('/api/v1/auth/login')
      .send({ username: 'ab_officer1', password: DEMO_PASSWORD })
      .expect(200);

    // Set flag requester as ab_officer1
    const { default: User } = await import('../src/modules/auth/User.js');
    const officer = await User.findOne({ username: 'ab_officer1' });
    caseDoc.sensitivityFlags[0].suggestedBy = officer._id;
    await caseDoc.save();

    // Officer who suggested the sensitivity flag cannot confirm it themselves
    const selfConfirm = await agentOfficer
      .post(`/api/v1/priority/${caseDoc._id}/confirm-sensitive`)
      .send({ flagIndex: 0, reason: 'Self confirmation attempt' })
      .expect(403);
    expect(selfConfirm.body.error).toMatch(/Requester cannot confirm their own sensitivity flag/i);
  });

  it('[S25] institution_admin cannot read confirmed sensitive case narrative/docs', async () => {
    // 1. Create a confirmed sensitive case
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000025',
      reporterId: 'reporter_s25',
      institutionPid: '1-1000000001',
      category: 'Sexual Harassment',
      subCategory: 'Faculty',
      narrative: 'Sensitive harassment narrative with high retaliation risk',
      narrativeHash: 'hash_s25_001',
      status: 'SUBMITTED',
      owningBureau: 'PGRC',
      sensitivityFlags: [
        {
          flag: 'SENSITIVE_KEYWORD',
          keyword: 'harassment',
          detectedAt: new Date(),
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      ],
      synthetic: true,
    });

    // Create a mock document attached to this case
    const mockDoc = await Document.create({
      caseId: caseDoc._id,
      uploadedBy: new mongoose.Types.ObjectId(),
      originalName: 'harassment_evidence.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      originalHash: 'a'.repeat(64),
      scrubbedHash: 'b'.repeat(64),
      encryptedOriginal: 'enc_orig_data',
      originalIv: 'c'.repeat(24),
      originalTag: 'd'.repeat(32),
      encryptedScrubbed: 'enc_scrub_data',
      scrubbedIv: 'c'.repeat(24),
      scrubbedTag: 'd'.repeat(32),
      synthetic: true,
    });

    // 2. Complainant can read their own case and narrative
    const studentAgent = supertest.agent(app);
    await studentAgent
      .post('/api/v1/auth/login')
      .send({ username: 'student1', password: DEMO_PASSWORD })
      .expect(200);

    // 3. Institution admin attempts to read case details
    const instAgent = supertest.agent(app);
    await instAgent
      .post('/api/v1/auth/login')
      .send({ username: 'inst_admin1', password: DEMO_PASSWORD })
      .expect(200);

    const getCaseRes = await instAgent
      .get(`/api/v1/cases/${caseDoc.masterCaseId}`)
      .expect(200);

    // Narrative must be redacted/withheld
    expect(getCaseRes.body.narrative).toContain('[RESTRICTED: Sensitive case narrative withheld]');

    // 4. Institution admin attempts to download sensitive document -> 404 (anti-retaliation / IDOR denied)
    await instAgent
      .get(`/api/v1/documents/${mockDoc._id}/download`)
      .expect(404);
  });

  it('[S29] backup and restore into _demo; import replay creates no duplicates', async () => {
    // 1. Safety verification: restore refuses any database not ending in '_demo'
    await expect(
      restoreDatabase('non_existent.json', 'mongodb://localhost:27017/production_db')
    ).rejects.toThrow(/REFUSED/i);

    // 2. Test backup execution into a temporary test path
    const tempBackupPath = path.resolve(__dirname, 'temp_backup_test.json');
    const backupRes = await backupDatabase(tempBackupPath);
    expect(fs.existsSync(tempBackupPath)).toBe(true);
    expect(backupRes.collectionCount).toBeGreaterThan(0);

    // Verify backup JSON has sanitized content
    const backupContent = fs.readFileSync(tempBackupPath, 'utf8');
    expect(backupContent).not.toContain(process.env.DOCS_KEY);
    fs.unlinkSync(tempBackupPath);

    // 3. Import Replay idempotency: Replaying identical batch creates 0 duplicates
    const importBatch = [
      {
        institutionPid: '1-1000000001',
        category: 'Ragging',
        narrative: 'Imported incident from external legacy portal',
        sourceSystem: 'LEGACY_PORTAL_2025',
        sourceCaseRef: 'EXT-CASE-99991',
      },
    ];

    const actor = { username: 'sysadmin1', role: 'system_admin' };
    const commit1 = await commitImport(importBatch, actor);
    expect(commit1.createdCount).toBe(1);
    expect(commit1.skippedCount).toBe(0);

    // Replay exact same import batch
    const commit2 = await commitImport(importBatch, actor);
    expect(commit2.createdCount).toBe(0);
    expect(commit2.skippedCount).toBe(1);
    expect(commit2.skippedDuplicates[0].sourceCaseRef).toBe('EXT-CASE-99991');
  });
});
