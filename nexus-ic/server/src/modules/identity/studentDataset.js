import { SYNTHETIC_STUDENT_REGISTRY } from './simulators.js';
import { SYNTHETIC_AADHAAR_REGISTRY, verhoeffDigit } from './selfCheck.js';
import { fingerprint } from '../vault/crypto.js';

// Reserved email domain and deliberately non-dialable phone numbers.
// Every number and contact in this dataset is generated for local testing.
export function studentVerificationRecords() {
  return SYNTHETIC_STUDENT_REGISTRY.map((student, index) => {
    const base = String(11000000000 + index);
    const aadhaar = SYNTHETIC_AADHAAR_REGISTRY.find(row => row.personId === student.id)?.number || base + verhoeffDigit(base);
    return { ...student, abcId: student.id, apaarId: student.id, aadhaar,
      referenceHash: fingerprint(`abc-apaar-simulator:${student.id}`),
      aadhaarHash: fingerprint(`aadhaar-student-simulator:${aadhaar}`),
      studentKey: fingerprint(`student-verification:${student.id}`),
      priorClaimHashes: [fingerprint(`DEMO-student-${student.id}`), fingerprint(`DEMO-person-${fingerprint(`selfcheck-person:${student.id}`).slice(0, 24)}`)],
      programme: student.programme || 'B.Tech Computer Science',
      linkedEmail: `student.${String(index + 1).padStart(4, '0')}@example.invalid`,
      linkedPhone: `+91 00000 ${String(index + 1).padStart(5, '0')}`,
      synthetic: true,
    };
  });
}
