# FINAL POLISH — 25 October 2026

Local workspace only; no git commands, copies or worktrees. Manish's latest prompt is the active phase. Preserve Claude's design system, shell, command centre, officer case journey and showcase launcher. Re-read every file immediately before each edit; do not overwrite concurrent work.

## Source and baseline

Read STATUS, UI_VERIFICATION_25OCT, JURY_DEMO_GUIDE, AGENTS, PARALLEL_PLAN, SPEC section 3 and ADDITIONS N55/N66. Keep PID authoritative, ICID corroborative, conflicts in review and missing ICID explicitly not available. Preserve all feature rows and internal IDs. R32 remains BLOCKED-SOURCE for the missing original definition; document the search built from the supplied requirements rather than inventing the remaining source.

Manish explicitly overrides Rule 5 for on-screen wording: remove synthetic/demo/fake/sample/test-data labels from screens, while retaining clear prototype/sample-data disclosure in README, LIMITATIONS and JUDGE_SCRIPT and the spoken presentation. Internal fields, simulator class names, usernames/passwords and complete rule IDs remain unchanged. Format rule versions for screens; full IDs may appear in the audit-view tooltip as specifically requested. Keep existing export footers until Manish chooses Prototype dataset or none.

Earlier JURY-91 evidence: baseline 278/278 before later changes; three isolated browser runs with 22 screenshots and video each passed before subsequent visual/model changes. Most recent focused client verification: new chart/graph/transfer checks passed, but four existing S5/S6b checks timed out; this is not a current green release. The semantic model hook was just added and has not been benchmarked. No performance improvement or model-quality claim is proven. Resolve or safely isolate unverified changes before final release evidence.

## Work order and proof

1. **Labels and disclosure (N66, A-N66, N55, A-N46, N13, N26, A-N47).** Inventory client text and UI-facing response labels; distinguish internal identifiers from rendered text. Remove header/footer chips, login badges, fixture names and aliases, empty-state/tool-tip wording. Rename display titles without using real personal names. Visible Judge Mode becomes Guided Walkthrough, route and production hiding unchanged. Update only assertions superseded by the human label override; retain privacy/security/authorization checks. Add absence-on-screen and presence-in-doc tests, and date the N66 Notes. ASK about export footer before changing exports.
2. **One fictional institution catalogue (N09–N12, U01–U04).** Read registry/master/showcase contracts. Build about 120 reproducible fictional Indian-style institutions across existing six-region mappings and most states, with types, campuses and approval status. Supply valid active IIC-XXXXXXXX mappings for about 95%, leave about 5% unavailable, and seed one deliberate PID/ICID disagreement into review. Shared catalogue feeds registry, master and showcase. Build about 600 showcase cases, preserve three deliberate overlaps and the _showcase-only guard. No real institution names with invented complaints; identities remain vault-only. Remove SYNC's default PID and use selection.
3. **Reusable institution picker (R32 hint, U02, U04, N09/N10/N13).** Authorized bounded search endpoint, limit 20, indexed lookup, no grievance or identity data. Search name/city/state/PID/ICID and filters; resolve ICID to PID before selection. Debounced, keyboard-accessible suggestions show name/state/region/type/PID/ICID, with matches/unavailable/review result. Integrate into intake (retain typed-PID fetch), registry lookup, SYNC without PID and header search. Preserve exact submission snapshots. Test name, ICID and state search; ICID-alone must never link or merge; missing ICID does not block.
4. **Presentation features, only 4a–4d.** Add one-click Present on landing, full-screen Guided Walkthrough with large captions, auto-advance controls and a final slide derived from live IMPACT. Missing average/transfer-window measures remain UNKNOWN, never inferred from a median or counts. Upgrade Institution 360 header with identifiers/check, region pin, source-derived 12-month trend, React Flow and reason-based attention indicators. Add Explain this case on Claude's /cases/:caseId: stored routing reasons, seven overlap contributions and the next recorded accountable step; do not invent causal explanations. English/Hindi parity for landing, command centre, case, picker and walkthrough.
5. **Proof and handoff.** Check no competing runner, then external MongoDB server suite with two workers, client suite, merge and trace. Repair implementation failures; never hide or weaken tests. New label assertions may change only under the explicit override. Rehearse three times on the showcase with approved seeding only; capture new-label/picker screens and masked videos. Update screenshots README, FEATURES Notes and STATUS Final polish (Codex) with exact counts and remaining gaps. Report landing, command-centre, case and picker screenshots.

## Approval ledger / boundaries

- Already approved in this session: pinned Playwright/browser/video, qrcode, Recharts/React Flow, local model/package/download; isolated awaaz_dastak_e2e_demo reset; targeted transfer-history/field-policy and priority-reason fixes; minimal semantic await hook; two new semantic translation bundles.
- Approved security upgrades are installed; the client builds with Vite 8 / Tailwind 4. A fresh npm audit reports zero advisories across all severities. ZAP was **not approved** and must not be installed or run.
- Manish approved up to three guarded rebuilds of awaaz_dastak_showcase through npm run showcase:seed. All three approved rebuilds are used; no further rebuild is authorized. The prepared data has 120 institutions and 600 generated cases, plus existing fixtures; routing/priority use the real engines and historical Closed states have no fabricated PROOF packet. The browser runner performs no resets. Shared awaaz_dastak_demo remains untouched and has no reset approval.
- Manish approved a clock-only correction to S3's U20 test: freeze Date at its existing Friday timestamp and restore afterwards; all assertions are unchanged. The corrected TRACE/channel focused run passes 12/12.
- Manish chose **remove the data-disclosure footer**. Preserve the N55 office/role/time watermark and invisible trace code. No unapproved new dependencies/downloads. No original 23 October source supplied; preserve blocked rows.

## Proposals for Manish — do not implement in this phase

4e. Region map: an SVG of the six existing AICTE regions with count drill-down and UNKNOWN handling; no external map tiles or institutional risk score.

4f. Mobile acceptance pass at 390 px: keyboard/focus, picker, student verification/intake/receipt and PWA navigation, with saved evidence and privacy masks.

4g. Command-centre performance target below two seconds on the showcase: profile first; scoped pagination, precomputation and skeletons need measured before/after evidence. Do not call existing JURY-91 performance plans completed.

4h. Accessibility review: keyboard and visible focus throughout sidebar/picker/tour, then an approved axe dependency/browser audit with findings recorded. No axe installation is assumed approved.
