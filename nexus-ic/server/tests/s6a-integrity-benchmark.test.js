import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { capture, history, compareDay, yesterday, Fingerprint } from '../src/modules/additions/n57-integrity/service.js';
import { record, computeHash } from '../src/modules/audit/audit.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { evaluate, fixtures } from '../src/modules/benchmark/service.js';
import { overlapDefaults } from '../src/modules/prevent/defaults.js';
const actor={id:'synthetic-judge',role:'system_admin'},now=new Date('2025-10-27T01:00:00Z');
// Fixture days are a year in the past: the service's own audit records use the real clock, so a fixture day equal to today (25 Oct 2026) made the recomputed fingerprint differ.
beforeEach(async()=>{await Fingerprint.init();});
afterEach(()=>vi.restoreAllMocks());
async function eventAt(at) {
 const last=await AuditEvent.findOne().sort({seq:-1}).lean();
 const data={seq:last?last.seq+1:1,at:new Date(at),actorId:actor.id,actorRole:actor.role,action:'synthetic.event',targetType:'fixture',targetId:'opaque-fixture',meta:{}};
 const prevHash=last?.hash || '0'.repeat(64);
 return AuditEvent.create({...data,prevHash,hash:computeHash(data,prevHash)});
}
it('[A-N57] daily write-once hashes match the independent anchor, change on a new day, and expose no audit payload',async()=>{
 await eventAt('2025-10-24T23:59:59Z');
 const first=await eventAt('2025-10-25T00:00:00Z'),last=await eventAt('2025-10-25T23:59:59Z');
 await eventAt('2025-10-26T00:00:00Z');
 const saved=await capture(actor,{day:'2025-10-25',now});
 expect(saved).toMatchObject({day:'2025-10-25',rootHash:last.hash,eventCount:2,chainVerified:true});
 const stored=await Fingerprint.findOne({day:'2025-10-25'}).lean();expect(String(stored.firstEventId)).toBe(first.id);expect(String(stored.lastEventId)).toBe(last.id);
 expect((await capture(actor,{day:'2025-10-25',now})).rootHash).toBe(saved.rootHash);expect(await Fingerprint.countDocuments()).toBe(1);
 const next=await capture(actor,{day:'2025-10-26',now});expect(next.rootHash).not.toBe(saved.rootHash);
 expect((await compareDay(actor,'2025-10-25',now)).match).toBe(true);
 const view=await history();expect(JSON.stringify(view)).not.toMatch(/synthetic-judge|synthetic.event|actorId|meta|narrative|email|firstEventId|lastEventId/);
 expect(yesterday(now)).toBe('2025-10-26');expect(Fingerprint.collection.name).toBe('integrity_fingerprints');
 await expect(capture(actor,{day:'2025-10-27',now})).rejects.toThrow('INVALID_COMPLETED_DAY');
});
it('[A-N57] audit tampering is recorded unverified and recompute reports mismatch without rewriting history',async()=>{
 await eventAt('2025-10-25T12:00:00Z');
 await capture(actor,{day:'2025-10-25',now});
 await AuditEvent.updateOne({seq:1},{$set:{action:'tampered'}});
 expect((await compareDay(actor,'2025-10-25',now))).toMatchObject({match:false,chainVerified:false});
 expect((await Fingerprint.findOne({day:'2025-10-25'})).chainVerified).toBe(true);
 const broken=await capture(actor,{day:'2025-10-26',now});expect(broken.chainVerified).toBe(false);expect(await Fingerprint.countDocuments()).toBe(2);
});
it('[A-N57] fingerprint models refuse save updates, query updates, replacements, deletes and bulk mutations',async()=>{
 await eventAt('2025-10-25T12:00:00Z');await capture(actor,{day:'2025-10-25',now});
 const row=await Fingerprint.findOne();
 await expect(row.save()).rejects.toThrow('FINGERPRINT_APPEND_ONLY');
 await expect(row.deleteOne()).rejects.toThrow('FINGERPRINT_APPEND_ONLY');
 for(const operation of [()=>Fingerprint.updateOne({},{$set:{eventCount:0}}),()=>Fingerprint.updateMany({},{$set:{eventCount:0}}),()=>Fingerprint.findOneAndUpdate({},{$set:{eventCount:0}}),()=>Fingerprint.replaceOne({},{day:'2025-10-25'}),()=>Fingerprint.findOneAndReplace({},{day:'2025-10-25'}),()=>Fingerprint.deleteOne({}),()=>Fingerprint.deleteMany({}),()=>Fingerprint.findOneAndDelete({}),()=>Fingerprint.bulkWrite([{deleteMany:{filter:{}}}])]) await expect(operation()).rejects.toThrow('FINGERPRINT_APPEND_ONLY');
 expect(await Fingerprint.countDocuments()).toBe(1);
});
it('[A-N48] generated benchmark is deterministic, network-free and reports the actual confusion matrix with scope', async () => {
  const a = fixtures(), b = fixtures(); expect(a).toEqual(b); expect(a).toHaveLength(3000);
  const fetch = vi.spyOn(globalThis,'fetch').mockImplementation(() => { throw new Error('NETWORK_FORBIDDEN'); });
  const summary = await evaluate({...overlapDefaults, configured:true, synthetic:true});
  expect(summary.denominator).toBe(3000); expect(summary.evaluated).toBe(3000); expect(summary.unknown).toBe(0);
  expect(summary.numerator).toBe(summary.truePositive+summary.trueNegative);
  expect(summary.truePositive+summary.falsePositive+summary.trueNegative+summary.falseNegative).toBe(3000);
  expect(summary.accuracyPercent).toBe(summary.numerator/summary.denominator*100); expect(summary.scope).toContain('not pilot');
  expect(summary.nonDuplicatePairs).toBe(1000);expect(summary.falseMatches).toBe(summary.falsePositive);expect(summary.falseMatchRatePercent).toBe(summary.falsePositive/1000*100);expect(summary.runtimeMs).toBeGreaterThanOrEqual(0);expect(summary.runAt).toBeTruthy();expect(summary.label).toBe('SYNTHETIC DATA - not a real-world accuracy claim');
  expect(summary.fixtureHash).toMatch(/^[a-f\d]{64}$/); expect(fetch).not.toHaveBeenCalled();
});
it('[A-N48] unavailable matcher policy reports UNKNOWN with zero coverage and no invented accuracy', async () => {
  const summary = await evaluate({configured:false,reason:'POLICY_NOT_CONFIGURED'},fixtures().slice(0,3));
  expect(summary).toMatchObject({status:'UNKNOWN',accuracyPercent:null,evaluatedAccuracyPercent:null,numerator:0,denominator:3,evaluated:0,unknown:3,coveragePercent:0});
});
