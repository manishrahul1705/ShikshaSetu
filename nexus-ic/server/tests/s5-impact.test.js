import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ActionCheck } from '../src/modules/prevent/models.js';
import { ExportLog, decodeInvisible } from '../src/modules/additions/n55-watermark/service.js';
import { setupS5, agent, makeCase, addTransfer, closeThroughProof, OTHER_PID } from './s5-helpers.js';

const DAY = 86400000;
let ctx;
beforeEach(async () => {
  ctx = await setupS5();
  const overdue = await makeCase(ctx.student, ctx.officer, {
    slaClock: [{ segmentId: 's1', ruleVersion: 'DEMO-CASE-STANDARD-v1', priority: 'normal', startedAt: new Date(Date.now() - 40 * DAY), targetResolutionDate: new Date(Date.now() - DAY) }],
  });
  await makeCase(ctx.student, ctx.pgrc, { institutionPid: OTHER_PID, pidSnapshot: { region: 'Southern' }, status: 'SUBMITTED', analyticStatus: 'PENDING' });
  await addTransfer(overdue, ctx.pgrc, { isEscalated: true });
  await addTransfer(overdue, ctx.pgrc);
  await ActionCheck.create({ caseId: overdue._id, actorId: String(ctx.officer._id), actionType: 'DOCUMENT_REQUEST', result: 'REVIEW' });
  await ActionCheck.create({ caseId: overdue._id, actorId: String(ctx.officer._id), actionType: 'NOTICE', result: 'CLEAR' });
  await closeThroughProof(ctx, await makeCase(ctx.student, ctx.officer));
});

function percentObjects(node, out = []) {
  if (node && typeof node === 'object') {
    if ('numerator' in node || 'denominator' in node) out.push(node);
    for (const v of Object.values(node)) percentObjects(v, out);
  }
  return out;
}

