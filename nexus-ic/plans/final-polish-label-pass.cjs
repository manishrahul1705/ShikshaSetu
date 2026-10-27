// Exact presentation-string edits for Manish's 25 Oct override. No identifiers,
// credentials, stored complaints, simulator class names or policy values change.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function edit(relative, fn) {
  const file = path.join(root, relative);
  const before = fs.readFileSync(file, 'utf8'); // Always read the latest file.
  const after = fn(before);
  if (after !== before) { fs.writeFileSync(file, after); console.log(`Updated presentation text: ${relative}`); }
}
const replacements = {
  'client/src/additions/n46-judge-mode/JudgeMode.jsx': [
    ['Judge Demo Mode is not available in production mode.', 'Guided Walkthrough is not available in production mode.'],
    ['>Judge Demo Mode<', '>Guided Walkthrough<'],
    ["Resets the demo data (synthetic only) and walks through two bureaus working on the same institution's complaint.", "Follow one institution's complaint through coordinated bureau action."],
    ['Each step can switch to the right demo account and open the right page for you; a tour card then follows you across the app.', 'Each step opens the right workspace and keeps the next action visible.'],
    ['Reset demo and start tour', 'Prepare walkthrough'],
    ['Reset only runs on a database named *_demo or *_test. The showcase data is already seeded, so you can start the tour below.', 'Reset is unavailable for this database. Start the prepared walkthrough below.'],
    ['<p className="text-xs text-slate-500">{tour.note}</p>', ''],
  ],
  'client/src/additions/n50-overlap-timeline/OverlapTimeline.jsx': [['Read-only view of PREVENT and SYNC data. Synthetic.', 'Read-only view of PREVENT and SYNC actions.']],
  'client/src/additions/n57-integrity/Integrity.jsx': [['Compute yesterday for demo', 'Compute yesterday']],
  'client/src/pages/benchmark/Benchmark.jsx': [['Run synthetic benchmark', 'Run benchmark']],
  'client/src/pages/cases/CaseJourney.jsx': [['SYNTHETIC DATA · read-only view · narrative and reporter identity are never shown here', 'Read-only view · narrative and reporter identity are never shown here']],
  'client/src/pages/graph/InstitutionGraph.jsx': [['SYNTHETIC DATA · Institution, cases and bureaus;', 'Institution, cases and bureaus;']],
  'client/src/pages/rulebook/RuleBook.jsx': [['synthetic cases verified.', 'cases verified.'], ['LIVE IN PRODUCTION/DEMO', 'ACTIVE VERSION']],
  'client/src/pages/rulebook/RuleChangeModal.jsx': [['passing the synthetic dry-run fixture test', 'passing the dry-run validation']],
  'server/src/modules/auth/seed.js': [
    ['Demo Student', 'Student Reporter'], ['Demo Faculty', 'Faculty Reporter'], ['Demo Institution Admin', 'Institution Administrator'],
    ['Demo RB Officer', 'Regulation Bureau Officer'], ['Demo PGRC Officer', 'Public Grievance Redressal Cell Officer'],
    ['Demo Regional Officer', 'Regional Grievance Officer'], ['Demo Supervisor', 'Supervisor, Grievance Cell'],
    ['Demo Competent Authority', 'Competent Authority'], ['Demo Auditor', 'Audit Officer'], ['Demo System Admin', 'System Administrator'],
  ],
  'server/src/modules/authority/seed.js': [['Demo Chairperson (synthetic)', 'Chairperson, Competent Authority'], ['Demo Member Secretary (synthetic)', 'Member Secretary, Competent Authority']],
  'server/src/modules/bureaus/seed.js': [['Demo AB Officer', 'Academic Bureau Officer'], ['Demo APB Officer', 'Approval Bureau Officer'], ['Demo SEB Officer', 'SEB Officer'], ['Demo TL Officer', 'TL Officer']],
  'server/src/modules/identity/seed.js': [["displayName: 'Synthetic trust account'", "displayName: userType === 'student' ? 'Student Reporter' : userType === 'faculty' ? 'Faculty Reporter' : userType === 'authorized_user' ? 'Institution Administrator' : 'Stakeholder Reporter'"]],
  'server/src/modules/sysadmin/service.js': [["displayName: 'Synthetic account'", "displayName: 'User Account'"]],
};
for (const [file, pairs] of Object.entries(replacements)) edit(file, text => pairs.reduce((value, [before, after]) => value.replaceAll(before, after), text));

