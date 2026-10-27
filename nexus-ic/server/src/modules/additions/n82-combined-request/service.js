import mongoose from 'mongoose';
import crypto from 'node:crypto';
import Query from '../../queries/models.js';
import Case from '../../cases/Case.js';
import User from '../../auth/User.js';
import { respondAsInstitution, linkedInstitution } from '../../institutionview/institutionViewService.js';
import { canAccessCase } from '../../../middleware/rbac.js';
import { record } from '../../audit/audit.js';
import { getActiveRule } from '../../rulebook/index.js';

export const fail = (status, code) => Object.assign(new Error(code), { status, code });
export const actor = u => String(u.id || u._id);
export const office = value => ({ 'Regulation Bureau': 'RB', 'Public Grievance Redressal Cell': 'PGRC', 'Academic Bureau': 'AB', 'Approval Bureau': 'APB' }[value] || value);
export const officers = ['bureau_officer', 'regional_officer', 'supervisor', 'competent_authority'];
export async function event(user, action, id, meta = {}) {
  return record({ actorId: actor(user), actorRole: user.role, action, targetType: 'ProblemStatement', targetId: String(id), meta });
}
export async function scopedCase(user, ref) {
  const c = await Case.findOne(mongoose.isValidObjectId(ref) ? { _id: ref } : { masterCaseId: ref });
  if (!c || !await canAccessCase(user, c)) throw fail(404, 'CASE_NOT_FOUND');
  return c;
}
export async function liveUser(user) {
  const u = await User.findById(actor(user)).lean();
  if (!u?.active || u.role !== user.role) throw fail(403, 'SESSION_REVOKED');
  return { ...u, id: String(u._id) };
}
const itemSchema = new mongoose.Schema({ queryId: { type: mongoose.Schema.Types.ObjectId, required: true }, caseId: mongoose.Schema.Types.ObjectId,
  masterCaseId: String, office: String, role: String, text: String, decision: { type: String, enum: ['PENDING', 'CONFIRMED', 'WITHDRAWN'], default: 'PENDING' },
  decidedBy: String, decidedAt: Date, replyBy: Date, policyVersion: String }, { _id: true });
const schema = new mongoose.Schema({ reference: { type: String, unique: true }, institutionPid: { type: String, required: true, index: true },
  coverNote: String, status: { type: String, enum: ['PROPOSED', 'ISSUED'], default: 'PROPOSED' }, items: [itemSchema], issuedAt: Date, proposedBy: String }, { timestamps: true });
schema.index({'items.queryId':1},{unique:true});
export const CombinedRequest = mongoose.models.ps_combined_requests || mongoose.model('ps_combined_requests', schema);

