import seedrandom from 'seedrandom';

/**
 * N48: Realistic test-data generator.
 *
 * Generates synthetic institutions, complainants and complaints with:
 * - Typos, acronyms, Hindi and Tamil spellings
 * - PID format like 1-1234567890 (some with ICID, some without)
 * - Every record marked synthetic: true
 * - Deterministic output for the same seed
 */

const REGIONS = ['Northern', 'Western', 'Southern', 'Central', 'Eastern', 'North Eastern'];
const INSTITUTION_TYPES = ['Engineering', 'Pharmacy', 'Management', 'Architecture', 'Applied Arts'];
const STATES = {
  Northern: ['Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir'],
  Western: ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa'],
  Southern: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'],
  Central: ['Madhya Pradesh', 'Chhattisgarh'],
  Eastern: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'],
  'North Eastern': ['Assam', 'Meghalaya', 'Manipur', 'Tripura', 'Nagaland', 'Mizoram', 'Arunachal Pradesh', 'Sikkim'],
};

const CATEGORY_LIST = [
  'Fee Dispute', 'Faculty Shortage', 'Infrastructure', 'Ragging',
  'Admission Irregularity', 'Affiliation Issue', 'Placement Fraud',
  'Hostel Complaint', 'Exam Irregularity', 'Safety Concern',
];

// Hindi institution name parts (transliterated)
const HINDI_NAMES = [
  'प्रौद्योगिकी संस्थान', 'अभियांत्रिकी महाविद्यालय', 'तकनीकी विश्वविद्यालय',
  'Takniki Vishwavidyalaya', 'Abhiyantiki Mahavidyalaya', 'Prodyogiki Sansthan',
];

// Tamil institution name parts (transliterated)
const TAMIL_NAMES = [
  'தொழில்நுட்பக் கல்லூரி', 'பொறியியல் கல்லூரி',
  'Thozhilnutpa Kalloori', 'Poriyiyal Kalloori', 'Kalvi Nilayam',
];

// Common typos and acronyms used in complaints
const TYPO_VARIANTS = [
  { original: 'college', variants: ['collge', 'colege', 'collage'] },
  { original: 'university', variants: ['univrsity', 'univeristy', 'univ.'] },
  { original: 'engineering', variants: ['engg.', 'engg', 'enginering', 'engneering'] },
  { original: 'admission', variants: ['admisson', 'addmission', 'admision'] },
  { original: 'management', variants: ['mgmt', 'mgmt.', 'managment'] },
  { original: 'certificate', variants: ['cert.', 'certifcate', 'certificte'] },
  { original: 'complaint', variants: ['complain', 'compaint', 'compliant'] },
  { original: 'infrastructure', variants: ['infra', 'infrastruture', 'infrastructre'] },
];

const ACRONYMS = ['AICTE', 'UGC', 'NBA', 'NAAC', 'PGRC', 'RB', 'MOU', 'SLA', 'HOD', 'VC', 'NIRF'];

// Hindi complaint fragments
const HINDI_FRAGMENTS = [
  'शिकायत दर्ज करना चाहते हैं',
  'shikayat darj karna chahte hain',
  'fees bahut zyada hai',
  'hostel ki halat kharab hai',
  'faculty nahi aate class mein',
  'ragging ho rahi hai campus mein',
  'placement mein fraud hua hai',
  'admission ke dauran galat jaankari di gayi',
];

// Tamil complaint fragments
const TAMIL_FRAGMENTS = [
  'புகார் அளிக்க விரும்புகிறேன்',
  'pugaar alikka virumbugiraen',
  'fees romba jaasthi',
  'college la proper facility illa',
  'placement la eppovum problem',
  'hostel condition miga mosamaanal',
];

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(rng, arr, n) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

function generatePID(rng) {
  const digits = Array.from({ length: 10 }, () => Math.floor(rng() * 10)).join('');
  return `1-${digits}`;
}

function generateICID(rng) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'IIC-' + Array.from({ length: 8 }, () => chars[Math.floor(rng() * chars.length)]).join('');
}

function generateInstitutionName(rng, region) {
  const prefixes = ['National', 'Royal', 'Modern', 'Global', 'Premier', 'Central', 'Sri', 'Shri', 'New'];
  const suffixes = ['Institute of Technology', 'College of Engineering', 'Technical University', 'Polytechnic'];
  const prefix = pick(rng, prefixes);
  const suffix = pick(rng, suffixes);
  const city = pick(rng, STATES[region]);

  // 20% chance of Hindi name, 15% Tamil, rest English
  const r = rng();
  if (r < 0.2) {
    return `${prefix} ${pick(rng, HINDI_NAMES)}, ${city}`;
  } else if (r < 0.35) {
    return `${prefix} ${pick(rng, TAMIL_NAMES)}, ${city}`;
  }
  return `${prefix} ${suffix}, ${city}`;
}

