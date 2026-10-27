You are GitHub Copilot in agent mode in VS Code, working in the nexus-ic folder. Follow RULES.md for this whole conversation. This is the COMPLETE_FIX_REMAINING phase: verify what was built in COMPLETE_FIX and patched by Codex, finish what is missing or broken, add the institution registry adapter (one new feature ID), give the portal a stronger saffron identity, then prove and freeze.
ADD AND FIX ONLY: no existing feature, page, route, field, role, test, ID, label or stored state may be removed, renamed or changed in behaviour. You may add new code and fix a defect, and a defect fix must keep the feature doing what FEATURES.md says it does. If something can only be done by changing an existing feature, stop and ask me first.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in RULES.md, PARALLEL_PLAN.md and this prompt. Do not run any git command. No npm install, no downloads, no new dependencies unless I approve the exact package in this conversation.

ROLE
You are the lead engineer and quality owner for AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264. Antigravity built N90 to N95 in COMPLETE_FIX, and Codex then audited and patched part of it in plans/PS_COMPLETION_AUDIT.md. Many of the earlier claims turned out to be unproven. Your first job is to check every claim against the running app and the tests, not to trust them. Then you finish the gaps, build the registry adapter, and leave a build that can go on stage. You never guess, never invent data, and prove every claim with a passing test, a saved screenshot or a saved file.

WORKSPACE (check this first, before reading anything else)
- You work directly in this folder (nexus-ic). No branches, copies or worktrees.
- NO OTHER AGENT MAY BE WORKING HERE. Codex was active until at least 17:15 UTC on 26 Oct, and Antigravity and Codex may both still have windows open on this folder. Before you touch anything:
  1. Ask me: "Are every Antigravity window and every Codex window for this folder closed or idle?" Wait for my yes.
  2. Check running processes (PowerShell): Get-Process node, npx, vitest, playwright, mongod -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, StartTime, Path. A node/vitest/playwright process you did not start means another agent or test run is active.
  3. List files changed in the last 15 minutes: Get-ChildItem -Recurse -File | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-15) -and $_.FullName -notmatch 'node_modules' } | Select FullName, LastWriteTime.
  If 2 or 3 shows activity you did not cause, STOP and tell me what you found. Do not kill any process yourself.
- Ports: showcase 5180 (client) and 3100 (API); rehearsal runner 5317 and 4317. Leave anything on 5173/3000 alone.
- Databases: never reset, drop or reseed awaaz_dastak_demo. Do not rebuild awaaz_dastak_showcase (npm run showcase:seed) unless I approve it in this conversation. The rehearsal and e2e use their own isolated database through e2e/runtime.mjs.
- Use the VS Code integrated terminal (PowerShell). Run tests only with no competing runner, in this exact order:
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- --maxWorkers=2
  npm run test:client
  node scripts/merge-results.js
  node scripts/trace-check.js
  Vitest 4 no longer accepts --minWorkers; do not add it. Run node --check on every server file you change.

CONTEXT (read fully before anything else; do not skim)
1. RULES.md (binding; wins over this prompt), AGENTS.md, PARALLEL_PLAN.md, STATUS.md, FEATURES.md.
2. Every file in prompts/ (the original asks), especially prompts/COMPLETE_FIX_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md and prompts/JURY_FINAL_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md.
3. What has been produced so far: plans/PS_COMPLETION_AUDIT.md (Codex, the most recent and most honest record; read it first), plans/COMPLETE_FIX.md, plans/COMPLETE_FIX_GAPS.md, plans/COMPLETE_FIX_DESIGN_REVIEW.md, plans/PS_FIT.md, plans/GLOBAL_JURY_REPORT.md, plans/PS_FEATURES_REPORT.md.
4. The new code: client/src/components/IndiaMap.jsx, client/src/components/CaseStepper.jsx, server/tests/additions-n90.test.js to additions-n95.test.js, server/tests/setup.js, and whatever those tests import.
5. The registry: server/src/modules/registry/ (catalogue.js, RegistrySimulator.js, search.js, plugins/), the institution admin import (channels / AdminImport), and the institution registration page in the client.
6. docs/SOURCE_23OCT_FERTXD.md, docs/JUDGE_SCRIPT.md, docs/JUDGE_QA.md, docs/AI_METHODS.md, docs/LIMITATIONS.md, docs/JURY_DEMO_GUIDE.md, docs/screenshots/README.md, e2e/page-audit.spec.js, e2e/runtime.mjs, playwright.config.js.

