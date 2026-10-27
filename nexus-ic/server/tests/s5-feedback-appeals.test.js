import { describe, it, expect, beforeEach } from 'vitest';
import Case from '../src/modules/cases/Case.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { verifyChain } from '../src/modules/audit/audit.js';
import { ClosureRecord } from '../src/modules/closure/models.js';
import { FeedbackRecord } from '../src/modules/feedback/models.js';
import { Appeal } from '../src/modules/appeals/models.js';
import { setupS5, agent, makeCase, addAction, addDocument, closeThroughProof, approveRule } from './s5-helpers.js';

let ctx;
beforeEach(async () => {
  ctx = await setupS5();
});

async function proposed() {
  const c = await makeCase(ctx.student, ctx.officer);
  await addAction(c, ctx.officer);
  const doc = await addDocument(c, ctx.officer);
  await (await agent(ctx.app, ctx.officer)).post(`/api/v1/cases/${c.masterCaseId}/closure/propose`).send({ closureReason: 'Synthetic', evidenceDocumentIds: [String(doc._id)] }).expect(200);
  return Case.findById(c._id);
}

const appealRule = (levels = 2) => approveRule({ family: 'APPEAL', version: `TEST-APPEAL-${levels}`, body: { windowDays: 30, levels } }, ctx.officer, ctx.supervisor);

describe('S5 complainant feedback (N23, U26)', () => {
  it('[N23] feedback is collected after resolution is proposed, shown to reviewers, kept out of audit meta, and only from the owning complainant', async () => {
    const open = await makeCase(ctx.student, ctx.officer);
    const student = await agent(ctx.app, ctx.student);
    expect((await student.post(`/api/v1/cases/${open.masterCaseId}/feedback`).send({ rating: 4 }).expect(409)).body.error).toBe('FEEDBACK_NOT_OPEN');
    const c = await proposed();
    const text = 'Synthetic private feedback text';
    const res = await student.post(`/api/v1/cases/${c.masterCaseId}/feedback`).send({ rating: 4, text }).expect(201);
    expect(res.body.statusAtFeedback).toBe('Resolution Proposed');
    await student.post(`/api/v1/cases/${c.masterCaseId}/feedback`).send({ rating: 9 }).expect(400);
    // Another complainant cannot leave feedback on this case.
    await (await agent(ctx.app, ctx.faculty)).post(`/api/v1/cases/${c.masterCaseId}/feedback`).send({ rating: 1 }).expect(404);
    // Reviewers see it.
    const view = await (await agent(ctx.app, ctx.supervisor)).get(`/api/v1/cases/${c.masterCaseId}/closure`).expect(200);
    expect(view.body.feedback).toEqual([expect.objectContaining({ rating: 4, text })]);
    const audits = await AuditEvent.find({ action: 'feedback.recorded' }).lean();
    expect(audits).toHaveLength(1);
    expect(JSON.stringify(audits)).not.toContain(text);
  });

  it('[U26] feedback is stored and does not change status', async () => {
    const c = await proposed();
    const before = await Case.findById(c._id).lean();
    const transitionsBefore = await AuditEvent.countDocuments({ action: 'case.status.transitioned', targetId: String(c._id) });
    const student = await agent(ctx.app, ctx.student);
    for (const rating of [1, 5]) await student.post(`/api/v1/cases/${c.masterCaseId}/feedback`).send({ rating, text: 'Synthetic' }).expect(201);
    const after = await Case.findById(c._id).lean();
    expect(await FeedbackRecord.countDocuments({ caseId: c._id })).toBe(2);
    expect(after.status).toBe(before.status);
    expect(after.analyticStatus).toBe(before.analyticStatus);
    expect(await AuditEvent.countDocuments({ action: 'case.status.transitioned', targetId: String(c._id) })).toBe(transitionsBefore);
  });
});