describe('S5 NEXUS IMPACT (N26, N77, U30, A-N55)', () => {
  it('[N26] resolution time, duplicate actions (flagged never counted as avoided), bureau- and region-wise insights and cited recommendations, all labelled synthetic', async () => {
    const res = await (await agent(ctx.app, ctx.supervisor)).get('/api/v1/impact/summary').expect(200);
    const r = res.body;
    expect(r.synthetic).toBe(true);
    expect(r.label).toMatch(/SYNTHETIC DATA/);
    expect(r.resolutionTime).toMatchObject({ closedCases: 1 });
    expect(r.duplicateActions).toMatchObject({ flagged: 1, avoided: { result: 'UNKNOWN', reason: 'NO_AVOIDANCE_RECORD' } });
    expect(r.duplicateActions.flaggedShare).toMatchObject({ value: 50, numerator: 1, denominator: 2 });
    const percents = percentObjects(r);
    expect(percents.length).toBeGreaterThanOrEqual(5);
    for (const p of percents) {
      expect(p).toHaveProperty('numerator');
      expect(p).toHaveProperty('denominator');
      expect(p.scope).toBeTruthy();
    }
    expect(r.regionWise.map((x) => x.region).sort()).toEqual(['Northern', 'Southern']);
    expect(r.tiles.bureauWiseWorkload.rows.find((x) => x.bureau === 'RB')).toMatchObject({ transfersIn: 2, transfersDelayed: 1 });
    const rowIds = new Set(['tile:transferDelays', 'tile:overdueCases', 'tile:potentialOverlaps', ...r.tiles.bureauWiseWorkload.rows.map((x) => x.rowId), ...r.regionWise.map((x) => x.rowId)]);
    expect(r.recommendations.length).toBeGreaterThan(0);
    for (const rec of r.recommendations) {
      expect(rec.citedRows.length).toBeGreaterThan(0);
      for (const id of rec.citedRows) expect(rowIds.has(id)).toBe(true);
    }
    // Scope follows RBAC: a PGRC officer sees only PGRC cases.
    const pgrc = await (await agent(ctx.app, ctx.pgrc)).get('/api/v1/impact/summary').expect(200);
    expect(pgrc.body.tiles.totalComplaints).toMatchObject({ count: 1, scope: 'Cases routed to Public Grievance Redressal Cell' });
    await (await agent(ctx.app, ctx.instAdmin)).get('/api/v1/impact/summary').expect(403);
  });

  it('[N77] the nine IMPACT management tiles from workflow step 13', async () => {
    const { body } = await (await agent(ctx.app, ctx.authority)).get('/api/v1/impact/summary').expect(200);
    expect(Object.keys(body.tiles)).toEqual([
      'totalComplaints', 'pendingCases', 'disposedCases', 'overdueCases', 'transferDelays', 'potentialOverlaps', 'bureauWiseWorkload', 'institutionWiseHistory', 'trendsAndInsights',
    ]);
    expect(body.tiles.totalComplaints.count).toBe(3);
    expect(body.tiles.pendingCases.count).toBe(1);
    expect(body.tiles.disposedCases.count).toBe(1);
    expect(body.tiles.overdueCases).toMatchObject({ count: 1, share: { numerator: 1, denominator: 1 } });
    expect(body.tiles.transferDelays).toMatchObject({ count: 1, share: { numerator: 1, denominator: 2 } });
    expect(body.tiles.potentialOverlaps).toHaveProperty('pairs');
    expect(body.tiles.institutionWiseHistory.rows).toHaveLength(2);
    expect(body.tiles.trendsAndInsights.rows[0]).toMatchObject({ registered: 3, disposed: 1 });
  });

  it('[U30] the IMPACT report downloads with denominators and the synthetic label; recommendations cite rows that are in the report', async () => {
    const res = await (await agent(ctx.app, ctx.supervisor)).get('/api/v1/impact/report.csv').expect(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="nexus-impact-report-SYNTHETIC-[0-9a-f]{16}\.csv"/);
    const csv = res.text;
    const lines = csv.split('\n');
    expect(csv).not.toContain('SYNTHETIC DATA'); // Explicit export-footer override.
    expect(csv).toContain('rowId,metric,count,percent,numerator,denominator,scope');
    const pending = lines.find((l) => l.startsWith('tile:pendingCases'));
    expect(pending.split(',').slice(4, 6)).toEqual(['1', '3']);
    expect(lines.find((l) => l.startsWith('metric:duplicateActionsAvoided'))).toContain('UNKNOWN');
    const recs = lines.filter((l) => l.startsWith('REC-'));
    expect(recs.length).toBeGreaterThan(0);
    const rowIdsInCsv = new Set(lines.map((l) => l.split(',')[0]));
    for (const rec of recs) for (const id of rec.split(',').pop().split(';')) expect(rowIdsInCsv.has(id) || id.startsWith('tile:')).toBe(true);
    expect(JSON.stringify(csv)).not.toMatch(/RP-[A-Z0-9]{4}/);
    expect(csv).not.toContain('Synthetic narrative');
  });

  it('[A-N55] every S5 export has a visible exported-by footer and an invisible per-export code stored in export_log, with no reporter identity', async () => {
    const res = await (await agent(ctx.app, ctx.supervisor)).get('/api/v1/impact/report.csv').expect(200);
    expect(res.text).toMatch(/Exported by Supervisor\/supervisor at \d{4}-\d{2}-\d{2}T/);
    const code = decodeInvisible(res.text);
    expect(code).toMatch(/^[0-9a-f]{16}$/);
    expect(res.headers['content-disposition']).toContain(code);
    const row = await ExportLog.findOne({ code }).lean();
    expect(row).toMatchObject({ kind: 'IMPACT_REPORT_CSV', exportedByRole: 'supervisor', exportedByOffice: 'Supervisor' });
    expect(JSON.stringify(row)).not.toMatch(/RP-[A-Z0-9]{4}/);
    // A leaked copy is traced back from its text.
    const traced = await (await agent(ctx.app, ctx.auditor)).post('/api/v1/exports/trace').send({ text: res.text.slice(-400) }).expect(200);
    expect(traced.body).toMatchObject({ result: 'FOUND', export: { code, exportedByRole: 'supervisor' } });
    await (await agent(ctx.app, ctx.officer)).post('/api/v1/exports/trace').send({ text: res.text }).expect(403);
    expect(mongoose.connection.collection('export_log')).toBeTruthy();
  });
});
