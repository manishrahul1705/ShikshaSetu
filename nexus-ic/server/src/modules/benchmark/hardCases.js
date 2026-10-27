import crypto from 'node:crypto';
import { generate } from '../additions/n48-data-generator/generator.js';
import { matchCases } from '../prevent/index.js';

/**
 * Hard-case benchmark for the PREVENT matcher (S7 jury-audit fix, under N48).
 *
 * The original fixtures (exact copy, one-letter typo, different PID) are easy. These strata are
 * the cases a judge will ask about. Labels come from how each pair is built, never from the
 * matcher. Synthetic only: this is not pilot accuracy.
 *   same_pid_different_issue  same institution, different category and complaint text -> CLEAR
 *   same_category_other_text  same institution and category, a different complaint     -> CLEAR
 *   paraphrase                same institution and issue, reworded and reordered      -> REVIEW
 *   code_mixed                same complaint plus a Hindi / Tamil / Hinglish phrase   -> REVIEW
 *   new_detail                same complaint plus one new factual sentence            -> REVIEW
 */
const SYNONYMS = [
  [/\bexcessive\b/gi, 'too high'], [/\bfees\b/gi, 'charges'], [/\bvery poor\b/gi, 'really bad'], [/\bpoor\b/gi, 'bad'],
  [/\bmanagement\b/gi, 'the administration'], [/\bnot following\b/gi, 'ignoring'], [/\bleaked\b/gi, 'made public'],
  [/\bcharging\b/gi, 'collecting'], [/\bstudents\b/gi, 'learners'], [/\bno proper\b/gi, 'no adequate'], [/\bapproved\b/gi, 'sanctioned'],
];
const CODE_MIXED = ['kripya jaldi madad karein', 'इस पर ध्यान दें', 'udhavi seyyungal', 'bahut pareshani ho rahi hai'];
const NEW_DETAIL = ['This has continued for two semesters.', 'Several classmates face the same problem.', 'A written request was ignored last month.'];

export function paraphrase(text) {
  let out = text;
  for (const [re, to] of SYNONYMS) out = out.replace(re, to);
  const sentences = out.split(/(?<=\.)\s+/).filter(Boolean);
  return sentences.length > 1 ? [...sentences.slice(1), sentences[0]].join(' ') : out;
}

export function hardFixtures(seed = 'S7-N48-hard-v1') {
  const { complaints } = generate({ count: 1200, seed });
  const byPid = new Map();
  for (const c of complaints) {
    if (!byPid.has(c.institutionPid)) byPid.set(c.institutionPid, []);
    byPid.get(c.institutionPid).push(c);
  }
  const pairs = [];
  const asCase = (c, narrative = c.narrative) => ({ institutionPid: c.institutionPid, narrative, category: c.category, subCategory: c.subCategory, synthetic: true });
  for (const rows of byPid.values()) {
    for (let i = 0; i < rows.length && pairs.length < 5000; i++) {
      const a = rows[i];
      const other = rows.find((r) => r.category !== a.category && r.narrative.split('.')[0] !== a.narrative.split('.')[0]);
      if (other) pairs.push({ a: asCase(a), b: asCase(other), expected: 'CLEAR', stratum: 'same_pid_different_issue' });
      const sameCat = rows.find((r) => r !== a && r.category === a.category && r.narrative.split('.')[0] !== a.narrative.split('.')[0]);
      if (sameCat) pairs.push({ a: asCase(a), b: asCase(sameCat), expected: 'CLEAR', stratum: 'same_category_other_text' });
      if (paraphrase(a.narrative) !== a.narrative) pairs.push({ a: asCase(a), b: asCase(a, paraphrase(a.narrative)), expected: 'REVIEW', stratum: 'paraphrase' });
      pairs.push({ a: asCase(a), b: asCase(a, `${a.narrative} ${CODE_MIXED[i % CODE_MIXED.length]}`), expected: 'REVIEW', stratum: 'code_mixed' });
      pairs.push({ a: asCase(a), b: asCase(a, `${a.narrative} ${NEW_DETAIL[i % NEW_DETAIL.length]}`), expected: 'REVIEW', stratum: 'new_detail' });
    }
  }
  return pairs;
}

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);

export async function evaluateHard(rules, pairs = hardFixtures()) {
  const strata = {};
  const total = { truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0, unknown: 0 };
  for (const pair of pairs) {
    const s = (strata[pair.stratum] ||= { pairs: 0, expected: pair.expected, correct: 0, unknown: 0, truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0 });
    s.pairs++;
    const result = (await matchCases(pair.a, pair.b, rules)).result;
    if (result === 'UNKNOWN') { s.unknown++; total.unknown++; continue; }
    const ok = result === pair.expected;
    if (ok) s.correct++;
    const outcome = pair.expected === 'REVIEW' ? (ok ? 'truePositive' : 'falseNegative') : (ok ? 'trueNegative' : 'falsePositive');
    total[outcome]++; s[outcome]++;
  }
  for (const s of Object.values(strata)) {
    s.correctPercent = pct(s.correct, s.pairs - s.unknown);
    s.accuracy = { value: s.correctPercent, numerator: s.correct, denominator: s.pairs - s.unknown, scope: 'evaluated labelled pairs in this stratum' };
    s.precision = { value: pct(s.truePositive, s.truePositive + s.falsePositive), numerator: s.truePositive, denominator: s.truePositive + s.falsePositive, scope: 'pairs flagged for review in this stratum' };
    s.recall = { value: pct(s.truePositive, s.truePositive + s.falseNegative), numerator: s.truePositive, denominator: s.truePositive + s.falseNegative, scope: 'pairs labelled as the same matter in this stratum' };
  }
  const precision = pct(total.truePositive, total.truePositive + total.falsePositive);
  const recall = pct(total.truePositive, total.truePositive + total.falseNegative);
  return {
    label: 'SYNTHETIC DATA - hard cases, not a real-world accuracy claim',
    synthetic: true,
    fixtureVersion: 'S7-N48-hard-v1',
    fixtureHash: crypto.createHash('sha256').update(JSON.stringify(pairs)).digest('hex'),
    ruleVersion: rules.version || null,
    denominator: pairs.length,
    ...total,
    precisionPercent: precision,
    recallPercent: recall,
    precision: { value: precision, numerator: total.truePositive, denominator: total.truePositive + total.falsePositive, scope: 'pairs the matcher flagged REVIEW' },
    recall: { value: recall, numerator: total.truePositive, denominator: total.truePositive + total.falseNegative, scope: 'pairs built as the same issue' },
    strata,
    method: 'Matcher signals are lexical (word overlap and character trigrams) plus category and subject agreement; there is no learned language model.',
  };
}
