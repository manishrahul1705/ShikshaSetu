import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import supertest from 'supertest';
import Case from '../src/modules/cases/Case.js';
import User from '../src/modules/auth/User.js';
import Institution from '../src/modules/institutions/Institution.js';
import { CaseAction, ActionCheck } from '../src/modules/prevent/models.js';
import { checkAction, proceedAction } from '../src/modules/prevent/stage2.js';
import { JudgeScenario, BANNER } from '../src/modules/additions/n46-judge-mode/service.js';
import { setupS5, agent, asSession, makeCase, addTransfer, closeThroughProof, NARRATIVE, OTHER_PID, PID } from './s5-helpers.js';

const DAY = 86400000;
let ctx;
beforeEach(async () => {
  ctx = await setupS5();
});
afterEach(() => {
  process.env.APP_MODE = 'demo';
});

const SECRETS = (c) => [NARRATIVE, c?.reporterId].filter(Boolean);

async function impactFixture() {
  const overdue = await makeCase(ctx.student, ctx.officer, {
    slaClock: [{ segmentId: 's1', ruleVersion: 'DEMO-CASE-STANDARD-v1', priority: 'normal', startedAt: new Date(Date.now() - 40 * DAY), targetResolutionDate: new Date(Date.now() - DAY) }],
  });
  await makeCase(ctx.student, ctx.pgrc, { institutionPid: OTHER_PID, pidSnapshot: { region: 'Southern' }, status: 'SUBMITTED', analyticStatus: 'PENDING' });
  await addTransfer(overdue, ctx.pgrc, { isEscalated: true });
  await addTransfer(overdue, ctx.pgrc);
  await closeThroughProof(ctx, await makeCase(ctx.student, ctx.officer));
  return overdue;
}

async function twoBureauActions() {
  const a = await makeCase(ctx.student, ctx.officer);
  const b = await makeCase(ctx.faculty, ctx.pgrc);
  for (const [c, officer] of [[a, ctx.officer], [b, ctx.pgrc]]) {
    const check = await checkAction(asSession(officer), { caseId: String(c._id), actionType: 'DOCUMENT_REQUEST', details: { subject: 'Synthetic ledger' } });
    await proceedAction(asSession(officer), check.checkId, 'Record the independently reviewed action for the overlap timeline fixture.');
  }
  return [a, b];
}

describe('S6b N47 click any number', () => {
  it('[A-N47] every IMPACT count opens exactly the cases behind it, scoped by the viewer, showing nothing new', async () => {
    const overdue = await impactFixture();
    const sup = await agent(ctx.app, ctx.supervisor);
    const { body: r } = await sup.get('/api/v1/impact/summary').expect(200);
    const expectCount = async (row, n) => {
      const res = await sup.get('/api/v1/impact/cases').query({ row }).expect(200);
      expect([row, res.body.count]).toEqual([row, n]);
      expect(res.body.cases).toHaveLength(n);
      expect(res.body.synthetic).toBe(true);
      return res.body;
    };
    await expectCount('tile:totalComplaints', r.tiles.totalComplaints.count);
    await expectCount('tile:pendingCases', r.tiles.pendingCases.count);
    await expectCount('tile:disposedCases', r.tiles.disposedCases.count);
    const od = await expectCount('tile:overdueCases', r.tiles.overdueCases.count);
    expect(od.cases[0].masterCaseId).toBe(overdue.masterCaseId);
    for (const row of r.tiles.bureauWiseWorkload.rows.filter((x) => x.total > 0)) await expectCount(row.rowId, row.total);
    for (const row of r.regionWise) await expectCount(row.rowId, row.total);
    for (const row of r.tiles.institutionWiseHistory.rows) await expectCount(row.rowId, row.total);
    for (const row of r.tiles.trendsAndInsights.rows) await expectCount(row.rowId, row.registered);
    const delays = await sup.get('/api/v1/impact/cases').query({ row: 'tile:transferDelays' }).expect(200);
    expect(delays.body.transfers).toHaveLength(r.tiles.transferDelays.count);

    const all = await sup.get('/api/v1/impact/cases').query({ row: 'tile:totalComplaints' }).expect(200);
    const json = JSON.stringify(all.body);
    for (const s of SECRETS(overdue)) expect(json).not.toContain(s);
    expect(json).not.toMatch(/"narrative"|"reporterId"|"userId"/);
    // Scope: a PGRC officer only opens PGRC cases; institution admins get nothing.
    const pgrc = await (await agent(ctx.app, ctx.pgrc)).get('/api/v1/impact/cases').query({ row: 'tile:totalComplaints' }).expect(200);
    expect(pgrc.body.cases.map((c) => c.owningBureau)).toEqual(['Public Grievance Redressal Cell']);
    await (await agent(ctx.app, ctx.instAdmin)).get('/api/v1/impact/cases').query({ row: 'tile:totalComplaints' }).expect(403);
    await sup.get('/api/v1/impact/cases').query({ row: 'nonsense' }).expect(400);
  });

  it('[N47] the drill-down is audited and an unknown row is refused rather than guessed', async () => {
    await impactFixture();
    const sup = await agent(ctx.app, ctx.supervisor);
    expect((await sup.get('/api/v1/impact/cases').query({ row: 'tile:somethingElse' }).expect(400)).body.error).toBe('ROW_NOT_DRILLABLE');
    await sup.get('/api/v1/impact/cases').query({ row: 'bureau:Regulation Bureau' }).expect(200);
    const { default: AuditEvent } = await import('../src/modules/audit/AuditEvent.js');
    expect(await AuditEvent.exists({ action: 'impact.drilldown.viewed', targetId: 'bureau:Regulation Bureau' })).toBeTruthy();
  });
});

