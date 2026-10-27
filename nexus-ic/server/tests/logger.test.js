import { describe, it, expect } from 'vitest';
import logger from '../src/config/logger.js';

describe('[S28] No complainant text in logs', () => {
  it('[S28] the logger never outputs the protected fields', () => {
    const outputs = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Intercept console
    console.log = (...args) => outputs.push(args);
    console.warn = (...args) => outputs.push(args);
    console.error = (...args) => outputs.push(args);

    try {
      const sensitiveData = {
        narrative: 'My professor harassed me',
        description: 'Detailed account of harassment',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '9876543210',
        enrolment: 'EN-2026-001234',
        identityPayload: { aadhaar: '1234-5678-9012' },
        action: 'test.log',
        caseId: 'NX-2026-000001',
      };

      logger.info(sensitiveData);
      logger.warn(sensitiveData);
      logger.error(sensitiveData);

      // Check that none of the protected values appear in output
      const fullOutput = JSON.stringify(outputs);

      expect(fullOutput).not.toContain('My professor harassed me');
      expect(fullOutput).not.toContain('Detailed account of harassment');
      expect(fullOutput).not.toContain('Priya Sharma');
      expect(fullOutput).not.toContain('priya@example.com');
      expect(fullOutput).not.toContain('9876543210');
      expect(fullOutput).not.toContain('EN-2026-001234');
      expect(fullOutput).not.toContain('1234-5678-9012');

      // Check that REDACTED appears instead
      expect(fullOutput).toContain('[REDACTED]');

      // Check that non-sensitive fields are preserved
      expect(fullOutput).toContain('test.log');
      expect(fullOutput).toContain('NX-2026-000001');
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    }
  });

  it('[S28] long free-text strings are redacted', () => {
    const outputs = [];
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = (...args) => outputs.push(args);
    console.warn = (...args) => outputs.push(args);

    try {
      const longComplaintText =
        'The professor demanded extra fees from all students in the class without providing official receipts and threatened detention if anyone complained to AICTE.';
      expect(longComplaintText.length).toBeGreaterThan(80);

      // Plain string argument > 80 chars
      logger.info(longComplaintText);
      logger.warn('Grievance: ' + longComplaintText);

      const fullOutput = JSON.stringify(outputs);
      expect(fullOutput).not.toContain(longComplaintText);
      expect(fullOutput).toContain('[REDACTED-STRING]');

      // Short strings (<= 80 chars) like action identifiers are kept
      const shortMsg = 'Action completed successfully';
      logger.info(shortMsg);
      const afterShort = JSON.stringify(outputs);
      expect(afterShort).toContain(shortMsg);
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
    }
  });

  it('[S28] sanitize handles nested objects', () => {
    const nested = {
      level1: {
        narrative: 'should be redacted',
        safe: 'should stay',
        level2: {
          email: 'deep@example.com',
          count: 42,
        },
      },
    };

    const result = logger._sanitize(nested);
    expect(result.level1.narrative).toBe('[REDACTED]');
    expect(result.level1.safe).toBe('should stay');
    expect(result.level1.level2.email).toBe('[REDACTED]');
    expect(result.level1.level2.count).toBe(42);
  });

  it('[S28] sanitize handles arrays', () => {
    const arr = [
      { name: 'secret', action: 'visible' },
      { phone: '1234567890', status: 'ok' },
    ];

    const result = logger._sanitize(arr);
    expect(result[0].name).toBe('[REDACTED]');
    expect(result[0].action).toBe('visible');
    expect(result[1].phone).toBe('[REDACTED]');
    expect(result[1].status).toBe('ok');
  });
});
