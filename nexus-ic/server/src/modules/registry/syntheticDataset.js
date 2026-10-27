import crypto from 'node:crypto';

export const SYNTHETIC_DATASET_NAME = 'SYNTH-DATASET';
export const SYNTHETIC_DATASET_VERSION = 'SYNTH-DATASET-v1';

const STATES = [
  ['Andhra Pradesh', 'Southern'], ['Arunachal Pradesh', 'North Eastern'], ['Assam', 'North Eastern'],
  ['Bihar', 'Eastern'], ['Chhattisgarh', 'Central'], ['Goa', 'Western'], ['Gujarat', 'Western'],
  ['Haryana', 'Northern'], ['Himachal Pradesh', 'Northern'], ['Jharkhand', 'Eastern'], ['Karnataka', 'Southern'],
  ['Kerala', 'Southern'], ['Madhya Pradesh', 'Central'], ['Maharashtra', 'Western'], ['Manipur', 'North Eastern'],
  ['Meghalaya', 'North Eastern'], ['Mizoram', 'North Eastern'], ['Nagaland', 'North Eastern'], ['Odisha', 'Eastern'],
  ['Punjab', 'Northern'], ['Rajasthan', 'Central'], ['Sikkim', 'North Eastern'], ['Tamil Nadu', 'Southern'],
  ['Telangana', 'Southern'], ['Tripura', 'North Eastern'], ['Uttar Pradesh', 'Northern'], ['Uttarakhand', 'Northern'],
  ['West Bengal', 'Eastern'], ['Delhi', 'Northern'], ['Jammu & Kashmir', 'Northern'], ['Ladakh', 'Northern'],
  ['Puducherry', 'Southern'], ['Chandigarh', 'Northern'], ['Dadra & Nagar Haveli and Daman & Diu', 'Western'],
  ['Andaman & Nicobar Islands', 'Eastern'], ['Lakshadweep', 'Southern'],
];
const CITIES = ['Aviraj', 'Bhanur', 'Chitrak', 'Devansh', 'Eshara', 'Falak', 'Gaurin', 'Harit', 'Ishaan', 'Jivika'];
const PREFIXES = ['Arohan', 'Navchetna', 'Pragati', 'Suryodaya', 'Vistaar', 'Udbhav', 'Kshitij', 'Nirmaya'];
const TYPES = ['Engineering', 'Management', 'Pharmacy', 'Polytechnic', 'Architecture'];

const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const pidFor = index => `1-${1000000000 + Number(BigInt(`0x${digest(`pid:${index}`).slice(0, 12)}`) % 9000000000n)}`;
const icidFor = index => index % 17 === 0 ? null : `IIC-${digest(`icid:${index}`).slice(0, 8).toUpperCase()}`;

export function syntheticInstitutions(count = 600) {
  return Array.from({ length: count }, (_, index) => {
    const [state, region] = STATES[index % STATES.length];
    const city = `${CITIES[index % CITIES.length]} Nagar`;
    const stem = `${PREFIXES[index % PREFIXES.length]} ${CITIES[(index * 3) % CITIES.length]}`;
    const type = TYPES[index % TYPES.length];
    const name = `${stem} ${type} Academy ${index + 1}, ${city}`;
    const acronym = name.split(/[\s,]+/).filter(Boolean).map(word => word[0]).join('').toUpperCase();
    const pid = pidFor(index);
    return {
      pid, icid: icidFor(index), name, aliases: [acronym, `${stem} ${type}`],
      city, district: city, state, region, type,
      programmes: [`${type} programme`, 'Synthetic civic technology programme'],
      intake: 120 + (index % 7) * 60, establishedYear: 1985 + (index % 36),
      approvalStatus: index % 43 === 0 ? 'pending' : 'approved',
      approvalValidUntil: `${2027 + (index % 3)}-06-30`,
      coordinates: { latitude: 8 + ((index * 17) % 280) / 10, longitude: 68 + ((index * 29) % 290) / 10, label: 'synthetic location' },
      synthetic: true, datasetName: SYNTHETIC_DATASET_NAME, datasetVersion: SYNTHETIC_DATASET_VERSION,
      campuses: [{ campusId: `${pid}-C1`, name: `${stem} Main Campus`, parentPid: pid, ambiguous: false }],
    };
  });
}

export function syntheticStudents(count = 1500, institutions = syntheticInstitutions()) {
  const first = ['Avir', 'Bela', 'Chayan', 'Driti', 'Eshan', 'Fari', 'Gauri', 'Hiran', 'Ira', 'Jovan'];
  const last = ['Miran', 'Nivar', 'Orin', 'Pavan', 'Riva', 'Sayan', 'Tarin', 'Uvan', 'Veda', 'Yuvan'];
  return Array.from({ length: count }, (_, index) => {
    const id = String(100000000000 + index);
    const institution = institutions[index % institutions.length];
    const revoked = index % 97 === 0;
    return {
      id, display: `${id.slice(0, 4)}-${id.slice(4, 8)}-${id.slice(8)}`,
      name: `${first[index % first.length]} ${last[(index * 3) % last.length]}`,
      programme: institution.programmes[0], year: 1 + (index % 4),
      pid: institution.pid, status: revoked ? 'REVOKED' : 'VERIFIED',
      revoked, active: !revoked,
      synthetic: true, datasetName: SYNTHETIC_DATASET_NAME, datasetVersion: SYNTHETIC_DATASET_VERSION,
    };
  });
}
