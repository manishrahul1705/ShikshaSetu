import mongoose from 'mongoose';
import User from '../../auth/User.js';
import Case from '../../cases/Case.js';
import Institution from '../../institutions/Institution.js';
import { JudgeScenario } from '../n46-judge-mode/service.js';
import { generateMasterCaseId } from '../../cases/caseService.js';
import { getReporterId } from '../../identity/index.js';
import { sendQuery } from '../../queries/queryService.js';
import { requestLeave } from '../../absence/absenceService.js';
import { checkAction, proceedAction } from '../../prevent/stage2.js';
import { CaseAction } from '../../prevent/models.js';
import { propose, decide, issue, reply, event } from './service.js';
import * as locker from '../n83-document-locker/service.js';
import { monthlyPdf } from '../n87-monthly-report/pdf.js';

// Invoked only by the explicitly guarded showcase seed, never by a live route.
export async function seedProblemStatement() {
  if (!mongoose.connection.name.endsWith('_showcase')) throw new Error('SHOWCASE_DATABASE_REQUIRED');
  const [rb, pg, institution, student, scenario] = await Promise.all([
    User.findOne({username:'rb_officer1'}), User.findOne({username:'pgrc_officer1'}),
    User.findOne({username:'inst_admin1'}), User.findOne({username:'trust_student_verified'}), JudgeScenario.findOne().sort({createdAt:-1})]);
  const usedPids = await CaseAction.distinct('institutionPid');
  const institutions = await Institution.find({pid:{$nin:[scenario.institutionPid,...usedPids]}}).sort({pid:1}).limit(7);
  institutions.unshift(await Institution.findOne({pid:scenario.institutionPid}));
  const report = { institutions: [], requests: [], checks: {}, leaveOfficers: [] };
  const reporterId = await getReporterId(student.id);
  for (const [index, inst] of institutions.entries()) {
    const admin = index === 0 ? institution : await User.create({username:`ps_institution_${index+1}`, displayName:`Institution office ${index+1}`, role:'institution_admin', institutionPid:inst.pid, passwordHash:institution.passwordHash});
    if (index === 0) { admin.institutionPid = inst.pid; await admin.save(); }
    const cases = [];
    for (const officer of [rb,pg]) {
      const received = new Date(); received.setUTCMonth(received.getUTCMonth() - index % 6);
      const c = await Case.create({masterCaseId:await generateMasterCaseId(new Date().getFullYear()), reporterId, institutionPid:inst.pid,
        pidSnapshot:{pid:inst.pid, name:inst.name, region:inst.region, state:inst.state}, category:'Fee Dispute', subCategory:'Refund Denial',
        narrative:'The laboratory fee refund remains pending after a written request.', narrativeHash:`ps-story-${index}-${officer.bureau}`,
        status:'Under Process', owningBureau:officer.bureau, currentOwner:{office:officer.bureau,role:officer.role,officerId:officer._id,assignedAt:received}, createdAt:received});
      await event(officer,'showcase.case_created',c.id,{receivedAt:received}); cases.push(c);
    }
    report.institutions.push({pid:inst.pid,cases:cases.map(c=>c.masterCaseId)});
    if (index === 7) {
      report.checks.unknown = await checkAction(rb,{caseId:cases[0].id,actionType:'INSPECTION',details:{subject:'Laboratory inspection'}});
      continue;
    }
    const bytes = monthlyPdf({month:new Date().toISOString().slice(0,7),scope:'Institution fee notification',denominator:0,incompleteHistoryCases:0,rows:[]}, {footer:'Institution submission',invisible:'',code:''});
    const version = await locker.upload(admin,{documentType:'Fee notification',name:'fee-notification.pdf',mimeType:'application/pdf',content:bytes.toString('base64')});
    if (index === 0) await locker.upload(admin,{documentType:'Fee notification',name:'fee-notification-v2.pdf',mimeType:'application/pdf',content:Buffer.concat([bytes,Buffer.from('\n% Revised notification')]).toString('base64')});
    const grant = await locker.requestAccess(rb,{versionId:version.id,caseId:cases[0].id});
    if (index % 3 !== 2) await locker.decide(admin,grant.id,{expiresAt:new Date(Date.now()+7*86400000).toISOString()});
    if (index === 3) await locker.decide(admin,grant.id,{revoke:true});
    const queryIds = [];
    for (const [n,officer] of [rb,pg].entries()) {
      const q = await sendQuery(officer,{caseId:cases[n].id,recipientType:'institution',queryText:'Fee notification',proceedReason:'Prepare one coordinated request with independent office review.'}); queryIds.push(q.id);
    }
    let request = await propose(rb,{institutionPid:inst.pid,queryIds,coverNote:'Please provide the fee notification once and reply to each owning office item.'});
    if (index !== 1) {
      for (const [n,officer] of [rb,pg].entries()) await decide(officer,request.id,request.items.find(i=>i.caseId===cases[n].masterCaseId).id,index===2 && n===1?'WITHDRAWN':'CONFIRMED');
    }
    if (index === 0 || index >= 3) {
      request = await issue(rb,request.id);
      if (index >= 4) await reply(admin,request.id,request.items[0].id,{responseText:'The current fee notification is available in the document locker.'});
    }
    report.requests.push({id:request.id,pid:inst.pid,status:request.status});
    if (index === 0) {
      report.checks.review = await checkAction(rb,{caseId:cases[0].id,actionType:'DOCUMENT_REQUEST',details:{subject:'Fee notification'}});
      report.checks.clear = await checkAction(rb,{caseId:cases[0].id,actionType:'INSPECTION',details:{subject:'Separate accessibility inspection'}});
      await sendQuery(rb,{caseId:cases[0].id,recipientType:'complainant',queryText:'Please confirm the date of your written refund request.'});
    }
  }
  for (let n=1;n<=2;n++) {
    const officer = await User.create({username:`ps_leave_${n}`,displayName:`Relief officer ${n}`,role:'bureau_officer',bureau:rb.bureau,passwordHash:rb.passwordHash});
    await requestLeave(officer,{reason:'Scheduled leave with no open case ownership',endDate:new Date(Date.now()+7*86400000)});
    report.leaveOfficers.push(officer.username);
  }
  await event(rb,'showcase.ps_features_seeded','N81-N89',{institutions:report.institutions.length,requests:report.requests.length});
  return report;
}
