import mongoose from 'mongoose';

/**
 * Region classification (N11).
 * Seeded as DEMO-REGIONS-v1 with 6 AICTE regions.
 * Reclassification requires reviewer + reason.
 */
const regionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    states: [{ type: String }],
    version: { type: String, default: 'DEMO-REGIONS-v1' },
    synthetic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Region = mongoose.model('Region', regionSchema);

/**
 * Seed the 6 AICTE regions (DEMO-REGIONS-v1).
 * Idempotent: skips if already seeded.
 */
export async function seedRegions() {
  const existing = await Region.countDocuments();
  if (existing > 0) return { created: 0 };

  const regions = [
    {
      code: 'Northern',
      name: 'Northern Region',
      states: ['Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir'],
    },
    {
      code: 'Western',
      name: 'Western Region',
      states: ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa'],
    },
    {
      code: 'Southern',
      name: 'Southern Region',
      states: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'],
    },
    {
      code: 'Central',
      name: 'Central Region',
      states: ['Madhya Pradesh', 'Chhattisgarh'],
    },
    {
      code: 'Eastern',
      name: 'Eastern Region',
      states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'],
    },
    {
      code: 'North Eastern',
      name: 'North Eastern Region',
      states: ['Assam', 'Meghalaya', 'Manipur', 'Tripura', 'Nagaland', 'Mizoram', 'Arunachal Pradesh', 'Sikkim'],
    },
  ];

  await Region.insertMany(regions.map((r) => ({ ...r, version: 'DEMO-REGIONS-v1', synthetic: true })));
  return { created: regions.length };
}

export default Region;