describe('S6b N50 overlap timeline', () => {
  it('[A-N50] two bureaus side by side with the PREVENT conflict point marked, read-only', async () => {
    await twoBureauActions();
    const before = [await CaseAction.countDocuments(), await ActionCheck.countDocuments()];
    const sup = await agent(ctx.app, ctx.supervisor);
    const res = await sup.get(`/api/v1/overlap-timeline/${PID}`).expect(200);
    expect(res.body.readOnly).toBe(true);
    expect(res.body.lanes.map((l) => l.bureau).sort()).toEqual(['Public Grievance Redressal Cell', 'Regulation Bureau']);
    for (const lane of res.body.lanes) expect(lane.events).toHaveLength(1);
    expect(res.body.conflicts).toHaveLength(1);
    expect(res.body.conflicts[0]).toMatchObject({ source: 'PREVENT Stage 2', result: 'REVIEW', bureau: 'Public Grievance Redressal Cell' });
    expect(res.body.conflicts[0].reasons).toEqual(expect.arrayContaining(['REPEATED_DOCUMENT_REQUEST', 'OVERLAPPING_BUREAU_ACTION']));
    expect([await CaseAction.countDocuments(), await ActionCheck.countDocuments()]).toEqual(before);
  });

  it('[N50] other bureaus appear as opaque metadata and out-of-scope cases as restricted', async () => {
    const [a] = await twoBureauActions();
    const pgrc = await agent(ctx.app, ctx.pgrc);
    const res = await pgrc.get(`/api/v1/overlap-timeline/${PID}`).expect(200);
    const rb = res.body.lanes.find((l) => l.bureau === 'Regulation Bureau');
    expect(rb.events[0]).toEqual({ at: expect.any(String), actionType: 'DOCUMENT_REQUEST', opaque: true });
    expect(JSON.stringify(res.body)).not.toContain(a.masterCaseId);
    await (await agent(ctx.app, ctx.student)).get(`/api/v1/overlap-timeline/${PID}`).expect(403);
  });
});

