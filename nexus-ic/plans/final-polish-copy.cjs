const fs = require('node:fs');
const copy = {
  'Complaint journey': 'शिकायत की यात्रा', 'On track': 'निर्धारित क्रम में', 'Source': 'स्रोत', 'Owner now': 'वर्तमान उत्तरदायी',
  'One Institution, One View, One Complaint Journey, Real Resolution': 'एक संस्थान, एक दृश्य, एक शिकायत यात्रा, वास्तविक समाधान',
  'Verified People • Verified Institutions • Coordinated Bureaus • No Lost Transfers • Faster, Accountable Resolution': 'सत्यापित लोग • सत्यापित संस्थान • समन्वित ब्यूरो • जवाबदेह स्थानांतरण • तेज़ समाधान',
  'Sign In to Your Workspace →': 'अपने कार्यक्षेत्र में प्रवेश करें →', 'One complaint journey': 'एक शिकायत यात्रा',
  "From a student's voice to a proven resolution": 'विद्यार्थी की आवाज़ से प्रमाणित समाधान तक',
  'Six checkpoints, each visible to the right person, each recorded in the audit chain.': 'छह चरण, हर चरण सही व्यक्ति को दिखता है और ऑडिट शृंखला में दर्ज होता है।',
  'Built and verified': 'निर्मित और सत्यापित', 'The NEXUS modules': 'NEXUS मॉड्यूल',
  'Humans decide; the system gates and explains. No guilt scores, no auto-closure, no silent ownership moves.': 'निर्णय मनुष्य लेते हैं; प्रणाली जाँचती और समझाती है। कोई दोष अंक, स्वतः समापन या मौन उत्तरदायित्व परिवर्तन नहीं।',
  'KEY OUTCOMES': 'मुख्य परिणाम', 'Manager Expectations Implemented': 'प्रबंधन की अपेक्षाएँ लागू',
  'Verified workflows with attributable decisions and complete audit history.': 'दर्ज निर्णयों और पूर्ण ऑडिट इतिहास के साथ सत्यापित कार्यप्रवाह।',
  'See it from every desk': 'हर भूमिका के कार्यक्षेत्र को देखें', 'Choose a role to open its workspace.': 'कार्यक्षेत्र खोलने के लिए भूमिका चुनें।',
  'Verified reporter': 'सत्यापित शिकायतकर्ता', 'Right institution': 'सही संस्थान', 'No duplicate work': 'दोहराए गए काम की रोकथाम',
  'Right bureau': 'सही ब्यूरो', 'No lost transfers': 'जवाबदेह स्थानांतरण', 'Proven closure': 'प्रमाणित समापन',
  'ABC/APAAR or employment check with local OTP; identity stays in a sealed vault.': 'स्थानीय OTP के साथ ABC/APAAR या रोजगार जाँच; पहचान सुरक्षित वॉल्ट में रहती है।',
  'AICTE Permanent Institute ID is the key; ICID corroborates and never links alone.': 'AICTE PID मुख्य पहचान है; ICID पुष्टि करता है और अकेले संस्थानों को नहीं जोड़ता।',
  'Seven-signal overlap check before a case or an action is created.': 'केस या कार्रवाई बनाने से पहले सात संकेतों से संभावित दोहराव की जाँच।',
  'Every routing decision names its RuleBook rule and its reason.': 'हर रूटिंग निर्णय में RuleBook नियम और कारण दर्ज है।',
  'Sender stays accountable until the receiver accepts; nothing reverts to Submitted.': 'प्राप्तकर्ता की स्वीकृति तक भेजने वाला ज़िम्मेदार है; केस फिर Submitted नहीं होता।',
  'Evidence-gated closure, complainant feedback and a hash-chained audit trail.': 'साक्ष्य आधारित समापन, शिकायतकर्ता की प्रतिक्रिया और हैश-शृंखला वाला ऑडिट।',
  'Transparent, Accountable': 'पारदर्शी, जवाबदेह', 'Student & Faculty Focused': 'विद्यार्थी और शिक्षक केंद्रित', 'Institution-Centric View': 'संस्थान केंद्रित दृश्य',
  'Actionable Insights for Better Governance': 'बेहतर प्रशासन के लिए उपयोगी जानकारी',
  'Verified and authentic complaints': 'सत्यापित और प्रामाणिक शिकायतें', 'Correct institution and region mapping': 'सही संस्थान और क्षेत्र का मानचित्रण',
  'No duplicate registrations or actions': 'दोहराए पंजीकरण और कार्रवाइयों की रोकथाम', 'Intelligent and explainable routing': 'समझाई जा सकने वाली रूटिंग',
  'No lost transfers with full accountability': 'पूर्ण जवाबदेही के साथ स्थानांतरण', 'Coordinated actions across bureaus': 'ब्यूरो के बीच समन्वित कार्रवाई',
  'Institution-centric single window': 'संस्थान केंद्रित एकल खिड़की', 'Truthful status tracking': 'सही स्थिति की निगरानी', 'Cross-bureau overlap detection': 'ब्यूरो के बीच संभावित दोहराव की पहचान',
  'Exact ownership at every stage': 'हर चरण में स्पष्ट उत्तरदायित्व', 'Pending / disposed / transferred / escalated monitoring': 'लंबित / निस्तारित / स्थानांतरित / आगे बढ़ाए केसों की निगरानी',
  'Alerts for nearing timelines': 'निकट आती समयसीमाओं के संकेत', 'Complete audit history': 'पूर्ण ऑडिट इतिहास', 'Decision support': 'निर्णय सहायता',
  'Verified student': 'सत्यापित विद्यार्थी', 'Bureau officer': 'ब्यूरो अधिकारी', 'Supervisor': 'पर्यवेक्षक', 'Competent Authority': 'सक्षम प्राधिकारी', 'Auditor': 'ऑडिटर',
  'File and track a grievance': 'शिकायत दर्ज करें और देखें', 'Work the RB queue': 'RB कतार पर कार्य करें', 'Oversee SLA and rescue': 'SLA और सहायता की निगरानी', 'Approve and govern': 'स्वीकृति और प्रशासन', 'Verify the audit chain': 'ऑडिट शृंखला सत्यापित करें',
  'Zero-Trust Security': 'ज़ीरो-ट्रस्ट सुरक्षा', 'Tamper-Evident Audit': 'छेड़छाड़ का पता लगाने वाला ऑडिट', 'Privacy & Protection': 'गोपनीयता और सुरक्षा',
  'Every request re-authorized server-side. HttpOnly Secure session cookies with zero tokens stored on the client.': 'हर अनुरोध पर सर्वर में अनुमति जाँची जाती है। HttpOnly Secure सत्र कुकी; क्लाइंट पर कोई टोकन संग्रहीत नहीं।',
  'Cryptographic SHA-256 hash chain records every state change. Fully verifiable via admin dashboard.': 'SHA-256 हैश शृंखला हर स्थिति परिवर्तन दर्ज करती है। प्रशासन दृश्य से सत्यापन उपलब्ध है।',
  'Reporter identity separated. Complainant narrative, name, and PII are never logged or exposed.': 'शिकायतकर्ता की पहचान अलग रहती है। विवरण, नाम और निजी जानकारी लॉग में नहीं जाती।',
  'My grievances': 'मेरी शिकायतें', 'File a grievance': 'शिकायत दर्ज करें', 'Could not load your cases.': 'आपके केस लोड नहीं हो सके।',
  'No grievances yet': 'अभी कोई शिकायत नहीं', 'Verify your identity once, then file. You will see every step of your case here.': 'पहले पहचान सत्यापित करें, फिर शिकायत दर्ज करें। हर चरण यहाँ दिखेगा।', 'Verify identity →': 'पहचान सत्यापित करें →',
  'Case not found': 'केस नहीं मिला', 'The case does not exist or is outside your bureau, region or role scope. The attempt is recorded in the audit trail.': 'केस मौजूद नहीं है या आपके ब्यूरो, क्षेत्र अथवा भूमिका के दायरे से बाहर है। प्रयास ऑडिट में दर्ज है।',
  'Back to queue': 'कतार पर वापस जाएँ', 'Master Case ID': 'मास्टर केस ID', 'Closure & proof': 'समापन और प्रमाण', 'Institution 360': 'संस्थान 360',
  'Overlap timeline': 'संभावित दोहराव की समयरेखा', 'Institution identity': 'संस्थान की पहचान', 'PID (authoritative)': 'PID (मुख्य पहचान)',
  'Source trail': 'स्रोत शृंखला', 'Source IDs are kept as received; linking cases never overwrites them.': 'स्रोत ID मूल रूप में रखे जाते हैं; केस जोड़ने पर बदले नहीं जाते।',
  'Routing decision': 'रूटिंग निर्णय', 'Ownership path': 'उत्तरदायित्व का क्रम', 'The sender stays accountable until the receiver accepts. A transferred case never reverts to Submitted.': 'प्राप्तकर्ता के स्वीकार करने तक भेजने वाला ज़िम्मेदार है। स्थानांतरित केस फिर Submitted नहीं होता।',
  'Case timeline': 'केस की समयरेखा', "Dated from the case's own records: registration, routing, transfers and PROOF closure.": 'केस के अपने रिकॉर्ड से तिथियाँ: पंजीकरण, रूटिंग, स्थानांतरण और PROOF समापन।',
  'Audit chain entries': 'ऑडिट शृंखला की प्रविष्टियाँ', 'Attributed events in the SHA-256 hash-chained audit log, as recorded.': 'SHA-256 हैश शृंखला में भूमिका सहित दर्ज घटनाएँ।',
  'Show view events': 'देखने की घटनाएँ दिखाएँ', 'No recorded events for this case yet.': 'इस केस के लिए अभी कोई घटना दर्ज नहीं।',
  'Read-only view · narrative and reporter identity are never shown here': 'केवल पढ़ने का दृश्य · शिकायत का विवरण और शिकायतकर्ता की पहचान यहाँ नहीं दिखाई जाती',
  'Total complaints': 'कुल शिकायतें', 'Pending': 'लंबित', 'Disposed': 'निस्तारित', 'Overdue': 'समयसीमा पार', 'Transfer delays': 'स्थानांतरण में देरी', 'Potential overlaps': 'संभावित दोहराव',
  'Case status': 'केस की स्थिति', 'Bureau-wise workload': 'ब्यूरो अनुसार कार्यभार', 'Region-wise cases': 'क्षेत्र अनुसार केस', 'Monthly trend': 'मासिक प्रवृत्ति',
  'Institutions with most cases': 'सर्वाधिक केस वाले संस्थान', 'Resolution time': 'समाधान का समय', 'Duplicate actions flagged': 'दोहराव हेतु चिह्नित कार्रवाइयाँ',
  'No recommendations for this scope.': 'इस दायरे के लिए कोई सुझाव नहीं।', 'Open and disposed per bureau; transfers in shown on hover': 'प्रत्येक ब्यूरो के खुले और निस्तारित केस; संकेत पर प्राप्त स्थानांतरण',
  'Six AICTE regions; unmapped institutions stay UNKNOWN': 'छह AICTE क्षेत्र; बिना मानचित्रण वाले संस्थान UNKNOWN रहते हैं', 'Registered against disposed': 'पंजीकृत और निस्तारित', 'PID with ICID where mapped': 'PID और उपलब्ध ICID',
};
for (const lang of ['en', 'hi']) {
  const file = `client/src/i18n/final-polish.${lang}.json`;
  const existing = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [en, hi] of Object.entries(copy)) existing[`polish.${en}`] = lang === 'en' ? en : hi;
  delete existing['polish.en'];
  fs.writeFileSync(file, JSON.stringify(existing, null, 2) + '\n');
}
for (const [file, componentPath] of [
  ['client/src/pages/Home.jsx', '../components/PolishText.jsx'], ['client/src/pages/Dashboard.jsx', '../components/PolishText.jsx'],
  ['client/src/pages/cases/CaseJourney.jsx', '../../components/PolishText.jsx'], ['client/src/components/dashboard/CommandCharts.jsx', '../PolishText.jsx'],
]) {
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes('import PolishText')) source = `import PolishText from '${componentPath}';\n` + source;
  source = source.replace(/>([A-Za-z][^<>{}\n]*)</g, (whole, text) => copy[text.trim()] ? `><PolishText>${text}</PolishText><` : whole);
  if (file.endsWith('Home.jsx')) {
    for (const expression of ['s.title', 's.text', 'p', 'text', 'x', 'role', 'd']) source = source.replaceAll(`{${expression}}`, `<PolishText>{${expression}}</PolishText>`);
    source = source.replace('{t}</h3>', '<PolishText>{t}</PolishText></h3>');
  }
  if (file.endsWith('CaseJourney.jsx')) source = source.replace('{label}</p>', '<PolishText>{label}</PolishText></p>');
  if (file.endsWith('CommandCharts.jsx')) source = source.replace('{label}</p>', '<PolishText>{label}</PolishText></p>').replace('{title}</h3>', '<PolishText>{title}</PolishText></h3>').replace('{subtitle}</p>', '<PolishText>{subtitle}</PolishText></p>');
  fs.writeFileSync(file, source);
}
