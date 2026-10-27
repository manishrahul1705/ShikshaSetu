import mongoose from 'mongoose';
import Case from '../cases/Case.js';
import RuleBookVersion from '../rulebook/models.js';
import { recordAudit } from '../audit/audit.js';
import { CLOSED_STATUSES } from '../lifecycle/lifecycleGuards.js';
import { classifyDemoCase } from './classify.js';
import logger from '../../config/logger.js';

const schema = new mongoose.Schema({
  dedupeKey: { type: String, required: true, unique: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  masterCaseId: { type: String, required: true },
  segmentId: { type: String, required: true }, ruleVersion: { type: String, required: true },
  state: { type: String, enum: ['NEAR_DUE', 'OVERDUE', 'ESCALATED'], required: true },
  dueAt: { type: Date, required: true }, detectedAt: { type: Date, required: true },
  recipientRole: { type: String, required: true },
}, { strict: 'throw' });
export const SlaEvent = mongoose.models.SlaEvent || mongoose.model('SlaEvent', schema, 'sla_events');

export async function scanSla({ now = new Date(), user = { id: 'sla-monitor', role: 'system' } } = {}) {
  if (process.env.APP_MODE === 'production') return { result: 'POLICY_NOT_CONFIGURED', raised: 0 };
  await SlaEvent.init();
  const rules = await RuleBookVersion.find({ family: 'SLA', status: 'approved', effectiveFrom: { $lte: now } }).lean();
  const byVersion = new Map(rules.map(rule => [rule.version, rule.body]));
  const rows = await Case.find({ status: { $nin: CLOSED_STATUSES } }).select('_id masterCaseId createdAt status slaClock').lean();
  let raised = 0;
  for (const row of rows) {
    const segment = row.slaClock?.at(-1);
    if (!segment || segment.endedAt || segment.status === 'PAUSED') continue;
    const policy = byVersion.get(segment.ruleVersion);
    const classified = classifyDemoCase({ receivedAt: segment.startedAt, now, status: row.status, policy });
    const states = ['NEAR_DUE', 'OVERDUE'].includes(classified.state) ? [classified.state] : [];
    if (classified.state === 'OVERDUE' && policy.escalationAfterOverdueHours > 0 && now - classified.dueAt >= policy.escalationAfterOverdueHours * 3600000) states.push('ESCALATED');
    for (const state of states) {
      const dedupeKey = `${row._id}|${segment.segmentId}|${state}`;
      const result = await SlaEvent.updateOne({ dedupeKey }, { $setOnInsert: { dedupeKey, caseId: row._id, masterCaseId: row.masterCaseId,
        segmentId: segment.segmentId, ruleVersion: segment.ruleVersion, state, dueAt: classified.dueAt, detectedAt: now,
        recipientRole: state === 'ESCALATED' ? 'bureau_lead' : 'case_owner' } }, { upsert: true });
      if (!result.upsertedCount) continue;
      raised++;
      if (state === 'ESCALATED') await Case.updateOne({ _id: row._id }, { $set: { isEscalated: true } });
      await recordAudit({ actorId: String(user.id || user._id), actorRole: user.role, action: `sla.${state.toLowerCase()}`,
        targetType: 'Case', targetId: row.masterCaseId, meta: { ruleVersion: segment.ruleVersion, segmentId: segment.segmentId, dueAt: classified.dueAt.toISOString() } });
    }
  }
  return { result: 'OK', scanned: rows.length, raised };
}

// Operational polling interval, not an SLA duration. All deadlines remain in
// the approved RuleBook. Tests control the scan clock explicitly.
if (process.env.NODE_ENV !== 'test') {
  let running = false;
  const timer = setInterval(async () => {
    if (running || mongoose.connection.readyState !== 1) return;
    running = true;
    try { await scanSla(); } catch { logger.warn({ action: 'sla.monitor.unavailable' }); }
    finally { running = false; }
  }, 60_000);
  timer.unref();
}
