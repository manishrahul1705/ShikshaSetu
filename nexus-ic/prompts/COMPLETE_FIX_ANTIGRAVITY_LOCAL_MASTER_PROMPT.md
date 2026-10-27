Follow RULES.md for this whole conversation. This is the COMPLETE-FIX phase. It replaces prompts/JURY_FINAL_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md; do not run that one as well.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in RULES.md, PARALLEL_PLAN.md and this prompt. Do not run any git command. Do not run npm install or download anything unless I approve that exact package in this conversation.

ROLE
You are the lead engineer, product designer and quality owner for AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264, "Integrated Institution Grievance Monitoring and Resolution System". You will finish everything the earlier prompts promised and add the last features the product owner asked for. You will then make every page, for every login, look complete, neat and aligned, with no page looking like a copy of another. Finally you will prove all of it and freeze the build for the jury. You think before you code, you never guess, and you prove every claim with a passing test, a saved screenshot or a measured number.

WORKSPACE (check this first, before reading anything else)
- You work directly in this folder (nexus-ic). Do not create branches, copies or worktrees.
- NO OTHER AGENT MAY BE WORKING HERE. Before you touch anything:
  1. Ask me: "Is every Codex window for this folder closed or idle?" Wait for my yes.
  2. Check running processes (PowerShell): Get-Process node, npx, vitest, playwright, mongod -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, StartTime, Path. A node, vitest or playwright process you did not start means another agent or test run is active.
  3. List files changed in the last 15 minutes: Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules' -and $_.LastWriteTime -gt (Get-Date).AddMinutes(-15) } | Select FullName, LastWriteTime.
  If check 2 or 3 shows activity you did not cause, STOP and tell me what you found. Do not kill any process yourself.
- Ports: the showcase uses 5180 (client) and 3100 (API); the rehearsal runner uses 5317 and 4317. Leave anything already running on 5173 or 3000 alone.
- Databases: never reset, drop or reseed awaaz_dastak_demo. You may rebuild awaaz_dastak_showcase only through npm run showcase:seed, and only after I approve the seed changes in your plan. The rehearsal uses its own isolated database through e2e/runtime.mjs.
- Run tests only with no competing runner, in this exact order (PowerShell):
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- --maxWorkers=2
  npm run test:client
  node scripts/merge-results.js
  node scripts/trace-check.js
  Vitest 4 no longer accepts --minWorkers; do not add it. Run node --check on every server file you change.

CONTEXT (read fully before anything else; do not skim)
1. RULES.md (binding; wins over this prompt), AGENTS.md, PARALLEL_PLAN.md, STATUS.md, FEATURES.md, docs/ADDITIONS.md.
2. The problem statement and specifications:
   - docs/NEXUS-IC_Unified_24Oct.pdf, which wins over docs/SPEC.md. Read SPEC sections 3 (ICID), 5 (verification), 6 (registry, six regions, Institution 360), 7, 8.1, 9.1, 12, 13 and Appendices V and W.
   - docs/SOURCE_23OCT_FERTXD.md, the 23 October source that is now in the repo, and docs/NEXUS-IC_Final_Complete_Solution_23Oct.pdf.
3. Every file in prompts/: all S0 to S7 prompts, JURY91, FINAL_POLISH, GLOBAL_JURY and PS_FEATURES.
4. Every report in plans/: the S0 to S7 reports, FINAL_AUDIT_REPORT, JURY91_REPORT, FINAL_POLISH_REPORT, JURY_PAGE_AUDIT_26OCT, UI_VERIFICATION_25OCT, GLOBAL_JURY.md (including "Verification continuation" and "Findings"), PS_FEATURES_REPORT, and the latest global-jury-*.log files (the browser log is UTF-16).
5. The docs: JUDGE_SCRIPT, JUDGE_QA, AI_METHODS, LIMITATIONS, JURY_DEMO_GUIDE, PILOT_PLAN, SECURITY_REVIEW, screenshots/README.
6. The code you will touch: the registry, institutions and identity modules, the routing engine and RuleBook seed, lifecycle and lifecycleGuards, trace, regional, notifications, client/src/components (Layout, navigation, InstitutionPicker, ui/PageKit), client/tailwind.config.js, client/src/index.css, every page under client/src/pages and client/src/additions, e2e/page-audit.spec.js and the showcase seed.

