Follow RULES.md for this whole conversation.

First:
1. Read RULES.md, then the SPEC.md sections and ADDITIONS.md rows listed below, in full. Do not skim.
2. Run `node scripts/trace-check.js --stage S7` and paste its output.
3. Write a plan with one line per open ID from that output: what you will build, which file(s), which test(s). Every ID must appear in the plan. If an ID is BLOCKED-SOURCE, say exactly what you will build from its "Known" hint and what you will not build.
4. Stop and wait for my approval of the plan.

# Stage S7: Release evidence

Read: SPEC.md sections 13 (S08, S13, S30), 16, 18 (definition of done), all of FEATURES.md.

Your roadmap for S7 (SPEC 18): T, X, D and U suites, screenshots, limitations, evidence "No critical privacy or identity failure". Also here: N34, S08, S13, S30.

Do:
1. Run `npm test` and `node scripts/trace-check.js` (no --stage). Paste both outputs in full.
2. Negative-role sweep: for every role, try to read, search, export and download data it must not see (reporter identity, internal notes, other bureaus' narratives, other complainants' cases). Write each as a test. Any leak is a critical failure: fix it before anything else.
3. Check the definition of done in SPEC 18 item by item. For each, answer YES with evidence (test name or screenshot) or NO with the gap.
4. Write `docs/LIMITATIONS.md`: everything GAP, BLOCKED-SOURCE or PLANNED-P2, everything simulated, and the "Not claimed" list from SPEC 18 word for word.
5. Write `docs/SECURITY_REVIEW.md`: S08 deployment notes, S13 audit schedule (note that the doc's "S34" reference is kept as written), S30 threat model and penetration-test checklist, N34 recurring audit programme.
6. Use Playwright to take screenshots of every route in SPEC 12.1 and of the judge flow into `docs/screenshots/`.
7. Run the judge flow test (`[JUDGE]`) three times in a row from a fresh `npm run reset`. It must pass all three.

Report: final counts per status, any critical failures, and the list of everything not DONE with reasons.

When the plan is approved, build it. Then, before you report:
- Run `npm test` (it writes test-results/results.json). All tests must pass, including every earlier stage's tests.
- Update FEATURES.md for every ID in this stage: Status, Built in, Proved by, Notes. DONE only if the rules allow it.
- Run `node scripts/trace-check.js --stage S7` and paste the full output. It must say "No violations".
- Report in this shape:
  - DONE: IDs
  - GAP: IDs with reasons
  - BLOCKED-SOURCE: IDs and what was built from the hint
  - Anything in SPEC.md for this stage that you could not fit to an ID (should be none)
  - How I can see it working: URLs, demo accounts, steps
  - Suggested commit message: "stage S7: ..."
