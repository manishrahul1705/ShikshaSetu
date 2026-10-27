import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { setupS5, makeCase, agent, asSession, PID, OTHER_PID } from './s5-helpers.js';
import { institutionStatusSummary } from '../src/modules/institutionview/institutionViewService.js';
import { scheduleInspection, getVisitsForCase } from '../src/modules/fieldwork/fieldworkService.js';
import User from '../src/modules/auth/User.js';
import { sendQuery, getQueriesForCase, respondToQuery } from '../src/modules/queries/queryService.js';
import { listOverlaps } from '../src/modules/prevent/overlaps.js';
import Case from '../src/modules/cases/Case.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import Institution from '../src/modules/institutions/Institution.js';
import InstitutionIdentifier from '../src/modules/institutions/InstitutionIdentifier.js';

let ctx;
beforeEach(async () => { ctx = await setupS5(); });
afterEach(()=>vi.restoreAllMocks());

it('[S02] concurrent overlap reads share work only within the same actor and scope and every read is audited',async()=>{
  await makeCase(ctx.student,ctx.officer);
  const find=vi.spyOn(Case,'find');
  const user=asSession(ctx.officer);
  const [first,second]=await Promise.all([listOverlaps(user),listOverlaps(user)]);
  expect(first).toEqual(second);
  expect(find).toHaveBeenCalledTimes(1);
  expect(await AuditEvent.countDocuments({action:'prevent.overlaps.checked'})).toBe(2);
  await Promise.all([listOverlaps(user),listOverlaps(asSession(ctx.pgrc))]);
  expect(find).toHaveBeenCalledTimes(3);
  expect(await AuditEvent.countDocuments({action:'prevent.overlaps.checked'})).toBe(4);
});

it('[N70] query URLs accept Master Case IDs and both reading and replying recheck case ownership', async () => {
  const row = await makeCase(ctx.student, ctx.officer);
  const query = await sendQuery(ctx.officer, { caseId: row.masterCaseId, recipientType: 'complainant', queryText: 'Please confirm the supporting receipt reference.' });
  expect(await getQueriesForCase(ctx.student, row.masterCaseId)).toHaveLength(1);
  await expect(getQueriesForCase(ctx.faculty, row.masterCaseId)).rejects.toMatchObject({ status: 403 });
  await expect(respondToQuery(ctx.pgrc, query._id, { responseText: 'Outside scope' })).rejects.toMatchObject({ status: 403 });
  await expect(respondToQuery(ctx.faculty, query._id, { responseText: 'Not my case' })).rejects.toMatchObject({ status: 403 });
  expect((await respondToQuery(ctx.student, query._id, { responseText: 'The supporting record is attached to my case.' })).status).toBe('RESPONDED');
});

it('[N71] institution summary stays institution-scoped, has twelve months and never invents resolution days', async () => {
  await makeCase(ctx.student, ctx.officer);
  await makeCase(ctx.faculty, ctx.officer, { institutionPid: OTHER_PID });
  const summary = await institutionStatusSummary(ctx.instAdmin);
  expect(summary.institution.pid).toBe(PID);
  expect(summary.total).toBe(1);
  expect(summary.open).toBe(1);
  expect(summary.monthlyTrend).toHaveLength(12);
  expect(summary.monthlyTrend.reduce((sum, row) => sum + row.registered, 0)).toBe(1);
  expect(summary.resolution).toMatchObject({ averageDays: null, records: 0 });
  expect(summary.icidCheck).toBe('NOT_AVAILABLE');
  await Institution.updateOne({pid:PID},{$set:{icid:'IIC-JURY0001'}});
  await InstitutionIdentifier.create({icid:'IIC-JURY0001',pid:PID,status:'active',synthetic:true});
  expect((await institutionStatusSummary(ctx.instAdmin)).icidCheck).toBe('MATCH');
  expect(JSON.stringify(summary)).not.toContain('narrative');
  await expect(institutionStatusSummary(ctx.student)).rejects.toMatchObject({ status: 403 });
});

it('[N74] fieldwork accepts a Master Case ID and denies a different bureau both reads and scheduling', async () => {
  const row = await makeCase(ctx.student, ctx.officer);
  await scheduleInspection(ctx.officer, { caseId: row.masterCaseId, visitDate: new Date(), purpose: 'Review supporting institution records' });
  expect(await getVisitsForCase(ctx.officer, row.masterCaseId)).toHaveLength(1);
  await expect(getVisitsForCase(ctx.pgrc, row.masterCaseId)).rejects.toMatchObject({ status: 403 });
  await expect(scheduleInspection(ctx.pgrc, { caseId: row.masterCaseId, visitDate: new Date(), purpose: 'Outside scope' })).rejects.toMatchObject({ status: 403 });
});

it('[N01] accounts without a reporter see an unverified identity and empty consent ledger without a failed request', async () => {
  const officer = await agent(ctx.app, ctx.officer);
  expect((await officer.get('/api/v1/identity/me').expect(200)).body.status).toBe('unverified');
  expect((await officer.get('/api/v1/consents').expect(200)).body).toEqual([]);
});

it('[A-N60] current absences expose only office-scoped dates and titles, never another office or medical reason', async () => {
  ctx.pgrc.isOnLeave = true;
  ctx.pgrc.leaveDetails = { startDate: new Date(), reason: 'PRIVATE_MEDICAL_REASON' };
  await ctx.pgrc.save();
  const officer = await agent(ctx.app, ctx.officer);
  const scoped = (await officer.get('/api/v1/absence/status').expect(200)).body;
  expect(scoped.absences).toEqual([]);
  const supervisor = await agent(ctx.app, ctx.supervisor);
  const all = (await supervisor.get('/api/v1/absence/status').expect(200)).body;
  expect(all.absences).toHaveLength(1);
  expect(JSON.stringify(all)).not.toContain('PRIVATE_MEDICAL_REASON');
  const student = await agent(ctx.app, ctx.student);
  await student.get('/api/v1/absence/status').expect(403);
});
