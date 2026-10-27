import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import Case from '../src/modules/cases/Case.js';
import User from '../src/modules/auth/User.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { addInternalNote } from '../src/modules/sync/internalNotesService.js';
import { sendQuery } from '../src/modules/queries/queryService.js';
import { AuthorityDecision } from '../src/modules/authority/authorityService.js';
import { detectSensitive } from '../src/modules/additions/n62-redaction/service.js';
import { setupS5, agent, makeCase, addAction, addDocument, closeThroughProof, NARRATIVE, OTHER_PID } from './s5-helpers.js';

let ctx;
beforeEach(async () => {
  ctx = await setupS5();
});

const NOTE = 'Synthetic internal officer note';
const leaks = (json, c) => [NARRATIVE, NOTE, c.reporterId, String(ctx.student._id), 'Synthetic student'].filter((s) => s && json.includes(s));

describe('S5 complainant workspace (N29, U31, A-N63)', () => {
  it('[N29] /track/:caseId shows exact status, owner as office and role, status history, SLA summary, closure reason and appeal rule state; no internal notes', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    await addInternalNote(ctx.officer, c._id, NOTE);
    const student = await agent(ctx.app, ctx.student);
    let res = await student.get(`/api/v1/track/${c.masterCaseId}`).expect(200);
    expect(res.body).toMatchObject({ masterCaseId: c.masterCaseId, status: 'Under Process', accountableOwner: { office: 'Regulation Bureau', role: 'bureau_officer' }, appealRule: { result: 'POLICY_NOT_CONFIGURED' }, synthetic: true });
    expect(res.body.statusHistory[0].status).toBe('Registered');
    expect(res.body).toHaveProperty('slaClockSummary');
    expect(JSON.stringify(res.body)).not.toContain(NOTE);
    expect(JSON.stringify(res.body)).not.toContain(ctx.officer.displayName);

    await closeThroughProof(ctx, c);
    res = await student.get(`/api/v1/track/${c.masterCaseId}`).expect(200);
    expect(res.body.status).toBe('Closed');
    expect(res.body.statusHistory.map((h) => h.status)).toEqual(['Registered', 'Resolution Proposed', 'Verified/Approved', 'Closed']);
    expect(res.body.closure).toMatchObject({ state: 'CLOSED', closureReason: 'Refund issued by institution (synthetic)' });
    expect(res.body.feedbackOpen).toBe(true);
    const list = await student.get('/api/v1/track').expect(200);
    expect(list.body.map((x) => x.masterCaseId)).toContain(c.masterCaseId);
  });

  it('[U31] a complainant sees only own cases; IDOR attempts by Master Case ID or _id are denied and audited', async () => {
    const mine = await makeCase(ctx.student, ctx.officer);
    const theirs = await makeCase(ctx.faculty, ctx.officer);
    const student = await agent(ctx.app, ctx.student);
    await student.get(`/api/v1/track/${mine.masterCaseId}`).expect(200);
    for (const ref of [theirs.masterCaseId, String(theirs._id), 'NX-2026-999999']) {
      const res = await student.get(`/api/v1/track/${ref}`).expect(404);
      expect(res.body.error).toBe('CASE_NOT_FOUND');
    }
    await student.get(`/api/v1/track/${theirs.masterCaseId}/receipt`).expect(404);
    await student.post(`/api/v1/cases/${theirs.masterCaseId}/feedback`).send({ rating: 3 }).expect(404);
    expect((await student.get('/api/v1/track').expect(200)).body.map((x) => x.masterCaseId)).toEqual([mine.masterCaseId]);
    expect(await AuditEvent.countDocuments({ action: 'track.access_denied_idor', actorId: String(ctx.student._id) })).toBe(4);
    // Officers do not use the complainant view, and anonymous requests need login.
    await (await agent(ctx.app, ctx.officer)).get(`/api/v1/track/${mine.masterCaseId}`).expect(404);
    await supertest(ctx.app).get(`/api/v1/track/${mine.masterCaseId}`).expect(401);
  });

  it('[A-N63] the case receipt carries the Master Case ID, status history and a link or QR to /track/:caseId, with no internal notes or narrative', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    await addInternalNote(ctx.officer, c._id, NOTE);
    const res = await (await agent(ctx.app, ctx.student)).get(`/api/v1/track/${c.masterCaseId}/receipt`).expect(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.headers['content-disposition']).toContain(`receipt-${c.masterCaseId}.html`);
    const html = res.text;
    expect(html).toContain(c.masterCaseId);
    expect(html).not.toContain('SYNTHETIC DATA'); // Explicit export-footer override.
    expect(html).toContain('AWAAZ DASTAK');
    expect(html).toContain(`/track/${c.masterCaseId}`);
    expect(html).toContain('You will need to log in.');
    expect(html).toMatch(/<svg|QR code: UNKNOWN \(QR_LIBRARY_NOT_INSTALLED\)/);
    expect(html).toContain('<td>Registered</td>');
    expect(leaks(html, c)).toEqual([]);
  });
});

