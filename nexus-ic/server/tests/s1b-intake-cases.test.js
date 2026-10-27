import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import crypto from 'node:crypto';
import { createApp } from '../src/app.js';
import User from '../src/modules/auth/User.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';
import Institution from '../src/modules/institutions/Institution.js';
import Case from '../src/modules/cases/Case.js';
import Document from '../src/modules/documents/Document.js';
import { seedIdentityReporters } from '../src/modules/identity/seed.js';
import { getReporterId, isVerified } from '../src/modules/identity/index.js';
import { seedRegions } from '../src/modules/institutions/Region.js';
import { detect } from '../src/modules/intake/languageDetector.js';
import { scrub, hashBuffer } from '../src/modules/intake/metadataScrubber.js';
import { scan } from '../src/modules/intake/MalwareScanSimulator.js';
import { applyFieldPolicy } from '../src/middleware/abac.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';

let app;
let verifiedReporterId;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  process.env.DOCS_KEY = crypto.randomBytes(32).toString('hex');
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRegions();

  // Obtain real synthetic verification through the identity module's seed contract.
  await seedIdentityReporters();
  const student = await User.findOne({ username: 'trust_student_verified' });
  const unverified = await User.findOne({ username: 'trust_student_unverified' });
  verifiedReporterId = await getReporterId(student.id);
  expect(verifiedReporterId).toMatch(/^RP-[A-Z0-9]{4}$/);
  expect(await isVerified(student.id)).toBe(true);
  expect(await isVerified(unverified.id)).toBe(false);

  // Seed sample institution
  await Institution.create({
    pid: '1-1000000001',
    name: 'Delhi Institute of Technology',
    state: 'Delhi',
    region: 'Northern',
    type: 'Engineering',
    approvalStatus: 'approved',
    synthetic: true,
  });
});