function applyTypo(rng, text) {
  // 30% chance to introduce a typo
  if (rng() > 0.3) return text;
  const variant = pick(rng, TYPO_VARIANTS);
  if (text.toLowerCase().includes(variant.original)) {
    return text.replace(new RegExp(variant.original, 'i'), pick(rng, variant.variants));
  }
  return text;
}

function generateComplaintText(rng) {
  const base = [];

  // Mix of languages and styles
  const r = rng();
  if (r < 0.25) {
    // Hindi fragment
    base.push(pick(rng, HINDI_FRAGMENTS));
  } else if (r < 0.4) {
    // Tamil fragment
    base.push(pick(rng, TAMIL_FRAGMENTS));
  }

  const issues = [
    'The college is charging excessive fees beyond the approved limit.',
    'There is severe shortage of qualified faculty members in our department.',
    'The hostel conditions are very poor with no proper sanitation.',
    'Students are being ragged by senior students in the campus.',
    'The infrastructure of the lab is outdated and not maintained properly.',
    'Placement cell is providing false data about placement statistics.',
    'Admission process was not transparent and involved irregularities.',
    'The college does not have proper fire safety measures.',
    'Exam papers were leaked before the examination date.',
    'Management is not following AICTE guidelines for fee structure.',
  ];

  base.push(applyTypo(rng, pick(rng, issues)));

  // 40% chance to add an acronym
  if (rng() < 0.4) {
    base.push(`Please refer to ${pick(rng, ACRONYMS)} guidelines.`);
  }

  return base.join(' ');
}

function generateComplainantName(rng) {
  const firstNames = [
    'Aarav', 'Aditi', 'Arjun', 'Diya', 'Ishaan', 'Kavya', 'Manav', 'Neha',
    'Priya', 'Rahul', 'Sana', 'Tanvi', 'Vijay', 'Ananya', 'Rohit', 'Sneha',
    'Karthik', 'Meera', 'Suresh', 'Lakshmi',
  ];
  const lastNames = [
    'Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Iyer', 'Gupta', 'Das',
    'Nair', 'Joshi', 'Rao', 'Verma', 'Pillai', 'Mishra', 'Bhat', 'Menon',
    'Tiwari', 'Mukherjee', 'Agarwal', 'Choudhury',
  ];
  return `${pick(rng, firstNames)} ${pick(rng, lastNames)}`;
}

/**
 * Generate synthetic data.
 *
 * @param {Object} opts
 * @param {number} opts.count - Number of complaints to generate
 * @param {number|string} opts.seed - Random seed
 * @returns {{ institutions: Array, complainants: Array, complaints: Array }}
 */
export function generate({ count = 100, seed = 42 } = {}) {
  const rng = seedrandom(String(seed));

  // Generate institutions (~count/10)
  const numInstitutions = Math.max(10, Math.ceil(count / 10));
  const institutions = [];
  const pidsUsed = new Set();

  for (let i = 0; i < numInstitutions; i++) {
    let pid;
    do {
      pid = generatePID(rng);
    } while (pidsUsed.has(pid));
    pidsUsed.add(pid);

    const region = pick(rng, REGIONS);
    const hasICID = rng() > 0.3; // 70% have ICID
    institutions.push({
      pid,
      icid: hasICID ? generateICID(rng) : null,
      name: generateInstitutionName(rng, region),
      state: pick(rng, STATES[region]),
      region,
      type: pick(rng, INSTITUTION_TYPES),
      approvalStatus: rng() > 0.1 ? 'approved' : 'pending',
      synthetic: true,
    });
  }

  // Generate complainants (~count/5)
  const numComplainants = Math.max(20, Math.ceil(count / 5));
  const complainants = [];

  for (let i = 0; i < numComplainants; i++) {
    complainants.push({
      pseudonymousId: `RP-${Array.from({ length: 4 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(rng() * 36)]).join('')}`,
      userType: rng() > 0.4 ? 'student' : 'faculty',
      generatedName: generateComplainantName(rng),
      generatedEmail: `user${i}@synth.example.com`,
      generatedPhone: `9${Array.from({ length: 9 }, () => Math.floor(rng() * 10)).join('')}`,
      synthetic: true,
    });
  }

  // Generate complaints
  const complaints = [];

  for (let i = 0; i < count; i++) {
    const institution = pick(rng, institutions);
    const complainant = pick(rng, complainants);
    const category = pick(rng, CATEGORY_LIST);

    complaints.push({
      masterCaseId: `NX-2026-${String(i + 1).padStart(6, '0')}`,
      complainantId: complainant.pseudonymousId,
      institutionPid: institution.pid,
      institutionIcid: institution.icid,
      category,
      subCategory: category,
      narrative: generateComplaintText(rng),
      priority: pick(rng, ['normal', 'high', 'urgent']),
      status: pick(rng, ['Registered', 'Assigned', 'Under Process']),
      channel: pick(rng, ['web', 'email', 'import']),
      synthetic: true,
    });
  }

  return { institutions, complainants, complaints };
}
