import Case from '../cases/Case.js';
import User from '../auth/User.js';
import AuditEvent from '../audit/AuditEvent.js';
import { recordAudit } from '../audit/audit.js';
import { getActiveRule } from '../rulebook/index.js';
import { CaseAction } from '../prevent/models.js';
import { allTransfers, allTasks, queriesModel } from '../closure/s3Adapter.js';
import { fail, actorId, CLOSED_STATUSES } from '../closure/util.js';
import { RescueAlert } from './models.js';

/**
 * NEXUS RESCUE: stalled-case recovery (SPEC 10.2, N24).
 *
 * Triggers come from the RuleBook family RESCUE (DEMO-RESCUE-v1, synthetic):
 * three or more transfers; no recorded event for 7 calendar days on an open
 * case; a transfer acknowledgement past its escalation point; a coordination
 * task overdue twice. Alerts go to a supervisor, are deduplicated by a unique
 * dedupeKey, and their reasons point to work items, not to misconduct.
 * A late-arriving feed never counts as officer delay (F43).
 */
const DAY = 24 * 60 * 60 * 1000;
const SYSTEM = { id: 'rescue-scan', role: 'system' };

/**
 * F43 (hint only): split feed latency from officer delay.
 * officerEvents: Date[] recorded in this system.
 * feedEvents: [{ sourceAt, receivedAt }] delivered by an external feed; the
 * work happened at sourceAt, so the gap to receivedAt is feed latency.
 * feedPending: a feed for this case is expected and has not arrived.
 */
export function classifyDelay({ now, officerEvents = [], feedEvents = [], feedPending = false }) {
  const times = [...officerEvents.map((d) => new Date(d).getTime()), ...feedEvents.map((f) => new Date(f.sourceAt).getTime())].filter(Number.isFinite);
  const last = times.length ? Math.max(...times) : null;
  const idleDays = last === null ? null : Math.floor((now.getTime() - last) / DAY);
  const feedLatencyDays = feedEvents.reduce((sum, f) => sum + Math.max(0, new Date(f.receivedAt) - new Date(f.sourceAt)), 0) / DAY;
  if (feedPending) {
    return { attribution: 'LATE_FEED', idleDays, officerDelayDays: null, feedLatencyDays: Math.floor(feedLatencyDays) };
  }
  return { attribution: 'WORK_ITEM', idleDays, officerDelayDays: idleDays, feedLatencyDays: Math.floor(feedLatencyDays) };
}

/** No adapter in the repo delivers case events yet, so the default feed input is empty. */
export const noFeed = async () => ({ events: [], pending: false });

function missedDeadlines(task, now) {
  let missed = 0;
  const ack = task.acknowledgedAt ? new Date(task.acknowledgedAt) : null;
  if ((ack && ack > new Date(task.ackDueAt)) || (!ack && now > new Date(task.ackDueAt))) missed++;
  const done = task.completedAt ? new Date(task.completedAt) : null;
  if ((done && done > new Date(task.completionDueAt)) || (!done && now > new Date(task.completionDueAt))) missed++;
  return missed;
}

async function lastEventByCase(cases) {
  const ids = cases.map((c) => String(c._id));
  const last = new Map(cases.map((c) => [String(c._id), [new Date(c.createdAt)]]));
  const push = (id, at) => at && last.get(String(id))?.push(new Date(at));
  const audits = await AuditEvent.aggregate([
    { $match: { targetType: 'Case', targetId: { $in: ids } } },
    { $group: { _id: '$targetId', at: { $max: '$at' } } },
  ]);
  for (const row of audits) push(row._id, row.at);
  const actions = await CaseAction.aggregate([
    { $match: { caseId: { $in: cases.map((c) => c._id) } } },
    { $group: { _id: '$caseId', at: { $max: '$at' } } },
  ]);
  for (const row of actions) push(row._id, row.at);
  const Query = await queriesModel();
  if (Query) {
    for (const q of await Query.find({ caseId: { $in: cases.map((c) => c._id) } }).select('caseId queriedAt respondedAt').lean()) {
      push(q.caseId, q.queriedAt);
      push(q.caseId, q.respondedAt);
    }
  }
  return last;
}

