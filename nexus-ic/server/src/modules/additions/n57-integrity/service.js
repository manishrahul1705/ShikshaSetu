import mongoose from 'mongoose';
import AuditEvent from '../../audit/AuditEvent.js';
import { verifyChain, record } from '../../audit/audit.js';
import logger from '../../../config/logger.js';
const rejectMutation = () => { throw Object.assign(new Error('FINGERPRINT_APPEND_ONLY'), { code: 'FINGERPRINT_APPEND_ONLY', status: 409 }); };
const schema = new mongoose.Schema({
  day: { type: String, required: true, unique: true, immutable: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  rootHash: { type: String, default: null, immutable: true },
  eventCount: { type: Number, required: true, immutable: true },
  firstEventId: { type: mongoose.Schema.Types.ObjectId, default: null, immutable: true },
  lastEventId: { type: mongoose.Schema.Types.ObjectId, default: null, immutable: true },
  chainVerified: { type: Boolean, required: true, immutable: true },
  computedAt: { type: Date, required: true, immutable: true },
}, { strict: 'throw' });
schema.pre('save', function () { if (!this.isNew) rejectMutation(); });
schema.pre(['updateOne','updateMany','findOneAndUpdate','replaceOne','findOneAndReplace','deleteOne','deleteMany','findOneAndDelete'], rejectMutation);
schema.pre('deleteOne', { document: true, query: false }, rejectMutation);
schema.statics.bulkWrite = async () => rejectMutation();
export const Fingerprint = mongoose.model('IntegrityFingerprint', schema, 'integrity_fingerprints');
const fail = (status,code) => Object.assign(new Error(code),{status,code});
export function yesterday(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())-86400000).toISOString().slice(0,10);
}
function bounds(day, now) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) throw fail(400,'INVALID_COMPLETED_DAY');
  const start = new Date(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0,10)!==day || day>yesterday(now)) throw fail(400,'INVALID_COMPLETED_DAY');
  return {start,end:new Date(start.getTime()+86400000)};
}
export async function computeDay(day, now = new Date()) {
  const {start,end} = bounds(day,now);
  const chain = await verifyChain();
  const events = await AuditEvent.find({at:{$gte:start,$lt:end}}).select('_id seq hash').sort({seq:1}).lean();
  return {day,rootHash:events.at(-1)?.hash || null,eventCount:events.length,firstEventId:events[0]?._id || null,lastEventId:events.at(-1)?._id || null,chainVerified:chain.intact===true,computedAt:now};
}
export async function capture(user,{now=new Date(),day=yesterday(now)}={}) {
  bounds(day,now); await Fingerprint.init();
  let row = await Fingerprint.findOne({day}).lean();
  if (!row) {
    const data = await computeDay(day,now);
    try { row = (await Fingerprint.create(data)).toObject(); }
    catch (error) { if (error.code!==11000) throw error; row = await Fingerprint.findOne({day}).lean(); }
    await record({actorId:String(user.id || user._id),actorRole:user.role,action:'integrity.fingerprint.computed',targetType:'integrity',targetId:day,meta:{eventCount:row.eventCount,chainVerified:row.chainVerified}});
  }
  return publicRow(row);
}
function publicRow(row) {
  return {day:row.day,rootHash:row.rootHash,eventCount:row.eventCount,chainVerified:row.chainVerified,computedAt:row.computedAt};
}
export async function history() {
  const rows = await Fingerprint.find().sort({day:-1}).lean();
  return {synthetic:true,fingerprints:rows.map(publicRow),limitation:'Outside proof for S09; retain published hashes independently. Not a blockchain or trusted timestamp authority.'};
}
export async function compareDay(user,day,now=new Date()) {
  const stored = await Fingerprint.findOne({day}).lean();
  if (!stored) throw fail(404,'FINGERPRINT_NOT_FOUND');
  const current = await computeDay(day,now);
  const match = ['rootHash','eventCount','firstEventId','lastEventId','chainVerified'].every(key=>String(stored[key])===String(current[key]));
  await record({actorId:String(user.id || user._id),actorRole:user.role,action:'integrity.fingerprint.compared',targetType:'integrity',targetId:day,meta:{match,chainVerified:current.chainVerified}});
  return {day,match,chainVerified:current.chainVerified,stored:publicRow(stored),recomputed:publicRow(current)};
}
let pending=Promise.resolve();
export function publishDaily() {
  const next=pending.then(()=>capture({id:'integrity-daily-job',role:'system'})); pending=next.catch(()=>{}); return next;
}
export function startDailyPublisher() {
  if (process.env.NODE_ENV==='test') return;
  const run=()=>publishDaily().catch(()=>logger.warn({action:'integrity_publication_unavailable'}));
  const schedule=()=>{
    const now=new Date(),next=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1);
    const timer=setTimeout(()=>{void run();schedule();},next-now.getTime());timer.unref();
  };
  const start=()=>{void run();schedule();};
  if(mongoose.connection.readyState===1) start(); else mongoose.connection.once('open',start);
}
