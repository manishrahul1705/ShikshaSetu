import { describe, it, expect, beforeEach } from 'vitest';
import Case from '../src/modules/cases/Case.js';
import { transitionStatus } from '../src/modules/lifecycle/lifecycleService.js';
import { StatusNotice, NoticeSink, queueStatusNotice, dispatchOutbox, noticeBody } from '../src/modules/notices/noticeService.js';
import { runRetaliationWatch, RetaliationAlert, ADVISORY_TEXT, retentionFor } from '../src/modules/additions/n51-retaliation-watch/service.js';
import { hasConsent } from '../src/modules/consent/service.js';
import { SimulatorStatusChanges } from '../src/modules/identity/simulators.js';
import { setupS5, agent, makeCase, NARRATIVE } from './s5-helpers.js';

let ctx;
beforeEach(async () => {
  ctx = await setupS5();
});

const TEMPLATE = /^ShikshaSetu: case NX-\d{4}-\d{6} status is now "[A-Za-z_ /]+"\. Log in to view details\.$/;

describe('S5 minimal status notices (N35, S27)', () => {
  it('[N35] every status change sends one minimal email and one SMS notice through the simulators', async () => {
    const c = await makeCase(ctx.student, ctx.officer, { status: 'Assigned' });
    expect(await StatusNotice.countDocuments({ caseId: c._id })).toBe(0); // creation is not a status change
    await transitionStatus(c._id, 'Under Process', ctx.officer, 'synthetic');
    const notices = await StatusNotice.find({ caseId: c._id }).lean();
    expect(notices.map((n) => n.channel).sort()).toEqual(['EMAIL', 'SMS']);
    expect(notices.every((n) => n.state === 'SENT' && n.status === 'Under Process')).toBe(true);
    const sink = await NoticeSink.find({}).lean();
    expect(sink.map((s) => s.simulator).sort()).toEqual(['EmailSimulator', 'SmsSimulator']);
    expect(sink[0].body).toBe(`ShikshaSetu: case ${c.masterCaseId} status is now "Under Process". Log in to view details.`);
  });

  it('[S27] the outbox is idempotent and email and SMS carry no narrative or PII', async () => {
    const c = await makeCase(ctx.student, ctx.officer, { status: 'Assigned' });
    await transitionStatus(c._id, 'Under Process', ctx.officer, 'synthetic');
    const fresh = await Case.findById(c._id);
    for (let i = 0; i < 3; i++) expect(await queueStatusNotice(fresh)).toEqual([]);
    expect((await dispatchOutbox()).sent).toBe(0);
    expect(await StatusNotice.countDocuments({})).toBe(2);
    expect(await NoticeSink.countDocuments({})).toBe(2);
    await StatusNotice.init(); // unique index ready on a real MongoDB
    await expect(StatusNotice.create({ ...(await StatusNotice.findOne({}).lean()), _id: undefined })).rejects.toThrow(/duplicate key/);
    for (const row of await NoticeSink.find({}).lean()) {
      expect(row.body).toMatch(TEMPLATE);
      for (const secret of [NARRATIVE, c.reporterId, ctx.student.displayName, ctx.officer.displayName, 'Ravi', '9876543210']) expect(row.body).not.toContain(secret);
    }
    expect(() => noticeBody(c.masterCaseId, 'Closed "<script>" 9876543210')).toThrow('NOTICE_TEMPLATE_VIOLATION');
    // A later, genuine change sends again.
    await transitionStatus(c._id, 'Under Review', ctx.officer, 'synthetic');
    expect(await StatusNotice.countDocuments({})).toBe(4);
  });
});

describe('S5 Retaliation Watch (A-N51, F52)', () => {
  it('[A-N51] only complainants with a recorded consent for this purpose are re-checked; a suspension sends a private advisory alert to the Competent Authority that names no guilt', async () => {
    const studentCase = await makeCase(ctx.student, ctx.officer);
    await makeCase(ctx.faculty, ctx.officer);
    // Live path: nobody is watched without the consent; with it, the N01 simulator re-check runs.
    expect(await hasConsent(studentCase.reporterId, 'retaliation_watch')).toBe(false);
    expect(await runRetaliationWatch()).toMatchObject({ checked: 0, skippedNoConsent: 2, alerts: [] });
    const student = await agent(ctx.app, ctx.student);
    await student.post('/api/v1/consents').send({ userType: 'student', purpose: 'retaliation_watch' }).expect((r) => expect([200, 201]).toContain(r.status));
    expect(await hasConsent(studentCase.reporterId, 'retaliation_watch')).toBe(true);
    expect(await runRetaliationWatch()).toMatchObject({ checked: 1, skippedNoConsent: 1, alerts: [] });
    SimulatorStatusChanges.set('STUDENT-SECOND', 'SUSPENDED');
    try {
      const live = await runRetaliationWatch();
      expect(live.alerts).toEqual([{ masterCaseIds: [studentCase.masterCaseId], signal: 'SUSPENDED' }]);
    } finally {
      SimulatorStatusChanges.clear();
    }
    await RetaliationAlert.deleteMany({});

    const consented = new Set([studentCase.reporterId]);
    const consentCheck = async (reporterId, purpose) => purpose === 'retaliation_watch' && consented.has(reporterId);
    const recheck = async () => ({ status: 'SUSPENDED' });
    const run = await runRetaliationWatch({ consentCheck, recheck });
    expect(run).toMatchObject({ checked: 1, skippedNoConsent: 1 });
    expect(run.alerts).toEqual([{ masterCaseIds: [studentCase.masterCaseId], signal: 'SUSPENDED' }]);
    expect((await runRetaliationWatch({ consentCheck, recheck })).alerts).toEqual([]);

    const res = await (await agent(ctx.app, ctx.authority)).get('/api/v1/retaliation-watch/alerts').expect(200);
    expect(res.body).toEqual([expect.objectContaining({ message: ADVISORY_TEXT, recipientRole: 'competent_authority', signal: 'SUSPENDED', state: 'OPEN' })]);
    expect(ADVISORY_TEXT).toMatch(/Advisory only: a human decides/);
    expect(JSON.stringify(res.body)).not.toMatch(/RP-[A-Z0-9]{4}|guilty|misconduct/);
    await (await agent(ctx.app, ctx.supervisor)).get('/api/v1/retaliation-watch/alerts').expect(403);
    // Advisory: nothing about the case changes.
    expect((await Case.findById(studentCase._id)).status).toBe('Under Process');
    expect(await RetaliationAlert.countDocuments({})).toBe(1);
  });

  it('[F52] (hint only) withdrawing consent stops the watch at once; retention returns POLICY_NOT_CONFIGURED', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    let granted = true;
    const consentCheck = async () => granted;
    let calls = 0;
    const recheck = async () => { calls++; return { status: 'ACTIVE' }; };
    expect((await runRetaliationWatch({ consentCheck, recheck })).checked).toBe(1);
    granted = false;
    expect(await runRetaliationWatch({ consentCheck, recheck })).toMatchObject({ checked: 0, skippedNoConsent: 1 });
    expect(calls).toBe(1);
    expect(await retentionFor(c.reporterId)).toEqual({ result: 'POLICY_NOT_CONFIGURED' });
  });
});
