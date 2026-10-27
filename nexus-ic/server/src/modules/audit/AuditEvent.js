import mongoose from 'mongoose';

const auditEventSchema = new mongoose.Schema(
  {
    seq: { type: Number, required: true, unique: true },
    at: { type: Date, required: true, default: Date.now },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    prevHash: { type: String, required: true },
    hash: { type: String, required: true },
  },
  // minimize: false keeps empty meta objects, so the stored event hashes the same as when it was recorded.
  { timestamps: false, minimize: false }
);

const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);
export default AuditEvent;
