import Case from '../cases/Case.js';
import User from '../auth/User.js';
import AuditEvent from '../audit/AuditEvent.js';
import { verifyChain, recordAudit } from '../audit/audit.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { getReporterId } from '../identity/index.js';
import { CaseAction, PreventAlert } from '../prevent/models.js';
import { RescueAlert } from '../rescue/models.js';
import { allTransfers, allTasks, queriesModel } from '../closure/s3Adapter.js';
import { StatusNotice } from '../notices/noticeService.js';
import { SlaEvent } from '../sla/service.js';
import { fail, actorId, CLOSED_STATUSES, COMPLAINANT_ROLES } from '../closure/util.js';

/**
 * SPEC 12.1 role-based workspaces that had no page yet (S7 release fix):
 * officer dashboard / bureau queue (/dashboard, /cases), regional view
 * (/dashboard regional scope), audit trail (/audit) and the notification
 * centre. All read-only, all scoped by the same RBAC as every case route
 * (S01, S02); case rows are a short allow-list (no narrative, no identity).
 */
export const OFFICER_ROLES = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];
export const AUDIT_ROLES = ['auditor', 'system_admin', 'competent_authority', 'supervisor'];

const label = (s) => (s === 'SUBMITTED' ? 'Registered' : s);

function slaOf(c, now) {
  const seg = Array.isArray(c.slaClock) && c.slaClock.length ? c.slaClock[c.slaClock.length - 1] : null;
  if (!seg) return { result: 'POLICY_NOT_CONFIGURED', reason: 'NO_SLA_CLOCK' };
  const target = new Date(seg.targetResolutionDate);
  return {
    ruleVersion: seg.ruleVersion,
    targetResolutionDate: target,
    nearDueDate: seg.nearDueDate || null,
    state: target < now ? 'OVERDUE' : seg.nearDueDate && new Date(seg.nearDueDate) < now ? 'NEAR_DUE' : 'ON_TRACK',
  };
}

function scopeOf(user) {
  if (user.role === 'bureau_officer') return `Cases routed to ${user.bureau || 'no bureau'}`;
  if (user.role === 'regional_officer') return `Regional view: cases in ${user.region || 'no'} region`;
  return 'All cases visible to this role';
}

