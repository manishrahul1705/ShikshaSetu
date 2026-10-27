import { describe, it, expect, beforeEach } from 'vitest';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import InstitutionIdentifier from '../src/modules/institutions/InstitutionIdentifier.js';
import { setupS5, agent, makeCase, addTransfer, NARRATIVE, OTHER_PID, PID } from './s5-helpers.js';

let ctx;
beforeEach(async () => {
  ctx = await setupS5();
});

describe('Officer case journey (N09 touchpoint 5, S21)', () => {
  it('[N09] the case journey shows the PID and ICID snapshot, the ICID check, the source trail and the case events, with no narrative or reporter', async () => {
    await InstitutionIdentifier.create({ icid: 'IIC-SYNTH001', pid: PID, source: 'synthetic', verifiedAt: new Date() });
    const c = await makeCase(ctx.student, ctx.officer, {
      institutionIcid: 'IIC-SYNTH001',
      pidSnapshot: { name: 'Synthetic S5 institution A', region: 'Northern', state: 'DEMO state' },
      channel: 'import',
      externalRefs: [{ sourceSystem: 'CPGRAMS_SIMULATOR', sourceCaseRef: 'SIM-0001' }],
    });
    await addTransfer(c, ctx.officer);
    const officer = await agent(ctx.app, ctx.officer);
    const res = await officer.get(`/api/v1/cases/${c.masterCaseId}/journey`).expect(200);
    expect(res.body.institution).toMatchObject({ pid: PID, icid: 'IIC-SYNTH001', icidResult: 'MATCH', snapshot: { name: 'Synthetic S5 institution A', region: 'Northern' } });
    expect(res.body.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'CHANNEL', system: 'IMPORT' }),
      expect.objectContaining({ kind: 'EXTERNAL_REF', system: 'CPGRAMS_SIMULATOR', ref: 'SIM-0001' }),
    ]));
    expect(res.body.transfers.length).toBe(1);
    expect(res.body.milestones.map((m) => m.kind)).toEqual(expect.arrayContaining(['REGISTERED', 'TRANSFER_REQUESTED', 'TRANSFER_ACCEPTED']));
    expect(res.body.events.map((e) => e.action)).toContain('case.journey.viewed');
    const json = JSON.stringify(res.body);
    for (const secret of [NARRATIVE, c.reporterId, String(ctx.officer._id)]) expect(json).not.toContain(secret);
  });

  it('[N09] a missing ICID shows as not available, never as a failed check', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    const supervisor = await agent(ctx.app, ctx.supervisor);
    const res = await supervisor.get(`/api/v1/cases/${c.masterCaseId}/journey`).expect(200);
    expect(res.body.institution.icid).toBeNull();
    expect(res.body.institution.icidResult).toBe('NOT_AVAILABLE');
  });

  it('[S21] out-of-scope officers and complainants get 404, and the denial is audited', async () => {
    const c = await makeCase(ctx.student, ctx.officer, { institutionPid: OTHER_PID });
    const pgrc = await agent(ctx.app, ctx.pgrc);
    await pgrc.get(`/api/v1/cases/${c.masterCaseId}/journey`).expect(404);
    expect(await AuditEvent.countDocuments({ action: 'case.access_denied_idor', targetId: c.masterCaseId })).toBe(1);
    const student = await agent(ctx.app, ctx.student);
    await student.get(`/api/v1/cases/${c.masterCaseId}/journey`).expect(403);
    await (await agent(ctx.app, ctx.officer)).get('/api/v1/cases/NX-2026-999999/journey').expect(404);
  });
});
