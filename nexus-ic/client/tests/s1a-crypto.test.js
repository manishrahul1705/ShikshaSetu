// @vitest-environment node
// Database-independent checks of the same server modules used by the API.
import { it, expect, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { seal, open, fingerprint } from '../../server/src/modules/vault/crypto.js';
import { AbcApaarSimulator, StaffRegistrySimulator, SsoSimulator, manualIdentity } from '../../server/src/modules/identity/simulators.js';
import { Reporter } from '../../server/src/modules/identity/models.js';
import { toOfficerView } from '../../server/src/modules/identity/reporters.js';
import User from '../../server/src/modules/auth/User.js';
beforeEach(() => { process.env.VAULT_KEY = crypto.randomBytes(32).toString('hex'); });
it('[S07] server AES-256-GCM hides plaintext, randomizes ciphertext and authenticates reporter scope', () => {
  const identity = { name: 'Synthetic Secret', personRef: 'DEMO-1' };
  const first = seal(identity, 'RP-7K2Q'), second = seal(identity, 'RP-7K2Q');
  expect(first.encryptedPayload).not.toContain('Synthetic Secret'); expect(first.encryptedPayload).not.toBe(second.encryptedPayload);
  expect(open(first, 'RP-7K2Q')).toEqual(identity);
  expect(() => open(first, 'RP-9999')).toThrow();
  expect(() => open({ ...first, tag: Buffer.alloc(16).toString('base64') }, 'RP-7K2Q')).toThrow();
});
it('[S07] missing or invalid keys have no plaintext or default-key fallback', () => {
  delete process.env.VAULT_KEY; expect(() => seal({ name: 'Secret' }, 'RP-7K2Q')).toThrow('VAULT_KEY_NOT_CONFIGURED');
  process.env.VAULT_KEY = 'invalid'; expect(() => fingerprint('Secret')).toThrow('VAULT_KEY_NOT_CONFIGURED');
});
it('[N01] enrolment evidence is explicit and unknown references are refused', () => {
  expect(AbcApaarSimulator.verify('STUDENT-ACTIVE').currentEnrolment).toBe(true);
  expect(AbcApaarSimulator.verify('STUDENT-INACTIVE').currentEnrolment).toBe(false);
  expect(AbcApaarSimulator.verify('made-up')).toBeNull();
});
it('[N02] employment and SSO simulator evidence cannot be replaced by an arbitrary reference', () => {
  expect(StaffRegistrySimulator.verify('FACULTY-INACTIVE').currentEmployment).toBe(false);
  expect(StaffRegistrySimulator.verify('made-up')).toBeNull();
  expect(SsoSimulator.verify('SSO-ACTIVE', 'student')).toBeNull();
  expect(SsoSimulator.verify('SSO-ACTIVE', 'institution_admin').authorizedRepresentative).toBe(true);
});
it('[N68] manual fixture identity stays stable across accounts for anti-proxy claims', () => {
  expect(manualIdentity('MANUAL-PERSON-1', 'parent').personRef).toBe(manualIdentity('MANUAL-PERSON-1', 'citizen').personRef);
  expect(manualIdentity('made-up', 'citizen')).toBeNull();
});
it('[S04] reporter model rejects raw identity fields and user extension preserves S0 role catalogue', () => {
  expect(() => new Reporter({ userId: '0123456789abcdef01234567', pseudonymousReporterId: 'RP-7K2Q', userType: 'student', name: 'Secret' })).toThrow();
  expect(User.ROLES).toHaveLength(9);
  expect(User.schema.path('role').enumValues).toContain('other_stakeholder');
});
it('[S06] export serializer cannot pass through unknown fields or vault material', () => {
  expect(toOfficerView({ reporterId: 'RP-7K2Q', status: 'verified', name: 'Secret', iv: 'Secret', tag: 'Secret', encryptedPayload: 'Secret' })).toEqual({ reporterId: 'RP-7K2Q', status: 'verified' });
});
