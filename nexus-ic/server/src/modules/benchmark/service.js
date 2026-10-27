import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { generate } from '../additions/n48-data-generator/generator.js';
import { matchCases, getRules } from '../prevent/index.js';
import { audit, fail } from '../channels/common.js';
import { getActiveRule } from '../rulebook/index.js';
import { evaluateHard } from './hardCases.js';
export const BenchmarkRun = mongoose.model('MatcherBenchmarkRun', new mongoose.Schema({ summary: { type: mongoose.Schema.Types.Mixed, required: true } }, { timestamps: true, strict: 'throw' }), 'benchmark_runs');

// Labels originate from fixture construction, never from matcher's predictions.
// Scope deliberately measures exact duplicates, local typo variants, and different-PID negatives;
// it is not a pilot, semantic-ground-truth corpus, or evidence of actions avoided.
export function fixtures() {
  const source = generate({ count: 1000, seed: 'S6a-N48-v1' });
  return source.complaints.flatMap((row, i) => {
    const base = { institutionPid: row.institutionPid, narrative: row.narrative, category: row.category, subCategory: row.subCategory, synthetic: true };
    const variant = { ...base, narrative: row.narrative.replace(/college/gi, 'collge') };
    const otherPid = source.institutions.find(inst => inst.pid !== row.institutionPid).pid;
    return [
      { a: base, b: { ...base }, expected: 'REVIEW', stratum: 'exact_duplicate' },
      { a: base, b: variant, expected: 'REVIEW', stratum: 'local_typo' },
      { a: base, b: { ...base, institutionPid: otherPid }, expected: 'CLEAR', stratum: 'different_pid' },
    ];
  });
}
export async function evaluate(rules, pairs = fixtures()) {
  const started = performance.now();
  const counts = { truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0, unknown: 0 };
  for (const pair of pairs) {
    const result = await matchCases(pair.a, pair.b, rules);
    if (result.result === 'UNKNOWN') counts.unknown++;
    else if (pair.expected === 'REVIEW') counts[result.result === 'REVIEW' ? 'truePositive' : 'falseNegative']++;
    else counts[result.result === 'CLEAR' ? 'trueNegative' : 'falsePositive']++;
  }
  const correct = counts.truePositive + counts.trueNegative;
  const evaluated = pairs.length - counts.unknown;
  const nonDuplicatePairs = pairs.filter(pair => pair.expected === 'CLEAR').length;
  return {
    label: 'SYNTHETIC DATA - not a real-world accuracy claim',
    runAt: new Date().toISOString(), runtimeMs: performance.now() - started,
    synthetic: true, fixtureVersion: 'S6a-N48-v1', seed: 'S6a-N48-v1', ruleVersion: rules.version || null,
    fixtureHash: crypto.createHash('sha256').update(JSON.stringify(pairs)).digest('hex'),
    scope: 'Synthetic generated exact duplicates, local typo variants and different-PID negatives; not pilot accuracy or semantic equivalence.',
    status: evaluated ? 'EVALUATED' : 'UNKNOWN', reason: evaluated ? null : rules.reason || 'POLICY_NOT_CONFIGURED',
    numerator: correct, denominator: pairs.length, evaluated, ...counts,
    falseMatches: counts.falsePositive, nonDuplicatePairs,
    falseMatchRatePercent: evaluated && nonDuplicatePairs ? counts.falsePositive / nonDuplicatePairs * 100 : null,
    accuracyPercent: evaluated ? correct / pairs.length * 100 : null,
    evaluatedAccuracyPercent: evaluated ? correct / evaluated * 100 : null,
    coveragePercent: pairs.length ? evaluated / pairs.length * 100 : null,
  };
}
export async function runBenchmark(user) {
  if ((process.env.APP_MODE || 'demo') !== 'demo') throw fail(503, 'SYNTHETIC_BENCHMARK_ONLY');
  let rules;
  try {
    const active = await getActiveRule('OVERLAP_DETECTION');
    rules = await getRules();
    if (active?.status !== 'approved' || active.version !== rules.version) rules = { configured: false, reason: 'POLICY_NOT_CONFIGURED' };
  } catch { rules = { configured: false, reason: 'RULEBOOK_UNAVAILABLE' }; }
  const summary = await evaluate(rules);
  // Hard cases (same college other issue, paraphrase, code-mixed, new detail) with precision and recall.
  summary.hardCases = rules.configured === false ? { status: 'UNKNOWN', reason: rules.reason } : await evaluateHard(rules);
  const row = await BenchmarkRun.create({ summary });
  await audit(user, 'benchmark.run', row.id, { total: summary.denominator, evaluated: summary.evaluated });
  return { id: row.id, ...summary };
}
