import mongoose from 'mongoose';
const { Schema } = mongoose;
const model = (name, fields) => mongoose.models[name] || mongoose.model(name, new Schema(fields, { strict: 'throw', timestamps: true }), name);
export const ACTION_TYPES = ['DOCUMENT_REQUEST', 'INSTRUCTION', 'INSPECTION', 'NOTICE', 'OTHER'];
export const CaseAction = model('case_actions', {
  caseId: { type: Schema.Types.ObjectId, required: true, index: true }, institutionPid: { type: String, required: true, index: true },
  bureau: { type: String, required: true }, actorId: { type: String, required: true }, actorRole: { type: String, required: true },
  actionType: { type: String, enum: ACTION_TYPES, required: true }, subjectKey: { type: String, required: true }, at: { type: Date, required: true, default: Date.now },
});
export const SimilarityCheck = model('intake_similarity_checks', {
  draftHash: { type: String, required: true }, reporterId: { type: String, required: true, index: true },
  shownHints: [String], userChoice: { type: String, enum: ['pending', 'continue', 'view', 'cancel'], default: 'pending' },
});
const coSign = new Schema({ caseId: { type: Schema.Types.ObjectId, required: true }, reporterId: { type: String, required: true } }, { strict: 'throw', timestamps: true });
coSign.index({ caseId: 1, reporterId: 1 }, { unique: true });
export const CoSign = mongoose.models.co_signs || mongoose.model('co_signs', coSign, 'co_signs');
export const ActionCheck = model('prevent_action_checks', {
  caseId: { type: Schema.Types.ObjectId, required: true }, actorId: { type: String, required: true }, actionType: { type: String, enum: ACTION_TYPES, required: true },
  subjectKey: String, result: { type: String, enum: ['CLEAR', 'REVIEW', 'UNKNOWN'] }, proceededAt: Date, actionId: Schema.Types.ObjectId,
});
export const PreventAlert = model('prevent_alerts', {
  caseId: { type: Schema.Types.ObjectId, required: true }, checkId: { type: Schema.Types.ObjectId, required: true },
  recipientId: { type: String, required: true }, result: { type: String, enum: ['REVIEW', 'UNKNOWN'] }, reasons: [String],
});
