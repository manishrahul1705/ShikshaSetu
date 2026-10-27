import { beforeEach, it, expect } from 'vitest';
import crypto from 'node:crypto';
import User from '../src/modules/auth/User.js';
import Case from '../src/modules/cases/Case.js';
import Query from '../src/modules/queries/models.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedIdentityReporters } from '../src/modules/identity/seed.js';
import { getReporterId } from '../src/modules/identity/index.js';
import { trackCase, listOwnCases } from '../src/modules/track/trackService.js';
import { responseRecord } from '../src/modules/additions/n88-first-redressal/service.js';
import { respondToQuery } from '../src/modules/queries/queryService.js';
import { monthlyLedger, monthlyReport } from '../src/modules/additions/n87-monthly-report/service.js';
import { normalizeRedressal } from '../src/modules/additions/n88-first-redressal/plugin.js';
import { workload, confirm } from '../src/modules/additions/n89-workload/service.js';
import { acceptTransfer } from '../src/modules/trace/traceService.js';
let officer, supervisor, c;
beforeEach(async () => {
  process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
  await seedDemoAccounts(); officer = await User.findOne({username:'rb_officer1'}); supervisor = await User.findOne({username:'supervisor1'});
  supervisor.bureau = officer.bureau; await supervisor.save();
  c = await Case.create({masterCaseId:'NX-2026-008001',reporterId:'RP-private',institutionPid:'1-1000000001',category:'Fee Dispute',subCategory:'Refund Denial',narrative:'Private narrative',narrativeHash:'h',owningBureau:officer.bureau,status:'Under Process',currentOwner:{office:officer.bureau,role:officer.role,officerId:officer._id},pidSnapshot:{region:'North'}});
});
it('[A-N86] own tracking exposes no internal fields and replies update N70 without false submitted status', async () => {
  await seedIdentityReporters(); const student = await User.findOne({username:'trust_student_verified'}); c.reporterId = await getReporterId(student.id); c.status='SUBMITTED';c.transferStatus='ACCEPTED';await c.save();
  const q = await Query.create({caseId:c._id,masterCaseId:c.masterCaseId,senderOfficerId:officer._id,senderRole:officer.role,senderBureau:officer.bureau,recipientType:'complainant',queryText:'Confirm your receipt date'});
  const view = await trackCase(student,c.id); expect(view.status).toBe('Transfer Accepted');expect(view.nextStepKey).toBe('reply');
  expect(JSON.stringify(view)).not.toMatch(/Private narrative|reporterId|senderOfficerId|officerName|internalNotes/);
  await respondToQuery(student,q.id,{responseText:'Received on 15 October.'});expect((await Query.findById(q.id)).status).toBe('RESPONDED');
  const other = await User.findOne({username:'trust_faculty_verified'});await expect(trackCase(other,c.id)).rejects.toMatchObject({status:404});
  expect((await listOwnCases(student))[0].queries[0].responseText).toBe('Received on 15 October.');
  expect(await listOwnCases(other)).toEqual([]);
});
it('[A-N87] monthly balances reconcile and every drill-down contains the counted records', async () => {
  const cases = [{_id:'a',masterCaseId:'NX-2026-008001',createdAt:new Date('2026-09-01'),owningBureau:'RB',status:'Under Process',pidSnapshot:{region:'North'}},{_id:'b',masterCaseId:'NX-2026-008002',createdAt:new Date('2026-10-02'),owningBureau:'PGRC',status:'Closed',pidSnapshot:{region:'North'}}];
  const report = monthlyLedger(cases,[{_id:'t',caseId:'a',status:'ACCEPTED',fromBureau:'PGRC',toBureau:'RB',acknowledgedAt:new Date('2026-10-10')}],[{caseId:'b',state:'CLOSED',closedAt:new Date('2026-10-20')}],[],{month:'2026-10'});
  expect(report.rows.every(r=>r.reconciles)).toBe(true);
  for(const row of report.rows) for(const [metric,count] of Object.entries(row.counts)) expect(row.cells[metric]).toHaveLength(count);
  await Case.create({masterCaseId:'NX-2026-008002',reporterId:'RP-other',institutionPid:'1-1000000001',category:'Fee Dispute',subCategory:'Refund Denial',narrative:'hidden',narrativeHash:'hidden',owningBureau:'Other Bureau'});
  const scoped = await monthlyReport(officer,{month:'2026-10'});expect(scoped.denominator).toBe(1);expect(JSON.stringify(scoped)).not.toContain('NX-2026-008002');
  expect((await monthlyReport(supervisor,{month:'2026-10',scope:'region',value:'North'})).denominator).toBe(1);
});
it('[A-N88] optional redressal accepts omission and negative answers without a policy gate', async () => {
  expect(normalizeRedressal(undefined)).toBeUndefined();expect(normalizeRedressal({answer:'NO'})).toEqual({answer:'NO'});
  c.institutionRedressal=normalizeRedressal({answer:'YES',raisedAt:'2026-10-01',outcome:'Awaiting response'});await c.save();expect((await Case.findById(c.id)).institutionRedressal.answer).toBe('YES');
  expect(Object.keys(normalizeRedressal({answer:'NO',score:99,rank:1}))).toEqual(['answer']);
  const record=await responseRecord(officer,c.institutionPid);expect(record.queriesOnTime.unavailable).toBe(true);expect(record.combinedAnswered.denominator).toBe(0);expect(JSON.stringify(record)).not.toMatch(/score|rank|narrative|reporterId/);
  await expect(responseRecord(officer,'1-1999999999')).rejects.toMatchObject({status:404});
});
it('[A-N89] suggestions never reassign and nominated same-bureau handover needs receiver acceptance', async () => {
  officer.isOnLeave=true;await officer.save();
  const receiver = await User.create({username:'ps_receiver',displayName:'Regulation Bureau Cover Officer',passwordHash:await User.hashPassword('local-only'),role:'bureau_officer',bureau:officer.bureau,active:true});
  const before=String(c.currentOwner.officerId);const data=await workload(supervisor);expect(data.threshold).toBeNull();expect(data.suggestions[0].toOfficerId).toBe(receiver.id);
  expect(String((await Case.findById(c.id)).currentOwner.officerId)).toBe(before);
  const handover=await confirm(supervisor,{caseId:c.masterCaseId,toOfficerId:receiver.id,reason:'Cover recorded leave'});
  expect(String((await Case.findById(c.id)).currentOwner.officerId)).toBe(before);
  await expect(acceptTransfer(supervisor,handover.transferId)).rejects.toMatchObject({status:403});
  await acceptTransfer(receiver,handover.transferId);const after=await Case.findById(c.id);expect(String(after.currentOwner.officerId)).toBe(receiver.id);expect(after.transferHistory.at(-1).status).toBe('ACCEPTED');
  await expect(workload({...supervisor.toObject(),bureau:null})).rejects.toMatchObject({status:403});
});
