import { record } from '../audit/audit.js';
export const fail = (status, code) => Object.assign(new Error(code), { status, code });
let tail = Promise.resolve();
// Serialize S1a mutations so an OTP cannot be consumed or approved twice.
// MongoDB unique indexes independently protect cross-process person claims.
export function serial(work) {
  const next = tail.then(work, work);
  tail = next.catch(() => {});
  return next;
}
export const audit = (user, action, targetType, targetId) => record({ actorId: String(user.id), actorRole: user.role, action, targetType, targetId: String(targetId), meta: {} });
export function fields(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !allowed.includes(key))) throw fail(400, 'UNKNOWN_FIELDS');
}
export function text(value, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw fail(400, 'INVALID_INPUT');
  return value.trim();
}
