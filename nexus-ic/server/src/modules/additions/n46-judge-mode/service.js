import mongoose from 'mongoose';
import User from '../../auth/User.js';
import Case from '../../cases/Case.js';
import Institution from '../../institutions/Institution.js';
import { recordAudit, resetDemoAuditChain } from '../../audit/audit.js';
import { getReporterId, getVerifiedInstitutionPid } from '../../identity/index.js';
import { generateMasterCaseId } from '../../cases/caseService.js';
import { checkAction, proceedAction } from '../../prevent/stage2.js';
import { listInstitutions } from '../../registry/RegistrySimulator.js';
import { fail } from '../../closure/util.js';

/**
 * N46 Judge Demo Mode (ADDITIONS.md).
 *
 * One click resets demo data and plays a captioned guided tour of the
 * two-bureau overlap scenario. Demo-only: every call is refused in production
 * mode, and reset refuses any database whose name does not end in _demo
 * (or _test, for the test suite). The scenario runs through the real PREVENT
 * Stage 2 service, so no manual database edit is needed (SPEC 18).
 */
export const BANNER = 'Potential Overlapping Cases – Coordination Required';
const SUBJECT = 'Fee refund ledger for the laboratory fee (synthetic)';

const scenarioSchema = new mongoose.Schema(
  {
    institutionPid: { type: String, required: true },
    cases: [{ masterCaseId: String, bureau: String, _id: false }],
    preventResult: { type: String, required: true },
    preventReasons: { type: [String], default: [] },
    createdAt: { type: Date, required: true },
    synthetic: { type: Boolean, default: true },
  },
  { strict: 'throw' }
);
export const JudgeScenario = mongoose.models.judge_scenarios || mongoose.model('judge_scenarios', scenarioSchema, 'judge_scenarios');

export function assertDemo() {
  if (process.env.APP_MODE === 'production') throw fail(404, 'NOT_FOUND');
}

function assertDemoDatabase() {
  const name = mongoose.connection.name || '';
  if (!/(^|_)(demo|test)$/.test(name)) throw fail(409, 'DEMO_DATABASE_REQUIRED');
}

const session = (u) => ({ id: String(u._id), _id: u._id, username: u.username, role: u.role, bureau: u.bureau, region: u.region });

/** Seed the two-bureau overlap scenario through the real services. */
export async function seedOverlapScenario() {
  const [student, faculty, rb, pgrc] = await Promise.all(['trust_student_verified', 'trust_faculty_verified', 'rb_officer1', 'pgrc_officer1'].map((username) => User.findOne({ username })));
  if (!student || !faculty || !rb || !pgrc) throw fail(409, 'DEMO_ACCOUNTS_REQUIRED');
  const pid = (await getVerifiedInstitutionPid(student._id)) || (await Institution.findOne({}).sort({ pid: 1 }).lean())?.pid;
  if (!pid) throw fail(409, 'INSTITUTION_REQUIRED');
  // The verified student's synthetic PID may not be in the seeded master list; add it the same way the S4 demo seed does.
  if (!(await Institution.exists({ pid }))) {
    const fixture = listInstitutions(1)[0];
    await Institution.create({ pid, name: fixture.name, state: fixture.state, region: fixture.region, type: fixture.type, approvalStatus: fixture.approvalStatus, synthetic: true });
  }
  const institution = await Institution.findOne({ pid }).lean();

  const made = [];
  for (const [owner, officer] of [[student, rb], [faculty, pgrc]]) {
    const caseDoc = await Case.create({
      masterCaseId: await generateMasterCaseId(new Date().getFullYear()),
      reporterId: await getReporterId(owner._id),
      institutionPid: pid,
      pidSnapshot: { pid, region: institution?.region || null },
      category: 'Fee Dispute',
      subCategory: 'Refund Denial',
      narrative: 'Laboratory fee refund not paid after request',
      narrativeHash: `judge-scenario-${owner.username}`,
      status: 'Under Process',
      analyticStatus: 'IN_PROCESS',
      owningBureau: officer.bureau,
      routingDecisionId: new mongoose.Types.ObjectId(),
      currentOwner: { office: officer.bureau, role: officer.role, officerId: officer._id, officerName: officer.displayName, assignedAt: new Date() },
      synthetic: true,
    });
    made.push({ caseDoc, officer });
  }

  // RB asks for the ledger first; PGRC then asks for the same document on the related case.
  let last = null;
  for (const { caseDoc, officer } of made) {
    last = await checkAction(session(officer), { caseId: String(caseDoc._id), actionType: 'DOCUMENT_REQUEST', details: { subject: SUBJECT } });
    await proceedAction(session(officer), last.checkId, 'Scripted walkthrough decision: retain the two bureau actions to inspect their overlap evidence.');
  }

  return JudgeScenario.create({
    institutionPid: pid,
    cases: made.map(({ caseDoc, officer }) => ({ masterCaseId: caseDoc.masterCaseId, bureau: officer.bureau })),
    preventResult: last.result,
    preventReasons: last.reasons,
    createdAt: new Date(),
  });
}

