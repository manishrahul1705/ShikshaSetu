import mongoose from 'mongoose';
import { canAccessCase } from '../../../middleware/rbac.js';
import { recordAudit } from '../../audit/audit.js';
import { fail, actorId, findCase, sha256 } from '../../closure/util.js';

// Officers who handle the case. The Competent Authority is not here: it never
// gains automatic access to private narratives (SPEC 12.2, S19).
export const REDACTION_ROLES = ['bureau_officer', 'regional_officer', 'supervisor'];

/**
 * N62 Redaction helper (ADDITIONS.md).
 *
 * Highlights names, roll numbers and phone numbers before a case enters the
 * institution-facing form; the officer confirms each one. Tool only: the
 * SPEC 12.3 redaction rule is unchanged, and nothing reaches the institution
 * until an officer has decided every highlight.
 */
const decisionSchema = new mongoose.Schema(
  { spanId: { type: String, required: true }, type: { type: String, required: true }, accepted: { type: Boolean, required: true } },
  { _id: false }
);
const formSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    masterCaseId: { type: String, required: true },
    redactedText: { type: String, required: true },
    decisions: { type: [decisionSchema], default: [] },
    sourceHash: { type: String, required: true },
    confirmedBy: { type: String, required: true },
    confirmedByRole: { type: String, required: true },
    confirmedAt: { type: Date, required: true },
    synthetic: { type: Boolean, default: true },
  },
  { strict: 'throw' }
);
export const InstitutionFacingForm =
  mongoose.models.institution_facing_forms || mongoose.model('institution_facing_forms', formSchema, 'institution_facing_forms');

const PATTERNS = [
  { type: 'PHONE', re: /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g },
  { type: 'PHONE', re: /(?:\+91[\s-]?)?\b[6-9]\d{4}[\s-]\d{5}\b/g },
  { type: 'ROLL_NUMBER', re: /\b[Rr]oll\s*(?:[Nn]o\.?|[Nn]umber)\s*[:-]?\s*([A-Za-z0-9/-]{3,})/g, group: 1 },
  { type: 'ROLL_NUMBER', re: /\b(?=[A-Z0-9/-]*\d)(?=[A-Z0-9/-]*[A-Z])[A-Z0-9][A-Z0-9/-]{5,}\b/g },
  { type: 'NAME', re: /\b(?:Mr|Mrs|Ms|Dr|Prof|Shri|Smt|Kumari)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g, group: 1 },
  { type: 'NAME', re: /\b[Mm]y name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g, group: 1 },
];

export function detectSensitive(text) {
  const spans = [];
  for (const { type, re, group } of PATTERNS) {
    for (const m of String(text || '').matchAll(re)) {
      const value = group ? m[group] : m[0];
      const start = m.index + (group ? m[0].indexOf(value) : 0);
      const end = start + value.length;
      if (spans.some((s) => start < s.end && end > s.start)) continue;
      spans.push({ type, start, end, text: value });
    }
  }
  return spans.sort((a, b) => a.start - b.start).map((s, i) => ({ id: `H${i + 1}`, ...s }));
}

export function applyRedaction(text, spans, acceptedIds) {
  let out = '';
  let cursor = 0;
  for (const s of spans) {
    out += text.slice(cursor, s.start);
    out += acceptedIds.has(s.id) ? `[REDACTED ${s.type.replace('_', ' ')}]` : text.slice(s.start, s.end);
    cursor = s.end;
  }
  return out + text.slice(cursor);
}

async function officerCase(user, caseRef) {
  if (!REDACTION_ROLES.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const caseDoc = await findCase(caseRef);
  if (!caseDoc || !(await canAccessCase(user, caseDoc))) throw fail(404, 'CASE_NOT_FOUND');
  return caseDoc;
}

export async function getSuggestions(user, caseRef) {
  const caseDoc = await officerCase(user, caseRef);
  const form = await InstitutionFacingForm.findOne({ caseId: caseDoc._id }).sort({ confirmedAt: -1 }).lean();
  return { masterCaseId: caseDoc.masterCaseId, narrative: caseDoc.narrative, highlights: detectSensitive(caseDoc.narrative), currentForm: form ? { redactedText: form.redactedText, confirmedAt: form.confirmedAt } : null };
}

export async function confirmRedaction(user, caseRef, { decisions = [] } = {}) {
  const caseDoc = await officerCase(user, caseRef);
  const spans = detectSensitive(caseDoc.narrative);
  const byId = new Map((Array.isArray(decisions) ? decisions : []).map((d) => [d.id, d.accept]));
  // The officer confirms each highlight; none may be skipped.
  for (const s of spans) if (typeof byId.get(s.id) !== 'boolean') throw fail(400, 'DECISION_MISSING');
  const accepted = new Set(spans.filter((s) => byId.get(s.id) === true).map((s) => s.id));
  const form = await InstitutionFacingForm.create({
    caseId: caseDoc._id,
    masterCaseId: caseDoc.masterCaseId,
    redactedText: applyRedaction(caseDoc.narrative, spans, accepted),
    decisions: spans.map((s) => ({ spanId: s.id, type: s.type, accepted: accepted.has(s.id) })),
    sourceHash: sha256(caseDoc.narrative),
    confirmedBy: actorId(user),
    confirmedByRole: user.role,
    confirmedAt: new Date(),
  });
  await recordAudit({
    actorId: actorId(user), actorRole: user.role, action: 'redaction.confirmed', targetType: 'Case', targetId: String(caseDoc._id),
    meta: { masterCaseId: caseDoc.masterCaseId, highlights: spans.length, accepted: accepted.size },
  });
  return { masterCaseId: caseDoc.masterCaseId, redactedText: form.redactedText, decisions: form.decisions };
}

/** The confirmed form for the institution, or null when none is confirmed for the current text. */
export async function confirmedForm(caseDoc) {
  const form = await InstitutionFacingForm.findOne({ caseId: caseDoc._id }).sort({ confirmedAt: -1 }).lean();
  if (!form || form.sourceHash !== sha256(caseDoc.narrative)) return null;
  return form;
}
