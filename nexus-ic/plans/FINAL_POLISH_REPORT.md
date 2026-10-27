# FINAL POLISH — 26 October 2026

## Verified implementation

- Preserved Claude's design system and shell. Removed data-disclosure labels from interface copy and formatted policy versions without changing stored rule IDs. Account display titles use roles; credentials are unchanged. The visible tour is Guided Walkthrough, with its existing production restriction.
- Kept explicit prototype/sample-data/simulator disclosure in README, LIMITATIONS and the mandatory spoken judge script. Removed the export data-disclosure footer by Manish's approval; retained N55 office/role/time attribution and invisible trace codes.
- Added the approved Institution schema-plugin hook. The owned registry plugin adds city, ICID and search-token fields/indexes. One reproducible fictional catalogue supplies 120 institutions, six regions, 30 state/UT values and five institution types: 114 active valid ICIDs and six intentionally unavailable. One reported disagreement is queued without corrupting or resolving its master mapping.
- Added authorized public-metadata search, limited to 20 results. It accepts name, city, state, PID and ICID; ICID resolves to PID and never links institutions. Tests cover authorization, filters, bounded results, malformed input, response-field allowlisting, idempotent seeding and missing ICID.
- Added the reusable keyboard-accessible institution picker to intake, registry lookup, SYNC and header search. Typed-PID auto-fetch remains. Selection fills PID/ICID and retains its visible check result. SYNC without a PID makes no default-institution request. Backend snapshot rules and original complaint text remain unchanged.
- Added the landing Present story, English/Hindi captions and a live IMPACT final slide. Average uses the recorded mean, never the median. Accepted-within-time uses recorded acknowledgements and deadlines; unavailable measurements remain UNKNOWN. No flagged action is claimed as avoided.
- Added Institution 360's identifier/check header, region pin and twelve-month trend from the metadata returned for that view, alongside the real React Flow graph and reason-based attention indicators. Restricted records are excluded from the trend and disclosed.
- Added Explain this case: stored routing reasons, the real seven-signal comparison and recorded transfer accountability. Current comparisons are explicitly distinguished from historical decisions; missing next-action records remain UNKNOWN. Added translation bundles for the new controls and presentation copy.
- The guarded showcase script generated 600 cases across all 120 institutions, with three deliberate repeated matters plus the existing walkthrough fixtures. It uses verified reporter contracts, real routing/priority engines and the existing transfer RuleBook window. Historical Closed states without evidence do not receive fabricated PROOF packets or enter PROOF resolution-time measurements.

## Test evidence

Full server: **227/227**, 38 files. Final full client: **80/80**, 20 files, including the picker and audit-rule-label regressions. Merged `test-results/results.json`: **307/307**, zero failed or skipped. Trace-check: **No violations**, 349 rows; 125 DONE, 2 GAP, 217 BLOCKED-SOURCE, 2 PLANNED-P2, 3 NOT-ADOPTED. N63 now has a real QR SVG, authenticated tracking link and passing cross-reporter/anonymous denial checks. N79 retains all three actual master-data pages and passing role checks.

The prescribed old `--minWorkers` option is no longer supported by the approved Vitest 4 upgrade. The server command uses `--maxWorkers=2`; the unchanged S0 setup uses `TEST_MONGODB_URI=mongodb://127.0.0.1:27017`. Client workers are bounded to two to avoid the default worker-pool failure on this laptop. No timeout was increased and no assertion was skipped. Manish approved S3 U20's clock-only correction: freeze Date at its existing Friday timestamp and restore it afterwards, preserving all assertions.

Approved security upgrades are installed. Fresh npm audit: **0 vulnerabilities** at every severity. Production client build passes; its large-chunk warning remains. This is not a performance claim. ZAP was not approved and was not installed or run.

## Browser evidence — complete

Three consecutive full showcase rehearsals passed: **3 passed, zero failed, skipped, flaky or retried**, 477.8 seconds total. Chrome **155.0.8059.85**, fresh profiles, local API/client 4317/5317, database **awaaz_dastak_showcase**. Completed 26 October at **10:53:44, 10:56:24 and 10:59:03 IST**, with cases NX-2026-000008/000009/000010. Each has 25 numbered step screenshots and a saved video. Exact manifests/video paths and enumerated captures are in `docs/screenshots/final-polish/evidence-summary.json`; runner output is `plans/final-polish-browser.log`, machine results are `docs/screenshots/browser-results.json`.

The sequence verifies the real picker, snapshot preservation, Hindi intake, PREVENT preview/edit/confirmation, seven-signal explanation, Institution 360 graph, officer review, requested/accepted transfer, blocked closure then evidence-backed different-person approval, own-case tracking, downloaded QR receipt, feedback, authority, IMPACT drill-down, live Present results, audit chain and integrity. Every numbered capture checks removed labels are absent. The browser exposed the picker status-clearing bug and the audit target's visible rule ID; both now have passing regressions. Tracking waits for the actual API response before its unchanged Closed assertion.

Landing, command centre, case and clean public-metadata picker screenshots in `docs/screenshots/final-polish/` were visually inspected, along with the expanded case explanation, Institution 360 graph and live results slide. Video frames sampled at 50 seconds (run 1) and 20 seconds (runs 2/3) were inspected; sign-in/narrative inputs are hidden. Full-page captures can temporarily shrink video content and navigation can show blank frames; still screenshots are the primary visual evidence. This is sampled QA, not an every-frame privacy certification. Run 1's old folder count includes a historical QA frame; the new summary lists exactly the 25 numbered flow captures per run. Earlier debugging videos remain and are not release proof.

Downloaded Chromium 156 failed Windows activation; the successful runs use the existing Chrome version above. Transient React Flow dimension warnings occurred at mount, but the captured graph renders. A concurrent client run had two worker-startup errors; after browser completion, the unchanged complete client suite passed alone in 59.05 seconds. No tests or timeouts were weakened.

Requested stills: [landing](../docs/screenshots/final-polish/landing.png), [command centre](../docs/screenshots/final-polish/command-centre.png), [case](../docs/screenshots/final-polish/case.png), [picker](../docs/screenshots/final-polish/picker.png). The expanded [case explanation](../docs/screenshots/final-polish/case-explanation.png) shows the actual contributions and truthful UNKNOWN where no historical decision exists.

## Boundaries retained

All three approved showcase rebuilds have been used. No further reset is authorized; the browser runner performs none. The shared `awaaz_dastak_demo` database was untouched. No git command was run.

S08 (deployment review) and S13 (actual security audit) remain GAP. All 217 missing-source rows remain BLOCKED-SOURCE; R32's supplied-hint implementation is documented in Notes only. The optional downloaded semantic model remains disabled by default and unbenchmarked; no quality improvement is claimed. Items 4e–4h remain proposals in the plan, including region map, 390 px acceptance pass, sub-two-second profiling and an approved accessibility audit.
