import crypto from 'node:crypto';
import Case from '../cases/Case.js';
import { generateMasterCaseId } from '../cases/caseService.js';
import { recordAudit } from '../audit/audit.js';

/**
 * S29, F15, F49 Idempotent External Case Import Engine
 *
 * Implements:
 * - Preview and dry-run validation (F15)
 * - Idempotent commit keyed by compound (sourceSystem, sourceCaseRef) (F49, S29)
 * - Safe replay: replaying identical imports creates 0 new duplicates (S29)
 */

export async function validateImportBatch(records) {
  const errors = [];
  const valid = [];
  const seenRefs = new Set();

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const index = i + 1;

    if (!row.institutionPid) {
      errors.push({ row: index, error: 'Missing institutionPid' });
      continue;
    }
    if (!row.category) {
      errors.push({ row: index, error: 'Missing category' });
      continue;
    }
    if (!row.narrative) {
      errors.push({ row: index, error: 'Missing narrative' });
      continue;
    }
    if (!row.sourceSystem || !row.sourceCaseRef) {
      errors.push({ row: index, error: 'Missing external reference (sourceSystem and sourceCaseRef required)' });
      continue;
    }

    const key = `${row.sourceSystem}:${row.sourceCaseRef}`;
    if (seenRefs.has(key)) {
      errors.push({ row: index, error: `Duplicate external reference in batch: ${key}` });
      continue;
    }
    seenRefs.add(key);

    valid.push(row);
  }

  return {
    total: records.length,
    validCount: valid.length,
    errorCount: errors.length,
    errors,
    valid,
  };
}

export async function dryRunImport(records) {
  const batchValidation = await validateImportBatch(records);
  const potentialDuplicates = [];
  const readyToImport = [];

  for (const row of batchValidation.valid) {
    const existing = await Case.findOne({
      'externalRefs.sourceSystem': row.sourceSystem,
      'externalRefs.sourceCaseRef': row.sourceCaseRef,
    });

    if (existing) {
      potentialDuplicates.push({
        sourceSystem: row.sourceSystem,
        sourceCaseRef: row.sourceCaseRef,
        existingMasterCaseId: existing.masterCaseId,
      });
    } else {
      readyToImport.push(row);
    }
  }

  return {
    dryRun: true,
    totalRecords: records.length,
    validRecords: batchValidation.validCount,
    readyToImportCount: readyToImport.length,
    duplicateCount: potentialDuplicates.length,
    errors: batchValidation.errors,
    duplicates: potentialDuplicates,
  };
}

export async function commitImport(records, actor) {
  const dryRunRes = await dryRunImport(records);
  if (dryRunRes.errors.length > 0) {
    const err = new Error(`Import validation failed with ${dryRunRes.errors.length} errors`);
    err.status = 400;
    err.details = dryRunRes.errors;
    throw err;
  }

  const created = [];
  const skippedDuplicates = [];

  for (const row of records) {
    // Check if externalRef exists (idempotency key)
    const existing = await Case.findOne({
      'externalRefs.sourceSystem': row.sourceSystem,
      'externalRefs.sourceCaseRef': row.sourceCaseRef,
    });

    if (existing) {
      skippedDuplicates.push({
        sourceSystem: row.sourceSystem,
        sourceCaseRef: row.sourceCaseRef,
        masterCaseId: existing.masterCaseId,
      });
      continue;
    }

    const masterCaseId = await generateMasterCaseId(2026);
    const newCase = await Case.create({
      masterCaseId,
      reporterId: row.reporterId || 'external-importer',
      institutionPid: row.institutionPid,
      pidSnapshot: { pid: row.institutionPid, name: row.institutionName || 'Imported Institution' },
      category: row.category,
      subCategory: row.subCategory || 'General',
      narrative: row.narrative,
      narrativeHash: crypto.createHash('sha256').update(row.narrative.trim(), 'utf8').digest('hex'),
      priority: row.priority || 'normal',
      channel: 'import',
      status: 'SUBMITTED',
      externalRefs: [
        {
          sourceSystem: row.sourceSystem,
          sourceCaseRef: row.sourceCaseRef,
          url: row.url || null,
        },
      ],
      synthetic: true,
    });

    created.push(newCase);
  }

  await recordAudit({
    actorId: String(actor?._id || actor?.id || 'import_system'),
    actorRole: actor?.role || 'system_admin',
    action: 'case.import.committed',
    targetType: 'CaseBatch',
    targetId: `batch_${Date.now()}`,
    meta: {
      total: records.length,
      createdCount: created.length,
      skippedCount: skippedDuplicates.length,
    },
  });

  return {
    success: true,
    createdCount: created.length,
    skippedCount: skippedDuplicates.length,
    createdMasterCaseIds: created.map((c) => c.masterCaseId),
    skippedDuplicates,
  };
}