/** Officer dashboard and bureau/cell queue: my cases, tasks, SLA, actions. */
export async function myQueue(user, now = new Date()) {
  if (!OFFICER_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  // Scale (S7): a bureau officer's candidates are narrowed in the query (own bureau and its short
  // alias); canAccessCase below still decides every row.
  const ALIAS = { 'Public Grievance Redressal Cell': 'PGRC', 'Regulation Bureau': 'RB', 'Academic Bureau': 'AB', 'Approval Bureau': 'APB' };
  const alias = Object.entries(ALIAS).flatMap(([a, b]) => (a === user.bureau ? [b] : b === user.bureau ? [a] : []));
  const filter = { status: { $nin: CLOSED_STATUSES } };
  if (user.role === 'bureau_officer') filter.owningBureau = { $in: [user.bureau, ...alias] };
  const open = await Case.find(filter).sort({ createdAt: 1 }).lean();
  const visible = [];
  for (const c of open) if (await canAccessCase(user, c)) visible.push(c);
  const me = actorId(user);
  const cases = visible.map((c) => ({
    masterCaseId: c.masterCaseId,
    category: c.category,
    subCategory: c.subCategory,
    status: label(c.status),
    priority: c.priority,
    owningBureau: c.owningBureau || null,
    accountableOwner: { office: c.currentOwner?.office || c.owningBureau || 'Unassigned', role: c.currentOwner?.role || (c.owningBureau ? 'bureau queue, officer not yet assigned' : 'Intake / Triage') },
    assignedToMe: String(c.currentOwner?.officerId || c.assignedOfficerId || '') === me,
    transferStatus: c.transferStatus || 'NONE',
    isEscalated: !!c.isEscalated,
    sla: slaOf(c, now),
  }));

  const tasks = await allTasks(user.role === 'bureau_officer' ? { assignedBureau: user.bureau, status: { $ne: 'COMPLETED' } } : { status: { $ne: 'COMPLETED' } });
  const transfers = await allTransfers(user.role === 'bureau_officer' ? { toBureau: user.bureau, status: 'REQUESTED' } : { status: 'REQUESTED' });
  const actions = await CaseAction.find({ actorId: me }).sort({ at: -1 }).limit(20).lean();
  const caseById = new Map(visible.map((c) => [String(c._id), c.masterCaseId]));

  return {
    synthetic: true,
    scope: scopeOf(user),
    counts: {
      open: cases.length,
      assignedToMe: cases.filter((c) => c.assignedToMe).length,
      overdue: cases.filter((c) => c.sla.state === 'OVERDUE').length,
      nearDue: cases.filter((c) => c.sla.state === 'NEAR_DUE').length,
      noSlaClock: cases.filter((c) => c.sla.result === 'POLICY_NOT_CONFIGURED').length,
    },
    // Most urgent first, at most 200 rows per page load; counts above cover every case in scope.
    cases: [...cases].sort((a, b) => Number(b.assignedToMe) - Number(a.assignedToMe) || (a.sla.state === 'OVERDUE' ? -1 : 0) - (b.sla.state === 'OVERDUE' ? -1 : 0)).slice(0, 200),
    totalInScope: cases.length,
    tasks: tasks === null ? { result: 'UNKNOWN', reason: 'SYNC_NOT_AVAILABLE' } : tasks.map((t) => ({ id: String(t._id), title: t.title, status: t.status, assignedBureau: t.assignedBureau, ackDueAt: t.ackDueAt, completionDueAt: t.completionDueAt, masterCaseId: caseById.get(String(t.caseId)) || null })),
    incomingTransfers: transfers === null ? { result: 'UNKNOWN', reason: 'TRACE_NOT_AVAILABLE' } : transfers.map((t) => ({ id: String(t._id), masterCaseId: t.masterCaseId, fromBureau: t.fromBureau, toBureau: t.toBureau, dueAt: t.dueAt, isEscalated: !!t.isEscalated })),
    myRecentActions: actions.map((a) => ({ masterCaseId: caseById.get(String(a.caseId)) || null, actionType: a.actionType, at: a.at })),
  };
}

/** Audit trail (/audit): complete history of all actions, without meta payloads. */
export async function auditTrail(user, { limit = 200, action } = {}) {
  if (!AUDIT_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const filter = action ? { action: String(action) } : {};
  const n = Math.min(Math.max(Number(limit) || 200, 1), 1000);
  // The viewing event is recorded first, so the list, the total and the chain check all include it.
  await recordAudit({ actorId: actorId(user), actorRole: user.role, action: 'audit.trail.viewed', targetType: 'AuditTrail', targetId: action || 'all', meta: { limit: n } });
  const events = await AuditEvent.find(filter).sort({ seq: -1 }).limit(n).select('seq at actorId actorRole action targetType targetId hash -_id').lean();
  const chain = await verifyChain();
  return { synthetic: true, chain, total: await AuditEvent.countDocuments(filter), events };
}

/** Notification centre: in-app notices for this user. Email and SMS go through the simulators (SMS sandbox). */
export async function notifications(user) {
  const me = actorId(user);
  const items = [];
  if (COMPLAINANT_ROLES.includes(user.role)) {
    const reporterId = await getReporterId(me);
    if (reporterId) {
      const own = await Case.find({ reporterId }).select('_id masterCaseId').lean();
      const ids = own.map((c) => c._id);
      for (const n of await StatusNotice.find({ caseId: { $in: ids }, channel: 'EMAIL' }).sort({ createdAt: -1 }).limit(50).lean()) {
        items.push({ kind: 'STATUS', at: n.createdAt, text: n.body, link: `/track/${n.masterCaseId}` });
      }
      const Query = await queriesModel();
      if (Query) {
        for (const q of await Query.find({ caseId: { $in: ids }, recipientType: 'complainant', status: 'PENDING' }).lean()) {
          items.push({ kind: 'QUERY', at: q.queriedAt, text: `A question about ${q.masterCaseId} is waiting for your reply`, link: `/queries/${q.masterCaseId}` });
        }
      }
    }
  } else if (user.role === 'institution_admin') {
    const row = await User.findById(me).select('institutionPid').lean();
    const Query = await queriesModel();
    if (row?.institutionPid && Query) {
      const ids = (await Case.find({ institutionPid: row.institutionPid }).select('_id').lean()).map((c) => c._id);
      for (const q of await Query.find({ caseId: { $in: ids }, recipientType: 'institution', status: 'PENDING' }).lean()) {
        items.push({ kind: 'QUERY', at: q.queriedAt, text: `An AICTE request about ${q.masterCaseId} is waiting for your response`, link: '/institution' });
      }
    }
  } else if (OFFICER_ROLES.includes(user.role)) {
    for (const alert of await SlaEvent.find().sort({ detectedAt: -1 }).limit(100).lean()) {
      const caseDoc = await Case.findById(alert.caseId).lean();
      if (!caseDoc || !(await canAccessCase(user, caseDoc))) continue;
      items.push({ kind: 'SLA', at: alert.detectedAt, text: `${alert.masterCaseId}: ${alert.state === 'NEAR_DUE' ? 'deadline approaching' : alert.state === 'ESCALATED' ? 'overdue, bureau lead review required' : 'resolution deadline passed'}`, link: `/cases/${alert.masterCaseId}` });
    }
    const transfers = await allTransfers(user.role === 'bureau_officer' ? { toBureau: user.bureau, status: 'REQUESTED' } : { status: 'REQUESTED' });
    for (const t of transfers || []) items.push({ kind: 'TRANSFER', at: t.requestedAt, text: `Transfer of ${t.masterCaseId} from ${t.fromBureau} awaits acknowledgement${t.isEscalated ? ' (escalated)' : ''}`, link: '/transfers' });
    for (const a of await PreventAlert.find({ recipientId: me }).sort({ createdAt: -1 }).limit(50).lean()) {
      items.push({ kind: 'PREVENT', at: a.createdAt, text: `PREVENT ${a.result}: ${a.reasons.join(', ')}`, link: '/review' });
    }
    if (['supervisor', 'competent_authority'].includes(user.role)) {
      for (const r of await RescueAlert.find({ state: 'OPEN' }).sort({ detectedAt: -1 }).limit(50).lean()) {
        items.push({ kind: 'RESCUE', at: r.detectedAt, text: `${r.masterCaseId}: ${r.reasonForDelay}`, link: '/rescue' });
      }
    }
  }
  items.sort((a, b) => new Date(b.at) - new Date(a.at));
  return { synthetic: true, channels: { inApp: 'ACTIVE', email: 'EmailSimulator', sms: 'SmsSimulator (sandbox until approved)' }, items };
}
