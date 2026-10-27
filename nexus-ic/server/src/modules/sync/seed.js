import Case from '../cases/Case.js';
import { Transfer } from '../trace/models.js';
import { Coordination, CoordinationTask } from './models.js';
import Query from '../queries/models.js';
import { FieldVisit } from '../fieldwork/models.js';
import User from '../auth/User.js';

/**
 * Seed S3 fixtures for local run & npm run reset:
 * - One case with an open transfer
 * - One case with a rejected transfer
 * - One case with an overdue unacknowledged transfer
 * - One SYNC coordination between PGRC and RB
 * - One query to a complainant
 * - One field visit
 */
export async function seedS3Fixtures() {
  const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
  const rbOfficer = await User.findOne({ username: 'rb_officer1' });
  const roOfficer = await User.findOne({ username: 'regional1' });
  const student = await User.findOne({ username: 'student1' });

  // 1. One case with an open transfer
  let openCase = await Case.findOne({ masterCaseId: 'NX-2026-000801' });
  if (!openCase) {
    openCase = await Case.create({
      masterCaseId: 'NX-2026-000801',
      reporterId: 'RP-SEED-801',
      institutionPid: '1-1000000001',
      category: 'Curriculum',
      subCategory: 'Syllabus',
      narrative: 'AICTE updated model curriculum not adopted by department.',
      narrativeHash: 'hash_s3_seed_801',
      status: 'Under Process',
      owningBureau: 'PGRC',
      transferStatus: 'REQUESTED',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer?._id,
        officerName: pgrcOfficer?.displayName,
      },
    });

    await Transfer.create({
      caseId: openCase._id,
      masterCaseId: openCase.masterCaseId,
      fromBureau: 'PGRC',
      toBureau: 'RB',
      reason: 'Curriculum compliance falls under Regulation Bureau mandate',
      senderOfficerId: pgrcOfficer?._id,
      requestedAt: new Date(),
      dueAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      status: 'REQUESTED',
    });
  }

  // 2. One case with a rejected transfer
  let rejectedCase = await Case.findOne({ masterCaseId: 'NX-2026-000802' });
  if (!rejectedCase) {
    rejectedCase = await Case.create({
      masterCaseId: 'NX-2026-000802',
      reporterId: 'RP-SEED-802',
      institutionPid: '1-1000000001',
      category: 'Governance',
      subCategory: 'Administration',
      narrative: 'Administrative dispute regarding governing body meetings.',
      narrativeHash: 'hash_s3_seed_802',
      status: 'Under Process',
      owningBureau: 'PGRC',
      transferStatus: 'REJECTED',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer?._id,
        officerName: pgrcOfficer?.displayName,
      },
    });

    await Transfer.create({
      caseId: rejectedCase._id,
      masterCaseId: rejectedCase.masterCaseId,
      fromBureau: 'PGRC',
      toBureau: 'RB',
      reason: 'Administrative scrutiny required',
      senderOfficerId: pgrcOfficer?._id,
      requestedAt: new Date(Date.now() - 48 * 3600 * 1000),
      status: 'REJECTED',
      rejectionReason: 'Institution must first submit minutes of governing council before RB can review',
      receiverOfficerId: rbOfficer?._id,
      acknowledgedAt: new Date(),
      dueAt: new Date(Date.now()),
    });
  }

  // 3. One overdue unacknowledged transfer
  let overdueCase = await Case.findOne({ masterCaseId: 'NX-2026-000803' });
  if (!overdueCase) {
    overdueCase = await Case.create({
      masterCaseId: 'NX-2026-000803',
      reporterId: 'RP-SEED-803',
      institutionPid: '1-1000000001',
      category: 'Infrastructure',
      subCategory: 'Safety',
      narrative: 'Critical safety hazard in chemical engineering laboratory.',
      narrativeHash: 'hash_s3_seed_803',
      status: 'Under Process',
      owningBureau: 'PGRC',
      transferStatus: 'REQUESTED',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer?._id,
        officerName: pgrcOfficer?.displayName,
      },
    });

    await Transfer.create({
      caseId: overdueCase._id,
      masterCaseId: overdueCase.masterCaseId,
      fromBureau: 'PGRC',
      toBureau: 'RB',
      reason: 'Chemical laboratory emergency safety compliance',
      senderOfficerId: pgrcOfficer?._id,
      requestedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      dueAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      status: 'REQUESTED',
      isEscalated: true,
      escalatedAt: new Date(Date.now() - 24 * 3600 * 1000),
    });
  }

  // 4. One SYNC coordination between PGRC and RB
  let coordCase = await Case.findOne({ masterCaseId: 'NX-2026-000804' });
  if (!coordCase) {
    coordCase = await Case.create({
      masterCaseId: 'NX-2026-000804',
      reporterId: 'RP-SEED-804',
      institutionPid: '1-1000000001',
      category: 'Admission',
      subCategory: 'Quota',
      narrative: 'Non-compliance with admission quota norms.',
      narrativeHash: 'hash_s3_seed_804',
      status: 'Under Process',
      owningBureau: 'PGRC',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer?._id,
      },
    });

    const coord = await Coordination.create({
      institutionPid: '1-1000000001',
      caseIds: [coordCase._id],
      participatingBureaus: ['PGRC', 'RB'],
      leadBureau: 'PGRC',
      status: 'AGREED',
      agreedNextSteps: {
        steps: 'Joint verification of admission merit lists and seat matrix by 20th November.',
        agreedBy: [pgrcOfficer, rbOfficer].filter(Boolean).map((o) => ({ officerId: o._id, bureau: o.bureau, role: o.role })),
        agreedAt: new Date(),
      },
    });

    await CoordinationTask.create({
      coordinationId: coord._id,
      caseId: coordCase._id,
      assignedBureau: 'PGRC',
      title: 'Interview affected student applicants',
      status: 'ACKNOWLEDGED',
      ackDueAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      acknowledgedAt: new Date(),
      completionDueAt: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      assignedOfficerId: pgrcOfficer?._id,
    });

    await CoordinationTask.create({
      coordinationId: coord._id,
      caseId: coordCase._id,
      assignedBureau: 'RB',
      title: 'Verify AICTE intake approval letters against admitted numbers',
      status: 'PENDING',
      ackDueAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      completionDueAt: new Date(Date.now() + 10 * 24 * 3600 * 1000),
    });
  }

  // 5. One query to a complainant
  let queryCase = await Case.findOne({ masterCaseId: 'NX-2026-000805' });
  if (!queryCase) {
    queryCase = await Case.create({
      masterCaseId: 'NX-2026-000805',
      reporterId: student?.reporterId || 'RP-STUDENT-01',
      institutionPid: '1-1000000001',
      category: 'Fee',
      subCategory: 'Refund',
      narrative: 'Hostel caution deposit not refunded upon graduation.',
      narrativeHash: 'hash_s3_seed_805',
      status: 'Under Process',
      owningBureau: 'PGRC',
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer?._id,
      },
    });

    await Query.create({
      caseId: queryCase._id,
      masterCaseId: queryCase.masterCaseId,
      senderOfficerId: pgrcOfficer?._id,
      senderRole: 'bureau_officer',
      senderBureau: 'PGRC',
      recipientType: 'complainant',
      queryText: 'Please upload a copy of the no-dues clearance certificate issued by the hostel warden.',
      queriedAt: new Date(),
      status: 'PENDING',
    });
  }

  // 6. One field visit
  let visitCase = await Case.findOne({ masterCaseId: 'NX-2026-000806' });
  if (!visitCase) {
    visitCase = await Case.create({
      masterCaseId: 'NX-2026-000806',
      reporterId: 'RP-SEED-806',
      institutionPid: '1-1000000001',
      category: 'Infrastructure',
      subCategory: 'Facilities',
      narrative: 'Hostel mess hygiene and sanitation standards non-compliant.',
      narrativeHash: 'hash_s3_seed_806',
      status: 'Under Process',
      owningBureau: 'PGRC',
      pidSnapshot: { region: 'Northern' },
      currentOwner: {
        office: 'PGRC',
        role: 'bureau_officer',
        officerId: pgrcOfficer?._id,
      },
    });

    await FieldVisit.create({
      caseId: visitCase._id,
      institutionPid: visitCase.institutionPid,
      inspectorOfficerId: roOfficer?._id,
      inspectorName: roOfficer?.displayName,
      regionalOffice: 'Northern',
      visitDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      purpose: 'Surprise inspection of hostel mess and food preparation facilities',
      status: 'SCHEDULED',
    });
  }

  return { seeded: true };
}