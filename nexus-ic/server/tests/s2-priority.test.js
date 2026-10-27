import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import Case from '../src/modules/cases/Case.js';
import {
  evaluatePriorityAndClocks,
  updateCasePriorityAndClock,
} from '../src/modules/priority/priorityService.js';
import {
  detectSensitivityKeywords,
  confirmSensitivityFlag,
} from '../src/modules/priority/sensitivityService.js';

let app;

beforeEach(async () => {
  process.env.APP_MODE = 'demo';
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
  await seedRuleBook();
});

describe('S2: Risk, Priority & Sensitivity (N19, U18, U19)', () => {
  it('[N19] priority has visible reason and never score; sensitivity works locally', async () => {
    // 1. Multilingual keyword scanning without external network or LLM
    const textEn = 'The student was subjected to severe ragging and threats';
    const textHi = 'छात्रावास में गंभीर रैगिंग और धमकी की घटना हुई';
    const textTa = 'மாணவர்கள் மீது கடுமையான ஏளனம் மற்றும் அச்சுறுத்தல்';

    const matchEn = await detectSensitivityKeywords(textEn, 'Ragging');
    const matchHi = await detectSensitivityKeywords(textHi, 'General');
    const matchTa = await detectSensitivityKeywords(textTa, 'Discipline');

    expect(matchEn.length).toBeGreaterThan(0);
    expect(matchEn.some((m) => m.keyword.toLowerCase() === 'ragging')).toBe(true);

    expect(matchHi.length).toBeGreaterThan(0);
    expect(matchHi.some((m) => m.keyword === 'रैगिंग')).toBe(true);

    expect(matchTa.length).toBeGreaterThan(0);
    expect(matchTa.some((m) => m.keyword === 'ஏளனம்')).toBe(true);

    // 2. Evaluate priority: must have plain reason text, NEVER numerical opaque score
    const evalResult = await evaluatePriorityAndClocks('Ragging', 'Threat', textEn);
    expect(evalResult.priority).toBeDefined();
    expect(evalResult.reason).toBeDefined();
    expect(typeof evalResult.reason).toBe('string');
    expect(evalResult.reason.length).toBeGreaterThan(5);
    // Explicit assertion: No opaque probability score field is exposed as final authority
    expect(evalResult.score).toBeUndefined();
    expect(evalResult.initialClockSegment).toBeDefined();
    expect(evalResult.initialClockSegment.targetResolutionDate).toBeInstanceOf(Date);
  });

  it('[U18] sensitive category is flagged, human-confirmed, and restricted', async () => {
    // Create case with suggested sensitivity flag
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000018',
      reporterId: 'reporter_u18',
      institutionPid: '1-1000000001',
      category: 'Ragging',
      subCategory: 'Hostel',
      narrative: 'Senior students threatening and harassing juniors',
      narrativeHash: 'hash_u18_001',
      priority: 'high',
      status: 'SUBMITTED',
      owningBureau: 'PGRC',
      sensitivityFlags: [
        {
          flag: 'SENSITIVE_KEYWORD',
          keyword: 'threatening',
          detectedAt: new Date(),
          status: 'SUGGESTED',
        },
      ],
      synthetic: true,
    });

    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'supervisor1', password: DEMO_PASSWORD })
      .expect(200);

    // Human supervisor confirms the sensitivity flag
    const confirmRes = await agent
      .post(`/api/v1/priority/${caseDoc._id}/confirm-sensitive`)
      .send({ flagIndex: 0, reason: 'Confirmed by Anti-Ragging Cell Supervisor' })
      .expect(200);

    expect(confirmRes.body.success).toBe(true);
    // Confirmation automatically escalates priority to urgent
    expect(confirmRes.body.priority).toBe('urgent');
    expect(confirmRes.body.sensitivityFlags[0].status).toBe('CONFIRMED');

    // Case is now restricted under S25: institution_admin cannot access narrative or documents
    const instAgent = supertest.agent(app);
    await instAgent
      .post('/api/v1/auth/login')
      .send({ username: 'inst_admin1', password: DEMO_PASSWORD })
      .expect(200);

    const getRes = await instAgent.get(`/api/v1/cases/${caseDoc.masterCaseId}`).expect(200);
    expect(getRes.body.narrative).toContain('[RESTRICTED: Sensitive case narrative withheld]');
  });

  it('[U19] priority change alters clock via active rule version non-retroactively', async () => {
    // 1. Create a case with normal priority and standard 30-day resolution target
    const caseDoc = await Case.create({
      masterCaseId: 'NX-2026-000019',
      reporterId: 'reporter_u19',
      institutionPid: '1-1000000001',
      category: 'Infrastructure',
      subCategory: 'Lab Equipment',
      narrative: 'Defective laboratory equipment',
      narrativeHash: 'hash_u19_001',
      priority: 'normal',
      status: 'SUBMITTED',
      owningBureau: 'RB',
      synthetic: true,
    });

    // Start initial clock segment (standard normal = 30 days)
    await updateCasePriorityAndClock(caseDoc._id, 'normal', 'Initial intake classification');

    const initialCase = await Case.findById(caseDoc._id);
    expect(initialCase.slaClock.length).toBe(1);
    const seg1 = initialCase.slaClock[0];
    expect(seg1.priority).toBe('normal');
    expect(seg1.ruleVersion).toBe('DEMO-CASE-STANDARD-v1');
    expect(seg1.status).toBe('RUNNING');

    // 2. Priority change to urgent (e.g. safety hazard identified)
    const officerUser = { username: 'supervisor1', role: 'supervisor' };
    const updatedCase = await updateCasePriorityAndClock(
      caseDoc._id,
      'urgent',
      'High voltage safety hazard discovered during inspection',
      officerUser
    );

    expect(updatedCase.priority).toBe('urgent');
    expect(updatedCase.slaClock.length).toBe(2);

    // Verify non-retroactive: Segment 1 was ended, not modified or erased
    const seg1After = updatedCase.slaClock[0];
    expect(seg1After.status).toBe('COMPLETED');
    expect(seg1After.endedAt).toBeInstanceOf(Date);

    // Segment 2 started with DEMO-CASE-PRIORITY-v1 active version (7 days target)
    const seg2 = updatedCase.slaClock[1];
    expect(seg2.priority).toBe('urgent');
    expect(seg2.ruleVersion).toBe('DEMO-CASE-PRIORITY-v1');
    expect(seg2.status).toBe('RUNNING');
    expect(seg2.startedAt.getTime()).toBeGreaterThanOrEqual(seg1After.endedAt.getTime());
  });
});
