# S6b report: Judge Mode and differentiators (built by Claude)

Status on 25 Oct 2026: built and tested on an isolated in-memory MongoDB. **The full `npm test` has not run yet** (waiting for Manish's test slot), so N46, N47, N50 and N61 are IN-PROGRESS in FEATURES.md, not DONE (Rule 3).

## Test evidence so far

Isolated runs, default reporter, nothing written to `test-results/`:

| File | Tests | Result |
|---|---|---|
| server/tests/s6b-differentiators.test.js | [A-N47] [N47] [A-N50] [N50] [A-N61] [N61] [A-N46] [N46] [F05] [E07] [E09] | 11 passed |
| client/tests/s6b-ui.test.jsx | [A-N46] [A-N47] [A-N50] [A-N61] [E07] | 5 passed |
| server/tests/s5-impact.test.js (re-run after exporting `scopedCases`) | 4 | 4 passed |
| client/tests/s5-ui.test.jsx (re-run after adding drill links to IMPACT) | 6 | 6 passed |

`node scripts/trace-check.js --stage S6`: no violations.

## Outcome by ID

- **Ready for DONE after the full run (IN-PROGRESS now):** N46, N47, N50, N61.
- **BLOCKED-SOURCE, built from the hint or roadmap evidence:** E07 (attention radar, counts not a score), E09 (safeguards checked across IMPACT, N47, N61), F05 (institution graph as roadmap "Graph" evidence, a view of Institution 360 data only).
- **BLOCKED-SOURCE, nothing built (no text, no hint):** F06, F28, F36, F37, F38, E03, E04, E08, E10. E05's hint only says "related to RESCUE", which is N24 in S5.
- **Skipped, owned by audits and docs (Antigravity) or S6a (Codex):** N15, N32, N33, N57, U15.
- **Anything in SPEC for this stage not fitted to an ID:** none.

## Decisions to confirm

1. React Flow and Recharts are not installed. The graph and radar are plain SVG on the same data; they can switch once the packages are approved.
2. N61's window (30 days) and minimum (3 institutions) are not in any source. They live in `server/src/modules/additions/n61-patterns/defaults.js` as `DEMO-PATTERN-v1`, labelled "not from source; replace with AICTE policy", and appear on every alert.
3. N47 reuses IMPACT's case scope (`scopedCases`, now exported; report logic unchanged). A test checks that every drill-down count equals the IMPACT number it opens.
4. N46 `/judge` is public (judges have no account), 404 in production mode, and reset refuses any database not named `*_demo` (or the test database).

## Found in other stages (not edited)

- S3: `seedS3Fixtures()` in `server/src/modules/sync/seed.js` fails on a fresh database (transfers missing `dueAt` / `senderOfficerId`), so `npm run reset` and `npm run seed` stop there. Judge Mode catches it and reports S3 fixtures as UNKNOWN. Reported to the coordinator.

## Shared files touched (append only)

- `server/src/routes.js`: 5 mount lines at the end.
- `server/src/modules/impact/impactService.js` (mine, S5): `scopeLabel` and `scopedCases` exported; no logic change.
- `client/src/pages/impact/Impact.jsx` (mine, S5): numbers wrapped in drill links; pattern alerts section added.
- `FEATURES.md`: only the 17 S6b rows.

## How to see it working

`npm run dev`, then open `/judge` (no login), click **Reset demo and start tour**, and follow the steps (password `demo1234`):

- `/impact` as supervisor1: click any number to open `/impact/cases?row=...`; pattern alerts sit under the regional insights.
- `/overlap-timeline/<PID>` as supervisor1 or pgrc_officer1: two lanes with the PREVENT conflict point.
- `/graph/institutions/<PID>` as supervisor1: institution graph and attention radar.

## Suggested commit message

"stage S6b: Judge Demo Mode, click-any-number drill-down, overlap timeline, cross-institution pattern alerts, institution graph and attention radar"
