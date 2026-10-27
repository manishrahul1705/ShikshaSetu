# Final audit report (prompts/FINAL_AUDIT.md)

Auditor: Claude, 25 Oct 2026. Check-only: no code was written for this audit.

**Independence note:** PARALLEL_PLAN.md gives FINAL_AUDIT to Codex as "a fresh pair of eyes". I built S5, S6b and S7, so this audit is not independent for those stages. A second audit by Codex is still worth running.

## 1. Commands

- `npm run reset`: **not run.** It drops `awaaz_dastak_demo`, which a dev server started by another tool is using right now, and S3's `seedS3Fixtures()` fails on a fresh database, so the reset would stop part-way. Needs Manish's go-ahead.
- `npm test` (final run, server with `--maxWorkers=2`; full 8-worker runs time out against the local MongoDB): **258 tests, 255 passed, 3 failed, 0 skipped.** Server 200/201 (`[JUDGE]` fails). Client 55/57 (two S6a `[N15]` PWA tests). Details in plans/S7_REPORT.md.
- `node scripts/trace-check.js`: **No violations.** DONE 119, IN-PROGRESS 4, GAP 4, BLOCKED-SOURCE 217, PLANNED-P2 2, NOT-ADOPTED 3, TODO 0.

## 2. SPEC 1–18, Appendix V and ADDITIONS, by section

Grouped by requirement. The sentence-to-file mapping for each ID is in FEATURES.md ("Built in", "Proved by"); only the findings are expanded here.

| Section | Requirement | Where | Finding |
|---|---|---|---|
| 3 ICID (12 touchpoints) | N09, U01–U04 | registry, institutions, cases | Touchpoint 10 (institution-wise report with an ICID column when permitted) is **MISSING** from IMPACT's institution rows |
| 4 Journey and boundary | Six stages, product boundary | whole app | OK |
| 5 Verified users, privacy | N01–N08, S04–S07, S14, S15 | identity, consent, vault | OK. Demo OTP is printed to the console log with the pseudonymous ID (demo mode only, local sink as SPEC 5.2 allows) |
| 6 Institution, regions, 360 | N10–N12 | registry, institutions | OK on data. Appendix V's "Fetch Institution Details (Auto)" checklist and the "REGION-WISE CLASSIFICATION" panel with six region chips are **MISSING** from the UI |
| 7 Intake, Master Case ID, channels, PREVENT 1 | N13–N16 | intake, cases, channels, prevent | N15 IN-PROGRESS (S6a). Two N15 client tests fail |
| 8 ROUTE, priority, overlap, PREVENT 2 | N17–N19, 8.3 banner | routing, priority, prevent | **Wrong:** `priorityService.js` falls back to invented SLA days (30/20, 15/10, 7/4) when no approved SLA rule exists, instead of POLICY_NOT_CONFIGURED (SPEC 11, Rule 2). `routingEngine.js` falls back to a 0.70 confidence threshold, PGRC as primary and the label DEMO-ROUTE-v1 when no rule exists. The "Routing Decision (Explainable)" box label is missing from the UI. `TriageQueue.jsx` shows a missing confidence as 0.5 |
| 9.1 Lifecycle and complainant status | N28 | lifecycle, track | OK. The Layer 7 warning box "Transferred cases must NEVER revert to Submitted status." is not shown in the UI |
| 9.2 NEXUS TRACE | N20, U20–U22 | trace | **Wrong:** `POST /api/v1/transfers` fails over HTTP (senderOfficerId: the service reads `user._id`, the session has `id`). `hasOpenTransfers()` is missing the `mongoose` import. `seedS3Fixtures()` fails on a fresh database. Unit tests pass because they pass User documents |
| 9.3 SYNC 2.0 | N21, N75 | sync | OK |
| 10.1 PROOF | N22, N23, N76 | closure, feedback | OK |
| 10.2 RESCUE | N24, F43 | rescue | OK; "task overdue twice" is my reading (flagged) |
| 10.3 Appeals | N25 | appeals | OK; APPEAL not seeded, so POLICY_NOT_CONFIGURED as SPEC 11 says |
| 10.4 IMPACT | N26, N77, E09 | impact | OK; PDF export needs PDF 4.9 (BLOCKED-SOURCE) |
| 11 RuleBook | N27, N78, U29 | rulebook | OK in the RuleBook itself; see the section 8 fallbacks, which bypass "missing approved rule gives POLICY_NOT_CONFIGURED". Insider thresholds also fall back to hard-coded values (`insiderService.js`) |
| 12.1 Workspaces | routes table | client routes | **MISSING:** officer dashboard ("My cases, tasks, SLA, actions"; `/dashboard` still shows the S0 placeholder text), regional view, `/cases` bureau queue, `/reports`, `/audit` audit-trail page, notification centre. Present: `/institutions/:id`, `/sync`, `/authority`, `/track/:caseId`, `/review`, `/impact` |
| 12.2 Governance | Authority workspace | authority | OK after the S7 abac.js fix (S19) |
| 12.3 Role matrix | N29, N30, S21, S22 | track, institutionview | OK |
| 12.4 Outputs | design outputs | — | Appendix V "KEY OUTCOMES" and "Manager Expectations Implemented" lists are not shown anywhere |
| 13 Security | S01–S30 | various | S08 and S13 GAP (deployment review, no audit run). Negative-role sweep clean after the fix |
| 14 Architecture | stack | — | No TypeScript. React Flow and Recharts are not installed; the graph and radar are plain SVG |
| 15 Data model, APIs | collections, routes | — | All 15.1 collections exist. All 15.2 routes exist; `POST /transfers` is broken over HTTP (above) |
| 16 Tests U01–U32 | | tests | All U rows DONE except U12 and U15 (IN-PROGRESS, other tools). T, X, D suites BLOCKED-SOURCE |
| 17 Disagreements | resolutions | — | Followed (attention indicators, human closure, PWA first) |
| 18 Definition of done | | plans/S7_REPORT.md | Two-bureau judge scenario: NO (TRACE bug). Others as reported there |
| Appendix V | display details | client | Landing page has the title, tagline and header taglines, but not the four pillars or the footer "RIGHT INSTITUTION / VERIFIED REPORTER / RIGHT BUREAU / NO LOST TRANSFERS / FASTER ACCOUNTABLE RESOLUTION / TRANSPARENT GOVERNANCE". "NEXUS TRUST", "AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)" and "New Owner Active" are present |
| Appendix W | N68–N80 | | All rows DONE |
| ADDITIONS N46–N67 | | additions | N51 and N63 GAP; N49, N53, N56 NOT-ADOPTED as approved; N57 IN-PROGRESS (S6a); others DONE |

