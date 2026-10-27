import mongoose from 'mongoose';
import { DEMO_CATEGORIES } from './config.js';

/**
 * CategoryMaster model (N79, DEMO-CATEGORIES-v1).
 * Versioned reference table for categories and subcategories.
 */
const categoryMasterSchema = new mongoose.Schema(
  {
    version: { type: String, required: true },
    categories: [
      {
        name: { type: String, required: true },
        subCategories: [{ type: String }],
        sensitive: { type: Boolean, default: false },
      },
    ],
    updatedReason: { type: String, default: null },
    updatedBy: { type: String, default: null },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CategoryMaster = mongoose.model('CategoryMaster', categoryMasterSchema);

export async function getActiveCategories() {
  const latest = await CategoryMaster.findOne().sort({ createdAt: -1 }).lean();
  if (latest) return latest;
  return {
    version: DEMO_CATEGORIES.version,
    categories: DEMO_CATEGORIES.categories,
    synthetic: true,
  };
}

export default CategoryMaster;
