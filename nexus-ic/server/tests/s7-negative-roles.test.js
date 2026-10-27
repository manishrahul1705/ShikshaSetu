import { describe, it, expect, beforeEach } from 'vitest';
import User from '../src/modules/auth/User.js';
import { addInternalNote } from '../src/modules/sync/internalNotesService.js';
import { sendQuery } from '../src/modules/queries/queryService.js';
import { setupS5, agent, makeCase, addDocument, addAction, OTHER_PID, PID } from './s5-helpers.js';

/**
 * S7 negative-role sweep. For every role, read, search, export and download
 * what it must not see: reporter identity (vault), internal notes, other
 * bureaus' narratives, other complainants' cases. Any hit is a critical failure.
 */
const NARRATIVE_A = 'Synthetic private narrative A: lab fee withheld';
const NARRATIVE_B = 'Synthetic private narrative B: hostel deposit withheld';
const NOTE = 'Synthetic internal note: do not disclose';
const VAULT_NAMES = ['Synthetic student STUDENT-SECOND', 'Synthetic faculty FACULTY-SECOND', 'DEMO-APAAR-STUDENT-SECOND', 'DEMO-STAFF-FACULTY-SECOND'];

let ctx, A, B, docA, regional;
beforeEach(async () => {
  ctx = await setupS5();
  regional = await User.findOne({ username: 'regional1' });
  A = await makeCase(ctx.student, ctx.officer, { narrative: NARRATIVE_A });
  B = await makeCase(ctx.faculty, ctx.pgrc, { narrative: NARRATIVE_B, institutionPid: OTHER_PID, pidSnapshot: { region: 'Southern' } });
  await addInternalNote(ctx.officer, A._id, NOTE);
  await addInternalNote(ctx.pgrc, B._id, 'Synthetic PGRC own note');
  await addAction(A, ctx.officer);
  await sendQuery(ctx.officer, { caseId: String(A._id), recipientType: 'institution', queryText: 'Synthetic institution request' });
  docA = await addDocument(A, ctx.officer);
});

async function sweep(user, paths) {
  const a = await agent(ctx.app, user);
  const bodies = [];
  for (const p of paths) {
    const res = await a.get(`/api/v1${p}`);
    bodies.push({ p, status: res.status, text: res.text || '' });
  }
  return bodies;
}
const caseProbes = (c) => [
  `/cases/${c.masterCaseId}`, `/cases/${c._id}`, `/cases/${c.masterCaseId}/complainant-status`, `/track/${c.masterCaseId}`, `/track/${c.masterCaseId}/receipt`,
  `/sync/notes/${c._id}`, `/queries/case/${c._id}`, `/actions/case/${c._id}`, `/transfers/case/${c._id}`, `/cases/${c.masterCaseId}/closure`, `/cases/${c.masterCaseId}/redaction`,
];
const shared = () => [
  '/cases/my', '/track', `/institutions/${PID}/360`, `/institutions/${OTHER_PID}/360`, `/institutions?icid=DEMO`, '/prevent/overlaps', '/prevent/alerts',
  '/impact/summary', '/impact/report.csv', '/impact/cases?row=tile:totalComplaints', '/impact/patterns', `/overlap-timeline/${PID}`, `/graph/institutions/${PID}`,
  '/institution-workspace/cases', `/institution-workspace/cases/${A.masterCaseId}`, '/authority/overview', `/authority/cases/${A.masterCaseId}`,
  '/rescue/alerts', '/appeals', '/users', '/identity/reveal-requests', `/documents/${docA._id}/download`, '/sync/log', `/sync/institution/${PID}`,
];
// Only the response is checked; the request path itself may contain the probed ID.
const leaks = (bodies, secrets) => bodies.filter((b) => secrets.some((s) => b.text.includes(s))).map((b) => `${b.p} -> ${b.status} [${secrets.filter((s) => b.text.includes(s)).join(' | ')}]`);

describe('S7 negative-role sweep (critical if any leak)', () => {
  it('[NEG] another complainant sees none of case A: no narrative, no internal note, no identity, no case ID', async () => {
    const bodies = await sweep(ctx.faculty, [...caseProbes(A), ...shared()]);
    expect(leaks(bodies, [NARRATIVE_A, NOTE, A.masterCaseId, ...VAULT_NAMES.slice(0, 1), A.reporterId])).toEqual([]);
  });

  it('[NEG] the owning complainant never sees internal notes or officer-only data', async () => {
    const bodies = await sweep(ctx.student, [...caseProbes(A), ...shared()]);
    expect(leaks(bodies, [NOTE, NARRATIVE_B, B.masterCaseId])).toEqual([]);
  });

  it('[NEG] the institution admin never sees reporter identity, raw narratives or internal notes', async () => {
    const bodies = await sweep(ctx.instAdmin, [...caseProbes(A), ...caseProbes(B), ...shared()]);
    expect(leaks(bodies, [NARRATIVE_A, NARRATIVE_B, NOTE, A.reporterId, B.reporterId, ...VAULT_NAMES])).toEqual([]);
  });

  it("[NEG] a bureau officer never sees another bureau's narrative or internal notes", async () => {
    const bodies = await sweep(ctx.pgrc, [...caseProbes(A), ...shared()]);
    expect(leaks(bodies, [NARRATIVE_A, NOTE, ...VAULT_NAMES])).toEqual([]);
  });

  it('[NEG] a regional officer never sees cases outside the delegated region', async () => {
    const bodies = await sweep(regional, [...caseProbes(B), ...shared()]);
    expect(leaks(bodies, [NARRATIVE_B, B.masterCaseId, ...VAULT_NAMES])).toEqual([]);
  });

  it('[NEG] the Competent Authority gets no private narrative or reporter identity anywhere (D16, S19)', async () => {
    const bodies = await sweep(ctx.authority, [...caseProbes(A), ...caseProbes(B), ...shared()]);
    expect(leaks(bodies, [NARRATIVE_A, NARRATIVE_B, ...VAULT_NAMES])).toEqual([]);
  });

  it('[NEG] supervisor, auditor and system admin never receive vault identity', async () => {
    const sysadmin = await User.findOne({ username: 'sysadmin1' });
    for (const user of [ctx.supervisor, ctx.auditor, sysadmin]) {
      const bodies = await sweep(user, [...caseProbes(A), ...caseProbes(B), ...shared()]);
      expect([user.username, leaks(bodies, VAULT_NAMES)]).toEqual([user.username, []]);
    }
  });

  it('[NEG] anonymous requests get nothing', async () => {
    const supertest = (await import('supertest')).default;
    for (const p of [...caseProbes(A), ...shared()]) {
      const res = await supertest(ctx.app).get(`/api/v1${p}`);
      expect([p, res.status === 401 || res.status === 404]).toEqual([p, true]);
    }
  });
});