describe('S5 appeal and review (N25, U28)', () => {
  it('[N25] Closed -> Appeal Filed -> Under Appeal Review -> Upheld / Modified / Remanded, levels 1 to n from the RuleBook, extra evidence accepted', async () => {
    const closed = await closeThroughProof(ctx, await makeCase(ctx.student, ctx.officer));
    const student = await agent(ctx.app, ctx.student);
    // APPEAL is not seeded: no window or levels are assumed.
    expect((await student.post(`/api/v1/cases/${closed.masterCaseId}/appeals`).send({}).expect(409)).body.error).toBe('POLICY_NOT_CONFIGURED');
    expect((await student.get('/api/v1/appeals/rule').expect(200)).body.result).toBe('POLICY_NOT_CONFIGURED');
    await appealRule(2);

    const evidence = await addDocument(closed, ctx.student);
    const filed = await student.post(`/api/v1/cases/${closed.masterCaseId}/appeals`).send({ grounds: 'Synthetic grounds', evidenceDocumentIds: [String(evidence._id)] }).expect(201);
    expect(filed.body).toMatchObject({ level: 1, state: 'Appeal Filed' });
    expect((await student.post(`/api/v1/cases/${closed.masterCaseId}/appeals`).send({}).expect(409)).body.error).toBe('APPEAL_ALREADY_OPEN');

    const authority = await agent(ctx.app, ctx.authority);
    await authority.post(`/api/v1/appeals/${filed.body.id}/review`).expect(200);
    const upheld = await authority.post(`/api/v1/appeals/${filed.body.id}/decide`).send({ outcome: 'Upheld', decisionNote: 'Closure stands (synthetic)' }).expect(200);
    expect(upheld.body.events.map((e) => e.state)).toEqual(['Appeal Filed', 'Under Appeal Review', 'Upheld']);
    expect((await Case.findById(closed._id)).status).toBe('Closed');

    // Level 2, then the levels are exhausted.
    const second = await student.post(`/api/v1/cases/${closed.masterCaseId}/appeals`).send({ grounds: 'Second level' }).expect(201);
    expect(second.body.level).toBe(2);
    await authority.post(`/api/v1/appeals/${second.body.id}/review`).expect(200);
    await authority.post(`/api/v1/appeals/${second.body.id}/decide`).send({ outcome: 'Modified', decisionNote: 'Remedy modified (synthetic)' }).expect(200);
    expect((await student.post(`/api/v1/cases/${closed.masterCaseId}/appeals`).send({}).expect(409)).body.error).toBe('APPEAL_LEVELS_EXHAUSTED');

    // Remanded reopens.
    const other = await closeThroughProof(ctx, await makeCase(ctx.student, ctx.officer));
    const third = await student.post(`/api/v1/cases/${other.masterCaseId}/appeals`).send({}).expect(201);
    await authority.post(`/api/v1/appeals/${third.body.id}/review`).expect(200);
    await authority.post(`/api/v1/appeals/${third.body.id}/decide`).send({ outcome: 'Remanded', decisionNote: 'Further inquiry (synthetic)' }).expect(200);
    expect((await Case.findById(other._id)).status).toBe('Under Process');
    expect(await AuditEvent.exists({ action: 'authority.decision.recorded', 'meta.kind': 'APPEAL_OUTCOME' })).toBeTruthy();
    // Master Case ID never changes across the appeal (U12 holds).
    expect((await Case.findById(other._id)).masterCaseId).toBe(other.masterCaseId);
  });

  it('[U28] an appeal adds events, leaves the original closure and earlier events intact, and needs a reviewer other than the original resolver', async () => {
    const closed = await closeThroughProof(ctx, await makeCase(ctx.student, ctx.officer));
    await appealRule(1);
    const recordBefore = await ClosureRecord.findOne({ caseId: closed._id }).lean();
    const eventsBefore = await AuditEvent.find({}).sort({ seq: 1 }).lean();

    const student = await agent(ctx.app, ctx.student);
    const filed = await student.post(`/api/v1/cases/${closed.masterCaseId}/appeals`).send({ grounds: 'Synthetic' }).expect(201);
    // The supervisor approved the closure, so cannot review the appeal.
    const sup = await agent(ctx.app, ctx.supervisor);
    expect((await sup.post(`/api/v1/appeals/${filed.body.id}/review`).expect(403)).body.error).toBe('REVIEWER_MUST_DIFFER');
    // Complainants and bureau officers cannot review.
    await student.post(`/api/v1/appeals/${filed.body.id}/review`).expect(403);
    const chair = await agent(ctx.app, ctx.chair);
    await chair.post(`/api/v1/appeals/${filed.body.id}/review`).expect(200);
    // Only the assigned reviewer decides.
    await (await agent(ctx.app, ctx.authority)).post(`/api/v1/appeals/${filed.body.id}/decide`).send({ outcome: 'Upheld', decisionNote: 'x' }).expect(403);
    await chair.post(`/api/v1/appeals/${filed.body.id}/decide`).send({ outcome: 'Upheld', decisionNote: 'Synthetic' }).expect(200);

    expect(await ClosureRecord.findOne({ caseId: closed._id }).lean()).toEqual(recordBefore);
    const eventsAfter = await AuditEvent.find({}).sort({ seq: 1 }).lean();
    expect(eventsAfter.slice(0, eventsBefore.length)).toEqual(eventsBefore);
    expect(eventsAfter.length).toBeGreaterThan(eventsBefore.length);
    expect(eventsAfter.filter((e) => e.action.startsWith('appeal.')).map((e) => e.action)).toEqual(['appeal.filed', 'appeal.reviewer_refused', 'appeal.review_started', 'appeal.decided']);
    const appeal = await Appeal.findById(filed.body.id).lean();
    expect(appeal.reviewerId).toBe(String(ctx.chair._id));
    expect([recordBefore.proposedBy, recordBefore.approvedBy]).not.toContain(appeal.reviewerId);
    expect((await verifyChain()).intact).toBe(true);
  });
});
