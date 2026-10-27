import mongoose from 'mongoose';
import Document from '../../documents/Document.js';
import { processUpload, getDecryptedDocument } from '../../documents/documentService.js';
import { linkedInstitution } from '../../institutionview/institutionViewService.js';
import { getActiveRule } from '../../rulebook/index.js';
import User from '../../auth/User.js';
import Case from '../../cases/Case.js';
import { actor, event, fail, officers, scopedCase } from '../n82-combined-request/service.js';
const versionSchema = new mongoose.Schema({ institutionPid: { type: String, required: true }, documentType: String, version: Number, documentId: mongoose.Schema.Types.ObjectId, hash: String, submittedAt: Date });
versionSchema.index({ institutionPid: 1, documentType: 1, version: 1 }, { unique: true });
export const LockerVersion = mongoose.models.ps_locker_versions || mongoose.model('ps_locker_versions', versionSchema);
const grantSchema = new mongoose.Schema({ versionId: mongoose.Schema.Types.ObjectId, institutionPid: String, caseId: mongoose.Schema.Types.ObjectId,
  officerId: String, state: { type: String, enum: ['REQUESTED', 'GRANTED', 'REVOKED'], default: 'REQUESTED' }, expiresAt: Date, grantedAt: Date, revokedAt: Date }, { timestamps: true });
export const LockerGrant = mongoose.models.ps_locker_grants || mongoose.model('ps_locker_grants', grantSchema);
export async function types() {
  const rule = await getActiveRule('INSTITUTION_DOCUMENT_TYPES');
  return rule?.body?.types?.filter(t => typeof t === 'string' && t.length < 100) || ['Approval letter', 'Fee notification', 'Faculty list', 'Affiliation letter', 'Other'];
}
export async function upload(user, { documentType, content, mimeType, name }) {
  const institutionPid = await linkedInstitution(user);
  if (!(await types()).includes(documentType)) throw fail(400, 'DOCUMENT_TYPE_INVALID');
  if (typeof content !== 'string' || !content || content.length > 14000000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(content)) throw fail(400, 'FILE_INVALID');
  const doc = await processUpload({ buffer: Buffer.from(content, 'base64'), originalName: String(name || 'document').slice(0, 150), mimeType, user });
  const latest = await LockerVersion.findOne({ institutionPid, documentType }).sort({ version: -1 }).lean();
  const row = await LockerVersion.create({ institutionPid, documentType, version: (latest?.version || 0) + 1, documentId: doc._id, hash: doc.originalHash, submittedAt: new Date() });
  await event(user, 'locker.uploaded', row.id, { version: row.version, documentType });
  return { id: row.id, documentType, version: row.version, hash: row.hash, submittedAt: row.submittedAt };
}
export async function list(user, { caseId } = {}) {
  let pid;
  if (user.role === 'institution_admin') pid = await linkedInstitution(user);
  else { if (!officers.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS'); pid = (await scopedCase(user, caseId)).institutionPid; }
  const versions = await LockerVersion.find({ institutionPid: pid }).sort({ documentType: 1, version: -1 }).lean();
  const grants = await LockerGrant.find({ institutionPid: pid, ...(user.role === 'institution_admin' ? {} : { officerId: actor(user) }) }).lean();
  const cases = await Case.find({_id:{$in:grants.map(g=>g.caseId)}}).select('_id masterCaseId').lean();
  const people = await User.find({_id:{$in:grants.map(g=>g.officerId)}}).select('_id bureau role').lean();
  return { institutionPid: pid, documentTypes: await types(), versions: versions.map(v => ({ id: String(v._id), documentType: v.documentType, version: v.version, hash: v.hash, submittedAt: v.submittedAt })),
    grants: grants.map(g => ({ id: String(g._id), versionId: String(g.versionId), caseId: String(g.caseId), caseReference:cases.find(c=>String(c._id)===String(g.caseId))?.masterCaseId, office:people.find(u=>String(u._id)===g.officerId)?.bureau, officerRole:people.find(u=>String(u._id)===g.officerId)?.role, officerId: g.officerId, state: g.state, expiresAt: g.expiresAt })) };
}
export async function requestAccess(user, { versionId, caseId }) {
  if (!officers.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const c = await scopedCase(user, caseId);
  const v = await LockerVersion.findById(versionId).catch(() => null);
  if (!v || v.institutionPid !== c.institutionPid) throw fail(404, 'DOCUMENT_NOT_FOUND');
  const g = await LockerGrant.create({ versionId: v._id, institutionPid: v.institutionPid, caseId: c._id, officerId: actor(user) });
  await event(user, 'locker.access_requested', g.id, { caseId: String(c._id) });
  return { id: g.id, state: g.state };
}
export async function decide(user, id, { revoke = false, expiresAt }) {
  const pid = await linkedInstitution(user);
  const g = await LockerGrant.findOne({ _id: id, institutionPid: pid }).catch(() => null);
  if (!g) throw fail(404, 'GRANT_NOT_FOUND');
  if (revoke) { g.state = 'REVOKED'; g.revokedAt = new Date(); }
  else {
    const expiry = new Date(expiresAt);
    if (!Number.isFinite(expiry.getTime()) || expiry <= new Date() || g.state !== 'REQUESTED') throw fail(400, 'FUTURE_EXPIRY_REQUIRED');
    const officer = await User.findById(g.officerId).lean();
    if (!officer?.active) throw fail(400, 'OFFICER_UNAVAILABLE');
    await scopedCase(officer, String(g.caseId));
    g.state = 'GRANTED'; g.expiresAt = expiry; g.grantedAt = new Date();
  }
  await g.save(); await event(user, revoke ? 'locker.revoked' : 'locker.granted', g.id);
  return { id: g.id, state: g.state, expiresAt: g.expiresAt };
}
export async function download(user, versionId, caseId) {
  const v = await LockerVersion.findById(versionId).catch(() => null);
  if (!v) throw fail(404, 'DOCUMENT_NOT_FOUND');
  if (user.role === 'institution_admin') {
    if (await linkedInstitution(user) !== v.institutionPid) throw fail(404, 'DOCUMENT_NOT_FOUND');
  } else {
    const c = await scopedCase(user, caseId);
    if (!await LockerGrant.exists({ versionId: v._id, caseId: c._id, officerId: actor(user), state: 'GRANTED', expiresAt: { $gt: new Date() } })) throw fail(403, 'DOCUMENT_GRANT_REQUIRED');
  }
  const doc = await Document.findById(v.documentId);
  if (!doc || doc.malwareScanStatus !== 'clean') throw fail(503, 'DOCUMENT_UNAVAILABLE');
  await event(user, 'locker.downloaded', v.id, { caseId: caseId || null });
  return getDecryptedDocument(doc, user);
}
export async function availableForCase(user, caseId, documentType) {
  const c = await scopedCase(user, caseId);
  const row = await LockerVersion.findOne({ institutionPid: c.institutionPid, documentType }).sort({ version: -1 }).lean();
  return row ? { id: String(row._id), version: row.version, submittedAt: row.submittedAt, documentType: row.documentType } : null;
}