## 3. Judge script in the browser

**Not run.** It needs a fresh demo database (Judge Mode reset or `npm run reset`), which would wipe the demo database the running dev server uses. At API level, `[JUDGE]` passes every step except the NEXUS TRACE transfer (step 3:00), three runs in a row, when the transfer is made through the service.

## 4. Forbidden-pattern search (whole repo, excluding node_modules)

| Pattern | Hits |
|---|---|
| TypeScript files, "digital twin" | none |
| Tokens in localStorage | none (only a comment saying none) |
| Complainant text or identity passed to a logger, notification or export | none found. Demo-only OTP log carries the pseudonymous `RP-` ID, not identity |
| Automatic closure, rejection or ownership change | none. Ownership changes only in routing (human-triggered decide/override) and on transfer acceptance |
| Institution score / risk score / compliance score | none (only comments saying "never") |
| Missing feed rendered as 0 | `client/src/pages/routing/TriageQueue.jsx:151` (missing confidence shown as 0.5); `client/src/additions/n66-integrity-banner/AuditChainCheck.jsx:68` (`count || 0` on an intact chain, harmless) |
| `.skip`, `.only`, commented-out tests | none |
| Hard-coded SLA days or thresholds outside the RuleBook seed | `server/src/modules/priority/priorityService.js:77-92`, `server/src/modules/routing/routingEngine.js:22`, `server/src/modules/insider/insiderService.js:18-24`. N61's `DEMO-PATTERN-v1` is labelled demo in its own defaults file |

## 5. The three lists

### (a) MISSING or wrong: must be fixed

1. S3 TRACE: HTTP transfer request broken (`traceService.js`, senderOfficerId from `user._id`); `hasOpenTransfers()` missing import; `seedS3Fixtures()` fails on a fresh DB. Blocks the judge flow and `npm run reset`.
2. S2: SLA, routing and insider fallbacks invent values when no approved rule exists; they must return POLICY_NOT_CONFIGURED.
3. S2 client: TriageQueue shows a missing confidence as 0.5.
4. SPEC 12.1 workspaces missing: officer dashboard (still the S0 placeholder), regional view, `/cases`, `/reports`, `/audit`, notification centre.
5. SPEC 3 touchpoint 10: no ICID column in the institution-wise report (S5, mine).
6. Appendix V display items missing: landing pillars and footer, "Fetch Institution Details (Auto)", region-wise panel with six chips, "Routing Decision (Explainable)", Layer 7 warning box, KEY OUTCOMES, Manager Expectations.
7. S6a client: two `[N15]` PWA tests fail on file paths.
8. Release evidence not produced: screenshots and the browser judge flow (Playwright not installed).

### (b) GAP or BLOCKED-SOURCE: accepted, listed in docs/LIMITATIONS.md

- GAP: N51 (consent purpose missing in S1a), N63 (QR package not approved), S08 (needs a deployment review), S13 (no audit run yet).
- BLOCKED-SOURCE: 217 rows (F01–F64, E01–E10, R01–R55, T01–T30, X01–X22, D01–D26, N36–N45).
- PLANNED-P2: N32, N33. NOT-ADOPTED: N49, N53, N56.
- IN-PROGRESS with other tools: N15, N57, U12, U15.

