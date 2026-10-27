import mongoose from 'mongoose';

/**
 * FieldVisit model (Appendix W step W2, N74)
 *
 * Regional Office field verification: arrange inspections / site verification,
 * provide regional inputs and reports, and link encrypted field documents.
 */
const fieldVisitSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    institutionPid: {
      type: String,
      required: true,
      index: true,
    },
    regionalOffice: {
      type: String,
      required: true,
      index: true,
    },
    inspectorOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inspectorName: {
      type: String,
      default: null,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    siteReport: {
      type: String,
      default: null,
    },
    regionalInputs: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'CONDUCTED', 'REPORT_SUBMITTED'],
      default: 'SCHEDULED',
      index: true,
    },
    documentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
  },
  { timestamps: true }
);

export const FieldVisit =
  mongoose.models.field_visits || mongoose.model('field_visits', fieldVisitSchema, 'field_visits');
export default FieldVisit;