/** One click: clear the demo database, re-run the standard seeds, then the scenario. */
export async function resetAndSeed(user = { id: 'judge-mode', role: 'system' }) {
  assertDemo();
  assertDemoDatabase();
  for (const collection of Object.values(mongoose.connection.collections)) {
    if (collection.name !== 'auditevents') await collection.deleteMany({});
  }
  await resetDemoAuditChain();
  await (await import('../../auth/seed.js')).seedDemoAccounts();
  await (await import('../../identity/seed.js')).seedIdentityReporters();
  await (await import('../../institutions/seed.js')).seedInstitutionsAndRegions();
  await (await import('../../rulebook/seed.js')).seedRuleBook();
  await (await import('../../bureaus/seed.js')).seedBureaus();
  // S3's fixture seed currently fails validation (transfers without dueAt / senderOfficerId);
  // the scenario does not depend on it, so a failure is reported instead of stopping the reset.
  let s3Fixtures = 'SEEDED';
  try {
    await (await import('../../sync/seed.js')).seedS3Fixtures();
  } catch {
    s3Fixtures = 'UNKNOWN';
  }
  await (await import('../../authority/seed.js')).seedS5();
  const scenario = await seedOverlapScenario();
  await recordAudit({
    actorId: String(user.id || user._id || 'judge-mode'), actorRole: user.role || 'system', action: 'judge.reset', targetType: 'JudgeScenario', targetId: String(scenario._id),
    meta: { institutionPid: scenario.institutionPid, cases: scenario.cases.map((c) => c.masterCaseId) },
  });
  return { ...tour(scenario), s3Fixtures: s3Fixtures === 'SEEDED' ? 'SEEDED' : { result: 'UNKNOWN', reason: 'S3_FIXTURE_SEED_FAILED' } };
}

export function tour(scenario) {
  const [a, b] = scenario.cases;
  const pid = scenario.institutionPid;
  return {
    synthetic: true,
    banner: BANNER,
    scenario: { institutionPid: pid, cases: scenario.cases, preventResult: scenario.preventResult, preventReasons: scenario.preventReasons },
    steps: [
      { n: 1, caption: `Two verified complainants report the same refund issue at one institution (${pid}).`, link: `/institutions/${pid}`, loginAs: 'supervisor1' },
      { n: 2, caption: `NEXUS ROUTE has the cases with two bureaus: ${a.masterCaseId} with ${a.bureau}, ${b.masterCaseId} with ${b.bureau}.`, link: '/dashboard', loginAs: 'rb_officer1' },
      { n: 3, caption: `Both bureaus request the same document. PREVENT Stage 2 returns ${scenario.preventResult} (${scenario.preventReasons.join(', ')}). It advises; it never blocks.`, link: '/review', loginAs: 'pgrc_officer1' },
      { n: 4, caption: `The banner "${BANNER}" appears on /dashboard, /institutions/:id and /review.`, link: '/dashboard', loginAs: 'supervisor1' },
      { n: 5, caption: 'The overlap timeline shows both bureaus side by side with the conflict point marked.', link: `/overlap-timeline/${pid}`, loginAs: 'supervisor1' },
      { n: 6, caption: 'The bureaus coordinate through NEXUS SYNC. Nothing is merged, moved or closed automatically.', link: `/sync/${pid}`, loginAs: 'rb_officer1' },
      { n: 7, caption: 'NEXUS IMPACT counts the overlap. Click any number to see the cases behind it.', link: '/impact', loginAs: 'supervisor1' },
    ],
    note: 'All demo accounts use the password demo1234. Data is synthetic.',
  };
}

export async function currentTour() {
  assertDemo();
  const scenario = await JudgeScenario.findOne({}).sort({ createdAt: -1 }).lean();
  if (!scenario) return { synthetic: true, result: 'NOT_SEEDED', banner: BANNER, steps: [] };
  return tour(scenario);
}
