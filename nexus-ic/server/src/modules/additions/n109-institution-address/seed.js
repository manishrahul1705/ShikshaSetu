import { readFile } from 'node:fs/promises';
import { parseOfficialCsv } from '../../registry/adapters.js';
// Official records never receive an invented address. This helper adds one new
// field only; source rows, identifiers and all existing attributes are preserved.
export function addressFor(row, officialRows = []) {
  const official = officialRows.find(r => r.pid === row.pid);
  if (official) return official.address || null;
  if (row.synthetic === false || row.source?.kind === 'official' || row.provenance) return row.address || null;
  const location = [...new Set([row.city, row.district, row.state].filter(Boolean))].join(', ');
  return row.address || (location ? `Fictional campus address: ${location}` : null);
}
export async function optionalAddressRows(csvPath = new URL('../../../../../data/aicte/institutions.csv', import.meta.url)) {
  try { return parseOfficialCsv(await readFile(csvPath, 'utf8')).rows; }
  catch (e) { if (e.code === 'ENOENT') return []; throw e; }
}
