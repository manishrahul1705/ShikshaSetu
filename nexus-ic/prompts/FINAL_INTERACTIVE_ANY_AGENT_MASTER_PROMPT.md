Follow RULES.md for this whole conversation. This is the FINAL_INTERACTIVE phase: smart college search, self-service ABC/Aadhaar check (simulated), no empty pages, interactive pages with more saffron, an interactive India map, and an honest proof run. It works for Codex, Antigravity or Copilot; whichever tool you are, follow it exactly.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in RULES.md, PARALLEL_PLAN.md and this prompt. Do not run any git command. No npm install, no downloads, no new dependencies unless I approve the exact package in this conversation.
ADD AND FIX ONLY: no existing feature, page, route, field, role, test, ID, label or stored state may be removed, renamed or changed in behaviour. You may add code and fix defects. If a request can only be met by changing an existing feature, stop and ask me first.

ROLE
You are the lead engineer and quality owner for AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264. Two other AI tools have already worked on this folder (N90 to N96: college auto-fetch, ABC/APAAR checks, regional routing, status stepper, India map, saffron, official-list registry adapter). Their claims are not proven. Your first job is to find out what actually works, then finish what is missing, then prove it. You never guess, never invent data, and prove every claim with a passing test, a saved screenshot or a saved file.

WORKSPACE (check this first, before reading anything else)
- You work directly in this folder (nexus-ic). No branches, copies or worktrees.
- NO OTHER AGENT MAY BE WORKING HERE. Files in server/src/modules/registry and client/src/pages/institutions were still changing at about 05:07 UTC on 27 Oct, so another tool may be open right now. Before you touch anything:
  1. Ask me: "Are Codex, Antigravity and Copilot all closed or idle for this folder?" Wait for my yes.
  2. Check running processes (PowerShell): Get-Process node, npx, vitest, playwright, mongod -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, StartTime, Path. A node/vitest/playwright process you did not start means another agent or a test run is active.
  3. List files changed in the last 15 minutes: Get-ChildItem -Recurse -File | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-15) -and $_.FullName -notmatch 'node_modules' } | Select FullName, LastWriteTime.
  If 2 or 3 shows activity you did not cause, STOP and tell me what you found. Do not kill any process yourself.
- Ports: showcase 5180 (client) and 3100 (API); rehearsal runner 5317 and 4317. Leave anything on 5173/3000 alone.
- Databases: never reset, drop or reseed awaaz_dastak_demo. Do not rebuild awaaz_dastak_showcase (npm run showcase:seed) unless I approve it in this conversation. Tests and e2e use their own isolated databases; use a fresh TEST_DB_NAMESPACE for every run (server/tests/setup.js supports it).
- Run tests only with no competing runner, in this exact order (PowerShell):
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- --maxWorkers=2
  npm run test:client
  node scripts/merge-results.js
  node scripts/trace-check.js
  Do not add --minWorkers (Vitest 4 rejects it). Run node --check on every server file you change. Do not run the two test suites at the same time as each other.

CONTEXT (read fully before anything else)
1. RULES.md (binding; wins over this prompt), AGENTS.md, STATUS.md, FEATURES.md, prompts/AUDIT.md.
2. plans/PS_COMPLETION_AUDIT.md (most recent honest record), plans/COMPLETE_FIX.md, plans/COMPLETE_FIX_GAPS.md, plans/PS_FIT.md, plans/COMPLETE_FIX_DESIGN_REVIEW.md, and any plans/COMPLETE_FIX_REMAINING*.md.
3. The registry: server/src/modules/registry/ (adapters.js, OfficialInstitution.js, catalogue.js, search.js, registryRoutes.js, RegistrySimulator.js), server/tests/additions-n90.test.js, additions-n96.test.js, final-polish-registry.test.js, client/src/components/InstitutionPicker.jsx, client/src/pages/institutions/InstitutionLookup.jsx, client/src/components/IndiaMap.jsx.
4. Identity: server/src/modules/identity/service.js (note the existing manual_review status), server/tests/additions-n91.test.js, client/src/pages/trust/Verify.jsx.
5. Seeds and showcase: scripts/ and the showcase seed, e2e/page-audit.spec.js, e2e/runtime.mjs, docs/SOURCE_23OCT_FERTXD.md.

