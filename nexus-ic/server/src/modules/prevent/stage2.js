import { CaseAction, ActionCheck, PreventAlert, ACTION_TYPES } from './models.js';
import { getRules } from './rules.js';
import { readCase, caseAccess, audit, fail, uid, hash } from './access.js';
import Case from '../cases/Case.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';
import { validateProceedReason, actionSummary } from '../additions/n81-live-conflict-warning/service.js';
export function actionSubject(details = {}, actionType) {
  if (!details || typeof details !== 'object' || Array.isArray(details) || typeof details.subject !== 'string' || !details.subject.trim()) throw fail(400, 'SUBJECT_REQUIRED');
  const key = hash(details.subject.normalize('NFC').trim().toLocaleLowerCase());
  if (actionType !== 'INSTRUCTION') return key;
  if (!['ALLOW', 'DENY'].includes(details.direction)) throw fail(400, 'DEMO_INSTRUCTION_DIRECTION_REQUIRED');
  return `${details.direction}:${key}`;
}
export async function checkAction(user, { caseId, actionType, details }) {
  if (!ACTION_TYPES.includes(actionType)) throw fail(400, 'INVALID_ACTION_TYPE');
  const target = await readCase(user, caseId);
  const subjectKey = actionSubject(details, actionType);
  const rules = await getRules();
  const reasons = [], relatedCases = [], restricted = new Set();
  const actions = await CaseAction.find({ institutionPid: target.institutionPid }).lean();
  const now = Date.now();
  const fresh = rules.configured && actions.length && actions.every(action => now - new Date(action.at).getTime() <= rules.freshnessMs && new Date(action.at).getTime() <= now);
  let result = 'UNKNOWN';
  if (!rules.configured) reasons.push(rules.reason);
  else if (!actions.length) reasons.push('ACTION_FEED_MISSING');
  else if (!fresh) reasons.push('ACTION_FEED_STALE');
  else {
    // Scale (S7): one query for all linked cases instead of one per recorded action.
    const linkedById = new Map((await Case.find({ _id: { $in: [...new Set(actions.map((a) => String(a.caseId)))] } }).lean()).map((c) => [String(c._id), c]));
    for (const action of actions) {
      const linked = linkedById.get(String(action.caseId));
      const allowed = linked && await caseAccess(user, linked);
      if (!linked || linked.institutionPid !== target.institutionPid || CLOSED_STATUSES.includes(linked.status)) continue;
      const sameSubject = action.subjectKey.split(':').at(-1) === subjectKey.split(':').at(-1);
      if (!sameSubject) continue;
      const matched = [];
      if (actionType === 'DOCUMENT_REQUEST' && action.actionType === actionType) matched.push('REPEATED_DOCUMENT_REQUEST');
      if (action.actionType === actionType && action.bureau !== (user.bureau || user.role)) matched.push('OVERLAPPING_BUREAU_ACTION');
      if (actionType === 'INSTRUCTION' && action.actionType === actionType && action.subjectKey !== subjectKey) matched.push('CONFLICTING_INSTRUCTION');
      if (!matched.length) continue;
      reasons.push(...matched);
      if (allowed) relatedCases.push(actionSummary(action, linked)); else restricted.add(String(linked._id));
    }
    result = reasons.length ? 'REVIEW' : 'CLEAR';
    if (!reasons.length) reasons.push('NO_NAMED_CONFLICT_FOUND');
  }
  const check = await ActionCheck.create({ caseId: target._id, actorId: uid(user), actionType, subjectKey, result });
  await audit(user, 'action.checked', check.id, { result });
  if (result !== 'CLEAR') {
    const alert = await PreventAlert.create({ caseId: target._id, checkId: check._id, recipientId: uid(user), result, reasons: [...new Set(reasons)] });
    await audit(user, 'alert.created', alert.id);
  }
  let lockerDocument = null;
  if (actionType === 'DOCUMENT_REQUEST') {
    const { availableForCase } = await import('../additions/n83-document-locker/service.js');
    lockerDocument = await availableForCase(user, String(target._id), details.documentType || details.subject);
  }
  return { checkId: check.id, institutionPid: target.institutionPid, result, advisory: true, canProceed: true, lockerDocument, reasons: [...new Set(reasons)], counterReasons: ['ACTION_CONTEXT_MAY_DIFFER', 'HUMAN_DECIDES'],
    relatedCases: [...new Map(relatedCases.map(row => [row.caseId, row])).values()], restrictedCount: restricted.size,
    ruleVersion: rules.actionVersion || rules.version || null, synthetic: !!rules.synthetic };
}
export async function proceedAction(user, checkId, reason) {
  if (!/^[a-f\d]{24}$/i.test(checkId || '')) throw fail(404, 'CHECK_NOT_FOUND');
  const check = await ActionCheck.findOne({ _id: checkId, actorId: uid(user) });
  if (!check) throw fail(404, 'CHECK_NOT_FOUND');
  const proceedReason = check.result === 'REVIEW' ? validateProceedReason(reason) : (typeof reason === 'string' ? reason.trim() : '');
  const target = await readCase(user, String(check.caseId));
  if (!check.proceededAt) {
    const action = await CaseAction.create({ caseId: target._id, institutionPid: target.institutionPid, bureau: user.bureau || user.role,
      actorId: uid(user), actorRole: user.role, actionType: check.actionType, subjectKey: check.subjectKey, at: new Date() });
    await audit(user, 'action.recorded', action.id);
    check.proceededAt = new Date(); check.actionId = action._id; await check.save();
  }
  await audit(user, 'action.proceeded', check.id, { result: check.result, reason: proceedReason });
  return { proceeded: true, result: check.result, canProceed: true };
}
