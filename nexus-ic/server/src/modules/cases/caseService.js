import crypto from 'node:crypto';
import { normalizeRedressal } from '../additions/n88-first-redressal/plugin.js';
import Case from './Case.js';
import CaseCounter from './CaseCounter.js';
import { getInstitutionByPid } from '../institutions/institutionService.js';
import { detect as detectLanguage } from '../intake/languageDetector.js';
import { isVerified, getReporterId, recordFraudSignal } from '../identity/index.js';
import { BURST_CONFIG } from '../intake/config.js';
import { setRevealScopeResolver } from '../vault/service.js';
import Document from '../documents/Document.js';
import { record as recordAudit } from '../audit/audit.js';
import { canAccessCase } from '../../middleware/rbac.js';

// N97: a college that exists only in an imported official AICTE list is a real
// institution. Demo grievances must never name it (synthetic data only).
export function assertNotRealListInDemo(institution) {
  if (process.env.APP_MODE === 'production' || institution?.source?.kind !== 'official') return;
  const err = new Error('Demo grievances cannot name a college from the imported official list');
  err.status = 400;
  err.code = 'OFFICIAL_INSTITUTION_DEMO_BLOCKED';
  throw err;
}
import { applyFieldPolicy } from '../../middleware/abac.js';
import logger from '../../config/logger.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';

// S1a reveal scope wiring: verify case access across open cases of reporterId
setRevealScopeResolver(async (user, reporterId) => {
  if (!user || !reporterId) return false;
  const openCases = await Case.find({
    reporterId,
    status: { $nin: [...CLOSED_STATUSES, 'REJECTED'] }, // closed in any spelling is out of reveal scope
  });
  for (const caseDoc of openCases) {
    if (await canAccessCase(user, caseDoc)) {
      return true;
    }
  }
  return false;
});

/**
 * Generate an atomic, permanent Master Case ID.
 * Format: NX-<year>-<6 digits> (e.g. NX-2026-000001)
 */
export async function generateMasterCaseId(year = 2026) {
  const counter = await CaseCounter.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return `NX-${year}-${String(counter.seq).padStart(6, '0')}`;
}

/**
 * Create a preview draft for a grievance (N13).
 * Allows complainants to edit before confirming submission.
 */
export async function createDraft({ user, institutionPid, category, subCategory, narrative, language }) {
  // Check verification requirement (N13)
  const verified = await isVerified(user._id || user.id);
  if (!verified) {
    const err = new Error('User must complete verification before submitting a grievance');
    err.status = 403;
    err.code = 'VERIFICATION_REQUIRED';
    err.redirect = '/verify';
    throw err;
  }

  // Lookup institution
  const instLookup = await getInstitutionByPid(institutionPid);
  if (!instLookup.found) {
    const err = new Error(`Institution not found for PID: ${institutionPid}`);
    err.status = 400;
    err.code = 'INSTITUTION_NOT_FOUND';
    throw err;
  }
  assertNotRealListInDemo(instLookup.institution);

  // Detect language locally (N67)
  const langDetection = detectLanguage(narrative);
  const languageTag = language || langDetection.tag;

  return {
    institution: {
      pid: instLookup.institution.pid,
      name: instLookup.institution.name,
      state: instLookup.institution.state,
      region: instLookup.institution.region,
      icid: instLookup.institution.icid,
    },
    grievance: {
      category,
      subCategory,
      narrative,
      languageTag,
      detectedScript: langDetection.script,
    },
    user: {
      displayName: user.displayName,
      role: user.role,
    },
    draftValidated: true,
  };
}

/**
 * Submit a verified grievance (N13, N14, N15, N67).
 *
 * Enforces:
 * - isVerified check (S1a)
 * - Exact PID lookup and snapshot preservation (N09 touchpoint 5)
 * - Duplicate-registration check (N14)
 * - externalRefs unique compound check (N14)
 * - Multilingual complaint original text preserved unchanged (N67)
 * - Channel: "web" (N15)
 * - Status: SUBMITTED (S2 owns routing/lifecycle)
 *
 * @param {Object} params
 * @returns {Promise<Case>}
 */
