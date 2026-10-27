import { prepareLocalSemantic, localEmbeddingSimilarity, LOCAL_MODEL, LOCAL_MODEL_REVISION } from '../benchmark/localEmbeddings.js';
export const prepareSemantic = prepareLocalSemantic;
export const WEIGHTS = Object.freeze({ issue: 25, timeWindow: 15, category: 10, documentOrSubject: 15, remedy: 10, sharedEntities: 10, semantic: 15 });
const normalized = value => String(value || '').normalize('NFC').toLocaleLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ').trim();

function similarity(a, b) {
  if (!a.size || !b.size) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let shared = 0;
  for (const item of small) {
    if (large.has(item)) shared++;
  }
  return shared / (a.size + b.size - shared);
}

// Scale (S7): trigram and token sets are memoised by text (bounded), because listing overlaps
// compares each case with many others. Pure functions of the text, so results are unchanged.
const memo = new Map();
function cached(kind, value, build) {
  const key = `${kind}:${value}`;
  let hit = memo.get(key);
  if (!hit) {
    if (memo.size > 50000) memo.clear();
    hit = build(value);
    memo.set(key, hit);
  }
  return hit;
}

export function localSemantic(a, b, size = 3) {
  const grams = value => cached(`g${size}`, String(value || ''), buildGrams);
  const buildGrams = value => {
    const chars = Array.from(normalized(value));
    const result = new Set();
    if (chars.length && chars.length < size) result.add(chars.join(''));
    for (let i = 0; i <= chars.length - size; i++) result.add(chars.slice(i, i + size).join(''));
    return result;
  };
  const ga = grams(a), gb = grams(b);
  if (!ga.size || !gb.size) return 0;
  // S7 strengthening: also score containment (shared / smaller set), so the same complaint
  // re-sent with an extra sentence or a code-mixed phrase is not marked as a new issue.
  // Lexical only; still no learned model.
  const [small, large] = ga.size <= gb.size ? [ga, gb] : [gb, ga];
  let shared = 0;
  for (const item of small) {
    if (large.has(item)) shared++;
  }
  const jaccard = shared / (ga.size + gb.size - shared);
  const containment = shared / small.size;
  return Math.max(jaccard, containment);
}

export function signals(a, b, rules) {
  const exact = (x, y) => !!normalized(x) && normalized(x) === normalized(y) ? 1 : 0;
  const tokens = value => cached('t', String(value || ''), (v) => new Set(normalized(v).split(' ').filter(Boolean)));
  // Token Dice overlap tolerates a new detail without treating it as a new issue.
  const tokenJaccard = similarity(tokens(a.narrative), tokens(b.narrative));
  const issue = 2 * tokenJaccard / (1 + tokenJaccard);
  const intersection = (x = [], y = []) => similarity(new Set(x.map(normalized)), new Set(y.map(normalized)));
  const period = value => value?.start && value?.end ? [Date.parse(value.start), Date.parse(value.end)] : [];
  const pa = period(a.period), pb = period(b.period);
  const validPeriod = pa.length && pb.length && [...pa, ...pb].every(Number.isFinite) && pa[0] <= pa[1] && pb[0] <= pb[1];
  const lexical = localSemantic(a.narrative, b.narrative, rules.gramSize);
  const embedding = localEmbeddingSimilarity(a.narrative, b.narrative);
  const values = {
    issue,
    timeWindow: validPeriod && Math.max(pa[0], pb[0]) <= Math.min(pa[1], pb[1]) ? 1 : 0,
    category: exact(a.category, b.category),
    documentOrSubject: Math.max(intersection(a.documentIds?.map(String), b.documentIds?.map(String)), exact(a.subjectKey || a.subCategory, b.subjectKey || b.subCategory)),
    remedy: exact(a.remedy, b.remedy), sharedEntities: intersection(a.entities, b.entities),
    semantic: Math.max(lexical, embedding.available ? embedding.value : 0),
  };
  return Object.entries(WEIGHTS).map(([name, weight]) => ({ name, weight, value: values[name], contribution: values[name] * weight,
    reason: name === 'semantic' ? (embedding.available ? 'LOCAL_EMBEDDING_AND_LEXICAL' : 'LEXICAL_FALLBACK') : name === 'timeWindow' && !validPeriod ? 'PERIOD_NOT_AVAILABLE' : values[name] > 0 ? 'EVIDENCE_AGREES' : 'NO_SUPPORTING_EVIDENCE',
    ...(name === 'semantic' ? { lexicalValue: lexical, embeddingValue: embedding.available ? embedding.value : null, model: LOCAL_MODEL, modelRevision: LOCAL_MODEL_REVISION, ...(embedding.available ? {} : { fallbackReason: embedding.fallbackReason }) } : {}) }));
}

// Scale helper (S7): the token set and the issue score exactly as signals() computes them, so a
// caller can skip pairs that cannot reach minIssueSimilarity without running the full matcher.
export const issueTokens = (value) => new Set(normalized(value).split(' ').filter(Boolean));
export function issueScore(tokensA, tokensB) {
  const j = similarity(tokensA, tokensB);
  return 2 * j / (1 + j);
}
