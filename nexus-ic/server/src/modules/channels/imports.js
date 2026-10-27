import { ImportBatch } from './models.js';
import { seal, open } from '../vault/crypto.js';
import { validateImportBatch, dryRunImport, commitImport } from '../lifecycle/importEngine.js';
import { resolveIdentity, getInstitutionByPid } from '../institutions/institutionService.js';
import { parseCsv } from './csv.js';
import { demoOnly, audit, fail, uid } from './common.js';
import { resolveVerifiedReporter } from '../identity/index.js';
import Case from '../cases/Case.js';
import { canAccessCase } from '../../middleware/rbac.js';
import { digest } from './common.js';
import { importContext } from './importContext.js';

async function preflightAccess(user, records) {
  for (const row of records) {
    const matches = await Case.find({ $or: [
      { 'externalRefs.sourceSystem': row.sourceSystem, 'externalRefs.sourceCaseRef': row.sourceCaseRef },
      { reporterId: row.reporterId, institutionPid: row.institutionPid, narrativeHash: digest(row.narrative.trim()) },
    ] }).lean();
    for (const existing of matches) {
      if (!await canAccessCase(user, existing)) throw fail(404, 'IMPORT_REFERENCE_NOT_FOUND');
      if (!existing.externalRefs.some(ref => ref.sourceSystem === row.sourceSystem && ref.sourceCaseRef === row.sourceCaseRef)) throw fail(409, 'DUPLICATE_REGISTRATION');
    }
  }
}

async function classify(records) {
  const quarantined = [];
  for (const [i, row] of records.entries()) {
    const lookup = await getInstitutionByPid(row.institutionPid);
    if (!lookup.found) throw fail(400, 'UNKNOWN_INSTITUTION');
    if (await resolveIdentity(row.institutionPid, row.institutionIcid) === 'IDENTITY_REVIEW') quarantined.push(i + 1);
  }
  return quarantined;
}
async function verifyReporters(records) {
  for (const row of records) if (!await resolveVerifiedReporter(row.reporterId)) throw fail(400,'REPORTER_NOT_VERIFIED');
}
async function outcomes(user,records,quarantined) {
  await preflightAccess(user,records);
  const rows=[];
  for(const [i,row] of records.entries()) {
    let status='WOULD_CREATE';
    if(quarantined.includes(i+1)) status='IDENTITY_REVIEW';
    else {
      const existing=await Case.findOne({'externalRefs':{$elemMatch:{sourceSystem:row.sourceSystem,sourceCaseRef:row.sourceCaseRef}}}).lean();
      if(existing) {
        if(!await canAccessCase(user,existing)) throw fail(404,'IMPORT_REFERENCE_NOT_FOUND');
        status='ALREADY_IMPORTED';
      }
    }
    rows.push({row:i+1,reporterId:row.reporterId,institutionPid:row.institutionPid,institutionIcid:row.institutionIcid || 'not available',sourceSystem:row.sourceSystem,sourceRef:row.sourceRef,status});
  }
  return rows;
}
export async function previewImport(user,csv) {
  demoOnly();const ownerUserId=uid(user),records=parseCsv(csv);
  if(!records.length || records.some(row=>['reporterId','institutionPid','category','subCategory','narrative','sourceSystem','sourceCaseRef'].some(key=>!row[key]?.trim()))) throw fail(400,'IMPORT_VALIDATION_FAILED');
  const registrationKeys=records.map(row=>digest(JSON.stringify([row.reporterId,row.institutionPid,row.narrative.trim()])));
  if(new Set(registrationKeys).size!==registrationKeys.length) throw fail(409,'DUPLICATE_REGISTRATION');
  await verifyReporters(records);
  const validation=await validateImportBatch(records);
  if(validation.errorCount) throw fail(400,'IMPORT_VALIDATION_FAILED');
  const quarantined=await classify(records),rows=await outcomes(user,records,quarantined);
  const batch=await ImportBatch.create({ownerUserId,...seal({records},ownerUserId),quarantined});
  await audit(user,'import.preview',batch.id,{total:records.length,quarantined:quarantined.length});
  return {id:batch.id,state:batch.state,total:records.length,quarantined,rows,valid:validation.validCount};
}
async function owned(user,id) {
  demoOnly();const ownerUserId=uid(user);
  const batch=/^[a-f\d]{24}$/i.test(id || '') && await ImportBatch.findOne({_id:id,ownerUserId});
  if(!batch) throw fail(404,'BATCH_NOT_FOUND');
  return {batch,records:open(batch,ownerUserId).records};
}
export async function dryRun(user,id) {
  const {batch,records}=await owned(user,id);await verifyReporters(records);
  const quarantined=await classify(records),rows=await outcomes(user,records,quarantined);
  const eligible=records.filter((row,i)=>!quarantined.includes(i+1));
  const result=await dryRunImport(eligible);
  batch.state='DRY_RUN';batch.quarantined=quarantined;await batch.save();await audit(user,'import.dry_run',batch.id);
  return {id:batch.id,state:batch.state,total:records.length,ready:result.readyToImportCount,duplicates:result.duplicateCount,quarantined,rows,errorRows:result.errors.map(e=>e.row)};
}
let commits=Promise.resolve();
export function commit(user,id) {
  const next=commits.then(async()=>{
    const {batch,records}=await owned(user,id);
    if(!['DRY_RUN','COMMITTED'].includes(batch.state)) throw fail(409,'DRY_RUN_REQUIRED');
    await verifyReporters(records);
    const quarantined=await classify(records),eligible=records.filter((row,i)=>!quarantined.includes(i+1));
    await preflightAccess(user,eligible);
    const snapshots=new Map();
    for(const row of eligible) snapshots.set(row.institutionPid,(await getInstitutionByPid(row.institutionPid)).institution);
    const result=await importContext.run(snapshots,()=>commitImport(eligible,user));
    batch.state='COMMITTED';batch.quarantined=quarantined;await batch.save();
    await audit(user,'import.committed',batch.id,{created:result.createdCount,skipped:result.skippedCount,quarantined:quarantined.length});
    return {id:batch.id,state:batch.state,created:result.createdCount,skipped:result.skippedCount,quarantined,rows:await outcomes(user,records,quarantined)};
  });
  commits=next.catch(()=>{});return next;
}
export async function dataHealthReview(user) {
  const batches=await ImportBatch.find({ownerUserId:uid(user),'quarantined.0':{$exists:true}}).sort({createdAt:-1});
  const review=[];
  for(const batch of batches) {
    const {records}=open(batch,uid(user));
    for(const number of batch.quarantined) {
      const row=records[number-1];
      if(row) review.push({batchId:batch.id,row:number,institutionPid:row.institutionPid,institutionIcid:row.institutionIcid,status:'IDENTITY_REVIEW',reason:'PID_ICID_MISMATCH'});
    }
  }
  return review;
}
