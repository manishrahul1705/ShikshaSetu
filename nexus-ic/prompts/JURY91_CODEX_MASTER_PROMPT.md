You are running as Codex, locally on my laptop. Follow AGENTS.md. This is the JURY-91 release phase ONLY. Write your plan to plans/JURY91.md first, then continue without waiting, except where this prompt says ASK MANISH.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in AGENTS.md, PARALLEL_PLAN.md and this prompt. Do not run any git command.

ROLE
You are the release engineer who takes AWAAZ DASTAK (powered by NEXUS-IC), the AICTE SIH solution for Problem Statement 26264, from a mock-jury score of 77/100 to 91/100. The backend is strong; what is missing is a demo that has been rehearsed in a real browser, visual screens, a stronger duplicate matcher for reworded complaints, a few slow moments, and exact claims. You think before you code, you never guess, and you prove every claim with a passing test or a saved artefact.

FIRST, READ THE CURRENT STATE (do not skip)
1. STATUS.md: the single current picture. Anything it marks as done is done; do not redo it.
2. The jury review: https://claude.ai/artifact/BxanauuYWFUieL994cC5L5 (if you cannot open it, the ranked list is copied under SCOPE below).
3. AGENTS.md (binding; wins over this prompt), docs/SPEC.md, docs/ADDITIONS.md, FEATURES.md, docs/JUDGE_SCRIPT.md, docs/JUDGE_QA.md, docs/AI_METHODS.md, docs/LIMITATIONS.md, docs/SECURITY_REVIEW.md, plans/FINAL_AUDIT_REPORT.md.
4. Already finished by Claude on 25 Oct (skip these, only verify they still pass): the closed-status privacy fix, the session-secret and CSRF hardening, the containment signal and the 5,000-pair hard benchmark (server/src/modules/benchmark/hardCases.js), the load test (server/scripts/load-test.mjs), the spec-ID clean-up in the UI, the ICID column on IMPACT and /reports, the regional-office view at /regional, the officer dashboard and /cases, /audit, /notifications, and the npm audit record in SECURITY_REVIEW.md.

WORKSPACE
- Work directly in this folder (nexus-ic). No branches, copies or worktrees.
- Claude may still be working in this folder; Antigravity and Codex sessions may too. Before editing any file, re-read it from disk. Change only what this prompt asks for. If another tool's test fails, report it; never weaken it.
- Run the full suite only when no other test run is active, and always as (PowerShell):
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm run test:server -- --maxWorkers=2 --minWorkers=1; npm run test:client; node scripts/merge-results.js; node scripts/trace-check.js
  Eight workers time out against the local MongoDB; two workers do not.
- ASK MANISH before: any npm install, any download of a model or browser, and any reset or drop of the demo database awaaz_dastak_demo (a dev server uses it). Ask once, listing every package with its version and size, and wait for his yes.

NON-NEGOTIABLE RULES (summary of AGENTS.md; AGENTS.md wins)
- Nothing missed, nothing changed, nothing merged. Keep every name and text from SPEC.md exactly, including the banner "Potential Overlapping Cases – Coordination Required", status names, DEMO-* rule IDs and route paths. The PREVENT matcher keeps exactly the seven SPEC 8.3 signals and weights (issue 25, time window 15, category 10, document or subject 15, remedy 10, shared entities 10, semantic 15) and the RuleBook thresholds.
- Never invent missing content. Rows marked BLOCKED-SOURCE stay BLOCKED-SOURCE until their text is in SPEC Part B.
- Synthetic data only. No complainant text, identity or email in logs, notifications, exports or screenshots. Every screen and export says SYNTHETIC DATA. No real AICTE, CPGRAMS, ABC/APAAR or SMS calls.
- DONE means proven: real paths in "Built in" and a passing test titled "[<ID>] ..." ("[A-Nxx] ..." for additions). Never skip, delete or weaken a test. Every state change is audited; every route uses authorize(...); every case read goes through canAccessCase.
- Fixed stack: React JSX + Vite + Tailwind + React Router + TanStack Query + Recharts + optional React Flow; Express in plain JavaScript; MongoDB + Mongoose; Vitest + Supertest + React Testing Library; Playwright only for screenshots and the judge flow. No TypeScript, no Digital Twin.
- No model, browser or data ever leaves the laptop: the embedding model runs locally and offline after one approved download.

SCOPE (ranked by score gain; do them in this order)

1. Rehearse the demo in a real browser (biggest gain). ASK MANISH to approve: @playwright/test (dev dependency) plus its Chromium download, and resetting the demo database.
   - Add playwright.config.js and e2e/judge.spec.js. Start the dev servers against a separate database awaaz_dastak_e2e_demo (never the shared demo database) and seed it with the existing Judge Mode reset (POST /api/v1/judge/reset after signing in as supervisor1).
   - Walk docs/JUDGE_SCRIPT.md step by step as the named users (password demo1234): landing page, student verification and PID lookup, grievance with PREVENT Stage 1, routing, Institution 360 with the overlap banner, the overlap timeline, the transfer and acceptance, the closure gate blocking then passing, /track with receipt and feedback, /authority and /impact with a drill-down, the audit chain check and /integrity.
   - Save a full-page screenshot of every step to docs/screenshots/NN-step-name.png and a video of the whole run. Run it three times in a row; all three must pass. Fix whatever breaks (in the app, not by weakening the test). Record the runs in docs/screenshots/README.md.
   - Only after Manish says yes: reset awaaz_dastak_demo with npm run reset and run the flow once against it, so the stage laptop is ready.

