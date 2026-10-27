Follow RULES.md for this whole conversation. This is the COMPLETE_FIX_REMAINING phase: verify what Antigravity built in COMPLETE_FIX, finish what is missing or broken, add the institution registry adapter (one new feature ID), then prove and freeze.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in RULES.md, PARALLEL_PLAN.md and this prompt. Do not run any git command. No npm install, no downloads, no new dependencies unless I approve the exact package in this conversation.

ROLE
You are the lead engineer and quality owner for AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264. Another agent (Antigravity) has just worked through plans/COMPLETE_FIX.md and claims a lot is done. Your first job is to check those claims against the running app and the tests, not to trust them. Then you finish the gaps, build the registry adapter, and leave a build that can go on stage. You never guess, never invent data, and prove every claim with a passing test, a saved screenshot or a saved file.

WORKSPACE (check this first, before reading anything else)
- You work directly in this folder (nexus-ic). No branches, copies or worktrees.
- NO OTHER AGENT MAY BE WORKING HERE. Antigravity was active in this folder recently (server/tests/setup.js changed at about 16:30 UTC on 26 Oct). Before you touch anything:
  1. Ask me: "Is every Antigravity, Codex and other agent window for this folder closed or idle?" Wait for my yes.
  2. Check running processes (PowerShell): Get-Process node, npx, vitest, playwright, mongod -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, StartTime, Path. A node/vitest/playwright process you did not start means another agent or test run is active.
  3. List files changed in the last 15 minutes: Get-ChildItem -Recurse -File | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-15) -and $_.FullName -notmatch 'node_modules' } | Select FullName, LastWriteTime.
  If 2 or 3 shows activity you did not cause, STOP and tell me what you found. Do not kill any process yourself.
- Ports: showcase 5180 (client) and 3100 (API); rehearsal runner 5317 and 4317. Leave anything on 5173/3000 alone.
- Databases: never reset, drop or reseed awaaz_dastak_demo. Do not rebuild awaaz_dastak_showcase (npm run showcase:seed) unless I approve it in this conversation. The rehearsal and e2e use their own isolated database through e2e/runtime.mjs.
- Run tests only with no competing runner, in this exact order (PowerShell):
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- --maxWorkers=2
  npm run test:client
  node scripts/merge-results.js
  node scripts/trace-check.js
  Vitest 4 no longer accepts --minWorkers; do not add it. Run node --check on every server file you change.

CONTEXT (read fully before anything else; do not skim)
1. RULES.md (binding; wins over this prompt), AGENTS.md, PARALLEL_PLAN.md, STATUS.md, FEATURES.md.
2. Every file in prompts/ (the original asks), especially prompts/COMPLETE_FIX_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md and prompts/JURY_FINAL_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md.
3. What Antigravity produced: plans/COMPLETE_FIX.md, plans/COMPLETE_FIX_GAPS.md, plans/COMPLETE_FIX_DESIGN_REVIEW.md, plans/PS_FIT.md, plans/GLOBAL_JURY_REPORT.md, plans/PS_FEATURES_REPORT.md.
4. Antigravity's new code: client/src/components/IndiaMap.jsx, client/src/components/CaseStepper.jsx, server/tests/additions-n90.test.js to additions-n95.test.js, server/tests/setup.js, and whatever those tests import.
5. The registry: server/src/modules/registry/ (catalogue.js, RegistrySimulator.js, search.js, plugins/), the institution admin import (channels / AdminImport), and the institution registration page in the client.
6. docs/SOURCE_23OCT_FERTXD.md, docs/JUDGE_SCRIPT.md, docs/JUDGE_QA.md, docs/AI_METHODS.md, docs/LIMITATIONS.md, docs/JURY_DEMO_GUIDE.md, docs/screenshots/README.md, e2e/page-audit.spec.js, e2e/runtime.mjs, playwright.config.js.

