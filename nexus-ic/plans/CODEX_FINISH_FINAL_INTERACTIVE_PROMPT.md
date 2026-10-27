Follow RULES.md (and AGENTS.md) for this whole conversation; they win over this prompt. This finishes the FINAL_INTERACTIVE phase that Claude started on 27 Oct 2026. Read prompts/FINAL_INTERACTIVE_ANY_AGENT_MASTER_PROMPT.md fully: it is the scope. This prompt tells you what is already done and what is left.

LOCAL RUN, NO GIT: run no git command; ignore every branch, commit, pull, push and pull-request instruction. No npm install, no downloads, no new dependency unless Manish approves the exact package in this conversation.
ADD AND FIX ONLY: no existing feature, page, route, field, role, test, ID, label or stored state may be removed, renamed or changed in behaviour. Never skip, weaken or delete a test, assertion or timeout.

WORKSPACE FIRST (stop and tell Manish if any check shows activity you did not cause)
1. Ask Manish: "Are Claude, Antigravity and Copilot all closed or idle for this folder?" Wait for yes.
2. PowerShell: Get-Process node, npx, vitest, playwright, mongod -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, StartTime, Path
3. Files changed in the last 15 minutes (excluding node_modules). Leave Manish's dev server on 5173/3000 alone. Showcase is 5180/3100; rehearsal runner 5317/4317.
4. Never reset, drop or reseed awaaz_dastak_demo. Rebuild awaaz_dastak_showcase (npm run showcase:seed) only if Manish says yes in this conversation.

READ BEFORE CHANGING ANYTHING
- plans/FINAL_INTERACTIVE.md (plan and running log), plans/FINAL_INTERACTIVE_VERIFY.md, plans/NEXT_STEPS.md, plans/BASELINE_TESTS.json, plans/BASELINE_FEATURES.txt, plans/PS_FIT.md.
- New code from this phase (do not rewrite it; extend or fix it):
  server/src/modules/registry/smartSearch.js, search.js, adapters.js, registryRoutes.js, OfficialInstitution.js;
  server/src/modules/identity/selfCheck.js, routes.js, service.js (claim is now exported);
  server/src/modules/cases/caseService.js (assertNotRealListInDemo);
  client/src/components/InstitutionPicker.jsx, InstitutionDetailsCard.jsx, IndiaMap.jsx;
  client/src/pages/admin/OfficialImport.jsx, client/src/routes/sfi.jsx, client/src/pages/trust/SelfCheckPanel.jsx, Verify.jsx;
  tests: server/tests/final-interactive-search.test.js, final-interactive-selfcheck.test.js, client/tests/final-interactive.test.jsx.

ALREADY DONE (verify, do not redo)
- Part 1: baseline saved. Real defects fixed: [S01] authorize() on three public routes, [R32] picker URL, [N02] faculty simulator. [S27] and the n86-n89 file were load timeouts.
- Part 2: N97 smart search (acronym, alias, short form, typo, ranked, bounded to 20, source badge, details card, map pin) and N98 CSV import screen at /admin/registry/import (Excel needs an approved package).
- Part 3: N99 simulated ABC / synthetic Aadhaar self-check (Verhoeff, salted hash plus last four digits, mismatch, reuse and three failures go to the existing manual review).
- Part 6: N100 interactive map (selectable states with counts, zoom/pan/reset, legend, state-level pin, label "Illustrative map, boundaries not official"). N94 stays GAP.
- Part 7: plans/PS_FIT.md rewritten, rating held at 7/10.
- FEATURES.md: N97–N100 DONE, N101 and N102 TODO.

FIRST: PROVE THE CURRENT TREE
Check test-results/fi-final-server.log, fi-final-client.log and fi-final-trace.log (namespace fi_final1). If they are missing or not green, run in this exact order with no competing runner:
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; $env:TEST_DB_NAMESPACE="fi_codex1"; npm test --workspace=server -- --maxWorkers=2
  npm run test:client
  node scripts/merge-results.js
  node scripts/trace-check.js
Do not add --minWorkers. Settle every failure as a load timeout (it passes alone; show the evidence) or a real defect (fix the code). node --check every server file you change.

LEFT TO DO, IN THIS ORDER (use FEATURE IDs N101 onward; the next new ID after N102 is N103)

A. N92 regional cell referral (closes the N92 GAP only if proven)
- When routing names "Regional Grievance Cell (<region>)", record an explicit referral on the case: forwarded (system, with the routing reason), then accepted by a regional officer of that region (a human action, through authorize('regional_officer') and canAccessCase, with audit.record()), then that officer's recorded actions move the stepper (Forwarded → Under review → Action taken). No automatic acceptance, closure or ownership move. Regional officers see a "Referred to my cell" queue on /regional.
- Tests [A-N92] (new titles, keep the old ones): referral recorded, only the right region can accept, the wrong region gets 403, an audit event for each step, the stepper shows only recorded stages.

