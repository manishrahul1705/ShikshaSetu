// N97 smart college matching: acronyms, aliases, short forms, typos, ranked.
// Pure functions; the caller supplies candidate rows (fictional catalogue in the
// Institution collection and any imported OfficialInstitution rows).

const STOP_WORDS = new Set(['and', 'of', 'the', 'for', 'in', 'at', '&']);
// Expanded in the query only; stored names are never rewritten.
export const SHORT_FORMS = {
  engg: 'engineering', engr: 'engineering', inst: 'institute', instt: 'institute',
  tech: 'technology', univ: 'university', coll: 'college', clg: 'college', sch: 'school',
  mgmt: 'management', pharm: 'pharmacy', poly: 'polytechnic',
};
export const MAX_RESULTS = 20;

export function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export const words = value => normalize(value).split(' ').filter(Boolean);

export function expandQuery(query) {
  return words(query).map(word => SHORT_FORMS[word] || word);
}

/** Initials of the significant words, with and without the trailing ", City". */
export function acronymsOf(name) {
  const full = String(name || '');
  const variants = new Set();
  for (const text of [full, full.split(',')[0]]) {
    const significant = words(text).filter(word => !STOP_WORDS.has(word));
    if (significant.length > 1) variants.add(significant.map(word => word[0]).join(''));
    const all = words(text);
    if (all.length > 1) variants.add(all.map(word => word[0]).join(''));
  }
  return [...variants];
}

/** Damerau-Levenshtein distance, stopping early once it exceeds max. */
export function editDistance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      best = Math.min(best, rows[i][j]);
    }
    if (best > max) return max + 1;
  }
  return rows[a.length][b.length];
}

const allowedTypos = word => (word.length >= 8 ? 2 : word.length >= 4 ? 1 : 0);

/**
 * Rank one row against a query. Returns a tier (0 best) or null for no match.
 * 0 exact PID / ICID / acronym / alias; 1 prefix; 2 substring; 3 close spelling.
 */
export function matchTier(row, query) {
  const raw = String(query || '').trim();
  if (!raw) return null;
  const q = normalize(raw);
  const compact = q.replace(/ /g, '');
  if (row.pid && raw === row.pid) return 0;
  if (row.icid && raw.toUpperCase() === row.icid) return 0;
  const aliases = (row.aliases || []).map(normalize);
  if (aliases.includes(q)) return 0;
  // "sece" and dotted forms like "s.e.c.e" are both acronym queries.
  const acronymQuery = !q.includes(' ') || q.split(' ').every(part => part.length === 1);
  if (acronymQuery && compact.length >= 2 && acronymsOf(row.name).includes(compact)) return 0;
  if (aliases.some(alias => alias.replace(/ /g, '') === compact)) return 0;

  const queryWords = expandQuery(raw);
  const name = normalize(row.name);
  const nameWords = name.split(' ');
  const haystackWords = words([row.name, row.city, row.district, row.state, row.pid, row.icid, ...(row.aliases || [])].join(' '));
  const expanded = queryWords.join(' ');
  if (name.startsWith(expanded) || (queryWords.every(word => haystackWords.some(h => h.startsWith(word))) && nameWords.some(w => w.startsWith(queryWords[0])))) return 1;
  const haystack = haystackWords.join(' ');
  if (haystack.includes(expanded) || queryWords.every(word => haystackWords.some(h => h.startsWith(word) || h.includes(word)))) return 2;
  const typoMatch = queryWords.every(word => {
    const limit = allowedTypos(word);
    return haystackWords.some(h => h.startsWith(word)
      || (limit > 0 && (editDistance(word, h, limit) <= limit || editDistance(word, h.slice(0, word.length), limit) <= limit)));
  });
  return typoMatch ? 3 : null;
}

/** Rank and bound candidates. Close spelling is offered only when nothing matches exactly. */
export function rankInstitutions(rows, query, limit = MAX_RESULTS) {
  const scored = [];
  for (const row of rows) {
    const tier = matchTier(row, query);
    if (tier !== null) scored.push({ row, tier });
  }
  const exact = scored.filter(item => item.tier < 3);
  const chosen = exact.length ? exact : scored;
  return chosen.sort((a, b) => a.tier - b.tier || String(a.row.name).localeCompare(String(b.row.name)) || String(a.row.pid).localeCompare(String(b.row.pid)))
    .slice(0, limit).map(item => ({ ...item.row, matchTier: item.tier }));
}
