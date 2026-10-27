# S5 report: Closure and recovery (built by Claude)

Status on 25 Oct 2026: built and tested on an isolated in-memory MongoDB. **The full `npm test` run has not happened yet** (waiting for a slot when Antigravity and Codex are not running tests, so result files are not overwritten). Until that run, every row that would be DONE is marked IN-PROGRESS in FEATURES.md, as Rule 3 requires.

## Test evidence so far

Run with `npx vitest run tests/s5-*.test.js` (server) and `npx vitest run tests/s5-ui.test.jsx` (client), using mongodb-memory-server and the default reporter only, so no shared database or `test-results/` file was touched.

| File | Tests | Result |
|---|---|---|
| server/tests/s5-closure.test.js | [N22] [U24] [U25] [N76] [F26] | 5 passed |
| server/tests/s5-feedback-appeals.test.js | [N23] [U26] [N25] [U28] | 4 passed |
| server/tests/s5-rescue.test.js | [U27] [N24] [F43] | 3 passed |
| server/tests/s5-impact.test.js | [N26] [N77] [U30] [A-N55] | 4 passed |
| server/tests/s5-workspaces.test.js | [N29] [U31] [A-N63] [N30] [N71] [A-N62] [S22] [U32] [S19] [N80] | 10 passed |
| server/tests/s5-notices.test.js | [N35] [S27] [A-N51] [F52] | 4 passed |
| client/tests/s5-ui.test.jsx | [N29] [N22] [N77] [N30] [N80] [A-N62] | 6 passed |

Not yet run: the earlier stages' suites with S5's plugins loaded. S5 adds two Case plugins (closure gate, status notices) and two User plugins, so that run is the real check that nothing earlier broke.

`node scripts/trace-check.js --stage S5` after the FEATURES.md update: no S5 violations. One violation exists that is not S5's: `N20: no run result for "[N20]"` (S3 marked N20 DONE before a results run).

## Outcome by ID

- **Ready for DONE after the full run (IN-PROGRESS now):** N22, N23, N24, N25, N26, N29, N30, N35, N55, N62, N71, N76, N77, N80, S22, S27, U24, U25, U26, U27, U28, U30, U31, U32.
- **N63 (IN-PROGRESS):** receipt works; the QR image needs the `qrcode` package. Without it the receipt shows the link and `QR code: UNKNOWN (QR_LIBRARY_NOT_INSTALLED)`.
- **GAP:**
  - S19: the `/authority` workspace and the N62 tool never give the Authority the narrative, but `server/src/middleware/abac.js` `applyFieldPolicy` returns the raw case to competent_authority, so `GET /api/v1/cases/:id` still shows it. Needs an edit to that S0/S1b file.
  - N51: S1a's consent ledger has no `retaliation_watch` purpose and its simulators have no re-check by reporter, so the live watch finds no consent. Engine built and tested with injected providers.
- **BLOCKED-SOURCE (built from the hint only):** F26 (closure needs action records and evidence), F43 (feed latency never counted as officer delay), F52 (consent withdrawal stops the watch; retention POLICY_NOT_CONFIGURED).
- **Anything in SPEC for S5 not fitted to an ID:** none.

## Decisions and readings to confirm

1. "A coordination task overdue twice" (SPEC 10.2) is read as: the task missed both its acknowledgement deadline and its completion deadline (the two deadlines S3 stores).
2. Appeals: APPEAL is not seeded, so appeals return POLICY_NOT_CONFIGURED until a rule is approved in the RuleBook with `{ windowDays, levels }`. A further appeal after a decision is the next level. Remanded reopens the case to Under Process. "Original resolver" covers both the proposer and the approver.
3. Closure approvers are supervisor and competent_authority. Any officer with case access proposes; close is a separate human action.
4. RESCUE runs on demand (`POST /api/v1/rescue/scan`), or on an interval only when `RESCUE_SCAN_INTERVAL_MS` is set (minimum 60 s).
5. Notices are queued for status changes on existing cases, not for case creation.
6. IMPACT reports download as CSV. PDF depends on PDF section 4.9 (BLOCKED-SOURCE).

## Found in other stages (not edited)

- S3: `hasOpenTransfers()` in `server/src/modules/trace/traceService.js` throws "mongoose is not defined". S5 counts the transfers collection directly instead (`server/src/modules/closure/s3Adapter.js`). Reported to the coordinator.
- S4's overlap banner links officers to `/track/:caseId`, which is the complainant workspace (complainant roles only, SPEC 12.1), so officers get "Access Denied" there.
- `PATCH /api/v1/cases/:id/status` could set Closed directly; the S5 Case plugin now refuses that with 409 CLOSURE_GATE_REQUIRED.

## Shared files touched (append only)

- `server/src/routes.js`: 12 mount lines at the end.
- `server/src/models/plugins.js`: 4 imports and registry entries at the end (closure gate and status notice plugins on Case; institution link and authority designation plugins on User).
- `scripts/seed.js`: one line, `seedS5()` (Authority members, institution admin link).
- `FEATURES.md`: only the 30 S5 rows (Status, Built in, Proved by, Notes).

No S0–S4 or S6a file was edited. No git commands.

## How to see it working

Seed with `npm run seed`, start with `npm run dev`, log in with password `demo1234`:

| Who | Account | Where |
|---|---|---|
| Complainant | trust_student_verified | `/track`, `/track/<Master Case ID>` (feedback, appeal, receipt) |
| Officer | rb_officer1 | `/closure/<Master Case ID>` (propose, attach evidence), `/cases/<id>/redaction` |
| Supervisor | supervisor1 | `/closure/<id>` (approve, close), `/rescue`, `/review/appeals`, `/impact` |
| Competent Authority | authority1, authority_chair1, authority_ms1 | `/authority`, `/review/appeals` |
| Institution admin | inst_admin1 (linked to the first seeded institution) | `/institution` |

PROOF demo: officer records an action on a case (S3 actions), proposes closure with a reason and an evidence document; the gate shows what is missing; supervisor approves; any officer closes once all four checks pass.

## Suggested commit message

"stage S5: NEXUS PROOF closure gate, feedback, appeals, RESCUE, IMPACT, complainant/institution/authority workspaces, status notices, N51/N55/N62/N63"
