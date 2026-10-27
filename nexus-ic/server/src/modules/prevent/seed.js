import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { getReporterId, isVerified, getVerifiedInstitutionPid } from '../identity/index.js';
import User from '../auth/User.js';
import Institution from '../institutions/Institution.js';
import Case from '../cases/Case.js';
import { generateMasterCaseId } from '../cases/caseService.js';
import { listInstitutions } from '../registry/RegistrySimulator.js';
import { hash, audit } from './access.js';
export async function seedPreventDemo() {
  if (process.env.APP_MODE !== 'demo' || !/_demo$/.test(mongoose.connection.name || '')) throw new Error('DEMO_DATABASE_REQUIRED');
  const student = await User.findOne({ username: 'trust_student_verified' });
  const faculty = await User.findOne({ username: 'trust_faculty_verified' });
  const officer = await User.findOne({ username: 'rb_officer1' });
  if (!student || !faculty || !officer || !await isVerified(student.id) || !await isVerified(faculty.id)) throw new Error('IDENTITY_SEED_REQUIRED');
  const pid = await getVerifiedInstitutionPid(student.id);
  if (!pid) throw new Error('VERIFIED_INSTITUTION_REQUIRED');
  const institution = listInstitutions(1)[0];
  if (!await Institution.exists({ pid })) {
    await Institution.create({ pid, name: institution.name, state: institution.state, region: institution.region, type: institution.type, approvalStatus: institution.approvalStatus, synthetic: true });
    await audit({ id: officer.id, role: officer.role }, 'demo.institution.seeded', pid);
  }
  const narrative = 'Synthetic laboratory refund fee remains unpaid after request';
  const ids = [];
  for (const user of [student, faculty]) {
    const reporterId = await getReporterId(user.id), narrativeHash = hash(narrative.trim());
    let row = await Case.findOne({ reporterId, institutionPid: pid, narrativeHash });
    if (!row) {
      row = await Case.create({ masterCaseId: await generateMasterCaseId(new Date().getFullYear()), reporterId,
        ...(Case.schema.path('userId') ? { userId: user._id } : {}), institutionPid: pid, category: 'Fee Dispute', subCategory: 'Refund Denial',
        narrative, narrativeHash, languageTag: 'en', owningBureau: officer.bureau,
        pidSnapshot: { pid, region: institution.region }, status: 'SUBMITTED', routingDecisionId: null, synthetic: true });
      await audit({ id: officer.id, role: officer.role }, 'demo.case.seeded', row.masterCaseId);
    }
    ids.push(row.masterCaseId);
  }
  return { synthetic: true, institutionPid: pid, cases: ids };
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await import('dotenv/config');
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/awaaz_dastak_demo';
    if (!new URL(uri).pathname.endsWith('_demo')) throw new Error('DEMO_DATABASE_REQUIRED');
    await mongoose.connect(uri);
    console.log(JSON.stringify(await seedPreventDemo()));
  } finally { await mongoose.disconnect(); }
}
