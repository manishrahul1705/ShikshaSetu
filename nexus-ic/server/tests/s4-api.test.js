import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/modules/auth/User.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedIdentityReporters } from '../src/modules/identity/seed.js';
import { getReporterId, getVerifiedInstitutionPid } from '../src/modules/identity/index.js';
import { start, issueOtp, readInbox, confirmOtp } from '../src/modules/identity/service.js';
import { AbcApaarSimulator } from '../src/modules/identity/simulators.js';
import Institution from '../src/modules/institutions/Institution.js';
import Case from '../src/modules/cases/Case.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import logger from '../src/config/logger.js';
import { checkSimilar, chooseSimilar } from '../src/modules/prevent/stage1.js';
import { checkAction, proceedAction, actionSubject } from '../src/modules/prevent/stage2.js';
import { coSign, coSignSummary } from '../src/modules/prevent/cosign.js';
import { listOverlaps } from '../src/modules/prevent/overlaps.js';
import { matchCases } from '../src/modules/prevent/matcher.js';
import { SimilarityCheck, CaseAction, PreventAlert } from '../src/modules/prevent/models.js';
import { fictionalInstitutions } from '../src/modules/registry/catalogue.js';
const pid = fictionalInstitutions()[0].pid;
const narrative = 'Synthetic laboratory refund fee remains unpaid after request';
let app, student, faculty, officer, supervisor, seq;
const subject = row => ({ ...row.toObject(), id: row.id });
beforeEach(async () => {
  seq = 400; process.env.APP_MODE = 'demo';
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  await seedDemoAccounts(); await seedIdentityReporters();
  [student, faculty, officer, supervisor] = await Promise.all(['trust_student_verified','trust_faculty_verified','rb_officer1','supervisor1'].map(username => User.findOne({username})));
  await Institution.create({ pid, name: 'Synthetic S4 fixture institution', state: 'DEMO state', region: 'Northern', type: 'DEMO', synthetic: true });
  app = createApp(process.env.MONGODB_URI);
});
afterEach(() => vi.restoreAllMocks());
async function makeCase(user = student, overrides = {}) {
  seq++;
  return Case.create({ masterCaseId: `NX-2026-${String(seq).padStart(6,'0')}`, reporterId: await getReporterId(user.id),
    ...(Case.schema.path('userId') ? { userId: user._id } : {}), institutionPid: pid, category: 'Fee Dispute', subCategory: 'Refund Denial', narrative,
    narrativeHash: `synthetic-${seq}`, status: 'SUBMITTED', owningBureau: officer.bureau, pidSnapshot: { region: 'Northern' }, synthetic: true, ...overrides });
}
async function agent(user) { const result = supertest.agent(app); await result.post('/api/v1/auth/login').send({username:user.username,password:'demo1234'}).expect(200); return result; }
const draft = () => ({ institutionPid: pid, category: 'Fee Dispute', subCategory: 'Refund Denial', narrative: narrative + ' and a new detail' });
it('[S23] a third-party match reveals only the generic notice in JSON and persisted hints', async () => {
  const original = await makeCase(student);
  const requester = await agent(faculty);
  const response = await requester.post('/api/v1/grievances/check-similar').send(draft()).expect(200);
  expect(response.body.hints[0].notice).toBe('a similar open matter exists');
  const serialized = JSON.stringify(response.body);
  for (const secret of [narrative, original.reporterId, original.masterCaseId, student.id]) expect(serialized).not.toContain(secret);
  const saved = await SimilarityCheck.findById(response.body.checkId).lean();
  expect(saved.shownHints).toEqual(['GENERIC']);
  expect(JSON.stringify(saved)).not.toContain(original.masterCaseId); expect(JSON.stringify(saved)).not.toContain(narrative);
  const forged = await requester.post('/api/v1/grievances/check-similar/choice').send({checkId: saved._id,choice:'view',caseId:original.masterCaseId}).expect(404);
  expect(forged.body.error).toBe('CASE_NOT_FOUND');
});
it('[U14] own earlier cases explain similarity and continue, view and cancel choices are logged', async () => {
  const own = await makeCase(); const requester = await agent(student);
  const response = await requester.post('/api/v1/grievances/check-similar').send(draft()).expect(200);
  expect(response.body.canProceed).toBe(true); expect(response.body.hints[0].caseId).toBe(own.masterCaseId);
  expect(response.body.hints[0].signals).toHaveLength(7);
  for (const choice of ['continue','view','cancel']) {
    await requester.post('/api/v1/grievances/check-similar/choice').send({checkId:response.body.checkId,choice,...(choice==='view'?{caseId:own.masterCaseId}:{})}).expect(200);
    expect((await SimilarityCheck.findById(response.body.checkId)).userChoice).toBe(choice);
    expect(await AuditEvent.exists({action:`prevent.similarity.choice.${choice}`})).toBeTruthy();
  }
});
it('[N16] similar and genuinely different drafts both submit independently of PREVENT advice', async () => {
  await makeCase(); const requester = await agent(student);
  const similar = draft();
  const hint = await requester.post('/api/v1/grievances/check-similar').send(similar).expect(200);
  expect(hint.body.result).toBe('REVIEW');
  await requester.post('/api/v1/grievances').send(similar).expect(201);
  const different = { ...draft(), category:'Infrastructure', subCategory:'Building Safety', narrative:'Synthetic kitchen plumbing drain repair is needed' };
  expect((await requester.post('/api/v1/grievances/check-similar').send(different).expect(200)).body.result).toBe('CLEAR');
  await requester.post('/api/v1/grievances').send(different).expect(201);
  expect(await SimilarityCheck.countDocuments()).toBe(2);
});
it('[N17] repeated document request, cross-bureau overlap and opposing instructions give advisory REVIEW', async () => {
  const target = await makeCase();
  const input = {caseId:target.id,actionType:'DOCUMENT_REQUEST',details:{subject:'Synthetic fee receipt'}};
  await CaseAction.create({caseId:target._id,institutionPid:pid,bureau:'Other synthetic bureau',actorId:'synthetic-officer',actorRole:'bureau_officer',actionType:input.actionType,subjectKey:actionSubject(input.details,input.actionType),at:new Date()});
  const result = await checkAction(subject(officer), input);
  expect(result.result).toBe('REVIEW'); expect(result.reasons).toEqual(expect.arrayContaining(['REPEATED_DOCUMENT_REQUEST','OVERLAPPING_BUREAU_ACTION']));
  expect(result.counterReasons.length).toBeGreaterThan(0); expect(result.canProceed).toBe(true);
  expect((await proceedAction(subject(officer),result.checkId,'Reviewed the existing receipt request; recording the fixture action for comparison.')).proceeded).toBe(true);
  const instruction={caseId:target.id,actionType:'INSTRUCTION',details:{subject:'Synthetic same instruction',direction:'DENY'}};
  await CaseAction.create({caseId:target._id,institutionPid:pid,bureau:'Other synthetic bureau',actorId:'synthetic-officer',actorRole:'bureau_officer',actionType:'INSTRUCTION',subjectKey:actionSubject({...instruction.details,direction:'ALLOW'},'INSTRUCTION'),at:new Date()});
  const conflict=await checkAction(subject(officer),instruction);
  expect(conflict.result).toBe('REVIEW'); expect(conflict.reasons).toContain('CONFLICTING_INSTRUCTION'); expect(conflict.counterReasons.length).toBeGreaterThan(0);
  await proceedAction(subject(officer),conflict.checkId,'Reviewed the opposing instruction and recorded an explicit human decision for the fixture.');
  expect(await AuditEvent.countDocuments({action:'prevent.action.proceeded'})).toBe(2); expect(await PreventAlert.countDocuments()).toBe(2);
});
it('[N17] missing and stale feeds give UNKNOWN, a clean fresh feed CLEAR, and every result permits proceeding', async () => {
  const target = await makeCase(); const input={caseId:target.id,actionType:'DOCUMENT_REQUEST',details:{subject:'Synthetic document'}};
  const before = JSON.stringify((await Case.findById(target.id)).toObject());
  const missing=await checkAction(subject(officer),input); expect(missing.result).toBe('UNKNOWN'); expect(missing.reasons).toContain('ACTION_FEED_MISSING');
  await proceedAction(subject(officer),missing.checkId);
  await CaseAction.updateMany({},{$set:{at:new Date(Date.now()-48*60*60*1000)}});
  const stale=await checkAction(subject(officer),input); expect(stale.result).toBe('UNKNOWN'); expect(stale.reasons).toContain('ACTION_FEED_STALE');
  await proceedAction(subject(officer),stale.checkId);
  await CaseAction.deleteMany({});
  await CaseAction.create({caseId:target._id,institutionPid:pid,bureau:officer.bureau,actorId:officer.id,actorRole:officer.role,actionType:'INSPECTION',subjectKey:actionSubject({subject:'Different synthetic subject'},'INSPECTION'),at:new Date()});
  const clean=await checkAction(subject(officer),input); expect(clean.result).toBe('CLEAR'); expect(clean.counterReasons.length).toBeGreaterThan(0);
  await proceedAction(subject(officer),clean.checkId);
  expect(JSON.stringify((await Case.findById(target.id)).toObject())).toBe(before);
  expect(await AuditEvent.countDocuments({action:'prevent.action.proceeded'})).toBe(3);
});
it('[N17] production action check is UNKNOWN and its Proceed endpoint still works', async () => {
  const target=await makeCase(); const requester=await agent(officer); process.env.APP_MODE='production';
  try {
    const result=(await requester.post('/api/v1/prevent/check-action').send({caseId:target.id,actionType:'NOTICE',details:{subject:'Synthetic notice'}}).expect(200)).body;
    expect(result.result).toBe('UNKNOWN'); expect(result.reasons).toContain('POLICY_NOT_CONFIGURED');
    expect((await requester.post(`/api/v1/prevent/check-action/${result.checkId}/proceed`).send({}).expect(200)).body.proceeded).toBe(true);
  } finally { process.env.APP_MODE='demo'; }
});
it('[N17] overlap and alert responses expose accessible cases only and count restricted entries', async () => {
  const target=await makeCase(); const hidden=await makeCase(faculty,{owningBureau:'Other synthetic bureau'});
  const requester=await agent(officer);
  const response=(await requester.get('/api/v1/prevent/overlaps').expect(200)).body;
  expect(response.pairs).toEqual([]); expect(response.restrictedCount).toBe(1);
  expect(JSON.stringify(response)).not.toContain(hidden.masterCaseId);
  const all=await listOverlaps(subject(supervisor)); expect(all.pairs[0].cases).toEqual([target.masterCaseId,hidden.masterCaseId]);
  const checked=(await requester.post('/api/v1/prevent/check-action').send({caseId:target.id,actionType:'OTHER',details:{subject:'Synthetic alert'}}).expect(200)).body;
  expect(checked.result).toBe('UNKNOWN');
  const alerts=(await requester.get('/api/v1/prevent/alerts').expect(200)).body;
  expect(alerts[0].caseId).toBe(target.masterCaseId); expect(JSON.stringify(alerts)).not.toContain(student.id);
  const studentAgent=await agent(student); await studentAgent.get('/api/v1/prevent/overlaps').expect(403);
});
it('[A-N59] verified institution helper returns only the encrypted evidence PID, never identity', async () => {
  expect(await getVerifiedInstitutionPid(student.id)).toBe(pid);
  expect(await getVerifiedInstitutionPid(faculty.id)).toBeNull();
  expect(await getVerifiedInstitutionPid((await User.findOne({username:'trust_student_unverified'})).id)).toBeNull();
  expect(typeof await getVerifiedInstitutionPid(student.id)).toBe('string');
});
it('[A-N59] fourteen unique co-signs leave priority, routing and PREVENT byte-identical; duplicates fail and officers see only count', async () => {
  const target=await makeCase(); const before=JSON.stringify((await Case.findById(target.id)).toObject());
  const matcherBefore=JSON.stringify(await matchCases(draft(), target.toObject()));
  const matchBefore=JSON.stringify(await checkSimilar(subject(student),draft()));
  const originalVerify=AbcApaarSimulator.verify;
  vi.spyOn(AbcApaarSimulator,'verify').mockImplementation(reference=>reference.startsWith('COSIGN-')?{synthetic:true,personRef:reference,institutionPid:pid,currentEnrolment:true}:originalVerify(reference));
  const passwordHash=await User.hashPassword('demo1234');
  let first;
  for(let i=0;i<14;i++) {
    const user=await User.create({username:`synthetic_cosign_${i}`,passwordHash,role:'student',displayName:'Synthetic co-signer',synthetic:true});
    const identityUser={id:user.id,role:'student'};
    await start(identityUser,{userType:'student',reference:`COSIGN-${i}`,consent:true}); await issueOtp(identityUser,true); await confirmOtp(identityUser,readInbox(identityUser).entries[0].otp);
    await coSign(identityUser,target.id); first ||= identityUser;
  }
  await expect(coSign(first,target.id)).rejects.toMatchObject({code:'ALREADY_COSIGNED'});
  const summary=await coSignSummary(subject(officer),target.id); expect(summary).toEqual({count:14}); expect(JSON.stringify(summary)).not.toMatch(/RP-|userId|reporterId|name/);
  expect(JSON.stringify((await Case.findById(target.id)).toObject())).toBe(before);
  expect(JSON.stringify(await matchCases(draft(), (await Case.findById(target.id)).toObject()))).toBe(matcherBefore);
  const matchAfter=await checkSimilar(subject(student),draft());
  const old=JSON.parse(matchBefore); delete old.checkId; delete matchAfter.checkId; expect(JSON.stringify(matchAfter)).toBe(JSON.stringify(old));
  const unverified=await User.findOne({username:'trust_student_unverified'}); await expect(coSign(subject(unverified),target.id)).rejects.toMatchObject({status:404});
});
it('[S28] similarity and action checks never send complaint text or action details to the logger', async () => {
  const target=await makeCase(); const spies=['info','warn','error','debug'].map(key=>vi.spyOn(logger,key));
  await checkSimilar(subject(student),draft()); await checkAction(subject(officer),{caseId:target.id,actionType:'NOTICE',details:{subject:'Private synthetic action detail'}});
  const logged=JSON.stringify(spies.flatMap(spy=>spy.mock.calls)); expect(logged).not.toContain(narrative); expect(logged).not.toContain('Private synthetic action detail');
});
