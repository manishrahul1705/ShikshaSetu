import { beforeEach, it, expect } from 'vitest';
import crypto from 'node:crypto';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedIdentityReporters } from '../src/modules/identity/seed.js';
import { EmailDraft, ImportBatch, EmailOutbox } from '../src/modules/channels/models.js';
import Case from '../src/modules/cases/Case.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { verifyChain } from '../src/modules/audit/audit.js';
import { listInstitutions } from '../src/modules/registry/RegistrySimulator.js';
import { parseCsv } from '../src/modules/channels/csv.js';
import { adapters, ADAPTER_SOURCES } from '../src/modules/adapters/index.js';
import { resolveVerifiedSender, getReporterId } from '../src/modules/identity/index.js';
import User from '../src/modules/auth/User.js';
import { SenderBinding, hashSender } from '../src/modules/identity/senders.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import { BenchmarkRun } from '../src/modules/benchmark/service.js';
let app, agent, admin, reporterId;
const institution = listInstitutions(1)[0];
const payload = { sender: 'trust_student_verified@synthetic.invalid', institutionPid: institution.pid, category: 'Infrastructure', subCategory: 'Lab Equipment', narrative: '  Synthetic lab equipment complaint\nதமிழ் शिकायत — unchanged.  ' };
const csv = (ref='SYNTH-IMPORT-1',icid='') => 'reporterId,institutionPid,institutionIcid,category,subCategory,narrative,sourceSystem,sourceRef\r\n'+`${reporterId},${institution.pid},${icid},Infrastructure,Lab Equipment,"Synthetic CSV ${ref}\nशिकायत with ""quotes""",SyntheticSystem,${ref}`;
beforeEach(async () => {
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex'); process.env.APP_MODE = 'demo';
  await seedDemoAccounts(); await seedIdentityReporters();
  await Promise.all([EmailDraft.init(), ImportBatch.init(), Case.init()]);
  reporterId = await getReporterId((await User.findOne({username:'trust_student_verified'})).id);
  app = createApp(process.env.MONGODB_URI); agent = supertest.agent(app);
  await agent.post('/api/v1/auth/login').send({ username: 'trust_student_verified', password: 'demo1234' }).expect(200);
  admin=supertest.agent(app);await admin.post('/api/v1/auth/login').send({username:'sysadmin1',password:'demo1234'}).expect(200);
});
it('[U15] unverified email creates neither a case nor a draft and stores no sender/body in audit', async () => {
  for(const sender of ['trust_student_unverified@synthetic.invalid','unknown@synthetic.invalid']) {
    const result=await admin.post('/api/v1/channels/email/inbound').send({...payload,sender}).expect(200);
    expect(result.body.outcome).toBe('SENDER_NOT_VERIFIED');expect(result.body.reply).toContain('verification');
    expect(await resolveVerifiedSender(sender)).toBeNull();
  }
  expect(await Case.countDocuments()).toBe(0);expect(await EmailDraft.countDocuments()).toBe(0);expect(await EmailOutbox.countDocuments()).toBe(2);
  const events=await AuditEvent.find({action:'channels.email.inbound'}).lean();
  expect(events).toHaveLength(2);
  for(const event of events) expect(Object.keys(event.meta).sort()).toEqual(['channel','outcome','senderHash']);
  const stored=JSON.stringify([await EmailOutbox.find().lean(),events,await SenderBinding.find().lean()]);
  expect(stored).not.toContain(payload.narrative);expect(stored).not.toContain('@synthetic.invalid');
  expect(events[0].meta).toEqual({channel:'EMAIL',outcome:'SENDER_NOT_VERIFIED',senderHash:hashSender('trust_student_unverified@synthetic.invalid')});
});
it('[N15] verified email is an encrypted DRAFT until edited preview and explicit confirmation, replay stays one case',async()=>{
  expect(await resolveVerifiedSender('  TRUST_STUDENT_VERIFIED@SYNTHETIC.INVALID  ')).toMatchObject({reporterId,userId:expect.any(String)});
  const received=await admin.post('/api/v1/channels/email/inbound').send({...payload,attachments:[{filename:'never-store.pdf',content:'secret-attachment'}]}).expect(200);
  const id=received.body.id;expect(received.body.status).toBe('AWAITING_CONFIRMATION');expect(received.body.attachmentNote).toContain('dropped');
  expect(await Case.countDocuments()).toBe(0);
  const stored=JSON.stringify(await EmailDraft.find().lean());
  for(const value of [payload.narrative,payload.sender,'never-store.pdf','secret-attachment']) expect(stored).not.toContain(value);
  const listing=await agent.get('/api/v1/channels/email').expect(200);expect(listing.body[0]).toMatchObject({id,channel:'EMAIL',status:'AWAITING_CONFIRMATION'});
  await agent.post(`/api/v1/channels/email/${id}/confirm`).send({}).expect(409);
  const other=supertest.agent(app);await other.post('/api/v1/auth/login').send({username:'trust_faculty_verified',password:'demo1234'}).expect(200);
  await other.get(`/api/v1/channels/email/${id}`).expect(404);
  const preview=await agent.post(`/api/v1/channels/email/${id}/preview`).send(payload).expect(200);
  expect(preview.body.draft.narrative).toBe(payload.narrative);
  const confirmed=await agent.post(`/api/v1/channels/email/${id}/confirm`).send({previewToken:preview.body.previewToken}).expect(200);
  await agent.post(`/api/v1/channels/email/${id}/confirm`).send({previewToken:preview.body.previewToken}).expect(200);
  const row=await Case.findOne({masterCaseId:confirmed.body.masterCaseId}).lean();
  expect(row.channel).toBe('EMAIL');expect(row.narrative).toBe(payload.narrative);expect(await Case.countDocuments()).toBe(1);
  expect((await verifyChain()).intact).toBe(true);
});
it('[N15] CSV uses S2 preview, dry-run and idempotent commit with pseudonym and institution snapshots',async()=>{
 const parsed=parseCsv(csv());expect(parsed[0].narrative).toBe('Synthetic CSV SYNTH-IMPORT-1\nशिकायत with "quotes"');
 await agent.post('/api/v1/channels/import/preview').send({csv:csv()}).expect(403);
 const preview=await admin.post('/api/v1/channels/import/preview').send({csv:csv()}).expect(200),id=preview.body.id;
 expect(preview.body.rows[0].status).toBe('WOULD_CREATE');expect(JSON.stringify(await ImportBatch.find().lean())).not.toContain('Synthetic CSV');
 await admin.post(`/api/v1/channels/import/${id}/commit`).send({}).expect(409);
 const dry=await admin.post(`/api/v1/channels/import/${id}/dry-run`).send({}).expect(200);expect(dry.body.ready).toBe(1);
 const first=await admin.post(`/api/v1/channels/import/${id}/commit`).send({}).expect(200);
 const replay=await admin.post(`/api/v1/channels/import/${id}/commit`).send({}).expect(200);
 expect(first.body.created).toBe(1);expect(replay.body.created).toBe(0);expect(replay.body.skipped).toBe(1);
 const row=await Case.findOne().lean();expect(row.reporterId).toBe(reporterId);expect(row.channel).toBe('IMPORT');expect(row.narrative).toBe(parsed[0].narrative);
 expect(row.externalRefs[0]).toMatchObject({sourceSystem:'SyntheticSystem',sourceRef:'SYNTH-IMPORT-1',sourceCaseRef:'SYNTH-IMPORT-1'});
 expect(row.pidSnapshot.name).toBe(institution.name);expect(row.icidSnapshot).toHaveProperty('icid');
 expect(JSON.stringify(first.body)).not.toMatch(/narrative|senderHash|encryptedPayload/);
});
it('[N15] PID/ICID mismatch is quarantined, forbidden roles and production simulator writes are denied',async()=>{
 const preview=await admin.post('/api/v1/channels/import/preview').send({csv:csv('SYNTH-CONFLICT','IIC-CONFLICT')}).expect(200),id=preview.body.id;
 expect(preview.body.quarantined).toEqual([1]);expect(preview.body.rows[0].status).toBe('IDENTITY_REVIEW');
 const dry=await admin.post(`/api/v1/channels/import/${id}/dry-run`).send({}).expect(200);expect(dry.body.ready).toBe(0);
 const committed=await admin.post(`/api/v1/channels/import/${id}/commit`).send({}).expect(200);expect(committed.body.created).toBe(0);expect(committed.body.quarantined).toEqual([1]);
 expect((await admin.get('/api/v1/channels/import/review').expect(200)).body[0]).toMatchObject({row:1,status:'IDENTITY_REVIEW'});expect(await Case.countDocuments()).toBe(0);
 await supertest(app).post('/api/v1/channels/email/inbound').send(payload).expect(401);
 await agent.post('/api/v1/channels/email/inbound').send(payload).expect(403);
 process.env.APP_MODE='production';await admin.post('/api/v1/channels/email/inbound').send(payload).expect(503);
});
it('[N32] AICTE and CPGRAMS adapter simulators expose snapshots and watermarks without external calls',async()=>{
 expect(ADAPTER_SOURCES).toEqual(['AICTE systems','institution registry','CPGRAMS']);
 for(const source of ADAPTER_SOURCES) {
  const snapshot=await adapters[source].simulator.snapshot('SYNTHETIC-WATERMARK');
  expect(snapshot).toMatchObject({sourceSystem:source,synthetic:true,watermark:'SYNTHETIC-WATERMARK'});expect(snapshot.records.length).toBeGreaterThan(0);
  expect(snapshot.records[0].institutionIdentifiers.pid).toMatch(/^1-\d{10}$/);
  expect(await adapters[source].real.snapshot()).toEqual({result:'CONTRACT_NOT_CONFIGURED'});
 }
});
it('[N15] web API records PWA only for an explicit standalone signal, WEB otherwise',async()=>{
 for(const [standalone,channel] of [['true','PWA'],['false','WEB']]) {
  const result=await agent.post('/api/v1/grievances').set('X-Client-Standalone',standalone).send({...payload,narrative:`Synthetic standalone ${standalone} grievance`}).expect(201);
  expect((await Case.findOne({masterCaseId:result.body.masterCaseId})).channel).toBe(channel);
 }
});
it('[A-N48] benchmark runs are scoped to supervisor and system_admin and retain real rule version and runtime',async()=>{
 await agent.get('/api/v1/benchmark').expect(403);
 const supervisor=supertest.agent(app);await supervisor.post('/api/v1/auth/login').send({username:'supervisor1',password:'demo1234'}).expect(200);
 const unknown=await supervisor.post('/api/v1/benchmark').send({}).expect(200);expect(unknown.body.status).toBe('UNKNOWN');expect(unknown.body.accuracyPercent).toBeNull();
 await seedRuleBook();
 const result=await admin.post('/api/v1/benchmark').send({}).expect(200);
 expect(result.body.ruleVersion).toBe('DEMO-OVERLAP-v1');expect(result.body.runtimeMs).toBeGreaterThanOrEqual(0);expect(result.body.denominator).toBe(3000);
 expect(result.body.accuracyPercent).toBe(result.body.numerator/result.body.denominator*100);
 expect(BenchmarkRun.collection.name).toBe('benchmark_runs');expect(await BenchmarkRun.countDocuments()).toBe(2);
});