WHAT IS KNOWN ABOUT THE CURRENT STATE (checked at 18:04 UTC on 26 Oct: no plan, report, test or registry file has changed since 17:15, so neither the Codex nor the Antigravity version of this prompt was run. Verify each point; do not take it on trust)
- Built: N90 to N95 (college-name auto-fetch of PID and ICID, ABC and APAAR verification, ICID to region to Regional Grievance Cell routing, realistic status stepper, India map, saffron theme), each with a test file. Also seeded DEMO-REGIONAL-ROUTE-v1, six regional officer accounts and synthetic APAAR/ABC IDs, plus the slow-page fixes (hoisted getReporterId, optimised prevent/signals.js, AuditEvent targetId index, DEMO-CASE-STANDARD-v1).
- Codex's follow-up (plans/PS_COMPLETION_AUDIT.md, 17:12):
  - FEATURES.md: 364 rows, 137 DONE, 5 GAP, 217 BLOCKED-SOURCE, 2 PLANNED-P2, 3 NOT-ADOPTED. The GAP rows are S08 (TLS/encryption proof), S13 (security audit), N90 (live official institution lookup), N92 (proof that the regional cell actually receives and processes each case) and N94 (authoritative map boundaries).
  - trace-check fails with 12 violations: no merged run result for [A-N81] to [A-N89], [A-N91], [A-N93] and [A-N95]. test-results/results.json is still the morning's file.
  - The last full server run (test-results/ps-server-final.log, finished 17:15) had 265 passed and 2 failed, both in additions-n92.test.js ("expected undefined to be 'Regional Grievance Cell (Western)'" and "expected undefined to be 'NOT_AVAILABLE'"). That test file was edited about 17:01, after the run started, and a targeted N92 run passed 4/4. Prove which is true with one clean full run.
  - server/tests/setup.js now supports a per-run TEST_DB_NAMESPACE because two runners collided on the same _test database. Use a fresh namespace for your runs.
  - The case stepper was changed so a stage shows as done only when a matching event was recorded. Its focused and full tests are still pending.
  - The client build passed at 17:05 (test-results/ps-build-final.log). No all-role browser review and no passing rehearsal exist on the current build. A WebM fallback recording exists but that run failed at login, so it does not count.
  - Policy values for N82 (reply-by period), N88 (regulation text) and N89 (workload threshold) are still unconfigured. They must stay POLICY_NOT_CONFIGURED.
- Still claimed but contradicted by the evidence:
  - plans/PS_FIT.md says "100%" fit; Codex's provisional rating is 7/10 for the local demo.
  - plans/COMPLETE_FIX_DESIGN_REVIEW.md gives 9.05/10 with no screenshots (there is no docs/screenshots/design-review/ folder).
  - plans/COMPLETE_FIX_GAPS.md says every T, X and D row is COVERED, but nobody has re-checked them against docs/SOURCE_23OCT_FERTXD.md.
  - The hand-made SVG India map is described as Survey of India compliant without any comparison.
- Missing entirely: plans/COMPLETE_FIX_REMAINING.md (this phase starts fresh), the registry adapter for the IIC/AICTE lookup (Part 3), plans/COMPLETE_FIX_REPORT.md, any STATUS.md update since about 05:32, a FROZEN FOR JURY section.

NON-NEGOTIABLE RULES (summary of RULES.md; RULES.md wins)
- Keep every existing ID, title, module name and stored state exactly as written. New work uses the next free feature ID after the highest one in FEATURES.md (expected N96). DONE means a real file path plus a passing test titled "[<ID>] ...".
- Never skip, weaken, delete or loosen a test, an assertion or a timeout to get green. Fix the code, or report the test as failing.
- Never invent policy values, data, measurements or evidence. Unconfigured policies stay POLICY_NOT_CONFIGURED; missing values stay UNKNOWN, never 0. A number goes in a document only if a run in this phase produced it, with its command and date.
- PID is authoritative; ICID only corroborates. A PID/ICID mismatch goes to identity review, never auto-resolved.
- Every state change calls audit.record(); every route uses authorize(...); every case read goes through canAccessCase. No automatic case closure and no automatic ownership move.
- ABC and APAAR verification stays simulated. Never call a real DigiLocker, ABC, APAAR, AICTE or IIC system.
- Synthetic data only in the demo. No complaint text, OTP or identity in logs, screenshots or reports.
- No scraping of any website, and no code that pretends a live government connection exists.