WHAT IS KNOWN (as checked at about 05:15 UTC on 27 Oct; verify, do not trust)
- N96 exists: RegistryAdapter-style code, an OfficialInstitution collection, CSV import with preview, a disabled live adapter, admin-only routes and an audit event on import. It has only 4 unit tests (no database, audit, authorize or dry-run test) and no upload screen.
- The last full server run (yesterday 17:15 UTC) had 265 passed and 2 failed (N92). The merged test-results/results.json now holds only 5 N96 tests, so trace-check cannot confirm older DONE rows. The latest client run had 7 failures out of 87, most of them 5 to 6 second timeouts and one assertion failure in [N02] (an arbitrary reference accepted where null was expected). FEATURES.md has 5 GAP rows: S08, S13, N90, N92, N94.
- The catalogue is 120 fictional institutions with initials-based search tokens already in catalogue.js. No real college is bundled, and none may be invented.
- No run of any of the earlier prompts has finished: no COMPLETE_FIX_REPORT, no STATUS.md update since yesterday morning, no all-role screenshot review.

NON-NEGOTIABLE RULES (summary of RULES.md; RULES.md wins)
- New work uses the next free feature ID after the highest in FEATURES.md (expected N97 onward). DONE means a real file path plus a passing test titled "[<ID>] ...".
- Never skip, weaken, delete or loosen a test, an assertion or a timeout to get green. Fix the code or report the test as failing.
- Never invent policy values, data, measurements or evidence. Unconfigured policies stay POLICY_NOT_CONFIGURED; missing values stay UNKNOWN, never 0 or null on screen. A number goes in a document only if a run in this phase produced it, with its command and date.
- PID is authoritative; ICID only corroborates. A PID/ICID mismatch goes to identity review, never auto-resolved.
- Every state change calls audit.record(); every route uses authorize(...); every case read goes through canAccessCase. No automatic case closure, rejection or ownership move.
- Never call a real government system: no UIDAI, DigiLocker, ABC, APAAR, AICTE or IIC call, and no scraping of any website. Synthetic data only in the demo. No complaint text, OTP, Aadhaar or ABC number in logs, screenshots or reports.
- Never invent a PID, ICID or any detail for a real college. See Part 2.

SCOPE: exactly these eight parts, in this order

PART 1. BASELINE AND VERIFY (before you change any file)
  a. Run the full test sequence once with a fresh TEST_DB_NAMESPACE. Save every test title with its result to plans/BASELINE_TESTS.json and the FEATURES.md row counts by status to plans/BASELINE_FEATURES.txt. Settle the 2 N92 failures and the 7 client failures: for each, say whether it was a timeout under load or a real defect, with the evidence. Fix real defects in the code.
  b. Check in the running app (showcase, 5180) what N90 to N96 really do for each role. Write the results to plans/FINAL_INTERACTIVE_VERIFY.md as VERIFIED, PARTIAL or MISSING with evidence.

