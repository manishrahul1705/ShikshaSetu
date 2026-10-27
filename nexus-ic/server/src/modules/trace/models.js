import mongoose from 'mongoose';
import workloadTransfer from '../additions/n89-workload/transferPlugin.js';

/**
 * Transfer model (SPEC 9.2, N20, Appendix V Layer 6)
 *
 * Enforces:
 * 1. Master Case ID unchanged.
 * 2. Every transfer acknowledged by receiving bureau.
 * 3. Exact accountability: sender remains accountable during open transfer.
 * 4. Automatic escalation after 2 business days (DEMO-TRANSFER-ACK-v1).
 * 5. Full timestamped audit history.
 * 6. Rejection returns case to sender queue with mandatory reason.
 */
const transferSchema = new mongoose.Schema(
  {
    masterCaseId: {
      type: String,
      required: true,
      match: /^NX-\d{4}-\d{6}$/,
      index: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    fromBureau: {
      type: String,
      required: true,
    },
    toBureau: {
      type: String,
      required: true,
    },
    senderOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      default: null,
    },
    receiverOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    receiverName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'ACCEPTED', 'REJECTED'],
      default: 'REQUESTED',
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    escalationRecipients: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

transferSchema.plugin(workloadTransfer);
export const Transfer =
  mongoose.models.transfers || mongoose.model('transfers', transferSchema, 'transfers');
export default Transfer;