SCOPE: exactly these six parts, in this order

PART 1. VERIFY BEFORE BUILDING
  a. BASELINE (before you change any file): run the full test sequence once, with a fresh TEST_DB_NAMESPACE and nothing else running. Save the exact totals and the full list of test titles with their result (pass, fail, skip) to plans/BASELINE_TESTS.json, and the FEATURES.md row count by status to plans/BASELINE_FEATURES.txt. These are what "nothing removed or changed" is measured against. Settle the two N92 failures here.
  b. For each of N90 to N95, open the running app as the right role and check it works end to end, not only in its unit test:
     - N90: typing part of a college name on the institution registration page suggests matches and fills PID and ICID; a PID/ICID mismatch goes to identity review.
     - N91: ABC and APAAR verification accepts valid synthetic IDs, rejects bad formats with a clear message, and is labelled as simulated.
     - N92: a new complaint is routed ICID, then region, then the right Regional Grievance Cell; it is explicitly forwarded to that cell (a recorded FORWARDED event, not only a secondary routing field); the regional officer sees it in their queue, acknowledges it and records action taken; the status updates at once for the student and the institute; the route and the rule version are in the audit trail. This closes the N92 GAP row.
     - N93: the status stepper shows realistic stages (submitted, forwarded, under review, action taken, completed or closed) driven by recorded events, never a fake timer and never inferred from a later status. A case that was only forwarded shows only forwarded.
     - N94: the India map highlights the institute's region and is readable at 390 px.
     - N95: saffron accents appear on every page in every role without hurting contrast (WCAG AA for text). I want the portal to feel more saffron than it does now: see Part 4.
  c. Re-check PS_COMPLETION_AUDIT.md and COMPLETE_FIX_GAPS.md: sample at least 30 T/X/D rows and every BLOCKED-SOURCE row against docs/SOURCE_23OCT_FERTXD.md and the code. Mark each as VERIFIED, PARTIAL or MISSING with the file and test that prove it.
  d. Compare IndiaMap.jsx with the official Survey of India political map (this is the N94 GAP row). If the outline is wrong or incomplete, replace it with a correct outline from a source already in the repo, or ask me before adding any map data file. Do not download map data yourself.
  e. Write everything to plans/COMPLETE_FIX_VERIFY.md: VERIFIED, PARTIAL or MISSING per item, with evidence.

PART 2. FINISH WHAT IS MISSING OR BROKEN
  Fix only the items Part 1 marked PARTIAL or MISSING, from these original asks:
  - every feature in the prompts/ folder is really built;
  - college-name auto-fetch of PID and ICID;
  - ICID, then region, then Regional Grievance Cell routing, with the status updated as soon as the cell acts;
  - India map with the institute's region marked;
  - realistic statuses (forwarded, action taken, completed);
  - ABC and APAAR verification;
  - saffron on every page.
  Do not rebuild anything Part 1 marked VERIFIED, and do not undo Codex's fixes (the stepper event rule, TEST_DB_NAMESPACE, the corrected N85 mapping) unless a test proves them wrong. Add or fix a test titled with the existing ID for every fix. The N90 GAP row (live lookup) is closed by Part 3 as "official file import plus disabled live hook", not by a live connection.

