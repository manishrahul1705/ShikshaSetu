Follow RULES.md for this whole conversation.

First:
1. Read RULES.md, then the SPEC.md sections and ADDITIONS.md rows listed below, in full. Do not skim.
2. Run `node scripts/trace-check.js --stage S1` and paste its output.
3. Write a plan with one line per open ID from that output: what you will build, which file(s), which test(s). Every ID must appear in the plan. If an ID is BLOCKED-SOURCE, say exactly what you will build from its "Known" hint and what you will not build.
4. Stop and wait for my approval of the plan.

# Stage S1: Mandatory problem statement plus the front half

Read: SPEC.md sections 3 (all 12 ICID touchpoints), 5, 6, 7.1, 7.2, 7.3 (web portal row), 12.3, 13 (S02–S07, S10–S12, S14, S15, S21, S26), 15 (all collections and routes used here), 16 (U01–U13), Appendix V. ADDITIONS.md rows N52, N58, N64, N67. SPEC Appendix W rows N68, N69, N79 (Other Stakeholder complainants, eligibility validation, System Administrator workspace).

Your roadmap for S1 (SPEC 18): F01–F13, F29–F35, N01–N04, N06, N07, N09–N14, N31, evidence "R01–R55 demonstrable; U01–U13". Also in this stage (stage chosen where the roadmap is silent): N05, N08, N15 (web portal only), F45–F47, F50, F51, F53, F54 hints, S02–S07, S10–S12, S14, S15, S21, S26.

Key points not to miss:
- NEXUS TRUST verification (stage 1 panel name): student via ABC/APAAR simulator with current enrolment check (N01), faculty via staff-registry simulator with employment check and SSO simulator (N02), other authorized users (N03), OTP and MFA to a local sink (N04), anti-proxy and fraud signals that route to manual verification and never auto-reject (N05), pseudonymous reporter IDs like RP-7K2Q with a separate identity_vault and an audited, purpose-bound, approved, expiring reveal (N06), consent ledger with withdrawal shown to the user (N07), officer-assisted alternative verification, logged and rate-limited (N08).
- Registry lookup by PID with the auto-fetch panel fields from SPEC 6.1, UNKNOWN with reason if the registry is down (N10). ICID: all 4 hard rules and all 12 touchpoints in SPEC 3 (N09). Six regions from a versioned reference table, reclassification with a reason, regional officers see only their region (N11). Institution 360 with attention indicators, never a score; other bureaus' entries as opaque metadata; "restricted entries" disclosed (N12).
- Grievance portal: category and sub-category, guided fields with examples, uploads with type/size checks, malware scan stub and hash (S12), auto-linked institution from PID, preview and edit-before-confirm (N13). Master Case ID like NX-2026-000123 kept for life, externalRefs[], (sourceSystem, sourceCaseRef) unique, duplicate-registration check (N14).
- Encrypted private document storage, authorization on every download, server-proxied downloads (N31, S10, S11).
- N52 hidden-data scrubber on every upload (original sealed with its hash). N58 quick-exit button on sensitive-category complainant pages. N64 Hindi and English for every complainant page (i18n files; no voice input). N67 the complaint text itself can be written in any Indian language and script: store the original unchanged, record the language (detected locally on the server), show officers a language tag; no outside cloud translation.
- R01–R55: their text is BLOCKED-SOURCE. Build nothing invented for them. List them in your report as blocked.

Tests to write now: `[U01]`–`[U13]`, one `[<ID>]` test per N and S row in this stage, `[A-N52]`, `[A-N58]`, `[A-N64]`, `[A-N67]`, and a `[Fxx]` test only where you built from a "Known" hint.

When the plan is approved, build it. Then, before you report:
- Run `npm test` (it writes test-results/results.json). All tests must pass, including every earlier stage's tests.
- Update FEATURES.md for every ID in this stage: Status, Built in, Proved by, Notes. DONE only if the rules allow it.
- Run `node scripts/trace-check.js --stage S1` and paste the full output. It must say "No violations".
- Report in this shape:
  - DONE: IDs
  - GAP: IDs with reasons
  - BLOCKED-SOURCE: IDs and what was built from the hint
  - Anything in SPEC.md for this stage that you could not fit to an ID (should be none)
  - How I can see it working: URLs, demo accounts, steps
  - Suggested commit message: "stage S1: ..."
