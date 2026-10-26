import RuleBookVersion from '../../rulebook/models.js';
import { createDraftVersion, runDryRun, approveVersion } from '../../rulebook/rulebookService.js';
import User from '../../auth/User.js';
import './service.js';
// Manish delegated this configurable synthetic value on 28 October 2026.
// It is not an AICTE deadline and is excluded by RuleBook in production mode.
export async function seedReminderRule() {
  if (process.env.APP_MODE === 'production') return;
  if (await RuleBookVersion.exists({ family: 'PENDING_REMINDER', version: 'DEMO-REMINDER-v1' })) return;
  const admin = await User.findOne({ username: 'sysadmin1' }), supervisor = await User.findOne({ username: 'supervisor1' });
  if (!admin || !supervisor) return;
  const draft = await createDraftVersion({ family: 'PENDING_REMINDER', version: 'DEMO-REMINDER-v1', description: 'Synthetic pending-case reminder; not from source; replace with AICTE policy', body: { idleDays: 7, _comment: 'Synthetic demonstration parameter delegated by Manish; not an official AICTE timeline' }, effectiveFrom: '2026-01-01', user: admin });
  await runDryRun(draft._id, admin);
  await approveVersion(draft._id, supervisor);
}