NON-NEGOTIABLE RULES (summary of RULES.md; RULES.md wins)
- Keep every ID, title, module name and stored state exactly as written. New work gets new IDs, starting at N90, each registered in FEATURES.md and ADDITIONS.md with a test titled "[A-N90] ..." and so on. Raise the trace-check row count to match.
- Never invent policy values, legal timelines, data or measurements. A policy value exists only if it is in the 24 Oct or 23 Oct source, or is a demo value I approve, stored through the two-person RuleBook flow and labelled synthetic. Production refuses DEMO rules. Missing values stay POLICY_NOT_CONFIGURED or UNKNOWN, shown with their reason.
- External identity systems are never called. ABC (Academic Bank of Credits) and APAAR verification run only through local simulator adapters behind the existing adapter contract. They are clearly labelled in code, docs and the spoken script as simulated until AICTE grants access. No real person's ABC ID or APAAR ID is stored, and no real college receives a grievance.
- The system never closes a case, rejects a grievance or moves ownership on its own. Status changes come only from recorded human actions or recorded system events such as routing and acknowledgement. Every state change calls audit.record(); every route uses authorize(...); every case read goes through canAccessCase.
- Never skip, weaken, delete or loosen a test, an assertion or a timeout to get green.
- Synthetic data only. No complaint text, OTP or identity in logs, screenshots or reports.

SCOPE: work through these parts in order

PART 1. GAP AUDIT: NOTHING PROMISED MAY BE MISSING
a. For every prompt in prompts/, list each thing it asked for and check that it exists in code with a passing test. Report each item as DONE, MISSING or PARTIAL in plans/COMPLETE_FIX_GAPS.md.
b. The 217 BLOCKED-SOURCE rows (F, E, R, T, X, D and N36–N45) can now be checked, because docs/SOURCE_23OCT_FERTXD.md is in the repo. For each row, read its exact definition and decide:
   - COVERED: name the built feature and the test that proves it.
   - BUILD: a real gap that this phase builds.
   - OUT OF SCOPE: with the reason.
   Update each row's Notes. Move a row to DONE only with a passing test titled with its ID. Never write a T, X or D test from memory: quote the source.
c. Finish what GLOBAL_JURY and PS_FEATURES (N81–N89) left open:
   - Fix the three slow pages: faculty /institutions/:id 3238 ms, supervisor /regional 3407 ms, supervisor /cases/:caseId 2974 ms.
   - Complete the nine-role audit, which stopped partway through competent_authority.
   - Write plans/GLOBAL_JURY_REPORT.md and the final PS_FEATURES_REPORT.md.

PART 2. FEATURES THE PRODUCT OWNER ASKED FOR (new IDs from N90)

N90 College name auto-fetch everywhere.
- On the grievance form, the institution registration and lookup page, SYNC and the header search, typing a college name, city, state, PID or ICID shows matching colleges. Picking one auto-fills the PID, ICID, ICID check (MATCH, NOT AVAILABLE or IDENTITY REVIEW), region, state, district and type, with no extra button press.
- Remove the duplicate manual PID box under the picker on the grievance form. Keep a small "enter PID instead" link for people who know it.
- Keep the existing rules: PID is authoritative, ICID only corroborates, and a mismatch goes to identity review.
- Results stay bounded and use the field allowlist.

N91 ABC ID and APAAR ID verification (simulated).
- Replace the fixture dropdown ("STUDENT-ACTIVE" and so on) on /verify with real inputs:
  - Students: APAAR ID and/or ABC ID, plus the college picked by name.
  - Faculty: staff ID plus the college.
- Validate the format on both client and server. Write the exact format rules into the plan from the source, or from the official public format if the source is silent, and say which.
- Check enrolment or employment against the local simulator registry, then run the existing consent, OTP and pseudonymous reporter-ID flow.
- Show a clear result: Verified, Not enrolled, Inactive, Mismatch with the selected college, or Manual review. Show a visible "Simulated ABC / APAAR check" label.
- Seed 20 or more synthetic IDs that cover every outcome. Store only what the vault already stores, encrypted.

