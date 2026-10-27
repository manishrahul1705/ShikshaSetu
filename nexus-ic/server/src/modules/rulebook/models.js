import mongoose from 'mongoose';
import problemStatementRules from '../additions/n88-first-redressal/rulebookPlugin.js';

/**
 * RuleBookVersion model (SPEC Section 11, Section 15.1, N27, N78)
 *
 * Invariant: Immutable once approved.
 * Non-retroactive: takes effect from effectiveFrom.
 * Changes require two-step approval (requestedBy !== approvedBy, S20)
 * and a fixture dry-run.
 */
const ruleBookVersionSchema = new mongoose.Schema(
  {
    family: {
      type: String,
      required: true,
      enum: [
        'JURISDICTION',
        'ROUTING',
        'SLA',
        'TRANSFER',
        'ESCALATION',
        'COORDINATION',
        'RESCUE',
        'OVERLAP_DETECTION',
        'CLOSURE_REQUIREMENTS',
        'SENSITIVITY',
        'APPEAL',
        'ELIGIBILITY',
        'INSIDER',
      ],
      index: true,
    },
    version: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    body: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'deprecated'],
      default: 'draft',
      index: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    dryRunPassed: {
      type: Boolean,
      default: false,
    },
    dryRunAt: {
      type: Date,
      default: null,
    },
    dryRunResults: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    synthetic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for family and version uniqueness
ruleBookVersionSchema.index({ family: 1, version: 1 }, { unique: true });

// Prevent modification once approved (Immutability guarantee)
ruleBookVersionSchema.pre('save', function (next) {
  if (!this.isNew && this.status === 'approved' && !this.isModified('status')) {
    const err = new Error('Cannot modify approved RuleBookVersion');
    err.status = 400;
    return next(err);
  }
  next();
});

ruleBookVersionSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (docToUpdate && docToUpdate.status === 'approved') {
    const update = this.getUpdate();
    // Allow deprecating an approved rule, but never editing body, effectiveFrom, version, or family
    const fields = update.$set || update;
    if (fields.body || fields.version || fields.family || fields.effectiveFrom) {
      const err = new Error('Approved RuleBook versions are immutable and cannot be modified');
      err.status = 400;
      return next(err);
    }
  }
  next();
});

ruleBookVersionSchema.plugin(problemStatementRules);
const RuleBookVersion = mongoose.model('RuleBookVersion', ruleBookVersionSchema, 'rule_book_versions');
export default RuleBookVersion;
