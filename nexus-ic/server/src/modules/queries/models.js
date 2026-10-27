import mongoose from 'mongoose';

/**
 * Query model (Appendix W step W2, N70)
 *
 * Query and response loop between officers, complainant and institution.
 * Every query and reply is logged and timed.
 */
const querySchema = new mongoose.Schema(
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
    senderOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    senderBureau: {
      type: String,
      required: true,
    },
    recipientType: {
      type: String,
      enum: ['complainant', 'institution'],
      required: true,
      index: true,
    },
    queryText: {
      type: String,
      required: true,
    },
    responseText: {
      type: String,
      default: null,
    },
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    responderRole: {
      type: String,
      default: null,
    },
    queriedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RESPONDED'],
      default: 'PENDING',
      index: true,
    },
    documentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
  },
  { timestamps: true }
);

export const Query =
  mongoose.models.queries || mongoose.model('queries', querySchema, 'queries');
export default Query;