describe('S1b: Intake, Master Cases & Document Security', () => {
  it('[U11] form validation, preview, and edit-before-confirm work; bad uploads are rejected', async () => {
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    // 1. Missing fields in draft fails validation
    await agent
      .post('/api/v1/grievances/draft')
      .send({ institutionPid: '1-1000000001' })
      .expect(400);

    // 2. Valid draft preview succeeds
    const draftRes = await agent
      .post('/api/v1/grievances/draft')
      .send({
        institutionPid: '1-1000000001',
        category: 'Fee Dispute',
        subCategory: 'Overcharging',
        narrative: 'College charged 50,000 extra lab fees beyond approved structure.',
      })
      .expect(200);

    expect(draftRes.body.draftValidated).toBe(true);
    expect(draftRes.body.institution.name).toBe('Delhi Institute of Technology');

    // 3. Bad upload: invalid MIME type rejected (S12)
    const badMimeRes = await agent
      .post('/api/v1/documents/upload')
      .send({
        bufferBase64: Buffer.from('executable script').toString('base64'),
        originalName: 'script.exe',
        mimeType: 'application/x-msdownload',
      })
      .expect(400);
    expect(badMimeRes.body.error).toContain('not allowed');

    // 4. Bad upload: infected file (EICAR) rejected (N31, S12)
    const eicarPayload = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    const malwareRes = await agent
      .post('/api/v1/documents/upload')
      .send({
        bufferBase64: Buffer.from(eicarPayload).toString('base64'),
        originalName: 'eicar.pdf',
        mimeType: 'application/pdf',
      })
      .expect(400);
    expect(malwareRes.body.error).toContain('Malware detected');
  });

  it('[U12] master case ID remains unchanged across operations', async () => {
    const student = await User.findOne({ username: 'trust_student_verified' });
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000042',
      reporterId: verifiedReporterId,
      institutionPid: '1-1000000001',
      category: 'Fee Dispute',
      subCategory: 'Overcharging',
      narrative: 'Testing master case ID immutability',
      narrativeHash: 'hash-test-42',
      status: 'SUBMITTED',
      synthetic: true,
    });

    // Verify schema level immutability: attempting to change masterCaseId fails
    caseDoc.masterCaseId = 'NX-2026-999999';
    await expect(caseDoc.save()).rejects.toThrow();
    expect((await Case.findById(caseDoc._id)).masterCaseId).toBe('NX-2026-000042');

    // Verify updateOne hook also rejects
    await expect(
      Case.updateOne({ _id: caseDoc._id }, { $set: { masterCaseId: 'NX-2026-888888' } })
    ).rejects.toThrow('Master Case ID is immutable');
  });

  it('[U13] external reference preserved and duplicate registration blocked', async () => {
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    const narrative = 'Faculty is absent for three consecutive weeks in CS department.';

    // 1. First submission succeeds and stores external reference
    const firstRes = await agent
      .post('/api/v1/grievances')
      .send({
        institutionPid: '1-1000000001',
        category: 'Faculty Shortage',
        subCategory: 'Absent Faculty',
        narrative,
        externalRefs: [{ sourceSystem: 'CPGRAMS', sourceCaseRef: 'CPG/2026/001' }],
      })
      .expect(201);

    expect(firstRes.body.masterCaseId).toMatch(/^NX-2026-\d{6}$/);

    // Verify externalRefs preserved in DB
    const storedCase = await Case.findOne({ masterCaseId: firstRes.body.masterCaseId });
    expect(storedCase.externalRefs).toHaveLength(1);
    expect(storedCase.externalRefs[0].sourceSystem).toBe('CPGRAMS');
    expect(storedCase.externalRefs[0].sourceCaseRef).toBe('CPG/2026/001');

    // 2. Same reporter submitting same PID and same text is blocked (Duplicate registration check)
    const dupRes = await agent
      .post('/api/v1/grievances')
      .send({
        institutionPid: '1-1000000001',
        category: 'Faculty Shortage',
        subCategory: 'Absent Faculty',
        narrative,
      })
      .expect(409);

    expect(dupRes.body.error).toContain('Duplicate registration');

    // 3. Duplicate externalRef with different narrative is also blocked
    const dupRefRes = await agent
      .post('/api/v1/grievances')
      .send({
        institutionPid: '1-1000000001',
        category: 'Faculty Shortage',
        subCategory: 'Absent Faculty',
        narrative: 'Different narrative but reusing same CPGRAMS reference.',
        externalRefs: [{ sourceSystem: 'CPGRAMS', sourceCaseRef: 'CPG/2026/001' }],
      })
      .expect(409);

    expect(dupRefRes.body.error).toContain('external reference');
  });

  it('[N13] grievance portal guided fields and preview confirmation', async () => {
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    // Test preview endpoint
    const preview = await agent
      .post('/api/v1/grievances/draft')
      .send({
        institutionPid: '1-1000000001',
        category: 'Infrastructure',
        subCategory: 'Lab Equipment',
        narrative: 'Chemistry lab equipment is non-functional.',
      })
      .expect(200);

    expect(preview.body.institution.pid).toBe('1-1000000001');
    expect(preview.body.grievance.category).toBe('Infrastructure');
    expect(preview.body.draftValidated).toBe(true);

    // Unverified user is rejected with 403 VERIFICATION_REQUIRED
    const unverifiedUser = await User.findOne({ username: 'trust_student_unverified' });
    expect(await isVerified(unverifiedUser.id)).toBe(false);

    const unverifiedAgent = supertest.agent(app);
    await unverifiedAgent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_unverified', password: DEMO_PASSWORD })
      .expect(200);

    const rejected = await unverifiedAgent
      .post('/api/v1/grievances/draft')
      .send({
        institutionPid: '1-1000000001',
        category: 'Infrastructure',
        subCategory: 'Lab Equipment',
        narrative: 'Testing unverified rejection.',
      })
      .expect(403);

    expect(rejected.body.code).toBe('VERIFICATION_REQUIRED');
  });

  it('[N14] master case ID generation and external ref preservation', async () => {
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent
      .post('/api/v1/grievances')
      .send({
        institutionPid: '1-1000000001',
        category: 'Exam Irregularity',
        subCategory: 'Evaluation Error',
        narrative: 'Mid-term revaluation request was rejected without reason.',
        externalRefs: [{ sourceSystem: 'STATE_PORTAL', sourceCaseRef: 'ST/9988' }],
      })
      .expect(201);

    expect(res.body.masterCaseId).toMatch(/^NX-2026-\d{6}$/);

    const audit = await AuditEvent.findOne({
      action: 'case.created',
      targetId: res.body.masterCaseId,
    });
    expect(audit).not.toBeNull();
  });

  it('[N15] web portal grievance intake submission', async () => {
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent
      .post('/api/v1/grievances')
      .send({
        institutionPid: '1-1000000001',
        category: 'Ragging',
        subCategory: 'Verbal',
        narrative: 'Senior students made offensive remarks in cafeteria.',
      })
      .expect(201);

    const caseDoc = await Case.findOne({ masterCaseId: res.body.masterCaseId });
    expect(caseDoc.channel.toLowerCase()).toBe('web');
  });

  it('[N31] encrypted document storage with malware scan', async () => {
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    const testBuffer = Buffer.from('%PDF-1.4 test document content');
    const uploadRes = await agent
      .post('/api/v1/documents/upload')
      .send({
        bufferBase64: testBuffer.toString('base64'),
        originalName: 'test_evidence.pdf',
        mimeType: 'application/pdf',
      })
      .expect(201);

    expect(uploadRes.body.documentId).toBeDefined();

    // Verify encrypted at rest in DB
    const doc = await Document.findById(uploadRes.body.documentId);
    expect(doc.encryptedOriginal).not.toBe(testBuffer.toString('base64'));
    expect(doc.encryptedOriginal).toBeDefined();
    expect(doc.originalIv).toBeDefined();
    expect(doc.originalTag).toBeDefined();
    expect(doc.malwareScanStatus).toBe('clean');
  });

  it('[A-N52] hidden-data scrubber strips metadata and seals original', async () => {
    // Construct JPEG with simulated EXIF APP1 marker
    const exifMarker = Buffer.from([0xff, 0xe1, 0x00, 0x0a, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00]);
    const jpegWithExif = Buffer.concat([
      Buffer.from([0xff, 0xd8]), // SOI
      exifMarker,
      Buffer.from([0xff, 0xda]), // SOS
      Buffer.from('image scan data'),
    ]);

    const { scrubbed, originalHash, stripped } = scrub(jpegWithExif, 'image/jpeg');
    expect(stripped).toBe(true);
    expect(scrubbed.length).toBeLessThan(jpegWithExif.length);
    expect(originalHash).toBe(hashBuffer(jpegWithExif));
  });

  it('[A-N67] multilingual complaints detected locally without cloud translation', async () => {
    // 1. Hindi complaint in Devanagari script
    const hindiText = 'हॉस्टल में भोजन की गुणवत्ता बहुत खराब है और सफाई नहीं है।';
    const hindiResult = detect(hindiText);
    expect(hindiResult.tag).toBe('hi');
    expect(hindiResult.script).toBe('Devanagari');

    // 2. Tamil complaint in Tamil script
    const tamilText = 'கல்லூரியில் சரியான வசதிகள் இல்லை மற்றும் ஆய்வகங்கள் செயல்படவில்லை.';
    const tamilResult = detect(tamilText);
    expect(tamilResult.tag).toBe('ta');
    expect(tamilResult.script).toBe('Tamil');

    // 3. English complaint in Latin script
    const englishText = 'The college is charging unauthorized fees beyond AICTE limits.';
    const englishResult = detect(englishText);
    expect(englishResult.tag).toBe('en');
    expect(englishResult.script).toBe('Latin');
  });

  it('[S03] field-level ABAC filters restricted fields', () => {
    const rawCase = {
      masterCaseId: 'NX-2026-000077',
      reporterId: verifiedReporterId,
      institutionPid: '1-1000000001',
      category: 'Fee Dispute',
      subCategory: 'Hidden Fees',
      status: 'SUBMITTED',
      internalNotes: 'Confidential officer remark',
    };

    // Institution admin receives redacted form: reporterId is masked, internalNotes removed
    const instAdminView = applyFieldPolicy(rawCase, 'institution_admin');
    expect(instAdminView.reporterId).toBe('[REDACTED]');
    expect(instAdminView.internalNotes).toBeUndefined();

    // Complainant does not receive internal officer notes
    const complainantView = applyFieldPolicy(rawCase, 'student');
    expect(complainantView.internalNotes).toBeUndefined();
    expect(complainantView.masterCaseId).toBe('NX-2026-000077');
  });

  it('[S10] document download requires case authorization', async () => {
    const student1 = await User.findOne({ username: 'trust_student_verified' });
    const student2 = await User.findOne({ username: 'trust_student_unverified' });

    const student1Agent = supertest.agent(app);
    await student1Agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    // Upload document as student1
    const uploadRes = await student1Agent
      .post('/api/v1/documents/upload')
      .send({
        bufferBase64: Buffer.from('%PDF-1.4 sample file').toString('base64'),
        originalName: 'evidence.pdf',
        mimeType: 'application/pdf',
      })
      .expect(201);

    const docId = uploadRes.body.documentId;

    // Link document to the actual case owned by the seeded verified student.
    const linkedCase = await Case.create({
      masterCaseId: 'NX-2026-000099',
      reporterId: verifiedReporterId,
      institutionPid: '1-1000000001',
      category: 'Fee Dispute',
      subCategory: 'Overcharging',
      narrative: 'Case with document',
      narrativeHash: 'h99',
      status: 'SUBMITTED',
      documentIds: [docId],
      synthetic: true,
    });
    await Document.updateOne({ _id: docId }, { $set: { caseId: linkedCase._id } });

    // student1 can download own document
    await student1Agent.get(`/api/v1/documents/${docId}/download`).expect(200);

    // student2 cannot download student1's unlinked/foreign document (IDOR returns 404)
    const student2Agent = supertest.agent(app);
    await student2Agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_unverified', password: DEMO_PASSWORD })
      .expect(200);

    await student2Agent.get(`/api/v1/documents/${docId}/download`).expect(404);

    // A missing linked case cannot fall through to an unrestricted download (returns 404).
    await Case.deleteOne({ _id: linkedCase._id });
    await student1Agent.get(`/api/v1/documents/${docId}/download`).expect(404);
    await student2Agent.get(`/api/v1/documents/${docId}/download`).expect(404);
  });

  it('[S11] downloads are server-proxied without exposing storage keys', async () => {
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    const testContent = '%PDF-1.4 secret evidence text';
    const uploadRes = await agent
      .post('/api/v1/documents/upload')
      .send({
        bufferBase64: Buffer.from(testContent).toString('base64'),
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
      })
      .expect(201);

    const docId = uploadRes.body.documentId;

    // Download streamed through server proxy
    const downloadRes = await agent.get(`/api/v1/documents/${docId}/download`)
      .buffer(true)
      .parse((response, done) => {
        // Decode this synthetic PDF fixture for the existing exact-content assertion.
        response.text = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { response.text += chunk; });
        response.on('end', () => done(null, response.text));
        response.on('error', done);
      })
      .expect(200);
    expect(downloadRes.headers['content-type']).toBe('application/pdf');
    expect(downloadRes.headers['x-document-hash']).toBeDefined();
    // Raw storage path/keys never present in headers
    expect(downloadRes.headers['x-storage-key']).toBeUndefined();
    expect(downloadRes.text).toBe(testContent);
  });

  it('[S12] upload validation enforces types, sizes and malware check', () => {
    // 1. Invalid MIME type
    const exeCheck = scan(Buffer.from('MZ...exe'));
    expect(exeCheck.status).toBe('clean'); // scan checks malware; config checks MIME

    // 2. Malware scan stub detects EICAR
    const eicarBuffer = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
    const malwareCheck = scan(eicarBuffer);
    expect(malwareCheck.status).toBe('infected');
  });

  it('[S21] IDOR denied: complainant sees own cases only', async () => {
    const student1 = await User.findOne({ username: 'trust_student_verified' });
    const student2 = await User.findOne({ username: 'trust_student_unverified' });

    const case1 = await Case.create({
      masterCaseId: 'NX-2026-000101',
      reporterId: verifiedReporterId,
      institutionPid: '1-1000000001',
      category: 'Fee Dispute',
      subCategory: 'Overcharging',
      narrative: 'Student 1 complaint',
      narrativeHash: 'h101',
      status: 'SUBMITTED',
      synthetic: true,
    });

    // Login as student_other
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_unverified', password: DEMO_PASSWORD })
      .expect(200);

    // Requesting student 1's case returns 404 (IDOR denied)
    await agent.get(`/api/v1/cases/${case1.masterCaseId}`).expect(404);

    // Verify audit event recorded for IDOR denial
    const audit = await AuditEvent.findOne({
      action: 'case.access_denied_idor',
      targetId: case1.masterCaseId,
    });
    expect(audit).not.toBeNull();
    expect(audit.meta.reason).toBe('IDOR_DENIED');
  });

  it('[S02] reveal scope follows case access', async () => {
    // Verified student has a case in Regulation Bureau
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000201',
      reporterId: verifiedReporterId,
      institutionPid: '1-1000000001',
      category: 'Fee Dispute',
      subCategory: 'Overcharging',
      narrative: 'Open grievance for reveal scope test',
      narrativeHash: 'h201',
      status: 'ROUTED',
      owningBureau: 'Regulation Bureau',
      synthetic: true,
    });

    // Bureau officer in Regulation Bureau can request reveal
    const rbOfficer = await User.findOne({ username: 'rb_officer1' });
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });

    // Login as rb_officer1 and request reveal
    const rbAgent = supertest.agent(app);
    await rbAgent
      .post('/api/v1/auth/login')
      .send({ username: 'rb_officer1', password: DEMO_PASSWORD })
      .expect(200);

    const revealReq = await rbAgent
      .post('/api/v1/identity/reveal-requests')
      .send({ reporterId: verifiedReporterId, purpose: 'Investigating fee overcharge case' })
      .expect(200);
    expect(revealReq.body.id).toBeDefined();

    // Login as counterpart pgrc_officer1 and verify reveal request is denied (403)
    const pgrcAgent = supertest.agent(app);
    await pgrcAgent
      .post('/api/v1/auth/login')
      .send({ username: 'pgrc_officer1', password: DEMO_PASSWORD })
      .expect(200);

    await pgrcAgent
      .post('/api/v1/identity/reveal-requests')
      .send({ reporterId: verifiedReporterId, purpose: 'Counterpart inspection attempt' })
      .expect(403);
  });

  it('[N05] burst submission records fraud signal without rejecting grievance', async () => {
    const studentAgent = supertest.agent(app);
    await studentAgent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    // Pre-create 5 cases for verifiedReporterId within window
    for (let i = 0; i < 5; i++) {
      await Case.create({
        masterCaseId: `NX-2026-00030${i}`,
        reporterId: verifiedReporterId,
        institutionPid: '1-1000000001',
        category: 'Fee Dispute',
        subCategory: 'Overcharging',
        narrative: `Burst case ${i}`,
        narrativeHash: `hash-burst-${i}`,
        status: 'SUBMITTED',
        synthetic: true,
      });
    }

    // Submit 6th grievance: should succeed (201) and record burst fraud signal
    const submitRes = await studentAgent
      .post('/api/v1/grievances')
      .send({
        institutionPid: '1-1000000001',
        category: 'Fee Dispute',
        subCategory: 'Overcharging',
        narrative: 'Burst submission test message',
      })
      .expect(201);

    expect(submitRes.body.masterCaseId).toBeDefined();

    // Check fraud signal in audit or identity Fraud model
    const fraudAudit = await AuditEvent.findOne({
      action: 'identity.fraud.burst_submissions',
      targetId: verifiedReporterId,
    });
    expect(fraudAudit).not.toBeNull();
  });

  it('[S04/S21] no case response contains userId to any role', async () => {
    const studentAgent = supertest.agent(app);
    await studentAgent
      .post('/api/v1/auth/login')
      .send({ username: 'trust_student_verified', password: DEMO_PASSWORD })
      .expect(200);

    const testCase = await Case.create({
      masterCaseId: 'NX-2026-000401',
      reporterId: verifiedReporterId,
      institutionPid: '1-1000000001',
      category: 'Fee Dispute',
      subCategory: 'Overcharging',
      narrative: 'Check privacy response',
      narrativeHash: 'h401',
      status: 'SUBMITTED',
      synthetic: true,
    });

    // Check complainant view
    const complainantRes = await studentAgent.get(`/api/v1/cases/${testCase.masterCaseId}`).expect(200);
    expect(complainantRes.body.userId).toBeUndefined();
    expect(JSON.stringify(complainantRes.body)).not.toContain('userId');

    // Check supervisor view
    const supAgent = supertest.agent(app);
    await supAgent
      .post('/api/v1/auth/login')
      .send({ username: 'supervisor1', password: DEMO_PASSWORD })
      .expect(200);

    const supRes = await supAgent.get(`/api/v1/cases/${testCase.masterCaseId}`).expect(200);
    expect(supRes.body.userId).toBeUndefined();
    expect(JSON.stringify(supRes.body)).not.toContain('userId');

    // Check system_admin view
    const adminAgent = supertest.agent(app);
    await adminAgent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const adminRes = await adminAgent.get(`/api/v1/cases/${testCase.masterCaseId}`).expect(200);
    expect(adminRes.body.userId).toBeUndefined();
    expect(JSON.stringify(adminRes.body)).not.toContain('userId');
  });
});
