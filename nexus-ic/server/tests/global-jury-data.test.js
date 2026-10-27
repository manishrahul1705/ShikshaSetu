import { beforeEach, expect, it } from 'vitest';
import { fictionalInstitutions } from '../src/modules/registry/catalogue.js';
import { classifyDemoCase } from '../src/modules/sla/classify.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';
import { createClockSegment } from '../src/modules/priority/priorityService.js';
import Rule from '../src/modules/rulebook/models.js';
import Case from '../src/modules/cases/Case.js';
import AuditEvent from '../src/modules/audit/AuditEvent.js';
import { scanSla, SlaEvent } from '../src/modules/sla/service.js';

const policy = { approvedFor: 'SYNTHETIC_DEMO', calendarDays: 14, nearDueHours: 72 };
const receivedAt = new Date('2026-10-01T03:30:00Z');
beforeEach(() => { process.env.APP_MODE = 'demo'; });

it('[N10] the catalogue is reproducible, distinct, non-sequential and complete apart from deliberate ICID gaps', () => {
  const rows = fictionalInstitutions();
  expect(rows).toEqual(fictionalInstitutions());
  expect(new Set(rows.map(row => row.pid)).size).toBe(120);
  expect(new Set(rows.map(row => row.name.split(' ').slice(0, 2).join(' '))).size).toBe(120);
  expect(rows.filter(row => !row.icid)).toHaveLength(6);
  for (const row of rows) {
    expect(row.pid).toMatch(/^1-\d{10}$/);
    expect(row.pid).not.toMatch(/^1-1000000/);
    expect(row.district).toBeTruthy(); expect(row.establishedYear).toBeGreaterThan(1900);
    expect(row.intake).toBeGreaterThan(0); expect(row.approvalValidUntil).toMatch(/^20\d{2}-06-30$/);
    expect(row.campuses[0].parentPid).toBe(row.pid);
  }
  expect(rows.some(row => row.campuses.length > 1)).toBe(true);
});

it('[D01] the source-defined standard clock is approved by a different user and ends exactly receipt plus 14 calendar days', async () => {
  await seedDemoAccounts(); await seedRuleBook();
  const rule = await Rule.findOne({ version: 'DEMO-CASE-STANDARD-v1', family: 'SLA' });
  expect(rule.body).toMatchObject(policy);
  expect(rule.status).toBe('approved'); expect(rule.dryRunPassed).toBe(true);
  expect(String(rule.approvedBy)).not.toBe(String(rule.requestedBy));
  const segment = await createClockSegment('normal', 'Fee Dispute', receivedAt);
  expect(segment.targetResolutionDate.toISOString()).toBe('2026-10-15T03:30:00.000Z');
  expect(segment.nearDueDate.toISOString()).toBe('2026-10-12T03:30:00.000Z');
  expect(await AuditEvent.countDocuments({ action: /^rulebook.version./, 'meta.version': rule.version })).toBe(3);
});

it('[D02] near-due starts at precisely 72 hours remaining and never earlier', () => {
  expect(classifyDemoCase({ receivedAt, now: '2026-10-12T03:29:59.999Z', policy }).state).toBe('ON_TRACK');
  expect(classifyDemoCase({ receivedAt, now: '2026-10-12T03:30:00.000Z', policy }).state).toBe('NEAR_DUE');
  expect(classifyDemoCase({ receivedAt, now: '2026-10-15T03:30:00.000Z', policy }).state).toBe('NEAR_DUE');
  expect(classifyDemoCase({ receivedAt, now: '2026-10-15T03:30:00.001Z', policy }).state).toBe('OVERDUE');
});

it('[D03] real monitoring records overdue and escalation at their thresholds and retry creates no duplicate in-app notices', async () => {
  await seedDemoAccounts(); await seedRuleBook();
  const segment = await createClockSegment('normal', 'Fee Dispute', receivedAt);
  await Case.create({ masterCaseId: 'NX-2026-009001', reporterId: 'RP-7K2Q', institutionPid: fictionalInstitutions()[0].pid,
    category: 'Fee Dispute', subCategory: 'Refund Denial', narrative: 'Fictional fee concern', narrativeHash: 'jury-sla', status: 'Under Process', slaClock: [segment], synthetic: true });
  await scanSla({ now: new Date('2026-10-15T03:30:00.001Z') });
  expect(await SlaEvent.countDocuments({ state: 'OVERDUE' })).toBe(1);
  expect(await SlaEvent.countDocuments({ state: 'ESCALATED' })).toBe(0);
  await scanSla({ now: new Date('2026-10-16T03:30:00Z') });
  await scanSla({ now: new Date('2026-10-16T03:30:00Z') });
  expect(await SlaEvent.countDocuments()).toBe(2);
  expect(await AuditEvent.countDocuments({ action: /^sla./ })).toBe(2);
});

it('[D05] production never selects the demonstration SLA or invents a clock for a missing policy', async () => {
  await seedDemoAccounts(); await seedRuleBook(); process.env.APP_MODE = 'production';
  expect(await createClockSegment('normal', 'Fee Dispute', receivedAt)).toBeNull();
  expect(classifyDemoCase({ receivedAt, policy }).state).toBe('POLICY_NOT_CONFIGURED');
  expect(classifyDemoCase({ receivedAt, mode: 'demo' }).state).toBe('POLICY_NOT_CONFIGURED');
});
