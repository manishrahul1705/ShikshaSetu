You are running as Codex, locally on my laptop, in the nexus-ic folder. Follow AGENTS.md and my earlier override of rule 5 for on-screen labels (see prompts/FINAL_POLISH_CODEX_MASTER_PROMPT.md). This is the GLOBAL JURY phase for AWAAZ DASTAK (powered by NEXUS-IC), AICTE Problem Statement 26264. Write your plan to plans/GLOBAL_JURY.md first, then continue without waiting, except where this prompt says ASK MANISH.
LOCAL RUN, NO GIT: do not run any git command.

GOAL
An international hackathon jury opens any page under any login and sees a finished, credible, working government product: no empty screens, no developer wording, no obviously generated data, no broken links. Every page scores 9/10 or better against the audit in plans/JURY_PAGE_AUDIT_26OCT.md.

ROLE
You are a principal product engineer and a jury-minded designer. Before each change, ask: "What would a sceptical international juror notice in five seconds on this screen?" Fix that first. Never guess; prove each change with a passing test and a screenshot.

READ FIRST (do not skip)
1. plans/JURY_PAGE_AUDIT_26OCT.md: the page-by-page audit, with ratings and the exact problems. It is your work list.
2. STATUS.md, plans/FINAL_POLISH.md, docs/JURY_DEMO_GUIDE.md, AGENTS.md, FEATURES.md.
3. docs/SOURCE_23OCT_FERTXD.md, section "Reference demo SLA event logic" (DEMO-CASE-STANDARD-v1).
Re-read every file from disk right before you edit it, because Claude may also be working in this folder.

SAFETY
- Run the full suite only when no other test run is active:
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- --maxWorkers=2 --minWorkers=1; npm run test:client; node scripts/merge-results.js; node scripts/trace-check.js
- ASK MANISH before any npm install or download, and before any reset or drop of awaaz_dastak_demo. The showcase database is rebuilt only by `npm run showcase:seed`, which refuses any name not ending in _showcase.
- Never attach invented grievances to real, named colleges. Never invent SLA days or legal timelines beyond what the source defines. Keep every audit, authorization and privacy rule.

WORK LIST (in this order)

A. Make the data credible (it is the first thing a juror reads)
1. Replace the sequential PIDs (1-1000000001 to 1-1000000120) with well-spread, non-sequential 10-digit PIDs that still match /^1-\d{10}$/. They must be deterministic from the seed. Keep the ICID format IIC-XXXXXXXX.
2. Give every college a unique, distinct name. Never reuse one name stem across cities. Mix Engineering, Management, Pharmacy, Polytechnic and Architecture, plus district, city, establishment year, intake, a campus list (main campus plus some secondary campuses), approval status, and an approval validity date. Fill "Campus details" and "District", so no checklist line says "not available" except the deliberate ICID gaps.
3. Spread cases realistically. Vary the narratives (at least 3 phrasings per sub-category), mix languages (about 10% Hindi narratives, already supported by language tagging), and vary priorities and channels. Add about 15 appeals, about 10 reveal requests (some approved by a different officer), 6 insider-access alerts produced by the real detector, coordinations and tasks at 8 institutions, and 30 days of daily integrity fingerprints produced by the real job, not inserted.
4. Fix routing confidence for seeded cases so that only about 5% land in triage. Use the RuleBook threshold and record the real reasons.
5. Configure the source-defined SLA policy DEMO-CASE-STANDARD-v1 (14 calendar days, near-due 72 hours, approvedFor SYNTHETIC_DEMO) through the RuleBook with two-person approval. Start SLA clocks for every open case. Overdue, near-due and RESCUE alerts must then be real. Show it on screen as "Standard case policy v1 (14 days)". Find the SLA rows in FEATURES.md (search "SLA") and title the new tests with those exact IDs.
6. Update the Judge Mode scenario and the guided walkthrough so they no longer use PID 1-1000000001.
7. OPTIONAL, ASK MANISH: if he supplies an official CSV of institutions (name, PID, state, ICID from AICTE or IIC public sources), import it through /admin/import so real colleges are findable in the registry search. Real colleges get registry data only, never grievances. Do not scrape anything yourself.

