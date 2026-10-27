import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * appeals (SPEC 15.1): caseId, level, filedAt, evidenceRefs, reviewerId, outcome.
 * Invariant: original case events untouched. Each appeal step is appended to
 * `events`; earlier entries are never rewritten.
 */
export const APPEAL_STATES = ['Appeal Filed', 'Under Appeal Review', 'Upheld', 'Modified', 'Remanded'];
export const APPEAL_OUTCOMES = ['Upheld', 'Modified', 'Remanded'];

const eventSchema = new Schema(
  {
    state: { type: String, enum: APPEAL_STATES, required: true },
    at: { type: Date, required: true },
    actorRole: { type: String, required: true },
  },
  { _id: false }
);

const appealSchema = new Schema(
  {
    caseId: { type: Schema.Types.ObjectId, required: true, index: true },
    masterCaseId: { type: String, required: true, index: true },
    closureRecordId: { type: Schema.Types.ObjectId, required: true },
    level: { type: Number, required: true, min: 1 },
    state: { type: String, enum: APPEAL_STATES, default: 'Appeal Filed', index: true },
    reporterId: { type: String, required: true },
    grounds: { type: String, default: '' },
    evidenceRefs: { type: [Schema.Types.ObjectId], default: [] },
    filedAt: { type: Date, required: true },
    ruleVersion: { type: String, required: true },
    reviewerId: { type: String, default: null },
    reviewerRole: { type: String, default: null },
    reviewStartedAt: { type: Date, default: null },
    outcome: { type: String, enum: [...APPEAL_OUTCOMES, null], default: null },
    decisionNote: { type: String, default: null },
    decidedAt: { type: Date, default: null },
    events: { type: [eventSchema], default: [] },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true, strict: 'throw' }
);

appealSchema.index({ caseId: 1, closureRecordId: 1, level: 1 }, { unique: true });

export const Appeal = mongoose.models.appeals || mongoose.model('appeals', appealSchema, 'appeals');
export default Appeal;
