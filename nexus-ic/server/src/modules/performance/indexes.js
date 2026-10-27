import mongoose from 'mongoose';

/**
 * Extra indexes on collections whose models do not apply schema plugins (S7 scale).
 * Audit lookups by target (case history, RESCUE inactivity, /track status history) and
 * PREVENT action scans by institution. Created once the connection is open; failures are
 * logged by MongoDB and never block a request.
 */
async function create() {
  const db = mongoose.connection.db;
  await Promise.allSettled([
    db.collection('auditevents').createIndex({ targetType: 1, targetId: 1, seq: 1 }),
    db.collection('auditevents').createIndex({ action: 1, seq: 1 }), // ascending, so unsorted finds keep append order
    db.collection('case_actions').createIndex({ institutionPid: 1, at: 1 }),
    db.collection('prevent_action_checks').createIndex({ caseId: 1, result: 1 }),
  ]);
}

export function ensureExtraIndexes() {
  if (mongoose.connection.readyState === 1) return create();
  mongoose.connection.once('open', () => { create().catch(() => {}); });
  return Promise.resolve();
}
