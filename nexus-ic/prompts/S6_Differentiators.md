Follow RULES.md for this whole conversation.

First:
1. Read RULES.md, then the SPEC.md sections and ADDITIONS.md rows listed below, in full. Do not skim.
2. Run `node scripts/trace-check.js --stage S6` and paste its output.
3. Write a plan with one line per open ID from that output: what you will build, which file(s), which test(s). Every ID must appear in the plan. If an ID is BLOCKED-SOURCE, say exactly what you will build from its "Known" hint and what you will not build.
4. Stop and wait for my approval of the plan.

# Stage S6: Differentiators

Read: SPEC.md sections 7.3 (all channels), 10.4, 12.1, 14, 18 (S6 row). ADDITIONS.md rows N46, N47, N50, N57, N61.

Your roadmap for S6 (SPEC 18): F05–F06, F28, F36–F38, E03–E10, evidence "Graph, radar, impact". Also here: N15 non-web channels (PWA, email intake where sender must verify first, CSV import with preview, dry-run and idempotent commit), N32 and N33 as PLANNED-P2 (adapter interface and PWA only, no native apps, no real integrations).

Key points not to miss:
- F and E items here are BLOCKED-SOURCE. Build only what SPEC states (for example E07 attention indicators, E09 IMPACT safeguards). "Graph, radar, impact" is the evidence named in the roadmap. Use React Flow and Recharts, and do not invent what they show beyond SPEC.
- N46 Judge Demo Mode: one click runs `reset` and a captioned guided tour of the two-bureau overlap scenario (hidden in production mode). The scenario must run without manual database edits (SPEC 18 definition of done).
- N47 every dashboard number opens the exact cases behind it, using the same query builder and ABAC.
- N50 overlap timeline: two bureaus' actions side by side with conflict points marked.
- N57 daily integrity fingerprint page /integrity.
- N61 cross-institution pattern alert into IMPACT, citing rows, with denominator, labelled synthetic.
- Accuracy benchmark using the N48 generator: report matching accuracy with numerator and denominator. (If N37 from the earlier chat is the benchmark, it stays BLOCKED-SOURCE until its text is supplied. Build the benchmark under N48.)

Tests: one `[<ID>]` per N row, `[U15]` (email intake), `[A-N46]`, `[A-N47]`, `[A-N50]`, `[A-N57]`, `[A-N61]`.

When the plan is approved, build it. Then, before you report:
- Run `npm test` (it writes test-results/results.json). All tests must pass, including every earlier stage's tests.
- Update FEATURES.md for every ID in this stage: Status, Built in, Proved by, Notes. DONE only if the rules allow it.
- Run `node scripts/trace-check.js --stage S6` and paste the full output. It must say "No violations".
- Report in this shape:
  - DONE: IDs
  - GAP: IDs with reasons
  - BLOCKED-SOURCE: IDs and what was built from the hint
  - Anything in SPEC.md for this stage that you could not fit to an ID (should be none)
  - How I can see it working: URLs, demo accounts, steps
  - Suggested commit message: "stage S6: ..."