PART 3. INSTITUTION REGISTRY ADAPTER (new feature, next free ID, expected N96)
  What I asked for: searching for an institute by ICID should fetch its details from the IIC portal and return details of any AICTE-registered college.
  What is actually possible (build exactly this, nothing more):
  - There is no public API for the IIC portal (iic.mic.gov.in) or for AICTE approvals. AICTE publishes approved-institute lists on its public dashboard (facilities.aicte-india.org) as year-wise and state-wise downloads. So the app imports an official list that I download by hand. It never scrapes and never fakes a live call.
  Build:
  a. A RegistryAdapter interface in server/src/modules/registry/ with search(query), getByPid(pid), getByIcid(icid) and describe() (the source name, the date of the list, the record count, live or offline).
  b. FictionalCatalogueAdapter: wrap the existing 120-institution catalogue.js unchanged. It stays the default for the demo and showcase.
  c. OfficialFileImportAdapter: an admin-only import (reuse the existing AdminImport pattern and authorize(...)) for a CSV or Excel file I provide from the AICTE dashboard, plus an optional IIC member list if I have one.
     - Map the columns: AICTE permanent ID (PID), institute name, state, district, type, programmes if present, and ICID only when the file has it.
     - Validate the PID format (1-XXXXXXXXXX style, as AICTE prints it) and the ICID format. Reject bad rows into an error report; never guess a missing value.
     - Store the provenance on every record: the source file name, the date of the list as I enter it, the import time, the importer and a file hash.
     - Dry-run preview first (counts of new, updated, rejected); write only after I confirm in the UI. Every import calls audit.record().
     - Imported real colleges go into a separate collection used only for lookup and search. They can never become the target of a demo grievance, and the demo and showcase seeds never load them.
     - If no file has been imported, search says "No official list imported yet" and falls back to the fictional catalogue, clearly labelled as fictional.
  d. LivePortalAdapter: a disabled stub, labelled in code and in the UI "Live IIC/AICTE lookup: awaiting official API access". It makes no network call, is switched off by config, and throws a clear NOT_CONFIGURED error if called. Document in docs/LIMITATIONS.md what an official API agreement would need to switch it on.
  e. ICID search in the UI: entering an ICID or a college name returns the details from whichever adapter is active, with a visible source badge (Fictional demo data / Official AICTE list as of <date> / Live, disabled) on every result. The PID stays authoritative; when only an ICID matches, show "ICID match, PID not confirmed".
  f. Tests titled "[N96] ...": each adapter, PID/ICID validation, dry-run with no writes, the import audit event, authorize() refusing non-admins, the live stub making no network call, the source badge, and the rule that imported real colleges cannot receive demo grievances. Use a small synthetic CSV fixture shaped like the AICTE export. Do not commit any real college data into the repo.
  g. Add the N96 rows to FEATURES.md and update trace-check so it prints "No violations".

PART 4. DESIGN REVIEW WITH REAL EVIDENCE
  - Log in as every role (all nine in e2e/page-audit.spec.js plus the six regional officers) and visit every page that role can reach, at desktop width and at 390 px.
  - Save each screenshot under docs/screenshots/design-review/<role>/<page>-<width>.png with an index.md.
  - SAFFRON, MORE OF IT (my extra ask): use the existing saffron token in the Tailwind config, never a new ad-hoc hex. Give the portal a clear saffron identity on every page: the top bar or its bottom border, the active nav item, primary buttons, page title underline or accent bar, focus rings, the stepper's current stage, key stat tiles and the map's highlighted region. Keep body text dark on light for contrast (WCAG AA), keep status colours (red, amber, green) for meaning only, and do not flood whole backgrounds. Check it at desktop and 390 px and in every role.
  - Check: no two pages for different jobs look like copies; consistent spacing and alignment; no empty gaps or dead space; no overflow or horizontal scroll at 390 px; saffron identity present as described above; every button and link works; no "null", "undefined", NaN or bare 0 where a value is missing; each page's content is visible within three seconds.
  - Fix what fails, then re-shoot. Replace the scores in plans/COMPLETE_FIX_DESIGN_REVIEW.md with findings that point at screenshots. Give a score only if you can point to the screenshot that justifies it.

PART 5. PROBLEM-STATEMENT FIT, RATED HONESTLY
  - Rewrite plans/PS_FIT.md as a table: each requirement of PS 26264 (from docs/SOURCE_23OCT_FERTXD.md and the problem statement text in the repo), what the app does, the feature ID, the test, the screenshot, and Fully, Partly or Not met.
  - End with an overall fit rating out of 10 and the three biggest remaining gaps. Start from Codex's provisional 7/10 and move it only with evidence. No "100%" unless every row is Fully met with evidence.

