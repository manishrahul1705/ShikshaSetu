import { Coordination, CoordinationTask, CommunicationLog } from './models.js';
import Case from '../cases/Case.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { getActiveRule } from '../rulebook/index.js';
import { addBusinessDays } from '../trace/businessDays.js';
import { checkAction } from '../prevent/stage2.js';
import { recordAudit } from '../audit/audit.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';

/**
 * Shared View of all related cases for an institution (SPEC 9.3, N21)
 *
 * Invariant:
 * Only cases the officer may access are serialized; the rest are aggregated as "N restricted entries".
 */
export async function getSharedInstitutionView(user, institutionPid) {
  const allCases = await Case.find({ institutionPid }).lean();

  const accessibleCases = [];
  let restrictedCount = 0;

  for (const c of allCases) {
    const allowed = await canAccessCase(user, c);
    if (allowed) {
      accessibleCases.push({
        _id: c._id,
        masterCaseId: c.masterCaseId,
        category: c.category,
        subCategory: c.subCategory,
        status: c.status,
        transferStatus: c.transferStatus || 'NONE',
        owningBureau: c.owningBureau || c.currentOwner?.office,
        priority: c.priority,
        createdAt: c.createdAt,
      });
    } else {
      restrictedCount++;
    }
  }

  const coordinations = await Coordination.find({ institutionPid }).lean();
  const coordIds = coordinations.map((c) => c._id);
  const tasks = await CoordinationTask.find({ coordinationId: { $in: coordIds } }).lean();

  return {
    institutionPid,
    accessibleCases,
    restrictedCount,
    coordinations,
    tasks,
  };
}

/**
 * Create a multi-bureau coordination workspace (SPEC 9.3, N21)
 */
export async function createCoordination(user, { institutionPid, caseIds = [], participatingBureaus = [], leadBureau }) {
  if (!institutionPid) {
    const err = new Error('institutionPid is required');
    err.status = 400;
    throw err;
  }

  const coord = await Coordination.create({
    institutionPid,
    caseIds,
    participatingBureaus: participatingBureaus.length ? participatingBureaus : [user.bureau || 'PGRC'],
    leadBureau: leadBureau || user.bureau || 'PGRC',
    status: 'OPEN',
  });

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'sync.coordination.created',
    targetType: 'Coordination',
    targetId: String(coord._id),
    meta: {
      institutionPid,
      leadBureau: coord.leadBureau,
      participatingBureaus: coord.participatingBureaus,
    },
  });

  return coord;
}

/**
 * N75: SYNC steps "Agree on Next Steps (where applicable)" and "Each Unit Continues Its Assigned Work"
 */
export async function recordCoordinationAgreement(user, coordinationId, { nextSteps }) {
  if (!nextSteps || typeof nextSteps !== 'string' || !nextSteps.trim()) {
    const err = new Error('Agreed next steps are required (N75)');
    err.status = 400;
    throw err;
  }

  const coord = await Coordination.findById(coordinationId);
  if (!coord) {
    const err = new Error('Coordination not found');
    err.status = 404;
    throw err;
  }

  const now = new Date();
  coord.status = 'AGREED';
  coord.agreedNextSteps = {
    agreedBy: [
      {
        officerId: (user._id || user.id),
        bureau: user.bureau || 'PGRC',
        role: user.role,
      },
    ],
    steps: nextSteps.trim(),
    agreedAt: now,
  };
  await coord.save();

  // Log in append-only communication log (SPEC 15.1, S28)
  await CommunicationLog.create({
    coordinationId: coord._id,
    from: `${user.role}:${user.bureau || 'PGRC'}`,
    to: 'ALL_PARTICIPATING_BUREAUS',
    channel: 'SYNC',
    at: now,
  });

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'sync.coordination.agreed',
    targetType: 'Coordination',
    targetId: String(coord._id),
    meta: {
      nextSteps: coord.agreedNextSteps.steps,
      agreedAt: now,
    },
  });

  return coord;
}

/**
 * Create a coordination task with RuleBook clocks (DEMO-TASK-v1, DEMO-SYNC-ACK-v1)
 */
