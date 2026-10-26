import mongoose from 'mongoose';
import Case from '../../cases/Case.js';
import { CaseAction } from '../../prevent/models.js';
import RuleBookVersion from '../../rulebook/models.js';
import { getActiveRule } from '../../rulebook/rulebookService.js';
import { CLOSED_STATUSES } from '../../lifecycle/lifecycleGuards.js';
import { canAccessCase } from '../../../middleware/rbac.js';
import { recordAudit } from '../../audit/audit.js';
import reminderRulePlugin from './rulebook.plugin.js';
RuleBookVersion.schema.plugin(reminderRulePlugin);
const schema = new mongoose.Schema({ caseId: { type: mongoose.Schema.Types.ObjectId, required: true }, day: { type: String, required: true }, at: { type: Date, required: true }, ruleVersion: { type: String, required: true }, idleDays: { type: Number, required: true } });
schema.index({ caseId: 1, day: 1 }, { unique: true });
export const PendingReminder = mongoose.models.PendingReminder || mongoose.model('PendingReminder', schema, 'pending_case_reminders');
export const kolkataDay = now => new Date(+now + 19800000).toISOString().slice(0, 10);
export async function reminderCandidates(now = new Date()) {
  const rule = await getActiveRule('PENDING_REMINDER', now), idleDays = rule.body?.idleDays;
  if (!Number.isInteger(idleDays) || idleDays <= 0) return { result: 'POLICY_NOT_CONFIGURED', items: [] };
  const cases = await Case.find({ status: { $nin: CLOSED_STATUSES } }).select('masterCaseId institutionPid owningBureau routingDecisionId pidSnapshot createdAt statusHistory').lean();
  const actions = await CaseAction.find({ caseId: { $in: cases.map(c => c._id) } }).select('caseId at').lean();
  const latest = new Map();
  for (const a of actions) latest.set(String(a.caseId), Math.max(latest.get(String(a.caseId)) || 0, +new Date(a.at)));
  const cutoff = +now - idleDays * 86400000;
  const items = cases.filter(c => Math.max(+new Date(c.createdAt), latest.get(String(c._id)) || 0, ...(c.statusHistory || []).map(h => +new Date(h.at))) <= cutoff);
  return { result: 'CONFIGURED', idleDays, ruleVersion: rule.version, items };
}
export async function runReminders(now = new Date()) {
  const candidates = await reminderCandidates(now), day = kolkataDay(now);
  let created = 0;
  if (candidates.result === 'CONFIGURED') {
    await PendingReminder.init();
    for (const c of candidates.items) {
      try {
        const result = await PendingReminder.updateOne({ caseId: c._id, day }, { $setOnInsert: { caseId: c._id, day, at: now, idleDays: candidates.idleDays, ruleVersion: candidates.ruleVersion } }, { upsert: true });
        created += result.upsertedCount || 0;
      } catch (e) { if (e.code !== 11000) throw e; }
    }
  }
  await recordAudit({ actorId: 'pending-reminder-scheduler', actorRole: 'system', action: 'reminders.run', targetType: 'ReminderRun', targetId: day, meta: { result: candidates.result, candidates: candidates.items.length, created } });
  return { result: candidates.result, day, created };
}
export async function reminderItems(user, now = new Date()) {
  if (!['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'].includes(user.role)) return [];
  const candidates = await reminderCandidates(now);
  if (candidates.result !== 'CONFIGURED') return [];
  const byId = new Map(candidates.items.map(c => [String(c._id), c]));
  const records = await PendingReminder.find({ caseId: { $in: candidates.items.map(c => c._id) }, day: kolkataDay(now) }).sort({ at: -1 }).lean();
  const items = [];
  for (const r of records) {
    const c = byId.get(String(r.caseId));
    if (c && await canAccessCase(user, c)) items.push({ kind: 'REMINDER', at: r.at, text: `${c.masterCaseId}: pending case requires an accountable update`, link: `/cases/${c.masterCaseId}` });
  }
  return items;
}
