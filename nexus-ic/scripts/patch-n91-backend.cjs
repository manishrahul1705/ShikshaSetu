const fs = require('fs');
const path = require('path');

// 1. Patch server/src/modules/identity/service.js
const servicePath = path.resolve('server/src/modules/identity/service.js');
let serviceContent = fs.readFileSync(servicePath, 'utf8');

// Replace import
serviceContent = serviceContent.replace(
  "import { AbcApaarSimulator, StaffRegistrySimulator, SsoSimulator, manualIdentity } from './simulators.js';",
  "import { AbcApaarSimulator, StaffRegistrySimulator, SsoSimulator, manualIdentity, validateApaarAbcFormat, validateStaffIdFormat } from './simulators.js';"
);

// Replace start signature
serviceContent = serviceContent.replace(
  "export async function start(user, { userType, reference, consent, subtype, manual = false, deviceId }) {",
  "export async function start(user, { userType, reference, consent, subtype, manual = false, deviceId, institutionPid, apaarId, abcId, staffId }) {"
);

// Replace identity resolution block
const oldBlock = `  let identity;
  let method;
  if (manual || userType === 'other_stakeholder') {
    identity = manualIdentity(reference, subtype); method = 'officer_assisted';
  } else if (userType === 'student') {
    identity = AbcApaarSimulator.verify(reference); method = 'AbcApaarSimulator';
  } else if (userType === 'faculty') {
    identity = StaffRegistrySimulator.verify(reference); method = 'StaffRegistrySimulator+SsoSimulator';
    if (!SsoSimulator.verify(reference, user.role)) identity = null;
  } else {
    identity = SsoSimulator.verify(reference, user.role); method = 'SsoSimulator';
  }
  if (!identity) throw fail(400, 'SIMULATOR_REFERENCE_INVALID');`;

const newBlock = `  let identity;
  let method;
  if (manual || userType === 'other_stakeholder') {
    identity = manualIdentity(reference, subtype); method = 'officer_assisted';
  } else if (userType === 'student') {
    const studentRef = (apaarId || abcId || reference || '').trim();
    if (studentRef && !['STUDENT-ACTIVE', 'STUDENT-INACTIVE', 'STUDENT-SECOND'].includes(studentRef)) {
      if (!validateApaarAbcFormat(studentRef)) throw fail(400, 'INVALID_APAAR_FORMAT');
    }
    identity = AbcApaarSimulator.verify(studentRef, institutionPid);
    method = identity?.status === 'MANUAL_REVIEW' ? 'officer_assisted' : 'AbcApaarSimulator';
  } else if (userType === 'faculty') {
    const facultyRef = (staffId || reference || '').trim();
    if (facultyRef && !['FACULTY-ACTIVE', 'FACULTY-INACTIVE', 'FACULTY-SECOND'].includes(facultyRef)) {
      if (!validateStaffIdFormat(facultyRef)) throw fail(400, 'INVALID_STAFF_ID_FORMAT');
    }
    identity = StaffRegistrySimulator.verify(facultyRef, institutionPid);
    method = identity?.status === 'MANUAL_REVIEW' ? 'officer_assisted' : 'StaffRegistrySimulator+SsoSimulator';
    if (!SsoSimulator.verify(facultyRef, user.role)) identity = null;
  } else {
    identity = SsoSimulator.verify(reference, user.role); method = 'SsoSimulator';
  }
  if (!identity) throw fail(400, 'SIMULATOR_REFERENCE_INVALID');
  if (identity.status === 'NOT_ENROLLED') throw fail(404, 'NOT_ENROLLED');
  if (identity.status === 'MISMATCH') throw fail(400, 'MISMATCH');
  if (identity.status === 'INACTIVE' && !['STUDENT-INACTIVE', 'FACULTY-INACTIVE'].includes(reference)) {
    throw fail(400, 'INACTIVE');
  }`;

if (!serviceContent.includes(newBlock)) {
  serviceContent = serviceContent.replace(oldBlock, newBlock);
  fs.writeFileSync(servicePath, serviceContent, 'utf8');
  console.log('Successfully patched service.js');
} else {
  console.log('service.js already contains new block');
}

// 2. Patch server/src/modules/identity/routes.js
const routesPath = path.resolve('server/src/modules/identity/routes.js');
let routesContent = fs.readFileSync(routesPath, 'utf8');

routesContent = routesContent.replace(
  "import { start, issueOtp, confirmOtp, readInbox, manualQueue, decideManual } from './service.js';",
  "import { start, issueOtp, confirmOtp, readInbox, manualQueue, decideManual } from './service.js';\nimport { SYNTHETIC_STUDENT_REGISTRY, SYNTHETIC_FACULTY_REGISTRY } from './simulators.js';"
);

routesContent = routesContent.replace(
  "const verificationFields = ['userType', 'reference', 'consent', 'subtype', 'manual', 'deviceId'];",
  "const verificationFields = ['userType', 'reference', 'consent', 'subtype', 'manual', 'deviceId', 'institutionPid', 'apaarId', 'abcId', 'staffId'];"
);

const registryRoute = `router.get('/identity/simulated-registry', authorize(), handle([], () => ({
  students: SYNTHETIC_STUDENT_REGISTRY.map(r => ({ id: r.id, display: r.display, name: r.name, pid: r.pid, status: r.status })),
  faculty: SYNTHETIC_FACULTY_REGISTRY.map(r => ({ id: r.id, name: r.name, pid: r.pid, status: r.status }))
})));\n`;

if (!routesContent.includes('/identity/simulated-registry')) {
  routesContent = routesContent.replace(
    "router.get('/identity/manual-verification',",
    registryRoute + "router.get('/identity/manual-verification',"
  );
  fs.writeFileSync(routesPath, routesContent, 'utf8');
  console.log('Successfully patched routes.js');
} else {
  console.log('routes.js already contains registry route');
}
