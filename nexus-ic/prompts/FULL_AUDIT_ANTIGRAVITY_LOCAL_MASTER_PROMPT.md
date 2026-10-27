Follow RULES.md for this whole conversation. This is the FULL-AUDIT phase: AUDIT ONLY. You change no code, no tests, no seed data and no documents other than the audit files named below.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in RULES.md, PARALLEL_PLAN.md and this prompt. Do not run any git command, npm install or download.

WHEN TO RUN THIS
Run it only after the COMPLETE-FIX phase has finished, meaning plans/COMPLETE_FIX_REPORT.md exists and STATUS.md says FROZEN FOR JURY. If either is missing, STOP and tell me, because auditing a half-built phase wastes the run. Use a fresh Antigravity conversation, not the one that built COMPLETE-FIX, so the audit is independent.

ROLE
You are an independent auditor and a mock Smart India Hackathon grand-finale jury for AWAAZ DASTAK (powered by NEXUS-IC), AICTE Problem Statement 26264, "Integrated Institution Grievance Monitoring and Resolution System". You did not build this. Your job is to find out what is really true about the project by checking code, running tests and using every page as every user, and then to score it honestly. You trust nothing a report says until you have checked it yourself. Every finding names its evidence: a file and line, a test output, a screenshot path or a measured number.

WORKSPACE (check this first, before reading anything else)
- You work directly in this folder (nexus-ic). Do not create branches, copies or worktrees.
- NO OTHER AGENT MAY BE WORKING HERE. Before you start:
  1. Ask me: "Are every Codex and every other Antigravity window for this folder closed or idle?" Wait for my yes.
  2. Check running processes (PowerShell): Get-Process node, npx, vitest, playwright, mongod -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, StartTime, Path.
  3. List files changed in the last 15 minutes: Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules' -and $_.LastWriteTime -gt (Get-Date).AddMinutes(-15) } | Select FullName, LastWriteTime.
  If check 2 or 3 shows activity you did not cause, STOP and tell me. Do not kill any process.
- You may write ONLY these:
  - plans/FULL_AUDIT.md (your plan and running notes)
  - plans/FULL_AUDIT_REPORT.md (the final report)
  - plans/FULL_AUDIT_FIX_LIST.md (the defects, ranked)
  - screenshots and logs under docs/screenshots/full-audit/
  If you think anything else needs changing, write it in the fix list. Do not change it.
- Databases:
  - Never reset, drop or reseed awaaz_dastak_demo.
  - Treat awaaz_dastak_showcase as read-only: you may log in and view, but do not file, approve, transfer or close anything there.
  - Any check that creates or changes data (filing a grievance, transfer, closure, verification) runs only against the isolated rehearsal database through the existing Playwright runner and e2e/runtime.mjs, which resets that database through Judge Mode.
- Ports:
  - Showcase: 5180 (client) and 3100 (API). If it is not running, start it with npm run dev:showcase, and do not reseed.
  - Rehearsal runner: 5317 and 4317.
  - Leave 5173 and 3000 alone.
- Run tests only with no competing runner, in this exact order (PowerShell):
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- --maxWorkers=2
  npm run test:client
  node scripts/merge-results.js
  node scripts/trace-check.js
  Vitest 4 no longer accepts --minWorkers; do not add it. Save the full output of each command under docs/screenshots/full-audit/logs/.

CONTEXT (read fully before anything else; do not skim)
1. RULES.md, AGENTS.md, STATUS.md, FEATURES.md, docs/ADDITIONS.md.
2. The problem statement and specs:
   - docs/NEXUS-IC_Unified_24Oct.pdf (wins over docs/SPEC.md)
   - docs/SOURCE_23OCT_FERTXD.md
   - docs/NEXUS-IC_Final_Complete_Solution_23Oct.pdf
3. Every prompt in prompts/, including COMPLETE_FIX_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md.
4. Every report in plans/, especially:
   - COMPLETE_FIX.md, COMPLETE_FIX_GAPS.md, COMPLETE_FIX_REPORT.md, COMPLETE_FIX_DESIGN_REVIEW.md
   - PS_FIT.md, STAGE_CHECKLIST.md
   - GLOBAL_JURY_REPORT.md, PS_FEATURES_REPORT.md, JURY_PAGE_AUDIT_26OCT.md
