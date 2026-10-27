import mongoose from 'mongoose';

/**
 * Document model (N31, N52, S10, S11, S12).
 *
 * Stores documents encrypted at rest with AES-256-GCM.
 * Original file is sealed with originalHash (viewable only by complainant).
 * Officers and institution admins see the metadata-scrubbed version (N52).
 * Raw storage keys or paths are never stored or exposed to client (S11).
 */
const documentSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
      index: true,
    },
    originalName: { type: String, required: true },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/png', 'image/jpeg'],
    },
    sizeBytes: { type: Number, required: true },
    originalHash: { type: String, required: true },
    scrubbedHash: { type: String, required: true },
    encryptedOriginal: { type: String, required: true },
    originalIv: { type: String, required: true },
    originalTag: { type: String, required: true },
    encryptedScrubbed: { type: String, required: true },
    scrubbedIv: { type: String, required: true },
    scrubbedTag: { type: String, required: true },
    malwareScanStatus: {
      type: String,
      enum: ['clean', 'infected', 'pending', 'error'],
      default: 'clean',
    },
    metadataStripped: { type: Boolean, default: false },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;