export async function submitGrievance({
  user,
  institutionPid,
  category,
  subCategory,
  narrative,
  language,
  externalRefs = [],
  documentIds = [],
  institutionRedressal,
  priority = 'normal',
  channel = 'web',
}) {
  // 1. Verification check (N13)
  const verified = await isVerified(user._id || user.id);
  if (!verified) {
    const err = new Error('User must complete identity verification before submitting a grievance');
    err.status = 403;
    err.code = 'VERIFICATION_REQUIRED';
    err.redirect = '/verify';
    throw err;
  }

  // 2. Obtain pseudonymous reporterId from identity module (N06, S1a contract)
  const reporterId = await getReporterId(user._id || user.id);
  if (!reporterId) {
    const err = new Error('User must complete identity verification before submitting a grievance');
    err.status = 403;
    err.code = 'VERIFICATION_REQUIRED';
    err.redirect = '/verify';
    throw err;
  }

  // 3. Institution auto-link and snapshot (N09 touchpoint 5, N13)
  const instLookup = await getInstitutionByPid(institutionPid);
  if (!instLookup.found) {
    const err = new Error(`Institution not found for PID: ${institutionPid}`);
    err.status = 400;
    err.code = 'INSTITUTION_NOT_FOUND';
    throw err;
  }
  assertNotRealListInDemo(instLookup.institution);
  const inst = instLookup.institution;
  const pidSnapshot = {
    pid: inst.pid,
    name: inst.name,
    state: inst.state,
    region: inst.region,
    type: inst.type,
    approvalStatus: inst.approvalStatus,
  };
  const icidSnapshot = {
    icid: inst.icid,
  };

  // 4. Duplicate registration check (N14)
  // "the same reporter submitting the same PID and the same text again is blocked with a clear message"
  const narrativeHash = crypto.createHash('sha256').update(narrative.trim(), 'utf8').digest('hex');
  const existingDuplicate = await Case.findOne({
    reporterId,
    institutionPid,
    narrativeHash,
  });

  if (existingDuplicate) {
    const err = new Error(`Duplicate registration: you have already submitted this grievance for institution ${institutionPid} (Case ${existingDuplicate.masterCaseId})`);
    err.status = 409;
    err.code = 'DUPLICATE_REGISTRATION';
    throw err;
  }

  // 5. External references duplicate check (N14, T09)
  if (externalRefs && externalRefs.length > 0) {
    for (const ref of externalRefs) {
      const existingRef = await Case.findOne({
        'externalRefs.sourceSystem': ref.sourceSystem,
        'externalRefs.sourceCaseRef': ref.sourceCaseRef,
      });
      if (existingRef) {
        const err = new Error(`Duplicate registration: external reference ${ref.sourceSystem}/${ref.sourceCaseRef} already registered to case ${existingRef.masterCaseId}`);
        err.status = 409;
        err.code = 'DUPLICATE_EXTERNAL_REF';
        throw err;
      }
    }
  }

  // Check burst submissions (Item 4, N05)
  const windowStart = new Date(Date.now() - BURST_CONFIG.windowMinutes * 60 * 1000);
  const recentCount = await Case.countDocuments({
    reporterId,
    createdAt: { $gte: windowStart },
  });
  if (recentCount >= BURST_CONFIG.maxSubmissionsInWindow) {
    // Record fraud signal without auto-rejecting or blocking grievance
    await recordFraudSignal(reporterId, 'burst_submissions', {});
  }

  // 6. Language detection without cloud translation (N67)
  const langDetection = detectLanguage(narrative);
  const languageTag = language || langDetection.tag;

  // 7. Atomic Master Case ID (N14)
  const masterCaseId = await generateMasterCaseId(2026);

  // 8. Create Case record (stores ONLY pseudonymous reporterId, NO userId)
  const newCase = await Case.create({
    masterCaseId,
    reporterId,
    institutionPid,
    pidSnapshot,
    institutionIcid: inst.icid !== 'not available' ? inst.icid : null,
    icidSnapshot,
    category,
    subCategory,
    narrative, // Stored byte-for-byte unchanged (N67)
    narrativeHash,
    languageTag,
    priority: 'normal',
    channel,
    status: 'SUBMITTED',
    routingDecisionId: null,
    owningBureau: null,
    externalRefs,
    documentIds,
    institutionRedressal: normalizeRedressal(institutionRedressal),
    synthetic: true,
  });

  // Link uploaded documents to case
  if (documentIds && documentIds.length > 0) {
    await Document.updateMany(
      { _id: { $in: documentIds } },
      { $set: { caseId: newCase._id } }
    );
  }

  // Phase S2: Automatic NEXUS ROUTE execution on submission (SPEC 8.1, N18)
  try {
    const { routeCaseOnSubmission } = await import('../routing/routingService.js');
    await routeCaseOnSubmission(newCase._id, inst);
  } catch (err) {
    logger.warn({ action: 'routing_submission_fallback', error: err.message, caseId: newCase._id });
  }

  // 9. Attributed Audit Event (S09)
  await recordAudit({
    actorId: reporterId,
    actorRole: user.role,
    action: 'case.created',
    targetType: 'Case',
    targetId: masterCaseId,
    meta: {
      institutionPid,
      category,
      subCategory,
      languageTag,
      channel,
    },
  });

  return newCase;
}

/**
 * List all cases owned by the authenticated complainant (S21).
 */
export async function getComplainantCases(user) {
  const reporterId = await getReporterId(user._id || user.id);
  if (!reporterId) return [];

  const cases = await Case.find({ reporterId }).sort({ createdAt: -1 });
  return cases.map((c) => applyFieldPolicy(c, user.role));
}

/**
 * Complainant case tracking with IDOR protection (S21, S02, S03).
 * Any non-matching case returns 404 with audited denial.
 */
export async function getComplainantCase(caseIdOrMasterId, user) {
  // Find by masterCaseId or _id
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(caseIdOrMasterId);
  const query = isObjectId
    ? { $or: [{ _id: caseIdOrMasterId }, { masterCaseId: caseIdOrMasterId }] }
    : { masterCaseId: caseIdOrMasterId };

  const caseDoc = await Case.findOne(query);

  if (!caseDoc) {
    return null;
  }

  // Check access control (S02, S21)
  const allowed = await canAccessCase(user, caseDoc);
  if (!allowed) {
    // Record audited denial (S21)
    await recordAudit({
      actorId: String(user._id || user.id || user.username),
      actorRole: user.role,
      action: 'case.access_denied_idor',
      targetType: 'Case',
      targetId: caseDoc.masterCaseId,
      meta: {
        reason: 'IDOR_DENIED',
        requestedId: caseIdOrMasterId,
      },
    });

    // Return null to produce 404 (IDOR denied)
    return null;
  }

  // Apply field-level ABAC (S03)
  const result = applyFieldPolicy(caseDoc, user.role);

  // S25: Anti-retaliation restriction for confirmed sensitive cases
  const { canAccessSensitiveNarrative } = await import('../lifecycle/accessControl.js');
  const canAccessNarrative = await canAccessSensitiveNarrative(user, caseDoc);
  if (!canAccessNarrative) {
    result.narrative = '[RESTRICTED: Sensitive case narrative withheld]';
    result.documentIds = [];
    result.documents = [];
  }

  return result;
}
