import Query from '../../queries/models.js';
import { formatComplainantView } from '../../lifecycle/lifecycleService.js';
export function truthfulStatus(c) {
  if (['SUBMITTED', 'Submitted', 'Registered', 'REGISTERED'].includes(c.status) && ['REQUESTED', 'ACCEPTED'].includes(c.transferStatus)) return c.transferStatus === 'ACCEPTED' ? 'Transfer Accepted' : 'Transfer Requested';
  return c.status === 'SUBMITTED' ? 'Registered' : c.status;
}
export async function nextStepView(c, now = new Date(), suppliedQueries) {
  const base = formatComplainantView(c);
  const queries = suppliedQueries || await Query.find({ caseId: c._id, recipientType: 'complainant' }).sort({ queriedAt: 1 }).lean();
  const pending = queries.some(q => q.status === 'PENDING');
  const status = truthfulStatus(c);
  const nextStepKey = pending ? 'reply' : /closed|disposed/i.test(status) ? 'closed' : c.transferStatus === 'REQUESTED' ? 'transfer' : /proposed|approved/i.test(status) ? 'resolution' : 'office';
  const target = base.slaClockSummary.targetResolutionDate;
  const due = target ? new Date(target) : null;
  return { status, accountableOwner: base.accountableOwner, nextStepKey,
    policyClock: due && Number.isFinite(due.getTime()) ? { dueAt: due, remainingDays: Math.ceil((due - now) / 86400000), status: base.slaClockSummary.status } : { unavailable: true },
    queries: queries.map(q => ({ id: String(q._id), office: q.senderBureau, role: q.senderRole, text: q.queryText, queriedAt: q.queriedAt, status: q.status, replyBy: null, responseText: q.responseText, respondedAt: q.respondedAt })) };
}
export async function nextStepList(rows) {
  const queries=await Query.find({caseId:{$in:rows.map(c=>c._id)},recipientType:'complainant'}).sort({queriedAt:1}).lean();
  const byCase=new Map();
  for(const q of queries){const key=String(q.caseId);if(!byCase.has(key))byCase.set(key,[]);byCase.get(key).push(q);}
  const now=new Date();
  return Promise.all(rows.map(async c=>({masterCaseId:c.masterCaseId,category:c.category,subCategory:c.subCategory,createdAt:c.createdAt,...await nextStepView(c,now,byCase.get(String(c._id)) || [])})));
}
