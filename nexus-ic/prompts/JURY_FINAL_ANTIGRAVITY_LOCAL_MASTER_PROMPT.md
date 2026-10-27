Follow RULES.md for this whole conversation. This is the JURY-FINAL phase ONLY: finish, verify and freeze. No new features.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in RULES.md, PARALLEL_PLAN.md and this prompt. Do not run any git command. No npm install, no downloads, no new dependencies.

ROLE
You are the release engineer and quality owner for AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264. Two phases are half-finished: GLOBAL_JURY (plans/GLOBAL_JURY.md) and N81–N89 (plans/PS_FEATURES.md, plans/PS_FEATURES_REPORT.md). Your job is to close them with evidence, make every document tell the same story, and leave a build that can go on stage. You think before you act, you never guess, and you prove every claim with a passing test or a saved file.

WORKSPACE (check this first, before reading anything else)
- You work directly in this folder (nexus-ic). Do not create branches, copies or worktrees.
- NO OTHER AGENT MAY BE WORKING HERE. Before you touch anything:
  1. Ask me: "Is every Codex window for this folder closed or idle?" Wait for my yes.
  2. Check running processes (PowerShell): Get-Process node, npx, vitest, playwright, mongod -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, StartTime, Path. A node/vitest/playwright process you did not start means another agent or test run is active.
  3. List files changed in the last 15 minutes: Get-ChildItem -Recurse -File -Exclude node_modules | Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-15) -and $_.FullName -notmatch 'node_modules' } | Select FullName, LastWriteTime.
  If 2 or 3 shows activity you did not cause, STOP and tell me what you found. Do not kill any process yourself.
- Ports: the showcase uses 5180 (client) and 3100 (API); the rehearsal runner uses 5317 and 4317. Leave anything already running on 5173/3000 alone.
- Databases: never reset, drop or reseed awaaz_dastak_demo. Do not rebuild awaaz_dastak_showcase unless I approve it in this conversation. The rehearsal uses its own isolated database through e2e/runtime.mjs.
- Run tests only with no competing runner, in this exact order (PowerShell):
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- --maxWorkers=2
  npm run test:client
  node scripts/merge-results.js
  node scripts/trace-check.js
  Vitest 4 no longer accepts --minWorkers; do not add it. Run node --check on every server file you change.

CONTEXT (read fully before anything else; do not skim)
1. RULES.md (binding; wins over this prompt), AGENTS.md, PARALLEL_PLAN.md, STATUS.md.
2. plans/GLOBAL_JURY.md (including "Verification continuation" and "Findings and integration corrections"), plans/PS_FEATURES.md, plans/PS_FEATURES_REPORT.md, plans/FINAL_POLISH_REPORT.md, plans/JURY_PAGE_AUDIT_26OCT.md.
3. The latest logs: plans/global-jury-browser.log (UTF-16), plans/global-jury-server-full.log, plans/global-jury-client-full.log, plans/global-jury-runtime.log.
4. docs/JUDGE_SCRIPT.md, docs/JUDGE_QA.md, docs/AI_METHODS.md, docs/LIMITATIONS.md, docs/JURY_DEMO_GUIDE.md, docs/screenshots/README.md.
5. e2e/page-audit.spec.js, e2e/runtime.mjs, playwright.config.js, server/src/modules/benchmark/ (service.js, localEmbeddings.js), server/src/modules/prevent/signals.js and matcher.js.

NON-NEGOTIABLE RULES (summary of RULES.md; RULES.md wins)
- No new features, routes, pages or modules. Fix defects, speed and evidence only. If a fix seems to need a new feature, write it under "Open questions" and do not build it.
- Never skip, weaken, delete or loosen a test, an assertion or a timeout to get green. A failing test is fixed in the code or reported as failing.
- Never invent policy values, data, measurements or evidence. Unconfigured policies stay POLICY_NOT_CONFIGURED; missing values stay UNKNOWN. A number appears in a document only if a run in this phase produced it, with its command and date.
- Keep every ID, title, module name and stored state exactly as written. DONE means a real file path plus a passing test titled "[<ID>] ..." or "[A-Nxx] ...".
- Every state change still calls audit.record(); every route still uses authorize(...); field policies and privacy masks stay as they are.
- Synthetic data only. No complaint text, OTP or identity in logs, screenshots or reports.

SCOPE: exactly these six items, in this order

1. FIX THE SLOW AND FAILING PAGES
   The nine-role page audit (e2e/page-audit.spec.js, three-second content deadline) last recorded failures on desktop faculty /institutions/:id (3238 ms), desktop supervisor /regional (3407 ms) and desktop supervisor /cases/:caseId (2974 ms), and the log stops partway through the competent_authority role.
   - Profile each failing page first: which API calls run, how long each takes, and how much is client rendering. Write the numbers down before changing anything.
   - Fix the actual cause (an unindexed query, a sequential await chain that can run in parallel, an unbounded result, a heavy component that can load lazily). Do not raise the deadline.
   - Prove each fix returns the same scoped data for the same role as before (add or extend a test), and that no cache is shared across roles.
   - Re-run the full nine-role audit at desktop and 390 px mobile until every role passes. Save the evidence index under docs/screenshots/audit/.

