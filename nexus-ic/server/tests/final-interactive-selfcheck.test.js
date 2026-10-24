import crypto from 'node:crypto';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import User from '../src/modules/auth/User.js';
import { Reporter, Fraud } from '../src/modules/identity/models.js';
import { Vault } from '../src/modules/vault/models.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import logger from '../src/config/logger.js';
import { serial } from '../src/modules/identity/support.js';
import { SYNTHETIC_AADHAAR_REGISTRY, verhoeffDigit, verhoeffValid } from '../src/modules/identity/selfCheck.js';
import { StudentVerification } from '../src/modules/identity/studentVerification.js';

// The later student-flow request supersedes instant confirmation and automatic referral.
// Keep the original privacy, consent, checksum, identity uniqueness and manual-path coverage.
const ABC = '1000-2000-3001', ABC_DIGITS = '100020003001';
const AADHAAR = SYNTHETIC_AADHAAR_REGISTRY[1].number;
const LABEL = 'Test verification \u00b7 no government email or SMS connection';
let app;
beforeAll(async () => { await Promise.all([Reporter.init(), Vault.init(), StudentVerification.init()]); });
beforeEach(async () => {
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');process.env.APP_MODE = 'demo';
  app=createApp(process.env.MONGODB_URI);await seedDemoAccounts();
  const first=await User.findOne({username:'student1'});
  await User.create({username:'selfcheck-second',passwordHash:first.passwordHash,role:'student',displayName:'Second test student',active:true,synthetic:true});
});
afterEach(async()=>{await serial(async()=>{});vi.restoreAllMocks();});
async function student(username='student1') {
 const agent=supertest.agent(app);await agent.post('/api/v1/auth/login').send({username,password:'demo1234'}).expect(200);return agent;
}
const lookup=(agent,kind='abc',number=ABC,extra={})=>agent.post('/api/v1/identity/student/lookup').send({kind,number,consent:true,...extra});
const send=agent=>agent.post('/api/v1/identity/student/send-otp').send({channel:'email',consent:true,detailsAreMine:true});
async function finish(agent) {
 await send(agent).expect(200);
 const delivery=await agent.get('/api/v1/identity/student/local-delivery').expect(200);
 return agent.post('/api/v1/identity/student/confirm-otp').send({code:delivery.body.code}).expect(200);
}
async function allStoredText() {
 const names=(await mongoose.connection.db.listCollections().toArray()).map(row=>row.name);
 return JSON.stringify(await Promise.all(names.map(name=>mongoose.connection.db.collection(name).find({}).toArray())));
}
describe('[A-N99] OTP-gated self-service ABC / Aadhaar test verification',()=>{
 it('[A-N99] ABC details remain unverified until linked OTP is confirmed; the legacy confirm route cannot bypass OTP',async()=>{
  const agent=await student();
  const result=await agent.post('/api/v1/identity/self-check/lookup').send({kind:'abc',number:ABC,consent:true}).expect(200);
  expect(result.body).toMatchObject({status:'confirm_details',last4:'3001',label:LABEL,details:{name:'Aarav Sharma',institutionPid:'1-7734299133',enrolment:'Active'}});
  expect(JSON.stringify(result.body)).not.toContain(ABC_DIGITS);
  expect((await Reporter.findOne({})).status).not.toBe('verified');
  const old=await agent.post('/api/v1/identity/self-check/confirm').send({kind:'abc',number:ABC,consent:true,detailsAreMine:true}).expect(409);
  expect(old.body.error).toBe('OTP_REQUIRED_USE_STUDENT_FLOW');
  await agent.post('/api/v1/identity/student/confirm-otp').send({code:'123456'}).expect(400);
  const done=await finish(agent);
  expect(done.body).toMatchObject({status:'verified',selfService:true,last4:'3001',label:LABEL});
  expect(await Fraud.countDocuments()).toBe(0);
  expect((await agent.get('/api/v1/identity/me')).body.status).toBe('verified');
 });
 it('[A-N99] a student without an ABC ID verifies an eligible Aadhaar-format test alias using linked OTP',async()=>{
  expect(AADHAAR).toMatch(/^1\d{11}$/);expect(verhoeffValid(AADHAAR)).toBe(true);
  const agent=await student();const result=await lookup(agent,'aadhaar',AADHAAR).expect(200);
  expect(result.body.details.name).toBe('Vikram Singh');
  expect((await Reporter.findOne({})).status).not.toBe('verified');
  expect((await finish(agent)).body).toMatchObject({status:'verified',kind:'aadhaar',last4:AADHAAR.slice(-4)});
 });
 it('[A-N99] bad checksums and unknown numbers are refused without verification or referral',async()=>{
  const agent=await student();const bad=AADHAAR.slice(0,11)+String((Number(AADHAAR[11])+1)%10);
  expect(verhoeffValid(bad)).toBe(false);
  expect((await lookup(agent,'aadhaar',bad).expect(400)).body.error).toBe('INVALID_TEST_AADHAAR');
  const base='10000000999',unknown=base+verhoeffDigit(base);
  expect((await lookup(agent,'aadhaar',unknown).expect(404)).body.error).toBe('STUDENT_ID_NOT_FOUND');
  expect((await Reporter.findOne({})).status).toBe('unverified');expect(await Fraud.countDocuments()).toBe(0);
 });
 it('[A-N99] mismatches, denied details, reused aliases and five wrong codes stay unverified without automatic manual referral',async()=>{
  const agent=await student();
  expect((await lookup(agent,'abc',ABC,{institutionPid:'1-7734299101'}).expect(409)).body.error).toBe('INSTITUTION_DOES_NOT_MATCH');
  await lookup(agent).expect(200);
  await agent.post('/api/v1/identity/student/send-otp').send({channel:'email',consent:true,detailsAreMine:false}).expect(400);
  await send(agent).expect(200);const delivery=await agent.get('/api/v1/identity/student/local-delivery');
  const wrong=delivery.body.code==='000000'?'111111':'000000';
  for(let i=0;i<5;i++)await agent.post('/api/v1/identity/student/confirm-otp').send({code:wrong}).expect(400);
  await agent.post('/api/v1/identity/student/confirm-otp').send({code:delivery.body.code}).expect(400);
  expect((await Reporter.findOne({})).status).toBe('unverified');expect(await Fraud.countDocuments()).toBe(0);
  const other=await student('selfcheck-second');await lookup(other).expect(200);await finish(other);
  const alias=SYNTHETIC_AADHAAR_REGISTRY[0].number;
  expect((await lookup(agent,'aadhaar',alias).expect(409)).body.error).toBe('ID_ALREADY_LINKED');
  expect(await Reporter.countDocuments({status:'verified'})).toBe(1);
  expect(await Reporter.countDocuments({status:'manual_review'})).toBe(0);
  expect(await Fraud.countDocuments()).toBe(0);
  const officer=await student('rb_officer1');expect((await officer.get('/api/v1/identity/manual-verification')).body).toEqual([]);
 });
 it('[A-N99] no raw identifiers or OTP are stored, logged or audited; hashes and last four digits remain',async()=>{
  const logged=[];for(const level of ['info','warn','error','debug'])vi.spyOn(logger,level).mockImplementation((...args)=>logged.push(JSON.stringify(args)));
  const agent=await student();await lookup(agent).expect(200);await send(agent).expect(200);
  const inbox=await agent.get('/api/v1/identity/student/local-delivery');
  await agent.post('/api/v1/identity/student/confirm-otp').send({code:inbox.body.code}).expect(200);
  const stored=await allStoredText(),audits=JSON.stringify(await AuditEvent.find().lean());
  for(const raw of [ABC_DIGITS,ABC,AADHAAR,inbox.body.code]){expect(stored).not.toContain(raw);expect(logged.join('\n')).not.toContain(raw);expect(audits).not.toContain(raw);}
  expect(audits).toContain('identity.student.self_service_completed');
  const row=await StudentVerification.findOne().lean();expect(row.last4).toBe('3001');expect(row.referenceHash).toMatch(/^[a-f0-9]{64}$/);expect(row.otpHash).toMatch(/^[a-f0-9]{64}$/);
 });
 it('[A-N99] responses disclose local test delivery, require consent and reject non-student callers',async()=>{
  const agent=await student();expect((await lookup(agent,'abc',ABC,{consent:false}).expect(400)).body.error).toBe('CONSENT_REQUIRED');
  expect((await lookup(agent).expect(200)).body.label).toBe(LABEL);
  const sent=await send(agent).expect(200);expect(sent.body).toMatchObject({label:LABEL,deliveryMode:'local'});expect(sent.body.code).toBeUndefined();
  expect((await agent.get('/api/v1/identity/student/local-delivery')).body.label).toBe(LABEL);
  const faculty=await student('faculty1');await lookup(faculty).expect(403);
 });
 it('[A-N99] explicit officer-assisted verification remains available and cannot be silently replaced by self-service',async()=>{
  const agent=await student();const started=await agent.post('/api/v1/auth/verify/student').send({userType:'student',reference:'MANUAL-PERSON-1',consent:true,manual:true}).expect(200);
  expect(started.body).toMatchObject({status:'manual_review',verificationMethod:'officer_assisted'});
  expect((await lookup(agent).expect(409)).body.error).toBe('ACCOUNT_NOT_ELIGIBLE');
  const officer=await student('rb_officer1');expect((await officer.get('/api/v1/identity/manual-verification')).body).toHaveLength(1);
  expect(await Reporter.countDocuments({status:'verified'})).toBe(0);
 });
});
