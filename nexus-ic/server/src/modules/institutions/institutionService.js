import Institution from './Institution.js';
import InstitutionIdentifier from './InstitutionIdentifier.js';
import Region from './Region.js';
import Case from '../cases/Case.js';
import * as RegistrySimulator from '../registry/RegistrySimulator.js';
import { record as recordAudit } from '../audit/audit.js';
import { getReporterId } from '../identity/index.js';
import { applyFieldPolicy } from '../../middleware/abac.js';
import logger from '../../config/logger.js';
import OfficialInstitution from '../registry/OfficialInstitution.js';
import { toRegistryResult } from '../registry/adapters.js';
import ResearchInstitution from '../researchRegistry/ResearchInstitution.js';
import { publicResearchResult, sourcePid } from '../researchRegistry/service.js';

/**
 * Touchpoints 6, 9, 10 helper:
 * export resolveIdentity(pid, icid) returning 'MATCH', 'NOT_AVAILABLE' or 'IDENTITY_REVIEW'
 * Reusable by S4 (matching), S6 (imports), S5 (reports).
 *
 * SPEC 3 Hard Rules:
 * 1. PID is authoritative key.
 * 2. ICID never links alone.
 * 3. Disagreement -> IDENTITY_REVIEW.
 * 4. Missing ICID -> NOT_AVAILABLE.
 */
export async function resolveIdentity(pid, icid) {
  if (!icid) {
    return 'NOT_AVAILABLE';
  }

  // Check institution_identifiers mapping collection
  const mapping = await InstitutionIdentifier.findOne({ icid }).lean();
  if (mapping) {
    if (mapping.status === 'active' && mapping.pid === pid) {
      return 'MATCH';
    }
    return 'IDENTITY_REVIEW';
  }

  // Check institution master profile
  const inst = await Institution.findOne({ pid }).lean();
  if (inst) {
    if (inst.icid === icid) {
      return 'MATCH';
    }
    if (inst.icid && inst.icid !== icid) {
      return 'IDENTITY_REVIEW';
    }
  }

  // Check Registry Simulator
  const regLookup = RegistrySimulator.lookup(pid);
  if (regLookup.found && regLookup.profile) {
    if (regLookup.profile.icid === icid) {
      return 'MATCH';
    }
    if (regLookup.profile.icid && regLookup.profile.icid !== icid) {
      return 'IDENTITY_REVIEW';
    }
  }

  return 'IDENTITY_REVIEW';
}

/**
 * Lookup institution by PID with exact matching (F01, N10).
 * Never fuzzy-links.
 */
export async function getInstitutionByPid(pid) {
  if (sourcePid(pid)) {
    const research = await ResearchInstitution.findOne({ pid }).lean();
    if (research) return { found: true, institution: publicResearchResult(research) };
  }
  if (!pid || !/^1-\d{10}$/.test(pid)) {
    return { found: false, reason: 'INVALID_PID_FORMAT' };
  }

  // 1. Check local database
  let institution = await Institution.findOne({ pid }).lean();

  if (!institution) {
    const official = await OfficialInstitution.findOne({ pid }).lean();
    if (official) {
      return {
        found: true,
        institution: toRegistryResult({
          ...official,
          approvalStatus: official.approvalStatus || 'UNKNOWN',
        }),
      };
    }
  }

  // 2. If not in DB, query RegistrySimulator
  if (!institution) {
    const regResult = RegistrySimulator.lookup(pid);
    if (!regResult.found) {
      return { found: false, reason: regResult.reason || 'PID_NOT_FOUND' };
    }

    // Auto-fetch profile
    const profile = regResult.profile;
    institution = await Institution.create({
      pid: profile.pid,
      name: profile.name,
      city: profile.city, district: profile.district, establishedYear: profile.establishedYear,
      intake: profile.intake, approvalValidUntil: profile.approvalValidUntil,
      state: profile.state,
      region: profile.region,
      type: profile.type,
      approvalStatus: profile.approvalStatus || 'approved',
      aliases: profile.aliases || [],
      campuses: profile.campuses || [],
      registrySnapshot: profile,
      lastRegistryFetch: new Date(),
      synthetic: true,
    });

    if (profile.icid) {
      await InstitutionIdentifier.findOneAndUpdate(
        { icid: profile.icid },
        {
          icid: profile.icid,
          pid: profile.pid,
          source: 'registry_auto_fetch',
          verifiedAt: new Date(),
          status: 'active',
          synthetic: true,
        },
        { upsert: true, new: true }
      );
    }
  }

  // Also query any mapped ICID
  const identifier = await InstitutionIdentifier.findOne({ pid }).lean();

  return {
    found: true,
    institution: {
      ...institution,
      icid: identifier ? identifier.icid : 'not available',
    },
  };
}