WHAT IS KNOWN ABOUT THE CURRENT STATE (verify each point; do not take it on trust)
- Built by Antigravity: N90 to N95 (college-name auto-fetch of PID and ICID, ABC and APAAR verification, ICID to region to Regional Grievance Cell routing, realistic status stepper, India map, saffron theme), with one test file each. It also seeded DEMO-REGIONAL-ROUTE-v1, six regional officer accounts and synthetic APAAR/ABC IDs, and fixed slow pages (hoisted getReporterId, optimised prevent/signals.js, AuditEvent targetId index, DEMO-CASE-STANDARD-v1).
- Claimed but NOT proven:
  - plans/COMPLETE_FIX_GAPS.md says every T, X and D row is COVERED. The 217 BLOCKED-SOURCE rows have not been re-checked against docs/SOURCE_23OCT_FERTXD.md.
  - plans/COMPLETE_FIX_DESIGN_REVIEW.md gives an average of 9.05/10 across roles, but there is no docs/screenshots/design-review/ folder. Scores without screenshots are not evidence.
  - plans/PS_FIT.md says the solution "directly fulfills 100%". That is a claim, not a rating.
  - The plan says the hand-made SVG India map is Survey of India compliant. Nobody has compared it with the official political outline (Jammu and Kashmir, Ladakh including Aksai Chin, Arunachal Pradesh, Andaman and Nicobar, Lakshadweep).
