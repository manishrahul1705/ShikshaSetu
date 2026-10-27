You are running as Codex, locally on my laptop, in the nexus-ic folder. Follow AGENTS.md except where this prompt overrides it. This is the FINAL POLISH phase for the SIH grand-finale presentation of AWAAZ DASTAK (powered by NEXUS-IC), AICTE Problem Statement 26264. Write your plan to plans/FINAL_POLISH.md first, then continue without waiting, except where this prompt says ASK MANISH.
LOCAL RUN, NO GIT: do not run any git command.

OVERRIDE FROM MANISH: override rule 5 for on-screen labels. The product must look like a finished, production-ready system. No screen may show the words "synthetic", "demo", "fake", "sample", "test data" or "SYNTHETIC DATA". The honest statement that the prototype runs on sample data moves to the documents (README, docs/LIMITATIONS.md, docs/JUDGE_SCRIPT.md) and the presenter's spoken script. Everything else in AGENTS.md still applies (no real personal data, no real AICTE/CPGRAMS/ABC/SMS calls, every change audited, DONE means proven, never weaken a test without updating it to the new rule).

ROLE
You are the release engineer making the jury say "this is a real product". Think before coding, never guess, prove every change with a passing test or a screenshot.

FIRST, READ THE CURRENT STATE
1. STATUS.md (latest sections: "Jury UI redesign" by Claude and "JURY-91" by Codex).
2. plans/UI_VERIFICATION_25OCT.md and docs/JURY_DEMO_GUIDE.md (the redesign by Claude: design system in client/tailwind.config.js and client/src/index.css, shell in client/src/components/Layout.jsx, case page /cases/:caseId, guided tour in Judge Mode, showcase database).
3. AGENTS.md, FEATURES.md, docs/SPEC.md section 3 (ICID rules), docs/ADDITIONS.md (N66, N55).
Re-read every file from disk right before editing it; Claude may be working in this folder too.

WORKSPACE AND SAFETY
- Run the full suite only when no other test run is active:
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- --maxWorkers=2 --minWorkers=1; npm run test:client; node scripts/merge-results.js; node scripts/trace-check.js
- ASK MANISH before: any npm install or download, any reset or drop of a database (awaaz_dastak_demo is the shared one; awaaz_dastak_showcase is rebuilt only by `npm run showcase:seed`). Ask once, list every package with version and size, wait for his yes.

SCOPE (in this order)

1. Remove sample-data labels from every screen.
   - Remove the SYNTHETIC DATA chip in the header (Layout.jsx), the footer text, the IMPACT label "SYNTHETIC DATA: results are synthetic until a pilot exists" (show only the scope line), "Illustrative synthetic case" on the landing card, "Synthetic trust account" display names, "Demo" badges, "(Demo Mode)" on login, the "Demo Alias for ..." aliases, and any "synthetic" word in page text, empty states and tooltips. Search: client/src for /synthetic|demo|fake|sample/i and server responses that reach the UI (label fields, display names, seed text).
   - Keep internal field names (synthetic: true in Mongo) and rule IDs such as DEMO-ROUTE-v1 in the data, but show rule IDs on screen as their version only (for example "Routing rule v1"), with the full ID in a tooltip for the audit view.
   - Rename the demo accounts' display names to realistic Indian officer titles without real people's names (for example "Regulation Bureau Officer", "Supervisor, Grievance Cell", "Competent Authority"). Keep usernames and the password unchanged.
   - Judge Mode: rename the visible page to "Guided Walkthrough"; keep the route /judge and keep it hidden in production mode.
   - Update the tests that assert these labels ([A-N66] and any [N26]/[A-N47]/[A-N46]/[N13] text checks) to the new rule: they now assert the label is absent from screens and present in the docs. Update N66 in FEATURES.md Notes: "On-screen label removed by Manish's override (date); disclosure kept in docs." Do not delete the rows.
   - Exports (CSV, receipts, N55 watermark): ASK MANISH whether exports keep a one-line footer "Prototype dataset" or none. Until he answers, keep the existing export footer.

