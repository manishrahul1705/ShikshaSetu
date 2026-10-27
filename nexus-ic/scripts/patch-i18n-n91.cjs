const fs = require('fs');
const path = require('path');

const enPath = path.resolve('client/src/i18n/s1a.en.json');
const hiPath = path.resolve('client/src/i18n/s1a.hi.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

const additionsEn = {
  "NOT_ENROLLED": "ID not found in simulated Academic Bank of Credits / APAAR registry.",
  "INACTIVE": "Enrolment or employment status is inactive or suspended.",
  "MISMATCH": "ID is registered under a different institution than selected.",
  "INVALID_APAAR_FORMAT": "Invalid APAAR/ABC ID format. Please enter a 12-digit number.",
  "INVALID_STAFF_ID_FORMAT": "Invalid Faculty Staff ID format.",
  "simulatedCheckBadge": "Simulated ABC / APAAR check (local synthetic registry, no external call)",
  "apaarOrAbcLabel": "12-digit APAAR / ABC ID",
  "staffIdLabel": "AICTE Faculty Staff ID",
  "selectCollege": "Selected Institution / College (PID)",
  "quickSamples": "Quick Demo Presets (N91 5 Outcomes):",
  "sampleVerified": "1. Verified Active",
  "sampleInactive": "2. Inactive / Suspended",
  "sampleMismatch": "3. College Mismatch",
  "sampleReview": "4. Manual Review",
  "sampleNotFound": "5. Not Enrolled"
};

const additionsHi = {
  "NOT_ENROLLED": "सिम्युलेटेड एकेडमिक बैंक ऑफ क्रेडिट्स / अपार रजिस्ट्री में आईडी नहीं मिली।",
  "INACTIVE": "नामांकन या रोजगार की स्थिति निष्क्रिय या निलंबित है।",
  "MISMATCH": "आईडी चयनित संस्थान से भिन्न संस्थान में पंजीकृत है।",
  "INVALID_APAAR_FORMAT": "अमान्य अपार/एबीसी आईडी प्रारूप। कृपया 12 अंकों की संख्या दर्ज करें।",
  "INVALID_STAFF_ID_FORMAT": "अमान्य संकाय कर्मचारी आईडी प्रारूप।",
  "simulatedCheckBadge": "सिम्युलेटेड अपार / एबीसी सत्यापन (स्थानीय सिंथेटिक डेटाबेस, कोई बाहरी नेटवर्क कॉल नहीं)",
  "apaarOrAbcLabel": "12-अंकीय अपार / एबीसी आईडी",
  "staffIdLabel": "एआईसीटीई संकाय स्टाफ आईडी",
  "selectCollege": "चयनित संस्थान / कॉलेज (PID)",
  "quickSamples": "त्वरित डेमो प्रीसेट (N91 के 5 परिणाम):",
  "sampleVerified": "1. सत्यापित सक्रिय",
  "sampleInactive": "2. निष्क्रिय / निलंबित",
  "sampleMismatch": "3. कॉलेज बेमेल",
  "sampleReview": "4. मैन्युअल समीक्षा",
  "sampleNotFound": "5. नामांकित नहीं"
};

Object.assign(en, additionsEn);
Object.assign(hi, additionsHi);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2), 'utf8');
console.log('Successfully updated s1a.en.json and s1a.hi.json');
