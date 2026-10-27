import mongoose from 'mongoose';
import { applyPlugins } from '../../models/plugins.js';

/**
 * Institution model (S1b).
 * Stores the canonical institution profile keyed by PID.
 * Source: SPEC section 6, 15.1.
 */
const institutionSchema = new mongoose.Schema(
  {
    pid: {
      type: String,
      required: true,
      unique: true,
      match: /^1-\d{10}$/,
      index: true,
    },
    name: { type: String, required: true },
    state: { type: String, required: true },
    region: {
      type: String,
      required: true,
      enum: ['Northern', 'Western', 'Southern', 'Central', 'Eastern', 'North Eastern'],
    },
    type: { type: String, required: true },
    approvalStatus: {
      type: String,
      required: true,
      enum: ['approved', 'pending', 'revoked'],
      default: 'pending',
    },
    aliases: [{ type: String }],
    campuses: [
      {
        campusId: { type: String },
        name: { type: String },
        parentPid: { type: String },
        ambiguous: { type: Boolean, default: false },
      },
    ],
    registrySnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    lastRegistryFetch: { type: Date, default: null },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

applyPlugins('Institution', institutionSchema);
const Institution = mongoose.model('Institution', institutionSchema);
export default Institution;
