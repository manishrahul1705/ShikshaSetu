# FINAL_INTERACTIVE — plan and running log (Claude)

Prompt: prompts/FINAL_INTERACTIVE_ANY_AGENT_MASTER_PROMPT.md. RULES.md wins. No git, no installs, `awaaz_dastak_demo` untouched, showcase not rebuilt without approval.
Manish approved the work in the project thread ("CONTINUE", then "the Codex, Antigravity and Copilot are not in work so continue and complete"); plan approval was waived by the coordinator brief, so work continues after this plan.

## Workspace check (05:14 and 05:16 UTC, 27 Oct)
Another tool had edited 4 files at 10:30 local (05:00 UTC) and built client/dist at 10:33. The Codex runtime process was open. I stopped and reported. Manish confirmed that the other tools are idle. No vitest or playwright was running. Manish's main dev server (5173/3000) is left alone.

## Feature IDs (next free after N96)
| ID | Title | Part |
|---|---|---|
| N97 | Smart college search: acronym, alias, short form, typo, ranked, source-badged dropdown with details card | 2 |
| N98 | Official AICTE list import screen with tolerant header mapping and dry-run preview | 2 |
| N99 | Self-service ABC ID / synthetic Aadhaar check (simulated) without officer review | 3 |
| N100 | Interactive India map: selectable states, hover counts, zoom and pan, legend, college pin | 6 |
| N101 | No empty pages: designed empty states and showcase data checks | 4 |
| N102 | Interactive tables and saffron identity (sortable/filterable tables, clickable tiles, copy IDs, skeletons) | 5 |
New rows go in FEATURES.md with Source `ADDITIONS.md` (tests `[A-N97]` …), matching how N90–N96 were added.

## Part 2 design
- **Server** `server/src/modules/registry/smartSearch.js` (new): `normalize` (NFKD, strip accents, lower case, punctuation to space), short forms expanded **in the query only** (engg→engineering, inst→institute, tech→technology, univ→university, coll→college, sch→school), `acronymsOf(name)` (initials of significant words with and without the city after the comma), and a bounded Damerau-Levenshtein distance (1 for 4–7 letters, 2 for 8 or more).
- **Ranking tiers**: 0 exact PID / ICID / acronym / alias; 1 prefix (name or any word starts with the query, with every query word matching); 2 substring (name, city, state, district, aliases); 3 close spelling. **Close spelling is used only when tiers 0–2 find nothing**, so exact searches keep their exact result counts (existing `[A-N90]` and `[R32]` tests). Bounded to 20.
- **Wiring**: `searchInstitutions` (existing `/institutions/search`) adds the smart matches after its current results, keeping the same row keys (the `[R32]` allow-list), then ranks. Official-list rows keep their existing `source` field; the client badge reads `source.label`, else "Fictional demo data".
- **Client**: `InstitutionPicker.jsx` keeps its props and URL. It adds a two-character minimum, a "No match" hint, a source badge, a details card after selection (`InstitutionDetailsCard.jsx`, new) and touch support. The intake, registration and lookup pages pass the selection to the map.
- **Import (N98)**: `parseOfficialCsv` gets an RFC-4180 quoted-field tokenizer and tolerant header aliases (permanent id / aicte id / pid; institute name / institution name / name; state; district; city / town; institution type / type / institute type; programme / program / course; icid / iic id; aliases). It reports unknown columns and never fills a missing value. New admin page `client/src/pages/admin/OfficialImport.jsx` at `/admin/registry/import` (system_admin): choose a file, enter the as-of date, dry-run preview (new, updated, rejected with reasons, unknown columns), then Confirm. **.xlsx needs a package, so I won't add one without approval**; CSV only, with steps to save the AICTE download as CSV.
- **Real colleges**: none added. Matching is proved with the synthetic stand-in "Sri Example College of Engineering" (acronym SECE) in test fixtures only. The SECE live acceptance check waits for Manish's file.
- Imported official colleges can never be the target of a demo grievance: intake refuses a PID that exists only in OfficialInstitution while demo mode is on (test).

