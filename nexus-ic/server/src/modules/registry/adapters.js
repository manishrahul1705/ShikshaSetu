import crypto from 'node:crypto';
import OfficialInstitution from './OfficialInstitution.js';
import { fictionalInstitutions, institutionSearchTokens, searchWords } from './catalogue.js';

export const LIVE_LOOKUP_ERROR = 'LIVE_IIC_AICTE_LOOKUP_NOT_CONFIGURED';
const PID_PATTERN = /^1-\d{10}$/;
const ICID_PATTERN = /^IIC-[A-Z0-9]{8}$/;

const source = (kind, details = {}) => ({
  kind,
  label: kind === 'official' ? `Official AICTE list as of ${details.listDate}` : 'Fictional demo data',
  ...details,
});

export function validateRegistryRow(row) {
  const pid = String(row.pid || '').trim();
  const icid = String(row.icid || '').trim().toUpperCase();
  const errors = [];
  if (!PID_PATTERN.test(pid)) errors.push('PID must match 1-XXXXXXXXXX');
  if (icid && !ICID_PATTERN.test(icid)) errors.push('ICID must match IIC-XXXXXXXX');
  if (!String(row.name || '').trim()) errors.push('institution name is required');
  if (!String(row.state || '').trim()) errors.push('state is required');
  return { valid: errors.length === 0, errors, value: { ...row, pid, icid: icid || undefined, name: String(row.name || '').trim(), state: String(row.state || '').trim() } };
}