- Missing entirely: plans/COMPLETE_FIX_REPORT.md; any STATUS.md update since about 05:32; a new full test run (test-results/results.json still shows the morning's 307/307); a FROZEN FOR JURY section; rehearsal screenshots taken after N90 to N95.

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
  a. Run the full test sequence once and record exact totals. This is the baseline.
  b. For each of N90 to N95, open the running app as the right role and check it works end to end, not only in its unit test:
     - N90: typing part of a college name on the institution registration page suggests matches and fills PID and ICID; a PID/ICID mismatch goes to identity review.
     - N91: ABC and APAAR verification accepts valid synthetic IDs, rejects bad formats with a clear message, and is labelled as simulated.
     - N92: a new complaint is routed ICID, then region, then the right Regional Grievance Cell; the regional officer sees it in their queue; the route and the rule version are in the audit trail.
     - N93: the status stepper shows realistic stages (submitted, forwarded, under review, action taken, completed or closed) driven by real stored state, never a fake timer.
     - N94: the India map highlights the institute's region and is readable at 390 px.
     - N95: saffron accents appear on every page in every role without hurting contrast (WCAG AA for text).
  c. Re-check COMPLETE_FIX_GAPS.md: sample at least 30 T/X/D rows and every BLOCKED-SOURCE row against docs/SOURCE_23OCT_FERTXD.md and the code. Mark each as VERIFIED, PARTIAL or MISSING with the file and test that prove it.
  d. Compare IndiaMap.jsx with the official Survey of India political map. If the outline is wrong or incomplete, replace it with a correct outline from a source already in the repo, or ask me before adding any map data file. Do not download map data yourself.
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
  Do not rebuild anything Part 1 marked VERIFIED. Add or fix a test titled with the existing ID for every fix.

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
  - Check: no two pages for different jobs look like copies; consistent spacing and alignment; no empty gaps or dead space; no overflow or horizontal scroll at 390 px; saffron accents present; every button and link works; no "null", "undefined", NaN or bare 0 where a value is missing; each page's content is visible within three seconds.
  - Fix what fails, then re-shoot. Replace the scores in plans/COMPLETE_FIX_DESIGN_REVIEW.md with findings that point at screenshots. Give a score only if you can point to the screenshot that justifies it.

PART 5. PROBLEM-STATEMENT FIT, RATED HONESTLY
  - Rewrite plans/PS_FIT.md as a table: each requirement of PS 26264 (from docs/SOURCE_23OCT_FERTXD.md and the problem statement text in the repo), what the app does, the feature ID, the test, the screenshot, and Fully, Partly or Not met.
  - End with an overall fit rating out of 10 and the three biggest remaining gaps. No "100%" unless every row is Fully met with evidence.

PART 6. PROVE AND FREEZE
  - Run the full test sequence; zero failed, zero skipped; trace-check prints "No violations".
  - Build the client (npm run build in client) and confirm it succeeds.
  - Run the judge story three consecutive times through the existing Playwright runner on its isolated database, with the privacy guard on. Screenshots only (no video encoder is installed; do not download one). The story must now include N90 to N96: register an institute by name, verify ABC/APAAR, file a complaint, watch it route to the regional cell, see the map and the stepper move to action taken.
  - Make every document agree: STATUS.md, FEATURES.md, docs/JUDGE_SCRIPT.md, docs/JUDGE_QA.md, docs/LIMITATIONS.md (add the registry limits and the map source), docs/AI_METHODS.md, docs/JURY_DEMO_GUIDE.md, docs/screenshots/README.md. Search the docs for every test count, rehearsal claim and "live" claim and make them match this phase's runs.
  - Write plans/COMPLETE_FIX_REPORT.md (Antigravity never wrote it) covering Parts 1 to 6.
  - Last of all, add "FROZEN FOR JURY" to STATUS.md with the date, the final test totals, the rehearsal folder and this line: "No new features until after the finale. Only fixes to defects found in rehearsal." Update plans/STAGE_CHECKLIST.md (create it if missing) with the servers to start, the accounts, the walkthrough path including N96, and where the backup screenshots are.

STEPS
Step 1. Run the workspace checks above and paste their output. Wait for my yes that every other agent is idle.
Step 2. Read the context. Run Part 1a (baseline tests) only. Then write a PLAN in plans/COMPLETE_FIX_REMAINING.md with: (a) for each part, what you will do and which files you expect to touch; (b) the exact N96 design: the interface, the collections, the routes, the UI and the tests; (c) the columns you expect in the AICTE export and how you will handle a different layout; (d) anything that needs my approval (a showcase rebuild, a map data file, any package); (e) open questions. Then STOP and wait for my approval.
Step 3. After approval, work through Parts 1 to 6 in order. After each part, run the tests relevant to it and append a short dated entry to plans/COMPLETE_FIX_REMAINING.md.
Step 4. Verify: the full sequence passes with nothing failed or skipped; trace-check prints "No violations"; every role's pages pass at desktop and 390 px with screenshots saved; three consecutive rehearsals pass; awaaz_dastak_demo was not touched; no network call to any government site exists in the code.
Step 5. Self-review: re-read RULES.md, this prompt and every scope line, and list anything you did not do and why.

FINAL REPORT (print it here AND save it to plans/COMPLETE_FIX_REPORT.md)
- Part 1 table: each Antigravity claim, VERIFIED, PARTIAL or MISSING, and the evidence
- What you fixed in Part 2, per original ask
- N96: the files, the tests, and exactly how I import the AICTE list (where to download it on the AICTE dashboard, which file, which screen to upload it on)
- Design review: pages checked per role, issues found and fixed, the screenshot folder
- The PS fit table summary and the rating out of 10
- Exact test totals, the full trace-check output, rehearsal runs, times and folders
- Every file you created or changed
- Decisions and open questions for me

DONE WHEN
Every claim from COMPLETE_FIX is verified or fixed with evidence; N90 to N95 work end to end in the browser; N96 imports an official AICTE list I provide, searches by ICID or name with a visible source badge, and its live hook is clearly disabled with no network call; every page in every role is screenshotted at desktop and 390 px with no gaps, no look-alike pages and saffron throughout; PS_FIT.md gives an evidence-backed rating; one full test run passes with nothing failed or skipped; three rehearsals pass; every document agrees; STATUS.md says FROZEN FOR JURY; no git command was run; and plans/COMPLETE_FIX_REPORT.md is saved.
