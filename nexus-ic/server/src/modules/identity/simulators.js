// Entirely synthetic fixtures. No external identity providers are contacted.
// Simulated ABC / APAAR verification registry (N91).
import { fictionalInstitutions } from '../registry/catalogue.js';
import { syntheticStudents } from '../registry/syntheticDataset.js';

const person = (kind, reference, extra = {}) => ({
  synthetic: true,
  personRef: `DEMO-${kind}-${reference}`,
  name: extra.name || `Synthetic ${kind} ${reference}`,
  institutionRef: extra.institutionRef || 'DEMO-INSTITUTION-1',
  institutionPid: extra.institutionPid || fictionalInstitutions()[0]?.pid || '1-7734299133',
});

// Format validators for ABC / APAAR and Faculty Staff IDs (SPEC 5, N91)
export function validateApaarAbcFormat(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const clean = raw.replace(/[\s-]/g, '');
  return /^\d{12}$/.test(clean);
}

export function validateStaffIdFormat(raw) {
  if (!raw || typeof raw !== 'string') return false;
  return /^[A-Za-z0-9\-]{3,20}$/.test(raw.trim());
}

export function normalizeId(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/[\s-]/g, '');
}

// 22+ synthetic student and faculty identity records covering all 5 verification outcomes (N91)
export const SYNTHETIC_STUDENT_REGISTRY = [
  // 1. Verified Active
  { id: '100020003001', display: '1000-2000-3001', name: 'Aarav Sharma', pid: '1-7734299133', status: 'VERIFIED', active: true },
  { id: '100020003002', display: '1000-2000-3002', name: 'Priya Patel', pid: '1-7734299133', status: 'VERIFIED', active: true },
  { id: '100020003003', display: '1000-2000-3003', name: 'Rohan Verma', pid: '1-7734299133', status: 'VERIFIED', active: true },
  { id: '100020003004', display: '1000-2000-3004', name: 'Ananya Iyer', pid: '1-7734299133', status: 'VERIFIED', active: true },
  { id: '100020003005', display: '1000-2000-3005', name: 'Vikram Singh', pid: '1-7734299101', status: 'VERIFIED', active: true },
  { id: '100020003006', display: '1000-2000-3006', name: 'Sneha Reddy', pid: '1-7734299101', status: 'VERIFIED', active: true },
  { id: '100020003007', display: '1000-2000-3007', name: 'Devendra Joshi', pid: '1-7734299102', status: 'VERIFIED', active: true },
  { id: '100020003008', display: '1000-2000-3008', name: 'Kavita Nair', pid: '1-7734299103', status: 'VERIFIED', active: true },
  // 2. Inactive / Suspended / Graduated
  { id: '100020004001', display: '1000-2000-4001', name: 'Siddharth Mehra (Suspended)', pid: '1-7734299133', status: 'INACTIVE', active: false },
  { id: '100020004002', display: '1000-2000-4002', name: 'Meera Rao (Graduated)', pid: '1-7734299101', status: 'INACTIVE', active: false },
  { id: '100020004003', display: '1000-2000-4003', name: 'Tanmay Bhatt (Inactive)', pid: '1-7734299102', status: 'INACTIVE', active: false },
  // 3. College Mismatch
  { id: '100020005001', display: '1000-2000-5001', name: 'Aditya Sen', pid: '1-7734299101', status: 'MISMATCH', active: true },
  { id: '100020005002', display: '1000-2000-5002', name: 'Ritu Kapoor', pid: '1-7734299102', status: 'MISMATCH', active: true },
  // 4. Manual Review / Disputed Flag
  { id: '100020006001', display: '1000-2000-6001', name: 'Harsh Vardhan (Review)', pid: '1-7734299133', status: 'MANUAL_REVIEW', active: true, manualReview: true },
  { id: '100020006002', display: '1000-2000-6002', name: 'Divya Khurana (Disputed)', pid: '1-7734299101', status: 'MANUAL_REVIEW', active: true, manualReview: true },
];
SYNTHETIC_STUDENT_REGISTRY.push(...syntheticStudents(1500).map(student => ({
  id: student.id, display: student.display, name: student.name, pid: student.pid,
  status: student.status, active: student.status === 'VERIFIED',
})));

