You are running as Codex, locally on my laptop. Follow AGENTS.md, write your plan to plans/S4.md first, then continue without waiting.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in AGENTS.md, PARALLEL_PLAN.md and this prompt. Do not run any git command.

ROLE
You are the lead engineer and quality owner for NEXUS PREVENT in AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264. PREVENT catches duplicate complaints at intake (Stage 1) and conflicting or repeated official actions before they happen (Stage 2). It advises; it never blocks, merges, rejects or decides. You think before you code, you never guess, and you prove every claim with a passing test. Your standard: a senior reviewer must find nothing missing, nothing renamed, nothing invented, and no hint that leaks another person's complaint.

WORKSPACE (check this first)
- You work directly in this folder (nexus-ic). Do not create branches, copies or worktrees.
- S0, S1a and S1b are in this folder. Check that these exist: server/src/modules/cases/Case.js, server/src/middleware/rbac.js (canAccessCase), server/src/modules/institutions/institutionService.js (resolveIdentity), server/src/modules/identity/index.js. If any is missing, STOP and tell me.
- Antigravity is working in this SAME folder at the same time: first fixing S1b gaps, then building S2 (RuleBook, routing, priority, lifecycle) in server/src/modules/rulebook/, routing/, lifecycle/. Never edit S1b's or S2's files or tests. If one of their tests fails, report it; do not touch it.
- In shared files, only append your own lines and never change or remove anyone else's lines. Re-read a shared file from disk right before you edit it.
- Run tests only as (PowerShell): $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test . If you cannot reach MongoDB from your sandbox, keep building and ask me to run it and paste the result. Do not change server/tests/setup.js.

CONTEXT (read fully before anything else; do not skim)
1. AGENTS.md (binding; wins over this prompt) and PARALLEL_PLAN.md (ownership, contracts).
2. docs/SPEC.md sections 3 (touchpoint 6), 6.2, 7.4, 8.3, 8.5, 13 (row S23), 15.1 (intake_similarity_checks), 15.2 (POST /api/v1/grievances/check-similar), 16 (U14), 17 (duplicate check row), Appendix V (stage 3 and layer 6), Part B (B6 rules C1-C5, B7 thresholds: still empty). If SPEC.md and docs/NEXUS-IC_Unified_24Oct.pdf differ, the PDF wins.
3. docs/ADDITIONS.md row N59 and the ground rules at the top.
4. FEATURES.md rows of your IDs below.
5. Existing code you build on: S1b's Case model, caseService.js (draft and submit), rbac.js canAccessCase, institutionService.resolveIdentity, client pages Dashboard.jsx, institutions/Institution360.jsx, intake/GrievanceSubmit.jsx; S1a's identity/index.js (isVerified, getReporterId, toOfficerView) and its README.md.

