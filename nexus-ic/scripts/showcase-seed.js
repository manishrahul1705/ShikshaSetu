/**
 * Showcase data for the jury demo. SYNTHETIC ONLY.
 *
 *   node scripts/showcase-seed.js            (seeds mongodb://127.0.0.1:27017/awaaz_dastak_showcase)
 *   SHOWCASE_URI=mongodb://.../x_showcase node scripts/showcase-seed.js
 *
 * Writes only to a database whose name ends in "_showcase", so the shared demo
 * database (awaaz_dastak_demo) and test databases are never touched. It drops
 * that showcase database first, runs the normal seeds, then adds 600 generated
 * cases across registered institutions, all six regions and the bureaus, with
 * PID and ICID snapshots, source references, routing decisions, transfers,
 * PROOF closures and a few deliberate potential overlaps.
 *
 * SLA dates use the supplied 23 October source through approved RuleBook rules.
 * Local appeal settings are a delegated demonstration choice, not official policy.
 * No real complainant or institution data is used;
 * audit events are recorded now (seeding time), never backdated.
 */
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
process.env.APP_MODE = 'demo';

const URI = process.env.SHOWCASE_URI || 'mongodb://127.0.0.1:27017/awaaz_dastak_showcase';
const DB_NAME = URI.split('/').pop().split('?')[0];
if (!/_showcase$/.test(DB_NAME)) {
  console.error(`Refusing to seed "${DB_NAME}": the database name must end in _showcase.`);
  process.exit(1);
}

