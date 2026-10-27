Follow RULES.md for this whole conversation.

First:
1. Read RULES.md, then the SPEC.md sections and ADDITIONS.md rows listed below, in full. Do not skim.
2. Run `node scripts/trace-check.js --stage S4` and paste its output.
3. Write a plan with one line per open ID from that output: what you will build, which file(s), which test(s). Every ID must appear in the plan. If an ID is BLOCKED-SOURCE, say exactly what you will build from its "Known" hint and what you will not build.
4. Stop and wait for my approval of the plan.

# Stage S4: NEXUS PREVENT

Read: SPEC.md sections 7.4, 8.3, 8.5, 13 (S23), 15 (intake_similarity_checks), 16 (U14), 17 (duplicate check row), Appendix V stage 3 and layer 6. ADDITIONS.md row N59.

Your roadmap for S4 (SPEC 18): F23–F24, E01, N16, N17, evidence "U14, X01–X04". Also here: S23.

Key points not to miss:
- PREVENT Stage 1 (N16), labelled "AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)": all 5 steps in SPEC 7.4 plus the privacy guard. Hints refer only to the complainant's own cases or a generic "a similar open matter exists". Advisory, logged with the user's choice, never blocks or merges.
- Overlap detection (SPEC 8.3): seven signals with the exact weights (issue 25, time window 15, category 10, document or subject 15, remedy 10, shared entities 10, semantic 15); ICID as supporting identity evidence; the exact banner text "Potential Overlapping Cases – Coordination Required" on /dashboard, /institutions/:id and /review. Thresholds, the identity gate and the 93.75 worked example are in the 23 Oct PDF: if they are not in the repo, mark them BLOCKED-SOURCE and make the thresholds configurable, not guessed.
- PREVENT Stage 2 (N17, E01): overlapping actions, repeated document requests, conflicting instructions; related ongoing cases; coordination suggestion; real-time officer alerts; output CLEAR, REVIEW or UNKNOWN with reasons and counter-reasons; missing or stale feeds give UNKNOWN; never blocks an official act. Rules C1–C5 are BLOCKED-SOURCE until supplied.
- N59 silent co-signing: verified students of the same institution can back an issue anonymously; officers see only the count. It must NOT change N19 priority or the PREVENT result.

Tests: `[U14]`, `[X01]`–`[X04]` only if their text is in the repo, one `[<ID>]` per N and S row, `[A-N59]`.

When the plan is approved, build it. Then, before you report:
- Run `npm test` (it writes test-results/results.json). All tests must pass, including every earlier stage's tests.
- Update FEATURES.md for every ID in this stage: Status, Built in, Proved by, Notes. DONE only if the rules allow it.
- Run `node scripts/trace-check.js --stage S4` and paste the full output. It must say "No violations".
- Report in this shape:
  - DONE: IDs
  - GAP: IDs with reasons
  - BLOCKED-SOURCE: IDs and what was built from the hint
  - Anything in SPEC.md for this stage that you could not fit to an ID (should be none)
  - How I can see it working: URLs, demo accounts, steps
  - Suggested commit message: "stage S4: ..."

PARALLEL NOTES (see PARALLEL_PLAN.md)
- Branch `phase/S4-prevent`. S2 (RuleBook, routing) is built at the same time by another tool.
- Read thresholds only via `rulebook.getActiveRule('OVERLAP_DETECTION')`. Until S2 is merged, use `server/src/modules/prevent/defaults.js` (labelled DEMO) and remove it after merging main.
- You own the `case_actions` model (actions on a case: actor, bureau, actionType such as DOCUMENT_REQUEST or INSTRUCTION, institutionId, caseId, at), plus intake_similarity_checks and co-signs (N59). S3 will write into case_actions later.
