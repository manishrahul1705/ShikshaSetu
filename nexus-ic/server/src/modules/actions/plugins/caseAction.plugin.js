import mongoose from 'mongoose';

/**
 * CaseAction Schema Plugin (N72, SPEC 9.4)
 *
 * Extends S4's case_actions model with role-specific action details:
 * - actionSubtype: preliminary scrutiny, regulatory review, etc.
 * - remark: officer remarks
 * - evidenceRefs: supporting document references
 */
export default function caseActionPlugin(schema) {
  schema.add({
    actionSubtype: {
      type: String,
      enum: [
        'PRELIMINARY_SCRUTINY',
        'REGULATORY_REVIEW',
        'EXPERT_VISIT_RECOMMENDED',
        'JURISDICTION_ACTION',
        'RECOMMEND_TRANSFER',
        'RECOMMEND_ESCALATION',
        'RECOMMEND_CLOSURE',
        'FIELD_INSPECTION',
        'OTHER',
      ],
      default: 'OTHER',
    },
    remark: {
      type: String,
      default: null,
    },
    evidenceRefs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
  });
}
