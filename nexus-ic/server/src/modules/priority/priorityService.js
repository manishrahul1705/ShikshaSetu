import mongoose from 'mongoose';
import Case from '../cases/Case.js';
import { getActiveRule } from '../rulebook/index.js';
import crypto from 'node:crypto';
import { recordAudit } from '../audit/audit.js';

/**
 * Determine initial priority and explainable reason (SPEC Section 8.2, N19)
 *
 * Priority is a workload-prioritization signal, never an institutional guilt score.
 */
export async function determineInitialPriority({ category, isSuggestedSensitive }) {
  if (isSuggestedSensitive || /ragging|safety|harassment/i.test(category)) {
    return {
      priority: 'urgent',
      reason: 'Urgent priority assigned due to sensitive category or trigger words (DEMO-CASE-PRIORITY-v1)',
    };
  }

  if (/shortage|infrastructure|salary|malpractice/i.test(category)) {
    return {
      priority: 'high',
      reason: 'High priority assigned due to systemic compliance or infrastructure impact',
    };
  }

  return {
    priority: 'normal',
    reason: 'Standard priority assigned for general grievance (DEMO-CASE-STANDARD-v1)',
  };
}

/**
 * Combined priority evaluation helper (N19)
 */
export async function evaluatePriorityAndClocks(category, subCategory, narrative) {
  const isSensitive = /ragging|safety|harassment|threat/i.test(category) || /threat|ragging/i.test(narrative || '');
  const { priority, reason } = await determineInitialPriority({ category, isSuggestedSensitive: isSensitive });
  const initialClockSegment = await createClockSegment(priority, category, new Date());
  return {
    priority,
    reason,
    initialClockSegment,
  };
}

/**
 * Create a new SLA clock segment under current active RuleBook version (U19)
 *
 * Non-retroactive: leaves prior clock segments untouched.
 */
export async function createClockSegment(priority, category, startedAt = new Date()) {
  const isUrgent = priority === 'urgent' || priority === 'high';
  const expectedVersion = isUrgent ? 'DEMO-CASE-PRIORITY-v1' : 'DEMO-CASE-STANDARD-v1';
  let ruleVersion = expectedVersion;
  let rule = null;

  try {
    // Production mode never selects DEMO rules directly (SPEC 11); getActiveRule enforces that below.
    if (process.env.APP_MODE === 'production') throw new Error('use active rule');
    const { default: RuleBookVersion } = await import('../rulebook/models.js');
    rule = await RuleBookVersion.findOne({
      family: 'SLA',
      version: expectedVersion,
      status: 'approved',
      effectiveFrom: { $lte: startedAt },
    }).lean();
    if (rule) {
      ruleVersion = rule.version;
    } else {
      rule = await getActiveRule('SLA', startedAt);
      if (rule && rule.version) ruleVersion = rule.version;
    }
  } catch {
    rule = await getActiveRule('SLA', startedAt);
    ruleVersion = rule?.version || 'POLICY_NOT_CONFIGURED';
  }

  // Days come only from an approved RuleBook SLA rule (SPEC 11, Rule 2). Without one
  // there is no clock: POLICY_NOT_CONFIGURED, and callers start no segment.
  const calendarPolicy = rule?.body?.approvedFor === 'SYNTHETIC_DEMO' && process.env.APP_MODE !== 'production';
  const timelines = rule?.body?.timelines;
  const catTimeline = timelines ? timelines[category] || timelines[priority] || timelines.default : null;
  const resolutionDays = Number(calendarPolicy ? rule.body.calendarDays : catTimeline?.resolutionDays);
  if (!Number.isFinite(resolutionDays) || resolutionDays <= 0) return null;
  const nearDue = Number(catTimeline?.nearDueWarningDays);
  const nearDueWarningDays = Number.isFinite(nearDue) && nearDue > 0 ? nearDue : null;

  const targetResolutionDate = new Date(startedAt.getTime() + resolutionDays * 24 * 60 * 60 * 1000);
  const nearDueHours = Number(calendarPolicy ? rule.body.nearDueHours : null);
  const nearDueDate = calendarPolicy
    ? (nearDueHours > 0 ? new Date(targetResolutionDate.getTime() - nearDueHours * 3600000) : null)
    : nearDueWarningDays === null ? null : new Date(startedAt.getTime() + nearDueWarningDays * 24 * 60 * 60 * 1000);

  return {
    segmentId: `SEG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    ruleVersion,
    priority,
    startedAt,
    targetResolutionDate,
    nearDueDate,
    endedAt: null,
    status: 'RUNNING',
  };
}

/**
 * Update case priority and initiate a new SLA clock segment (U19)
 */
export async function updateCasePriorityAndClock(caseOrId, newPriority, userOrReason, reasonOrUser) {
  let doc = caseOrId;
  if (!doc || typeof doc === 'string' || doc instanceof mongoose.Types.ObjectId || !doc.save) {
    doc = await Case.findById(caseOrId);
  }
  if (!doc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  let user = null;
  let reason = null;
  if (typeof userOrReason === 'string') {
    reason = userOrReason;
    user = reasonOrUser;
  } else {
    user = userOrReason;
    reason = reasonOrUser;
  }

  const oldPriority = doc.priority;
  if (oldPriority === newPriority && Array.isArray(doc.slaClock) && doc.slaClock.length > 0) {
    return doc;
  }

  const now = new Date();

  // Close previous running clock segment
  if (Array.isArray(doc.slaClock) && doc.slaClock.length > 0) {
    const lastIdx = doc.slaClock.length - 1;
    if (!doc.slaClock[lastIdx].endedAt) {
      doc.slaClock[lastIdx].endedAt = now;
      doc.slaClock[lastIdx].status = 'COMPLETED';
    }
  } else {
    doc.slaClock = [];
  }

  // Create new segment under current active RuleBook (U19)
  const newSegment = await createClockSegment(newPriority, doc.category, now);
  if (newSegment) doc.slaClock.push(newSegment);
  doc.priority = newPriority;

  await doc.save();

  await recordAudit({
    actorId: String(user?._id || user?.id || 'system'),
    actorRole: user?.role || 'system',
    action: 'case.priority.updated',
    targetType: 'Case',
    targetId: String(doc._id),
    meta: {
      oldPriority,
      newPriority,
      ruleVersion: newSegment ? newSegment.ruleVersion : 'POLICY_NOT_CONFIGURED',
      reason: reason || 'Priority changed, starting new clock segment',
    },
  });

  return doc;
}
