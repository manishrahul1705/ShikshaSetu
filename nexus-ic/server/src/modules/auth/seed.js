import User from './User.js';
import logger from '../../config/logger.js';

/**
 * F45 (BLOCKED-SOURCE, hint: demo accounts).
 *
 * Seeds one account per role, two bureaus (Regulation Bureau, Public Grievance
 * Redressal Cell), and one regional office (Northern). All synthetic.
 * All passwords: "demo1234" (hashed with bcrypt).
 */

const DEMO_ACCOUNTS = [
  {
    username: 'student1',
    role: 'student',
    displayName: 'Student Reporter',
    bureau: null,
    region: null,
  },
  {
    username: 'faculty1',
    role: 'faculty',
    displayName: 'Faculty Reporter',
    bureau: null,
    region: null,
  },
  {
    username: 'inst_admin1',
    role: 'institution_admin',
    displayName: 'Institution Administrator',
    bureau: null,
    region: null,
  },
  {
    username: 'rb_officer1',
    role: 'bureau_officer',
    displayName: 'Regulation Bureau Officer',
    bureau: 'Regulation Bureau',
    region: null,
  },
  {
    username: 'pgrc_officer1',
    role: 'bureau_officer',
    displayName: 'Public Grievance Redressal Cell Officer',
    bureau: 'Public Grievance Redressal Cell',
    region: null,
  },
  {
    username: 'regional1',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer',
    bureau: null,
    region: 'Northern',
  },
  {
    username: 'regional_northern',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Northern)',
    bureau: null,
    region: 'Northern',
  },
  {
    username: 'regional_western',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Western)',
    bureau: null,
    region: 'Western',
  },
  {
    username: 'regional_southern',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Southern)',
    bureau: null,
    region: 'Southern',
  },
  {
    username: 'regional_central',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Central)',
    bureau: null,
    region: 'Central',
  },
  {
    username: 'regional_eastern',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (Eastern)',
    bureau: null,
    region: 'Eastern',
  },
  {
    username: 'regional_northeastern',
    role: 'regional_officer',
    displayName: 'Regional Grievance Officer (North Eastern)',
    bureau: null,
    region: 'North Eastern',
  },
  {
    username: 'supervisor1',
    role: 'supervisor',
    displayName: 'Supervisor, Grievance Cell',
    bureau: null,
    region: null,
  },
  {
    username: 'authority1',
    role: 'competent_authority',
    displayName: 'Competent Authority',
    bureau: null,
    region: null,
  },
  {
    username: 'auditor1',
    role: 'auditor',
    displayName: 'Audit Officer',
    bureau: null,
    region: null,
  },
  {
    username: 'sysadmin1',
    role: 'system_admin',
    displayName: 'System Administrator',
    bureau: null,
    region: null,
  },
];

const DEMO_PASSWORD = 'demo1234';

export { DEMO_ACCOUNTS, DEMO_PASSWORD };

export async function seedDemoAccounts() {
  const passwordHash = await User.hashPassword(DEMO_PASSWORD);
  let created = 0;

  for (const account of DEMO_ACCOUNTS) {
    const existing = await User.findOne({ username: account.username });
    if (!existing) {
      await User.create({
        ...account,
        passwordHash,
        synthetic: true,
      });
      created++;
    }
  }

  logger.info({ action: 'seed_complete', created, total: DEMO_ACCOUNTS.length });
  return { created, total: DEMO_ACCOUNTS.length };
}