## Part 3 design (N99)
New endpoints in the identity module: `POST /identity/self-check/lookup` and `POST /identity/self-check/confirm` (student only, consent required). An ABC ID is looked up in the existing synthetic registry; the response shows name, institution PID, programme and status, with **no number echoed back**. An Aadhaar-style number is checked locally (12 digits, Verhoeff checksum, and on the simulator's synthetic list). On confirm, the vault stores the sealed identity; the reporter record keeps only a salted hash and the last four digits. Status goes to `verified` with method `SelfServiceSimulator`. Mismatch, a repeated number on another account, or 3 failed tries → the existing `fraud()` / `manual_review` path. The existing officer-assisted path and the OTP path are unchanged. The UI label everywhere is "Simulated check, not a government verification".

## Part 4 empty pages found so far
Showcase `/regional` (Northern) has data: 147 cases, KPIs, map. `/regional/queue` does not exist (404, not a page). A full page-by-page sweep per role comes in Part 4 via the existing page-audit inventory. **A showcase rebuild needs Manish's approval: plan only, not run.**

## Part 6 map
The repo has no official outline (six hand-drawn region blobs). Per the prompt I will **not** download or draw one. I'm extending IndiaMap with an accessible state list per region, hover/focus counts, region selection, zoom/pan buttons and reset, a legend, a state-level pin with "Location shown at state level", and the visible label "Illustrative map, boundaries not official". N94 stays GAP until Manish supplies a Survey of India–compliant SVG or GeoJSON.

## Needs Manish's approval
1. Rebuilding `awaaz_dastak_showcase` (Part 4 fill).
2. An Excel (.xlsx) reader package (CSV is accepted meanwhile).
3. A Survey of India–compliant map file.
4. RULES.md Rule 8 marks `docs/` read-only, but the prompt asks for doc updates. I'm treating the prompt as your instruction to edit `docs/LIMITATIONS.md` and the jury docs. Say "no" if you'd rather I didn't.
5. The prompt says "five AICTE regions"; the repo's data and tests use six (including Central). I keep six.

## Log
- 05:21–05:43 UTC: baseline run (server 265/267, client 85/87), BASELINE_TESTS.json and BASELINE_FEATURES.txt saved.
- 05:45 UTC: fixed `[S01]` (authorize on 3 public routes), `[R32]` (picker URL), `[N02]` (faculty simulator). Focused re-runs: server 47/47, client 9/9.
- 05:55 UTC: Part 1b written to plans/FINAL_INTERACTIVE_VERIFY.md.
- 06:10 UTC, Part 2 (N97, N98): smart search, import parser and admin screen. Focused runs: server 36/36 (new and existing registry tests), client 23/23 existing plus 8/8 new.
- 06:35 UTC, Part 6 (N100): map extended; client tests pass. Checked in the showcase: "avie" finds Anvay/Arohan Vidyarekha; state-level pin caption shown; 37 state buttons.
- 06:50 UTC, Part 3 (N99): self-check server 7/7, client 2/2 (21/21 with the trust UI tests).
- 06:55 UTC: weekly usage at 88%. Stopped feature work; FEATURES rows N97–N102 added; full proof run started (namespace fi_final1); plans/NEXT_STEPS.md written.
- 06:40 UTC, final run (namespace fi_final1): server **291/291 passed**, client **97/97 passed**, 0 failed, 0 skipped (baseline was 265/267 and 85/87). trace-check: 3 violations, "N97, N98, N99: unexpected ID". scripts/trace-check.js hard-codes N01–N96 and only parses two-digit IDs, so N100–N102 are invisible to it. Fixing this means editing scripts/trace-check.js (read-only under RULES Rule 8): extend `range('N', 1, 96)` to 102 and the row regex to `[A-Z]\d{2,3}`. Waiting for Manish's approval.

## Codex continuation: 27 October 2026 — Step 2 approval plan

This section supersedes the earlier session's continuation/approval assumptions. The human confirmed that the other tools had finished and were closed. No git command, download, install, showcase rebuild or shared-demo database operation has been performed by this continuation. No application source or existing test has been edited. Work pauses for this plan's approval after the baseline diagnosis.

### Entry checks and baseline evidence

- The requested process inventory returned no matching processes before this run. Recent writes from the earlier session were reported to the human; the human confirmed that session was completed.
- Read the updated `plans/NEXT_STEPS.md`, project rules, phase handover, audits, registry/identity implementations and relevant tests, seed/runner code and PS requirement mapping. Earlier design reviews contain unsupported official-map and completeness claims; they are historical claims, not current proof.
- Fresh full sequence, in the requested order: `TEST_MONGODB_URI=mongodb://127.0.0.1:27017 TEST_DB_NAMESPACE=fi_codex_base_20261027_1 npm test --workspace=server -- --maxWorkers=2`; `npm run test:client`; `node scripts/merge-results.js`; `node scripts/trace-check.js`.
- Server: 288 passed, 3 failed, 0 skipped, 291 total. Client: 97 passed, 0 failed, 0 skipped, 97 total. Merged: 385 passed, 3 failed, 388 total. Trace-check: 6 violations, comprising unsupported N97–N99 and the N73, S28 and U20 failures. This is a failed baseline, not a release pass.
- All three server failures report `Hook timed out in 120000ms` in `beforeEach`. The unchanged failed files are being rerun separately in namespace `fi_codex_focus_20261027_1`; their results remain separate from the full baseline.
- `plans/BASELINE_TESTS.json` records every test title, full name, file, result and command. `plans/BASELINE_FEATURES.txt` records actual counts: 371 rows; 142 DONE, 5 GAP, 2 TODO, 217 BLOCKED-SOURCE, 2 PLANNED-P2, 3 NOT-ADOPTED. The full row snapshot is `test-results/fi-codex-baseline-20261027/feature-rows.json`.
- Earlier baseline files and entry `FEATURES.md` are preserved under `test-results/fi-codex-baseline-20261027/`. Full-run result copies, redacted console logs, merge output, trace output and focused diagnosis are stored there. Focused results must never replace or be represented as the full baseline.
- The old trace checker ignores N100–N102 and undercounts the ledger. Its expected-ID list stops at N96, and row, title and result matching accept only two digits. Fix all these locations without weakening checks, after the read-only-file exception below is approved.

### Feature allocation and preservation

Keep all existing IDs, titles, routes, roles, stored state, labels and tests. N97–N100 already exist and will receive defect fixes and additional tests, not replacement implementations. Finish the existing N101 and N102 rows. The next unused ID is **N103**, proposed for an additive regional-cell referral record and acknowledgements. Do not add its FEATURES row until the plan is approved. Use `[A-N101]`, `[A-N102]` and `[A-N103]` test titles. Existing defect regressions retain their relevant feature tags.

Compare the final ledger against the entry snapshot: no baseline row/title disappears or changes, and no DONE row regresses. Keep old evidence and reports as historical records; append clear current findings where a historical claim is unsupported. Never weaken existing assertions or timeouts.

### Part-by-part implementation and expected files

| Part | Work after approval | Expected files / evidence |
|---|---|---|
| 1. Baseline and verification | Finish focused timeout diagnosis; verify N90–N100 in the showcase at 5180 for allowed roles; record VERIFIED/PARTIAL/MISSING against tests and screenshots. Diagnose real defects before fixing them. | `plans/FINAL_INTERACTIVE_VERIFY.md`, `plans/FINAL_INTERACTIVE_BASELINE_FINDINGS.md`, baseline evidence directory; existing registry/identity/UI files only where a demonstrated defect requires it. |
| 2. Search and import | Verify all shared-picker entry points; fix merged-source filtering, official-only state results, duplicate PID candidates, source provenance, details loading, touch/keyboard behavior and import preview invalidation/error handling. Preserve the existing bounded public-metadata response contract. | `server/src/modules/registry/{smartSearch,search,adapters,registryRoutes}.js`, `client/src/components/{InstitutionPicker,InstitutionDetailsCard,GlobalSearch}.jsx`, `client/src/pages/institutions/InstitutionLookup.jsx`, `client/src/pages/admin/OfficialImport.jsx`, additive server/client registry tests. |
| 3. Simulated identity | Verify ABC lookup/confirmation and Aadhaar fallback beside the unchanged OTP/manual paths. Pass the selected PID to self-check, test mismatch/reuse/failure review paths and confirmation changes, keep sensitive input out of persistence and evidence, and fix OTP logger leakage without removing the dev inbox. | `server/src/modules/identity/{selfCheck,service}.js`, `server/src/config/logger.js`, `client/src/pages/trust/{Verify,SelfCheckPanel}.jsx`, additive privacy/self-check tests; approved `docs/LIMITATIONS.md` update. |
| 4. No empty pages | Inventory every reachable page for the nine audited roles plus the six named regional accounts. Build designed loading/error/empty content and isolated synthetic fixtures through actual services. Add N103 referral receipts: explicit human forwarding, cell acceptance and recorded action, with authorization, canAccessCase and audit events. Keep bureau ownership and existing case statuses unchanged. | New `server/src/modules/additions/n103-regional-referral/` and `client/src/additions/n103-regional-referral/`; append route mount/route extension as needed; `CaseJourney.jsx`, track projection/stepper only to display actual new events; additive N101/N103 tests and isolated fixture builder; the sparse-page files listed below. |
| 5. Interactivity and saffron | Extend shared optional UI primitives and apply them per page purpose: sorting/filtering, expandable rows, copy feedback, clickable metrics where a valid filtered destination exists, accessible tabs/detail drawers, skeletons and reduced-motion behavior. Use current saffron tokens and measure contrast. Preserve each page's original actions and data scope. | `client/src/components/ui/PageKit.jsx`, `client/src/index.css`, `Layout.jsx`, chart components, existing queue/report/admin/master-data/track pages and new N102 helpers/tests. Per-page touched files will be recorded in the running log and final report. |
| 6. India map | Verify current state selection/counts, zoom/pan, keyboard use and selection callbacks. Fix failure/race states, source counts and pin-location honesty. Use the existing illustrative drawing; do not manufacture geographic coordinates or call it official. | `client/src/components/IndiaMap.jsx`, details-card/lookup consumers, registry state-count endpoint, additive map tests; screenshot proof at both widths. |
| 7. PS fit | Map each R01–R55 requirement from the supplied source to exact code, feature, passing test and current screenshot. Mark Fully/Partly/Not met honestly and justify the overall rating and three largest gaps. Do not raise the earlier provisional rating without evidence. | `plans/PS_FIT.md`, supporting tests/screenshots, approved `docs/` statements that must agree. |
| 8. Proof and release | Fresh complete test sequence; baseline-title and feature-row comparisons; client build; every role/page at desktop and 390 px; three consecutive isolated judge stories; source/network/privacy audit; reconcile documents; self-review all scope lines. Freeze only if the release gates actually pass. | New isolated runner/fixture and final-interactive Playwright specs, `docs/screenshots/final-interactive/<role>/<page>-<width>.png` and `index.md`, approved jury documents, `STATUS.md`, `FEATURES.md`, `plans/FINAL_INTERACTIVE_REPORT.md`, and new `plans/STAGE_CHECKLIST.md` (currently absent). |

### Combobox, ranking and detail design

Retain the shared `InstitutionPicker` and its existing URL/props. Search after two characters, debounced with cancellation; handle arrows, Enter, Escape, mouse and touch without blur dropping a selection. Show bounded matches with name, city/state, PID, ICID or its honest missing label, and source badge. No match, network failure and loading each have explanatory content.

Retain query-only short-form expansion, accent/case/punctuation normalization, significant-word acronyms and aliases. Rank exact identifiers/acronyms first, prefix next, substring next, and bounded close spelling last. The existing implementation deliberately offers close spelling only if direct matches are absent; retain that compatibility behavior unless the human explicitly requests a change. Correct source merging and filtering without changing the field allowlist expected by existing tests. Load full optional address/programme/provenance fields through the details endpoint rather than exposing additional fields on existing fictional search rows.

Prove SECE matching with the synthetic stand-in already in test fixtures. Never place a fabricated real-college row in the catalogue. Imported official records must remain barred from demo grievance targets, including collisions with local PIDs. Selecting a result fills authoritative PID, corroborating ICID/details and the map; no ICID disagreement is auto-resolved.

### AICTE CSV layout and import design

Keep CSV-only import and the disabled live lookup stub. Existing header aliases cover permanent ID, name, state, district, city, type, programme, ICID, aliases and optional address/approval fields. Normalize header punctuation/case/BOM, report unknown headers and missing required columns, reject invalid rows with reasons, and never infer absent values. Test quoted commas/newlines, alternate layouts, duplicate header/PID cases and invalid source dates. Preserve existing default all-or-nothing behavior; the already-added explicit valid-row confirmation remains visible and audited.

Any file/date change must invalidate the prior dry-run preview. Handle read/fetch errors so the screen does not stay busy or present stale confirmation. Preview must make no writes. Confirm is system-admin-only and attributed from the session. Unknown real export ID formats are rejected visibly rather than guessed or silently coerced; request a representative header/format if the supplied file exposes a conflict.

Real SECE acceptance is **waiting on the human's official file**. Steps: obtain the official file personally; if needed save it in Excel as CSV UTF-8; sign in as `sysadmin1`; open Official list import; choose CSV and its source date; Dry run preview; inspect rejection reasons; Confirm; then check both `sece` and the full college name. Do not invent its PID or ICID, scrape, or contact official sites.

### ABC/Aadhaar data handling

Accept only local simulator records. Aadhaar-style input requires 12 digits, Verhoeff validation and simulator membership. Store only the keyed salted fingerprint/hash and last four digits; encrypt permitted identity evidence in the existing vault. Never include raw input in logs, audits, error messages, screenshots or reports. Clear visible input after lookup; do not echo the full number in confirmation. The exact simulated-verification label remains visible. Test stored collections and captured logs/audit output, not just the response.

Selected-PID mismatch, declined details, reused identity or failed-attempt limits go to existing `manual_review`; no safeguards are bypassed. A successful confirmed self-check alone grants verified status. Existing officer-assisted and OTP behavior remains available. The legacy OTP service currently logs an `otp` field, which the logger does not protect; fix this privacy defect and add regression coverage while preserving the in-memory local inbox. The baseline console log has been redacted to remove sensitive test values.

### Sparse/empty branches found so far (source inspection; runtime sweep pending)

These are observed code paths, **not a claim that every listed showcase page is currently empty**. The authorized runtime sweep must identify the exact role, route, data state and screenshot for each occurrence.

| Screen / branch | Source finding | Additive remedy and fixture source |
|---|---|---|
| Officer workspace tasks and incoming transfers | Empty arrays render blank panels; recent actions says only “None yet.” | Designed explanation and relevant existing action link; create task/transfer/action fixtures through SYNC/TRACE/action services in isolated databases. |
| PREVENT alert list | Empty list has no dedicated explanatory state. | Explain what an advisory alert means and how an officer's action check creates one; exercise PREVENT services. |
| Cross-institution pattern alerts | Loading/error/missing payload returns null. | Visible loading/error/unknown reason and retry guidance; patterns only from configured policy and actual scoped cases. |
| Overlap timeline | Minimal no-actions/no-conflicts text and rigid two-column layout. | Purpose-specific empty guidance, accessible detail, mobile stacking; service-recorded cross-bureau actions. |
| Reports trend/bureau/region/institution tables | Can render headers with no rows. | Designed no-records reason and workflow links; genuine report output over isolated cases with source evidence. |
| IMPACT charts | Empty or unavailable rows get only short text. | Explain missing source/policy, show an appropriate next step, never substitute a zero. |
| Leave/absence workspace | Current-absence list has a single-line empty message. | Explain absence and required TRACE handover; use leave/handover services in fixture. |
| CSV import review | No review rows leaves the data-health section blank. | Explain preview/quarantine and next action; real import preview/dry-run/commit fixture. |
| Admin rules tab | Displays only a short RuleBook text. | Add descriptive navigation to the existing authorized policy workflow; no fake configuration. |
| Query thread and fieldwork | Sparse case-dependent lists need correct scoped fixtures and guidance. | Select actual permitted cases; create query/reply/visit evidence through their services in isolated fixture. |
| Registry lookup/map | Empty official source and no source count can be ambiguous. | Explain import prerequisite, source availability and missing coordinates; no invented real-college data. |
| Existing appeal/RESCUE/consent/reveal/notification/integrity empty states | Designed states exist, but reachability and populated-role coverage remain unproven. | Verify each role; generate records through the matching real services in isolated fixture and test that intended data is visible. |

No rebuild or unapproved population of `awaaz_dastak_showcase` is included. List every page that remains sparse and exactly which service-produced records an approved rebuild would add. A designed empty state is not evidence of populated showcase data. If the untouched showcase remains sparse, report N101's actual gap and do not falsely mark the release complete.

### Regional receipt design (N103)

Use an addition-owned referral collection instead of changing existing ownership/status definitions. Forwarding and acceptance are explicit attributed human actions. Record case reference, authoritative institution/region, destination cell, state and actual event timestamps. Recheck `authorize(...)`, `canAccessCase` and the officer's delegated region on every read/write. A receiving officer accepts only a referral addressed to their cell. Link “action taken” only to an actual permitted officer action, not a later case status. Repeated requests must not duplicate events. Invalid identity/unknown region blocks forwarding for human review. Show the record beside existing routing/ownership history without moving a bureau's ownership, closing or rejecting a case, or inferring milestones.

### Browser proof and isolation

The existing `e2e/runtime.mjs` and `e2e/ps-runtime.mjs` hard-code the showcase database; `e2e/page-audit.spec.js` uses 5327 and rejects the simulated/policy wording required by this request. They cannot be reused unchanged as proof of this phase. Preserve existing tests; add a dedicated current-requirement audit/story with equivalent or stronger role, timing, console, overflow, privacy and data assertions. Do not weaken old assertions to obtain a green report.

Use rehearsal ports 5317/4317 and a newly named isolated database with fail-closed guards rejecting the shared demo and showcase names. Create all story records through real services. Do not run the existing showcase seed script because it drops its target database. Keep 5173/3000 untouched. Use already installed Playwright/browser assets only; no downloads and no encoder. Redact inputs, identity details, complaint text, OTP and ID numbers in saved images. Store screenshot manifests with actual role/page/viewport, duration and pass/fail; do not report old images as this phase's evidence.

### Approval gate and open decisions

1. Approve this concrete continuation plan before implementation, as Step 2 requires.
2. **Narrow Rule 8 exception required:** RULES.md says “`RULES.md`, `AGENTS.md`, `docs/`, `scripts/trace-check.js` and `prompts/` are read-only.” It also requires the human to write “override rule N” for exceptions. Request **“override rule 8” for the listed implementation/support files, trace-check and requested documentation/screenshot output**. Keep RULES.md, AGENTS.md and prompts read-only. The trace change will recognize existing/new IDs and retain every check; it will not suppress violations.
3. Showcase rebuild remains declined; do not ask again as a prerequisite for independent implementation. Report actual remaining sparse pages and the consequent release limitation.
4. Excel reader remains unapproved; continue with CSV and no package changes.
5. Official-map acceptance waits for a human-supplied Survey of India-compliant SVG/GeoJSON. Keep the illustrative label in the meantime; no substitute download or invented city coordinates.
6. Preserve the repo's existing six configured regions. Do not remove Central to match the prompt's five-region wording. Real policy changes require authoritative supplied material.
7. Real-college acceptance waits on the supplied/imported official file. No claim that the importer works on that exact file can be made before testing it.

After approval, append dated evidence after each part, run relevant unchanged regression checks, and finish the full proof sequence. Add “FROZEN FOR JURY” only after its stated gates genuinely pass. Missing official sources, sparse untouched showcase data, incomplete screenshots or any failed/skipped test must remain explicit limitations rather than invented success.

### Step 2 baseline diagnosis completed — 27 October 2026

The unchanged focused rerun finished with 16 passed, 0 failed, 0 skipped (exit 0); evidence is `test-results/fi-codex-baseline-20261027/focused-results.json` and `focused.log`. The full baseline still records its three setup-hook timeouts; it was not replaced with the focused result. A suite/file/title comparison against the earlier saved baseline found 354 earlier titles, 388 current titles and zero missing titles (`prior-title-comparison.json`). Details, including the historical N92 assertion defects and the limits of the retained seven-client-failure evidence, are in `plans/FINAL_INTERACTIVE_BASELINE_FINDINGS.md`. No application source or existing tests were changed. **STOP: awaiting approval of this plan and the narrow Rule 8 exception.**