N92 ICID-based regional routing to the Regional Grievance Cell.
- When a case is filed, resolve the college's ICID to its PID, take the region from the registry (the six AICTE regions), and forward the case to that region's Regional Grievance Cell. Keep the category's bureau as the coordinating secondary, or the reverse if the source says otherwise; read SPEC 6.3, 8.1 and the 23 Oct routing text first.
- Store the route as a RuleBook rule (for example DEMO-REGIONAL-ROUTE-v1) approved through the two-person flow, with the reason "Region Northern from PID 1-xxxx (ICID IIC-xxxx MATCH)" saved on the routing decision.
- Seed a regional officer and a Regional Grievance Cell queue for each of the six regions.
- If the ICID is unavailable, use the PID's region. If the region is unknown or the ICID is in identity review, send the case to human triage. Never guess a region.

N93 Realistic, fast status updates.
- The complainant sees a clear stepper built from real recorded events, for example: Submitted → Verified and registered → Forwarded to <Region> Regional Grievance Cell → Accepted by the cell → Under process → Action taken → Resolution proposed → Closed.
  - Show "Transferred" and "Query raised / reply received" only when they happened.
  - Show "Action taken" only when an officer action record exists.
- Map these display labels to the existing stored lifecycle states plus the existing event records. Do not add stored states that SPEC 9.1 does not have; if a new state seems needed, ask me.
- Each step shows the date and time, and the office and role (never a person's name).
- Update the status screen and notifications as soon as the event is recorded, with no manual refresh: refetch on focus plus short polling on open tracking pages is enough.
- A transferred case still never reverts to Submitted.
- Add an officer "Record action taken" button that requires a short note and evidence where the RuleBook asks for it.

N94 India map with the college's region marked.
- Show an India map that highlights the college's region and pins its state, on the case page, Institution 360, the complainant tracking page and the regional view.
- On the regional view and command centre, colour each region by its open-case count, and make every region clickable to open its exact cases (reuse N47 drill-down).
- Prefer an India outline that matches the official Survey of India boundaries, because a government jury will notice wrong borders. Bundle it locally: no map tiles, no online map service, no network calls.
- If this needs a new package or a downloaded map file, name the exact package or file, its licence and its source in the plan, and wait for my approval.

N95 Saffron across every page.
- Use the existing saffron tokens in tailwind.config.js consistently on every page:
  - page eyebrow labels
  - primary action buttons
  - the active sidebar item
  - focus rings
  - section underlines
  - one accent stripe per page header
- Keep navy as the base and keep green for success states, with a tasteful tricolour feel.
- Check text contrast meets WCAG AA on every saffron surface.

PART 3. DESIGN REVIEW OF EVERY PAGE FOR EVERY LOGIN
- Generate the route inventory from the real route definitions. For each of the nine demo logins, open every page that role may use, at desktop 1366×768 and mobile 390 px, and save the screenshots under docs/screenshots/design-review/<role>/.
- Every page must have:
  - a clear header (title, one-line purpose, saffron eyebrow)
  - its scoped key numbers where they exist
  - content that fills the layout, with no unwanted empty gaps
  - aligned grids and consistent spacing from PageKit
  - a useful empty state with an action
  - no raw JSON, raw codes, "null", "undefined", bare 0 for an unknown value, or developer wording
  - no horizontal scroll on mobile
- No two pages may look like copies: each gets a layout suited to its job, such as a queue, a case file, a dashboard, a form, a map or an audit log. Pages still on the old style must be rebuilt in the design system; JURY_PAGE_AUDIT_26OCT.md lists them. Admin.jsx is the oldest.
- Every button, link and form on each page must actually work for that role. A sidebar item a role cannot use must not be shown to it.
- Extend e2e/page-audit.spec.js to check all of this automatically: content present, banned wording absent, no console errors, content within three seconds, no mobile overflow.
- Then look at every screenshot yourself and record a score out of 10 per page, before and after, in plans/COMPLETE_FIX_DESIGN_REVIEW.md. The target is 8 or more on every page.

PART 4. AI MODEL: MEASURE IT OR TAKE IT OUT OF THE PITCH
- The local model Xenova/paraphrase-multilingual-MiniLM-L12-v2 (pinned revision 2c4055b12046f11709e9df2c122e59ffbdc2f900) is already in server/src/modules/benchmark/models/. It is wired into prevent/signals.js, off by default and never benchmarked.
- Run the 5,000-pair hard benchmark with the model off and on (same fixtures, seed and rule version). Record precision, recall, per-stratum results and the added time per check.
- Recommend switching it on only if paraphrase recall rises and precision does not drop, and wait for my approval. Otherwise remove every embedding claim from the pitch.
- Fix the [A-N48] timeout without raising it.

PART 5. PROBLEM-STATEMENT FIT
- Write plans/PS_FIT.md: take each requirement and expectation of PS 26264 and the AICTE manager expectations in SPEC Appendix V, and map each to the screen and test that proves it.
- Rate the fit out of 10, with reasons, before and after this phase. Anything not covered becomes a Part 2 item or is listed as out of scope with a reason.

PART 6. PROOF, DOCUMENTS AND FREEZE
- Run the full test sequence until it passes with zero failed and zero skipped, then run trace-check until it prints "No violations".
- Build the client and confirm it succeeds.
- Run the judge story three consecutive times on the final build. Add the new steps: name auto-fetch, ABC/APAAR check, forwarding to the regional cell, the India map and the status stepper.
- Save the screenshots per run. No video encoder is installed, so record screenshots only and say so.
- Update STATUS.md, JUDGE_SCRIPT.md (still 5 minutes), JUDGE_QA.md, AI_METHODS.md, LIMITATIONS.md, JURY_DEMO_GUIDE.md and screenshots/README.md. Use only numbers from this phase's runs, so every document gives the same test count, rehearsal status and AI description.
- Write plans/STAGE_CHECKLIST.md: which servers to start and in what order, the accounts to use, cache warm-up, the walkthrough path and where the backup screenshots are.
- Last, add a "FROZEN FOR JURY" section to STATUS.md with the date, the final totals and this line: "No new features until after the finale. Only fixes to defects found in rehearsal."

STEPS
Step 1. Run the workspace checks and paste their output. Wait for my yes on Codex.
Step 2. Read the context. Do Part 1a and 1b as a read-only audit, then write a PLAN with:
   (a) the gap list summary;
   (b) for each Part 2 item, the design, the files and the tests;
   (c) the ABC/APAAR formats and their source;
   (d) the regional routing rule and how it fits SPEC 8.1;
   (e) the map approach, and any package or file needing approval;
   (f) the status stepper mapping table from stored state and event to display label;
   (g) the showcase seed changes;
   (h) every approval you need from me;
   (i) open questions.
   Save it to plans/COMPLETE_FIX.md. Then STOP and wait for my approval.
Step 3. After approval, build in small steps in the order Part 1c, 2, 3, 4, 5. Run the relevant tests after each step, and append a short dated entry to plans/COMPLETE_FIX.md.
Step 4. Do Part 6.
Step 5. Self-review: re-read RULES.md, this prompt and every scope line, and list anything you did not do and why.

FINAL REPORT (print it here AND save it to plans/COMPLETE_FIX_REPORT.md)
- Gap audit results: prompts and the 217 source rows (COVERED, BUILT, OUT OF SCOPE)
- N90 to N95: DONE or not, with tests and screenshots
- The design review table: every page and role, before and after scores
- Problem-statement fit: before and after, with the mapping file
- Benchmark model off versus on, and the decision
- Page speeds before and after
- Exact test totals, the full trace-check output and the rehearsal results
- Every file you created or changed, every approval used, and the open questions

DONE WHEN
- Nothing any prompt promised is missing or unexplained.
- Typing a college name fills the PID, ICID and region everywhere.
- ABC ID and APAAR ID checks work through the clearly labelled simulator.
- Every new case is forwarded by ICID and region to the right Regional Grievance Cell with its reason saved.
- Complainants see a real, timely status stepper.
- An India map marks each college's region.
- Every page for every login scores 8 or more, with saffron accents, no gaps, no copies and nothing broken.
- One full test run passes with nothing failed or skipped, and trace-check prints "No violations".
- Three rehearsals pass on the final build.
- Every document agrees.
- STATUS.md says FROZEN FOR JURY, no git command was run, and plans/COMPLETE_FIX_REPORT.md is saved.
