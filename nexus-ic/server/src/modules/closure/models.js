import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * closure_records (SPEC 15.1): caseId, evidenceRefs, proposedBy, approvedBy,
 * gateResults, packetHash. Invariant: approver differs from proposer.
 *
 * A record is never edited after it is closed; appeals add their own records
 * (F16, SPEC 10.3).
 */
const evidenceSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, required: true },
    originalHash: { type: String, required: true },
    scrubbedHash: { type: String, required: true },
  },
  { _id: false }
);

const gateSchema = new Schema(
  {
    tasksComplete: { type: String, required: true },
    transfersAcknowledged: { type: String, required: true },
    evidenceAttached: { type: String, required: true },
    approvalExists: { type: String, required: true },
    passed: { type: Boolean, required: true },
    ruleVersion: { type: String, default: null },
    checkedAt: { type: Date, required: true },
  },
  { _id: false }
);

const closureSchema = new Schema(
  {
    caseId: { type: Schema.Types.ObjectId, required: true, index: true },
    masterCaseId: { type: String, required: true, index: true },
    state: { type: String, enum: ['PROPOSED', 'APPROVED', 'CLOSED', 'WITHDRAWN'], default: 'PROPOSED', index: true },
    closureReason: { type: String, required: true },
    actionRecordIds: { type: [Schema.Types.ObjectId], default: [] },
    evidenceRefs: { type: [evidenceSchema], default: [] },
    proposedBy: { type: String, required: true },
    proposedByRole: { type: String, required: true },
    proposedAt: { type: Date, required: true },
    approvedBy: { type: String, default: null },
    approvedByRole: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    closedBy: { type: String, default: null },
    closedAt: { type: Date, default: null },
    gateResults: { type: [gateSchema], default: [] },
    packetHash: { type: String, required: true },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true, strict: 'throw' }
);

closureSchema.pre('validate', function (next) {
  if (this.approvedBy && this.approvedBy === this.proposedBy) {
    const err = new Error('APPROVER_MUST_DIFFER');
    err.status = 403;
    err.code = 'APPROVER_MUST_DIFFER';
    return next(err);
  }
  next();
});

export const ClosureRecord =
  mongoose.models.closure_records || mongoose.model('closure_records', closureSchema, 'closure_records');
export default ClosureRecord;
