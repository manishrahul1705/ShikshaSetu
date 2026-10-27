import mongoose from 'mongoose';

/**
 * Insider Alert model (ADDITIONS.md N54)
 *
 * Invariant: Warning only; never blocks an officer.
 * Flags bulk case opening, out-of-scope searches, unusual exports,
 * and repeated reveal requests to the supervisor.
 */
const insiderAlertSchema = new mongoose.Schema(
  {
    officerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    officerName: {
      type: String,
      default: null,
    },
    alertType: {
      type: String,
      enum: [
        'BULK_CASE_ACCESS',
        'OUT_OF_SCOPE_SEARCH',
        'UNUSUAL_EXPORT',
        'REPEATED_REVEAL_REQUESTS',
      ],
      required: true,
      index: true,
    },
    ruleVersion: {
      type: String,
      required: true,
      default: 'DEMO-INSIDER-v1',
    },
    count: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    details: {
      type: String,
      default: '',
    },
    alertedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVIEWED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

export const InsiderAlert =
  mongoose.models.insider_alerts ||
  mongoose.model('insider_alerts', insiderAlertSchema, 'insider_alerts');
export default InsiderAlert;
