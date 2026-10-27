// Load test (S7 scale evidence). Synthetic only, on a throwaway in-memory MongoDB; it never
// touches the demo or test databases. Usage: node scripts/load-test.mjs [cases] (default 50000).
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const COUNT = Number(process.argv[2]) || 50000;
const BUSY = 2000; // extra cases at one institution, to stress PREVENT Stage 1
process.env.APP_MODE = 'demo';
process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex');
process.env.SESSION_SECRET = 'load-test';
process.env.NODE_ENV = 'production-like-load-test';
console.debug = () => {};

const mongod = await MongoMemoryServer.create();
await mongoose.connect(mongod.getUri('load_test'));

const { generate } = await import('../src/modules/additions/n48-data-generator/generator.js');
const { default: Case } = await import('../src/modules/cases/Case.js');
const { default: Institution } = await import('../src/modules/institutions/Institution.js');
const { default: User } = await import('../src/modules/auth/User.js');
const { seedDemoAccounts } = await import('../src/modules/auth/seed.js');
const { seedIdentityReporters } = await import('../src/modules/identity/seed.js');
const { seedRuleBook } = await import('../src/modules/rulebook/seed.js');
const { getReporterId, getVerifiedInstitutionPid } = await import('../src/modules/identity/index.js');
const { checkSimilar } = await import('../src/modules/prevent/stage1.js');
const { buildImpactReport } = await import('../src/modules/impact/impactService.js');
const { myQueue } = await import('../src/modules/workspaces/workspaceService.js');
const { ensureExtraIndexes } = await import('../src/modules/performance/indexes.js');

await seedDemoAccounts();
await seedIdentityReporters();
await seedRuleBook();
const student = await User.findOne({ username: 'trust_student_verified' });
const officer = await User.findOne({ username: 'rb_officer1' });
const supervisor = await User.findOne({ username: 'supervisor1' });
const busyPid = await getVerifiedInstitutionPid(student._id);
const reporterId = await getReporterId(student._id);

const t0 = performance.now();
const { institutions, complaints } = generate({ count: COUNT, seed: 'S7-load-v1' });
await Institution.insertMany(institutions.filter((i) => i.pid !== busyPid).map((i) => ({ pid: i.pid, name: i.name, state: i.state, region: i.region, type: i.type, approvalStatus: i.approvalStatus, synthetic: true })), { ordered: false });
await Institution.create({ pid: busyPid, name: 'Synthetic busy institution', state: 'DEMO', region: 'Northern', type: 'DEMO', approvalStatus: 'approved', synthetic: true });
const regionOf = new Map(institutions.map((i) => [i.pid, i.region]));
const bureaus = ['Regulation Bureau', 'Public Grievance Redressal Cell', 'Academic Bureau'];
const rows = complaints.map((c, i) => ({
  masterCaseId: `NX-2026-${String(i + 1).padStart(6, '0')}`, reporterId: c.complainantId, institutionPid: c.institutionPid,
  pidSnapshot: { region: regionOf.get(c.institutionPid) }, category: c.category, subCategory: c.subCategory, narrative: c.narrative,
  narrativeHash: crypto.createHash('sha256').update(`${i}`).digest('hex'), status: c.status, owningBureau: bureaus[i % 3],
  routingDecisionId: new mongoose.Types.ObjectId(), synthetic: true,
}));
const busyRows = [];
for (let i = 0; i < BUSY; i++) {
  const c = complaints[i];
  busyRows.push({ ...rows[i], masterCaseId: `NX-2027-${String(i + 1).padStart(6, '0')}`, institutionPid: busyPid, narrativeHash: `busy-${i}`, reporterId: i % 50 ? c.complainantId : reporterId });
}
for (let i = 0; i < rows.length; i += 5000) await Case.insertMany(rows.slice(i, i + 5000), { ordered: false });
await Case.syncIndexes();
await ensureExtraIndexes();
const loadMs = performance.now() - t0;

async function time(label, fn, runs = 3) {
  const samples = [];
  let out;
  for (let i = 0; i < runs; i++) {
    const s = performance.now();
    out = await fn();
    samples.push(performance.now() - s);
  }
  samples.sort((a, b) => a - b);
  return { label, medianMs: Math.round(samples[Math.floor(runs / 2)]), runs, detail: out };
}

const session = (u) => ({ id: String(u._id), _id: u._id, role: u.role, bureau: u.bureau, region: u.region, username: u.username });
// Realistic spread first (about ten cases per institution, as 1 lakh complaints over 9,000
// institutions would give), then a deliberately busy institution for the Stage 1 worst case.
const results = [
  await time(`IMPACT summary over ${rows.length} cases at ${institutions.length} institutions (supervisor)`, async () => {
    const r = await buildImpactReport(session(supervisor));
    return `${r.tiles.totalComplaints.count} cases, ${r.tiles.potentialOverlaps.pairs} overlap pairs`;
  }, 1),
  await time('IMPACT summary again with no new data (reused report)', async () => {
    const r = await buildImpactReport(session(supervisor));
    return `${r.tiles.totalComplaints.count} cases`;
  }, 3),
  await time(`Officer queue (bureau scope) over ${rows.length} cases`, async () => {
    const r = await myQueue(session(officer));
    return `${r.counts.open} open in scope`;
  }, 1),
];
for (let i = 0; i < busyRows.length; i += 5000) await Case.insertMany(busyRows.slice(i, i + 5000), { ordered: false });
results.push(
  await time(`PREVENT Stage 1 check at one institution with ${BUSY} cases (worst case)`, async () => {
    const r = await checkSimilar(session(student), { institutionPid: busyPid, category: 'Fee Dispute', subCategory: 'Fee Dispute', narrative: complaints[0].narrative });
    return `${r.result}, ${r.hints.length} hints`;
  }),
  await time('Case lookup by institution and status (index-backed)', async () => {
    const n = await Case.countDocuments({ institutionPid: busyPid, status: { $ne: 'Closed' } });
    return `${n} open at the busy institution`;
  }),
);

console.log(JSON.stringify({ cases: rows.length + busyRows.length, institutions: institutions.length, loadMs: Math.round(loadMs), results, node: process.version, synthetic: true }, null, 2));
await mongoose.disconnect();
await mongod.stop();
