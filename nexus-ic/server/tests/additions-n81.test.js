import { describe, expect, it } from 'vitest';
import { actionSummary, validateProceedReason } from '../src/modules/additions/n81-live-conflict-warning/service.js';

describe('[A-N81] live conflict warning', () => {
  it('[A-N81] requires a reason before proceeding after REVIEW', () => {
    expect(() => validateProceedReason('   ')).toThrowError('PROCEED_REASON_REQUIRED');
    expect(validateProceedReason('Coordinate with PGRC first')).toBe('Coordinate with PGRC first');
  });

  it('shows only scoped action metadata, never case narrative or reporter identity', () => {
    const summary = actionSummary(
      { bureau: 'RB', actionType: 'INSPECTION', at: new Date('2026-10-22T10:00:00Z'), subjectKey: 'opaque' },
      { masterCaseId: 'NX-2026-001002', narrative: 'private grievance text', reporterId: 'RP-private' },
    );
    expect(summary).toEqual({ bureau: 'RB', actionType: 'INSPECTION', at: new Date('2026-10-22T10:00:00Z'), caseId: 'NX-2026-001002' });
    expect(JSON.stringify(summary)).not.toMatch(/private|narrative|reporter/i);
  });
});
