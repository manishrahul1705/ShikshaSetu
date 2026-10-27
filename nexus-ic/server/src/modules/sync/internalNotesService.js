import { InternalNote } from './models.js';
import Case from '../cases/Case.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { recordAudit } from '../audit/audit.js';

const OFFICER_ROLES = [
  'bureau_officer',
  'regional_officer',
  'supervisor',
  'competent_authority',
  'system_admin',
];

/**
 * Add an internal note (SPEC 9.3, 13 S24, U23)
 */
export async function addInternalNote(user, caseId, text) {
  if (!OFFICER_ROLES.includes(user.role)) {
    const err = new Error('Access denied: Only officers can add internal notes (S24)');
    err.status = 403;
    throw err;
  }
  if (!text || typeof text !== 'string' || !text.trim()) {
    const err = new Error('Note text is required');
    err.status = 400;
    throw err;
  }

  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const allowed = await canAccessCase(user, caseDoc);
  if (!allowed) {
    const err = new Error('Access denied to case');
    err.status = 403;
    throw err;
  }

  const note = await InternalNote.create({
    caseId: caseDoc._id,
    authorId: (user._id || user.id),
    authorName: user.displayName || user.username,
    authorBureau: user.bureau || 'General',
    authorRole: user.role,
    text: text.trim(),
  });

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.internal_note.added',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      noteId: String(note._id),
      authorBureau: note.authorBureau,
      // Note text itself omitted from high-level audit meta
    },
  });

  return note;
}

/**
 * Get internal notes for a case (SPEC 13 S24, U23)
 *
 * Invariant:
 * Strictly refused for complainant or institution admin.
 */
export async function getInternalNotes(user, caseId) {
  if (!OFFICER_ROLES.includes(user.role)) {
    const err = new Error('Access denied: Internal notes are invisible to complainants and institution admins (S24, U23)');
    err.status = 403;
    throw err;
  }

  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const allowed = await canAccessCase(user, caseDoc);
  if (!allowed) {
    const err = new Error('Access denied to case');
    err.status = 403;
    throw err;
  }

  return InternalNote.find({ caseId: caseDoc._id }).sort({ createdAt: 1 }).lean();
}

/**
 * Sanitizer utility to guarantee no internal note content or note IDs
 * appear in any complainant or institution-facing payload (S24, U23).
 */
export function sanitizeCaseResponse(payload, userRole) {
  if (!payload || typeof payload !== 'object') return payload;

  const sanitized = Array.isArray(payload) ? [...payload] : { ...payload };

  if (!OFFICER_ROLES.includes(userRole)) {
    if ('internalNotes' in sanitized) delete sanitized.internalNotes;
    if ('internal_notes' in sanitized) delete sanitized.internal_notes;
    if ('noteIds' in sanitized) delete sanitized.noteIds;
  }

  return sanitized;
}
