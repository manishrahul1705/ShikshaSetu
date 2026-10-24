import ResearchInstitution from './ResearchInstitution.js';
import { acronymsOf, expandQuery, words, rankInstitutions } from '../registry/smartSearch.js';

export const CAVEAT = 'INCOMPLETE - NOT A CERTIFIED ALL-INDIA APPROVAL LIST';
export const cleanCell = value => !value || /^(not publicly verified|unknown|n\/a)$/i.test(String(value).trim()) ? null : String(value).trim();
export const sourcePid = value => /^(1-\d{6,11}|\d{11})$/.test(String(value || ''));
export function tokensFor(row) {
  const tokens = new Set([...words([row.name, row.city, row.state, row.district, ...(row.aliases || [])].join(' ')), ...acronymsOf(row.name)]);
  // Prefixes let bounded indexed lookups handle partial names without scanning.
  for (const token of [...tokens]) for (let i = 2; i < token.length; i++) tokens.add(token.slice(0, i));
  return [...tokens];
}
export function normalizeResearchRow(entry, dataset, regionByState = {}) {
  const raw = entry.raw;
  const pid = cleanCell(raw.PID), state = cleanCell(raw.State);
  if (pid && !sourcePid(pid)) throw new Error(`UNEXPECTED_SOURCE_PID_ROW_${entry.sourceRow}`);
  const row = {
    sourceKey: `${dataset.fileHash}:Master colleges:${entry.sourceRow}`, pid,
    // This workbook does not establish the meaning or verification of IC ID.
    icid: null, name: cleanCell(raw['College Name']), state,
    district: cleanCell(raw.District), city: cleanCell(raw.City), address: cleanCell(raw['Complete Address']),
    type: cleanCell(raw['College Type']), approvalStatus: cleanCell(raw['AICTE Status']) || 'UNKNOWN',
    academicYear: cleanCell(raw['Academic Year']), raw,
    region: regionByState[state] || null,
    regionReason: regionByState[state] ? 'Derived from configured DEMO-REGIONS-v1; not an official jurisdiction assertion' : 'UNKNOWN: state has no configured demo region',
    aliases: [], programmes: [],
    pidFormat: !pid ? 'missing' : pid.startsWith('1-') ? 'source-prefixed' : 'nonstandard-source',
    missingReasons: { ...(!pid ? { pid: 'UNKNOWN (not in source)' } : {}), icid: 'Not publicly verified in supplied workbook' },
    provenance: { sourceFileName: dataset.sourceFileName, fileHash: dataset.fileHash, sheet: 'Master colleges', row: entry.sourceRow,
      snapshotDate: '2026-10-27', verificationDate: cleanCell(raw['Verification Date']), sourceUrl: cleanCell(raw['Source URL']),
      approvalEvidenceUrl: cleanCell(raw['Approval Evidence URL']), incompleteSource: true, caveat: CAVEAT },
  };
  if (!row.name) throw new Error(`MISSING_NAME_ROW_${entry.sourceRow}`);
  return row;
}
export function publicResearchResult(row) {
  const { pickerTokens, __v, ...result } = row;
  return { ...result, recordKey: row.sourceKey, source: { kind: 'research', label: 'Supplied AICTE research export · 27 Oct 2026', ...row.provenance },
    icidCheck: 'NOT_AVAILABLE', demoCaseTarget: false };
}
export async function researchSearch({ q = '', state = '', region = '', offset = 0, limit = 20 } = {}) {
  const filter = {};
  if (state) filter.state = state === 'Jammu & Kashmir' ? 'Jammu and Kashmir' : state === 'Andaman & Nicobar' ? 'Andaman and Nicobar Islands' : state;
  if (region) filter.region = region;
  if (q) {
    if (sourcePid(q)) filter.pid = q;
    else {
      const queryWords = expandQuery(q);
      if (!queryWords.length) return [];
      filter.pickerTokens = { $all: queryWords };
    }
  }
  const rows = await ResearchInstitution.find(filter).sort({ name: 1, sourceKey: 1 }).skip(offset).limit(q ? 100 : limit).lean();
  return (q ? rankInstitutions(rows, q, limit) : rows).map(publicResearchResult);
}
