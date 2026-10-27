import { describe, it, expect, beforeEach } from 'vitest';
import Case from '../src/modules/cases/Case.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { verifyChain } from '../src/modules/audit/audit.js';
import { ClosureRecord } from '../src/modules/closure/models.js';
import { transitionStatus } from '../src/modules/lifecycle/lifecycleService.js';
import { setupS5, agent, makeCase, addAction, addDocument, addTransfer, addTask, closeThroughProof } from './s5-helpers.js';

let ctx;
beforeEach(async () => {
  ctx = await setupS5();
});

describe('S5 NEXUS PROOF closure gate (N22, N76, U24, U25, F26)', () => {
  it('[N22] proposal records action records, hashed evidence and a packet hash; approval by a different officer; a human closes; the system never closes on its own', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    const action = await addAction(c, ctx.officer);
    const doc = await addDocument(c, ctx.officer);
    const officer = await agent(ctx.app, ctx.officer);
    const proposed = await officer.post(`/api/v1/cases/${c.masterCaseId}/closure/propose`).send({ closureReason: 'Refund issued (synthetic)', evidenceDocumentIds: [String(doc._id)] }).expect(200);
    expect(proposed.body.state).toBe('PROPOSED');
    expect(proposed.body.actionRecordIds).toEqual([String(action._id)]);
    expect(proposed.body.evidenceRefs[0].originalHash).toBe(doc.originalHash);
    expect(proposed.body.packetHash).toMatch(/^[0-9a-f]{64}$/);
    expect((await Case.findById(c._id)).status).toBe('Resolution Proposed');

    // Approval alone never closes the case.
    const sup = await agent(ctx.app, ctx.supervisor);
    await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/approve`).expect(200);
    expect((await Case.findById(c._id)).status).toBe('Verified/Approved');

    const closed = await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/close`).expect(200);
    expect(closed.body.gate).toMatchObject({ tasksComplete: 'PASS', transfersAcknowledged: 'PASS', evidenceAttached: 'PASS', approvalExists: 'PASS', passed: true });
    const fresh = await Case.findById(c._id);
    expect(fresh.status).toBe('Closed');
    expect(String(fresh.closureRecordId)).toBe(proposed.body._id);
    const record = await ClosureRecord.findById(proposed.body._id).lean();
    expect(record.state).toBe('CLOSED');
    expect(record.approvedBy).not.toBe(record.proposedBy);
    for (const action of ['closure.proposed', 'closure.approved', 'closure.closed']) expect(await AuditEvent.exists({ action, targetId: String(c._id) })).toBeTruthy();
    expect((await verifyChain()).intact).toBe(true);
  });

  it('[U24] closure is blocked until every task is complete, every transfer acknowledged, evidence attached and approval exists; no other route can set Closed', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    await addAction(c, ctx.officer);
    const task = await addTask(c);
    const transfer = await addTransfer(c, ctx.pgrc, { status: 'REQUESTED', acknowledgedAt: null });
    const officer = await agent(ctx.app, ctx.officer);
    const sup = await agent(ctx.app, ctx.supervisor);

    // Nothing proposed yet: evidence and approval missing too.
    let blocked = await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/close`).expect(409);
    expect(blocked.body.error).toBe('CLOSURE_GATE_BLOCKED');
    expect(blocked.body.details).toMatchObject({ tasksComplete: 'FAIL', transfersAcknowledged: 'FAIL', evidenceAttached: 'FAIL', approvalExists: 'FAIL', passed: false });

    await officer.post(`/api/v1/cases/${c.masterCaseId}/closure/propose`).send({ closureReason: 'Synthetic resolution' }).expect(200);
    blocked = await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/close`).expect(409);
    expect(blocked.body.details.evidenceAttached).toBe('FAIL');

    const doc = await addDocument(c, ctx.officer);
    await officer.post(`/api/v1/cases/${c.masterCaseId}/closure/evidence`).send({ documentIds: [String(doc._id)] }).expect(200);
    await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/approve`).expect(200);
    blocked = await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/close`).expect(409);
    expect(blocked.body.details).toMatchObject({ tasksComplete: 'FAIL', transfersAcknowledged: 'FAIL', evidenceAttached: 'PASS', approvalExists: 'PASS' });

    await transfer.updateOne({ status: 'ACCEPTED', acknowledgedAt: new Date() });
    blocked = await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/close`).expect(409);
    expect(blocked.body.details).toMatchObject({ tasksComplete: 'FAIL', transfersAcknowledged: 'PASS' });
    expect((await Case.findById(c._id)).status).toBe('Verified/Approved');

    // The status route and direct saves cannot bypass the gate.
    const patched = await sup.patch(`/api/v1/cases/${c.masterCaseId}/status`).send({ status: 'Closed', reason: 'bypass attempt' });
    expect(patched.status).toBe(409);
    await expect(transitionStatus(c._id, 'Closed', ctx.supervisor, 'bypass')).rejects.toThrow('CLOSURE_GATE_REQUIRED');
    await expect(Case.updateOne({ _id: c._id }, { $set: { status: 'Closed' } })).rejects.toThrow('CLOSURE_GATE_REQUIRED');
    expect((await Case.findById(c._id)).status).toBe('Verified/Approved');

    await task.updateOne({ status: 'COMPLETED', completedAt: new Date() });
    const ok = await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/close`).expect(200);
    expect(ok.body.gate.passed).toBe(true);
    const record = await ClosureRecord.findOne({ caseId: c._id }).lean();
    expect(record.gateResults.filter((g) => !g.passed).length).toBeGreaterThanOrEqual(3);
    expect(await AuditEvent.countDocuments({ action: 'closure.blocked', targetId: String(c._id) })).toBe(4);
  });

  it('[U25] the closure approver must differ from the proposer', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    await addAction(c, ctx.officer);
    const doc = await addDocument(c, ctx.officer);
    const sup = await agent(ctx.app, ctx.supervisor);
    await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/propose`).send({ closureReason: 'Supervisor proposes (synthetic)', evidenceDocumentIds: [String(doc._id)] }).expect(200);
    const refused = await sup.post(`/api/v1/cases/${c.masterCaseId}/closure/approve`).expect(403);
    expect(refused.body.error).toBe('APPROVER_MUST_DIFFER');
    expect((await Case.findById(c._id)).status).toBe('Resolution Proposed');
    expect(await AuditEvent.exists({ action: 'closure.approval_refused' })).toBeTruthy();
    // A bureau officer is not an approver role.
    const officer = await agent(ctx.app, ctx.officer);
    await officer.post(`/api/v1/cases/${c.masterCaseId}/closure/approve`).expect(403);
    const authority = await agent(ctx.app, ctx.authority);
    const ok = await authority.post(`/api/v1/cases/${c.masterCaseId}/closure/approve`).expect(200);
    expect(ok.body.approvedBy).toBe(String(ctx.authority._id));
    expect(ok.body.proposedBy).toBe(String(ctx.supervisor._id));
    // The model invariant holds even if a caller skips the service check.
    const record = await ClosureRecord.findById(ok.body._id);
    record.approvedBy = record.proposedBy;
    await expect(record.save()).rejects.toThrow('APPROVER_MUST_DIFFER');
  });

  it('[N76] a closure reason is required at PROOF, and closing marks the case as disposed', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    await addAction(c, ctx.officer);
    const officer = await agent(ctx.app, ctx.officer);
    for (const body of [{}, { closureReason: '' }, { closureReason: '   ' }]) {
      const res = await officer.post(`/api/v1/cases/${c.masterCaseId}/closure/propose`).send(body).expect(400);
      expect(res.body.error).toBe('CLOSURE_REASON_REQUIRED');
    }
    const closed = await closeThroughProof(ctx, await makeCase(ctx.student, ctx.officer));
    expect(closed.status).toBe('Closed');
    expect(closed.analyticStatus).toBe('DISPOSED');
    const record = await ClosureRecord.findOne({ caseId: closed._id }).lean();
    expect(record.closureReason).toBe('Refund issued by institution (synthetic)');
  });

  it('[F26] (hint only) closure needs evidence and action records: no action records refuses the proposal, no evidence blocks closing', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    const officer = await agent(ctx.app, ctx.officer);
    const res = await officer.post(`/api/v1/cases/${c.masterCaseId}/closure/propose`).send({ closureReason: 'No actions recorded' }).expect(400);
    expect(res.body.error).toBe('ACTION_RECORDS_REQUIRED');
    await addAction(c, ctx.officer);
    await officer.post(`/api/v1/cases/${c.masterCaseId}/closure/propose`).send({ closureReason: 'Actions recorded, no evidence' }).expect(200);
    await (await agent(ctx.app, ctx.supervisor)).post(`/api/v1/cases/${c.masterCaseId}/closure/approve`).expect(200);
    const blocked = await officer.post(`/api/v1/cases/${c.masterCaseId}/closure/close`).expect(409);
    expect(blocked.body.details.evidenceAttached).toBe('FAIL');
    // An officer outside the case scope sees nothing.
    const other = await agent(ctx.app, ctx.pgrc);
    await other.get(`/api/v1/cases/${c.masterCaseId}/closure`).expect(404);
  });
});
