import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  reporterId: { type: String, required: true },
  purpose: { type: String, required: true, enum: ['verification', 'otp', 'manual_verification', 'retaliation_watch'] },
  scope: { type: String, required: true, enum: ['student', 'faculty', 'authorized_user', 'other_stakeholder'] },
  grantedAt: { type: Date, required: true, default: Date.now },
  withdrawnAt: { type: Date, default: null },
  withdrawalOf: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { strict: 'throw' });
// Withdrawal appends an event referencing the original immutable grant.
schema.index({ withdrawalOf: 1 }, { unique: true, partialFilterExpression: { withdrawalOf: { $type: 'objectId' } } });
export const Consent = mongoose.model('consent_records', schema, 'consent_records');