async function pickSupervisor() {
  const sup = await User.findOne({ role: 'supervisor', active: true }).sort({ createdAt: 1 }).select('_id').lean();
  return sup ? String(sup._id) : null;
}

export async function runRescueScan({ now = new Date(), feed = noFeed, user = SYSTEM } = {}) {
  const rule = await getActiveRule('RESCUE', now);
  if (rule.result === 'POLICY_NOT_CONFIGURED') return { result: 'POLICY_NOT_CONFIGURED', raised: [] };
  const t = rule.body?.triggers || {};
  const escalation = await getActiveRule('ESCALATION', now);
  const escalationRuleVersion = escalation.result === 'POLICY_NOT_CONFIGURED' ? 'POLICY_NOT_CONFIGURED' : escalation.version;

  const cases = await Case.find({ status: { $nin: CLOSED_STATUSES } }).lean();
  if (cases.length === 0) return { result: 'OK', ruleVersion: rule.version, scanned: 0, raised: [], unknown: [] };
  const caseIds = cases.map((c) => c._id);
  const transfers = await allTransfers({ caseId: { $in: caseIds } });
  const tasks = await allTasks({ caseId: { $in: caseIds } });
  const lastEvents = await lastEventByCase(cases);
  const supervisorId = await pickSupervisor();
  const unknown = [];
  if (transfers === null) unknown.push('TRANSFERS_NOT_AVAILABLE');
  if (tasks === null) unknown.push('TASKS_NOT_AVAILABLE');

  const candidates = [];
  for (const c of cases) {
    const id = String(c._id);
    const caseTransfers = (transfers || []).filter((x) => String(x.caseId) === id);
    for (const x of caseTransfers) {
      lastEvents.get(id).push(new Date(x.requestedAt));
      if (x.acknowledgedAt) lastEvents.get(id).push(new Date(x.acknowledgedAt));
    }
    const caseTasks = (tasks || []).filter((x) => String(x.caseId) === id);
    for (const x of caseTasks) lastEvents.get(id).push(new Date(x.updatedAt));

    if (transfers !== null && Number.isInteger(t.maxTransfers) && caseTransfers.length >= t.maxTransfers) {
      candidates.push({
        c, trigger: 'THREE_OR_MORE_TRANSFERS',
        reasonForDelay: `Case transferred ${caseTransfers.length} times (${rule.version} limit ${t.maxTransfers})`,
        suggestedNextAction: 'Supervisor to confirm one accountable owner and settle jurisdiction before any further transfer',
        workItems: caseTransfers.map((x) => ({ type: 'TRANSFER', ref: String(x._id) })),
      });
    }

    if (transfers !== null && t.transferAckOverdue) {
      const overdue = caseTransfers.filter((x) => x.status === 'REQUESTED' && (x.isEscalated || now > new Date(x.dueAt)));
      if (overdue.length) {
        candidates.push({
          c, trigger: 'TRANSFER_ACK_OVERDUE',
          reasonForDelay: `Transfer to ${overdue[0].toBureau} not acknowledged by its escalation point`,
          suggestedNextAction: 'Receiving unit to accept the transfer, or reject it with a reason',
          workItems: overdue.map((x) => ({ type: 'TRANSFER', ref: String(x._id) })),
        });
      }
    }

    if (tasks !== null && t.taskOverdueTwice) {
      const twice = caseTasks.filter((x) => x.status !== 'COMPLETED' && missedDeadlines(x, now) >= 2);
      if (twice.length) {
        candidates.push({
          c, trigger: 'TASK_OVERDUE_TWICE',
          reasonForDelay: 'Coordination task missed both its acknowledgement and completion deadlines',
          suggestedNextAction: 'Assigned unit to complete the task, or the coordinating officer to re-plan it',
          workItems: twice.map((x) => ({ type: 'TASK', ref: String(x._id) })),
        });
      }
    }

    if (Number.isInteger(t.maxDaysInactivity)) {
      const feedInput = await feed(c);
      const delay = classifyDelay({ now, officerEvents: lastEvents.get(id), feedEvents: feedInput.events, feedPending: feedInput.pending });
      if (delay.idleDays !== null && delay.idleDays >= t.maxDaysInactivity) {
        const lateFeed = delay.attribution === 'LATE_FEED';
        candidates.push({
          c, trigger: 'NO_EVENT_FOR_DAYS', delay,
          reasonForDelay: lateFeed
            ? `No recorded event for ${delay.idleDays} calendar days; a late-arriving feed may not be recorded yet`
            : `No recorded event for ${delay.idleDays} calendar days on an open case`,
          suggestedNextAction: lateFeed
            ? 'Check the source feed before asking the owner; feed latency is not officer delay'
            : `Current owner (${c.currentOwner?.office || c.owningBureau || 'triage'}) to record the next action or a reason for waiting`,
          workItems: [{ type: 'CASE', ref: c.masterCaseId }],
        });
      }
    }
  }

  const raised = [];
  for (const cand of candidates) {
    const dedupeKey = `${cand.c._id}:${cand.trigger}:${rule.version}`;
    const result = await RescueAlert.findOneAndUpdate(
      { dedupeKey },
      {
        $setOnInsert: {
          caseId: cand.c._id, masterCaseId: cand.c.masterCaseId, trigger: cand.trigger, ruleVersion: rule.version, supervisorId,
          dedupeKey, reasonForDelay: cand.reasonForDelay, suggestedNextAction: cand.suggestedNextAction, workItems: cand.workItems,
          delayAttribution: cand.delay?.attribution || 'WORK_ITEM', officerDelayDays: cand.delay ? cand.delay.officerDelayDays : null,
          feedLatencyDays: cand.delay?.feedLatencyDays || 0, escalationRuleVersion, detectedAt: now, state: 'OPEN', synthetic: true,
        },
      },
      { upsert: true, new: true, includeResultMetadata: true }
    );
    if (result.lastErrorObject?.updatedExisting === false) {
      raised.push(result.value);
      await recordAudit({
        actorId: actorId(user), actorRole: user.role, action: 'rescue.alert.raised', targetType: 'RescueAlert', targetId: String(result.value._id),
        meta: { masterCaseId: cand.c.masterCaseId, trigger: cand.trigger, ruleVersion: rule.version, supervisorId },
      });
    }
  }
  return { result: unknown.length ? 'PARTIAL' : 'OK', ruleVersion: rule.version, scanned: cases.length, raised, unknown };
}

