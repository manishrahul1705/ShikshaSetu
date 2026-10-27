import { describe, expect, it, vi } from 'vitest';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDemoAccounts } from '../src/modules/auth/seed.js';
import User from '../src/modules/auth/User.js';

describe('[A-AUTH] demo login accounts', () => {
  it('seeds the credentials exposed by the login presets', async () => {
    const result = await seedDemoAccounts();
    expect(result.total).toBe(DEMO_ACCOUNTS.length);
    const user = await User.findOne({ username: 'sysadmin1', active: true });
    expect(user).not.toBeNull();
    expect(await user.comparePassword(DEMO_PASSWORD)).toBe(true);
  });
});
