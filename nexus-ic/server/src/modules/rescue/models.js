import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * rescue_alerts (SPEC 15.1): caseId, trigger, ruleVersion, supervisorId, state,
 * dedupeKey. Invariant: unique dedupeKey, so a trigger alerts once per case.
 */
export const RESCUE_TRIGGERS = ['THREE_OR_MORE_TRANSFERS', 'NO_EVENT_FOR_DAYS', 'TRANSFER_ACK_OVERDUE', 'TASK_OVERDUE_TWICE'];

const workItemSchema = new Schema(
  {
    type: { type: String, required: true },
    ref: { type: String, required: true },
  },
  { _id: false }
);

const rescueAlertSchema = new Schema(
  {
    caseId: { type: Schema.Types.ObjectId, required: true, index: true },
    masterCaseId: { type: String, required: true },
    trigger: { type: String, enum: RESCUE_TRIGGERS, required: true },
    ruleVersion: { type: String, required: true },
    supervisorId: { type: String, default: null },
    state: { type: String, enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'], default: 'OPEN', index: true },
    dedupeKey: { type: String, required: true, unique: true },
    reasonForDelay: { type: String, required: true },
    suggestedNextAction: { type: String, required: true },
    workItems: { type: [workItemSchema], default: [] },
    delayAttribution: { type: String, enum: ['WORK_ITEM', 'LATE_FEED'], default: 'WORK_ITEM' },
    officerDelayDays: { type: Number, default: null },
    feedLatencyDays: { type: Number, default: 0 },
    escalationRuleVersion: { type: String, default: null },
    detectedAt: { type: Date, required: true },
    acknowledgedBy: { type: String, default: null },
    acknowledgedAt: { type: Date, default: null },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true, strict: 'throw' }
);

export const RescueAlert =
  mongoose.models.rescue_alerts || mongoose.model('rescue_alerts', rescueAlertSchema, 'rescue_alerts');
export default RescueAlert;
