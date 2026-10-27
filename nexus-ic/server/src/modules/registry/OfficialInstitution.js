import mongoose from 'mongoose';

const provenanceSchema = new mongoose.Schema({
  sourceFileName: { type: String, required: true },
  listDate: { type: String, required: true },
  importedAt: { type: Date, required: true },
  importer: { type: String, required: true },
  fileHash: { type: String, required: true },
}, { _id: false });

const officialInstitutionSchema = new mongoose.Schema({
  pid: { type: String, required: true, unique: true, match: /^1-\d{10}$/ },
  icid: { type: String, match: /^IIC-[A-Z0-9]{8}$/ },
  name: { type: String, required: true },
  city: { type: String },
  state: { type: String, required: true },
  district: { type: String },
  region: { type: String },
  type: { type: String },
  // N98: optional columns from the official file; absent when the file has none.
  address: { type: String },
  approvalStatus: { type: String },
  aliases: [{ type: String }],
  programmes: [{ type: String }],
  provenance: { type: provenanceSchema, required: true },
}, { timestamps: true });

export default mongoose.models.OfficialInstitution
  || mongoose.model('OfficialInstitution', officialInstitutionSchema);