2. ONE CLEAN FULL TEST RUN
   - The last full server run had 13 failures that were fixed and re-checked only in a targeted run (29/29). Run the full sequence above once, start to finish.
   - Record exact totals (server, client, merged), duration, and the trace-check output. If anything fails, fix the code and run the whole sequence again; do not report a partial run as the result.

3. AI MODEL: BENCHMARK IT OR TAKE IT OUT OF THE PITCH
   - The local model Xenova/paraphrase-multilingual-MiniLM-L12-v2 (pinned revision 2c4055b12046f11709e9df2c122e59ffbdc2f900) is already downloaded under server/src/modules/benchmark/models/ and wired into the semantic signal in prevent/signals.js, but it is off by default and has never been benchmarked. Find how it is switched on (JURY91_DISABLE_LOCAL_MODEL and the load path in localEmbeddings.js). Do not download anything.
   - Run the 5,000-pair hard benchmark twice, model off and model on, with the same fixtures, seed and RuleBook version. Record precision, recall, per-stratum results (especially paraphrase and code-mixed), and the added time per duplicate check.
   - Decision rule: if recall on paraphrase rises and overall precision stays at or above the model-off value, recommend switching it on for the showcase and say so in the plan for my approval. Otherwise keep it off and remove every mention of an embedding model from JUDGE_SCRIPT.md and the spoken pitch.
   - Either way, update docs/AI_METHODS.md and docs/JUDGE_QA.md with the measured numbers only. Weights and RuleBook thresholds stay unchanged.
   - If the benchmark test [A-N48] still times out, find out why (model loading inside the test is the likely cause) and fix it without raising its timeout.

4. MAKE EVERY DOCUMENT TELL THE SAME STORY
   Write the missing reports and bring the rest up to date, using only numbers from this phase's runs:
   - plans/GLOBAL_JURY_REPORT.md: what was built, page-audit results per role (before and after), measured speeds, open issues.
   - plans/PS_FEATURES_REPORT.md: replace "evidence so far" with final verified results for N81–N89. Mark each row DONE only with a passing test.
   - FEATURES.md rows touched by GLOBAL_JURY and N81–N89; then trace-check must print "No violations".
   - STATUS.md, docs/JUDGE_QA.md (it still says 278 tests and "browser rehearsal has not yet run"), docs/LIMITATIONS.md, docs/AI_METHODS.md, docs/JUDGE_SCRIPT.md, docs/JURY_DEMO_GUIDE.md, docs/screenshots/README.md.
   - Afterwards, search the docs for any test count, rehearsal claim or model claim and make sure they all match.

5. RE-RECORD THE REHEARSAL ON THE FINAL BUILD
   - Build the client (npm run build in client) and confirm it succeeds; note the bundle-size warning if it remains.
   - Run the full judge story three consecutive times through the existing Playwright runner on its isolated database, with the privacy guard on. No video encoder is installed, so record screenshots only and say so; do not download an encoder.
   - Save each run's numbered screenshots and manifest; update docs/screenshots/README.md with the browser version, times, pass/fail/flaky counts and folder paths.
   - Open and look at the landing page, command centre, case page (check that the header never shows "null"), results slide (check that average resolution days is a real value or UNKNOWN with a reason, never a bare 0) and the tracking page screenshots. Fix anything wrong and re-run.

6. FREEZE
   - When items 1 to 5 are complete and green, add a "FROZEN FOR JURY" section to STATUS.md with the date, the final test totals, the rehearsal folder, and this line: "No new features until after the finale. Only fixes to defects found in rehearsal."
   - Write a one-page plans/STAGE_CHECKLIST.md: which servers to start and in what order, the accounts to use, how to warm the IMPACT cache before going on stage, the walkthrough path, and where the backup screenshots are.

STEPS
Step 1. Run the workspace checks above and paste their output. Wait for my yes on Codex.
Step 2. Read the context. Then write a PLAN with: (a) for each of the six items, what you will do and which files you expect to touch; (b) the profiling you will do for item 1; (c) the exact benchmark commands for item 3; (d) anything that needs my approval (showcase rebuild, switching the model on); (e) open questions. Save it to plans/JURY_FINAL.md. Then STOP and wait for my approval.
Step 3. After approval, work through items 1 to 6 in order. After each item, run the tests relevant to it and append a short dated entry to plans/JURY_FINAL.md.
Step 4. Verify: the full test sequence passes with zero failed and zero skipped; trace-check prints "No violations"; the nine-role audit passes at desktop and mobile; three consecutive rehearsals pass; awaaz_dastak_demo was not touched.
Step 5. Self-review: re-read RULES.md, this prompt and every scope line, and list anything you did not do and why.

FINAL REPORT (print it here AND save it to plans/JURY_FINAL_REPORT.md)
- Each of the six items: DONE or NOT DONE, with evidence paths
- Page speeds before and after, per failing page
- Benchmark model-off versus model-on table, and the decision
- Exact test totals and the full trace-check output
- Rehearsal results (runs, times, browser, folders)
- Every file you created or changed
- Decisions and open questions for me

DONE WHEN
Every page in the nine-role audit loads within three seconds at desktop and mobile; one full test run passes with nothing failed or skipped; the AI model is either measured and justified or gone from the pitch; every document gives the same test count, rehearsal status and AI description; three consecutive rehearsals pass on the final build with screenshots saved; STATUS.md says FROZEN FOR JURY; nothing outside scope was built; no git command was run; and plans/JURY_FINAL_REPORT.md is saved.