B. N101 no empty pages
- For the nine roles in e2e/page-audit.spec.js plus the six regional officers, visit every page they can reach in the showcase and list every empty or near-empty state (blank chart, empty table, "0" or UNKNOWN as the only content). Write the list to plans/FINAL_INTERACTIVE_EMPTY_PAGES.md.
- Add a designed empty state to every table and chart (what will appear, and how to create it). Missing policy values keep their honest label plus a one-line next step.
- Fill the showcase through the real services and scripts/showcase-seed.js (cases across submitted, forwarded, under review, action taken and completed; regional queues; notifications; appeals; insider and RESCUE alerts; 30 days of fingerprints; reports; consents; benchmark results; reveal requests). Ask Manish before rebuilding the showcase.
- Tests [A-N101] that fail if a listed page renders no data on the showcase fixture.

C. N102 interactivity and saffron
- Use only the existing Tailwind saffron, ink and bharat tokens; no new hex. Keep body text WCAG AA; red, amber and green for meaning only.
- Add to existing pages, without changing what they do: sortable and filterable tables, stat tiles that open the filtered list, copy buttons for IDs, expandable rows, tabs or drawers for detail, skeleton loaders instead of blank frames, motion-safe transitions, a saffron page-title accent, active nav, focus rings and selected rows.
- No horizontal scroll at 390 px; no "null", "undefined", NaN or bare 0 for missing values; content within three seconds.
- Tests [A-N102] for sorting, filtering, a tile drill-down, copy-ID and the no-"undefined" scan.

D. Proof (Part 8)
- Full test sequence with a fresh namespace: zero failed, zero skipped; trace-check prints "No violations". Every title in plans/BASELINE_TESTS.json still exists and passes; no FEATURES.md row is removed or renamed; DONE rows have not gone backwards.
- cd client; npm run build: must succeed.
- Screenshots for every role and page at desktop and 390 px under docs/screenshots/final-interactive/<role>/<page>-<width>.png with an index.md. Mask inputs (e2e/privacy.cjs); redact ID numbers.
- Judge story three times in a row through the Playwright runner on its isolated database (screenshots only, no video encoder download): type "sece" or a partial name → pick from the dropdown → PID/ICID/details fill → map pin → ABC self-check with no officer → file a complaint → routed to the regional cell → regional officer accepts → stepper reaches Action taken. Before Manish's AICTE file is imported, use the fictional catalogue and say so in the report.
- Make STATUS.md, FEATURES.md, docs/JUDGE_SCRIPT.md, docs/JUDGE_QA.md, docs/LIMITATIONS.md, docs/AI_METHODS.md, docs/JURY_DEMO_GUIDE.md and docs/screenshots/README.md agree with this phase's runs only. (RULES Rule 8 marks docs/ read-only; Manish's master prompt asks for these updates. Confirm with Manish once.)
- Update plans/PS_FIT.md ratings only with the new evidence. Write plans/FINAL_INTERACTIVE_REPORT.md in the format of the master prompt's FINAL REPORT section. Last of all, add "FROZEN FOR JURY" to STATUS.md with the date, the final test totals and the rehearsal folder, and update plans/STAGE_CHECKLIST.md.

HARD RULES (summary)
- Never invent a PID, ICID, coordinate or any detail for a real college. Real colleges appear only through Manish's official-list import. Matching is proved with the synthetic stand-in "Sri Example College of Engineering".
- Never call UIDAI, DigiLocker, ABC, APAAR, AICTE or IIC, and never scrape. Keep "Simulated check, not a government verification" and "Live IIC/AICTE lookup: awaiting official API access".
- No complaint text, OTP, Aadhaar or ABC number in logs, screenshots or reports.
- Every state change calls audit.record(); every route uses authorize(); case reads go through canAccessCase; no automatic closure, rejection or ownership move.
- Unconfigured policy stays POLICY_NOT_CONFIGURED; missing values show UNKNOWN with a reason.
- Keep a dated running log in plans/FINAL_INTERACTIVE.md. If your usage limit nears 95%, stop with nothing half-edited and update plans/NEXT_STEPS.md.

ASK MANISH BEFORE: rebuilding the showcase, adding any package (including an Excel reader), adding any map data file.
WAITING ON MANISH: his AICTE list as CSV (sysadmin1 → Official list import → dry run → Confirm), then the live "sece" acceptance check with screenshots; and a Survey of India–compliant SVG or GeoJSON if he wants the official outline.