NON-NEGOTIABLE RULES (summary of AGENTS.md; AGENTS.md wins)
- Nothing missed, nothing changed, nothing merged. Keep exact texts: the Stage 1 panel title "AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)", the banner "Potential Overlapping Cases – Coordination Required" (with the en dash), the outputs CLEAR, REVIEW and UNKNOWN, and the seven signal weights: issue 25, time window 15, category 10, document or subject 15, remedy 10, shared entities 10, semantic 15 (total 100).
- Never invent missing source. These are BLOCKED-SOURCE and stay so: the overlap thresholds, the identity gate details and the worked 93.75 example (SPEC Part B7), rules C1 to C5 (Part B6), X01 to X04 (Part B5), and the full text of F23, F24, E01. Do not write tests that claim to reproduce 93.75 or C1-C5.
- Thresholds are read only through the RuleBook: getActiveRule('OVERLAP_DETECTION') from server/src/modules/rulebook/index.js (owned by S2, may not exist yet). Write server/src/modules/prevent/rules.js that tries a dynamic import of that module and, if it is missing or has no approved rule, falls back to server/src/modules/prevent/defaults.js: synthetic values named DEMO-OVERLAP-v1 and DEMO-PREVENT-v1, each with the comment "not from source; replace with 23 Oct PDF values". In APP_MODE=production a DEMO rule is never used: the result is UNKNOWN with reason POLICY_NOT_CONFIGURED.
- PREVENT never blocks a submission, never blocks an official act, never merges or links cases, never changes status, owner, routing or priority. Every result is advisory, carries its reasons and counter-reasons, and is logged.
- Privacy guard (S23): a complainant only ever sees their own earlier cases, or the generic notice "a similar open matter exists". Never another person's text, identity, reporter ID or Master Case ID. intake_similarity_checks stores no third-party text (draftHash, reporterId, shownHints as IDs of the complainant's own cases or the word GENERIC, userChoice).
- No outside service: all matching, including the semantic signal, runs locally on the server. Complaint text never leaves the system, never goes to a log (use the S0 safe logger only), and the semantic signal must work for any Indian script (N67). Name the local method honestly in Notes (for example "local character n-gram similarity").
- DONE means proven: real file paths in "Built in" plus a passing test titled "[<ID>] ..." (additions "[A-Nxx] ..."). Never skip or weaken a test. Every state change calls audit.record(); every route uses authorize(...); every case read goes through canAccessCase.
- Fixed stack: React JSX + Vite + Tailwind + React Router + TanStack Query; Express in plain JavaScript; MongoDB + Mongoose; Vitest + Supertest + React Testing Library. NO TypeScript, NO Digital Twin, no new dependency without listing it in the plan with its reason (prefer none).

SCOPE: exactly these 12 IDs
- N16 PREVENT Stage 1, intake similarity check (SPEC 7.4). POST /api/v1/grievances/check-similar takes the current draft (institution PID, category, sub-category, text, period). Before submission it compares the draft with open and past cases for the same verified institution and does all 5 steps: (1) detect similar or duplicate complaints (same institution, same issue concept, overlapping period); (2) check same institution plus same issue; (3) alert the user before submitting; (4) allow a new case if the complaint is genuinely different (the user can always continue); (5) explain why it looks similar (which signals matched, never whose case). Show it in a panel titled exactly "AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)". Log every check and the user's choice (continue, view my earlier case, cancel) in intake_similarity_checks.
- Overlap detection (SPEC 8.3), used by N16 and N17: the seven-signal weighted matcher with the exact weights above. Each signal returns 0..1 with a reason; the score is the weighted sum. Identity: PID must match exactly; similar names with different PIDs never match (SPEC 6.2); use resolveIdentity(pid, icid): MATCH is supporting evidence, IDENTITY_REVIEW forces the result to REVIEW with that reason, NOT_AVAILABLE is neutral (SPEC 3 touchpoint 6). Thresholds come from rules.js. Officers see the banner "Potential Overlapping Cases – Coordination Required" on /dashboard, /institutions/:id and /review whenever a case they may access (canAccessCase) has overlaps at or above the threshold; the banner lists only cases that officer may open, and says "N restricted entries" for the rest.
- N17 PREVENT Stage 2, action conflict detection (SPEC 8.5), which is also E01. POST /api/v1/prevent/check-action takes { caseId, actionType, details } before an officer acts. It detects overlapping actions across bureaus on the same institution or issue, repeated document requests, and conflicting instructions; shows related ongoing cases the officer may access; suggests coordination before proceeding; raises an officer alert. Output CLEAR, REVIEW or UNKNOWN with reasons and counter-reasons. Missing or stale action feeds (no case_actions data, or older than the DEMO freshness window) give UNKNOWN, never CLEAR. It never blocks: the officer can always proceed, and the choice is audited. Implement only the three detections the SPEC names, as DEMO-PREVENT-v1 rules; do not call them C1-C5. Alerts: a prevent_alerts collection and an officer alert list in the UI with polling (no sockets yet; say so in Notes).
- N59 Silent co-signing (ADDITIONS.md): a verified student of the same institution can back an existing issue anonymously (POST /api/v1/cases/:id/co-sign, once per reporter per case). Officers see only a count such as "14 verified co-signers", never names or reporter IDs. It must NOT change N19 priority, routing or any PREVENT result: prove it with a test. To know a student's verified institution, add a function getVerifiedInstitutionPid(userId) to your own S1a module server/src/modules/identity/index.js (returns the PID only, never identity), with a test.
- S23 Intake similarity hints leak no third-party data.
- U14 Similarity alert explains why, lets the user proceed, shows no third-party data.
- F23, F24 (hint: PREVENT action conflicts, SPEC 2, 8.5) and E01 (hint: pre-action checker = PREVENT Stage 2): BLOCKED-SOURCE. They are covered by what N17 builds; write that in Notes and leave them BLOCKED-SOURCE.
- X01, X02, X03, X04: BLOCKED-SOURCE (text in the 23 Oct PDF). Build and test nothing for them; list them in the report.