// N98: tolerant header mapping for official AICTE / IIC exports. Each field lists
// the header spellings accepted (compared lower-case, punctuation as "_").
export const HEADER_ALIASES = {
  pid: ['pid', 'aicte_permanent_id', 'permanent_institute_id', 'permanent_id', 'aicte_id', 'aicte_pid', 'institute_permanent_id', 'permanent_institution_id'],
  icid: ['icid', 'iic_id', 'iic_icid', 'institution_council_id', 'innovation_council_id'],
  name: ['name', 'institute_name', 'institution_name', 'name_of_the_institute', 'name_of_institution', 'college_name'],
  city: ['city', 'town', 'city_town', 'city_name'],
  state: ['state', 'state_name', 'state_ut', 'state_union_territory'],
  district: ['district', 'district_name'],
  region: ['region', 'aicte_region', 'regional_office'],
  type: ['type', 'institution_type', 'institute_type', 'type_of_institution', 'institution_category'],
  address: ['address', 'institute_address', 'postal_address'],
  approvalStatus: ['approval_status', 'status'],
  aliases: ['aliases', 'alias', 'short_name', 'abbreviation'],
  programmes: ['programmes', 'programme', 'program', 'programs', 'course', 'courses'],
};
const headerKey = value => String(value || '').replace(/^﻿/, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** RFC 4180 CSV: quoted fields may hold commas, quotes ("") and line breaks. */
export function csvRecords(text) {
  const records = [];
  let field = '', record = [], quoted = false;
  const input = String(text || '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === '') quoted = true;
    else if (char === ',') { record.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      record.push(field); field = '';
      if (record.some(value => value.trim())) records.push(record);
      record = [];
    } else field += char;
  }
  record.push(field);
  if (record.some(value => value.trim())) records.push(record);
  return records;
}

export function mapHeaders(headers) {
  const keys = headers.map(headerKey);
  const mapped = {}, unknown = [];
  keys.forEach((key, index) => {
    const field = Object.keys(HEADER_ALIASES).find(name => HEADER_ALIASES[name].includes(key));
    if (field && mapped[field] === undefined) mapped[field] = index;
    else if (!field) unknown.push(String(headers[index]).replace(/^﻿/, '').trim());
  });
  return { mapped, unknown };
}

export function parseOfficialCsv(csv) {
  const records = csvRecords(csv);
  if (!records.length) return { rows: [], errors: ['CSV is empty'], columns: { mapped: [], unknown: [] } };
  const headers = records.shift();
  const { mapped, unknown } = mapHeaders(headers);
  const rows = [];
  const errors = [];
  const list = value => (value ? value.split(';').map(item => item.trim()).filter(Boolean) : []);
  records.forEach((values, index) => {
    const cell = field => (mapped[field] === undefined ? undefined : (values[mapped[field]] || '').trim() || undefined);
    // Missing values stay absent; nothing is inferred or defaulted.
    const row = {
      pid: cell('pid'), icid: cell('icid'), name: cell('name'), city: cell('city'), state: cell('state'),
      district: cell('district'), region: cell('region'), type: cell('type'), address: cell('address'),
      approvalStatus: cell('approvalStatus'), aliases: list(cell('aliases')), programmes: list(cell('programmes')),
    };
    for (const key of Object.keys(row)) if (row[key] === undefined) delete row[key];
    const checked = validateRegistryRow(row);
    if (checked.valid) {
      for (const key of Object.keys(checked.value)) if (checked.value[key] === undefined) delete checked.value[key];
      rows.push(checked.value);
    } else errors.push({ row: index + 2, errors: checked.errors, value: row });
  });
  return { rows, errors, columns: { mapped: Object.keys(mapped), unknown } };
}

export async function previewOfficialImport({ csv, sourceFileName, listDate, importer }) {
  const parsed = parseOfficialCsv(csv);
  const existing = parsed.rows.length ? await OfficialInstitution.find({ pid: { $in: parsed.rows.map(row => row.pid) } }).select('pid').lean() : [];
  const existingPids = new Set(existing.map(row => row.pid));
  return {
    ...parsed,
    counts: {
      new: parsed.rows.filter(row => !existingPids.has(row.pid)).length,
      updated: parsed.rows.filter(row => existingPids.has(row.pid)).length,
      rejected: parsed.errors.length,
    },
    provenance: { sourceFileName, listDate, importer },
  };
}

export async function importOfficialCsv({ csv, sourceFileName, listDate, importer, acceptValidRows = false }) {
  const preview = await previewOfficialImport({ csv, sourceFileName, listDate, importer });
  // Default stays all-or-nothing; N98 lets an admin import the valid rows after
  // reviewing the rejected ones in the preview.
  if (preview.errors.length && !(acceptValidRows === true && preview.rows.length)) return { ...preview, written: false };
  if (!sourceFileName || !/^\d{4}-\d{2}-\d{2}$/.test(String(listDate || ''))) return { ...preview, written: false, error: 'SOURCE_FILE_AND_LIST_DATE_REQUIRED' };
  const fileHash = crypto.createHash('sha256').update(String(csv)).digest('hex');
  const provenance = { ...preview.provenance, importedAt: new Date(), fileHash };
  await Promise.all(preview.rows.map(row => OfficialInstitution.updateOne(
    { pid: row.pid },
    { $set: { ...row, provenance } },
    { upsert: true },
  )));
  return { ...preview, written: true, fileHash };
}

export async function officialSearch(query = '') {
  const value = String(query).trim();
  if (!value) return [];
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (value.match(ICID_PATTERN)) return OfficialInstitution.find({ icid: value.toUpperCase() }).limit(20).lean();
  if (value.match(PID_PATTERN)) return OfficialInstitution.find({ pid: value }).limit(20).lean();
  const direct = await OfficialInstitution.find({
    $or: ['name', 'state', 'district', 'icid', 'aliases'].map(field => ({ [field]: { $regex: escaped, $options: 'i' } })),
  }).limit(20).lean();
  const words = searchWords(value);
  if (!words.length) return direct;
  const acronymMatches = await OfficialInstitution.find({}).limit(1000).lean();
  return [...new Map([...direct, ...acronymMatches.filter(row => {
    const tokens = new Set(institutionSearchTokens(row));
    return words.every(word => tokens.has(word));
  })].map(row => [row.pid, row])).values()].slice(0, 20);
}

export const fictionalAdapter = {
  describe: () => source('fictional'),
  search: query => fictionalInstitutions().filter(row => `${row.name} ${row.pid} ${row.icid || ''}`.toLowerCase().includes(String(query).toLowerCase())).slice(0, 20),
  getByPid: pid => fictionalInstitutions().find(row => row.pid === pid) || null,
  getByIcid: icid => fictionalInstitutions().find(row => row.icid === String(icid).toUpperCase()) || null,
};

export const liveAdapter = {
  describe: () => ({ kind: 'live', label: 'Live IIC/AICTE lookup: awaiting official API access', enabled: false }),
  search: () => { throw new Error(LIVE_LOOKUP_ERROR); },
  getByPid: () => { throw new Error(LIVE_LOOKUP_ERROR); },
  getByIcid: () => { throw new Error(LIVE_LOOKUP_ERROR); },
};

export function toRegistryResult(row, kind = 'official') {
  return { ...row, source: source(kind, row.provenance || {}) };
}
