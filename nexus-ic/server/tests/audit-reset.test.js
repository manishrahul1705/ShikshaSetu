import { afterEach, expect, it, vi } from 'vitest';
import { recordAudit, resetDemoAuditChain, verifyChain } from '../src/modules/audit/audit.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';

afterEach(() => vi.restoreAllMocks());

it('[S09] a demo reset waits for an in-flight append and starts a valid new chain', async () => {
  let releaseAppend, signalAppend;
  const blocked = new Promise(resolve => { releaseAppend = resolve; });
  const started = new Promise(resolve => { signalAppend = resolve; });
  const originalCreate = AuditEvent.create.bind(AuditEvent);
  vi.spyOn(AuditEvent, 'create').mockImplementationOnce(async (...args) => {
    signalAppend();
    await blocked;
    return originalCreate(...args);
  });
  const params = { actorId: 'reset-regression', actorRole: 'system', targetType: 'Test', targetId: 'queue' };
  const before = recordAudit({ ...params, action: 'test.before_reset' });
  await started;
  const reset = resetDemoAuditChain();
  const after = recordAudit({ ...params, action: 'test.after_reset' });
  releaseAppend();
  await Promise.all([before, reset, after]);
  expect(await verifyChain()).toEqual({ intact: true, count: 1 });
  expect(await AuditEvent.findOne().lean()).toMatchObject({ seq: 1, action: 'test.after_reset', prevHash: '0'.repeat(64) });
});

it('[S09] production mode refuses a demo audit reset without removing events', async () => {
  await recordAudit({ actorId: 'reset-regression', actorRole: 'system', action: 'test.keep', targetType: 'Test', targetId: 'production' });
  const previousMode = process.env.APP_MODE;
  try {
    process.env.APP_MODE = 'production';
    await expect(resetDemoAuditChain()).rejects.toThrow('DEMO_DATABASE_REQUIRED');
  } finally { process.env.APP_MODE = previousMode; }
  expect(await verifyChain()).toEqual({ intact: true, count: 1 });
});
