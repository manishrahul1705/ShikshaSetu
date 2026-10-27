# Latest N79 recheck — 2026-10-25

This section supersedes earlier test counts below. N79 remains DONE: all six tagged tests pass in the fresh merged results.json. Re-read Admin.jsx and S1b route definitions: the three exact /admin/master/institutions, /admin/master/categories and /admin/master/regions paths remain system_admin routes and are discovered by the Master data tab. The preceding live navigation check loaded records on all three as sysadmin1; no master-data kind is missing.

Requested root npm test with TEST_MONGODB_URI=mongodb://127.0.0.1:27017: 100 passed, 19 failed, 0 skipped (119 server tests), exit 1, before client/merge. The first restricted-access attempt stalled in database setup and was interrupted; the completed retry used direct local access and reached MongoDB. Separate client recheck: 33 passed, 1 failed, 0 skipped (34 tests). Explicit merge-results generated fresh results.json: 133 passed, 20 failed, 0 skipped (153 total), success=false. This is not an all-green root run. N79 is green independently.

No source/tests were edited in this repeat check. Updated only N79 Notes, this report and generated verification logs/results. No new phase work or git commands.

Latest failure inventory (reported without changing other phases):

- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-bureaus.test.js: S2: Bureaus and Cells Operational Units (N73) [N73] bureaus and cells seeded as configurable units with officers
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-import.test.js: S2: External Imports & Idempotent Commit Engine (F15, F49) [F15] import preview and dry-run validate externalRefs
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-import.test.js: S2: External Imports & Idempotent Commit Engine (F15, F49) [F49] import idempotent commit rejects duplicate externalRef
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-lifecycle.test.js: S2: Case Lifecycle & Complainant Transparency (N28) [N28] nine statuses and F09 mapping; transferred case never reverts
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-priority.test.js: S2: Risk, Priority & Sensitivity (N19, U18, U19) [N19] priority has visible reason and never score; sensitivity works locally
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-priority.test.js: S2: Risk, Priority & Sensitivity (N19, U18, U19) [U18] sensitive category is flagged, human-confirmed, and restricted
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-priority.test.js: S2: Risk, Priority & Sensitivity (N19, U18, U19) [U19] priority change alters clock via active rule version non-retroactively
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-routing.test.js: S2: NEXUS ROUTE & Jurisdiction Routing (N18, U16, U17, F48, F56) [N18] every decision has primary, reason and ruleVersion; immutable
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-routing.test.js: S2: NEXUS ROUTE & Jurisdiction Routing (N18, U16, U17, F48, F56) [U16] routing returns primary, secondary and reason; ambiguous to triage
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-routing.test.js: S2: NEXUS ROUTE & Jurisdiction Routing (N18, U16, U17, F48, F56) [U17] route override requires reason and records audit
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-routing.test.js: S2: NEXUS ROUTE & Jurisdiction Routing (N18, U16, U17, F48, F56) [F48] registry unavailable causes routing to flag manual review UNKNOWN
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-routing.test.js: S2: NEXUS ROUTE & Jurisdiction Routing (N18, U16, U17, F48, F56) [F56] registry down produces no zero values in routing
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-rulebook.test.js: S2: NEXUS RULEBOOK (N27, N78, N65, U29, S20) [N27] editing rule creates new version; APP_MODE=production cannot select DEMO-*
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-rulebook.test.js: S2: NEXUS RULEBOOK (N27, N78, N65, U29, S20) [N78] overlap detection and closure requirements families loaded
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-rulebook.test.js: S2: NEXUS RULEBOOK (N27, N78, N65, U29, S20) [A-N65] what-if preview lists affected open cases and changes nothing
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-rulebook.test.js: S2: NEXUS RULEBOOK (N27, N78, N65, U29, S20) [U29] rulebook edit creates version with dry-run and two-step approval
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-security.test.js: S2: Security, Separation of Duties & Operational Integrity (S20, S25, S29) [S20] requester differs from approver on sensitive approvals
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-security.test.js: S2: Security, Separation of Duties & Operational Integrity (S20, S25, S29) [S25] institution_admin cannot read confirmed sensitive case narrative/docs
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/server/tests/s2-security.test.js: S2: Security, Separation of Duties & Operational Integrity (S20, S25, S29) [S29] backup and restore into _demo; import replay creates no duplicates
- C:/Users/nethr/OneDrive/Desktop/AICTE - SIH/nexus-ic/client/tests/s2-ui.test.jsx: S2 Client UI Components renders ComplainantStatusCard with true status and accountable office only

Latest full S1 trace output (global failures retained):

