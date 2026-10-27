# How the "intelligent" parts actually work

Written by Claude on 25 Oct 2026 after the mock jury audit. This is the honest answer to "where is the AI?". Every method below is explainable, runs locally, uses no learned language model, and leaves the decision to a human.

## PREVENT matcher (duplicate and overlap detection)

- Seven weighted signals as SPEC 8.3 names them: issue 25, time window 15, category 10, document or subject 15, remedy 10, shared entities 10, semantic 15.
- **The signal SPEC calls "semantic" is lexical**, not a meaning model: character-trigram similarity over the normalized text (works across scripts, tolerates typos and transliteration).
- **Strengthened on 25 Oct:** it now takes the higher of trigram Jaccard and trigram containment (shared trigrams over the smaller text), so the same complaint re-sent with an extra sentence or a Hindi/Tamil phrase is no longer treated as a new issue. Weights, thresholds and the identity gate are unchanged.

### Benchmark (synthetic, `server/src/modules/benchmark/`)

| Set | Before 25 Oct | After |
|---|---|---|
| Easy set (3,000 pairs: exact copy, one-letter typo, other institution) | 100% correct | 100% correct |
| Hard set, precision (5,000 pairs) | 99.4% | 99.1% |
| Hard set, recall | 73.5% | **93.3%** |
| Same complaint plus a new sentence | 61.0% | **100%** |
| Same complaint plus a code-mixed phrase | 93.3% | **100%** |
| Paraphrase (synonyms and reordered sentences) | 63.4% | 75.1% |
| Same college, different issue (expected CLEAR) | 100% | 100% |
| Same college and category, different complaint (expected CLEAR) | 97.9% | 96.0% |

Labels come from how each pair was built, never from the matcher. Results are synthetic, not pilot accuracy. The weakest stratum is paraphrase: a word-level match cannot know that "fees" and "charges" mean the same. A local multilingual sentence-embedding model would be the next step, and it can be added as an extra signal without changing the RuleBook thresholds.

## NEXUS ROUTE confidence

A rule-based confidence, not a model probability: it starts from the RuleBook mapping for the category (or a lower value when the category is unmapped), drops when the region is missing or the registry feed is UNKNOWN, and anything below the RuleBook threshold goes to a human. Since 25 Oct, a missing rule or threshold gives POLICY_NOT_CONFIGURED and manual review rather than a built-in number.

## Sensitivity detection

Versioned keyword rules in English, Hindi and Tamil (RuleBook family SENSITIVITY) suggest a flag; a human confirms or dismisses every one. It is a safety net, not a classifier.

## Retaliation Watch, RESCUE and pattern alerts

Deterministic rules over recorded events (re-check status, stalled time, transfers, rising counts), each with its reason and rule version. None scores people or institutions.

## How to say it to a jury

"Explainable rules and text similarity, measured on a benchmark with hard cases: 99% precision and 93% recall on synthetic data, with humans confirming every suggestion. A local embedding model is the next step for paraphrases."
