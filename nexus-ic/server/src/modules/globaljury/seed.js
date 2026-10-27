import mongoose from 'mongoose';
import User from '../auth/User.js';
import Case from '../cases/Case.js';
import Rule from '../rulebook/models.js';
import { createDraftVersion, runDryRun, approveVersion, getActiveRule } from '../rulebook/rulebookService.js';
import { createClockSegment } from '../priority/priorityService.js';
import { recordAudit } from '../audit/audit.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';
import { requestReveal, approveReveal } from '../vault/service.js';
import { caseJourney } from '../casejourney/journeyService.js';
import { checkInsiderActivity } from '../insider/insiderService.js';
import { createCoordination, createCoordinationTask } from '../sync/syncService.js';
import { capture } from '../additions/n57-integrity/service.js';
import { scanSla } from '../sla/service.js';
import { runRescueScan } from '../rescue/rescueService.js';
import { runBenchmark } from '../benchmark/service.js';
import { getReporterId } from '../identity/index.js';
import { processUpload } from '../documents/documentService.js';
import { checkAction, proceedAction } from '../prevent/stage2.js';
import { proposeClosure, approveClosure, closeCase } from '../closure/closureService.js';
import { fileAppeal, startReview } from '../appeals/appealService.js';
import { generateMasterCaseId } from '../cases/caseService.js';

const actor = user => ({ ...user.toObject(), id: String(user._id) });
async function approve(family, version, body, admin, supervisor, description) {
  if (await Rule.exists({ family, version })) return;
  const draft = await createDraftVersion({ family, version, body, description, effectiveFrom: '2026-01-01T00:00:00Z', user: admin });
  await runDryRun(draft._id, admin); await approveVersion(draft._id, supervisor);
}
export async function approveShowcaseRules() {
  if (!mongoose.connection.name.endsWith('_showcase')) throw new Error('SHOWCASE_DATABASE_REQUIRED');
  const admin = await User.findOne({ username: 'sysadmin1' }), supervisor = await User.findOne({ username: 'supervisor1' });
  const officeNames = { AB: 'Academic Bureau', APB: 'Approval Process Bureau', SEB: 'Skill Education Bureau', TL: 'Training and Learning' };
  for (const officer of await User.find({ role: 'bureau_officer', bureau: { $in: Object.keys(officeNames) } })) {
    const from = officer.bureau; officer.bureau = officeNames[from]; await officer.save();
    await recordAudit({ actorId: String(admin._id), actorRole: admin.role, action: 'showcase.officer_bureau.aligned', targetType: 'User', targetId: String(officer._id), meta: { from, to: officer.bureau } });
  }
  const base = await getActiveRule('JURISDICTION');
  const aliases = { Infrastructure: 'Land & Infrastructure', 'Admission Irregularity': 'Regulatory Compliance',
    'Affiliation Issue': 'Affiliation', 'Placement Fraud': 'Vocational Training', 'Hostel Complaint': 'Student Discipline',
    'Exam Irregularity': 'Academic Misconduct', 'Safety Concern': 'Student Discipline' };
  const bureauMapping = { ...base.body.bureauMapping };
  for (const [category, reference] of Object.entries(aliases)) bureauMapping[category] = { ...bureauMapping[reference] };
  await approve('JURISDICTION', 'DEMO-ROUTE-v2', { ...base.body, bureauMapping, categoryAliases: aliases, requireCurrentApprovalForAutoRouting: true }, admin, supervisor,
    'Intake category names aligned with the existing workload routing groups; pending or revoked institution approval requires human review.');
  // Manish delegated the local showcase choice on 26 Oct. These are explicitly
  // demonstration settings, not an official appeal window or legal entitlement.
  await approve('APPEAL', 'DEMO-GLOBAL-APPEAL-v1', { approvedFor: 'SYNTHETIC_DEMO', windowDays: 30, levels: 2, approverDiffers: true }, admin, supervisor,
    'Local showcase appeal settings: 30 calendar days and two review levels; no official policy claim.');
}

