You are running as Codex, locally on my laptop, in the nexus-ic folder. Follow AGENTS.md and my earlier override of rule 5 for on-screen labels (see prompts/FINAL_POLISH_CODEX_MASTER_PROMPT.md). This is the PROBLEM-STATEMENT FEATURES phase for AWAAZ DASTAK (powered by NEXUS-IC), AICTE Problem Statement 26264. Write your plan to plans/PS_FEATURES.md first, then continue without waiting, except where this prompt says ASK MANISH.
LOCAL RUN, NO GIT: do not run any git command.

THE ONE IDEA THIS PHASE MUST PROVE
AICTE's bureaus and cells (PGRC, RB, Approval, Academic, Regional Offices) work on the same college without seeing each other. So the college gets duplicate or conflicting requests, documents are asked for again and again, ownership gets lost, and the student never sees a truthful status. Every feature below must make a sceptical juror watch that problem being fixed on screen within 10 seconds. If a feature does not do that, keep it small.

ROLE
You are a principal product engineer and a jury-minded designer. Think before coding, never guess, and prove every change with a passing test and a screenshot. Reuse what exists (PREVENT Stage 2 / E01 engine, SYNC, TRACE, N70 query loop, N71 institution actions, IMPACT query builder, RuleBook, audit.record(), authorize(), toOfficerView(), the design system in client/tailwind.config.js and client/src/index.css, StatCard, CommandCharts, Icon, InstitutionPicker). Do not rewrite them and do not change how they decide, score, route or close anything.

READ FIRST (do not skip)
1. STATUS.md (latest sections), plans/GLOBAL_JURY.md, plans/FINAL_POLISH.md, plans/JURY_PAGE_AUDIT_26OCT.md.
2. AGENTS.md, FEATURES.md, docs/SPEC.md sections 7.4, 8.5, 9, 10, 11, 12 and Appendix W (workflow.png and roles.png steps, N68–N80), docs/ADDITIONS.md.
3. docs/SOURCE_23OCT_FERTXD.md for anything on SLA, conflict rules C1–C5, query/response and institution actions.
4. The code for PREVENT Stage 2 (E01/N17), SYNC (N21/N75), N70, N71, TRACE (N20/N60), leave, IMPACT/N77, track pages, Judge Mode tour.
Re-read every file from disk right before you edit it, because Claude may also be working in this folder.
If the GLOBAL_JURY phase is not finished (check STATUS.md), do not redo its work. Build on whatever is there and write in your plan which parts of this phase wait for it (mainly the SLA policy DEMO-CASE-STANDARD-v1).

SAFETY
- Run the full suite only when no other test run is active:
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- --maxWorkers=2 --minWorkers=1; npm run test:client; node scripts/merge-results.js; node scripts/trace-check.js
- ASK MANISH before any npm install or download, and before any reset or drop of awaaz_dastak_demo. The showcase database is rebuilt only by `npm run showcase:seed`, which refuses any name not ending in _showcase.
- Never attach invented grievances to real, named colleges. Never invent SLA days, legal timelines or AICTE regulation text beyond what the source defines; a missing rule shows "Not available: policy not configured" (rule 5 wording from the GLOBAL_JURY phase).
- Everything is advisory: a human decides. No institution score, rank or "compliance %" anywhere. Every number shows numerator, denominator and scope and comes from an actual local run. Every new action writes an audit event. Reporter identity never reaches institution admins or other bureaus (S06, D16). No outside network calls.

IDS AND TRACEABILITY
Register the nine features as N81–N89 (N36–N45 stay reserved; do not use them). Add them to docs/ADDITIONS.md under a new heading "Problem-statement features (approved by Manish, 26 Oct 2026)", with the same columns as the existing table, and add a row for each to FEATURES.md. Each gets its own module named after its ID (for example server/src/modules/additions/n82-combined-request/) and its own tests titled [A-N81] … [A-N89]. Update scripts/trace-check.js so the expected total grows by exactly 9 and it still reports zero violations. Mark a row DONE only when its tests pass.

WORK LIST (in this order; each item lists what "done" means)

