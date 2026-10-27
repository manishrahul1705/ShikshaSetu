import mongoose from 'mongoose';
import { applyPlugins } from '../../models/plugins.js';

/**
 * Case model (N14) — Master Case ID.
 *
 * SPEC Section 6, 7.2:
 * - Single Master Case ID: NX-<year>-<6 digits>, immutable in schema and rejected on update.
 * - externalRefs[] of { sourceSystem, sourceCaseRef } with compound uniqueness.
 * - Stores pidSnapshot and icidSnapshot (N09 touchpoint 5).
 * - narrative stored unmodified; narrativeHash for duplicate check (N14, N67).
 * - languageTag detected locally without translation (N67).
 * - status: SUBMITTED; routing and lifecycle are S2.
 */
const externalRefSchema = new mongoose.Schema(
  {
    sourceSystem: { type: String, required: true },
    sourceCaseRef: { type: String, required: true },
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    masterCaseId: {
      type: String,
      required: true,
      unique: true,
      immutable: true, // Immutable in Mongoose schema
      match: /^NX-\d{4}-\d{6}$/,
      index: true,
    },
    reporterId: {
      type: String,
      required: true,
      index: true,
    },
    institutionPid: {
      type: String,
      required: true,
      match: /^1-\d{10}$/,
      index: true,
    },
    pidSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    institutionIcid: { type: String, default: null },
    icidSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    narrative: { type: String, required: true }, // Unmodified original complaint text
    narrativeHash: { type: String, required: true, index: true },
    languageTag: { type: String, default: 'en' },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal',
    },
    channel: {
      type: String,
      enum: ['web', 'email', 'import'],
      default: 'web',
    },
    status: {
      type: String,
      default: 'SUBMITTED',
    },
    owningBureau: { type: String, default: null },
    routingDecisionId: { type: mongoose.Schema.Types.ObjectId, default: null },
    externalRefs: {
      type: [externalRefSchema],
      default: [],
    },
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    statusHistory: {
      type: [
        {
          status: { type: String },
          at: { type: Date, default: Date.now },
          by: { type: String },
          office: { type: String },
          role: { type: String },
          action: { type: String },
          subject: { type: String },
        },
      ],
      default: [],
    },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique compound index for external references (T09)
caseSchema.index(
  { 'externalRefs.sourceSystem': 1, 'externalRefs.sourceCaseRef': 1 },
  {
    unique: true,
    sparse: true,
  }
);

// Mongoose's immutable flag otherwise silently discards document assignments.
// Record a cast error so save() rejects an attempted change explicitly.
caseSchema.path('masterCaseId').set(function (value) {
  if (this instanceof mongoose.Document && !this.isNew && value !== this.get('masterCaseId')) {
    throw new Error('Master Case ID is immutable and cannot be modified');
  }
  return value;
});

// Prevent updates to masterCaseId at query/update level
caseSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate();
  if (update && (update.masterCaseId || (update.$set && update.$set.masterCaseId))) {
    const err = new Error('Master Case ID is immutable and cannot be modified');
    err.status = 400;
    return next(err);
  }
  next();
});

applyPlugins('Case', caseSchema);

const Case = mongoose.model('Case', caseSchema);
export default Case;
