import mongoose from 'mongoose';
const { Schema } = mongoose;
const model = (name, fields, options = {}) => mongoose.model(name, new Schema(fields, { strict: 'throw', ...options }), name);
export const Reporter = model('reporter_accounts', {
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  pseudonymousReporterId: { type: String, required: true, unique: true, match: /^RP-[A-Z0-9]{4}$/ },
  userType: { type: String, required: true, enum: ['student', 'faculty', 'authorized_user', 'other_stakeholder'] },
  verificationMethod: { type: String, default: null, enum: ['AbcApaarSimulator', 'StaffRegistrySimulator+SsoSimulator', 'SsoSimulator', 'officer_assisted', null] },
  verifiedAt: { type: Date, default: null },
  status: { type: String, enum: ['unverified', 'pending_otp', 'manual_review', 'verified', 'rejected'], default: 'unverified' },
}, { timestamps: true });
export const Otp = model('otp_sink', {
  userId: { type: String, required: true, unique: true }, reporterId: String,
  hash: String, nonce: String, expiresAt: Date, attempts: Number, consumedAt: Date,
});
export const Fraud = model('fraud_signals', {
  reporterId: { type: String, required: true },
  type: { type: String, required: true, enum: ['repeated_registration', 'enrolment_mismatch', 'employment_mismatch', 'burst_submissions', 'shared_device', 'proxy_attempt'] },
  state: { type: String, default: 'pending', enum: ['pending', 'reviewed'] },
}, { timestamps: true });
export const RateBucket = model('identity_rate_buckets', {
  key: { type: String, required: true, unique: true }, count: Number, expiresAt: Date,
});
export const LoginMetric = model('identity_login_metrics', {
  at: { type: Date, default: Date.now }, outcome: { type: String, enum: ['pending', 'succeeded', 'failed'], required: true },
});
export const Device = model('identity_device_signals', {
  digest: { type: String, required: true }, reporterId: { type: String, required: true },
});
Device.schema.index({ digest: 1, reporterId: 1 }, { unique: true });