// Remove complete literal disclosure paragraphs; retain internal metadata and
// component names. Dynamic API labels are handled explicitly at their renderers.
const files = fs.readdirSync(path.join(root, 'client/src'), { recursive: true }).filter(file => /\.(jsx|js)$/.test(file));
for (const file of files) edit(`client/src/${file}`, text => text.replace(/<p\b[^>]*>\s*SYNTHETIC DATA[^<]*<\/p>/g, ''));

const en = {
  inbox: 'Local OTP inbox', simulator: 'Verification method', 'STUDENT-SECOND': 'Second registered student', 'FACULTY-SECOND': 'Second faculty member',
  syntheticNote: 'Your identity is protected by purpose-specific consent and an encrypted vault.',
  otpNote: 'Open the Local OTP inbox in another tab to read your code.', name: 'Name', personRef: 'Person reference', apaar: 'APAAR', staffRef: 'Staff reference', institutionRef: 'Institution reference',
  synthetic: 'Local record', createAccount: 'Create account', username: 'Username', demoOnly: 'This inbox is available only in the local verification environment.', deviceId: 'Device label (optional)',
  RATE_LIMITED: 'Request limit reached. Try again after the configured window.', SIMULATOR_REFERENCE_INVALID: 'Select a valid verification reference.',
  s4Demo: 'Configured matching rules; a human reviews every suggestion.', s4Direction: 'Instruction direction', s4_CONFLICTING_INSTRUCTION: 'Opposing instructions need review', s4_ALLOW: 'ALLOW', s4_DENY: 'DENY',
  s6aEmail: 'Email intake', s6aReceive: 'Receive email as draft', s6aCsvNote: 'Preview, dry-run, then explicitly commit. External references remain idempotent.',
};
const hi = {
  inbox: 'स्थानीय OTP इनबॉक्स', simulator: 'सत्यापन विधि', 'STUDENT-SECOND': 'दूसरा पंजीकृत छात्र', 'FACULTY-SECOND': 'दूसरा संकाय सदस्य',
  syntheticNote: 'आपकी पहचान उद्देश्य-विशिष्ट सहमति और एन्क्रिप्टेड वॉल्ट से सुरक्षित है।', otpNote: 'अपना कोड पढ़ने के लिए दूसरे टैब में स्थानीय OTP इनबॉक्स खोलें।',
  name: 'नाम', personRef: 'व्यक्ति संदर्भ', apaar: 'APAAR', staffRef: 'कर्मचारी संदर्भ', institutionRef: 'संस्थान संदर्भ', synthetic: 'स्थानीय रिकॉर्ड', createAccount: 'खाता बनाएँ', username: 'उपयोगकर्ता नाम',
  demoOnly: 'यह इनबॉक्स केवल स्थानीय सत्यापन वातावरण में उपलब्ध है।', deviceId: 'डिवाइस लेबल (वैकल्पिक)', RATE_LIMITED: 'अनुरोध सीमा पूरी हुई। निर्धारित अवधि के बाद पुनः प्रयास करें।',
  s4Demo: 'विन्यस्त मिलान नियम; हर सुझाव की समीक्षा मानव करता है।', s4Direction: 'निर्देश की दिशा', s4_CONFLICTING_INSTRUCTION: 'विरोधी निर्देशों की समीक्षा आवश्यक है', s4_ALLOW: 'अनुमति', s4_DENY: 'निषेध',
  s6aEmail: 'ईमेल प्राप्ति', s6aReceive: 'ईमेल का मसौदा प्राप्त करें', s6aCsvNote: 'पूर्वावलोकन और जाँच के बाद स्पष्ट पुष्टि करें। बाहरी संदर्भ दोबारा दर्ज नहीं होते।',
};
for (const name of fs.readdirSync(path.join(root, 'client/src/i18n')).filter(name => /\.(en|hi)\.json$/.test(name))) {
  edit(`client/src/i18n/${name}`, text => {
    const dictionary = JSON.parse(text), overrides = name.endsWith('.hi.json') ? hi : en;
    for (const [key, value] of Object.entries(dictionary)) if (typeof value === 'string') {
      dictionary[key] = Object.hasOwn(overrides, key) ? overrides[key] : value
        .replace(/DEMO-[A-Z0-9-]+-v(\d+)/g, 'rule v$1')
        .replace(/\bsynthetic\b\s*/gi, '').replace(/\bdemo\b\s*/gi, '')
        .replace(/(?:कृत्रिम|सिंथेटिक|डेमो)\s*/g, '');
    }
    return JSON.stringify(dictionary, null, 2) + '\n';
  });
}
