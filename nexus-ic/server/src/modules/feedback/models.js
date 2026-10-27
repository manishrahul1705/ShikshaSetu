import mongoose from 'mongoose';

/**
 * feedback_records (SPEC 15.1): caseId, reporterId, rating, text, at.
 * Invariant: does not change status (N23).
 */
const feedbackSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    reporterId: { type: String, required: true, index: true },
    statusAtFeedback: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '' },
    at: { type: Date, required: true, default: Date.now },
    synthetic: { type: Boolean, default: true },
  },
  { strict: 'throw' }
);

export const FeedbackRecord =
  mongoose.models.feedback_records || mongoose.model('feedback_records', feedbackSchema, 'feedback_records');
export default FeedbackRecord;