```text
FEATURES.md: 349 rows, expected 349
  TODO            67
  IN-PROGRESS     2
  DONE            58
  GAP             0
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3

Stage S1: 83 IDs not DONE
  F01  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: AICTE Permanent Institute ID
  F02  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Campus hierarchy rules; ambi
  F03  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Verified aliases shown separ
  F04  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Institution 360 (extended by
  F05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F06  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F07  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F08  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F09  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Analytic status mapping PEND
  F10  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Assignment (extended by N18,
  F11  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Status (extended by N28, SPE
  F12  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Transfer (PDF 4.7; extended 
  F13  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F29  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F30  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F31  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F32  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F33  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F34  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F35  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F46  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F47  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F50  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F51  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F53  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F54  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  N15  IN-PROGRESS     Multi-channel intake
  R01  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R02  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R03  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R04  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R06  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R07  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R08  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R09  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R10  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R11  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R12  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R13  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R14  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R15  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R16  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R17  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R18  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R19  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R20  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R21  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R22  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R23  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R24  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R25  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R26  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R27  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R28  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R29  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R30  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R31  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R32  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4). Known: Global search; accepts ICID as key (SPEC 3)
  R33  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R34  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R35  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R36  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R37  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R38  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R39  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R40  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R41  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R42  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R43  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R44  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R45  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R46  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R47  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R48  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R49  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R50  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4). Known: Regional officers see only their delegated re
  R51  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R52  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R53  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R54  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R55  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  U12  IN-PROGRESS     Master Case ID is unchanged after routing, transfer and appeal

No violations.

```

---

Previous verification record:

# S1a final report — N79 verification, 2026-10-25

N79 is DONE. All six tagged N79 tests pass in the fresh merged test-results/results.json, and all three real master-data destinations work when signed in as the synthetic sysadmin1 account (system_admin). Overall verification is not green: the requested root npm test failed in S4, as detailed below. No new phase work was started.

## Scope and status

DONE: N01, N02, N03, N04, N05, N06, N07, N08, N68, N69, N79, S04, S05, S06, S07, S14, S15, S26, U05, U06, U07, U08, U09, U10. Their existing implementation paths remain in FEATURES.md. No S1a implementation ID remains IN-PROGRESS.

BLOCKED-SOURCE: F46, F47, F50, F51, F53, F54 remain unchanged. Only the independently sourced nearby SPEC controls S04, S05, S06, S07, S14, S15 and S26 were implemented; no missing F-feature content was invented.

## Live administrator check

Logged in through the running local app as sysadmin1 and confirmed Dashboard (system_admin). Opened /admin, selected Master data, and followed each displayed link:

| Link | Actual destination | Loaded result |
|---|---|---|
| Institutions | /admin/master/institutions | Master Data: Institutions Registry, synthetic institution row and Edit control |
| Categories | /admin/master/categories | Master Data: Grievance Categories, ten categories, subcategories, sensitive flags and versioned-update form |
| Regions | /admin/master/regions | Master Data: AICTE Six-Region Classification, six region records with state lists and Edit controls |

Missing kinds: none. Each destination loaded its records rather than an access-denied or failed-feed screen. This was a read-only navigation check; no registry changes were submitted.

## Changes in this follow-up

- client/tests/s1a-trust.test.jsx: require the three actual S1b routes; follow their real elements through ProtectedRoute as system_admin and verify fetched data renders; deny all three to a student. Keep populated and empty glob-module tests, including the placeholder branch.
- FEATURES.md: update only N79 status and Notes. Production Admin discovery already links all three; no production change was needed.
- plans/S1a_REPORT.md: replace stale missing-page claims with this final evidence.
- Own diagnostic logs: plans/S1a_N79_RECHECK.log, plans/S1a_N79_CLIENT_RECHECK.log, plans/S1a_N79_TRACE.log. Test-result JSON files are generated outputs.

No S0, S1b, S2, S4 source/tests, dependencies, shared route registry or test setup was edited. No git command was run.

## Test results and limits

Ran the requested root command once with TEST_MONGODB_URI=mongodb://127.0.0.1:27017. MongoDB connected successfully. Server run began 2026-10-24 23:55:28 local time: 99 tests, 87 passed, 12 failed, none skipped; npm test exited 1 before its client/merge steps.

Then ran npm run test:client to verify the new N79 checks: 31 passed, 0 failed, 0 skipped (start 2026-10-25 00:01:30 local time). Ran the existing merge-results script explicitly so results.json contains both fresh runs and retains success=false: 130 tests, 118 passed, 12 failed, 0 skipped. This combined evidence is not a successful root npm test.

All six N79 results are passed:

- [N79] system admin manages roles, sees denominated metrics and runs an audited BackupSimulator
- [N79] master data links match every eligible S1b route and rules remain in RuleBook
- [N79] system_admin follows all three actual master links through protected routes and loads their data
- [N79] a student cannot open any of the three protected master-data pages
- [N79] populated glob result renders all authorized master links and excludes other routes
- [N79] empty glob result preserves the master-data placeholder

The 12 failures are confined to server/tests/s4-api.test.js (seven) and server/tests/s4-matcher.test.js (five), tagged N16, N17, S23 and U14. Several responses report UNKNOWN / RULEBOOK_UNAVAILABLE instead of the expected configured-policy behavior; missing match fields then fail dependent assertions. This is observed failure evidence, not a completed root-cause diagnosis. S1b tests and S1a tests pass. No tests were skipped, removed or weakened; these failures remain unresolved in this N79-only follow-up.

Failing test inventory:

- tests/s4-api.test.js: [S23] a third-party match reveals only the generic notice in JSON and persisted hints
- tests/s4-api.test.js: [U14] own earlier cases explain similarity and continue, view and cancel choices are logged
- tests/s4-api.test.js: [N16] similar and genuinely different drafts both submit independently of PREVENT advice
- tests/s4-api.test.js: [N17] repeated document request, cross-bureau overlap and opposing instructions give advisory REVIEW
- tests/s4-api.test.js: [N17] missing and stale feeds give UNKNOWN, a clean fresh feed CLEAR, and every result permits proceeding
- tests/s4-api.test.js: [N17] production action check is UNKNOWN and its Proceed endpoint still works
- tests/s4-api.test.js: [N17] overlap and alert responses expose accessible cases only and count restricted entries
- tests/s4-matcher.test.js: [N16] seven weights are exact and every signal explains its contribution
- tests/s4-matcher.test.js: [N16] different PIDs never match and an ICID conflict forces REVIEW
- tests/s4-matcher.test.js: [N16] Hindi and Tamil semantic evidence is local with all network calls forbidden
- tests/s4-matcher.test.js: [N17] production without approved RuleBook policy is UNKNOWN, never a DEMO rule
- tests/s4-matcher.test.js: [N17] default app mode uses the same demo default as S0 configuration

## Contracts and existing limitations

S1a exports getReporterId(userId), isVerified(userId), recordFraudSignal(reporterId, type, meta), toOfficerView and the reveal-scope integration from server/src/modules/identity/index.js, documented in its README. Case integrations use pseudonymous RP identifiers. Fraud metadata is discarded to avoid storing identity or narrative. Eligibility remains policy-dependent rather than inventing criteria. Rules are managed in RuleBook. BackupSimulator is an audited demonstration, not a recoverable backup.

## Trace check

Ran node scripts/trace-check.js --stage S1 after updating N79. There is no N79 or other S1a-owned violation. Four global violations remain for the failing S4 tags N16, N17, S23 and U14; overall trace verification is not green. Full output follows:

```text
FEATURES.md: 349 rows, expected 349
  TODO            67
  IN-PROGRESS     2
  DONE            58
  GAP             0
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3

Stage S1: 83 IDs not DONE
  F01  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: AICTE Permanent Institute ID
  F02  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Campus hierarchy rules; ambi
  F03  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Verified aliases shown separ
  F04  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Institution 360 (extended by
  F05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F06  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F07  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F08  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F09  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Analytic status mapping PEND
  F10  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Assignment (extended by N18,
  F11  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Status (extended by N28, SPE
  F12  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Transfer (PDF 4.7; extended 
  F13  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F29  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F30  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F31  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F32  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F33  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F34  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F35  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F46  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F47  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F50  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F51  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F53  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F54  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  N15  IN-PROGRESS     Multi-channel intake
  R01  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R02  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R03  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R04  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R06  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R07  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R08  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R09  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R10  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R11  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R12  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R13  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R14  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R15  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R16  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R17  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R18  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R19  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R20  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R21  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R22  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R23  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R24  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R25  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R26  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R27  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R28  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R29  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R30  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R31  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R32  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4). Known: Global search; accepts ICID as key (SPEC 3)
  R33  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R34  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R35  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R36  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R37  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R38  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R39  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R40  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R41  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R42  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R43  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R44  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R45  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R46  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R47  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R48  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R49  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R50  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4). Known: Regional officers see only their delegated re
  R51  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R52  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R53  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R54  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R55  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  U12  IN-PROGRESS     Master Case ID is unchanged after routing, transfer and appeal

4 violation(s):
  ✗ N16: test "[N16]" failed
  ✗ N17: test "[N17]" failed
  ✗ S23: test "[S23]" failed
  ✗ U14: test "[U14]" failed

```