/**
 * Lookup PID by ICID (N09 touchpoint 4, R32).
 * Resolves ICID to PID.
 */
export async function getPidByIcid(icid) {
  const normalizedIcid = String(icid || '').toUpperCase();
  if (!/^IIC-[A-Z0-9]{8}$/.test(normalizedIcid)) {
    return { found: false, reason: 'INVALID_ICID_FORMAT' };
  }

  const mapping = await InstitutionIdentifier.findOne({ icid: normalizedIcid, status: 'active' }).lean();
  if (mapping) {
    return getInstitutionByPid(mapping.pid);
  }

  const registryResult = RegistrySimulator.lookupByIcid(normalizedIcid);
  if (!registryResult.found || !registryResult.profile) {
    return { found: false, reason: registryResult.reason || 'ICID_NOT_FOUND' };
  }

  // Resolve against the authoritative PID path so cold databases get the
  // same profile and identifier snapshot as PID lookups.
  return getInstitutionByPid(registryResult.profile.pid);
}

/**
 * Reclassify institution region (N11).
 * Requires reviewer role and reason. Audited.
 */
export async function reclassifyRegion({ pid, newRegion, reviewerId, reviewerRole, reason }) {
  if (!reason || reason.trim().length === 0) {
    const err = new Error('Reclassification requires a non-empty reason');
    err.status = 400;
    throw err;
  }

  const allowedRegions = ['Northern', 'Western', 'Southern', 'Central', 'Eastern', 'North Eastern'];
  if (!allowedRegions.includes(newRegion)) {
    const err = new Error(`Invalid region: ${newRegion}`);
    err.status = 400;
    throw err;
  }

  const inst = await Institution.findOne({ pid });
  if (!inst) {
    const err = new Error('Institution not found');
    err.status = 404;
    throw err;
  }

  const oldRegion = inst.region;
  inst.region = newRegion;
  await inst.save();

  // Audit event (S09, N11)
  await recordAudit({
    actorId: String(reviewerId),
    actorRole: reviewerRole,
    action: 'institution.region_reclassified',
    targetType: 'Institution',
    targetId: pid,
    meta: {
      oldRegion,
      newRegion,
      reason,
      version: 'DEMO-REGIONS-v1',
    },
  });

  return inst;
}

/**
 * Generate Institution 360 composite view (N12, F04).
 * Single-window profile:
 * - complete profile
 * - related grievances (ongoing & past)
 * - actions taken by each bureau (other bureaus as opaque metadata)
 * - region and jurisdiction details
 * - IIC ID mapping block
 * - attention indicators with visible reasons (or UNKNOWN with reason)
 * - "N restricted entries" disclosure
 * - Never a guilt/risk score
 */
