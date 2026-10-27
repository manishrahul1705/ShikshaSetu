import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import Case from '../src/modules/cases/Case.js';
import {
  validateImportBatch,
  dryRunImport,
  commitImport,
} from '../src/modules/lifecycle/importEngine.js';

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
});

describe('S2: External Imports & Idempotent Commit Engine (F15, F49)', () => {
  it('[F15] import preview and dry-run validate externalRefs', async () => {
    // 1. Invalid batch with missing fields and duplicate externalRef in batch
    const rawBatch = [
      {
        institutionPid: '1-1000000001',
        category: 'Discipline',
        narrative: 'Valid incident 1',
        sourceSystem: 'STATE_PORTAL',
        sourceCaseRef: 'STATE-001',
      },
      {
        institutionPid: '1-1000000001',
        category: 'Discipline',
        narrative: 'Duplicate in batch',
        sourceSystem: 'STATE_PORTAL',
        sourceCaseRef: 'STATE-001', // duplicate
      },
      {
        institutionPid: '1-1000000001',
        category: 'Discipline',
        // missing narrative
        sourceSystem: 'STATE_PORTAL',
        sourceCaseRef: 'STATE-002',
      },
    ];

    const validation = await validateImportBatch(rawBatch);
    expect(validation.total).toBe(3);
    expect(validation.validCount).toBe(1);
    expect(validation.errorCount).toBe(2);

    // 2. Dry run against DB
    // Seed an existing case with STATE_PORTAL:EXISTING-100
    await Case.create({
      masterCaseId: 'NX-2026-000015',
      reporterId: 'reporter_f15',
      institutionPid: '1-1000000001',
      category: 'Discipline',
      subCategory: 'General',
      narrative: 'Existing incident',
      narrativeHash: 'hash_f15_001',
      status: 'SUBMITTED',
      externalRefs: [{ sourceSystem: 'STATE_PORTAL', sourceCaseRef: 'EXISTING-100' }],
      synthetic: true,
    });

    const dryRunBatch = [
      {
        institutionPid: '1-1000000001',
        category: 'Discipline',
        narrative: 'Incident to import',
        sourceSystem: 'STATE_PORTAL',
        sourceCaseRef: 'STATE-999',
      },
      {
        institutionPid: '1-1000000001',
        category: 'Discipline',
        narrative: 'Collision incident',
        sourceSystem: 'STATE_PORTAL',
        sourceCaseRef: 'EXISTING-100',
      },
    ];

    const dryRunRes = await dryRunImport(dryRunBatch);
    expect(dryRunRes.dryRun).toBe(true);
    expect(dryRunRes.readyToImportCount).toBe(1);
    expect(dryRunRes.duplicateCount).toBe(1);
    expect(dryRunRes.duplicates[0].sourceCaseRef).toBe('EXISTING-100');
  });

  it('[F49] import idempotent commit rejects duplicate externalRef', async () => {
    const records = [
      {
        institutionPid: '1-1000000001',
        category: 'Infrastructure',
        narrative: 'Campus facilities breakdown',
        sourceSystem: 'REGIONAL_HELPLINE',
        sourceCaseRef: 'HELP-777',
      },
    ];

    const actor = { username: 'sysadmin1', role: 'system_admin' };

    // Initial commit succeeds
    const res1 = await commitImport(records, actor);
    expect(res1.success).toBe(true);
    expect(res1.createdCount).toBe(1);
    expect(res1.skippedCount).toBe(0);

    // Second commit of the same external reference safely skips duplicate creation
    const res2 = await commitImport(records, actor);
    expect(res2.success).toBe(true);
    expect(res2.createdCount).toBe(0);
    expect(res2.skippedCount).toBe(1);

    // Total cases in DB for this external reference is exactly 1
    const count = await Case.countDocuments({
      'externalRefs.sourceSystem': 'REGIONAL_HELPLINE',
      'externalRefs.sourceCaseRef': 'HELP-777',
    });
    expect(count).toBe(1);
  });
});