N81 Live conflict warning inside the officer's action form  (PS: duplicate and conflicting actions across bureaus; SPEC 8.5, workflow step 6)
- Every officer action that touches an institution (send query or information request, seek compliance report, schedule inspection or expert visit, issue notice, request documents, recommend regulatory action) calls the existing PREVENT Stage 2 check before submit, with the action type, institution PID, case and bureau.
- If the result is REVIEW, show an inline panel above the submit button, not a modal: "Potential overlapping action", then one line per related action in plain words ("Regulation Bureau scheduled an inspection at this college on 22 Oct, case NX-2026-001002"), the signals behind it, and counter-signals in grey. Buttons: "Coordinate via NEXUS SYNC" (opens SYNC on that institution with both cases preselected) and "Proceed anyway" (requires a reason, audited). CLEAR shows a small green "No overlapping action found" line. UNKNOWN shows "Not available: <reason>". It never blocks.
- Reasons come only from stored data and rules C1–C5; nothing invented.
- Seed at least 3 showcase scenarios that trigger it (inspection vs inspection, repeated document request, conflicting instructions on fee refund).
- Tests: REVIEW, CLEAR and UNKNOWN paths; "Proceed anyway" without a reason is rejected; an officer never sees a related case's narrative or reporter identity outside their scope.