5. Docs: JUDGE_SCRIPT, JUDGE_QA, AI_METHODS, LIMITATIONS, JURY_DEMO_GUIDE, PILOT_PLAN, SECURITY_REVIEW, screenshots/README.

AUDIT RULES
- Check, don't trust. For every claim you score, find the code that does it and the test or screen that proves it. A test that passes but does not really check the behaviour it is named after counts as NOT PROVEN. Say why.
- Severity for every defect:
  - CRITICAL: breaks the judge demo, leaks private data or claims something false.
  - HIGH: a promised feature is missing or broken.
  - MEDIUM: works but a judge would mark it down.
  - LOW: polish.
- Never mark a defect fixed, never edit a file to make a check pass, and never weaken a check to get a better score.
- Scores are your honest judgement, with reasons. No score above 9 without evidence that a strict jury would accept.

SCOPE: audit these ten areas in order

A. TESTS AND TRACEABILITY
- Run the full test sequence above. Record totals, failures, skips and duration.
- Run trace-check and record its output.
- Pick 20 DONE rows at random from FEATURES.md, including at least 5 from N81–N95. For each, open the named test and confirm it really checks what the row promises.

B. THE 217 ROWS THAT WERE BLOCKED-SOURCE
- COMPLETE-FIX marked most F, E, R, T, X and D rows as COVERED by existing features and tests.
- Verify a sample: 10 F rows, 5 R rows, and every T, X and D row it marked COVERED.
- For each, quote the exact definition from docs/SOURCE_23OCT_FERTXD.md, then name the code and test. If the test does not check that definition, mark it NOT PROVEN.
- Report the true COVERED rate.

C. THE PRODUCT OWNER'S ASKS (check each by actually using it in the browser)
1. College-name auto-fetch:
   - On the grievance form, the registration and lookup page, SYNC and the header search, type part of a college name, a city, a PID and an ICID.
   - The PID, ICID, ICID check, region, state, district and type must fill in by themselves.
   - The duplicate manual PID box must be gone.
   - A mismatched PID and ICID must go to identity review.
2. ABC ID and APAAR ID verification:
   - Try every seeded outcome: verified, not enrolled, inactive, mismatched college and manual review.
   - Try a badly formatted ID on both client and server (send the request directly).
   - Confirm a visible "simulated" label, that no real government system is called (check the code for any network call), and that IDs are stored only encrypted in the vault.
3. Regional routing:
   - File cases for colleges in each of the six regions. Each must be forwarded to that region's Regional Grievance Cell, with the reason (region from PID or ICID) saved on the routing decision.
   - A college with no ICID must route by its PID region.
   - An unknown region or an ICID in identity review must go to human triage.
   - Each regional officer must see only their region's queue.
4. Status steps:
   - Walk one case from submission to closure, and confirm the student sees each step (Submitted, Forwarded to <Region> Regional Grievance Cell, Accepted, Under process, Action taken, Resolution proposed, Closed) with date, time, office and role, and no personal names.
   - "Action taken" must appear only after an officer records an action.
   - Measure how many seconds each update takes to appear on an open tracking page without refreshing.
   - Confirm a transferred case never shows Submitted again.
5. India map:
   - Check that the map appears on the case page, Institution 360, tracking and the regional view, that the right region and state are marked, and that region counts and click-through work.
   - Compare the outline with the official Survey of India political map. Note any missing or wrong territory (Jammu and Kashmir, Ladakh, Arunachal Pradesh, the Andaman and Nicobar and Lakshadweep islands); a government jury treats this as serious.
   - Confirm it loads with no network call.
6. Saffron: confirm saffron accents appear consistently on every page, and measure the text contrast on saffron surfaces against WCAG AA.

D. EVERY PAGE FOR EVERY LOGIN
- Build the route inventory from the real route definitions.
- For each of the nine demo logins, open every page that role can use, at desktop 1366×768 and mobile 390 px. Save each screenshot under docs/screenshots/full-audit/pages/<role>/.
- Score each page out of 10 on six things:
  - complete content
  - alignment and spacing
  - no unwanted gaps
  - visual identity (not a copy of another page, saffron accents)
  - clarity (no raw codes, "null", "undefined", bare 0 for unknown, raw JSON or developer wording)
  - working controls (every button, link and form works for that role)
