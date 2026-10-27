# S7 report: Release evidence (built by Claude), plus S5 and S6b verification

Date: 25 Oct 2026.

## Test runs

| Run | Result |
|---|---|
| Full `npm test`, 8 workers (run 1) | Server: every S0–S6b test passed except `[S01]` (my Judge Mode routes lacked `authorize()`, fixed) and S6a `[U15]` (hook timeout). Client did not run because the server step failed. |
| Runs 2 and 3, 8 workers | Failed across every stage on MongoDB timeouts (`PoolClearedOnNetworkError`, hook timeouts). Environmental, not code. |
| **Final: server with `--maxWorkers=2`, then client, then `merge-results.js`** | **Server 200/201 passed. Client 55/57 passed. 258 total, 255 passed, 3 failed.** |

Failures in the final run:

1. `[JUDGE]` (s7-judge.test.js): `POST /api/v1/transfers` returns 500 "senderOfficerId required". S3 bug: `requestTransfer()` reads `user._id`, the session user has `id`. The same flow passes 3/3 when the transfer is made with a User document, so this is the only failing step.
2. Two S6a client `[N15]` PWA tests: `ENOENT C:\manifest.webmanifest` and `C:\sw.js` (path resolution in Codex's test).

`node scripts/trace-check.js`: **No violations.** Counts: DONE 119, IN-PROGRESS 4, GAP 4, BLOCKED-SOURCE 217, PLANNED-P2 2, NOT-ADOPTED 3, TODO 0.

## Critical failures

- **Found and fixed:** the Competent Authority got full case records, including private narratives, from `GET /api/v1/cases/:id` and `GET /api/v1/institutions/:pid/360` (D16, S19). Fixed in `server/src/middleware/abac.js`; proved by the `[NEG]` sweep and `[S19]`. This is an edit to an S0 file, made because the S7 prompt says to fix any leak first.
- **None remaining** in the negative-role sweep (`server/tests/s7-negative-roles.test.js`, 8 tests: another complainant, owning complainant, institution admin, other-bureau officer, other-region officer, Competent Authority, supervisor/auditor/system admin, anonymous).

## SPEC 18 definition of done

| Item | Answer | Evidence |
|---|---|---|
| Every requirement R01–R55 is mapped and working or listed as a gap | NO for "working", YES for "listed" | R01–R55 text is not in the repo (SPEC Part B4); all 55 are BLOCKED-SOURCE and listed in docs/LIMITATIONS.md |
| Every P0 feature passes its UI and API tests | YES | All 18 P0 rows are DONE; tests pass in the final run |
| The two-bureau judge scenario runs without database edits | NO | `[JUDGE]` fails at the HTTP transfer (S3 bug above). Judge Mode reset and the rest of the flow pass |
| No restricted data leaks in any negative-role test | YES (after the fix) | `[NEG]` 8/8, `[S19]`, `[S22]`, `[U31]`, `[U32]` |
| Missing feeds never display as zero | YES | UNKNOWN handling in `[N26]`, `[N77]`, `[E07]`, `[F43]`, `[U30]`, plus earlier stages' feed tests |
| Every figure comes from an actual local run | YES | `test-results/results.json` from the final run |

## S7 IDs

- DONE: S30 (threat model and checklist), N34 (audit programme).
- GAP: S08 (proof is a deployment review; prototype at-rest encryption proved by `[S08]`), S13 (schedule written, no audit run yet; "S34" kept as written).
- BLOCKED-SOURCE: T01–T30, X01–X22, D01–D26 (test text not in the repo). Nothing invented.

## S5 and S6b after verification

- DONE now: N22, N23, N24, N25, N26, N29, N30, N35, N55, N62, N71, N76, N77, N80, S19, S22, S27, U24, U25, U26, U27, U28, U30, U31, U32, N46, N47, N50, N61.
- GAP: N51 (needs S1a consent purpose), N63 (QR image needs the `qrcode` package).

## Everything not DONE

See docs/LIMITATIONS.md (generated from FEATURES.md): 4 GAP, 4 IN-PROGRESS owned by other tools (N15, N57, U12, U15), 2 PLANNED-P2, 3 NOT-ADOPTED, 217 BLOCKED-SOURCE.

## Not done in S7, and why

- Screenshots of every SPEC 12.1 route and the browser judge flow: Playwright is not installed (awaiting approval). The judge flow is covered at API level by `[JUDGE]`.
- `[JUDGE]` three times from a fresh `npm run reset`: `npm run reset` drops `awaaz_dastak_demo`, which a running dev server uses, and S3's seed fails on a fresh database. `[JUDGE]` runs three times from a fresh Judge Mode reset on the test database instead.

## Files

- New: `docs/LIMITATIONS.md`, `docs/SECURITY_REVIEW.md`, `server/tests/s7-negative-roles.test.js`, `server/tests/s7-judge.test.js`, `server/tests/s7-release.test.js`, `plans/S7.md`, this report.
- Changed: `server/src/middleware/abac.js` (leak fix), `server/src/modules/additions/n46-judge-mode/*` (sign-in required, scenario institution), FEATURES.md (S5, S6b, S7 rows only).

## Suggested commit message

"stage S7: negative-role sweep and Competent Authority narrative leak fix, security review, limitations, API judge flow; S5 and S6b verified"