PART 6. PROVE AND FREEZE
  - Run the full test sequence; zero failed, zero skipped; trace-check prints "No violations".
  - Build the client (npm run build in client) and confirm it succeeds.
  - Run the judge story three consecutive times through the existing Playwright runner on its isolated database, with the privacy guard on. Screenshots only (no video encoder is installed; do not download one). The story must now include N90 to N96: register an institute by name, verify ABC/APAAR, file a complaint, watch it route to the regional cell, see the map and the stepper move to action taken.
  - Make every document agree: STATUS.md, FEATURES.md, docs/JUDGE_SCRIPT.md, docs/JUDGE_QA.md, docs/LIMITATIONS.md (add the registry limits and the map source), docs/AI_METHODS.md, docs/JURY_DEMO_GUIDE.md, docs/screenshots/README.md. Search the docs for every test count, rehearsal claim and "live" claim and make them match this phase's runs.
  - Write plans/COMPLETE_FIX_REPORT.md (it was never written) covering Parts 1 to 6, and update plans/PS_COMPLETION_AUDIT.md's completion gate with the final results.
  - Last of all, add "FROZEN FOR JURY" to STATUS.md with the date, the final test totals, the rehearsal folder and this line: "No new features until after the finale. Only fixes to defects found in rehearsal." Update plans/STAGE_CHECKLIST.md (create it if missing) with the servers to start, the accounts, the walkthrough path including N96, and where the backup screenshots are.

STEPS
Step 1. Run the workspace checks above and paste their output. Wait for my yes that every other agent is idle.
Step 2. Read the context. Run Part 1a (baseline tests) only. Then write a PLAN in plans/COMPLETE_FIX_REMAINING.md with: (a) for each part, what you will do and which files you expect to touch; (b) the exact N96 design: the interface, the collections, the routes, the UI and the tests; (c) the columns you expect in the AICTE export and how you will handle a different layout; (d) anything that needs my approval (a showcase rebuild, a map data file, any package); (e) open questions. Then STOP and wait for my approval.
Step 3. After approval, work through Parts 1 to 6 in order. After each part, run the tests relevant to it and append a short dated entry to plans/COMPLETE_FIX_REMAINING.md.
Step 4. Verify: compare against plans/BASELINE_TESTS.json and plans/BASELINE_FEATURES.txt. Every test title from the baseline must still exist and pass (any that failed at baseline must now pass, or be listed with the reason); no FEATURES.md row may be gone or have its ID or title changed; DONE rows may not have gone backwards. Also: the full sequence passes with nothing failed or skipped; trace-check prints "No violations"; every role's pages pass at desktop and 390 px with screenshots saved; three consecutive rehearsals pass; awaaz_dastak_demo was not touched; no network call to any government site exists in the code.
Step 5. Self-review: re-read RULES.md, this prompt and every scope line, and list anything you did not do and why.

FINAL REPORT (print it here AND save it to plans/COMPLETE_FIX_REPORT.md)
- Part 1 table: each earlier claim (COMPLETE_FIX and PS_COMPLETION_AUDIT), VERIFIED, PARTIAL or MISSING, and the evidence
- What you fixed in Part 2, per original ask
- N96: the files, the tests, and exactly how I import the AICTE list (where to download it on the AICTE dashboard, which file, which screen to upload it on)
- Design review: pages checked per role, issues found and fixed, the screenshot folder
- The PS fit table summary and the rating out of 10
- Exact test totals, the full trace-check output, rehearsal runs, times and folders
- Before and after: test totals, the list of baseline test titles that are still present and passing (it must be all of them), and FEATURES.md row counts by status
- Every file you created or changed, and for every changed (not new) file, one line on why the change keeps the existing feature as it was
- Decisions and open questions for me

DONE WHEN
Every baseline test still exists and passes, and no existing feature was removed or changed in behaviour;
Every claim from COMPLETE_FIX and PS_COMPLETION_AUDIT is verified or fixed with evidence; the five GAP rows are closed or honestly re-labelled with a reason; N90 to N95 work end to end in the browser; the regional cell visibly receives, acknowledges and acts on a forwarded case; N96 imports an official AICTE list I provide, searches by ICID or name with a visible source badge, and its live hook is clearly disabled with no network call; every page in every role is screenshotted at desktop and 390 px with no gaps, no look-alike pages and a clear saffron identity throughout; PS_FIT.md gives an evidence-backed rating; one full test run passes with nothing failed or skipped; three rehearsals pass; every document agrees; STATUS.md says FROZEN FOR JURY; no git command was run; and plans/COMPLETE_FIX_REPORT.md is saved.