export async function listAlerts(user, { state } = {}) {
  const filter = state ? { state } : {};
  return RescueAlert.find(filter).sort({ detectedAt: -1 }).limit(500).lean();
}

export async function acknowledgeAlert(user, id) {
  const alert = await RescueAlert.findById(id).catch(() => null);
  if (!alert) throw fail(404, 'ALERT_NOT_FOUND');
  if (alert.state !== 'OPEN') throw fail(409, 'ALERT_NOT_OPEN');
  alert.state = 'ACKNOWLEDGED';
  alert.acknowledgedBy = actorId(user);
  alert.acknowledgedAt = new Date();
  await alert.save();
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'rescue.alert.acknowledged', targetType: 'RescueAlert', targetId: String(alert._id),
    meta: { masterCaseId: alert.masterCaseId, trigger: alert.trigger },
  });
  return alert;
}

/** Optional interval, only when RESCUE_SCAN_INTERVAL_MS is set. Off by default and in tests. */
let timer = null;
export function startRescueSchedule() {
  const ms = Number(process.env.RESCUE_SCAN_INTERVAL_MS);
  if (timer || !Number.isFinite(ms) || ms < 60_000) return false;
  timer = setInterval(() => runRescueScan().catch(() => {}), ms);
  timer.unref?.();
  return true;
}