// Deterministic pseudo-random numbers so every run builds the same showcase.
let state = 20261025;
const rand = () => ((state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const DAY = 86400000;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const CATEGORY_BUREAU = {
  'Fee Dispute': 'PGRC', 'Faculty Shortage': 'AB', Infrastructure: 'APB', 'Admission Irregularity': 'RB', 'Affiliation Issue': 'APB',
  'Placement Fraud': 'SEB', 'Hostel Complaint': 'PGRC', 'Exam Irregularity': 'AB', 'Safety Concern': 'RB', Ragging: 'PGRC',
};
const BUREAU_NAME = { PGRC: 'Public Grievance Redressal Cell', RB: 'Regulation Bureau', AB: 'Academic Bureau', APB: 'Approval Process Bureau', SEB: 'Skill Education Bureau', TL: 'Training and Learning' };
const FULL = (code) => BUREAU_NAME[code] || code;
const OFFICER_OF = { PGRC: 'pgrc_officer1', RB: 'rb_officer1', AB: 'ab_officer1', APB: 'apb_officer1', SEB: 'seb_officer1', TL: 'tl_officer1' };

const ISSUES = {
  Overcharging: ['charged a development fee above the approved fee structure', 'collected an additional tuition instalment not in the prospectus'],
  'Refund Denial': ['has not refunded the caution deposit after course withdrawal', 'refused the fee refund after seat cancellation within the allowed window'],
  'Hidden Fees': ['added an unannounced laboratory maintenance charge', 'demanded a compulsory transport fee for hostel residents'],
  'Unfilled Positions': ['has run the third-year electives without a regular faculty member this semester', 'left two sanctioned professor posts vacant for over a year'],
  'Unqualified Faculty': ['assigned a guest lecturer without the required qualification to core subjects', 'uses teaching assistants for theory classes'],
  'Absent Faculty': ['scheduled classes where the assigned teacher repeatedly did not attend', 'cancels practical sessions because the instructor is unavailable'],
  'Lab Equipment': ['has non-working equipment in the electronics lab for months', 'shares one working computer between six students in the programming lab'],
  'Building Safety': ['has cracked staircase walls in the academic block', 'keeps the second exit of the auditorium locked during events'],
  Library: ['does not provide the prescribed textbooks in the library', 'closes the library before the published hours'],
  Sanitation: ['has no working washrooms on the third floor', 'does not clean the drinking water tanks'],
  'Seat Allocation': ['changed seat allocation after counselling without notice', 'did not follow the published merit list for branch change'],
  'Document Fraud': ['asked students to sign blank attendance declarations', 'issued a bonafide certificate with wrong course dates'],
  'Counselling Process': ['did not display the vacancy list during spot counselling', 'conducted counselling without the published schedule'],
  'Unapproved Course': ['admitted students to a course that does not appear in the approval list', 'advertised an evening programme without approval'],
  'Fake Affiliation': ['claims affiliation with a university that does not list it', 'shows an affiliation letter that the university has not issued'],
  'Expired Approval': ['continued admissions after the approval period ended', 'runs a diploma course whose approval has lapsed'],
  'False Statistics': ['publishes placement figures that include internships as jobs', 'lists recruiters on the website who never visited'],
  'Fake Offer Letters': ['handed out offer letters from a company that denies hiring', 'issued offer letters without salary or joining date'],
  'Forced Placement Fee': ['makes a placement training fee compulsory for final-year students', 'withholds results until a placement fee is paid'],
  Safety: ['has no warden at night in the girls hostel', 'has broken locks on hostel room doors'],
  'Food Quality': ['serves stale food in the hostel mess repeatedly', 'has no food safety inspection record for the mess'],
  Maintenance: ['has water leakage in hostel rooms during rain', 'has not repaired hostel fans and lights for weeks'],
  Overcrowding: ['puts five students in rooms meant for two', 'converted the hostel common room into a dormitory'],
  'Paper Leak': ['had an internal exam paper shared before the exam', 'reused the previous year question paper without change'],
  'Evaluation Error': ['did not return answer scripts for review after a marks dispute', 'shows internal marks that do not match the submitted assessments'],
  Impersonation: ['allowed a proxy candidate in the practical exam', 'did not verify identity cards in the exam hall'],
  'Fire Safety': ['has expired fire extinguishers in the hostel', 'has no fire drill or alarm in the main block'],
  'Women Safety': ['has no internal complaints committee notice displayed', 'has unlit pathways between the hostel and library'],
  Harassment: ['did not act on a reported harassment complaint', 'has no functioning grievance cell for harassment'],
  'Structural Hazard': ['has a damaged boundary wall near the playground', 'has loose ceiling plaster in classrooms'],
};
const SKIP = ['Ragging'];

async function run() {
  const { syntheticInstitutions, syntheticStudents, SYNTHETIC_DATASET_VERSION } = await import('../server/src/modules/registry/syntheticDataset.js');
  if (process.argv.includes('--preview')) {
    const catalogue = syntheticInstitutions(600);
    console.log(JSON.stringify({ database: DB_NAME, writes: false, institutions: catalogue.length, activeIcids: catalogue.filter(i => i.icid).length,
      unavailableIcids: catalogue.filter(i => !i.icid).length, regions: [...new Set(catalogue.map(i => i.region))], generatedCases: 600, deliberateOverlapPairs: 3,
      syntheticStudents: syntheticStudents(1500, catalogue).length, datasetVersion: SYNTHETIC_DATASET_VERSION,
      appealsThroughProof: 15, revealRequests: 10, coordinationInstitutions: 8, completedDayFingerprints: 30,
      pidExample: catalogue[0].pid, uniqueNames: new Set(catalogue.map(row => row.name)).size,
      additionalFixtures: 'Existing S3 and Guided Walkthrough fixtures are seeded separately; final totals are reported after seeding.' }, null, 2));
    return;
  }
  const mongoose = (await import('mongoose')).default;
  process.env.MONGODB_URI = URI;
  const { connectDB, disconnectDB } = await import('../server/src/config/db.js');
  await connectDB(URI);
  if (!/_showcase$/.test(mongoose.connection.name) || mongoose.connection.name !== DB_NAME) throw new Error('SHOWCASE_DATABASE_REQUIRED');
  console.log(`Dropping and rebuilding ${DB_NAME} ...`);
  await mongoose.connection.db.dropDatabase();

  await (await import('../server/src/modules/auth/seed.js')).seedDemoAccounts();
  await (await import('../server/src/modules/identity/seed.js')).seedIdentityReporters();
  await (await import('../server/src/modules/institutions/seed.js')).seedInstitutionsAndRegions();
  await (await import('../server/src/modules/rulebook/seed.js')).seedRuleBook();
  await (await import('../server/src/modules/bureaus/seed.js')).seedBureaus();
  await (await import('../server/src/modules/sync/seed.js')).seedS3Fixtures();
  await (await import('../server/src/modules/authority/seed.js')).seedS5();
  const { approveShowcaseRules, seedOperationalEvidence } = await import('../server/src/modules/globaljury/seed.js');
  await approveShowcaseRules();
  const { showcaseNarrative } = await import('../server/src/modules/globaljury/narratives.js');

  const Institution = (await import('../server/src/modules/institutions/Institution.js')).default;
  const InstitutionIdentifier = (await import('../server/src/modules/institutions/InstitutionIdentifier.js')).default;
  const User = (await import('../server/src/modules/auth/User.js')).default;
  const { getReporterId, isVerified } = await import('../server/src/modules/identity/index.js');
  const { recordAudit } = await import('../server/src/modules/audit/audit.js');
  const { listInstitutions } = await import('../server/src/modules/registry/RegistrySimulator.js');
  const { DEMO_CATEGORIES } = await import('../server/src/modules/intake/config.js');
  const db = mongoose.connection.db;

  // More registered institutions, each with an active ICID mapping where the registry has one.
  const showcaseInstitutions = syntheticInstitutions(600);
  for (const s of showcaseInstitutions) {
    if (!(await Institution.exists({ pid: s.pid }))) {
      await Institution.create({ pid: s.pid, name: s.name, state: s.state, region: s.region, type: s.type, approvalStatus: s.approvalStatus, icid: s.icid || null,
        city: s.city, district: s.district, aliases: s.aliases, campuses: s.campuses, programmes: s.programmes,
        coordinates: s.coordinates, datasetName: s.datasetName, datasetVersion: s.datasetVersion,
        registrySnapshot: s, lastRegistryFetch: new Date(), synthetic: true });
    }
    await db.collection('syntheticstudents').insertMany(syntheticStudents(1500, showcaseInstitutions).map(student => ({
      ...student, createdAt: new Date(), updatedAt: new Date(),
    })));
    if (s.icid && !(await InstitutionIdentifier.exists({ icid: s.icid }))) {
      await InstitutionIdentifier.create({ icid: s.icid, pid: s.pid, source: 'seed_registry', verifiedAt: new Date(), status: 'active', synthetic: true });
    }
  }
  const institutions = await Institution.find({}).lean();
  const icidByPid = new Map((await InstitutionIdentifier.find({ status: 'active' }).lean()).map((i) => [i.pid, i.icid]));
  // Point the original S3 fixture cases at a registered institution so SYNC and Institution 360 load for them.
  const fixturePid = institutions.find((i) => i.region === 'Northern')?.pid || institutions[0].pid;
  const fixtureInst = institutions.find((i) => i.pid === fixturePid);
  await db.collection('cases').updateMany({ institutionPid: '1-1000000001' }, { $set: { institutionPid: fixturePid, institutionIcid: icidByPid.get(fixturePid) || null,
    pidSnapshot: { pid: fixturePid, name: fixtureInst.name, region: fixtureInst.region, state: fixtureInst.state } } });
  await db.collection('coordinations').updateMany({ institutionPid: '1-1000000001' }, { $set: { institutionPid: fixturePid } });

  const users = new Map((await User.find({}).lean()).map((u) => [u.username, u]));
  const reporters = [];
  for (const name of ['student1', 'faculty1', 'trust_student_verified', 'trust_faculty_verified']) {
    const id = users.get(name) && (await getReporterId(users.get(name)._id));
    if (id && await isVerified(users.get(name)._id)) reporters.push({ name, id });
  }
  console.log(`Reporter accounts with cases: ${reporters.map((r) => r.name).join(', ') || 'none'}`);
  if (reporters.length < 2) throw new Error('VERIFIED_REPORTERS_REQUIRED');
  const { getActiveRule } = await import('../server/src/modules/rulebook/index.js');
  const { addBusinessDays } = await import('../server/src/modules/trace/businessDays.js');
  const { determineInitialPriority } = await import('../server/src/modules/priority/priorityService.js');
  const ackRule = await getActiveRule('TRANSFER');
  const ackWindow = ackRule?.body?.ackWindowBusinessDays;
  if (!Number.isInteger(ackWindow) || ackWindow < 1) throw new Error('POLICY_NOT_CONFIGURED: TRANSFER');

  const categories = DEMO_CATEGORIES.categories.filter((c) => !SKIP.includes(c.name));
  const now = Date.now();
  const cases = [], decisions = [], transfers = [], closures = [];
  const N = 597; // Plus the three deliberately repeated matters below: 600 generated cases.
  const used = new Set();
  for (let n = 0; n < N; n++) {
    // Each matter is reported once per institution, except the deliberate overlaps added below.
    let inst, cat, sub, issue;
    for (let tries = 0; tries < 40; tries++) {
      inst = institutions[n % institutions.length]; cat = pick(categories); sub = pick(cat.subCategories);
      issue = pick(ISSUES[sub] || ['did not respond to the grievance submitted to the institution']);
      if (!used.has(`${inst.pid}|${sub}`)) break;
    }
    used.add(`${inst.pid}|${sub}`);
    const bureau = CATEGORY_BUREAU[cat.name] || 'PGRC';
    // Recent months carry more cases.
    const ageDays = Math.floor(Math.pow(rand(), 1.6) * 175) + 1;
    const createdAt = new Date(now - ageDays * DAY - Math.floor(rand() * DAY));
    const roll = rand();
    let status = roll < 0.07 ? 'Registered' : roll < 0.52 ? 'Under Process' : roll < 0.62 ? 'Resolution Proposed' : 'Closed';
    if (status === 'Closed' && ageDays < 12) status = 'Under Process';
    const channelRoll = rand();
    const channel = channelRoll < 0.68 ? 'web' : channelRoll < 0.86 ? 'email' : 'import';
    const masterCaseId = `NX-2026-${String(1001 + n).padStart(6, '0')}`;
    const _id = new mongoose.Types.ObjectId();
    const icid = icidByPid.get(inst.pid) || null;
    const reporter = reporters[n % reporters.length].id;
    const narrative = showcaseNarrative({ index: n, category: cat.name, subCategory: sub, issue, month: createdAt.toLocaleString('en-IN', { month: 'long', year: 'numeric' }) });
    const externalRefs = channel === 'import' ? [{ sourceSystem: 'CPGRAMS_SIMULATOR', sourceCaseRef: `CPG-SIM-${100000 + n}` }]
      : channel === 'email' ? [{ sourceSystem: 'EMAIL_SIMULATOR', sourceCaseRef: `MAIL-SIM-${5000 + n}` }] : [];
    let owner = bureau;
    let transferStatus = 'NONE';
    const routedAt = new Date(createdAt.getTime() + (2 + rand() * 20) * 3600000);
    if (status !== 'Registered') {
      decisions.push({ _id: new mongoose.Types.ObjectId(), caseId: _id, masterCaseId, primary: FULL(bureau), secondary: rand() < 0.15 ? 'RO' : null, confidence: Math.round((0.72 + rand() * 0.26) * 100) / 100,
        reasons: [`Category "${cat.name}" maps to ${BUREAU_NAME[bureau]} under DEMO-ROUTE-v1`, `Institution region ${inst.region} recorded from the PID registry`],
        ruleVersion: 'DEMO-ROUTE-v1', isManualReview: false, overriddenBy: null, reason: null, synthetic: true, createdAt: routedAt, updatedAt: routedAt });
      // About one case in six is transferred once; most transfers are accepted.
      if (rand() < 0.17 && ageDays > 3) {
        const to = pick(Object.keys(BUREAU_NAME).filter((b) => b !== bureau));
        const requestedAt = new Date(routedAt.getTime() + (1 + rand() * 5) * DAY);
        const dueAt = addBusinessDays(requestedAt, ackWindow);
        const t = rand();
        const tStatus = t < 0.72 || status === 'Closed' ? 'ACCEPTED' : t < 0.86 ? 'REQUESTED' : 'REJECTED';
        const acknowledgedAt = tStatus === 'REQUESTED' ? null : new Date(requestedAt.getTime() + (0.2 + rand() * (rand() < 0.2 ? 4 : 1.6)) * DAY);
        transfers.push({ caseId: _id, masterCaseId, fromBureau: FULL(bureau), toBureau: FULL(to), reason: `Matter falls under the ${BUREAU_NAME[to]} mandate`,
          senderOfficerId: users.get(OFFICER_OF[bureau])?._id || null, receiverOfficerId: acknowledgedAt ? users.get(OFFICER_OF[to])?._id || null : null,
          status: tStatus, requestedAt, acknowledgedAt, dueAt, isEscalated: tStatus === 'REQUESTED' && now > dueAt.getTime(),
          rejectionReason: tStatus === 'REJECTED' ? 'Sender bureau retains the matter; no mandate overlap' : undefined, createdAt: requestedAt, updatedAt: acknowledgedAt || requestedAt });
        transferStatus = tStatus;
        if (tStatus === 'ACCEPTED') owner = to;
      }
    }
    const ownerUser = users.get(OFFICER_OF[owner]);
    const priorityInfo = await determineInitialPriority({ category: cat.name, isSuggestedSensitive: false });
    const updatedAt = new Date(Math.min(now, createdAt.getTime() + (1 + rand() * 30) * DAY));
    cases.push({
      _id, masterCaseId, reporterId: reporter, institutionPid: inst.pid,
      pidSnapshot: { pid: inst.pid, name: inst.name, region: inst.region, state: inst.state, type: inst.type || null },
      institutionIcid: icid, icidSnapshot: icid ? { icid, pid: inst.pid, capturedAt: createdAt } : null,
      category: cat.name, subCategory: sub, narrative, narrativeHash: sha(narrative), languageTag: n % 10 === 0 ? 'hi' : 'en', priority: priorityInfo.priority,
      channel, status, analyticStatus: status === 'Closed' ? 'DISPOSED' : status === 'Registered' ? 'PENDING' : 'IN_PROCESS',
      owningBureau: status === 'Registered' ? null : FULL(owner), routingDecisionId: status === 'Registered' ? null : decisions[decisions.length - 1]._id,
      currentOwner: status === 'Registered' ? null : { office: FULL(owner), role: 'bureau_officer', officerId: ownerUser?._id || null, officerName: ownerUser?.displayName || null, assignedAt: routedAt },
      transferStatus, externalRefs, documentIds: [], synthetic: true, createdAt, updatedAt,
    });
    if (status === 'Closed' || status === 'Resolution Proposed') {
      const span = now - createdAt.getTime();
      const proposedAt = new Date(createdAt.getTime() + span * (0.45 + rand() * 0.35));
      const closedAt = status === 'Closed' ? new Date(proposedAt.getTime() + (now - proposedAt.getTime()) * (0.3 + rand() * 0.6)) : null;
      const proposer = users.get(OFFICER_OF[owner]);
      closures.push({ caseId: _id, masterCaseId, state: closedAt ? 'CLOSED' : 'PROPOSED', closureReason: `Historical closure record for ${sub.toLowerCase()}; no evidence packet imported`,
        actionRecordIds: [], evidenceRefs: [], proposedBy: String(proposer?._id || 'officer'), proposedByRole: 'bureau_officer', proposedAt,
        approvedBy: closedAt ? String(users.get('supervisor1')?._id) : null, approvedByRole: closedAt ? 'supervisor' : null, approvedAt: closedAt,
        closedBy: closedAt ? String(users.get('supervisor1')?._id) : null, closedAt, gateResults: [], packetHash: sha(`${masterCaseId}|${closedAt || proposedAt}`), synthetic: true,
        createdAt: proposedAt, updatedAt: closedAt || proposedAt });
    }
  }

  // Three deliberate potential overlaps, retained as advisory examples for human review.
  const overlapBases = cases.filter(c => c.status === 'Under Process' && c.transferStatus === 'NONE').slice(0, 3);
  if (overlapBases.length !== 3) throw new Error('THREE_OVERLAP_BASES_REQUIRED');
  for (let k = 0; k < 3; k++) {
    const base = overlapBases[k];
    const other = Object.keys(BUREAU_NAME).find((b) => FULL(b) !== base.owningBureau && b !== 'TL') || 'RB';
    const createdAt = new Date(base.createdAt.getTime() + (2 + k) * DAY);
    const narrative = base.narrative;
    const _id = new mongoose.Types.ObjectId();
    const masterCaseId = `NX-2026-${String(1001 + N + k).padStart(6, '0')}`;
    // Historical cross-bureau assignment is fixture data, not a routing-engine
    // decision. Its routing explanation correctly remains UNKNOWN.
    cases.push({ ...base, _id, masterCaseId, reporterId: reporters.find(r => r.id !== base.reporterId).id, narrative, narrativeHash: sha(narrative), owningBureau: FULL(other), routingDecisionId: null,
      currentOwner: { office: FULL(other), role: 'bureau_officer', officerId: users.get(OFFICER_OF[other])?._id || null, officerName: users.get(OFFICER_OF[other])?.displayName || null, assignedAt: createdAt },
      channel: 'email', externalRefs: [{ sourceSystem: 'EMAIL_SIMULATOR', sourceCaseRef: `MAIL-SIM-OVL-${k}` }], status: 'Under Process', analyticStatus: 'IN_PROCESS', transferStatus: 'NONE', createdAt, updatedAt: createdAt });
  }

  // Two open handovers waiting in the Regulation Bureau inbox, one past its acknowledgement date.
  const waiting = cases.filter((c) => c.owningBureau === FULL('PGRC') && c.status === 'Under Process' && c.transferStatus === 'NONE').slice(0, 2);
  waiting.forEach((c, i) => {
    const requestedAt = new Date(now - (i ? 4 : 0.5) * DAY);
    transfers.push({ caseId: c._id, masterCaseId: c.masterCaseId, fromBureau: FULL('PGRC'), toBureau: FULL('RB'), reason: 'Regulatory compliance question falls under the Regulation Bureau mandate',
      senderOfficerId: users.get('pgrc_officer1')?._id || null, receiverOfficerId: null, status: 'REQUESTED', requestedAt, acknowledgedAt: null, dueAt: addBusinessDays(requestedAt, ackWindow),
      isEscalated: i === 1, createdAt: requestedAt, updatedAt: requestedAt });
    c.transferStatus = 'REQUESTED';
  });

  await db.collection('cases').insertMany(cases);
  // Recompute routing and priority through the real local engines. Random fixture
  // confidence or an invented reason must never become an explanation in the UI.
  const { evaluateRouting } = await import('../server/src/modules/routing/routingEngine.js');
  for (const decision of decisions) {
    const c = cases.find(row => String(row._id) === String(decision.caseId));
    const institution = institutions.find(row => row.pid === c.institutionPid);
    const evaluated = await evaluateRouting(c, { institutionType: institution.type, region: institution.region, approvalStatus: institution.approvalStatus, status: 'AVAILABLE' });
    const priority = await determineInitialPriority({ category: c.category, isSuggestedSensitive: false });
    Object.assign(decision, evaluated, { factors: { ...evaluated.factors, priority: { value: priority.priority, reason: priority.reason }, evaluatedAtSeed: true }, createdAt: new Date(), updatedAt: new Date() });
    const assigned = evaluated.isManualReview ? null : (c.transferStatus === 'ACCEPTED' ? c.owningBureau : FULL(evaluated.primary));
    const owner = assigned && [...users.values()].find(user => user.bureau === assigned);
    await db.collection('cases').updateOne({ _id: c._id }, { $set: { priority: priority.priority,
      owningBureau: assigned, currentOwner: assigned ? { office: assigned, role: 'bureau_officer', officerId: owner?._id || null, officerName: owner?.displayName || null, assignedAt: new Date() } : null } });
  }
  await db.collection('routing_decisions').insertMany(decisions);
  if (transfers.length) await db.collection('transfers').insertMany(transfers);
  // Historical Closed states have no imported evidence packet. Do not manufacture
  // a passed PROOF gate or include them in measured PROOF resolution time.
  const proposed = closures.filter(record => record.state === 'PROPOSED');
  if (proposed.length) await db.collection('closure_records').insertMany(proposed);

  // Audit: one attributed event per seeded case, recorded now (never backdated).
  for (const c of cases) {
    await recordAudit({ actorId: 'showcase-seed', actorRole: 'system', action: 'case.showcase_seeded', targetType: 'Case', targetId: c.masterCaseId, meta: { synthetic: true, channel: c.channel } });
  }
  await recordAudit({ actorId: 'showcase-seed', actorRole: 'system', action: 'showcase.related_records.seeded', targetType: 'Showcase', targetId: DB_NAME,
    meta: { routingDecisions: decisions.length, transfers: transfers.length, historicalClosures: closures.length, deliberateOverlapPairs: 3 } });

  // The Judge Mode two-bureau scenario, created through the real services (PREVENT checks included).
  try {
    const scenario = await (await import('../server/src/modules/additions/n46-judge-mode/service.js')).seedOverlapScenario();
    // Give the scenario institution a synthetic IIC ID so the tour shows an ICID check on its cases.
    const spid = scenario.institutionPid;
    const sinst = await Institution.findOne({ pid: spid }).lean();
    let sicid = icidByPid.get(spid);
    if (!sicid) {
      sicid = 'IIC-SHOWC001';
      await InstitutionIdentifier.create({ icid: sicid, pid: spid, source: 'showcase_seed', verifiedAt: new Date(), status: 'active', synthetic: true });
    }
    await db.collection('cases').updateMany({ masterCaseId: { $in: scenario.cases.map((c) => c.masterCaseId) } },
      { $set: { institutionIcid: sicid, pidSnapshot: { pid: spid, name: sinst?.name || null, region: sinst?.region || null, state: sinst?.state || null } } });
    console.log('Judge Mode overlap scenario seeded.');
  } catch (err) {
    console.log(`Judge Mode scenario not seeded: ${err.code || err.message}`);
  }

  const operations = await seedOperationalEvidence();
  console.log('Operational evidence:', JSON.stringify(operations));
  const psStory = await (await import('../server/src/modules/additions/n82-combined-request/showcase.js')).seedProblemStatement();
  console.log('Problem-statement story:', JSON.stringify(psStory));
  const closed = closures.filter((c) => c.state === 'CLOSED').length;
  console.log(`Seeded ${cases.length} cases at ${new Set(cases.map((c) => c.institutionPid)).size} institutions, ${decisions.length} evaluated routing decisions, ${transfers.length} transfers, ${closed} historical Closed states without imported PROOF evidence.`);
  await disconnectDB();
  console.log(`Done. Start the app on it with:  npm run dev:showcase`);
}

run().catch((err) => {
  console.error('Showcase seed error:', err);
  process.exit(1);
});