- Also check:
  - sidebar items that lead to Access Denied
  - console errors
  - time until content appears (three-second limit)
  - horizontal scroll on mobile
- Compare with the scores in COMPLETE_FIX_DESIGN_REVIEW.md and JURY_PAGE_AUDIT_26OCT.md, and list every page that scores below 8.

E. CORE PRODUCT LOGIC
Run the judge story end to end on the isolated database and confirm each of these:
- Verified reporter and pseudonymous ID
- PREVENT Stage 1 hint with no third-party content
- Explainable routing
- PREVENT Stage 2 cross-bureau warning
- TRACE transfer with the sender accountable until acceptance
- Closure blocked until evidence and a different approver
- QR receipt
- Feedback and appeal
- RESCUE alert on a near-due or overdue case
- IMPACT numbers with numerator and denominator, and drill-down to exact cases
- Audit chain intact

F. SECURITY AND PRIVACY
- Use each role to try to read another complainant's case, another region's queue, another bureau's internal notes, identity data and restricted documents, through both the UI and direct API calls.
- Confirm that npm audit reports zero high or critical issues, that no complaint text or identity appears in logs or screenshots, and that production mode refuses DEMO rules and requires a session secret.

G. SPEED AND EFFICIENCY
- Measure first content time for the command centre, IMPACT, case page, regional view and tracking page as a cold start and then warm.
- Measure the duplicate check time with the AI model as configured.
- Record the client bundle size.
- If server/scripts/load-test.mjs exists, run it at 50000 and record the numbers.

H. AI CLAIMS
- Read AI_METHODS.md and the benchmark results, and re-run the benchmark if it takes under 15 minutes.
- Confirm every AI claim in JUDGE_SCRIPT.md and JUDGE_QA.md matches a measured number.

I. DOCUMENTS
- Check that STATUS, LIMITATIONS, JUDGE_SCRIPT, JUDGE_QA, AI_METHODS, JURY_DEMO_GUIDE, STAGE_CHECKLIST and screenshots/README all give the same test count, rehearsal status, feature list and AI description, and that every number matches what you measured.
- Time the judge script against the 5-minute limit.

J. PROBLEM-STATEMENT FIT AND JURY SCORE
- Map every requirement of PS 26264 and every AICTE manager expectation in SPEC Appendix V to the screen and test that proves it, and rate the fit out of 10.
- Then score the project as an SIH finale jury out of 100 using these weights:
  - fit to the problem statement 20%
  - novelty versus existing portals such as CPGRAMS and the AICTE e-grievance portal 20%
  - depth of the build 15%
  - demo readiness 15%
  - UX and presentation 10%
  - security and privacy 10%
  - scalability and efficiency 5%
  - feasibility of rollout 5%
  Give each score with its reasons and evidence.

STEPS
Step 1. Run the workspace checks and paste their output. Wait for my yes.
Step 2. Read the context. Write an audit PLAN in plans/FULL_AUDIT.md: the order of checks, the route inventory, which checks run on the isolated database, and roughly how long each area will take. Then STOP and wait for my approval.
Step 3. After approval, audit areas A to J in order. After each area, append its findings to plans/FULL_AUDIT.md with evidence paths.
Step 4. Write the reports.

FINAL REPORT (print a summary here AND save the full report to plans/FULL_AUDIT_REPORT.md)
- The jury score out of 100, with the eight criteria, reasons and evidence
- Problem-statement fit out of 10, with the mapping table
- The product owner's six asks: each PASS, PARTIAL or FAIL, with screenshots
- The page table: every page for every role, desktop and mobile, its score, and its problems
- True test totals and the trace-check output
- The true COVERED rate for the former BLOCKED-SOURCE rows
- Security and privacy results, speed numbers, and AI claims checked
- Document mismatches
- Strengths a jury will reward, weaknesses a jury will find, and the ten questions a jury is most likely to ask, each with the best honest answer

Also save plans/FULL_AUDIT_FIX_LIST.md: every defect, ranked by severity and then by how many jury points fixing it would gain. Give each one a file and line where possible, and a one-line description of the fix. Write it so another agent can work through it without re-auditing.

DONE WHEN
Every one of areas A to J has been checked with evidence; every page for every login has a saved desktop and mobile screenshot and a score; the score, fit rating and fix list are saved; no code, test, seed or non-audit document was changed; and no git command was run.