describe('S5 institution workspace (N30, N71, S22, U32, A-N62)', () => {
  it('[N30] the institution admin sees only cases about their own institution, in the redacted institution-facing form, and requests addressed to them', async () => {
    const own = await makeCase(ctx.student, ctx.officer);
    const other = await makeCase(ctx.student, ctx.officer, { institutionPid: OTHER_PID });
    const admin = await agent(ctx.app, ctx.instAdmin);
    const list = await admin.get('/api/v1/institution-workspace/cases').expect(200);
    expect(list.body.cases.map((x) => x.masterCaseId)).toEqual([own.masterCaseId]);
    expect(list.body.cases[0].institutionFacingForm).toEqual({ result: 'NOT_RELEASED', reason: 'AWAITING_OFFICER_REDACTION' });
    await admin.get(`/api/v1/institution-workspace/cases/${other.masterCaseId}`).expect(404);
    // An admin with no linked institution gets nothing.
    await User.updateOne({ _id: ctx.instAdmin._id }, { $set: { institutionPid: null } });
    expect((await admin.get('/api/v1/institution-workspace/cases').expect(403)).body.error).toBe('INSTITUTION_NOT_LINKED');
    await (await agent(ctx.app, ctx.student)).get('/api/v1/institution-workspace/cases').expect(403);
  });

  it('[N71] the Institute Nodal Officer submits clarifications and documents, responds to AICTE queries and tracks institution-wise case status', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    await makeCase(ctx.student, ctx.officer, { status: 'SUBMITTED', analyticStatus: 'PENDING' });
    const query = await sendQuery(ctx.officer, { caseId: String(c._id), recipientType: 'institution', queryText: 'Please share the fee refund ledger (synthetic)' });
    const admin = await agent(ctx.app, ctx.instAdmin);
    const detail = await admin.get(`/api/v1/institution-workspace/cases/${c.masterCaseId}`).expect(200);
    expect(detail.body.pendingRequests).toBe(1);
    expect(detail.body.requests[0]).toMatchObject({ id: String(query._id), status: 'PENDING', from: 'Regulation Bureau' });
    const answered = await admin.post(`/api/v1/institution-workspace/queries/${query._id}/respond`).send({ responseText: 'Ledger attached (synthetic)' }).expect(200);
    expect(answered.body.status).toBe('RESPONDED');
    const doc = await addDocument(c, ctx.instAdmin);
    await admin.post(`/api/v1/institution-workspace/cases/${c.masterCaseId}/clarifications`).send({ text: 'Refund processed on synthetic date', documentIds: [String(doc._id)] }).expect(201);
    await admin.post(`/api/v1/institution-workspace/cases/${c.masterCaseId}/clarifications`).send({ text: '' }).expect(400);
    const after = await admin.get(`/api/v1/institution-workspace/cases/${c.masterCaseId}`).expect(200);
    expect(after.body.clarifications).toEqual([expect.objectContaining({ documentCount: 1 })]);
    expect(after.body.pendingRequests).toBe(0);
    const summary = await admin.get('/api/v1/institution-workspace/status-summary').expect(200);
    expect(summary.body).toMatchObject({ total: 2, byStatus: { 'Under Process': 1, Registered: 1 }, byAnalytic: { PENDING: 1, IN_PROCESS: 1, DISPOSED: 0 } });
    expect(await AuditEvent.exists({ action: 'institution.clarification.submitted' })).toBeTruthy();
  });

  it('[A-N62] the redaction helper highlights names, roll numbers and phone numbers; the officer confirms each before the institution-facing form', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    expect(detectSensitive(NARRATIVE).map((h) => [h.type, h.text])).toEqual([
      ['NAME', 'Ravi Kumar'], ['ROLL_NUMBER', '21BCE1234'], ['PHONE', '9876543210'],
    ]);
    const officer = await agent(ctx.app, ctx.officer);
    const s = await officer.get(`/api/v1/cases/${c.masterCaseId}/redaction`).expect(200);
    expect(s.body.highlights).toHaveLength(3);
    const partial = s.body.highlights.slice(0, 2).map((h) => ({ id: h.id, accept: true }));
    expect((await officer.post(`/api/v1/cases/${c.masterCaseId}/redaction/confirm`).send({ decisions: partial }).expect(400)).body.error).toBe('DECISION_MISSING');
    const decisions = s.body.highlights.map((h) => ({ id: h.id, accept: h.type !== 'ROLL_NUMBER' }));
    const confirmed = await officer.post(`/api/v1/cases/${c.masterCaseId}/redaction/confirm`).send({ decisions }).expect(200);
    expect(confirmed.body.redactedText).toContain('[REDACTED NAME]');
    expect(confirmed.body.redactedText).toContain('[REDACTED PHONE]');
    expect(confirmed.body.redactedText).toContain('21BCE1234');
    const view = await (await agent(ctx.app, ctx.instAdmin)).get(`/api/v1/institution-workspace/cases/${c.masterCaseId}`).expect(200);
    expect(view.body.institutionFacingForm.redactedText).toBe(confirmed.body.redactedText);
    expect(JSON.stringify(view.body)).not.toContain('Ravi Kumar');
    // The Competent Authority does not get the narrative through this tool (S19).
    await (await agent(ctx.app, ctx.authority)).get(`/api/v1/cases/${c.masterCaseId}/redaction`).expect(403);
  });

  it('[S22] the institution admin never sees reporter identity, even for a confirmed-sensitive case', async () => {
    const c = await makeCase(ctx.student, ctx.officer, { sensitivityFlags: [{ flag: 'ragging', status: 'CONFIRMED' }] });
    const officer = await agent(ctx.app, ctx.officer);
    const s = await officer.get(`/api/v1/cases/${c.masterCaseId}/redaction`).expect(200);
    await officer.post(`/api/v1/cases/${c.masterCaseId}/redaction/confirm`).send({ decisions: s.body.highlights.map((h) => ({ id: h.id, accept: true })) }).expect(200);
    const admin = await agent(ctx.app, ctx.instAdmin);
    const detail = await admin.get(`/api/v1/institution-workspace/cases/${c.masterCaseId}`).expect(200);
    expect(detail.body.institutionFacingForm).toEqual({ result: 'RESTRICTED', reason: 'SENSITIVE_CASE_RESTRICTED' });
    const all = JSON.stringify([detail.body, (await admin.get('/api/v1/institution-workspace/cases').expect(200)).body]);
    expect(leaks(all, c)).toEqual([]);
    expect(all).not.toMatch(/"reporterId"|"userId"|RP-[A-Z0-9]{4}/);
  });

  it('[U32] the institution admin sees no reporter identity in any institution-workspace response', async () => {
    const c = await makeCase(ctx.student, ctx.officer);
    await addInternalNote(ctx.officer, c._id, NOTE);
    const q = await sendQuery(ctx.officer, { caseId: String(c._id), recipientType: 'institution', queryText: 'Synthetic request' });
    const officer = await agent(ctx.app, ctx.officer);
    const s = await officer.get(`/api/v1/cases/${c.masterCaseId}/redaction`).expect(200);
    await officer.post(`/api/v1/cases/${c.masterCaseId}/redaction/confirm`).send({ decisions: s.body.highlights.map((h) => ({ id: h.id, accept: true })) }).expect(200);
    const admin = await agent(ctx.app, ctx.instAdmin);
    const bodies = [
      (await admin.get('/api/v1/institution-workspace/cases').expect(200)).body,
      (await admin.get(`/api/v1/institution-workspace/cases/${c.masterCaseId}`).expect(200)).body,
      (await admin.get('/api/v1/institution-workspace/status-summary').expect(200)).body,
      (await admin.post(`/api/v1/institution-workspace/queries/${q._id}/respond`).send({ responseText: 'ok' }).expect(200)).body,
    ];
    const json = JSON.stringify(bodies);
    expect(leaks(json, c)).toEqual([]);
    expect(json).not.toMatch(/"reporterId"|"userId"|"narrative"|internalNotes|RP-[A-Z0-9]{4}/);
  });
});

