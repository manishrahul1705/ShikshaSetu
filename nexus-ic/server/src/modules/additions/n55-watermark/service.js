import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { recordAudit } from '../../audit/audit.js';
import { SYNTHETIC_FOOTER_LINE } from '../n66-integrity-banner/exportFooter.js';

/**
 * N55 Leak-trace watermark on exports (ADDITIONS.md).
 *
 * Each export carries a visible "exported by office/role at time" footer and
 * an invisible per-export code (zero-width characters) stored in export_log.
 * Contains no reporter identity (S06, S25 hold).
 */
const exportLogSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, match: /^[0-9a-f]{16}$/ },
    kind: { type: String, required: true },
    exportedById: { type: String, required: true },
    exportedByRole: { type: String, required: true },
    exportedByOffice: { type: String, required: true },
    at: { type: Date, required: true },
    rowCount: { type: Number, default: null },
    scope: { type: String, default: null },
    synthetic: { type: Boolean, default: true },
  },
  { strict: 'throw' }
);

export const ExportLog = mongoose.models.export_log || mongoose.model('export_log', exportLogSchema, 'export_log');

const ZERO = '​';
const ONE = '‌';
const MARK = '⁠';

export function encodeInvisible(code) {
  const bits = [...Buffer.from(code, 'hex')].map((b) => b.toString(2).padStart(8, '0')).join('');
  return MARK + [...bits].map((b) => (b === '1' ? ONE : ZERO)).join('') + MARK;
}

export function decodeInvisible(text) {
  const match = String(text || '').match(new RegExp(`${MARK}([${ZERO}${ONE}]{64})${MARK}`));
  if (!match) return null;
  const bits = [...match[1]].map((c) => (c === ONE ? '1' : '0')).join('');
  return Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2))).toString('hex');
}

export function officeOf(user) {
  return user.bureau || (user.region ? `${user.region} Regional Office` : null) || {
    supervisor: 'Supervisor', competent_authority: 'Competent Authority', auditor: 'Audit', system_admin: 'System Administration',
    institution_admin: 'Institution', student: 'Complainant', faculty: 'Complainant', other_stakeholder: 'Complainant',
  }[user.role] || 'Unknown office';
}

export async function watermarkExport(user, { kind, rowCount = null, scope = null }) {
  const code = crypto.randomBytes(8).toString('hex');
  const at = new Date();
  const office = officeOf(user);
  await ExportLog.create({ code, kind, exportedById: String(user.id || user._id), exportedByRole: user.role, exportedByOffice: office, at, rowCount, scope });
  await recordAudit({
    actorId: String(user.id || user._id), actorRole: user.role, action: 'export.watermarked', targetType: 'Export', targetId: code,
    meta: { kind, rowCount, scope },
  });
  const visible = `Exported by ${office}/${user.role} at ${at.toISOString()}`;
  return { code, at, visible, invisible: encodeInvisible(code), footer: [SYNTHETIC_FOOTER_LINE, visible].filter(Boolean).join(' | ') };
}

export async function traceExport(user, text) {
  const code = decodeInvisible(text) || (/^[0-9a-f]{16}$/.test(String(text || '').trim()) ? String(text).trim() : null);
  if (!code) return { result: 'NO_WATERMARK_FOUND' };
  const row = await ExportLog.findOne({ code }).select('-_id -__v').lean();
  await recordAudit({
    actorId: String(user.id || user._id), actorRole: user.role, action: 'export.traced', targetType: 'Export', targetId: code,
    meta: { found: !!row },
  });
  return row ? { result: 'FOUND', export: row } : { result: 'UNKNOWN_CODE', code };
}