B. Remove every developer or demo artefact from the screens
- Registry page: remove the "Registry availability control / Registry Online" toggle (keep the simulator offline path as a hidden admin setting), the old PID/ICID radio boxes under the picker, and the "ICID-2024-001" example. The picker plus a single "Lookup" for a typed PID is enough.
- Trust pages (/verify, /my/consents, /officer/manual-verification, /officer/reveal-requests, /admin): remove the blue developer link bar and the "Local OTP inbox" link from normal screens. Keep /dev/otp-inbox reachable only from the Guided Walkthrough when the walkthrough needs an OTP.
- RuleBook: show policies as readable cards and tables (rule, value, version, approved by, effective from). Raw JSON goes behind a "View source" toggle. Remove the "_comment … replace with AICTE policy" text from the seeded rules.
- Notifications: say "Email and SMS delivery: sandbox" in one small line, not simulator class names.
- Replace raw codes on screen with plain words and a tooltip holding the code: POLICY_NOT_CONFIGURED, UNKNOWN NO_BENCHMARK_RUN, LOW_CONFIDENCE, IDENTITY_REVIEW, REQUESTED and so on. UNKNOWN with a reason stays where data is truly missing (rule 5), but phrase it as "Not available: <reason in words>".
- Sidebar: show each link only to the roles its route allows (fix "Channels" for officers; check every link against client/src/routes/*.jsx with a test).
- "View as…" stays, but rename it "Switch role", and keep it hidden in production mode.

C. Bring every old-style page up to the new design system (client/tailwind.config.js tokens, the .card, .btn-*, .chip and .eyebrow classes, Icon, StatCard and CommandCharts patterns)
For each page: a page header (eyebrow, title, one-line purpose), KPI or StatCards where numbers exist, a real empty state (icon, one sentence, primary action), and no raw dumps. Priority order, by audit rating, lowest first:
1. Benchmark: run the real benchmark once at seed, then show accuracy, precision and recall per stratum as cards and a bar chart, with the numerator and denominator.
2. RESCUE, Appeals, Insider alerts, Reveal requests: proper queues with filters, status chips and actions; they will have data after A3 and A5.
3. Institution dashboard and /institution: an institution header (name, PID, ICID check, region), KPIs (open, closed, average days, pending clarifications), a monthly trend, and a case table with status chips.
4. Authority workspace: a decision queue (closures awaiting approval, escalations, appeals) with "approver must differ" shown on each row, instead of a wall of IDs.
5. PREVENT review: one card per potential overlap pair, with a horizontal bar per signal (seven signals, weight and contribution), counter-signals in grey, and "Advisory only" in the card footer.
6. IMPACT, Reports, Regional: responsive charts (ResponsiveContainer), no "counts" suffix on every tick, KPI cards on top, the drill-down kept, and /impact/cases without a row showing a chooser instead of "No number selected".
7. Track, Verify, My consents, Channels, Integrity (a 30-day chain calendar with a green tick per day), Admin, Leave (a list of current absences), Bureau queue (clickable case IDs, SLA chips, filters, pagination).

D. Speed and polish
- Command centre interactive in under 2 seconds on the showcase data. Profile /impact/summary and /prevent/overlaps on first load; cache or precompute at seed if needed (keep results identical).
- Every page works at 390 px wide; keyboard focus is visible; no console errors.

E. Prove it
1. Write a Playwright script e2e/page-audit.spec.js that signs in as each of the 9 roles, opens every route that role may use, and fails if:
   - the page is empty;
   - it shows "Access Denied" from a sidebar link;
   - it contains any of /synthetic|demo|fake|sample|simulator|POLICY_NOT_CONFIGURED|NO_BENCHMARK_RUN|_comment/i in visible text;
   - it logs a console error;
   - it takes over 3 seconds to show content.
   Save a screenshot per role and page to docs/screenshots/audit/ and an index page docs/screenshots/audit/README.md.
2. Re-score every screen in plans/JURY_PAGE_AUDIT_26OCT.md with a new "After" column. Any screen under 9 gets fixed or explained.
3. The full test suite is green, trace-check shows no violations, FEATURES.md notes are updated, and STATUS.md gets a "Global jury phase (Codex)" section with the test counts.
4. Report to Manish: before/after scores, screenshots of the 6 most improved pages, and every open question.
