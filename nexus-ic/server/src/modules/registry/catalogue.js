import crypto from 'node:crypto';

// Fictional catalogue, not an official AICTE directory. Regional assignments
// reuse DEMO-REGIONS-v1; no production jurisdiction policy is asserted.
export const CATALOGUE_VERSION = 'GLOBAL-JURY-CATALOGUE-v1';
const PLACES = [
  ['Lucknow', 'Uttar Pradesh', 'Northern'], ['Kolhapur', 'Maharashtra', 'Western'], ['Nellore', 'Andhra Pradesh', 'Southern'],
  ['Bhopal', 'Madhya Pradesh', 'Central'], ['Bhubaneswar', 'Odisha', 'Eastern'], ['Guwahati', 'Assam', 'North Eastern'],
  ['New Delhi', 'Delhi', 'Northern'], ['Vadodara', 'Gujarat', 'Western'], ['Coimbatore', 'Tamil Nadu', 'Southern'],
  ['Raipur', 'Chhattisgarh', 'Central'], ['Durgapur', 'West Bengal', 'Eastern'], ['Shillong', 'Meghalaya', 'North Eastern'],
  ['Karnal', 'Haryana', 'Northern'], ['Udaipur', 'Rajasthan', 'Western'], ['Kozhikode', 'Kerala', 'Southern'],
  ['Imphal', 'Manipur', 'North Eastern'], ['Gaya', 'Bihar', 'Eastern'], ['Agartala', 'Tripura', 'North Eastern'],
  ['Patiala', 'Punjab', 'Northern'], ['Panaji', 'Goa', 'Western'], ['Mysuru', 'Karnataka', 'Southern'],
  ['Kohima', 'Nagaland', 'North Eastern'], ['Ranchi', 'Jharkhand', 'Eastern'], ['Aizawl', 'Mizoram', 'North Eastern'],
  ['Dehradun', 'Uttarakhand', 'Northern'], ['Itanagar', 'Arunachal Pradesh', 'North Eastern'], ['Warangal', 'Telangana', 'Southern'],
  ['Gangtok', 'Sikkim', 'North Eastern'], ['Solan', 'Himachal Pradesh', 'Northern'], ['Jammu', 'Jammu & Kashmir', 'Northern'],
];
const PREFIXES = ['Arohan', 'Pragati', 'Sahaj', 'Udaya', 'Nirmal', 'Samarth', 'Prerna', 'Vihan', 'Navya', 'Srijan', 'Anvay', 'Tejas'];
const SUFFIXES = ['Vidyarekha', 'Navsetu', 'Prabodh', 'Vidyantara', 'Jnanadeep', 'Kalpavriksha', 'Vidyanidhi', 'Unnatpath', 'Prayogsetu', 'Dnyanankur'];
const TYPES = [
  ['Engineering', 'Institute of Engineering'], ['Management', 'School of Management'], ['Pharmacy', 'College of Pharmacy'],
  ['Polytechnic', 'Polytechnic Institute'], ['Architecture', 'School of Architecture'],
];

export function fictionalInstitutions() {
  return Array.from({ length: 120 }, (_, index) => {
    const [city, state, region] = PLACES[index % PLACES.length];
    const cohort = Math.floor(index / PLACES.length), [type, suffix] = TYPES[(index + cohort) % TYPES.length];
    const digest = crypto.createHash('sha256').update(`jury-institution|${index}`).digest('hex');
    const pid = `1-${1000000000 + Number(BigInt(`0x${digest.slice(0, 12)}`) % 9000000000n)}`;
    const icid = index % 20 === 4 ? null : index === 0 ? 'IIC-228M6C2D' : `IIC-${crypto.createHash('sha256').update(`${CATALOGUE_VERSION}|${pid}`).digest('hex').slice(0, 8).toUpperCase()}`;
    const stem = `${PREFIXES[index % PREFIXES.length]} ${SUFFIXES[Math.floor(index / PREFIXES.length)]}`;
    const name = `${stem} ${suffix}, ${city}`;
    const campuses = [{ campusId: `${pid}-C1`, name: `${stem} Main Campus`, parentPid: pid, ambiguous: false }];
    if (index % 4 === 1) campuses.push({ campusId: `${pid}-C2`, name: `${stem} Extension Campus`, parentPid: pid, ambiguous: false });
    return { pid, icid, name, city, district: city, state, region, type,
      establishedYear: 1984 + (index * 13 % 35), intake: [120, 180, 240, 360, 480, 600][index % 6],
      approvalValidUntil: `${2027 + index % 4}-06-30`, approvalStatus: index % 59 === 58 ? 'revoked' : index % 23 === 22 ? 'pending' : 'approved',
      aliases: [], campuses,
      synthetic: true, catalogueVersion: CATALOGUE_VERSION };
  });
}

export const searchWords = value => String(value || '').normalize('NFKC').toLocaleLowerCase('en-IN').split(/[^\p{L}\p{N}-]+/u).filter(Boolean);
export function institutionSearchTokens(row) {
  const tokens = new Set();
  const words = searchWords([row.name, row.city, row.state, row.pid, row.icid, ...(row.aliases || [])].filter(Boolean).join(' '));
  for (const word of words) {
    for (let length = 1; length <= Math.min(word.length, 100); length++) tokens.add(word.slice(0, length));
  }
  const acronymWords = words.filter(word => !['and', 'of', 'the', 'for', 'in', 'at'].includes(word));
  if (acronymWords.length > 1) {
    tokens.add(acronymWords.map(word => word[0]).join(''));
    tokens.add(words.map(word => word[0]).join(''));
  }
  return [...tokens];
}
