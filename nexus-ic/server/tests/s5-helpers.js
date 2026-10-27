import crypto from 'node:crypto';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/modules/auth/User.js';
import Case from '../src/modules/cases/Case.js';
import Document from '../src/modules/documents/Document.js';
import Institution from '../src/modules/institutions/Institution.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedIdentityReporters } from '../src/modules/identity/seed.js';
import { getReporterId } from '../src/modules/identity/index.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import { createDraftVersion, runDryRun, approveVersion } from '../src/modules/rulebook/index.js';
import { CaseAction } from '../src/modules/prevent/models.js';
import { Transfer } from '../src/modules/trace/models.js';
import { Coordination, CoordinationTask } from '../src/modules/sync/models.js';
import { seedS5 } from '../src/modules/authority/seed.js';

// Shared S5 fixtures. Synthetic only.
export const PID = '1-1000000001';
export const OTHER_PID = '1-1000000002';
export const NARRATIVE = 'Synthetic narrative: my name is Ravi Kumar, roll no 21BCE1234, phone 9876543210, lab fee not refunded';
let seq = 500;

export async function setupS5() {
  process.env.APP_MODE = 'demo';
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  await seedDemoAccounts();
  await seedIdentityReporters();
  await seedRuleBook();
  await Institution.create({ pid: PID, name: 'Synthetic S5 institution A', state: 'DEMO state', region: 'Northern', type: 'DEMO', synthetic: true });
  await Institution.create({ pid: OTHER_PID, name: 'Synthetic S5 institution B', state: 'DEMO state', region: 'Southern', type: 'DEMO', synthetic: true });
  await seedS5();
  const names = ['trust_student_verified', 'trust_faculty_verified', 'rb_officer1', 'pgrc_officer1', 'supervisor1', 'authority1', 'inst_admin1', 'auditor1', 'authority_chair1'];
  const [student, faculty, officer, pgrc, supervisor, authority, instAdmin, auditor, chair] = await Promise.all(names.map((username) => User.findOne({ username })));
  return { app: createApp(process.env.MONGODB_URI), student, faculty, officer, pgrc, supervisor, authority, instAdmin, auditor, chair };
}

export async function agent(app, user) {
  const a = supertest.agent(app);
  await a.post('/api/v1/auth/login').send({ username: user.username, password: 'demo1234' }).expect(200);
  return a;
}

export const asSession = (user) => ({ id: String(user._id), _id: user._id, username: user.username, role: user.role, bureau: user.bureau, region: user.region });

export async function makeCase(owner, officer, overrides = {}) {
  seq++;
  return Case.create({
    masterCaseId: `NX-2026-${String(seq).padStart(6, '0')}`,
    reporterId: await getReporterId(owner._id),
    institutionPid: PID,
    pidSnapshot: { region: 'Northern' },
    category: 'Fee Dispute',
    subCategory: 'Refund Denial',
    narrative: NARRATIVE,
    narrativeHash: `s5-${seq}`,
    status: 'Under Process',
    analyticStatus: 'IN_PROCESS',
    owningBureau: officer.bureau,
    routingDecisionId: new mongoose.Types.ObjectId(),
    currentOwner: { office: officer.bureau, role: 'bureau_officer', officerId: officer._id, officerName: officer.displayName, assignedAt: new Date() },
    synthetic: true,
    ...overrides,
  });
}

export async function addAction(caseDoc, officer, at = new Date()) {
  return CaseAction.create({ caseId: caseDoc._id, institutionPid: caseDoc.institutionPid, bureau: officer.bureau || 'Competent Authority', actorId: String(officer._id), actorRole: officer.role, actionType: 'OTHER', subjectKey: 'synthetic-subject', at });
}

export async function addDocument(caseDoc, uploader) {
  const h = crypto.randomBytes(32).toString('hex');
  return Document.create({
    caseId: caseDoc._id, originalName: 'synthetic.pdf', mimeType: 'application/pdf', sizeBytes: 10, originalHash: h, scrubbedHash: h,
    encryptedOriginal: 'x', originalIv: 'x', originalTag: 'x', encryptedScrubbed: 'x', scrubbedIv: 'x', scrubbedTag: 'x', uploadedBy: uploader._id,
  });
}

export async function addTransfer(caseDoc, officer, overrides = {}) {
  return Transfer.create({
    masterCaseId: caseDoc.masterCaseId, caseId: caseDoc._id, fromBureau: 'PGRC', toBureau: 'RB', senderOfficerId: officer._id,
    reason: 'Synthetic transfer', status: 'ACCEPTED', requestedAt: new Date(), acknowledgedAt: new Date(), dueAt: new Date(Date.now() + 86400000), ...overrides,
  });
}

export async function addTask(caseDoc, overrides = {}) {
  const coordination = await Coordination.create({ institutionPid: caseDoc.institutionPid, caseIds: [caseDoc._id], participatingBureaus: ['RB', 'PGRC'], leadBureau: 'RB' });
  return CoordinationTask.create({
    coordinationId: coordination._id, caseId: caseDoc._id, assignedBureau: 'PGRC', title: 'Synthetic task',
    ackDueAt: new Date(Date.now() + 86400000), completionDueAt: new Date(Date.now() + 2 * 86400000), ...overrides,
  });
}

/** Approve a RuleBook version through the real two-step flow (requester differs from approver). */
export async function approveRule({ family, version, body }, requester, approver) {
  const draft = await createDraftVersion({ family, version, description: 'Synthetic S5 test rule', body, effectiveFrom: new Date(Date.now() - 1000), user: requester });
  await runDryRun(draft._id, requester);
  return approveVersion(draft._id, approver);
}

/** Propose, approve and close a case through NEXUS PROOF over HTTP. */
export async function closeThroughProof(ctx, caseDoc) {
  await addAction(caseDoc, ctx.officer);
  const doc = await addDocument(caseDoc, ctx.officer);
  const officer = await agent(ctx.app, ctx.officer);
  await officer.post(`/api/v1/cases/${caseDoc.masterCaseId}/closure/propose`).send({ closureReason: 'Refund issued by institution (synthetic)', evidenceDocumentIds: [String(doc._id)] }).expect(200);
  const sup = await agent(ctx.app, ctx.supervisor);
  await sup.post(`/api/v1/cases/${caseDoc.masterCaseId}/closure/approve`).expect(200);
  await sup.post(`/api/v1/cases/${caseDoc.masterCaseId}/closure/close`).expect(200);
  return Case.findById(caseDoc._id);
}
