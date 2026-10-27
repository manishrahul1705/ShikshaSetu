import mongoose from 'mongoose';

/**
 * Bureau and Cell model (N73, SPEC Appendix W)
 *
 * Configurable organizational units:
 * PGRC, RB, Academic Bureau (AB), Approval Bureau (APB),
 * Skill Education Bureau (SEB), Training and Learning (TL),
 * Regional Offices, and Other Cells.
 */
const bureauSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    isCell: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    headRole: {
      type: String,
      default: 'supervisor',
    },
    synthetic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Bureau = mongoose.model('Bureau', bureauSchema, 'bureaus');
export default Bureau;
