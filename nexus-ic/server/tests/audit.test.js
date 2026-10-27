import { describe, it, expect, beforeEach } from 'vitest';
import { record, verifyChain, computeHash } from '../src/modules/audit/audit.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';

describe('[S09] Tamper-evident audit log (hash chain)', () => {
  it('[S09] chain verifies after 50 events', async () => {
    // Record 50 events
    for (let i = 0; i < 50; i++) {
      await record({
        actorId: `actor-${i}`,
        actorRole: 'system_admin',
        action: `test.action.${i}`,
        targetType: 'test',
        targetId: `target-${i}`,
        meta: { index: i },
      });
    }

    const result = await verifyChain();
    expect(result.intact).toBe(true);
    expect(result.count).toBe(50);
  });

  it('[S09] editing one stored event makes verify report that seq', async () => {
    // Record 10 events
    for (let i = 0; i < 10; i++) {
      await record({
        actorId: `actor-${i}`,
        actorRole: 'system_admin',
        action: `test.action.${i}`,
        targetType: 'test',
        targetId: `target-${i}`,
        meta: { index: i },
      });
    }

    // Verify chain is intact first
    let result = await verifyChain();
    expect(result.intact).toBe(true);

    // Tamper with event at seq 5
    await AuditEvent.updateOne({ seq: 5 }, { $set: { action: 'tampered.action' } });

    // Verify should report the broken seq
    result = await verifyChain();
    expect(result.intact).toBe(false);
    expect(result.brokenSeq).toBe(5);
  });

  it('[S09] hash computation is deterministic', () => {
    const eventData = {
      seq: 1,
      at: new Date('2026-01-01T00:00:00Z'),
      actorId: 'actor1',
      actorRole: 'admin',
      action: 'test',
      targetType: 'test',
      targetId: 'target1',
      meta: {},
    };
    const prevHash = '0'.repeat(64);
    const hash1 = computeHash(eventData, prevHash);
    const hash2 = computeHash(eventData, prevHash);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('[S09] chain stays intact with empty meta and concurrent records', async () => {
    await record({ actorId: 'a', actorRole: 'system_admin', action: 'test.empty', targetType: 'test', targetId: 't' });
    await record({ actorId: 'a', actorRole: 'system_admin', action: 'test.empty.obj', targetType: 'test', targetId: 't', meta: {} });
    await record({ actorId: 'a', actorRole: 'system_admin', action: 'test.nested', targetType: 'test', targetId: 't', meta: { inner: {}, skip: undefined } });
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        record({ actorId: `c-${i}`, actorRole: 'system_admin', action: 'test.concurrent', targetType: 'test', targetId: `t-${i}`, meta: {} })
      )
    );

    const result = await verifyChain();
    expect(result.intact).toBe(true);
    expect(result.count).toBe(23);
  });
});
