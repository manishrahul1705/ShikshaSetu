import mongoose from 'mongoose';
const { Schema } = mongoose;
const vault = new Schema({
  reporterId: { type: String, required: true, unique: true },
  encryptedPayload: { type: String, required: true }, iv: String, tag: String,
  keyRef: { type: String, required: true },
  claimedFingerprint: { type: String },
}, { strict: 'throw' });
vault.index({ claimedFingerprint: 1 }, { unique: true, partialFilterExpression: { claimedFingerprint: { $type: 'string' } } });
export const Vault = mongoose.model('identity_vault', vault, 'identity_vault');
export const Reveal = mongoose.model('identity_reveal_requests', new Schema({
  reporterId: { type: String, required: true }, requesterId: { type: String, required: true },
  requesterRole: String, bureau: String, region: String,
  // Free-text purpose lives in the encrypted identity_vault only.
  purposeRecorded: { type: Boolean, required: true },
  approverId: String, expiresAt: Date,
  state: { type: String, enum: ['pending', 'approved', 'expired'], default: 'pending' },
}, { strict: 'throw', timestamps: true }), 'identity_reveal_requests');
