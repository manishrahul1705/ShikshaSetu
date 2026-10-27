import { fail } from './common.js';
// RFC4180-style quoted fields/newlines; no formula evaluation or CSV export.
export function parseCsv(text) {
  if (typeof text !== 'string' || !text.length) throw fail(400, 'INVALID_CSV');
  const rows = []; let row = [], field = '', quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === '"' && !field && !closed) quoted = true;
    else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false;
      if (c !== ',') { rows.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
    } else { if (closed || c === '"') throw fail(400, 'INVALID_CSV'); field += c; }
  }
  if (quoted) throw fail(400, 'INVALID_CSV');
  if (field || row.length || closed) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  const allowed = ['reporterId', 'institutionPid', 'institutionIcid', 'category', 'subCategory', 'narrative', 'sourceSystem', 'sourceRef', 'sourceCaseRef'];
  if (!headers || new Set(headers).size !== headers.length || headers.some(key => !allowed.includes(key)) || ['reporterId','institutionPid','category','subCategory','narrative','sourceSystem'].some(key => !headers.includes(key)) || !headers.some(key => ['sourceRef','sourceCaseRef'].includes(key))) throw fail(400, 'INVALID_CSV_HEADERS');
  return rows.filter(values => values.some(Boolean)).map(values => {
    if (values.length !== headers.length) throw fail(400, 'INVALID_CSV_COLUMNS');
    const row = Object.fromEntries(headers.map((key, index) => [key, values[index]]));
    if (row.sourceRef && row.sourceCaseRef && row.sourceRef !== row.sourceCaseRef) throw fail(400, 'CONFLICTING_SOURCE_REFERENCE');
    row.sourceCaseRef = row.sourceRef || row.sourceCaseRef;
    row.sourceRef = row.sourceCaseRef;
    return row;
  });
}