export async function getInstitution360(pid, user) {
  const result = await getInstitutionByPid(pid);
  if (!result.found) {
    return result;
  }

  const inst = result.institution;

  // IIC ID mapping block (touchpoint 3)
  const mappings = await InstitutionIdentifier.find({ pid }).lean();
  const icidMappingBlock = mappings.map((m) => ({
    icid: m.icid,
    mappedPid: m.pid,
    source: m.source,
    lastVerifiedDate: m.verifiedAt || m.createdAt,
    status: m.status,
  }));

  // Fetch cases for this institution
  const allCases = await Case.find({ institutionPid: pid }).lean();

  // Attention indicators (E07, N12: operational reasons, never a score)
  const attentionIndicators = [];

  // Check overdue or stalled cases
  const now = Date.now();
  let overdueCount = 0;
  for (const c of allCases) {
    // If case is older than 30 days and still SUBMITTED/Registered
    const ageDays = (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 30 && c.status === 'SUBMITTED') {
      overdueCount++;
    }
  }

  if (overdueCount > 0) {
    attentionIndicators.push({
      type: 'OVERDUE_TASKS',
      label: 'Overdue Intake Tasks',
      reason: `${overdueCount} cases awaiting initial routing over 30 days`,
    });
  }

  // Check source conflicts
  const disputedMappings = mappings.filter((m) => m.status === 'disputed');
  if (disputedMappings.length > 0) {
    attentionIndicators.push({
      type: 'SOURCE_CONFLICT',
      label: 'Identifier Disagreement',
      reason: `${disputedMappings.length} identifier mappings disputed in identity review`,
    });
  }

  // If no external feeds exist yet for certain indicators, report UNKNOWN with reason (Rule 5)
  attentionIndicators.push({
    type: 'ATTENDANCE_FEED',
    label: 'Campus Attendance Monitoring',
    status: 'UNKNOWN',
    reason: 'External biometric feed simulator not connected in this phase',
  });

  // Filter cases visible to this user
  let visibleCases = [];
  let restrictedCount = 0;
  const userReporterId = (user?.role === 'student' || user?.role === 'faculty')
    ? await getReporterId(user._id || user.id)
    : null;

  for (const c of allCases) {
    // Other bureaus' entries appear as opaque metadata if user is a bureau officer
    if (user.role === 'bureau_officer' && c.owningBureau && c.owningBureau !== user.bureau) {
      visibleCases.push({
        masterCaseId: c.masterCaseId,
        category: c.category,
        owningBureau: c.owningBureau,
        status: c.status,
        createdAt: c.createdAt,
        opaqueCounterpart: true, // Opaque metadata
      });
    } else if (user.role === 'institution_admin') {
      // Redacted form
      visibleCases.push({
        masterCaseId: c.masterCaseId,
        category: c.category,
        subCategory: c.subCategory,
        status: c.status,
        createdAt: c.createdAt,
        reporterId: '[REDACTED]',
      });
    } else if (
      ['supervisor', 'competent_authority', 'auditor', 'system_admin'].includes(user.role) ||
      (user.role === 'regional_officer' && user.region === inst.region)
    ) {
      visibleCases.push(applyFieldPolicy(c, user.role));
    } else if (user.role === 'student' || user.role === 'faculty') {
      if (userReporterId && c.reporterId === userReporterId) {
        visibleCases.push(applyFieldPolicy(c, user.role));
      } else {
        restrictedCount++;
      }
    } else {
      restrictedCount++;
    }
  }

  return {
    found: true,
    institution: {
      pid: inst.pid,
      name: inst.name,
      aliases: inst.aliases || [],
      state: inst.state,
      region: inst.region,
      type: inst.type,
      approvalStatus: inst.approvalStatus,
      approvalDate: inst.createdAt,
      campuses: inst.campuses || [],
      icid: inst.icid,
    },
    jurisdiction: {
      region: inst.region,
      statesUnderRegion: inst.state,
      referenceTable: 'DEMO-REGIONS-v1',
    },
    icidMapping: icidMappingBlock,
    attentionIndicators,
    grievances: {
      total: allCases.length,
      visible: visibleCases,
      restrictedCount,
      restrictedNotice: restrictedCount > 0 ? `${restrictedCount} restricted entries` : null,
    },
  };
}