export async function seedOperationalEvidence() {
  if (!mongoose.connection.name.endsWith('_showcase')) throw new Error('SHOWCASE_DATABASE_REQUIRED');
  const users = new Map((await User.find()).map(user => [user.username, actor(user)]));
  const supervisor = users.get('supervisor1'), rb = users.get('rb_officer1'), authority = users.get('authority1');
  const now = new Date();
  let clocks = 0;
  for (const row of await Case.find({ status: { $nin: CLOSED_STATUSES } })) {
    if (row.slaClock?.length) continue;
    const clock = await createClockSegment(row.priority || 'normal', row.category, row.createdAt);
    if (!clock) throw new Error(`SOURCE_SLA_REQUIRED:${row.masterCaseId}`);
    row.slaClock = [clock]; await row.save(); clocks++;
    await recordAudit({ actorId: 'showcase-seed', actorRole: 'system', action: 'sla.clock.started', targetType: 'Case', targetId: row.masterCaseId,
      meta: { ruleVersion: clock.ruleVersion, receivedAt: row.createdAt.toISOString(), dueAt: clock.targetResolutionDate.toISOString() } });
  }
  const verified = ['trust_student_verified', 'trust_faculty_verified'].map(name => users.get(name));
  // Purpose strings remain encrypted in the vault. Never retrieve revealed identity.
  for (let index = 0; index < 10; index++) {
    const reporterId = await getReporterId(verified[index % 2].id);
    const request = await requestReveal(supervisor, reporterId, `Verify the supporting record for a scoped grievance review, reference ${index + 1}.`);
    if (index < 4) await approveReveal(authority, request.id);
  }
  const grouped = new Map();
  for (const row of await Case.find({ status: { $nin: CLOSED_STATUSES }, owningBureau: { $ne: null } }).lean()) {
    if (!grouped.has(row.institutionPid)) grouped.set(row.institutionPid, []);
    grouped.get(row.institutionPid).push(row);
  }
  for (const [pid, rows] of [...grouped].slice(0, 8)) {
    const selected = rows.slice(0, 2);
    const coordination = await createCoordination(supervisor, { institutionPid: pid, caseIds: selected.map(row => row._id),
      participatingBureaus: [...new Set(selected.map(row => row.owningBureau))], leadBureau: selected[0].owningBureau });
    for (const row of selected) await createCoordinationTask(supervisor, { coordinationId: coordination._id, caseId: row._id,
      assignedBureau: row.owningBureau, title: 'Confirm the next recorded action', description: 'Review the case record and agree the responsible office before sending an instruction.' });
  }
  // Actual authorized page reads produce audit events; the real detector decides.
  let insiderAlerts = 0;
  const insiderRule = await getActiveRule('INSIDER');
  for (const name of ['rb_officer1', 'pgrc_officer1', 'ab_officer1', 'apb_officer1', 'seb_officer1']) {
    const officer = users.get(name);
    if (!officer) throw new Error(`OFFICER_REQUIRED:${name}`);
    const rows = await Case.find({ owningBureau: officer.bureau }).limit(insiderRule.body.bulkCaseOpeningThreshold).lean();
    if (!rows.length) throw new Error(`SCOPED_CASE_REQUIRED:${name}`);
    for (let i = 0; i < insiderRule.body.bulkCaseOpeningThreshold; i++) await caseJourney(officer, rows[i % rows.length].masterCaseId);
    insiderAlerts += (await checkInsiderActivity(officer.id)).length;
  }
  insiderAlerts += (await checkInsiderActivity(supervisor.id)).length;
  // Fifteen explicit scripted human flows, never fabricated closure/appeal rows.
  for (let index = 0; index < 15; index++) {
    const reporter = verified[index % 2], reporterId = await getReporterId(reporter.id);
    const base = [...grouped.values()][index % grouped.size][0];
    const row = await Case.create({ masterCaseId: await generateMasterCaseId(), reporterId, institutionPid: base.institutionPid,
      pidSnapshot: base.pidSnapshot, institutionIcid: base.institutionIcid, icidSnapshot: base.icidSnapshot,
      category: 'Fee Dispute', subCategory: 'Refund Denial', narrative: `The refundable deposit remains unpaid after the institution acknowledged the request, record ${index + 1}.`,
      narrativeHash: `jury-appeal-${index}`, status: 'Under Process', analyticStatus: 'IN_PROCESS', priority: 'normal',
      owningBureau: rb.bureau, currentOwner: { office: rb.bureau, role: rb.role, officerId: rb.id, assignedAt: now }, synthetic: true });
    await recordAudit({ actorId: reporter.id, actorRole: reporter.role, action: 'case.showcase_seeded', targetType: 'Case', targetId: row.masterCaseId, meta: { purpose: 'appeal_walkthrough' } });
    const check = await checkAction(rb, { caseId: row.masterCaseId, actionType: 'DOCUMENT_REQUEST', details: { subject: `Deposit receipt ${index + 1}` } });
    await proceedAction(rb, check.checkId);
    const document = await processUpload({ buffer: Buffer.from('%PDF-1.4\nFictional deposit resolution receipt\n%%EOF'), originalName: 'resolution-receipt.pdf', mimeType: 'application/pdf', user: rb, caseId: row._id });
    await proposeClosure(rb, row.masterCaseId, { closureReason: 'Institution supplied a resolution receipt; the reporter may seek review.', evidenceDocumentIds: [String(document._id)] });
    await approveClosure(supervisor, row.masterCaseId); await closeCase(supervisor, row.masterCaseId);
    const appeal = await fileAppeal(reporter, row.masterCaseId, { grounds: 'The supplied receipt does not resolve the amount outstanding. Please review the supporting record.' });
    if (index < 7) await startReview(authority, appeal._id);
  }
  const sla = await scanSla({ now }), rescue = await runRescueScan({ now, user: supervisor });
  // Real capture service reconstructs completed days from recorded audit events.
  // Empty days remain eventCount=0/rootHash=null, never forged historical roots.
  for (let age = 30; age >= 1; age--) await capture(supervisor, { day: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - age * 86400000).toISOString().slice(0, 10), now });
  const benchmark = await runBenchmark(supervisor);
  return { clocks, revealRequests: 10, coordinationInstitutions: 8, appeals: 15, insiderAlerts, fingerprints: 30,
    fingerprintScope: 'Recomputed completed UTC days; empty days have no root, not historical job executions', sla, rescueRaised: rescue.raised.length,
    benchmark: { id: benchmark.id, numerator: benchmark.numerator, denominator: benchmark.denominator } };
}