export const SYNTHETIC_FACULTY_REGISTRY = [
  // 1. Faculty Verified
  { id: 'FAC-2024-001', name: 'Dr. Ramesh Sen', pid: '1-7734299133', status: 'VERIFIED', active: true },
  { id: 'FAC-2024-002', name: 'Dr. Sunita Rao', pid: '1-7734299133', status: 'VERIFIED', active: true },
  { id: 'FAC-2024-003', name: 'Prof. Amitava Ghosh', pid: '1-7734299101', status: 'VERIFIED', active: true },
  // 2. Faculty Inactive / Terminated
  { id: 'FAC-2024-901', name: 'Former Faculty X (Terminated)', pid: '1-7734299133', status: 'INACTIVE', active: false },
  // 3. Faculty College Mismatch
  { id: 'FAC-2024-801', name: 'Prof. Geeta Swaminathan', pid: '1-7734299101', status: 'MISMATCH', active: true },
  // 4. Faculty Manual Review
  { id: 'FAC-2024-701', name: 'Dr. Rajesh Pillai (Adhoc)', pid: '1-7734299133', status: 'MANUAL_REVIEW', active: true, manualReview: true },
];

export class AbcApaarSimulator {
  static verify(reference, selectedPid = null) {
    if (!reference) return null;
    const cleanRef = reference.trim();
    const cleanNorm = normalizeId(cleanRef);

    // Legacy fixture strings
    if (['STUDENT-ACTIVE', 'STUDENT-INACTIVE', 'STUDENT-SECOND'].includes(cleanRef)) {
      return {
        ...person('student', cleanRef),
        apaar: `DEMO-APAAR-${cleanRef}`,
        currentEnrolment: cleanRef !== 'STUDENT-INACTIVE',
        status: cleanRef !== 'STUDENT-INACTIVE' ? 'VERIFIED' : 'INACTIVE',
      };
    }

    // Lookup in synthetic APAAR/ABC registry
    const match = SYNTHETIC_STUDENT_REGISTRY.find(r => r.id === cleanNorm || r.display === cleanRef);
    if (!match) {
      if (!validateApaarAbcFormat(cleanRef)) return null;
      return {
        synthetic: true,
        status: 'NOT_ENROLLED',
        currentEnrolment: false,
        error: 'APAAR_OR_ABC_ID_NOT_FOUND',
        reason: 'ID not found in simulated Academic Bank of Credits / APAAR registry',
      };
    }

    if (match.status === 'MANUAL_REVIEW') {
      return {
        ...person('student', match.id, { name: match.name, institutionPid: match.pid }),
        apaar: `APAAR-${match.id}`,
        status: 'MANUAL_REVIEW',
        manualReview: true,
        currentEnrolment: true,
      };
    }

    if (match.status === 'REVOKED' || match.revoked || !match.active || match.status === 'INACTIVE') {
      return {
        ...person('student', match.id, { name: match.name, institutionPid: match.pid }),
        apaar: `APAAR-${match.id}`,
        status: 'INACTIVE',
        currentEnrolment: false,
        reason: 'Student enrolment is inactive or suspended',
      };
    }

    // Check college match if selectedPid provided
    if (selectedPid && match.pid !== selectedPid) {
      return {
        ...person('student', match.id, { name: match.name, institutionPid: match.pid }),
        apaar: `APAAR-${match.id}`,
        status: 'MISMATCH',
        currentEnrolment: false,
        enrolledPid: match.pid,
        selectedPid,
        reason: `Student is registered with institution ${match.pid}, not ${selectedPid}`,
      };
    }

    return {
      ...person('student', match.id, { name: match.name, institutionPid: match.pid }),
      apaar: `APAAR-${match.id}`,
      status: 'VERIFIED',
      currentEnrolment: true,
    };
  }
}

