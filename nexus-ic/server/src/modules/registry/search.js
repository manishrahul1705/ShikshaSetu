import Institution from '../institutions/Institution.js';
import InstitutionIdentifier from '../institutions/InstitutionIdentifier.js';
import { searchWords } from './catalogue.js';
import { officialSearch, toRegistryResult } from './adapters.js';
import OfficialInstitution from './OfficialInstitution.js';
import { matchTier, rankInstitutions } from './smartSearch.js';

const PICKER_FIELDS = 'pid name city district state region type approvalStatus icid aliases campuses intake establishedYear approvalValidUntil registrySnapshot';
// N97: whole-list candidates for acronym, short-form and close-spelling matches.
async function smartCandidates(q, filter) {
  if (!q || /^IIC-[A-Z0-9]{8}$/i.test(q) || /^1-\d{10}$/.test(q)) return { local: [], official: [] };
  const [local, official] = await Promise.all([
    Institution.find(filter).limit(5000).select(PICKER_FIELDS).lean(),
    OfficialInstitution.find(filter).limit(20000).lean(),
  ]);
  return { local: rankInstitutions(local, q), official: rankInstitutions(official, q) };
}

const literalRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function parameter(value) {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 100) throw Object.assign(new Error('INVALID_QUERY'), { status: 400 });
  return value.trim();
}

/** Public institution metadata only. An ICID resolves to a PID, never a link/merge. */
export async function searchInstitutions(input = {}) {
  const q = parameter(input.q), state = parameter(input.state), region = parameter(input.region);
  const officialRows = q ? [...await officialSearch(q)] : [];
  const filter = {};
  if (state) filter.state = state;
  if (region) filter.region = region;
  if (/^IIC-[A-Z0-9]{8}$/i.test(q)) {
    const mappings = await InstitutionIdentifier.find({ icid: q.toUpperCase(), status: 'active' }).select('pid').lean();
    filter.pid = { $in: [...new Set(mappings.map(row => row.pid))] };
  } else if (/^1-\d{10}$/.test(q)) filter.pid = q;
  else if (q) {
    const words = searchWords(q);
    if (!words.length) return { institutions: [], limit: 20, authoritativeKey: 'pid' };
    const regex = literalRegex(q);
    filter.$or = [
      { pickerTokens: { $all: words } },
      { pickerTokens: { $exists: false }, $or: ['name', 'state', 'city', 'pid', 'icid'].map(field => ({ [field]: { $regex: regex, $options: 'i' } })) },
    ];
  }
  const baseFilter = {};
  if (state) baseFilter.state = state;
  if (region) baseFilter.region = region;
  const smart = await smartCandidates(q, baseFilter);
  const plainRows = await Institution.find(filter).collation({ locale: 'en', strength: 2 }).sort({ name: 1, pid: 1 }).limit(20)
    .select(PICKER_FIELDS).lean();
  const tierOf = row => row.matchTier ?? matchTier(row, q) ?? 2.5;
  const byTier = (a, b) => (q ? tierOf(a) - tierOf(b) : 0);
  const rows = [...new Map([...plainRows, ...smart.local].map(row => [row.pid, row])).values()].sort(byTier).slice(0, 20);
  for (const row of smart.official) if (!officialRows.some(existing => existing.pid === row.pid)) officialRows.push(row);
  officialRows.sort(byTier);
  const tiers = new Map([...officialRows, ...rows].map(row => [row.pid, tierOf(row)]));
  const identifiers = rows.length ? await InstitutionIdentifier.find({ status: 'active', $or: [
    { pid: { $in: rows.map(row => row.pid) } }, { icid: { $in: rows.map(row => row.icid).filter(Boolean) } },
  ] }).select('pid icid').lean() : [];
  const official = officialRows.map(row => {
    const result = toRegistryResult(row);
    return {
      pid: result.pid, icid: result.icid || null, name: result.name, city: result.city || null,
      state: result.state, region: result.region || null, type: result.type || null,
      approvalStatus: result.approvalStatus || 'UNKNOWN', icidCheck: result.icid ? 'MATCH' : 'NOT_AVAILABLE',
      source: result.source,
    };
  });
  return {
    authoritativeKey: 'pid', limit: 20,
    institutions: [...official, ...rows.map(row => {
      const icid = row.icid || identifiers.find(mapping => mapping.pid === row.pid)?.icid || null;
      const matches = identifiers.filter(mapping => mapping.icid === icid);
      const icidCheck = !icid ? 'NOT_AVAILABLE' : matches.length === 1 && matches[0].pid === row.pid ? 'MATCH' : 'IDENTITY_REVIEW';
      return { pid: row.pid, icid, name: row.name, city: row.city || row.registrySnapshot?.city || null,
        state: row.state, region: row.region, type: row.type, approvalStatus: row.approvalStatus, icidCheck };
    })].map((row, index) => ({ row, index })).sort((a, b) => (q ? tiers.get(a.row.pid) - tiers.get(b.row.pid) : 0) || a.index - b.index).map(item => item.row).slice(0, 20),
  };
}
