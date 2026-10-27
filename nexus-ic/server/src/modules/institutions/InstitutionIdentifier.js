import mongoose from 'mongoose';

/**
 * IIC ID (ICID) ↔ PID mapping (N09).
 *
 * SPEC Section 3, Hard Rules:
 * 1. PID is authoritative key — ICID never overrides PID.
 * 2. ICID maps to PID; mismatch → IDENTITY_REVIEW.
 * 3. An institution can have multiple ICIDs (aliases).
 * 4. A missing ICID shows "not available" and does not block complaint.
 */
const identifierSchema = new mongoose.Schema(
  {
    icid: {
      type: String,
      required: true,
      unique: true,
      match: /^IIC-[A-Z0-9]{8}$/,
      index: true,
    },
    pid: {
      type: String,
      required: true,
      match: /^1-\d{10}$/,
      index: true,
    },
    source: { type: String, default: 'registry' },
    verifiedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'disputed', 'revoked'],
      default: 'active',
    },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const InstitutionIdentifier = mongoose.model('InstitutionIdentifier', identifierSchema);
export default InstitutionIdentifier;
