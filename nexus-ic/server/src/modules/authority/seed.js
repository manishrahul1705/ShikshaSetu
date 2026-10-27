import User from '../auth/User.js';
import Institution from '../institutions/Institution.js';
import { DEMO_PASSWORD } from '../auth/seed.js';
import logger from '../../config/logger.js';

/**
 * S5 demo seed (synthetic only).
 * - N80: Competent Authority members, one per designation in roles.png.
 * - N30: links the demo institution admins to the first seeded synthetic institution.
 */
const MEMBERS = [
  { username: 'authority1', designation: 'Authorized Senior Official' },
  { username: 'authority_chair1', designation: 'Chairperson', displayName: 'Chairperson, Competent Authority' },
  { username: 'authority_ms1', designation: 'Member Secretary', displayName: 'Member Secretary, Competent Authority' },
];

export async function seedS5() {
  const passwordHash = await User.hashPassword(DEMO_PASSWORD);
  for (const m of MEMBERS) {
    const existing = await User.findOne({ username: m.username });
    if (existing) {
      if (existing.role === 'competent_authority' && !existing.authorityDesignation) {
        existing.authorityDesignation = m.designation;
        await existing.save();
      }
      continue;
    }
    await User.create({ username: m.username, passwordHash, role: 'competent_authority', displayName: m.displayName, authorityDesignation: m.designation, synthetic: true });
  }

  const institution = await Institution.findOne({}).sort({ pid: 1 }).select('pid').lean();
  if (institution) {
    await User.updateMany(
      { username: { $in: ['inst_admin1', 'trust_authorized_user_verified'] }, role: 'institution_admin', institutionPid: null },
      { $set: { institutionPid: institution.pid } }
    );
  }
  logger.info({ action: 'seed_s5_complete', members: MEMBERS.length, institutionLinked: !!institution });
}