2. Make the three judged screens visual. ASK MANISH to approve: qrcode (server), recharts and reactflow (client).
   - N63: the receipt shows a real QR to /track/:caseId (login still required). Move N63 from GAP to DONE in FEATURES.md only when [A-N63] asserts the QR SVG is present.
   - IMPACT (/impact, /reports, /regional): Recharts bar and line charts for the nine tiles, bureau and region rows and trends; every bar and point opens /impact/cases?row=... exactly like the numbers do (N47). Keep numerator, denominator, scope and the SYNTHETIC DATA label visible.
   - Institution 360 and /graph/institutions/:pid: React Flow graph (institution, cases, bureaus, transfer edges) using the existing /api/v1/graph data; keep the overlap banner on top.
   - The transfer history as a visual timeline (Requested, Acceptance Pending, Accepted, New Owner Active) on the case and /transfers pages.
   - Cut text on these screens to the one line each judge-script step says out loud.

3. Strengthen the matcher for reworded complaints. ASK MANISH to approve a local embedding package (for example @xenova/transformers with a small multilingual sentence model such as paraphrase-multilingual-MiniLM-L12-v2) and its one-time download.
   - Use it inside the existing SPEC "semantic" signal: semantic = max(current lexical value, embedding cosine mapped to 0..1). Do not add an eighth signal and do not change any weight or threshold. Cache embeddings by text hash. If the model is not available, fall back to the lexical value and say so in the signal's reason.
   - Re-run server/src/modules/benchmark/hardCases.js and the easy benchmark. Paraphrase recall must rise from 75.1%; precision must stay at or above 98% and the easy set at 100%. Update the table in docs/AI_METHODS.md and the answer in docs/JUDGE_QA.md with the new measured numbers only.

4. Remove the slow moments (no approval needed).
   - Precompute the IMPACT report in the background (on start-up and after case, check, transfer or closure changes, debounced), so even the first view is fast; keep the existing fingerprint cache as the safety net.
   - Paginate the officer queue (/api/v1/workspace/queue?page=&limit=) with counts done by a MongoDB aggregation, so a page returns in under half a second at 50,000 cases.
   - Re-run node server/scripts/load-test.mjs 50000 and put the new numbers in docs/JUDGE_QA.md.

5. Security pass (no approval needed for npm audit; ASK MANISH before installing OWASP ZAP or upgrading majors).
   - If Manish approves, upgrade react-router-dom first (runtime advisory), then the test and build tools, and keep the suite green. Run a ZAP baseline scan against the local app if approved. Record every run with date, tool version and findings in docs/SECURITY_REVIEW.md. Move S13 to DONE only when a scheduled audit with evidence is recorded; S08 stays GAP (it needs a real deployment review).

6. Reconcile with the original 23 Oct requirements. ASK MANISH to paste the 23 Oct PDF text (F01-F64, E01-E10, R01-R55, T/X/D tests). Copy it word for word into SPEC Part B, then for each row write in FEATURES.md Notes which built feature covers it; build only real differences. Never invent text for a row whose source you do not have.

7. Tighten the claims and add a pilot plan (no approval needed).
   - docs/LIMITATIONS.md: state the latest full run exactly (for example "277 tests; the 25 Oct run passed 274, with 3 setup timeouts that pass on their own"), and say the judge flow ran in a browser only once item 1 has really happened.
   - docs/PILOT_PLAN.md: one region, the data AICTE must supply (region and category tables, jurisdiction rules, SLA timelines), the integration approvals (ABC/APAAR, SSO, CPGRAMS, SMS), a 90-day timeline, and success measures (with numerator and denominator), plus the first pilot goal of a hand-labelled sample of real complaints for the matcher.
   - Update STATUS.md at the end of each item.

OWNERSHIP
- You may edit: e2e/, playwright.config.js, docs/screenshots/, the client pages for /impact, /reports, /regional, /graph, Institution 360, /transfers and the receipt, server/src/modules/prevent/signals.js (semantic signal only), server/src/modules/benchmark/, server/src/modules/impact/ and workspaces/ (performance only, same results), docs/AI_METHODS.md, docs/JUDGE_QA.md, docs/LIMITATIONS.md, docs/SECURITY_REVIEW.md, docs/PILOT_PLAN.md, SPEC Part B (only with Manish's pasted text), STATUS.md.
- package.json: only add the approved dependencies and an "e2e" script. Never hand-merge package-lock.json.
- FEATURES.md: only the rows you change (N63, S13, and BLOCKED-SOURCE rows once their text exists). Never reorder or reformat the table.

TESTS TO WRITE (titles start with the tag)
[A-N63] QR present; [N26]/[A-N47] chart bars open the same cases as the numbers; [N12] graph renders institution, cases and bureaus; [N20] transfer timeline shows the four steps; [A-N48] hard benchmark meets the precision and recall rules above; [JUDGE] the Playwright judge flow (three runs); performance assertions for the paginated queue (rows and counts match the unpaginated query).

DONE WHEN
- npm test is fully green in one run (no timeouts) and node scripts/trace-check.js says No violations.
- docs/screenshots/ holds every judge-script step from a passing browser run, three runs recorded.
- STATUS.md, docs/LIMITATIONS.md and docs/JUDGE_QA.md state only measured, current numbers.

REPORT (in plans/JURY91_REPORT.md and to me)
- What changed per item, the measured before and after numbers, every approval asked for and the answer, anything left open with its reason, and the exact test and trace-check output.
