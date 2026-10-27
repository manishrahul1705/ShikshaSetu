/**
 * The only place S5 reads S3 (TRACE, SYNC). S3 is still being built, so every
 * call goes through here; a later S3 change touches this one file.
 *
 * Contract published by S3 (plans/S3.md): hasOpenTransfers(caseId),
 * hasPendingTasks(caseId), and the transfers / tasks collections.
 * If S3 cannot be loaded the answer is UNKNOWN, never "no transfers" (Rule 5).
 */
async function load() {
  try {
    const trace = await import('../trace/index.js');
    const sync = await import('../sync/index.js');
    return { trace, sync };
  } catch {
    return null;
  }
}

export async function transferState(caseDoc) {
  const s3 = await load();
  if (!s3) return { result: 'UNKNOWN', reason: 'TRACE_NOT_AVAILABLE' };
  // Reads the transfers collection directly: S3's hasOpenTransfers() currently
  // throws "mongoose is not defined" (missing import in trace/traceService.js;
  // reported to S3, not edited here).
  const open = await s3.trace.Transfer.countDocuments({ caseId: caseDoc._id, status: 'REQUESTED' });
  return { result: open > 0 ? 'OPEN' : 'ALL_ACKNOWLEDGED' };
}

export async function taskState(caseDoc) {
  const s3 = await load();
  if (!s3) return { result: 'UNKNOWN', reason: 'SYNC_NOT_AVAILABLE' };
  const pending = await s3.sync.hasPendingTasks(caseDoc._id);
  return { result: pending ? 'PENDING' : 'ALL_COMPLETE' };
}

export async function transfersForCase(caseId) {
  const s3 = await load();
  if (!s3) return null;
  return s3.trace.Transfer.find({ caseId }).lean();
}

export async function allTransfers(filter = {}) {
  const s3 = await load();
  if (!s3) return null;
  return s3.trace.Transfer.find(filter).lean();
}

export async function tasksForCase(caseId) {
  const s3 = await load();
  if (!s3) return null;
  return s3.sync.CoordinationTask.find({ caseId }).lean();
}

export async function allTasks(filter = {}) {
  const s3 = await load();
  if (!s3) return null;
  return s3.sync.CoordinationTask.find(filter).lean();
}

export async function queriesModel() {
  try {
    return (await import('../queries/index.js')).Query;
  } catch {
    return null;
  }
}

export async function respondToQuery(user, queryId, body) {
  const queries = await import('../queries/index.js');
  return queries.respondToQuery(user, queryId, body);
}