OWNERSHIP (from PARALLEL_PLAN.md)
- You own: server/src/modules/prevent/ (matcher, signals, rules.js, defaults.js, stage1, stage2, cosign, alerts, routes), the models case_actions, intake_similarity_checks, co_signs, prevent_alerts, client pages under client/src/pages/prevent/ (PreventPanel, OverlapBanner, ReviewPage for /review, ActionCheck, AlertList), client/src/routes/s4.jsx, client/src/i18n/s4.en.json and s4.hi.json, tests server/tests/s4-*.test.js and client/tests/s4-*.
- case_actions schema: { caseId, institutionPid, bureau, actorId, actorRole, actionType (DOCUMENT_REQUEST, INSTRUCTION, INSPECTION, NOTICE, OTHER), subjectKey, at }. S3 will write into it later; document it in server/src/modules/prevent/README.md together with every exported function.
- Read S1b's Case model and services; never edit them. Extra fields on a case go through a schema plugin in your module, registered in server/src/models/plugins.js (append one import line and one registry.push line).
- Server routes: append ONE line at the bottom of server/src/routes.js in the same style as the existing lines.
- Existing pages you must touch, with the smallest possible edit (one import line plus one JSX line each, re-read the file first, change nothing else): client/src/pages/Dashboard.jsx and client/src/pages/institutions/Institution360.jsx get <OverlapBanner />; client/src/pages/intake/GrievanceSubmit.jsx gets <PreventPanel draft={...} /> in its preview step, before confirm. If the page structure makes a one-line insertion impossible, stop and tell me instead of restructuring it.
- FEATURES.md: edit only your 12 rows. Never reorder or reformat the table.

UI (all pages show the S0 SYNTHETIC DATA banner automatically; strings in Hindi and English through the i18n loader)
- Grievance preview step: the Stage 1 panel with matched signals and reasons, the complainant's own similar cases (if any) or the generic notice, and buttons Continue with a new case / View my earlier case / Cancel.
- /review (supervisor, competent_authority, regional_officer, bureau_officer): overlapping case pairs the officer may access, each with its score, the seven signal contributions and their reasons, and the identity result.
- /dashboard and /institutions/:id: the banner when overlaps exist.
- Case action check: an officer form "Check before acting" that shows CLEAR / REVIEW / UNKNOWN with reasons and counter-reasons, related cases and a Proceed button that always works.
- Alerts: the officer's PREVENT alert list.
- Co-sign: a "Back this issue anonymously" button for eligible verified students, and the co-signer count for officers.

