# FINAL_INTERACTIVE — Part 1b: what N90 to N96 really do

Checked by Claude on 27 Oct 2026 (05:45–06:00 UTC) against the running showcase (UI http://localhost:5180, API :3100, database `awaaz_dastak_showcase`, not rebuilt) and the source tree. API checks were made from the browser with the showcase session cookie, signed in as each role named.

| ID | Claim | Verdict | Evidence |
|---|---|---|---|
| N90 | College name auto-fetch everywhere | PARTIAL | `GET /institutions/search` as `trust_student_verified`: "Arohan" → 10 rows, "Lucknow" → 4, "arohan vidya" → 3. **No match** for the acronym "avie" (Arohan Vidyarekha Institute of Engineering), the typo "Arohn" or the short form "engg". The picker is a working combobox (ARIA roles, arrow keys, Enter, Escape) on 7 pages, but it shows no source badge and no details card, has no ranking, and starts at the first character. The 10:30 UTC edit by another tool had moved the picker to an **unauthenticated** `public-search` route (see Part 1a). |
| N91 | ABC/APAAR verification (simulated) | VERIFIED (with OTP step) | `trust_student_verified` → `/identity/me` status `verified`, method `AbcApaarSimulator`. Five outcomes exist in `server/src/modules/identity/simulators.js` (verified, inactive, mismatch, manual review, not enrolled). The happy path still needs an OTP step; there is no self-service details-confirm screen and no Aadhaar fallback. The N91 edit also broke `[N02]` (an arbitrary faculty reference returned NOT_ENROLLED instead of being rejected); fixed in Part 1a. |
| N92 | ICID-based routing to the Regional Grievance Cell | PARTIAL | `routingEngine.js` sets `secondary = Regional Grievance Cell (<region>)` from the PID region, with the ICID check in the reason. The regional officer (`regional1`, Northern) sees `/regional` with 147 cases in scope, KPI tiles and the map. There is no explicit "referred to / accepted by regional cell" record on a case; `/regional/queue` returns 404. The GAP reason stays accurate. |
| N93 | Realistic status stepper | VERIFIED | `client/src/pages/track/Track.jsx` and `CaseJourney.jsx` show recorded milestones; tracked cases show "Under Process" and "Closed" from recorded events (`/track` for `trust_student_verified`, 10+ cases). |
| N94 | India map with the region marked | PARTIAL | `client/src/components/IndiaMap.jsx` draws **six hand-drawn region blobs** (no individual states or UTs, no zoom or pan). It renders on `/regional` (labelled "Configured regions – illustrative map"), the institution lookup and the case journey. The outline is schematic, not a Survey of India outline. GAP stays open until an official file is supplied. |
| N95 | Saffron on every page | PARTIAL | Saffron tokens are in `client/tailwind.config.js` and used in the sidebar active item, page eyebrows, the lookup title underline and primary buttons. Not yet checked page by page in every role (Part 5). |
| N96 | Official registry adapter | PARTIAL | `adapters.js` has PID/ICID validation, CSV preview counts, an upsert import with provenance and file hash, admin-only routes, an audit event and a disabled live stub. `GET /registry/official/search?q=a` → 0 rows (nothing imported). Missing: an upload screen, tolerant AICTE header mapping (the parser splits on commas, so quoted fields with commas break), an unknown-column report, and database, audit, authorize and dry-run tests. |

## Part 1a: what was a timeout and what was a real defect

Baseline: `plans/BASELINE_TESTS.json` (namespace `fi_base1`). Server 265 passed and 2 failed of 267, plus one file not run. Client 85 passed and 2 failed of 87.

| Test | Kind | Evidence and action |
|---|---|---|
| `[S01]` every /api route needs authorize | **Real defect** | `GET /registry/public/institutions/by-icid/:icid`, `GET /institutions/public-search` and `GET /institutions/public/:pid` had no `authorize()`. They were added by another tool's edit at 10:30 local time. Fixed by adding `authorize()` with the paths unchanged. |
| `[R32]` picker searches via `/institutions/search` (client) | **Real defect** | The same edit pointed the picker at `public-search`. URL restored. |
| `[N02]` arbitrary faculty reference rejected (client) | **Real defect** | `StaffRegistrySimulator.verify('made-up')` returned NOT_ENROLLED. Now only FAC-/STF- shaped IDs count as a registry miss; other text returns null, as before. The N91 tests still pass. |
| `[S27]` outbox idempotent | Timeout under load | `beforeEach` hook timed out at 120 s during the full run. It passes on its own (focused run `fi_fix1`, 47/47). |
| additions-n86-n89 file (`[A-N86]`, `[A-N88]`, `[A-N89]`) | Timeout under load | "vitest-pool: Timeout waiting for worker to respond": the worker never started. It passes on its own (focused run `fi_fix1`). |

The prompt's "2 N92 failures" and "7 client failures" were from yesterday's runs. In today's baseline, N92 passed, and the client had 2 failures, both real and both fixed above.
