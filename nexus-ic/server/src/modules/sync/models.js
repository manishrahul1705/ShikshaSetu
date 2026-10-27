import mongoose from 'mongoose';

/**
 * Coordination model (SPEC 9.3, N21, N75, Appendix W step 7)
 */
const coordinationSchema = new mongoose.Schema(
  {
    institutionPid: {
      type: String,
      required: true,
      index: true,
    },
    caseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
      },
    ],
    participatingBureaus: {
      type: [String],
      required: true,
    },
    leadBureau: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'AGREED', 'RESOLVED'],
      default: 'OPEN',
      index: true,
    },
    // N75: "Agree on Next Steps (where applicable)"
    agreedNextSteps: {
      agreedBy: [
        {
          officerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          bureau: String,
          role: String,
        },
      ],
      steps: { type: String, default: null },
      agreedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export const Coordination =
  mongoose.models.coordinations || mongoose.model('coordinations', coordinationSchema, 'coordinations');

/**
 * Coordination Task model (SPEC 9.3, N21, DEMO-TASK-v1, DEMO-SYNC-ACK-v1)
 */
const taskSchema = new mongoose.Schema(
  {
    coordinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coordination',
      required: true,
      index: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
      index: true,
    },
    assignedBureau: {
      type: String,
      required: true,
      index: true,
    },
    assignedOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED'],
      default: 'PENDING',
      index: true,
    },
    ackDueAt: {
      type: Date,
      required: true,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    completionDueAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const CoordinationTask =
  mongoose.models.tasks || mongoose.model('tasks', taskSchema, 'tasks');

/**
 * Disclosure Grant model (SPEC 13 S18)
 *
 * Invariant:
 * - Explicit purpose required (400 if missing).
 * - Enforces time-bound expiry on every read.
 * - Supports explicit revocation.
 */
const disclosureGrantSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    granteeBureau: {
      type: String,
      required: true,
      index: true,
    },
    granteeOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    purpose: {
      type: String,
      required: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export const DisclosureGrant =
  mongoose.models.disclosure_grants ||
  mongoose.model('disclosure_grants', disclosureGrantSchema, 'disclosure_grants');

/**
 * Internal Note model (SPEC 13 S24, U23)
 *
 * Invariant: Never disclosed or serialized to complainant or institution admin.
 */
const internalNoteSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      default: null,
    },
    authorBureau: {
      type: String,
      required: true,
    },
    authorRole: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const InternalNote =
  mongoose.models.internal_notes ||
  mongoose.model('internal_notes', internalNoteSchema, 'internal_notes');

/**
 * Communication Log model (SPEC 15.1, N21)
 *
 * Invariant:
 * - Append-only!
 * - Stores only { caseId or coordinationId, from, to, channel, at }.
 * - Zero complaint text, message body, or reporter identity in log (S28).
 */
const communicationLogSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
      index: true,
    },
    coordinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coordination',
      default: null,
      index: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['SYSTEM', 'SYNC', 'EMAIL_NOTICE', 'DISCLOSURE'],
      default: 'SYNC',
    },
    at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

export const CommunicationLog =
  mongoose.models.communication_log ||
  mongoose.model('communication_log', communicationLogSchema, 'communication_log');