export class StaffRegistrySimulator {
  static verify(reference, selectedPid = null) {
    if (!reference) return null;
    const cleanRef = reference.trim();

    // Legacy fixture strings
    if (['FACULTY-ACTIVE', 'FACULTY-INACTIVE', 'FACULTY-SECOND'].includes(cleanRef)) {
      return {
        ...person('faculty', cleanRef),
        staffRef: `DEMO-STAFF-${cleanRef}`,
        currentEmployment: cleanRef !== 'FACULTY-INACTIVE',
        status: cleanRef !== 'FACULTY-INACTIVE' ? 'VERIFIED' : 'INACTIVE',
      };
    }

    // Lookup in synthetic Faculty registry
    const match = SYNTHETIC_FACULTY_REGISTRY.find(r => r.id.toLowerCase() === cleanRef.toLowerCase());
    if (!match) {
      // Only an ID shaped like a staff registry key (FAC-/STF-) is a registry
      // miss; any other text stays an invalid simulator reference (N02).
      if (!/^(FAC|STF)-/i.test(cleanRef) || !validateStaffIdFormat(cleanRef)) return null;
      return {
        synthetic: true,
        status: 'NOT_ENROLLED',
        currentEmployment: false,
        error: 'STAFF_ID_NOT_FOUND',
        reason: 'Staff ID not found in simulated AICTE faculty registry',
      };
    }

    if (match.status === 'MANUAL_REVIEW') {
      return {
        ...person('faculty', match.id, { name: match.name, institutionPid: match.pid }),
        staffRef: match.id,
        status: 'MANUAL_REVIEW',
        manualReview: true,
        currentEmployment: true,
      };
    }

    if (!match.active || match.status === 'INACTIVE') {
      return {
        ...person('faculty', match.id, { name: match.name, institutionPid: match.pid }),
        staffRef: match.id,
        status: 'INACTIVE',
        currentEmployment: false,
        reason: 'Faculty employment is inactive or terminated',
      };
    }

    if (selectedPid && match.pid !== selectedPid) {
      return {
        ...person('faculty', match.id, { name: match.name, institutionPid: match.pid }),
        staffRef: match.id,
        status: 'MISMATCH',
        currentEmployment: false,
        employedPid: match.pid,
        selectedPid,
        reason: `Faculty is employed at institution ${match.pid}, not ${selectedPid}`,
      };
    }

    return {
      ...person('faculty', match.id, { name: match.name, institutionPid: match.pid }),
      staffRef: match.id,
      status: 'VERIFIED',
      currentEmployment: true,
    };
  }
}

export class SsoSimulator {
  static verify(reference, role) {
    const authorized = ['institution_admin', 'regional_officer', 'bureau_officer', 'supervisor', 'competent_authority', 'system_admin'];
    if (['SSO-ACTIVE', 'SSO-SECOND'].includes(reference) && authorized.includes(role)) {
      return { ...person('official', `${role}-${reference}`), authorizedRepresentative: true, sso: true };
    }
    if (role === 'faculty' && (['FACULTY-ACTIVE', 'FACULTY-INACTIVE', 'FACULTY-SECOND'].includes(reference) || SYNTHETIC_FACULTY_REGISTRY.some(r => r.id.toLowerCase() === (reference || '').toLowerCase()))) {
      return { sso: true };
    }
    return null;
  }
}

export function manualIdentity(reference, subtype) {
  if (!['MANUAL-PERSON-1', 'MANUAL-PERSON-2', 'MANUAL-OTHER-1'].includes(reference)) return null;
  return { ...person('manual', reference), subtype: subtype || null };
}

// N51 re-check (synthetic)
export const SimulatorStatusChanges = new Map();
export function recheckSimulated(kind, reference) {
  const changed = SimulatorStatusChanges.get(reference);
  if (changed) return { status: changed };
  if (kind === 'student') {
    const row = AbcApaarSimulator.verify(reference);
    return row ? { status: row.currentEnrolment ? 'ACTIVE' : 'SUSPENDED' } : { status: 'UNKNOWN', reason: 'SIMULATOR_REFERENCE_INVALID' };
  }
  if (kind === 'faculty') {
    const row = StaffRegistrySimulator.verify(reference);
    return row ? { status: row.currentEmployment ? 'ACTIVE' : 'TERMINATED' } : { status: 'UNKNOWN', reason: 'SIMULATOR_REFERENCE_INVALID' };
  }
  return { status: 'UNKNOWN', reason: 'NO_SIMULATOR_FOR_USER_TYPE' };
}
