# FINAL_INTERACTIVE baseline findings — Codex, 27 October 2026

This is Step 2 baseline/plan evidence, not the completed implementation report. No application source or existing test was changed in this continuation. No browser page sweep, final build or current-phase rehearsal has been performed yet. The human confirmed that the earlier tools were finished and closed before the test run started.

## Fresh full sequence

Run from `nexus-ic`, with the server and client suites run sequentially:

1. `TEST_MONGODB_URI=mongodb://127.0.0.1:27017 TEST_DB_NAMESPACE=fi_codex_base_20261027_1 npm test --workspace=server -- --maxWorkers=2`
2. `npm run test:client`
3. `node scripts/merge-results.js`
4. `node scripts/trace-check.js`

| Result | Passed | Failed | Skipped | Total |
|---|---:|---:|---:|---:|
| Server | 288 | 3 | 0 | 291 |
| Client | 97 | 0 | 0 | 97 |
| Merged full baseline | 385 | 3 | 0 | 388 |

Command exit codes were server 1, client 0, merge 0 and trace 1. Test titles/results are saved in `plans/BASELINE_TESTS.json`. Raw reporter result copies and redacted console logs are under `test-results/fi-codex-baseline-20261027/`. The full merged baseline remains unchanged by the focused rerun.

Trace-check reported six violations: unexpected N97, N98 and N99, plus failed results for N73, S28 and U20. Source inspection confirms that its expected-ID range stops at N96 and its row/test/result matching accepts only two-digit IDs. Consequently it ignores N100–N102 and prints incomplete ledger counts. It must not be reported as passing.

The actual FEATURES parser used for the saved snapshot accepts two- and three-digit IDs: **371 rows: 142 DONE, 5 GAP, 2 TODO, 217 BLOCKED-SOURCE, 2 PLANNED-P2, 3 NOT-ADOPTED**. GAP: S08, S13, N90, N92, N94. TODO: N101, N102. Exact entry ID/title/status/path rows and the original FEATURES file are preserved in the evidence directory. The original baseline files were archived before being replaced with the fresh baseline.

## Fresh failures and unchanged focused diagnosis

All three fresh failures were `beforeEach` hook timeouts at the existing 120000 ms limit; no assertion failure was reported for them. The JSON reporter supplied hook stack traces; the console log preserves the actual timeout messages.

| File / failing test | Full baseline | Unchanged focused result | Classification supported by evidence |
|---|---|---|---|
| `server/tests/s2-bureaus.test.js`, `[N73] bureaus and cells seeded as configurable units with officers` | Setup-hook timeout | Passed | Setup timing failure in the full run; no repeatable assertion defect established. |
| `server/tests/s3-trace.test.js`, `[U20] an unacknowledged transfer escalates after exactly 2 business days...` | Setup-hook timeout | Passed | Setup timing failure in the full run; no repeatable ownership/escalation defect established. |
| `server/tests/s4-api.test.js`, `[S28] similarity and action checks never send complaint text or action details to the logger` | Setup-hook timeout | Passed | Setup timing failure in the full run; this existing assertion does not prove OTP logging is safe. |

Focused command, run only after the complete baseline sequence, from `server`:

`TEST_MONGODB_URI=mongodb://127.0.0.1:27017 TEST_DB_NAMESPACE=fi_codex_focus_20261027_1 node ../node_modules/vitest/vitest.mjs run tests/s2-bureaus.test.js tests/s3-trace.test.js tests/s4-api.test.js --maxWorkers=2 --reporter=default --reporter=json --outputFile=../test-results/fi-codex-baseline-20261027/focused-results.json`

Result: **16 passed, 0 failed, 0 skipped**, exit 0. Sensitive test values were redacted in the output stream. Evidence: `focused-results.json` and `focused.log` in the baseline evidence directory. No timeout, assertion or test was edited. The exact external cause of the original scheduling/setup delay was not measured; a focused pass alone does not prove it was caused by another runner or guarantee that a future full run will pass.

## Earlier reported failures

| Earlier claim | Available evidence | Finding |
|---|---|---|
| N92 regional destination test failed | `test-results/ps-server-final.log`, final failure section: expected `result.factors.regionalCell`, received undefined | **Real defect**, not a timeout. Current routing code supplies the factor, and all four N92 tests passed in this fresh full run. No new fix was required here. |
| N92 missing/mismatched ICID test failed | Same historical log: expected `result.factors.icidCheck` to be NOT_AVAILABLE, received undefined | **Real defect**, not a timeout. Current code supplies the factor and the fresh N92 suite passed. |
| Client picker regression | `test-results/fi-baseline-client.log`: expected `/institutions/search`, received `/institutions/public-search` | **Real defect** in the earlier revision. The current picker uses the existing authorized search URL and its test passed in this fresh client run. |
| Client N02 regression | Same historical log: arbitrary faculty reference returned an object instead of null | **Real defect** in the earlier revision. Current simulator behavior passed the unchanged N02 test. |
| Historical seven-client-failure report | The retained earlier FINAL_INTERACTIVE baseline lists only the two client failures above. `ps-client.log` records a different passing run. The original seven individual failed results were not found in the examined evidence. | **Individual root causes remain unproven** for the unretained failures. Do not relabel them all as load timeouts. The current complete client run passes all its tests. |

The comparison script matched suite, file and test title against the earlier saved baseline: **354 prior titles, 388 current titles, 0 missing**. Evidence: `prior-title-comparison.json`. This proves preservation of those recorded titles, not final release success.

## Source-confirmed issues to implement after plan approval

- `server/src/modules/identity/service.js` sends the OTP value to the logger, and `server/src/config/logger.js` omits OTP from protected fields. The new baseline console log has been redacted. Fix the logger/service privacy defect while retaining the local in-memory inbox.
- `Verify.jsx` does not pass its selected institution PID into `SelfCheckPanel`, so the panel cannot apply that selection to its mismatch check.
- Registry state-only search excludes imported official rows when no text query is given; text-query official rows can bypass the requested state/region filters. Add regression coverage and correct filtering without changing the existing fictional-row response allowlist.
- OfficialImport does not invalidate the prior preview when the date changes, and rejected file/fetch promises can leave stale or busy UI. Preserve preview-before-confirm and existing import semantics.
- IndiaMap uses region-centre fallback coordinates while captioning the pin as state level. Its selectable state controls do not establish official state boundaries; the existing illustrative label is necessary.
- The existing rehearsal runtimes hard-code the showcase database. A dedicated isolated current-phase runner is required before running mutating story fixtures.
- Existing page-audit wording assertions conflict with the current requirement to retain simulated/policy disclosures. Preserve that old test and add a dedicated audit of the current requirements; do not weaken it to obtain a pass.
- Several empty branches and missing explanations were found in source; the exact list and remedy are in `plans/FINAL_INTERACTIVE.md`. Actual showcase sparsity still needs the authorized browser sweep.

No real-college data, official map or new dependency was supplied. Real SECE acceptance and official-map validation remain pending their specified inputs. The showcase was not rebuilt, and no shared-demo database operation was performed by this continuation.

## Approval status

Implementation is waiting at the explicit Step 2 plan gate in the current user request. RULES.md Rule 8 makes the requested documentation and trace checker read-only; the concrete plan requests the narrow `override rule 8` exception. Do not add a release freeze marker or present this failed full baseline as a completed proof run.