TESTS TO WRITE (titles must start with the tag)
[N16] [N17] [A-N59] [S23] [U14], with the matcher tests under [N16]. Include at least these:
- [N16] the seven weights are exactly 25, 15, 10, 15, 10, 10, 15 and sum to 100; each signal reports its reason.
- [N16] same institution plus same issue produces a hint; a genuinely different complaint at the same institution does not; the user can submit in both cases; the check and the choice are logged.
- [N16] two institutions with similar names and different PIDs never match; an ICID conflict forces REVIEW with the identity reason.
- [N16] the semantic signal works for Hindi (Devanagari) and Tamil text and makes no network call (fail the test if http or fetch is called).
- [S23] and [U14]: complainant B drafting a complaint similar to complainant A's case sees only "a similar open matter exists": the response JSON contains none of A's text, reporterId, Master Case ID or userId (scan it); complainant A sees their own earlier case.
- [N17] repeated document request, overlapping action by another bureau, and conflicting instruction each give REVIEW with reasons and counter-reasons; no action data gives UNKNOWN; a clean case gives CLEAR; in every case the officer can still proceed and the choice is audited.
- [N17] APP_MODE=production with no approved RuleBook rule gives UNKNOWN with POLICY_NOT_CONFIGURED.
- [N17] the overlap banner text is exactly "Potential Overlapping Cases – Coordination Required" on /dashboard, /institutions/:id and /review (client test), and lists only cases the officer may access.
- [A-N59] co-signing twice is refused; officers see only the count; priority, routing fields and PREVENT results are byte-identical before and after 14 co-signs.
- [S28 regression] similarity checks and action checks never write complaint text to the logger.
- getVerifiedInstitutionPid returns a PID and never an identity field.

HOW TO WORK
Step 1. Read every file in CONTEXT. Run node scripts/trace-check.js --stage S4 and copy its output into plans/S4.md.
Step 2. Write plans/S4.md: (a) one line per ID: what, which files, which test; (b) the folder tree you will add; (c) the exact one-line insertions you will make in Dashboard.jsx, Institution360.jsx and GrievanceSubmit.jsx; (d) every DEMO value you will put in defaults.js; (e) any dependency and why; (f) open questions (at least: the DEMO thresholds, the freshness window, which roles see /review). Then continue without waiting; I review the plan file myself.
Step 3. Build in small steps: rules.js and defaults.js, the signals and matcher, Stage 1 API and logging, the Stage 1 panel, case_actions and Stage 2, alerts, overlap banner and /review, co-signing, then the page insertions. Run the relevant tests after each step.
Step 4. Verify:
   - npm test as above: every test passes (S0, S1a, S1b, S2 if present, S4), none skipped, test-results/results.json written. If another phase's test fails, report it and do not edit it.
   - npm run reset, then npm run dev: as trust_student_verified draft a complaint similar to a seeded case and see the Stage 1 panel; as rb_officer1 run "Check before acting" twice with the same document request and see REVIEW; as supervisor1 open /review and /dashboard and see the banner.
   - Update FEATURES.md for your 12 rows only (Status, Built in, Proved by, Notes). Never edit the ID, Title, Source, Pri or Stage columns.
   - Re-read the shared files (server/src/routes.js, server/src/models/plugins.js, the three pages you touched, package.json, FEATURES.md) from disk: your lines are there and nobody else's were changed. Run npm test once more.
   - node scripts/trace-check.js --stage S4 must print "No violations". Paste the full output.
Step 5. Self-review: re-read AGENTS.md, PARALLEL_PLAN.md and every scope line above, and list anything you did not do.

FINAL REPORT (print it here AND save it to plans/S4_REPORT.md, exactly this shape)
- DONE: IDs
- IN-PROGRESS or GAP: IDs with reasons
- BLOCKED-SOURCE: F23, F24, E01, X01-X04, thresholds, identity-gate details, 93.75 example, C1-C5, with what was built near each
- DEMO values used (from defaults.js) and where S2's RuleBook will replace them
- Contract for other phases: every exported function in prevent/README.md, and the case_actions schema for S3
- Test summary: passed / failed / skipped counts
- trace-check output (full)
- How I can see it: URLs, demo accounts, steps
- Decisions and open questions I should know about
- Every file you created or changed (one list)

DONE WHEN
A complainant gets an honest, privacy-safe similarity hint before submitting and can always continue; an officer gets CLEAR, REVIEW or UNKNOWN with reasons before acting and can always proceed; the overlap banner shows the exact text on all three pages; co-signing never changes priority or PREVENT; nothing from the 23 Oct PDF was invented; every test passes; trace-check --stage S4 prints "No violations"; nothing outside your scope was touched; no git command was run; and plans/S4_REPORT.md is saved.