async function read(user, id) {
  const row = await CombinedRequest.findById(id).catch(() => null);
  if (!row) throw fail(404, 'REQUEST_NOT_FOUND');
  if (user.role === 'institution_admin') {
    if (row.institutionPid !== await linkedInstitution(user) || row.status !== 'ISSUED') throw fail(404, 'REQUEST_NOT_FOUND');
  } else if (!officers.includes(user.role) || !row.items.some(i => office(i.office) === office(user.bureau))) {
    if (!['supervisor', 'competent_authority'].includes(user.role)) throw fail(404, 'REQUEST_NOT_FOUND');
  }
  return row;
}
async function view(user, row) {
  const institution = user.role === 'institution_admin';
  const queries = await Query.find({ _id: { $in: row.items.map(i => i.queryId) } }).lean();
  const byId = new Map(queries.map(q => [String(q._id), q]));
  const { LockerVersion } = await import('../n83-document-locker/service.js');
  const versions = await LockerVersion.find({ institutionPid: row.institutionPid, documentId: { $in: queries.flatMap(q=>q.documentIds || []) } }).lean();
  return { id: String(row._id), reference: row.reference, institutionPid: row.institutionPid, coverNote: row.coverNote, status: row.status, issuedAt: row.issuedAt,
    items: row.items.filter(i => !institution || i.decision === 'CONFIRMED').map(i => {
      const q = byId.get(String(i.queryId));
      const owns = office(i.office) === office(user.bureau);
      return { id: String(i._id), caseId: i.masterCaseId, office: i.office, role: i.role, text: i.text, decision: i.decision,
        replyBy: i.replyBy || null, policy: i.replyBy ? 'configured' : 'policy not configured', canDecide: !institution && owns && row.status === 'PROPOSED',
        response: institution || owns ? q?.responseText || null : undefined, status: q?.status || 'PENDING',
        documents: institution || owns ? versions.filter(v=>(q?.documentIds || []).some(id=>String(id)===String(v.documentId))).map(v=>({id:String(v._id),documentType:v.documentType,version:v.version})) : [] };
    }) };
}
export async function eligible(user, pid) {
  if (!officers.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  const cases = await Case.find({ institutionPid: pid }).select('_id masterCaseId').lean();
  const queries = await Query.find({ caseId: { $in: cases.map(c => c._id) }, recipientType: 'institution', status: 'PENDING' }).lean();
  const reserved = await CombinedRequest.find({ institutionPid: pid }).select('items').lean();
  const used = new Set(reserved.flatMap(r => r.items.map(i => String(i.queryId))));
  const items = queries.filter(q => !used.has(String(q._id)));
  if (!['supervisor', 'competent_authority'].includes(user.role) && !items.some(q => office(q.senderBureau) === office(user.bureau))) return [];
  return items.map(q => ({ queryId: String(q._id), caseId: q.masterCaseId, office: q.senderBureau, role: q.senderRole, text: q.queryText }));
}
export async function propose(user, { institutionPid, queryIds, coverNote }) {
  const options = await eligible(user, institutionPid);
  if (!Array.isArray(queryIds) || new Set(queryIds).size !== queryIds.length) throw fail(400, 'SELECT_DISTINCT_ITEMS');
  const selected = options.filter(q => queryIds.includes(q.queryId));
  if (selected.length !== queryIds.length || new Set(selected.map(i => office(i.office))).size < 2) throw fail(400, 'TWO_BUREAUS_REQUIRED');
  if (typeof coverNote !== 'string' || !coverNote.trim() || coverNote.length > 2000) throw fail(400, 'COVER_NOTE_REQUIRED');
  const queries = await Query.find({ _id: { $in: queryIds } }).lean();
  const row = await CombinedRequest.create({ institutionPid, reference: `CR-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, coverNote: coverNote.trim(), proposedBy: actor(user),
    items: queries.map(q => ({ queryId: q._id, caseId: q.caseId, masterCaseId: q.masterCaseId, office: q.senderBureau, role: q.senderRole, text: q.queryText })) });
  await event(user, 'combined.proposed', row.id, { items: row.items.length });
  return view(user, row);
}
export async function decide(user, id, itemId, decision) {
  const row = await read(user, id);
  const item = row.items.id(itemId);
  if (!officers.includes(user.role) || !item || office(item.office) !== office(user.bureau)) throw fail(403, 'OWNING_BUREAU_ONLY');
  if (row.status !== 'PROPOSED' || !['CONFIRMED', 'WITHDRAWN'].includes(decision)) throw fail(409, 'INVALID_DECISION');
  item.decision = decision; item.decidedBy = actor(user); item.decidedAt = new Date();
  await row.save(); await event(user, `combined.${decision.toLowerCase()}`, row.id, { itemId });
  return view(user, row);
}
export async function issue(user, id) {
  const row = await read(user, id);
  if (!officers.includes(user.role)) throw fail(403, 'INSUFFICIENT_PERMISSIONS');
  if (row.status !== 'PROPOSED' || row.items.some(i => i.decision === 'PENDING')) throw fail(409, 'AWAITING_BUREAU_CONFIRMATION');
  const confirmed = row.items.filter(i => i.decision === 'CONFIRMED');
  if (new Set(confirmed.map(i => office(i.office))).size < 2) throw fail(409, 'TWO_CONFIRMED_BUREAUS_REQUIRED');
  if (await Query.countDocuments({ _id: { $in: confirmed.map(i => i.queryId) }, status: 'PENDING' }) !== confirmed.length) throw fail(409, 'ITEM_ALREADY_ANSWERED');
  const rule = await getActiveRule('COMBINED_REQUEST_REPLY');
  const days = rule?.status === 'approved' ? rule.body?.calendarDays : null;
  if (Number.isFinite(days) && days > 0 && (process.env.APP_MODE !== 'production' || !rule.version.startsWith('DEMO-'))) {
    for (const item of confirmed) { item.replyBy = new Date(Date.now() + days * 86400000); item.policyVersion = rule.version; }
  }
  row.status = 'ISSUED'; row.issuedAt = new Date(); await row.save(); await event(user, 'combined.issued', row.id, { items: confirmed.length });
  return view(user, row);
}
export async function reply(user, id, itemId, body) {
  const row = await read(user, id); const item = row.items.id(itemId);
  if (user.role !== 'institution_admin' || row.status !== 'ISSUED' || item?.decision !== 'CONFIRMED') throw fail(403, 'INSTITUTION_REPLY_ONLY');
  const { LockerVersion } = await import('../n83-document-locker/service.js');
  const selected = body.lockerVersionIds || [];
  if (!Array.isArray(selected) || selected.some(id=>!mongoose.isValidObjectId(id)) || new Set(selected).size !== selected.length) throw fail(400,'INVALID_DOCUMENT_SELECTION');
  const versions = await LockerVersion.find({_id:{$in:selected},institutionPid:row.institutionPid}).lean();
  if (versions.length !== selected.length) throw fail(404,'DOCUMENT_NOT_FOUND');
  await respondAsInstitution(user, String(item.queryId), {responseText:body.responseText,documentIds:versions.map(v=>v.documentId)});
  await event(user, 'combined.replied', row.id, { itemId });
  return view(user, row);
}
export async function list(user, pid) {
  const institutionPid = user.role === 'institution_admin' ? await linkedInstitution(user) : pid;
  if (!institutionPid) throw fail(400, 'INSTITUTION_REQUIRED');
  const rows = await CombinedRequest.find({ institutionPid }).sort({ createdAt: -1 });
  const visible = [];
  for (const row of rows) { try { await read(user, row.id); visible.push(await view(user, row)); } catch (e) { if (e.status !== 404) throw e; } }
  return visible;
}
export async function counts(user, pid) {
  if (!pid && user.role !== 'institution_admin') {
    if(!officers.includes(user.role))throw fail(403,'INSUFFICIENT_PERMISSIONS');
    const {scopedCases}=await import('../../impact/impactService.js');
    const cases=await scopedCases(user), ids=cases.map(c=>c._id);
    const requests=await CombinedRequest.find({'items.caseId':{$in:ids}}).lean();
    const visible=new Set(ids.map(String));
    const items=requests.flatMap(r=>r.items.filter(i=>visible.has(String(i.caseId)) && i.decision!=='WITHDRAWN').map(i=>({...i,issued:r.status==='ISSUED'})));
    const used=new Set(items.map(i=>String(i.queryId)));
    const pending=await Query.find({caseId:{$in:ids},recipientType:'institution',status:'PENDING'}).select('_id').lean();
    return {numerator:items.filter(i=>i.issued && i.decision==='CONFIRMED').length,denominator:used.size+pending.filter(q=>!used.has(String(q._id))).length,scope:'Institution query items in cases visible to your role',unit:'query items'};
  }
  if(user.role==='institution_admin')pid=await linkedInstitution(user);
  const rows = await list(user, pid);
  const pending = user.role === 'institution_admin' ? [] : await eligible(user, pid);
  const confirmed = rows.filter(r => r.status === 'ISSUED').reduce((n, r) => n + r.items.filter(i => i.decision === 'CONFIRMED').length, 0);
  const reserved = rows.reduce((n, r) => n + r.items.filter(i => i.decision !== 'WITHDRAWN').length, 0);
  return { numerator: confirmed, denominator: reserved + pending.length, scope: `Institution ${pid}; requests visible to your office`, unit: 'query items' };
}
