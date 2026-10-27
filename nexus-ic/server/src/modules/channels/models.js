import mongoose from 'mongoose';
const encrypted = { encryptedPayload: { type: String, required: true }, iv: { type: String, required: true }, tag: { type: String, required: true }, keyRef: { type: String, required: true } };
export const EmailDraft = mongoose.model('ChannelEmailDraft', new mongoose.Schema({
  reporterId: { type: String, required: true, index: true },
  channel: { type: String, enum: ['EMAIL'], default: 'EMAIL' },
  languageTag: { type: String, required: true, default: 'en' },
  receivedAt: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ['AWAITING_CONFIRMATION', 'CONFIRMED'], default: 'AWAITING_CONFIRMATION' },
  attachmentsDropped: { type: Boolean, default: false },
  senderHash: { type: String, required: true }, messageHash: { type: String, required: true },
  ...encrypted, state: { type: String, enum: ['DRAFT', 'PREVIEWED', 'CONFIRMED'], default: 'DRAFT' },
  previewHash: String, masterCaseId: String,
}, { timestamps: true, strict: 'throw' }).index({ senderHash: 1, messageHash: 1 }, { unique: true }));
export const EmailOutbox = mongoose.model('ChannelEmailOutbox', new mongoose.Schema({
  senderHash: { type: String, required: true },
  template: { type: String, enum: ['VERIFY_ON_PORTAL'], required: true },
  channel: { type: String, enum: ['EMAIL'], default: 'EMAIL' },
}, { timestamps: true, strict: 'throw' }), 'email_simulator_outbox');
export const ImportBatch = mongoose.model('ChannelImportBatch', new mongoose.Schema({
  reporterId: { type: String }, ownerUserId: { type: String, index: true }, ...encrypted,
  state: { type: String, enum: ['PREVIEW', 'DRY_RUN', 'COMMITTED'], default: 'PREVIEW' },
  quarantined: { type: [Number], default: [] },
}, { timestamps: true, strict: 'throw' }));
