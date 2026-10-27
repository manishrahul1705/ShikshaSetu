import { EmailDraft, EmailOutbox } from '../models.js';
import { seal, open, fingerprint } from '../../vault/crypto.js';
import { createDraft, submitGrievance, getComplainantCase } from '../../cases/caseService.js';
import { resolveVerifiedSender } from '../../identity/index.js';
import { hashSender } from '../../identity/senders.js';
import { detect } from '../../intake/languageDetector.js';
import { record } from '../../audit/audit.js';
import { verified, demoOnly, audit, fail, digest, uid } from '../common.js';
export const ATTACHMENT_NOTE = 'Email attachments are dropped; no attachments are imported.';
export const VERIFY_REPLY = 'Please complete verification on the portal before submitting a grievance.';
export class EmailSimulator {
  async receive(actor, input) {
    demoOnly();
    const senderHash = hashSender(input.sender);
    const recipient = await resolveVerifiedSender(input.sender);
    if (!recipient) {
      const reply = await EmailOutbox.create({ senderHash, template: 'VERIFY_ON_PORTAL' });
      await record({ actorId: uid(actor), actorRole: actor.role, action: 'channels.email.inbound', targetType: 'channel', targetId: 'email-inbound', meta: { channel: 'EMAIL', outcome: 'SENDER_NOT_VERIFIED', senderHash } });
      return { outcome: 'SENDER_NOT_VERIFIED', replyId: reply.id, reply: VERIFY_REPLY, synthetic: true };
    }
    const narrative = input.narrative ?? input.body;
    if (typeof narrative !== 'string' || !narrative.trim()) throw fail(400, 'INVALID_EMAIL_DRAFT');
    const payload = { narrative, ...Object.fromEntries(['institutionPid','category','subCategory'].map(key => [key, typeof input[key] === 'string' ? input[key] : ''])) };
    await EmailDraft.init();
    const messageHash = fingerprint(`email-message:${recipient.reporterId}:${JSON.stringify(payload)}`);
    let row = await EmailDraft.findOne({ senderHash, messageHash });
    if (!row) {
      try {
        row = await EmailDraft.create({ reporterId: recipient.reporterId, senderHash, messageHash, ...seal(payload, recipient.reporterId), languageTag: detect(narrative).tag, attachmentsDropped: Array.isArray(input.attachments) && input.attachments.length > 0 });
      } catch (error) { if (error.code !== 11000) throw error; row = await EmailDraft.findOne({ senderHash, messageHash }); }
      await record({ actorId: uid(actor), actorRole: actor.role, action: 'channels.email.inbound', targetType: 'channel', targetId: row.id, meta: { channel: 'EMAIL', outcome: 'DRAFT_CREATED', senderHash } });
    }
    return { id: row.id, status: row.status, channel: 'EMAIL', portalPath: '/my/email-drafts', attachmentNote: ATTACHMENT_NOTE, synthetic: true };
  }
}
async function owned(user, id) {
  const reporterId = await verified(user);
  const row = /^[a-f\d]{24}$/i.test(id || '') && await EmailDraft.findOne({ _id: id, reporterId });
  if (!row) throw fail(404, 'DRAFT_NOT_FOUND');
  return row;
}
export async function listEmailDrafts(user) {
  const reporterId = await verified(user);
  const rows = await EmailDraft.find({ reporterId, state: { $ne: 'CONFIRMED' }, status: { $ne: 'CONFIRMED' } }).sort({ receivedAt: -1 });
  return rows.map(row => ({ id: row.id, status: 'AWAITING_CONFIRMATION', channel: 'EMAIL', languageTag: row.languageTag, receivedAt: row.receivedAt, attachmentNote: ATTACHMENT_NOTE }));
}
export async function readEmail(user, id) {
  const row = await owned(user, id);
  return { id: row.id, status: row.status, channel: 'EMAIL', draft: open(row, row.reporterId), attachmentNote: ATTACHMENT_NOTE };
}
export async function previewEmail(user, id, input) {
  const row = await owned(user, id);
  if (row.state === 'CONFIRMED') throw fail(409, 'ALREADY_CONFIRMED');
  const payload = Object.fromEntries(['institutionPid','category','subCategory','narrative'].map(key => [key,input[key]]));
  if (Object.values(payload).some(value => typeof value !== 'string' || !value.trim())) throw fail(400,'INVALID_EMAIL_DRAFT');
  const preview = await createDraft({ user, ...payload });
  Object.assign(row, seal(payload,row.reporterId), { state:'PREVIEWED', languageTag:preview.grievance.languageTag, previewHash:digest(JSON.stringify(payload)) });
  await row.save(); await audit(user,'email.draft.previewed',row.id);
  return { id:row.id,draft:payload,preview,previewToken:row.previewHash };
}
const summary = row => ({ masterCaseId:row.masterCaseId,channel:'EMAIL',status:row.status,institutionPid:row.institutionPid,languageTag:row.languageTag,createdAt:row.createdAt });
let confirmations=Promise.resolve();
export function confirmEmail(user,id,token) {
  const next=confirmations.then(async()=>{
    const row=await owned(user,id);
    if(row.state==='CONFIRMED') {
      const existing=await getComplainantCase(row.masterCaseId,user);
      if(!existing) throw fail(404,'CASE_NOT_FOUND');
      return summary(existing);
    }
    if(row.state!=='PREVIEWED' || token!==row.previewHash) throw fail(409,'PREVIEW_REQUIRED');
    const created=await submitGrievance({user,...open(row,row.reporterId),channel:'EMAIL',externalRefs:[{sourceSystem:'EmailSimulator',sourceCaseRef:row.id,sourceRef:row.id}]});
    row.state='CONFIRMED';row.status='CONFIRMED';row.masterCaseId=created.masterCaseId;
    await row.save();await audit(user,'email.confirmed',row.id);return summary(created);
  });
  confirmations=next.catch(()=>{});return next;
}