describe('S5 Competent Authority workspace (N80, S19)', () => {
  it('[S19] the Competent Authority workspace cannot bypass field ABAC: no narrative, reporter ID, vault identity or internal notes', async () => {
    const c = await makeCase(ctx.student, ctx.officer, { isEscalated: true });
    await addInternalNote(ctx.officer, c._id, NOTE);
    await closeThroughProof(ctx, await makeCase(ctx.student, ctx.officer));
    const authority = await agent(ctx.app, ctx.authority);
    const overview = await authority.get('/api/v1/authority/overview').expect(200);
    const single = await authority.get(`/api/v1/authority/cases/${c.masterCaseId}`).expect(200);
    const json = JSON.stringify([overview.body, single.body]);
    expect(leaks(json, c)).toEqual([]);
    expect(json).not.toMatch(/"narrative"|"reporterId"|"userId"|"documentIds"|internalNotes|RP-[A-Z0-9]{4}/);
    // SPEC 12.2 contents are present.
    for (const key of ['institutions', 'cases', 'pending', 'overdue', 'transferred', 'regionWise', 'bureauWise', 'approvals', 'escalations', 'notifications', 'auditAndEvidence', 'impact', 'feedback']) {
      expect(overview.body).toHaveProperty(key);
    }
    expect(overview.body.escalations.escalatedCases).toContain(c.masterCaseId);
    await (await agent(ctx.app, ctx.supervisor)).get('/api/v1/authority/overview').expect(403);
  });

  it('[N80] Competent Authority members (Chairperson, Member Secretary, Authorized Senior Official) record final decisions that never close a case', async () => {
    const designations = (await User.find({ role: 'competent_authority' }).select('authorityDesignation').lean()).map((u) => u.authorityDesignation).sort();
    expect(designations).toEqual(['Authorized Senior Official', 'Chairperson', 'Member Secretary']);
    const chair = await agent(ctx.app, ctx.chair);
    expect((await chair.get('/api/v1/authority/overview').expect(200)).body.designation).toBe('Chairperson');

    const quiet = await makeCase(ctx.student, ctx.officer);
    expect((await chair.post(`/api/v1/authority/cases/${quiet.masterCaseId}/decisions`).send({ kind: 'REVIEW_ESCALATED_CASE', decision: 'Reviewed', reason: 'Synthetic' }).expect(409)).body.error).toBe('CASE_NOT_ESCALATED');
    const escalated = await makeCase(ctx.student, ctx.officer, { isEscalated: true });
    await chair.post(`/api/v1/authority/cases/${escalated.masterCaseId}/decisions`).send({ kind: 'REVIEW_ESCALATED_CASE', decision: 'Reviewed; continue with RB', reason: 'Synthetic' }).expect(201);
    const final = await chair.post(`/api/v1/authority/cases/${escalated.masterCaseId}/decisions`).send({ kind: 'FINAL_DECISION', decision: 'Proceed to closure through PROOF', reason: 'Synthetic' }).expect(201);
    expect(final.body).toMatchObject({ designation: 'Chairperson', caseStatus: 'Under Process' });
    expect((await Case.findById(escalated._id)).status).toBe('Under Process');

    const recommended = await addAction(escalated, ctx.officer);
    await chair.post(`/api/v1/authority/cases/${escalated.masterCaseId}/decisions`).send({ kind: 'APPROVE_REGULATORY_ACTION', decision: 'APPROVED', reason: 'Synthetic', refId: String(recommended._id) }).expect(201);
    const own = await addAction(escalated, ctx.chair);
    expect((await chair.post(`/api/v1/authority/cases/${escalated.masterCaseId}/decisions`).send({ kind: 'APPROVE_REGULATORY_ACTION', decision: 'APPROVED', reason: 'Synthetic', refId: String(own._id) }).expect(403)).body.error).toBe('APPROVER_MUST_DIFFER');
    await chair.post(`/api/v1/authority/cases/${escalated.masterCaseId}/decisions`).send({ kind: 'APPROVE_CLOSURE', decision: 'x', reason: 'Closure goes through PROOF' }).expect(400);
    await (await agent(ctx.app, ctx.supervisor)).post(`/api/v1/authority/cases/${escalated.masterCaseId}/decisions`).send({ kind: 'FINAL_DECISION', decision: 'x', reason: 'y' }).expect(403);

    // Approving a closure as the Authority is recorded as an authority decision.
    const proposed = await makeCase(ctx.student, ctx.officer);
    await addAction(proposed, ctx.officer);
    const doc = await addDocument(proposed, ctx.officer);
    await (await agent(ctx.app, ctx.officer)).post(`/api/v1/cases/${proposed.masterCaseId}/closure/propose`).send({ closureReason: 'Synthetic', evidenceDocumentIds: [String(doc._id)] }).expect(200);
    await (await agent(ctx.app, ctx.authority)).post(`/api/v1/cases/${proposed.masterCaseId}/closure/approve`).expect(200);
    const kinds = (await AuthorityDecision.find({}).lean()).map((d) => [d.kind, d.designation]);
    expect(kinds).toEqual(expect.arrayContaining([['REVIEW_ESCALATED_CASE', 'Chairperson'], ['FINAL_DECISION', 'Chairperson'], ['APPROVE_REGULATORY_ACTION', 'Chairperson'], ['APPROVE_CLOSURE', 'Authorized Senior Official']]));
  });
});
