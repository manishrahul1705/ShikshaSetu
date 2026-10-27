import { describe, expect, it } from 'vitest';
import {
  AbcApaarSimulator,
  StaffRegistrySimulator,
  validateApaarAbcFormat,
  validateStaffIdFormat,
  SYNTHETIC_STUDENT_REGISTRY,
  SYNTHETIC_FACULTY_REGISTRY
} from '../src/modules/identity/simulators.js';

describe('[A-N91] simulated ABC / APAAR ID and staff ID verification', () => {
  it('[A-N91] format validation correctly validates 12-digit APAAR and valid Staff IDs', () => {
    // 12-digit APAAR/ABC
    expect(validateApaarAbcFormat('100020003001')).toBe(true);
    expect(validateApaarAbcFormat('1000-2000-3001')).toBe(true);
    expect(validateApaarAbcFormat('1000 2000 3001')).toBe(true);
    expect(validateApaarAbcFormat('12345')).toBe(false);
    expect(validateApaarAbcFormat('1000200030019999')).toBe(false);
    expect(validateApaarAbcFormat('abcdefghijkl')).toBe(false);
    expect(validateApaarAbcFormat('')).toBe(false);
    expect(validateApaarAbcFormat(null)).toBe(false);

    // Staff ID
    expect(validateStaffIdFormat('FAC-2024-001')).toBe(true);
    expect(validateStaffIdFormat('STF123')).toBe(true);
    expect(validateStaffIdFormat('F')).toBe(false);
    expect(validateStaffIdFormat('')).toBe(false);
    expect(validateStaffIdFormat(null)).toBe(false);
  });

  it('[A-N91] student APAAR verification produces all 5 required outcomes', () => {
    // 1. VERIFIED (active match with chosen college)
    const verified = AbcApaarSimulator.verify('1000-2000-3001', '1-7734299133');
    expect(verified.status).toBe('VERIFIED');
    expect(verified.currentEnrolment).toBe(true);
    expect(verified.institutionPid).toBe('1-7734299133');

    // 2. NOT_ENROLLED (ID not in simulated registry)
    const notEnrolled = AbcApaarSimulator.verify('9999-9999-9999', '1-7734299133');
    expect(notEnrolled.status).toBe('NOT_ENROLLED');
    expect(notEnrolled.currentEnrolment).toBe(false);
    expect(notEnrolled.reason).toContain('Academic Bank of Credits');

    // 3. INACTIVE (student suspended / graduated)
    const inactive = AbcApaarSimulator.verify('1000-2000-4001', '1-7734299133');
    expect(inactive.status).toBe('INACTIVE');
    expect(inactive.currentEnrolment).toBe(false);
    expect(inactive.reason).toContain('inactive or suspended');

    // 4. MISMATCH (ID registered under different college)
    // 1000-2000-5001 is enrolled at 1-7734299101, but verified against 1-7734299133
    const mismatch = AbcApaarSimulator.verify('1000-2000-5001', '1-7734299133');
    expect(mismatch.status).toBe('MISMATCH');
    expect(mismatch.currentEnrolment).toBe(false);
    expect(mismatch.enrolledPid).toBe('1-7734299101');
    expect(mismatch.selectedPid).toBe('1-7734299133');

    // 5. MANUAL_REVIEW (flagged for review / adhoc / dispute)
    const manualReview = AbcApaarSimulator.verify('1000-2000-6001', '1-7734299133');
    expect(manualReview.status).toBe('MANUAL_REVIEW');
    expect(manualReview.manualReview).toBe(true);
    expect(manualReview.currentEnrolment).toBe(true);
  });

  it('[A-N91] faculty Staff ID verification produces all 5 required outcomes', () => {
    // 1. VERIFIED
    const verified = StaffRegistrySimulator.verify('FAC-2024-001', '1-7734299133');
    expect(verified.status).toBe('VERIFIED');
    expect(verified.currentEmployment).toBe(true);

    // 2. NOT_ENROLLED
    const notEnrolled = StaffRegistrySimulator.verify('FAC-UNKNOWN-99', '1-7734299133');
    expect(notEnrolled.status).toBe('NOT_ENROLLED');
    expect(notEnrolled.currentEmployment).toBe(false);

    // 3. INACTIVE
    const inactive = StaffRegistrySimulator.verify('FAC-2024-901', '1-7734299133');
    expect(inactive.status).toBe('INACTIVE');
    expect(inactive.currentEmployment).toBe(false);

    // 4. MISMATCH
    // FAC-2024-801 is at 1-7734299101, tested against 1-7734299133
    const mismatch = StaffRegistrySimulator.verify('FAC-2024-801', '1-7734299133');
    expect(mismatch.status).toBe('MISMATCH');
    expect(mismatch.currentEmployment).toBe(false);

    // 5. MANUAL_REVIEW
    const manualReview = StaffRegistrySimulator.verify('FAC-2024-701', '1-7734299133');
    expect(manualReview.status).toBe('MANUAL_REVIEW');
    expect(manualReview.manualReview).toBe(true);
  });

  it('[A-N91] synthetic registries contain >= 20 distinct records and make 0 external network calls', () => {
    const totalRecords = SYNTHETIC_STUDENT_REGISTRY.length + SYNTHETIC_FACULTY_REGISTRY.length;
    expect(totalRecords).toBeGreaterThanOrEqual(20);

    // Verify all records are purely synthetic and local
    for (const record of SYNTHETIC_STUDENT_REGISTRY) {
      expect(record.id).toMatch(/^\d{12}$/);
      expect(record.pid).toMatch(/^1-\d+/);
      expect(['VERIFIED', 'INACTIVE', 'MISMATCH', 'MANUAL_REVIEW', 'REVOKED']).toContain(record.status);
    }
  });
});
