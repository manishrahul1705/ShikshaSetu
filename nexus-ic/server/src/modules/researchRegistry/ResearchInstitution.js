import mongoose from 'mongoose';

// Supplied public research metadata only. Never a synthetic complaint target.
const schema = new mongoose.Schema({
  sourceKey: { type: String, unique: true, required: true },
  pid: { type: String, default: null }, icid: { type: String, default: null },
  name: { type: String, required: true }, state: { type: String, default: null },
  city: String, district: String, address: String, type: String, region: String,
  regionReason: String, approvalStatus: String, academicYear: String,
  aliases: [String], programmes: [String], pickerTokens: [String],
  pidFormat: String, missingReasons: mongoose.Schema.Types.Mixed,
  raw: mongoose.Schema.Types.Mixed, provenance: mongoose.Schema.Types.Mixed,
  courses: [mongoose.Schema.Types.Mixed], nameVariations: [mongoose.Schema.Types.Mixed],
  duplicateReview: [mongoose.Schema.Types.Mixed],
}, { timestamps: true, collection: 'research_institutions' });
schema.index({ pid: 1 }, { unique: true, partialFilterExpression: { pid: { $type: 'string' } } });
schema.index({ pickerTokens: 1 });
schema.index({ state: 1, name: 1 });
schema.index({ region: 1, name: 1 });
export default mongoose.models.ResearchInstitution || mongoose.model('ResearchInstitution', schema);
