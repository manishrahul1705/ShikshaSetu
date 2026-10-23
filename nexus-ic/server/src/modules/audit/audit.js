import crypto from 'crypto';
import AuditEvent from './AuditEvent.js';
import logger from '../../config/logger.js';

/**
 * S09: Tamper-evident audit log with hash chain.
 *
 * hash = SHA-256( canonical JSON of { seq, at, actorId, actorRole, action, targetType, targetId, meta } + prevHash )
 *
 * No complainant text (narrative, description, name, email, phone, enrolment, identityPayload)
 * is ever stored in meta (S28). The caller is responsible for not passing those fields.
 */

/**
 * Compute SHA-256 hash for an audit event.
 */
export function computeHash(eventData, prevHash) {
  const canonical = JSON.stringify({
    seq: eventData.seq,
    at: eventData.at,
    actorId: eventData.actorId,
    actorRole: eventData.actorRole,
    action: eventData.action,
    targetType: eventData.targetType,
    targetId: eventData.targetId,
    meta: eventData.meta ?? {},
  });
  const payload = canonical + prevHash;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Record an audit event. Called by every state change.
 *
 * @param {Object} params
 * @param {string} params.actorId
 * @param {string} params.actorRole
 * @param {string} params.action
 * @param {string} params.targetType
 * @param {string} params.targetId
 * @param {Object} [params.meta={}]
 * @returns {Promise<Object>} The created audit event
 */
// Appends are serialized so two concurrent state changes never read the same last event.
let queue = Promise.resolve();

export function record(params) {
  const next = queue.then(() => append(params));
  queue = next.catch(() => {});
  return next;
}

export const recordAudit = record;

// A demo reset must share the append queue: a login completion can still be
// recording after its HTTP response has finished. Deleting outside this queue
// can remove the predecessor of an event whose hash has already been computed.
export async function resetDemoAuditChain() {
  if (process.env.APP_MODE === 'production' || !/(^|_)(demo|test)$/.test(AuditEvent.db.name || '')) {
    throw new Error('DEMO_DATABASE_REQUIRED');
  }
  const next = queue.then(() => AuditEvent.deleteMany({}));
  queue = next.catch(() => {});
  return next;
}

async function append({ actorId, actorRole, action, targetType, targetId, meta = {} }) {
  // Normalize meta to plain JSON so the stored copy hashes exactly like this one.
  const cleanMeta = JSON.parse(JSON.stringify(meta ?? {}));

  for (let attempt = 0; attempt < 5; attempt++) {
    // Get the last event to chain from
    const last = await AuditEvent.findOne().sort({ seq: -1 }).lean();
    const seq = last ? last.seq + 1 : 1;
    const prevHash = last ? last.hash : '0'.repeat(64);

    const at = new Date();
    const eventData = { seq, at, actorId, actorRole, action, targetType, targetId, meta: cleanMeta };
    const hash = computeHash(eventData, prevHash);

    try {
      const event = await AuditEvent.create({ ...eventData, prevHash, hash });
      logger.debug({ action: 'audit.recorded', seq, auditAction: action });
      return event;
    } catch (err) {
      // Another process took this seq (unique index): re-read the chain head and retry.
      if (err && err.code === 11000) continue;
      throw err;
    }
  }
  throw new Error('audit.record could not append after 5 attempts');
}

/**
 * Verify the entire audit chain. Returns { intact: true } or { intact: false, brokenSeq: N }.
 */
export async function verifyChain() {
  const events = await AuditEvent.find().sort({ seq: 1 }).lean();

  if (events.length === 0) {
    return { intact: true, count: 0 };
  }

  let expectedPrevHash = '0'.repeat(64);

  for (const event of events) {
    // Check prevHash matches expected
    if (event.prevHash !== expectedPrevHash) {
      return { intact: false, brokenSeq: event.seq };
    }

    // Recompute hash and compare
    const recomputed = computeHash(event, event.prevHash);
    if (recomputed !== event.hash) {
      return { intact: false, brokenSeq: event.seq };
    }

    expectedPrevHash = event.hash;
  }

  return { intact: true, count: events.length };
}
