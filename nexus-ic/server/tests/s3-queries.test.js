import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import Case from '../src/modules/cases/Case.js';
import User from '../src/modules/auth/User.js';
import {
  sendQuery,
  respondToQuery,
  getQueriesForCase,
} from '../src/modules/queries/queryService.js';
import Query from '../src/modules/queries/models.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
});

describe('S3: Query and Response Loop (N70)', () => {
  it('[N70] a query and its reply are logged with times; the institution admin never sees queries addressed to the complainant', async () => {
    const pgrcOfficer = await User.findOne({ username: 'pgrc_officer1' });
    const studentUser = await User.findOne({ username: 'student1' });
    const instAdmin = await User.findOne({ username: 'inst_admin1' });

    studentUser.reporterId = 'RP-0320';
    await studentUser.save();

    instAdmin.institutionPid = '1-1000000001';
    await instAdmin.save();

    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000320',
      reporterId: 'RP-0320',
      institutionPid: '1-1000000001',
      category: 'Fee',
      subCategory: 'Excess',
      narrative: 'Excess tuition fee charged without receipt',
      narrativeHash: 'hash_n70_020',
      status: 'Under Process',
      owningBureau: 'PGRC',
    });

    // 1. Officer queries complainant
    const complainantQuery = await sendQuery(pgrcOfficer, {
      caseId: caseDoc._id,
      recipientType: 'complainant',
      queryText: 'Please submit a scanned copy of the bank debit transaction.',
    });

    expect(complainantQuery.recipientType).toBe('complainant');
    expect(complainantQuery.status).toBe('PENDING');
    expect(complainantQuery.queriedAt).toBeInstanceOf(Date);

    // 2. Officer queries institution
    const instQuery = await sendQuery(pgrcOfficer, {
      caseId: caseDoc._id,
      recipientType: 'institution',
      queryText: 'Please furnish approved fee structure under AICTE guidelines for Academic Year 2025-26.',
    });

    expect(instQuery.recipientType).toBe('institution');
    expect(instQuery.status).toBe('PENDING');
    expect(instQuery.queriedAt).toBeInstanceOf(Date);

    // 3. Complainant views queries: sees ONLY complainantQuery
    const complainantView = await getQueriesForCase(studentUser, caseDoc._id);
    expect(complainantView.length).toBe(1);
    expect(complainantView[0]._id.toString()).toBe(complainantQuery._id.toString());
    expect(complainantView[0].queryText).toContain('bank debit transaction');

    // 4. Institution admin views queries: sees ONLY instQuery
    // Institution admin NEVER sees queries addressed to the complainant (N70 requirement)
    const instView = await getQueriesForCase(instAdmin, caseDoc._id);
    expect(instView.length).toBe(1);
    expect(instView[0]._id.toString()).toBe(instQuery._id.toString());
    expect(instView[0].queryText).toContain('approved fee structure');
    expect(JSON.stringify(instView)).not.toContain('bank debit transaction');

    // 5. Complainant responds: logged with timestamp
    const beforeReply = new Date();
    const answeredQuery = await respondToQuery(studentUser, complainantQuery._id, {
      responseText: 'Uploaded transaction statement showing fee deduction of Rs. 45,000.',
    });

    expect(answeredQuery.status).toBe('RESPONDED');
    expect(answeredQuery.responseText).toContain('Uploaded transaction statement');
    expect(answeredQuery.respondedAt).toBeInstanceOf(Date);
    expect(answeredQuery.respondedAt.getTime()).toBeGreaterThanOrEqual(beforeReply.getTime());

    // 6. Officer sees all queries and their response timestamps
    const officerView = await getQueriesForCase(pgrcOfficer, caseDoc._id);
    expect(officerView.length).toBe(2);
    const answeredInOfficer = officerView.find((q) => q._id.toString() === complainantQuery._id.toString());
    expect(answeredInOfficer.status).toBe('RESPONDED');
    expect(answeredInOfficer.respondedAt).toBeDefined();
  });
});
