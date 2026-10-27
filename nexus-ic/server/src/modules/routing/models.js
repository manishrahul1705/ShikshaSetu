import mongoose from 'mongoose';

/**
 * RoutingDecision model (SPEC Section 8.1, Section 15.1, N18, U16, U17)
 *
 * Invariant: Immutable.
 * Each routing decision record stores:
 * caseId, primary, secondary, confidence, reasons, ruleVersion,
 * overriddenBy, reason, previousDecisionId.
 */
const routingDecisionSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    masterCaseId: {
      type: String,
      required: true,
      index: true,
    },
    primary: {
      type: String,
      required: true,
    },
    secondary: {
      type: String,
      default: null,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    reasons: {
      type: [String],
      required: true,
    },
    ruleVersion: {
      type: String,
      required: true,
    },
    isManualReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reason: {
      type: String,
      default: null,
      get: function (val) {
        if (val) return val;
        return this.reasons && this.reasons.length ? this.reasons.join('; ') : '';
      },
    },
    previousDecisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoutingDecision',
      default: null,
    },
    factors: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    synthetic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
  }
);

routingDecisionSchema.virtual('primaryBureau').get(function () {
  return this.primary;
});

routingDecisionSchema.virtual('secondaryBureau').get(function () {
  return this.secondary;
});

// Immutability: Prevent modification of existing routing decision records
routingDecisionSchema.pre('save', function (next) {
  if (!this.isNew) {
    const err = new Error('RoutingDecision records are immutable and cannot be updated');
    err.status = 400;
    return next(err);
  }
  next();
});

routingDecisionSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function (next) {
  const err = new Error('RoutingDecision records are immutable and cannot be updated');
  err.status = 400;
  return next(err);
});

const RoutingDecision = mongoose.model('RoutingDecision', routingDecisionSchema, 'routing_decisions');
export default RoutingDecision;
