import RuleBookVersion from './models.js';
import User from '../auth/User.js';
import { createDraftVersion, runDryRun, approveVersion } from './rulebookService.js';

let overlapDefaults = {
  version: 'DEMO-OVERLAP-v1',
  overlapThreshold: 55,
  minIssueSimilarity: 0.30,
  gramSize: 3,
  freshnessMs: 24 * 60 * 60 * 1000,
};

try {
  const preventDefaults = await import('../prevent/defaults.js');
  if (preventDefaults.overlapDefaults) {
    overlapDefaults = { ...overlapDefaults, ...preventDefaults.overlapDefaults };
    if (!overlapDefaults.freshnessMs) overlapDefaults.freshnessMs = 24 * 60 * 60 * 1000;
  }
} catch {
  // Use fallback if prevent module is absent
}

/**
 * Seed DEMO RuleBook versions (SPEC 11, N27, N78)
 *
 * All versions are explicitly labelled synthetic: true with
 * "not from source; replace with AICTE policy".
 */
export async function seedRuleBook() {
  const admin = await User.findOne({ username: { $in: ['sysadmin', 'sysadmin1'] } });
  const supervisor = await User.findOne({ username: { $in: ['supervisor', 'supervisor1'] } });

  const adminId = admin?._id || admin?.id;
  const supervisorId = supervisor?._id || supervisor?.id;

  if (!adminId || !supervisorId) {
    return;
  }

  const demoRules = [
    {
      family: 'JURISDICTION',
      version: 'DEMO-ROUTE-v1',
      description: 'Synthetic jurisdiction mapping by category, region, and institution type',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        confidenceThreshold: 0.70,
        defaultPrimary: 'PGRC',
        bureauMapping: {
          'Ragging': { primary: 'PGRC', secondary: 'Regional Office', confidence: 0.95 },
          'Student Discipline': { primary: 'PGRC', secondary: 'RO', confidence: 0.90 },
          'Regulatory Compliance': { primary: 'RB', secondary: 'APB', confidence: 0.85 },
          'Land & Infrastructure': { primary: 'RB', secondary: 'APB', confidence: 0.85 },
          'Technical Norms': { primary: 'RB', secondary: 'APB', confidence: 0.85 },
          'Faculty Shortage': { primary: 'PGRC', secondary: 'RB', confidence: 0.80 },
          'Faculty Issues': { primary: 'PGRC', secondary: 'RB', confidence: 0.80 },
          'Fee Dispute': { primary: 'PGRC', secondary: null, confidence: 0.85 },
          'Curriculum': { primary: 'AB', secondary: 'PGRC', confidence: 0.90 },
          'Academic Misconduct': { primary: 'AB', secondary: 'PGRC', confidence: 0.90 },
          'Approval Process': { primary: 'APB', secondary: 'RO', confidence: 0.88 },
          'Affiliation': { primary: 'APB', secondary: 'RO', confidence: 0.88 },
          'Vocational Training': { primary: 'SEB', secondary: 'TL', confidence: 0.85 },
          'Faculty Development': { primary: 'TL', secondary: 'AB', confidence: 0.85 },
        },
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'ROUTING',
      version: 'DEMO-REGIONAL-ROUTE-v1',
      description: 'ICID-based regional routing to Regional Grievance Cell across all 6 AICTE regions (N92)',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        confidenceThreshold: 0.70,
        enableRegionalRouting: true,
        regions: [
          'Northern',
          'Western',
          'Southern',
          'Central',
          'Eastern',
          'North Eastern',
        ],
        regionalCellFormat: 'Regional Grievance Cell ({region})',
        explainFormat: 'Region {region} from PID {pid} (ICID {icid} MATCH)',
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'ROUTING',
      version: 'DEMO-ROUTE-v1',
      description: 'Routing engine confidence and fallback parameters',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        confidenceThreshold: 0.70,
        triageOnLowConfidence: true,
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'SLA',
      version: 'DEMO-CASE-STANDARD-v1',
      description: 'Standard complaint resolution timelines in calendar days',
      body: {
        approvedFor: 'SYNTHETIC_DEMO', calendarDays: 14, nearDueHours: 72,
        escalationAfterOverdueHours: 24,
        source: 'SOURCE_23OCT_FERTXD.md: Reference demo SLA event logic and section 12',
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'SLA',
      version: 'DEMO-CASE-PRIORITY-v1',
      description: 'Urgent and high priority complaint resolution timelines',
      body: {
        approvedFor: 'SYNTHETIC_DEMO', calendarDays: 3,
        source: 'SOURCE_23OCT_FERTXD.md: section 12, priority case policy',
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'TRANSFER',
      version: 'DEMO-TRANSFER-ACK-v1',
      description: 'Transfer acknowledgement policy (SPEC 9.2: 2 business days)',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        ackWindowBusinessDays: 2,
        autoEscalateOnExpiry: true,
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'ESCALATION',
      version: 'DEMO-ESCALATION-v1',
      description: 'Escalation matrix for overdue cases and unacknowledged transfers',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        notifySupervisorOnNearDue: true,
        notifyCompetentAuthorityOnBreach: true,
        escalateUnacknowledgedTransferAfterDays: 2,
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'COORDINATION',
      version: 'DEMO-SYNC-ACK-v1',
      description: 'Multi-bureau information synchronization deadlines',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        syncAckWindowBusinessDays: 3,
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'COORDINATION',
      version: 'DEMO-TASK-v1',
      description: 'Cross-bureau coordination task completion deadline',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        taskCompletionWindowBusinessDays: 5,
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'RESCUE',
      version: 'DEMO-RESCUE-v1',
      description: 'Synthetic stalled-case recovery triggers (SPEC 10.2)',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        triggers: {
          maxTransfers: 3,
          maxDaysInactivity: 7,
          transferAckOverdue: true,
          taskOverdueTwice: true,
        },
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'OVERLAP_DETECTION',
      version: 'DEMO-OVERLAP-v1',
      description: 'Overlap detection thresholds imported from S4 defaults',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        overlapThreshold: Number(overlapDefaults.overlapThreshold) || 55,
        minIssueSimilarity: Number(overlapDefaults.minIssueSimilarity) || 0.30,
        gramSize: Number(overlapDefaults.gramSize) || 3,
        freshnessMs: Number(overlapDefaults.freshnessMs) || 86400000,
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'CLOSURE_REQUIREMENTS',
      version: 'DEMO-CLOSURE-v1',
      description: 'Mandatory proof and gate rules for case closure (SPEC 10.1)',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        requireEvidence: true,
        requireEvidenceAttached: true,
        approverDiffersFromProposer: true,
        requireAllTasksCompleted: true,
        requireAllTransfersAcknowledged: true,
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'SENSITIVITY',
      version: 'DEMO-SENSITIVITY-v1',
      description: 'Versioned multilingual keyword rules for local sensitivity detection',
      body: {
        _comment: 'not from source; replace with AICTE policy',
        keywords: {
          en: ['ragging', 'sexual harassment', 'harassment', 'suicide', 'self-harm', 'extortion', 'threat', 'caste discrimination'],
          hi: ['रैगिंग', 'यौन उत्पीड़न', 'उत्पीड़न', 'आत्महत्या', 'जबरन वसूली', 'धमकी', 'भेदभाव'],
          ta: ['ஏளனம்', 'துன்புறுத்தல்', 'பாலியல் துன்புறுத்தல்', 'தற்கொலை', 'பறித்தல்', 'மிரட்டல்'],
        },
        action: 'SUGGEST_URGENT_PRIORITY',
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
    {
      family: 'INSIDER',
      version: 'DEMO-INSIDER-v1',
      description: 'Thresholds for detecting anomalous internal officer activity and insider threats (ADDITIONS.md N54)',
      body: {
        _comment: 'Synthetic demonstrator only; not from source; replace with AICTE security policy',
        bulkCaseOpeningThreshold: 10,
        bulkCaseWindowMinutes: 60,
        outOfScopeSearchThreshold: 3,
        outOfScopeSearchWindowMinutes: 60,
        unusualExportThreshold: 3,
        unusualExportWindowHours: 24,
        repeatedRevealThreshold: 3,
        repeatedRevealWindowHours: 24,
        warningOnly: true,
      },
      status: 'approved',
      effectiveFrom: new Date('2026-01-01'),
      requestedBy: adminId,
      approvedBy: supervisorId,
      approvedAt: new Date('2026-01-01'),
      dryRunPassed: true,
      synthetic: true,
    },
  ];

  for (const rule of demoRules) {
    delete rule.body._comment;
    if (await RuleBookVersion.exists({ family: rule.family, version: rule.version })) continue;
    if (rule.family === 'SLA') {
      // Existing approved versions are never rewritten. A fresh showcase uses
      // the same draft, dry-run and distinct-approver flow as the application.
      const draft = await createDraftVersion({ ...rule, user: admin });
      await runDryRun(draft._id, admin);
      await approveVersion(draft._id, supervisor);
      continue;
    }
    await RuleBookVersion.findOneAndUpdate(
      { family: rule.family, version: rule.version },
      { $set: rule },
      { upsert: true, new: true }
    );
  }
}
