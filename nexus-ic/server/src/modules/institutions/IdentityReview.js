import mongoose from 'mongoose';

/**
 * IdentityReview model (N09 touchpoint 3, F02).
 *
 * Identity-review queue for PID/ICID disagreements and ambiguous campuses.
 * Never auto-resolved. Resolving is an audited reviewer action with mandatory reason.
 */
const identityReviewSchema = new mongoose.Schema(
  {
    pid: { type: String, required: true },
    icid: { type: String, default: null },
    conflictType: {
      type: String,
      enum: ['PID_ICID_DISAGREEMENT', 'AMBIGUOUS_CAMPUS'],
      required: true,
    },
    institutionName: { type: String, default: 'Unknown Institution' },
    details: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'RESOLVED'],
      default: 'PENDING',
    },
    resolution: { type: String, default: null },
    resolutionReason: { type: String, default: null },
    resolvedBy: { type: String, default: null },
    resolvedRole: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const IdentityReview = mongoose.model('IdentityReview', identityReviewSchema);

export default IdentityReview;
