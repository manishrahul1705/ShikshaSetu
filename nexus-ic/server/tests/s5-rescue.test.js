import { describe, it, expect, beforeEach } from 'vitest';
import Case from '../src/modules/cases/Case.js';
import { RescueAlert } from '../src/modules/rescue/models.js';
import { runRescueScan, classifyDelay } from '../src/modules/rescue/rescueService.js';
import { setupS5, agent, makeCase, addTransfer, addTask } from './s5-helpers.js';

const DAY = 86400000;
let ctx;
beforeEach(async () => {
  ctx = await setupS5();
});

async function stalled(days) {
  const c = await makeCase(ctx.student, ctx.officer);
  await Case.collection.updateOne({ _id: c._id }, { $set: { createdAt: new Date(Date.now() - days * DAY) } });
  return c;
}

const NO_BLAME = /misconduct|negligen|guilt|fault|blame/i;

describe('S5 NEXUS RESCUE (N24, U27, F43)', () => {
  it('[U27] RESCUE fires on three transfers or a 7-day stall, once per case (deduplicated)', async () => {
    const moved = await makeCase(ctx.student, ctx.officer);
    for (let i = 0; i < 3; i++) await addTransfer(moved, ctx.pgrc);
    const quiet = await stalled(8);
    const fresh = await makeCase(ctx.student, ctx.officer);
    await addTransfer(fresh, ctx.pgrc);

    const first = await runRescueScan();
    expect(first.ruleVersion).toBe('DEMO-RESCUE-v1');
    expect(first.raised.map((a) => [a.masterCaseId, a.trigger]).sort()).toEqual([
      [moved.masterCaseId, 'THREE_OR_MORE_TRANSFERS'],
      [quiet.masterCaseId, 'NO_EVENT_FOR_DAYS'],
    ].sort());
    for (let i = 0; i < 3; i++) expect((await runRescueScan()).raised).toHaveLength(0);
    expect(await RescueAlert.countDocuments({ caseId: moved._id })).toBe(1);
    expect(await RescueAlert.countDocuments({ caseId: quiet._id })).toBe(1);
    expect(await RescueAlert.countDocuments({ caseId: fresh._id })).toBe(0);
    // The unique dedupeKey is enforced by the collection itself.
    await RescueAlert.init(); // make sure the unique index exists (index builds are async on a real MongoDB)
    const [one] = await RescueAlert.find({ caseId: moved._id }).lean();
    await expect(RescueAlert.create({ ...one, _id: undefined })).rejects.toThrow(/duplicate key/);
  });

  it('[N24] all four DEMO-RESCUE-v1 triggers alert a supervisor with a reason for delay and a suggested next action that point to work items', async () => {
    const moved = await makeCase(ctx.student, ctx.officer);
    for (let i = 0; i < 3; i++) await addTransfer(moved, ctx.pgrc);
    const quiet = await stalled(7);
    const waiting = await makeCase(ctx.student, ctx.officer);
    const late = await addTransfer(waiting, ctx.pgrc, { status: 'REQUESTED', acknowledgedAt: null, dueAt: new Date(Date.now() - DAY) });
    const tasked = await makeCase(ctx.student, ctx.officer);
    const task = await addTask(tasked, { ackDueAt: new Date(Date.now() - 3 * DAY), completionDueAt: new Date(Date.now() - DAY) });
    const onceLate = await makeCase(ctx.student, ctx.officer);
    await addTask(onceLate, { ackDueAt: new Date(Date.now() - DAY), completionDueAt: new Date(Date.now() + DAY) });

    const sup = await agent(ctx.app, ctx.supervisor);
    const scan = await sup.post('/api/v1/rescue/scan').expect(200);
    const triggers = Object.fromEntries(scan.body.raised.map((a) => [a.masterCaseId, a]));
    expect(triggers[moved.masterCaseId].trigger).toBe('THREE_OR_MORE_TRANSFERS');
    expect(triggers[quiet.masterCaseId].trigger).toBe('NO_EVENT_FOR_DAYS');
    expect(triggers[waiting.masterCaseId].trigger).toBe('TRANSFER_ACK_OVERDUE');
    expect(triggers[waiting.masterCaseId].workItems).toEqual([{ type: 'TRANSFER', ref: String(late._id) }]);
    expect(triggers[tasked.masterCaseId].trigger).toBe('TASK_OVERDUE_TWICE');
    expect(triggers[tasked.masterCaseId].workItems).toEqual([{ type: 'TASK', ref: String(task._id) }]);
    expect(triggers[onceLate.masterCaseId]).toBeUndefined();
    for (const alert of scan.body.raised) {
      expect(alert.supervisorId).toBe(String(ctx.supervisor._id));
      expect(alert.reasonForDelay).toBeTruthy();
      expect(alert.suggestedNextAction).toBeTruthy();
      expect(alert.reasonForDelay + alert.suggestedNextAction).not.toMatch(NO_BLAME);
      expect(alert.workItems.length).toBeGreaterThan(0);
    }
    // Suggesting is not acting: no case moved or closed.
    for (const c of [moved, quiet, waiting, tasked]) expect((await Case.findById(c._id)).status).toBe('Under Process');

    const list = await sup.get('/api/v1/rescue/alerts').expect(200);
    expect(list.body).toHaveLength(4);
    await (await agent(ctx.app, ctx.officer)).get('/api/v1/rescue/alerts').expect(403);
    const ack = await sup.post(`/api/v1/rescue/alerts/${list.body[0]._id}/acknowledge`).expect(200);
    expect(ack.body.state).toBe('ACKNOWLEDGED');
  });

  it('[F43] (hint only) a late-arriving feed never counts as officer delay', async () => {
    const now = new Date();
    const split = classifyDelay({ now, officerEvents: [new Date(now - 10 * DAY)], feedEvents: [{ sourceAt: new Date(now - 2 * DAY), receivedAt: now }] });
    expect(split).toMatchObject({ attribution: 'WORK_ITEM', idleDays: 2, officerDelayDays: 2, feedLatencyDays: 2 });
    expect(classifyDelay({ now, officerEvents: [new Date(now - 9 * DAY)], feedPending: true })).toMatchObject({ attribution: 'LATE_FEED', officerDelayDays: null });

    const awaiting = await stalled(9);
    const normal = await stalled(9);
    const feed = async (c) => ({ events: [], pending: String(c._id) === String(awaiting._id) });
    const scan = await runRescueScan({ feed });
    const byCase = Object.fromEntries(scan.raised.map((a) => [a.masterCaseId, a]));
    expect(byCase[awaiting.masterCaseId]).toMatchObject({ delayAttribution: 'LATE_FEED', officerDelayDays: null });
    expect(byCase[awaiting.masterCaseId].reasonForDelay).toMatch(/late-arriving feed/);
    expect(byCase[normal.masterCaseId]).toMatchObject({ delayAttribution: 'WORK_ITEM', officerDelayDays: 9 });
  });
});