describe('S6b N61 cross-institution pattern alert', () => {
  async function institutions(n, region) {
    const pids = [];
    for (let i = 0; i < n; i++) {
      const pid = `1-20000000${i}${region === 'Northern' ? 1 : 2}`;
      await Institution.create({ pid, name: `Synthetic ${region} ${i}`, state: 'DEMO', region, type: 'DEMO', synthetic: true });
      pids.push(pid);
    }
    return pids;
  }
  async function caseAt(pid, region, daysAgo) {
    const c = await makeCase(ctx.student, ctx.officer, { institutionPid: pid, pidSnapshot: { region } });
    if (daysAgo) await Case.collection.updateOne({ _id: c._id }, { $set: { createdAt: new Date(Date.now() - daysAgo * DAY) } });
    return c;
  }

  it('[A-N61] the same issue rising across institutions in one region is flagged with cited cases, a denominator and the synthetic label', async () => {
    const pids = await institutions(4, 'Northern');
    const current = [];
    for (const pid of pids.slice(0, 3)) current.push(await caseAt(pid, 'Northern', 0));
    await caseAt(pids[3], 'Northern', 40);
    const res = await (await agent(ctx.app, ctx.supervisor)).get('/api/v1/impact/patterns').expect(200);
    expect(res.body).toMatchObject({ synthetic: true, advisoryOnly: true, ruleVersion: 'DEMO-PATTERN-v1' });
    expect(res.body.label).toMatch(/SYNTHETIC DATA/);
    expect(res.body.alerts).toHaveLength(1);
    const alert = res.body.alerts[0];
    expect(alert).toMatchObject({ region: 'Northern', issueConcept: 'Fee Dispute / Refund Denial', institutionsNow: 3, institutionsBefore: 1 });
    expect(alert.share).toMatchObject({ numerator: 3, denominator: 3 });
    expect(alert.share.scope).toMatch(/Northern/);
    expect(alert.citedRows).toEqual(current.map((c) => c.masterCaseId).sort());
    expect(alert.suggestion).toMatch(/Suggest a policy review/);
    expect(JSON.stringify(res.body)).not.toContain(NARRATIVE);
  });

  it('[N61] no alert below the minimum, or when the issue is not rising; nothing about any case changes', async () => {
    const pids = await institutions(6, 'Northern');
    for (const pid of pids.slice(0, 2)) await caseAt(pid, 'Northern', 0);
    const sup = await agent(ctx.app, ctx.supervisor);
    expect((await sup.get('/api/v1/impact/patterns').expect(200)).body.alerts).toEqual([]);
    await caseAt(pids[2], 'Northern', 0);
    for (const pid of pids.slice(3, 6)) await caseAt(pid, 'Northern', 40);
    expect((await sup.get('/api/v1/impact/patterns').expect(200)).body.alerts).toEqual([]);
    expect(await Case.countDocuments({ status: { $ne: 'Under Process' } })).toBe(0);
  });
});

describe('S6b N46 Judge Demo Mode', () => {
  it('[A-N46] one click resets demo data and returns a captioned tour of the two-bureau overlap scenario, with no manual database edits', async () => {
    await makeCase(ctx.student, ctx.officer);
    await supertest(ctx.app).post('/api/v1/judge/reset').expect(401);
    const res = await (await agent(ctx.app, ctx.supervisor)).post('/api/v1/judge/reset').expect(200);
    expect(res.body.banner).toBe(BANNER);
    expect(BANNER).toBe('Potential Overlapping Cases – Coordination Required');
    expect(res.body.scenario.cases.map((c) => c.bureau).sort()).toEqual(['Public Grievance Redressal Cell', 'Regulation Bureau']);
    expect(res.body.scenario.preventResult).toBe('REVIEW');
    expect(res.body.steps.length).toBeGreaterThanOrEqual(5);
    for (const step of res.body.steps) expect(step.caption).toBeTruthy();
    // Old data is gone; only the scenario and the standard fixtures remain.
    expect(await Case.exists({ narrative: NARRATIVE })).toBeNull();
    expect(await Case.countDocuments({ masterCaseId: { $in: res.body.scenario.cases.map((c) => c.masterCaseId) } })).toBe(2);
    expect(await ActionCheck.countDocuments({ result: 'REVIEW' })).toBe(1);
    // Demo accounts work again after reset.
    await agent(ctx.app, await User.findOne({ username: 'supervisor1' }));
    const tour = await (await agent(ctx.app, await User.findOne({ username: 'supervisor1' }))).get('/api/v1/judge/tour').expect(200);
    expect(tour.body.scenario.institutionPid).toBe(res.body.scenario.institutionPid);
    expect(await JudgeScenario.countDocuments()).toBe(1);
  });

  it('[N46] Judge Mode is hidden in production mode and refuses a non-demo database', async () => {
    const sup = await agent(ctx.app, ctx.supervisor);
    process.env.APP_MODE = 'production';
    await sup.get('/api/v1/judge/tour').expect(404);
    await sup.post('/api/v1/judge/reset').expect(404);
    expect(await User.countDocuments()).toBeGreaterThan(0);
    process.env.APP_MODE = 'demo';
    const real = mongoose.connection.name;
    Object.defineProperty(mongoose.connection, 'name', { value: 'awaaz_dastak_live', configurable: true });
    try {
      expect((await sup.post('/api/v1/judge/reset').expect(409)).body.error).toBe('DEMO_DATABASE_REQUIRED');
    } finally {
      Object.defineProperty(mongoose.connection, 'name', { value: real, configurable: true });
    }
    expect(await User.countDocuments()).toBeGreaterThan(0);
  });
});

