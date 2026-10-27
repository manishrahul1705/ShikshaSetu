import Case from '../cases/Case.js';
import RoutingDecision from './models.js';
import { evaluateRouting } from './routingEngine.js';
import { detectSensitivity } from '../priority/sensitivityService.js';
import { determineInitialPriority, createClockSegment } from '../priority/priorityService.js';
import User from '../auth/User.js';
import { recordAudit } from '../audit/audit.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';

/**
 * Route case immediately after submission (SPEC Section 8.1, N18)
 *
 * Called from S1b caseService.submitGrievance.
 */
export async function routeCaseOnSubmission(caseId, institutionProfile = null) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    throw new Error(`Case ${caseId} not found for routing`);
  }

  // 1. Local sensitivity detection (N19, U18)
  const sensitivityResult = await detectSensitivity(caseDoc.narrative, caseDoc.category);
  if (sensitivityResult.flags.length > 0) {
    caseDoc.sensitivityFlags = sensitivityResult.flags;
  }

  // 2. Risk & Priority analysis (N19)
  const priorityInfo = await determineInitialPriority({
    category: caseDoc.category,
    isSuggestedSensitive: sensitivityResult.isSuggestedSensitive,
  });
  caseDoc.priority = priorityInfo.priority;

  // 3. Initialize first SLA clock segment under active RuleBook (U19)
  const clockSegment = await createClockSegment(caseDoc.priority, caseDoc.category);
  caseDoc.slaClock = clockSegment ? [clockSegment] : []; // no approved SLA rule: POLICY_NOT_CONFIGURED, no clock

  // 4. Evaluate 6-factor routing engine
  const decisionResult = await evaluateRouting(caseDoc, institutionProfile);

  // 5. Create immutable routing decision record
  const decision = await RoutingDecision.create({
    caseId: caseDoc._id,
    masterCaseId: caseDoc.masterCaseId,
    primary: decisionResult.primary,
    secondary: decisionResult.secondary,
    confidence: decisionResult.confidence,
    reasons: decisionResult.reasons,
    ruleVersion: decisionResult.ruleVersion,
    isManualReview: decisionResult.isManualReview,
    factors: { ...decisionResult.factors, priority: { value: priorityInfo.priority, reason: priorityInfo.reason } },
    synthetic: true,
  });

  caseDoc.routingDecisionId = decision._id;

  // 6. State transition: REGISTERED -> ROUTED (SPEC 8.4)
  // Ambiguous cases wait in human triage queue; never silently assigned!
  if (decisionResult.isManualReview) {
    caseDoc.status = 'REGISTERED';
    caseDoc.owningBureau = null; // Unassigned, waits in triage
    caseDoc.analyticStatus = 'PENDING';
  } else {
    caseDoc.status = 'ROUTED';
    caseDoc.owningBureau = decisionResult.primary;
    caseDoc.analyticStatus = 'PENDING';
  }

  caseDoc.routingHistory = [
    {
      routingDecisionId: decision._id,
      action: decisionResult.isManualReview ? 'SENT_TO_TRIAGE' : 'AUTO_ROUTED',
      routedAt: new Date(),
      reason: decisionResult.reasons.join('; '),
    },
  ];

  await Case.findByIdAndUpdate(caseDoc._id, {
    $set: {
      sensitivityFlags: caseDoc.sensitivityFlags,
      priority: caseDoc.priority,
      slaClock: caseDoc.slaClock,
      routingDecisionId: decision._id,
      status: caseDoc.status,
      owningBureau: caseDoc.owningBureau,
      analyticStatus: caseDoc.analyticStatus,
      routingHistory: caseDoc.routingHistory,
    },
  });

  await recordAudit({
    actorId: 'system',
    actorRole: 'system',
    action: decisionResult.isManualReview ? 'routing.triage_required' : 'routing.auto_routed',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      primary: decisionResult.primary,
      confidence: decisionResult.confidence,
      ruleVersion: decisionResult.ruleVersion,
      isManualReview: decisionResult.isManualReview,
    },
  });

  return {
    caseDoc,
    decision,
    requiresManualReview: decisionResult.isManualReview,
  };
}

/**
 * Route override by authorized officer with recorded reason (U17)
 *
 * Immutable: Creates a new routing decision pointing to previous decision;
 * does not modify old decision.
 */
export async function overrideRoute(caseId, { primary, secondary, reason, user }) {
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    const err = new Error('Route override reason is required (U17)');
    err.status = 400;
    throw err;
  }

  if (!primary) {
    const err = new Error('Primary bureau is required for route override');
    err.status = 400;
    throw err;
  }

  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const oldDecision = await RoutingDecision.findById(caseDoc.routingDecisionId);

  // Create new linked decision record (immutable history)
  const newDecision = await RoutingDecision.create({
    caseId: caseDoc._id,
    masterCaseId: caseDoc.masterCaseId,
    primary,
    secondary: secondary || null,
    confidence: 1.0, // Human override has full confidence
    reasons: [`Human override by ${user.role} (${user.username}): ${reason}`],
    ruleVersion: oldDecision?.ruleVersion || 'DEMO-ROUTE-v1',
    isManualReview: false,
    overriddenBy: user._id || user.id,
    reason,
    previousDecisionId: oldDecision?._id || null,
    factors: { ...oldDecision?.factors, overrideReason: reason },
    synthetic: true,
  });

  caseDoc.routingDecisionId = newDecision._id;
  caseDoc.owningBureau = primary;
  caseDoc.status = 'ROUTED';

  if (!Array.isArray(caseDoc.routingHistory)) caseDoc.routingHistory = [];
  caseDoc.routingHistory.push({
    routingDecisionId: newDecision._id,
    action: 'HUMAN_OVERRIDE',
    routedAt: new Date(),
    reason,
    performedBy: user._id || user.id,
  });

  await caseDoc.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'routing.overridden',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      previousPrimary: oldDecision?.primary,
      newPrimary: primary,
      reason,
    },
  });

  return { caseDoc, newDecision };
}

/**
 * Fetch manual triage queue cases (/triage) (SPEC Section 8.4)
 */
export async function getTriageCases() {
  // Find decisions marked as manual review
  const triageDecisions = await RoutingDecision.find({ isManualReview: true })
    .sort({ createdAt: -1 })
    .lean();

  const caseIds = triageDecisions.map((d) => d.caseId);

  // Return open cases needing triage
  const cases = await Case.find({
    _id: { $in: caseIds },
    status: { $nin: CLOSED_STATUSES },
  }).lean();

  return cases.map((c) => {
    const dec = triageDecisions.find((d) => String(d.caseId) === String(c._id));
    return {
      ...c,
      routingDecision: dec,
      requiresManualReview: true,
    };
  });
}

/**
 * Assign case to named officer (SPEC Section 8.4: ROUTED -> ASSIGNED)
 */
export async function assignOfficerToCase(caseId, { officerId, user, reason }) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const officer = await User.findById(officerId);
  if (!officer) {
    const err = new Error('Assigned officer not found');
    err.status = 404;
    throw err;
  }

  caseDoc.assignedOfficerId = officer._id;
  caseDoc.currentOwner = {
    office: caseDoc.owningBureau || officer.bureau || 'General',
    role: officer.role,
    officerId: officer._id,
    officerName: officer.username,
    assignedAt: new Date(),
  };

  caseDoc.status = 'ASSIGNED';
  caseDoc.analyticStatus = 'PENDING';
  await caseDoc.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.assigned',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      officerId: String(officer._id),
      officerUsername: officer.username,
      reason: reason || 'Assigned to named officer',
    },
  });

  return caseDoc;
}
