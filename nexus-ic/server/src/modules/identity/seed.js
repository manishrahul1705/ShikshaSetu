import User from '../auth/User.js';
import { start, issueOtp, readInbox, confirmOtp, decideManual } from './service.js';
import { ensureReporter } from './reporters.js';
import { audit, serial } from './support.js';
import { demoMode } from './config.js';
const actor = { id: 'identity-seed', role: 'system' };
export async function seedIdentityReporters() {
  if (!demoMode()) return;
  const reviewer = await User.findOne({ username: 'rb_officer1' });
  const passwordHash = await User.hashPassword('demo1234');
  for (const userType of ['student', 'faculty', 'authorized_user', 'other_stakeholder']) {
    for (const verified of [true, false]) {
      const username = `trust_${userType}_${verified ? 'verified' : 'unverified'}`;
      let user = await User.findOne({ username });
      if (user) continue;
      user = await User.create({ username, passwordHash, role: userType === 'authorized_user' ? 'institution_admin' : userType, displayName: userType === 'student' ? 'Student Reporter' : userType === 'faculty' ? 'Faculty Reporter' : userType === 'authorized_user' ? 'Institution Administrator' : 'Stakeholder Reporter', synthetic: true });
      await serial(async () => {
        await audit(actor, 'identity.seed.account', 'user', user.id);
        const subject = { id: user.id, role: user.role };
        if (!verified) { await ensureReporter(subject, userType); return; }
        const reference = userType === 'student' ? 'STUDENT-SECOND' : userType === 'faculty' ? 'FACULTY-SECOND' : userType === 'other_stakeholder' ? 'MANUAL-OTHER-1' : 'SSO-SECOND';
        const result = await start(subject, { userType, reference, consent: true, subtype: userType === 'other_stakeholder' ? 'citizen' : undefined });
        if (userType === 'other_stakeholder') {
          await decideManual({ id: reviewer.id, role: reviewer.role }, result.reporterId, 'approve', 'Synthetic seed officer review');
        } else {
          await issueOtp(subject, true);
          await confirmOtp(subject, readInbox(subject).entries[0].otp);
        }
      });
    }
  }
  await (await import('./senders.js')).seedSyntheticSenders();
}
