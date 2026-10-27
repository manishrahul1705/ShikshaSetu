import Case from '../../cases/Case.js';
import Query from '../../queries/models.js';
import { scopedCases } from '../../impact/impactService.js';
import { linkedInstitution } from '../../institutionview/institutionViewService.js';
import { CombinedRequest, officers, fail } from '../n82-combined-request/service.js';
import { LockerVersion } from '../n83-document-locker/service.js';
export async function responseRecord(user, pid) {
  let cases;
  if (user.role === 'institution_admin') { pid = await linkedInstitution(user); cases = await Case.find({ institutionPid: pid }).select('_id').lean(); }
  else { if (!officers.includes(user.role)) throw fail(403,'INSUFFICIENT_PERMISSIONS');cases = (await scopedCases(user)).filter(c=>c.institutionPid===pid); }
  const ids=cases.map(c=>c._id);
  if (user.role !== 'institution_admin' && !ids.length) throw fail(404,'INSTITUTION_NOT_FOUND');
  const queries=await Query.find({caseId:{$in:ids},recipientType:'institution'}).lean();
  const combined=await CombinedRequest.find({institutionPid:pid,status:'ISSUED','items.caseId':{$in:ids}}).lean();
  const visible=new Set(ids.map(String)); const items=combined.flatMap(r=>r.items.filter(i=>i.decision==='CONFIRMED' && visible.has(String(i.caseId))));
  const byId=new Map(queries.map(q=>[String(q._id),q]));
  const dated=items.filter(i=>i.replyBy);
  return {scope:`Institution ${pid}; cases visible to your office`,queriesOnTime:{numerator:dated.filter(i=>{const q=byId.get(String(i.queryId));return q?.respondedAt && new Date(q.respondedAt)<=new Date(i.replyBy);}).length,denominator:dated.length,unavailable:dated.length===0},combinedAnswered:{numerator:items.filter(i=>byId.get(String(i.queryId))?.status==='RESPONDED').length,denominator:items.length},documentsInLocker:await LockerVersion.countDocuments({institutionPid:pid}),redressalPolicy:'policy not configured'};
}