### (c) DONE

119 rows, each with a passing `[ID]` test in the final run (trace-check: no violations). Full list in FEATURES.md.

## Safe to release: NO

Items 1, 2 and 4 in list (a) are functional or rule breaches, not polish, and the definition of done's two-bureau judge scenario does not pass yet.

## Release fixes applied (25 Oct 2026, after Manish's "build and fix by yourself")

| Audit item | Fix | Proof |
|---|---|---|
| (a)1 S3 TRACE over HTTP | `trace/traceService.js`, `sync/disclosureService.js`, `sync/internalNotesService.js`, `sync/syncService.js`, `queries/queryService.js`, `fieldwork/fieldworkService.js`: session users carry `id`, so ObjectId fields now use `user._id \|\| user.id`; `mongoose` import added to traceService; `sync/seed.js` transfers, tasks, coordination and field visit now match their schemas | `[N20]`, `[N70]`, `[N21]` in server/tests/s7-release-fix.test.js; `[JUDGE]` now passes 3/3 |
| (a)2 S2 invented fallbacks | `priority/priorityService.js`: no SLA clock without an approved rule, no direct DEMO lookup in production; `routing/routingEngine.js`: no rule gives MANUAL_REVIEW with POLICY_NOT_CONFIGURED, missing threshold forces manual review; `insider/insiderService.js`: no rule, no alerts | `[N27]`, `[N18]`, `[N54]` |
| (a)3 Triage 0.5 | `routing/TriageQueue.jsx`: missing confidence shows UNKNOWN; missing bureau shows UNKNOWN | client build and tests |
| (a)4 SPEC 12.1 pages | `/dashboard` officer workspace (replaces the S0 placeholder, regional scope for regional officers), `/cases`, `/reports`, `/audit`, notification centre (`server/src/modules/workspaces/`, `client/src/pages/{workspace,reports,audit,notifications}/`, `client/src/routes/s7.jsx`) | `[N28]`, `[S09]`, `[N35]` (server), `[N28]`, `[N09]`, `[S09]` (client) |
| (a)5 ICID column | IMPACT institution rows and CSV carry ICID (active mapping) or "not available" | `[N09]` |
| (a)6 Appendix V text | Landing pillars, KEY OUTCOMES, Manager Expectations, footer (`Home.jsx`); "Fetch Institution Details (Auto)" checklist, REGION-WISE CLASSIFICATION chips, PID placeholder text, and invented "Approved (As of ...)" / "Engineering & Technology" fallbacks replaced by UNKNOWN (`InstitutionLookup.jsx`); "Routing Decision (Explainable)" box (`TriageQueue.jsx`); Layer 7 lanes and never-revert warning (officer workspace) | `[N13]`, `[N10]`, `[N28]` in client/tests/s7-ui.test.jsx |

Final run after the fixes (server `--maxWorkers=2`, then client): **273 tests, 268 passed, 5 failed.**

- `[A-N57]` and `[U15]` (S6a, Codex): anchor-match assertion and a hook timeout; both failed in earlier runs too.
- Two S6a client `[N15]` PWA tests: file-path problem in Codex's test (left to Codex, as agreed).
- `[U10]` (S1a): `connect ENOBUFS` (Windows ran out of local sockets during the run); passes when re-run on its own. Trace-check reports it as the only violation until the next full run.

Still open: (a)7 S6a tests (Codex), (a)8 screenshots and the browser judge flow (Playwright not approved), and the demo-database reset (not approved).

**Safe to release: still NO** until the S6a failures are fixed and one full run is green.

## Validation run (25 Oct 2026, 08:20–09:00Z)

Release fixes confirmed in place. Further fixes: `[U27]`/`[S27]` wait for the unique index before testing duplicates (index builds are async on a real MongoDB); `[JUDGE]` flushes queued audit appends before its reset; S6a `[A-N57]` fixtures moved off today's date (the service's own audit events use the real clock, so a fixture day equal to 25 Oct 2026 changed the recomputed fingerprint); the two S6a client `[N15]` PWA tests resolve files from the client folder (under jsdom `import.meta.url` resolved to `C:\`).

Final run: **273 tests, 270 passed, 3 failed.**

- Server `[N15]` "PWA only for an explicit standalone signal" and client `[U15]` email prefill: new regression from intake files edited at ~08:13Z today by another tool (`intakeRoutes.js` now hard-codes `channel: 'web'`; `GrievanceSubmit.jsx` / `EmailDraft.jsx` no longer prefill the email draft). Reported to the coordinator; not touched while someone is editing them.
- Client `[N17]`: 5-second timeout under load; passes in about 1 second when run alone (twice).
