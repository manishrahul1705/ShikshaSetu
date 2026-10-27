import Bureau from './models.js';
import User from '../auth/User.js';
import { DEMO_PASSWORD } from '../auth/seed.js';

export const SEED_BUREAUS = [
  {
    code: 'PGRC',
    name: 'Public Grievance Redressal Cell',
    shortName: 'PGRC',
    description: 'Handles public grievances received from students, faculty and stakeholders',
    isCell: true,
  },
  {
    code: 'RB',
    name: 'Regulation Bureau',
    shortName: 'RB',
    description: 'Handles regulatory matters, technical scrutiny, and compliance',
    isCell: false,
  },
  {
    code: 'AB',
    name: 'Academic Bureau',
    shortName: 'AB',
    description: 'Handles academic grievances, examination malpractice, and curriculum',
    isCell: false,
  },
  {
    code: 'APB',
    name: 'Approval Process Bureau',
    shortName: 'APB',
    description: 'Handles institutional approvals, intake quota, and affiliation matters',
    isCell: false,
  },
  {
    code: 'SEB',
    name: 'Skill Education Bureau',
    shortName: 'SEB',
    description: 'Handles vocational education, internships, and skill training programs',
    isCell: false,
  },
  {
    code: 'TL',
    name: 'Training and Learning',
    shortName: 'TL',
    description: 'Handles faculty development programs, quality initiatives, and pedagogy',
    isCell: false,
  },
  {
    code: 'RO',
    name: 'Regional Offices',
    shortName: 'RO',
    description: 'Six regional offices supporting inspections and regional follow-up',
    isCell: false,
  },
  {
    code: 'OTHER',
    name: 'Other Cell',
    shortName: 'OTHER',
    description: 'Special purpose and ad-hoc committees or cells',
    isCell: true,
  },
];

const EXTRA_DEMO_OFFICERS = [
  {
    username: 'ab_officer1',
    role: 'bureau_officer',
    displayName: 'Academic Bureau Officer',
    bureau: 'AB',
  },
  {
    username: 'apb_officer1',
    role: 'bureau_officer',
    displayName: 'Approval Bureau Officer',
    bureau: 'APB',
  },
  {
    username: 'seb_officer1',
    role: 'bureau_officer',
    displayName: 'SEB Officer',
    bureau: 'SEB',
  },
  {
    username: 'tl_officer1',
    role: 'bureau_officer',
    displayName: 'TL Officer',
    bureau: 'TL',
  },
];

/**
 * Seed N73 bureaus, cells, and seed officers
 */
export async function seedBureaus() {
  for (const b of SEED_BUREAUS) {
    await Bureau.findOneAndUpdate(
      { code: b.code },
      { $set: { ...b, active: true, synthetic: true } },
      { upsert: true, new: true }
    );
  }

  const passwordHash = await User.hashPassword(DEMO_PASSWORD);

  for (const officer of EXTRA_DEMO_OFFICERS) {
    const existing = await User.findOne({ username: officer.username });
    if (!existing) {
      await User.create({
        ...officer,
        passwordHash,
        synthetic: true,
      });
    }
  }
}
