import { beforeEach, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import Case from '../src/modules/cases/Case.js';
import Institution from '../src/modules/institutions/Institution.js';
import User from '../src/modules/auth/User.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedReminderRule } from '../src/modules/additions/n108-reminders/seed.js';
import { searchCases, exportSearchCsv, dayBoundary } from '../src/modules/additions/n104-case-search/service.js';
import { decodeInvisible } from '../src/modules/additions/n55-watermark/service.js';
import { additionalTiles } from '../src/modules/additions/n105-dashboard-tiles/service.js';
import { pct, buildImpactReport } from '../src/modules/impact/impactService.js';
import { drillDown } from '../src/modules/additions/n47-drilldown/service.js';
import { Transfer } from '../src/modules/trace/models.js';
import { CaseAction } from '../src/modules/prevent/models.js';
import { caseSummary } from '../src/modules/additions/n106-case-summary/service.js';
import { monthlyLedger, monthlyReport } from '../src/modules/additions/n87-monthly-report/service.js';
import { composeQuarter, quarterlyReport, quarterMonths, disposalRate, statusWise, withDisposalRates } from '../src/modules/additions/n107-quarterly-reports/service.js';
import { reminderCandidates, runReminders, reminderItems, PendingReminder } from '../src/modules/additions/n108-reminders/service.js';
import { addressFor, optionalAddressRows } from '../src/modules/additions/n109-institution-address/seed.js';
import { parseOfficialCsv } from '../src/modules/registry/adapters.js';
let supervisor, rb, regional;
const now = new Date('2026-10-28T12:00:00Z');
async function create(n, extra = {}) {
  return Case.create({ masterCaseId: `NX-2026-${String(n).padStart(6, '0')}`, institutionPid: '1-1000000001', reporterId: 'RP-private', category: 'Fee Dispute', subCategory: 'Refund', narrative: 'Private narrative must never be exported', narrativeHash: String(n), owningBureau: 'RB', status: 'Under Process', analyticStatus: 'IN_PROCESS', createdAt: new Date('2026-10-01T00:00:00Z'), pidSnapshot: { name: 'Fictional College', region: 'Northern' }, ...extra });
}
beforeEach(async () => {
  await seedDemoAccounts();
  supervisor = await User.findOne({ username: 'supervisor1' }); rb = await User.findOne({ username: 'rb_officer1' }); regional = await User.findOne({ username: 'regional1' });
  await Institution.create({ pid: '1-1000000001', name: 'Fictional College', region: 'Northern', state: 'Delhi', type: 'Engineering' });
});
it('[A-N104] every PS filter alone and combined narrows server-side results', async () => {
  const c = await create(1); await create(2, { institutionPid: '1-1000000002', category: 'Technical Norms', status: 'Assigned', owningBureau: 'PGRC', pidSnapshot: { name: 'Another Institute', region: 'Southern' }, createdAt: new Date('2026-09-01') });
  const filters = { q: 'fictional', pid: c.institutionPid, caseId: c.masterCaseId, bureau: 'Regulation Bureau', region: 'Northern', category: 'Fee Dispute', status: 'Under Process', from: '2026-10-01', to: '2026-10-28' };
  for (const [key, value] of Object.entries(filters)) expect((await searchCases(supervisor, { [key]: value })).rows.map(r => r.masterCaseId), key).toEqual(key === 'to' ? [c.masterCaseId, 'NX-2026-000002'] : [c.masterCaseId]);
  expect((await searchCases(supervisor, filters)).total).toBe(1);
  expect((await searchCases(supervisor, { q: '.*' })).total).toBe(0);
  expect((await searchCases(supervisor, { q: '[' })).total).toBe(0);
});
it('[A-N104] Kolkata date edges, invalid dates, scope, pagination and IDOR are enforced', async () => {
  await create(1, { createdAt: new Date('2026-09-30T18:30:00Z') });
  await create(2, { createdAt: new Date('2026-10-01T18:29:59.999Z') });
  await create(3, { createdAt: new Date('2026-10-01T18:30:00Z'), owningBureau: 'PGRC', pidSnapshot: { region: 'Southern' } });
  expect((await searchCases(supervisor, { from: '2026-10-01', to: '2026-10-01' })).total).toBe(2);
  expect(() => dayBoundary('2026-02-30')).toThrow();
  expect((await searchCases(rb)).total).toBe(2); expect((await searchCases(regional)).total).toBe(2);
  expect((await searchCases(rb, { caseId: 'NX-2026-000003' })).total).toBe(0);
  const page = await searchCases(supervisor, { page: '2', pageSize: '1' }); expect(page.rows).toHaveLength(1); expect(page.rows[0].masterCaseId).toBe('NX-2026-000002');
  expect(JSON.stringify(page)).not.toMatch(/Private narrative|reporterId|internalNotes/);
});
it('[A-N104] the search endpoint and existing case route both resolve without route capture', async () => {
  const c = await create(1), app = createApp(process.env.MONGODB_URI), agent = request.agent(app);
  await agent.post('/api/v1/auth/login').send({ username: 'supervisor1', password: 'demo1234' }).expect(200);
  await agent.get('/api/v1/case-search?caseId=' + c.masterCaseId).expect(200);
  await agent.get('/api/v1/cases/' + c.masterCaseId).expect(200);
  await agent.get('/api/v1/cases/' + c.masterCaseId + '/journey').expect(200);
});
it('[A-N104] CSV exports the current filter with N55 attribution and no inaccessible cases or narratives', async () => {
  const c = await create(1); await create(2, { owningBureau: 'PGRC' });
  const csv = await exportSearchCsv(rb, { pid: c.institutionPid });
  expect(csv).toContain(c.masterCaseId); expect(csv).not.toContain('NX-2026-000002');
  expect(csv).toContain('Exported by'); expect(decodeInvisible(csv)).toMatch(/^[a-f0-9]{16}$/);
  expect(csv).not.toMatch(/Private narrative|reporterId/);
});
it('[A-N105] fixed counts use scoped denominator and distinct accepted-transfer cases', async () => {
  const a = await create(1, { isEscalated: true }), b = await create(2, { owningBureau: 'PGRC' });
  const transfers = [{ caseId: a._id, status: 'ACCEPTED' }, { caseId: a._id, status: 'ACCEPTED' }, { caseId: b._id, status: 'REQUESTED' }];
  const tiles = additionalTiles([a, b], transfers, 'fixture', pct);
  expect(tiles.underProcessCases.count).toBe(2); expect(tiles.transferredCases.count).toBe(1); expect(tiles.escalatedCases.share).toMatchObject({ value: 50, numerator: 1, denominator: 2 });
  expect(additionalTiles([a], null, 'fixture', pct).transferredCases.result).toBe('UNKNOWN');
  const report = await buildImpactReport(rb, now); expect(report.tiles.totalComplaints.count).toBe(1); expect(report.psAlignmentTiles.underProcessCases.count).toBe(1);
  expect((await drillDown(rb, 'tile:underProcessCases')).cases.map(r => r.masterCaseId)).toEqual([a.masterCaseId]);
  expect((await drillDown(rb, 'tile:escalatedCases')).count).toBe(1);
  await Transfer.create({ caseId: a._id, masterCaseId: a.masterCaseId, fromBureau: 'PGRC', toBureau: 'RB', status: 'ACCEPTED', senderOfficerId: rb._id, reason: 'Fixture transfer', dueAt: now, acknowledgedAt: now });
  expect((await drillDown(rb, 'tile:transferredCases')).cases.map(r => r.masterCaseId)).toEqual([a.masterCaseId]);
});
it('[A-N106] summary exposes every recorded field with missing officer and SLA fallbacks', async () => {
  const c = await create(1, { statusHistory: [{ status: 'Assigned', at: new Date('2026-10-02') }] });
  const summary = await caseSummary(rb, c.masterCaseId);
  expect(summary).toMatchObject({ masterCaseId: c.masterCaseId, institutionName: 'Fictional College', institutionPid: c.institutionPid, category: 'Fee Dispute', subCategory: 'Refund', status: 'Under Process', officer: 'Not assigned', nextStepKey: 'office', expectedDisposalDate: null, disposalUnavailableReason: 'Not available: POLICY_NOT_CONFIGURED', lastAction: { text: 'Assigned' } });
  await CaseAction.create({ caseId: c._id, institutionPid: c.institutionPid, bureau: 'RB', actorId: rb.id, actorRole: rb.role, actionType: 'OTHER', subjectKey: 'private subject', at: new Date('2026-10-03') });
  c.currentOwner = { office: 'RB', officerName: 'Assigned Officer' }; c.slaClock = [{ segmentId: 'one', priority: 'normal', ruleVersion: 'fixture', targetResolutionDate: new Date('2026-11-01') }]; await c.save();
  expect(await caseSummary(rb, c.masterCaseId)).toMatchObject({ officer: 'Assigned Officer', lastAction: { text: 'OTHER' }, expectedDisposalDate: new Date('2026-11-01') });
  expect(JSON.stringify(summary)).not.toMatch(/narrative|reporterId|private subject/);
  await expect(caseSummary({ id: 'other', role: 'bureau_officer', bureau: 'PGRC' }, c.masterCaseId)).rejects.toMatchObject({ status: 404 });
});
it('[A-N107] quarterly opening/closing and ageing use boundary months while flows sum', async () => {
  const cases = [{ _id: 'one', masterCaseId: 'NX-2026-000001', owningBureau: 'RB', pidSnapshot: { region: 'Northern' }, status: 'Under Process', createdAt: new Date('2026-06-01') }, { _id: 'two', masterCaseId: 'NX-2026-000002', owningBureau: 'RB', status: 'Closed', createdAt: new Date('2026-07-10') }];
  const closures = [{ caseId: 'two', state: 'CLOSED', closedAt: new Date('2026-08-10') }];
  const transfers = [{ _id: 'move', caseId: 'one', fromBureau: 'PGRC', toBureau: 'RB', status: 'ACCEPTED', acknowledgedAt: new Date('2026-08-05') }];
  const events = [{ _id: 'escalation', targetId: 'one', action: 'case.escalated', at: new Date('2026-09-05') }];
  const months = quarterMonths('2026-Q3').map(month => monthlyLedger(cases, transfers, closures, events, { month }));
  const before = JSON.stringify(months), quarter = composeQuarter('2026-Q3', months);
  for (const row of quarter.rows) {
    const matching = months.map(m => m.rows.find(r => r.key === row.key));
    expect(row.counts.opening).toBe(matching[0]?.counts.opening || 0); expect(row.counts.closing).toBe(matching[2]?.counts.closing || 0);
    for (const key of ['received', 'disposed', 'transferredOut', 'transferredIn', 'escalated']) expect(row.counts[key]).toBe(matching.reduce((n, r) => n + (r?.counts[key] || 0), 0));
  }
  expect(JSON.stringify(months)).toBe(before); expect(disposalRate({ opening: 3, received: 1, disposed: 2 })).toEqual({ value: 50, numerator: 2, denominator: 4 });
  expect(disposalRate({ opening: 0, received: 0, disposed: 0 })).toMatchObject({ value: null, denominator: 0 });
  expect(() => quarterMonths('2026-Q5')).toThrow();
});
it('[A-N107] report scope and status totals agree and monthly enrichment preserves all old fields', async () => {
  await create(1); await create(2, { owningBureau: 'PGRC', status: 'Assigned' });
  const monthly = await monthlyReport(rb, { month: '2026-10' }), enriched = withDisposalRates(monthly);
  for (const key of Object.keys(monthly)) expect(enriched[key]).toEqual(monthly[key]);
  const status = await statusWise(rb); expect(status.total).toBe(1); expect(status.rows.reduce((n, r) => n + r.count, 0)).toBe(1);
  expect((await quarterlyReport(rb, { quarter: '2026-Q4' })).denominator).toBe(1);
  expect((await drillDown(rb, 'status:Under Process')).count).toBe(1);
});
it('[A-N108] missing policy stays unconfigured and creates no reminder', async () => {
  await create(1); expect((await reminderCandidates(now)).result).toBe('POLICY_NOT_CONFIGURED');
  expect((await runReminders(now)).created).toBe(0);
});
it('[A-N108] idle cases are reminded once daily; action, status activity, closure and access are respected', async () => {
  await seedReminderRule();
  const idle = await create(1), active = await create(2); await create(3, { status: 'CLOSED' });
  await create(4, { statusHistory: [{ status: 'Under Process', at: new Date('2026-10-27') }] });
  await CaseAction.create({ caseId: active._id, institutionPid: active.institutionPid, bureau: 'RB', actorId: rb.id, actorRole: rb.role, actionType: 'OTHER', subjectKey: 'private', at: new Date('2026-10-27') });
  expect((await runReminders(now)).created).toBe(1); expect((await runReminders(now)).created).toBe(0);
  expect(await PendingReminder.countDocuments()).toBe(1);
  const items = await reminderItems(rb, now); expect(items).toHaveLength(1); expect(items[0].kind).toBe('REMINDER'); expect(items[0].text).toContain(idle.masterCaseId);
  expect(await reminderItems({ id: 'other', role: 'bureau_officer', bureau: 'PGRC' }, now)).toEqual([]);
  expect(JSON.stringify(items)).not.toMatch(/Private narrative|reporterId/);
});
it('[A-N109] missing address defaults to null and optional CSV address is never fabricated for official rows', async () => {
  const institution = await Institution.findOne(); expect(institution.address).toBeNull();
  const without = parseOfficialCsv('pid,name,state\n1-1000000001,Fictional College,Delhi').rows;
  const withAddress = parseOfficialCsv('pid,name,state,address\n1-1000000001,Fictional College,Delhi,"Provided street, Delhi"').rows;
  expect(addressFor({ pid: institution.pid, synthetic: false }, without)).toBeNull();
  expect(addressFor({ pid: institution.pid }, withAddress)).toBe('Provided street, Delhi');
  expect(addressFor({ synthetic: true, city: 'Nellore', district: 'Nellore', state: 'Andhra Pradesh' })).toBe('Fictional campus address: Nellore, Andhra Pradesh');
  expect(await optionalAddressRows(new URL('missing-address-fixture.csv', import.meta.url))).toEqual([]);
});