PART 2. SMART COLLEGE SEARCH WITH DROPDOWN (new feature IDs)
  Wherever a college is chosen (institution registration, complaint intake, institution lookup, global search), one shared combobox:
  - As the user types, show a dropdown of matches after two characters, with the college name, city, state, PID, ICID (or "ICID not available") and a source badge (Fictional demo data, or Official AICTE list as of <date>). Arrow keys, Enter, Escape, mouse and touch all work; it has proper combobox roles for screen readers; it shows "No match" with a hint, never an empty box.
  - Matching covers: any part of the name; abbreviations and acronyms (the initials of the significant words, so "sece" matches "Sri Eshwar College of Engineering"; "nitk", "iitb" style forms too); the aliases column; common short forms (Engg, Inst, Tech, Univ, Coll, Sch) expanded in the query only; case, punctuation and accent insensitive; ranked: exact acronym or PID or ICID first, then prefix, then substring, then close spelling (one or two typos).
  - Choosing a match fills PID and ICID and shows the full details card (name, address fields present, state, district, region, type, programmes if present, approval status with as-of date), then drops a pin on the India map (Part 6). If the college has no ICID, say "ICID not available" and keep the PID.
  - Search runs over both sources (the fictional catalogue and any imported official list), each result clearly labelled. Results are bounded to 20.
  REAL COLLEGES: I named Sri Eshwar College of Engineering (SECE). Its real PID and ICID are NOT in this repo, and you must not make them up, guess them from memory or add a made-up row for a real institution. The only way a real college appears is through the official AICTE list (and IIC list, if I have one) that I download and import through N96. So:
  - Prove the acronym and name matching with a synthetic stand-in in the test fixtures (for example "Sri Example College of Engineering", acronym "SECE"), titled in the tests as a stand-in.
  - Add an admin screen for the N96 import (choose CSV or Excel file, enter the list's as-of date, see the dry-run preview with counts of new, updated and rejected rows and the rejection reasons, then Confirm). Excel (.xlsx) reading may need a package: ask me before adding one; otherwise accept CSV and tell me how to save the AICTE download as CSV.
  - Handle the real AICTE export layout: map columns by header name tolerantly (permanent id, institute name, state, district, city, institution type, programme, and so on), report unknown columns, and never guess missing values.
  - When I have imported my file, run the live acceptance check: search "sece" and "Sri Eshwar College of Engineering" and show what comes back, with screenshots. If my file is not imported yet, say clearly that this check is waiting on my file and list exactly what I need to do.
  - IIC portal: there is no public API. Search by ICID works against the imported lists. The live hook stays a disabled stub labelled "Live IIC/AICTE lookup: awaiting official API access". No scraping.
  - Tests titled with the new IDs: acronym, name, alias, typo, short-form, ranking, keyboard selection, auto-fill, bounded results, source badge, import preview with no writes, import audit event, admin-only authorize, imported real colleges never become the target of a demo grievance.

PART 3. SELF-SERVICE ABC / AADHAAR CHECK (simulated) (new feature IDs)
  - A student who enters their own ABC ID gets their details fetched and verified on the spot from the local simulator: name, institution (PID), programme and status shown for them to confirm, then the identity step completes with no officer review.
  - A student with no ABC ID is asked for an Aadhaar number instead. This is a local format and checksum check on a synthetic test number only (12 digits, Verhoeff checksum, and the simulator's list of synthetic numbers). It completes on the spot with no officer review.
  - A student with neither can still use the existing officer-assisted path. Do not remove or change that path or the manual_review status; the new self-service path is added beside it.
  - SENSITIVE: this is a simulated identity check. Label it everywhere "Simulated check, not a government verification". Never call UIDAI or ABC systems. Never store a full Aadhaar or ABC number: keep only a salted hash and the last four digits for display, never log either, never show the full number back after entry, and redact them in screenshots. Accept only the simulator's synthetic numbers in the demo. Say in docs/LIMITATIONS.md that a real deployment needs an authorised API agreement and consent flow, and that this feature must not be presented as replacing real verification.
  - Keep the existing safeguards: a name or institution mismatch, a repeated number on a different account, or too many failed tries still routes to the existing manual review. It is the happy path that skips the officer, not the fraud checks.
  - Tests: ABC happy path with no manual_review, Aadhaar fallback, bad checksum, unknown number, mismatch goes to review, no raw number in the database, logs or audit, simulated label present, officer-assisted path still works.

PART 4. NO EMPTY PAGES
  - For every role (the nine in e2e/page-audit.spec.js plus the six regional officers) and every page they can reach, find every empty or near-empty state, "0", "UNKNOWN" shown as the only content, blank chart, empty table or blank card.
  - Fill them through the real services and seed scripts, not by hard-coding on the page: realistic synthetic cases across all statuses (submitted, forwarded, under review, action taken, completed), regional queues, notifications, appeals, insider and RESCUE alerts, fingerprints for 30 days, reports, consents, benchmark results, reveal requests. Missing policy values still show their honest label with a one-line explanation and the next step, not a blank.
  - Every table and chart has a designed empty state as a last resort (what will appear here and how to create it), but the showcase must not rely on it.
  - Rebuilding the showcase database needs my approval: write the plan and ask. Do not touch awaaz_dastak_demo.
  - Tests that fail if a listed page renders no data in the showcase fixture.

PART 5. MORE INTERACTIVE, MORE SAFFRON
  Use the existing saffron token in the Tailwind config; never a new ad-hoc hex. Keep body text dark on light for WCAG AA, keep red, amber and green for meaning only, and do not flood whole backgrounds.
  - Saffron identity on every page: top bar edge, active navigation, primary buttons, page title accent, focus rings, selected rows, stat tiles, chart accents, the stepper's current stage, the map highlight.
  - Interactivity beyond styling, added to existing pages without changing what they do: sortable and filterable tables, clickable stat tiles that open the filtered list, hover and focus detail, expandable rows, tabs and drawers for detail, inline status stepper with timestamps, copy buttons for IDs, keyboard shortcuts where natural, skeleton loaders instead of blank frames, and gentle transitions that respect prefers-reduced-motion.
  - No two pages for different jobs look like copies; spacing and alignment consistent; no unwanted gaps or dead space; no horizontal scroll at 390 px; no "null", "undefined", NaN or bare 0 where a value is missing; every page shows content within three seconds.

PART 6. INTERACTIVE INDIA MAP
  - Replace nothing; extend IndiaMap.jsx. States and union territories are individually selectable. Hover shows the name, region and number of colleges in the active registry sources; click selects the state and lists its colleges (opens the same details card as the dropdown); keyboard focus and Enter work; a zoom-and-pan control and a reset; a legend of the five AICTE regions in distinct, accessible colours with the selected one in saffron.
  - When a college is chosen (by name, PID or ICID), the map highlights its state and region and drops a labelled pin. A pin at city level is shown only if the data for that college includes coordinates; otherwise pin the state and say "Location shown at state level". Never invent coordinates.
  - The outline must follow the official Survey of India political map (Jammu and Kashmir, Ladakh including Aksai Chin, Arunachal Pradesh, the Andaman and Nicobar and Lakshadweep islands). Compare the present outline with that map. If the repo has no accurate outline, DO NOT download or hand-draw a substitute and call it official: ask me to supply a Survey of India-compliant SVG or GeoJSON, and until then keep the current drawing with the visible label "Illustrative map, boundaries not official". This closes or honestly re-labels the N94 GAP.
  - Works at 390 px (tap targets at least 40 px, pinch or buttons for zoom). Tests for selection, highlight, pin and the illustrative label.

PART 7. FIT TO THE PROBLEM STATEMENT, RE-RATED
  Rewrite plans/PS_FIT.md as a table: each requirement of PS 26264 (from docs/SOURCE_23OCT_FERTXD.md), what the app does, the feature ID, the test, the screenshot, and Fully, Partly or Not met. End with an overall rating out of 10 and the three biggest remaining gaps. No "100%" unless every row is Fully met with evidence. The last independent ratings were 7 out of 10 (Codex) and 7.5 out of 10 (Claude); move them only with evidence.

PART 8. PROVE IT
  - Run the full test sequence with a fresh namespace: zero failed, zero skipped; trace-check prints "No violations". Compare with plans/BASELINE_TESTS.json and plans/BASELINE_FEATURES.txt: every baseline test title still exists and passes, no FEATURES.md row is gone or has its ID or title changed, DONE rows have not gone backwards.
  - Build the client (npm run build in client) and confirm it succeeds.
  - Screenshots for every role and every page at desktop and 390 px under docs/screenshots/final-interactive/<role>/<page>-<width>.png with an index.md. Redact any ID numbers.
  - Run the judge story three times in a row through the Playwright runner on its isolated database. Screenshots only (no video encoder; do not download one). The story includes: type "sece" or a partial name, pick from the dropdown, PID/ICID/details fill, the map pin, ABC self-verification with no officer, file a complaint, watch it route to the regional cell, and the stepper move to action taken.
  - Make every document agree: STATUS.md, FEATURES.md, docs/JUDGE_SCRIPT.md, docs/JUDGE_QA.md, docs/LIMITATIONS.md, docs/AI_METHODS.md, docs/JURY_DEMO_GUIDE.md, docs/screenshots/README.md. Every test count, rehearsal claim and "live" claim must match this phase's runs.
  - Write plans/FINAL_INTERACTIVE_REPORT.md. Last of all, add "FROZEN FOR JURY" to STATUS.md with the date, the final test totals and the rehearsal folder, and update plans/STAGE_CHECKLIST.md.

STEPS
Step 1. Run the workspace checks and paste their output. Wait for my yes that every other tool is idle.
Step 2. Read the context. Do Part 1a only. Then write a PLAN in plans/FINAL_INTERACTIVE.md: for each part, what you will do and the files you expect to touch; the feature IDs you will use; the combobox and ranking design; the Aadhaar and ABC data handling; the AICTE column mapping and how a different layout is handled; the list of empty pages found so far and how each will be filled; anything that needs my approval (showcase rebuild, Excel package, a Survey of India map file); open questions. Then STOP and wait for my approval.
Step 3. After approval, work through Parts 1 to 8 in order. After each part run the relevant tests and append a dated entry to plans/FINAL_INTERACTIVE.md.
Step 4. Verify as in Part 8. awaaz_dastak_demo must not have been touched; no network call to any government or college site exists in the code.
Step 5. Self-review: re-read RULES.md, this prompt and every scope line, and list anything you did not do and why.

FINAL REPORT (print it here AND save it to plans/FINAL_INTERACTIVE_REPORT.md)
- Part 1: each earlier claim as VERIFIED, PARTIAL or MISSING, and what was a timeout versus a real defect
- Search: what matches, the ranking, and the exact steps for me to import my AICTE file and then see SECE come up; the live acceptance result, or that it is waiting on my file
- ABC and Aadhaar: how it works, what is stored, and the simulated label
- Empty pages: the list found, and how each was filled
- Interactivity and saffron: what was added per page type
- The map: what is interactive, and whether the outline is official or still labelled illustrative
- The PS fit table summary and rating out of 10
- Before and after: test totals, baseline titles still present and passing (must be all), FEATURES.md counts, trace-check output, rehearsal runs, times and folders
- Every file you created or changed, and for each changed (not new) file, one line on why the existing feature is unchanged
- Decisions and open questions for me

DONE WHEN
Every baseline test still exists and passes and no existing feature was removed or changed; typing a name, acronym or PID/ICID shows a dropdown and picking one fills PID, ICID and details and marks the map; the official-list import has a screen and works on my AICTE file, and no real college data was invented; a student with an ABC ID (or a synthetic Aadhaar) is verified instantly with no officer, labelled simulated, with no raw numbers stored; no page in any role renders empty in the showcase; every page has saffron and real interactivity; the map is interactive and honestly labelled; PS_FIT.md has an evidence-backed rating; one full test run passes with nothing failed or skipped; three rehearsals pass; every document agrees; STATUS.md says FROZEN FOR JURY; no git command was run; and plans/FINAL_INTERACTIVE_REPORT.md is saved.
