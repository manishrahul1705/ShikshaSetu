import { getActiveRule } from '../rulebook/index.js';
import Case from '../cases/Case.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';
import { resolveIdentity } from '../institutions/institutionService.js';

/**
 * NEXUS ROUTE explainable jurisdiction engine (SPEC Section 8.1, N18, U16)
 *
 * Evaluates all six factors together:
 * 1. Category and sub-category
 * 2. Institution type and AICTE region
 * 3. Bureau and cell jurisdiction rules (from RuleBook)
 * 4. Existing ongoing cases for the same institution
 * 5. Policy and regulatory guidelines (e.g. registry status)
 * 6. Confidence score with its explanation
 */
export async function evaluateRouting(caseDoc, institutionProfile = null) {
  const reasons = [];
  let confidence = 0.85;
  let isAmbiguous = false;

  const rule = await getActiveRule('JURISDICTION');
  // SPEC 11: a missing approved rule gives POLICY_NOT_CONFIGURED; nothing is assumed.
  if (!rule || rule.result === 'POLICY_NOT_CONFIGURED') {
    return {
      primary: 'MANUAL_REVIEW',
      secondary: null,
      confidence: 0,
      reasons: ['POLICY_NOT_CONFIGURED: no approved JURISDICTION rule; the case waits for human triage'],
      ruleVersion: 'POLICY_NOT_CONFIGURED',
      isManualReview: true,
      factors: { category: caseDoc.category, subCategory: caseDoc.subCategory, ruleVersion: 'POLICY_NOT_CONFIGURED' },
    };
  }
  const ruleVersion = rule.versionId;
  const confidenceThreshold = Number.isFinite(rule.body?.confidenceThreshold) ? rule.body.confidenceThreshold : null;
  const bureauMapping = rule.body?.bureauMapping || {};
  const defaultPrimary = rule.body?.defaultPrimary || 'MANUAL_REVIEW';

  // Factor 1 & 3: Category, sub-category & Bureau jurisdiction rules
  let primary = defaultPrimary;
  let secondary = null;

  const catEntry = bureauMapping[caseDoc.category];
  if (catEntry) {
    primary = catEntry.primary;
    secondary = catEntry.secondary;
    confidence = catEntry.confidence || confidence;
    reasons.push(`Category '${caseDoc.category}' maps to primary '${primary}' under rule ${ruleVersion}`);
    if (secondary) {
      reasons.push(`Secondary bureau '${secondary}' assigned for coordinated review`);
    }
  } else {
    isAmbiguous = true;
    confidence = 0.50;
    reasons.push(`Category '${caseDoc.category}' has no direct mapping in ${ruleVersion}; defaulted to ${defaultPrimary}`);
  }

  // Factor 2: Institution type and AICTE region
  const instType = institutionProfile?.institutionType || caseDoc.pidSnapshot?.institutionType;
  const region = institutionProfile?.region || caseDoc.pidSnapshot?.region;
  const regionalCell = ['Northern', 'Western', 'Southern', 'Central', 'Eastern', 'North Eastern'].includes(region)
    ? `Regional Grievance Cell (${region})` : null;
  let icidCheck = 'NOT_AVAILABLE';

  if (region) {
    const AICTE_6_REGIONS = ['Northern', 'Western', 'Southern', 'Central', 'Eastern', 'North Eastern'];
    const pid = caseDoc.institutionPid || institutionProfile?.pid || caseDoc.pidSnapshot?.pid;
    const candidateIcid = caseDoc.icidSnapshot?.icid || institutionProfile?.icid;
    const icid = /^IIC-[A-Z0-9]{8}$/.test(candidateIcid || '') ? candidateIcid : null;
    if (icid && pid) icidCheck = await resolveIdentity(pid, icid);
    const icidText = icid ? ` (ICID ${icid} ${icidCheck})` : '';
    if (icidCheck === 'IDENTITY_REVIEW') {
      isAmbiguous = true;
      reasons.push('PID and IIC ID mapping needs human identity review before assignment');
    }

    if (AICTE_6_REGIONS.includes(region)) {
      if (!secondary) secondary = regionalCell;
      reasons.push(`Region ${region} from PID ${pid || 'UNKNOWN'}${icidText}`);
    } else {
      reasons.push(`Institution region is '${region}'`);
      if (!secondary && region !== 'Central') {
        secondary = 'RO';
      }
    }
  } else {
    confidence -= 0.10;
    reasons.push('Institution region is not specified in profile');
  }

  if (instType) {
    reasons.push(`Institution classification: '${instType}'`);
  }

  // Factor 4: Existing ongoing cases for the same institution
  let ongoingCount = 0;
  if (caseDoc.institutionPid) {
    ongoingCount = await Case.countDocuments({
      institutionPid: caseDoc.institutionPid,
      status: { $nin: CLOSED_STATUSES },
      _id: { $ne: caseDoc._id },
    });
    if (ongoingCount > 0) {
      reasons.push(`${ongoingCount} other ongoing complaints active for institution ${caseDoc.institutionPid}`);
    }
  }

  // Factor 5: Policy & regulatory guidelines (F48, F56: registry unavailable)
  const isRegistryDown = institutionProfile?.status === 'UNKNOWN' || caseDoc.pidSnapshot?.status === 'UNKNOWN';
  if (isRegistryDown) {
    isAmbiguous = true;
    confidence = Math.min(confidence, 0.40);
    reasons.push('REGISTRY_OFFLINE_UNKNOWN: Registry feed unavailable (UNKNOWN status); routing flagged for manual triage without zeros');
  }

  // Factor 6: Confidence threshold check
  if (rule.body?.requireCurrentApprovalForAutoRouting && institutionProfile?.approvalStatus && institutionProfile.approvalStatus !== 'approved') {
    isAmbiguous = true;
    reasons.push(`Institution approval is ${institutionProfile.approvalStatus}; a person must confirm jurisdiction before assignment`);
  }
  confidence = Number(Math.max(0, Math.min(1, confidence)).toFixed(2));
  if (confidenceThreshold === null) {
    isAmbiguous = true;
    reasons.push(`Confidence threshold POLICY_NOT_CONFIGURED in ${ruleVersion}; manual review`);
  } else if (confidence < confidenceThreshold) {
    isAmbiguous = true;
    reasons.push(`Confidence score (${confidence}) is below the RuleBook threshold (${confidenceThreshold})`);
  }

  return {
    primary,
    secondary,
    confidence,
    reasons,
    ruleVersion,
    isManualReview: isAmbiguous,
    factors: {
      category: caseDoc.category,
      subCategory: caseDoc.subCategory,
      region,
      regionalCell,
      icidCheck,
      institutionType: instType,
      ongoingCount,
      registryStatus: isRegistryDown ? 'UNKNOWN' : 'VERIFIED',
      ruleVersion,
    },
  };
}