describe('S6b graph, radar and safeguards (F05, E07, E09)', () => {
  it('[F05] (graph evidence only) the institution graph links visible cases, owning bureaus and transfers, with restricted entries counted, never shown', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    await addTransfer(c, ctx.pgrc);
    const res = await (await agent(ctx.app, ctx.supervisor)).get(`/api/v1/graph/institutions/${PID}`).expect(200);
    expect(res.body.nodes.map((n) => n.id)).toEqual(expect.arrayContaining([`institution:${PID}`, `case:${c.masterCaseId}`, 'bureau:Regulation Bureau', 'bureau:PGRC', 'bureau:RB']));
    expect(res.body.edges).toEqual(expect.arrayContaining([{ from: 'bureau:PGRC', to: 'bureau:RB', kind: 'transfer', status: 'ACCEPTED', masterCaseId: c.masterCaseId }]));
    expect(JSON.stringify(res.body)).not.toContain(NARRATIVE);
    await (await agent(ctx.app, ctx.instAdmin)).get(`/api/v1/graph/institutions/${PID}`).expect(403);
  });

  it('[E07] (hint only) the radar shows attention indicators as counts with reasons, never a score; UNKNOWN stays UNKNOWN', async () => {
    const res = await (await agent(ctx.app, ctx.supervisor)).get(`/api/v1/graph/institutions/${PID}/radar`).expect(200);
    expect(res.body.note).toMatch(/Not a score/);
    expect(JSON.stringify(res.body)).not.toMatch(/"score"|risk|guilt|compliance/i);
    const unknown = res.body.axes.find((a) => a.type === 'ATTENDANCE_FEED');
    expect(unknown).toMatchObject({ value: null, result: 'UNKNOWN' });
  });

  it('[E09] (hint only) IMPACT, drill-down and pattern alerts all carry the synthetic label, numerator/denominator/scope, flagged never counted as avoided, and cited rows', async () => {
    await impactFixture();
    const sup = await agent(ctx.app, ctx.supervisor);
    const summary = (await sup.get('/api/v1/impact/summary').expect(200)).body;
    const drill = (await sup.get('/api/v1/impact/cases').query({ row: 'tile:pendingCases' }).expect(200)).body;
    const patterns = (await sup.get('/api/v1/impact/patterns').expect(200)).body;
    for (const b of [summary, drill, patterns]) expect(b.label).toMatch(/SYNTHETIC DATA/);
    expect(summary.duplicateActions.avoided.result).toBe('UNKNOWN');
    expect(summary.tiles.pendingCases.share).toEqual(expect.objectContaining({ numerator: expect.any(Number), denominator: expect.any(Number), scope: expect.any(String) }));
    for (const rec of summary.recommendations) expect(rec.citedRows.length).toBeGreaterThan(0);
  });
});