N82 One combined request to the institution  (PS: repeated requests to one college, coordination across bureaus; N21, N70, N71, N75)
- When two or more bureaus have open queries or document requests to the same PID, SYNC shows "Combine into one request to the institution" with the item list.
- Each owning bureau confirms or withdraws its own items (no bureau can confirm another's). Once all have answered, one combined request is issued: one reference number, one cover note, and per item the owner office and role, the case ID, what is asked, and the reply-by date from the RuleBook (or "policy not configured").
- The institution nodal officer sees it as a single request and replies per item; each reply routes back only to the owning bureau's case and the N70 log. Items stay independent, so one late item never closes or delays another, and task completion is never case disposal.
- Show a counter on Institution 360 and the command centre: "Requests combined: X of Y eligible" (numerator, denominator, scope). Never call it "saved".
- Tests: confirmation separation, per-item routing of replies, institution admin sees no reporter identity or internal notes, audit events for propose/confirm/withdraw/issue/reply.

N83 "Submit once" institution document locker  (PS: repeated document demands; SPEC 9.3 scoped, time-bound grants)
- The institution nodal officer uploads standard documents once into a locker for their PID, typed by a configurable document-type list (approval letter, fee notification, faculty list, affiliation letter, others). Reuse the existing encrypted storage, malware scan, hash and N52 scrubber.
- When an officer starts a document request whose type already exists in the locker, show "Already submitted on <date> (version n). Request access instead?" Access is a grant scoped to one case and one officer, with an expiry, audited, and revocable by the institution.
- PREVENT Stage 2 treats "document already in locker" as a counter-signal for a repeated request. Do not change its weights.
- Tests: grant scope and expiry, revoke, a second bureau cannot read without its own grant, versioning keeps the old file and hash.

N84 "Today vs with AWAAZ DASTAK" replay  (PS as a whole, shown in one screen)
- A new Guided Walkthrough step and a /walkthrough/compare page (hidden in production mode like Judge Mode). Two columns play the same seeded two-bureau case with step-by-step captions:
  - Left, "Without coordination": three separate letters to the college, a transfer nobody acknowledged, the student seeing "Submitted" for weeks, a repeated document request.
  - Right, "With AWAAZ DASTAK": N81 warning, N82 combined request, N83 locker reuse, TRACE acknowledgement, truthful status on /track.
- The left column is a scripted scenario and is labelled "Illustrative scenario"; the right column is driven by real records from the showcase seed. The summary counts at the bottom (letters to the college, acknowledged transfers, repeated document requests flagged) come from the actual run on the right and from the scripted scenario on the left, each labelled with its source. Never claim measured savings.
- Make it beautiful: large type, the design-system colours, animated step reveal (CSS only, no new package), works at 1366×768 on a projector.

N85 Problem-statement coverage page  (Fit to PS; jury audit item 6)
- /coverage, visible to officers and in the walkthrough. A table built from a data file (docs/ps-coverage.json): each problem-statement need, each workflow.png step (1–13) and each roles.png role action, with the feature ID, a "Open screen" link to the live page, the test IDs that prove it and their latest result read from the merged test results file. Anything not built shows "Planned" with a reason, never a fake tick.
- Test: every link resolves to a route the viewer may open; every test ID listed exists in the merged results.

N86 "What happens next" on the student's tracking page  (PS: truthful, transparent status; SPEC 9.1, N28, N70)
- On /track and /track/:caseId add, for each case: current status in plain words, accountable owner as office and role (never a name), the next step, the policy clock ("12 of 14 days left" or "policy not configured"), the status history as a vertical timeline, and an inbox of AICTE queries with reply-by dates and a "Reply" button that uses N70.
- Merge /my/cases into /track (keep the old route as a redirect) so the student has one place.
- Internal notes, other bureaus' narratives and reporter identities never appear. Hindi and English labels via the i18n files.
- Tests: no internal fields in the API response (S21), reply goes to the N70 log, a transferred case never shows "Submitted".

N87 Monthly pendency report for the Competent Authority  (PS: monitor pending, disposed, transferred and escalated cases; SPEC 12.2, N77, N80)
- /reports/monthly: pick a month and a scope (all, bureau, region). Table per bureau and per region: opening balance, received, disposed, transferred out, transferred in, escalated, closing balance, plus ageing buckets by days open (0–15, 16–30, 31–60, over 60). Opening + received − disposed ± transfers must equal closing; show a check mark when it reconciles and the difference when it does not.
- Every cell opens its cases (N47). One-click PDF and CSV with the N55 watermark. Build it on the IMPACT query builder; do not change its logic.
- Tests: the balance identity holds on the showcase data, drill-down count equals the cell, ABAC scope is respected.

N88 Institution's own redressal step  (PS: institution-level grievance monitoring)
- On the grievance form add one optional step: "Did you first raise this with your college's grievance committee or ombudsperson?" (Yes with date and outcome / No / Not applicable). Stored on the case and shown on the case page.
- Institution 360 gets a "Response record" card with raw counts only: AICTE queries answered on time X of Y, combined requests answered X of Y, documents in locker. Never a score or rank (SPEC 6.4, 17).
- Whether the internal step is required before AICTE accepts a case is a RuleBook rule family "Institution first-level redressal". ASK MANISH for the regulation text. Until approved it is advisory and shows "policy not configured". Never reject or delay a grievance because of it.
- Tests: no score field exists in the API, the step never blocks submission without an approved rule.

N89 Officer workload and handover suggestions  (PS: bureau-wise workload and no lost ownership; N77, N20, N60)
- On the supervisor's command centre and /cases: per officer in the bureau, open cases, near-due, overdue and on-leave status.
- When an officer is on leave or above a RuleBook load threshold (not configured → no suggestions, say so), suggest a TRACE handover to the least-loaded officer in the same bureau. The supervisor confirms each one; the handover then goes through NEXUS TRACE unchanged, and the sender stays accountable until acceptance.
- Tests: no automatic reassignment ever, suggestions respect bureau scope, accepted handovers appear in the case's ownership path.

SEED, WALKTHROUGH AND DESIGN
- Extend scripts/showcase-seed.js deterministically so every new screen has realistic, non-empty data across at least 8 colleges: overlapping actions, 6+ combined requests at different stages, lockers with versions and grants, monthly data for the last 6 months, a few students with open AICTE queries, and two officers on leave.
- Add the new features to the Guided Walkthrough in this order, after the existing overlap step: N81 → N82 → N83 → N86 → N87 → N84 (finish on the comparison). Keep the total under 18 steps.
- Every new page uses the design system: page header (eyebrow, title, one-line purpose), StatCards where numbers exist, real empty states, status chips, no raw codes, works at 390 px, visible keyboard focus, no console errors, first content in under 2 seconds.

PROVE IT
1. Extend e2e/page-audit.spec.js (or create it if the GLOBAL_JURY phase has not yet) to open every new page under every allowed role with the same failure rules (empty page, Access Denied from a sidebar link, banned words /synthetic|demo|fake|sample|simulator|POLICY_NOT_CONFIGURED|_comment/i in visible text, console error, over 3 seconds).
2. Add one Playwright rehearsal e2e/ps-story.spec.js that plays the full story: a student files → RB tries an inspection and gets the N81 warning → coordinates → N82 combined request issued → the college replies and reuses a locker document → the student sees "what happens next" → the authority opens the monthly report → the comparison page. Run it 3 times in a row; all must pass. Save screenshots and one video to docs/screenshots/ps-story/ with a README.
3. Full suite green, trace-check with zero violations, FEATURES.md and ADDITIONS.md updated, STATUS.md gets a "Problem-statement features (Codex)" section with test counts, and docs/JUDGE_SCRIPT.md gets a 90-second segment for the new story.
4. Report to Manish: what was built per N81–N89, the test counts, screenshots of N81, N82, N84, N86 and N87, the rehearsal result, and every open question (at least: N88 regulation text, N89 load threshold, reply-by days for combined requests if the source does not define them).