2. Realistic institutions with an ICID for each.
   - Do not use real college names with invented grievances (that harms real institutions and is a legal risk). Generate realistic but fictional names in the Indian style (for example "Sri Venkateshwara Institute of Engineering, Nellore", "Rajarshi Shahu College of Technology, Kolhapur"), across all six AICTE regions and most states, with type (Engineering, Management, Pharmacy, Polytechnic, Architecture), approval status and campus.
   - Every institution gets an ICID in the existing format IIC-XXXXXXXX (validator /^IIC-[A-Z0-9]{8}$/) with an active mapping in institution_identifiers, except about 5% left "not available" on purpose (SPEC 3 rule 4), plus one deliberate PID/ICID disagreement that lands in the identity review queue (rule 3).
   - Put the generator in server/src/modules/registry/ so the registry simulator, the institution master and the showcase seed all use the same list (about 120 institutions). Update scripts/showcase-seed.js to use it, spread about 600 cases across the list, keep the three deliberate potential overlaps, and keep the refusal to write to any database not ending in _showcase. Complainant names, if any are shown, are fictional and never stored outside identity_vault.
   - Remove the hard-coded default PID 1-1000000001 in client/src/pages/sync/SyncPage.jsx: without a PID, show an institution picker instead.

3. College picker that fills the ICID.
   - Build one reusable component client/src/components/InstitutionPicker.jsx: type-ahead search by college name, city, state, PID or ICID; results show name, state, region, type, PID and ICID; choosing one fills PID and ICID and shows the ICID check (matches / not available / identity review).
   - Server: GET /api/v1/institutions/search?q=&state=&region= (authorize(), limit 20, indexed on name, state, pid, icid; returns no grievance data). Tests: [R32] search by name, by ICID (resolves to PID), by state; [U02] ICID alone never links institutions; [U04] missing ICID shows "not available".
   - Use the picker on: grievance intake (/grievances/new, replacing the manual PID box but keeping "Fetch Institution Details (Auto)" for typed PIDs), the registry lookup (/institutions/lookup), NEXUS SYNC without a PID, and the global search in the header (show suggestions as you type).
   - The case stores pidSnapshot and icidSnapshot at submission (touchpoint 5) exactly as today.

4. Score-raising ideas, in priority order (do 4a to 4d; write the rest into plans/FINAL_POLISH.md as proposals for Manish):
   a. One-click "Present" mode on the landing page: starts the Guided Walkthrough as a full-screen story with large type, auto-advancing captions, and a final results slide with live numbers from IMPACT (cases, average resolution days, transfers accepted within time, duplicate actions flagged).
   b. Institution 360 upgrade: a header card with name, PID, ICID check, region map pin and a 12-month case trend sparkline; the React Flow graph below it; attention indicators with reasons (never a score).
   c. Case page /cases/:caseId: add an "Explain this case" panel that lists, in plain language, why it was routed, why it was flagged as a potential overlap (the seven signals with their contributions), and what the next accountable step is. Text comes only from stored data and rule versions; no invented reasons.
   d. Hindi parity on the new screens (landing, command centre, case page, picker, walkthrough) using the existing i18n files.
   e. India map of cases by region on the command centre (SVG choropleth of the six AICTE regions, no external tiles).
   f. Mobile check: every new screen works at 390 px wide; the student flow is fully usable on a phone (PWA already exists).
   g. Performance: command centre interactive in under 2 seconds on the showcase data; show skeletons, never a blank screen.
   h. Accessibility: keyboard navigation and visible focus on the sidebar, picker and tour; axe check in the Playwright run.

5. Prove it.
   - Re-run the three Playwright rehearsals against the showcase database with the new labels and picker; save screenshots to docs/screenshots/ and update its README.
   - Full test suite green, trace-check with no violations, FEATURES.md notes updated, STATUS.md section "Final polish (Codex)" with what changed and the test counts.
   - Report back to Manish: what changed, screenshots of the landing, command centre, case page and picker, and any question still open.