export async function createCoordinationTask(user, { coordinationId, caseId, assignedBureau, title, description }) {
  if (!coordinationId || !assignedBureau || !title) {
    const err = new Error('coordinationId, assignedBureau and title are required');
    err.status = 400;
    throw err;
  }

  const coord = await Coordination.findById(coordinationId);
  if (!coord) {
    const err = new Error('Coordination not found');
    err.status = 404;
    throw err;
  }

  // Fetch RuleBook clocks
  const syncRule = await getActiveRule('COORDINATION');
  const ackWindow = syncRule?.body?.syncAckWindowBusinessDays || 3;

  const taskRule = await getActiveRule('TASK');
  const taskWindow = taskRule?.body?.taskCompletionWindowBusinessDays || 5;

  const now = new Date();
  const ackDueAt = addBusinessDays(now, ackWindow);
  const completionDueAt = addBusinessDays(now, taskWindow);

  const task = await CoordinationTask.create({
    coordinationId: coord._id,
    caseId: caseId || null,
    assignedBureau,
    title: title.trim(),
    description: description || '',
    status: 'PENDING',
    ackDueAt,
    completionDueAt,
  });

  // Append-only communication log entry
  await CommunicationLog.create({
    caseId: caseId || null,
    coordinationId: coord._id,
    from: `${user.role}:${user.bureau || 'PGRC'}`,
    to: `bureau:${assignedBureau}`,
    channel: 'SYNC',
    at: now,
  });

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'sync.task.created',
    targetType: 'CoordinationTask',
    targetId: String(task._id),
    meta: {
      coordinationId: String(coord._id),
      assignedBureau,
      ackDueAt,
      completionDueAt,
    },
  });

  return task;
}

/**
 * Acknowledge a coordination task
 */
export async function acknowledgeCoordinationTask(user, taskId) {
  const task = await CoordinationTask.findById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }

  task.status = 'ACKNOWLEDGED';
  task.acknowledgedAt = new Date();
  task.assignedOfficerId = (user._id || user.id);
  await task.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'sync.task.acknowledged',
    targetType: 'CoordinationTask',
    targetId: String(task._id),
  });

  return task;
}

/**
 * Complete a coordination task (SPEC 9.3, N21)
 *
 * Invariant:
 * Completing a task NEVER changes case status to Closed.
 */
export async function completeCoordinationTask(user, taskId) {
  const task = await CoordinationTask.findById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }

  task.status = 'COMPLETED';
  task.completedAt = new Date();
  await task.save();

  // If task is linked to a case, verify case status was NOT changed to Closed
  if (task.caseId) {
    const caseDoc = await Case.findById(task.caseId);
    if (caseDoc && CLOSED_STATUSES.includes(caseDoc.status)) {
      throw new Error('Invariant violation: Task completion cannot close a case');
    }
  }

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'sync.task.completed',
    targetType: 'CoordinationTask',
    targetId: String(task._id),
  });

  return task;
}

/**
 * Call S4 PREVENT checkAction before recording an instruction (SPEC 9.3, N21)
 *
 * Advisory check to prevent conflicting instructions across bureaus.
 */
export async function checkInstructionConflict(user, { caseId, instructionText, direction = 'ALLOW' }) {
  if (!instructionText || typeof instructionText !== 'string') {
    const err = new Error('instructionText is required');
    err.status = 400;
    throw err;
  }

  const userObj = user.toObject ? { ...user.toObject(), id: String(user._id || user.id), role: user.role, bureau: user.bureau } : user;

  // Calls S4 stage2 checkAction with actionType 'INSTRUCTION'
  const checkResult = await checkAction(userObj, {
    caseId: String(caseId),
    actionType: 'INSTRUCTION',
    details: {
      subject: instructionText.trim(),
      direction,
    },
  });

  return checkResult;
}

/**
 * Helper for S5 Closure Gate (SPEC 10.1, N22)
 *
 * Returns true if any coordination task linked to this case is uncompleted.
 */
export async function hasPendingTasks(caseId) {
  const count = await CoordinationTask.countDocuments({
    caseId,
    status: { $ne: 'COMPLETED' },
  });
  return count > 0;
}

/**
 * Get append-only communication log (SPEC 15.1, N21)
 */
export async function getCommunicationLog(user, { caseId, coordinationId }) {
  const query = {};
  if (caseId) query.caseId = caseId;
  if (coordinationId) query.coordinationId = coordinationId;

  return CommunicationLog.find(query).sort({ at: 1 }).lean();
}
