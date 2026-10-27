# FINAL_INTERACTIVE: next steps (written by Claude, 27 Oct 2026, stopping at the usage limit)

I stopped because the weekly usage reached about 88–90%, close to Manish's 95% stop rule. No file is half-edited. No git command was run. `awaaz_dastak_demo` was not touched, the showcase database was not rebuilt, and nothing was installed.

## Done
- **Part 1a**: baseline saved (`plans/BASELINE_TESTS.json`: server 265/267, client 85/87; `plans/BASELINE_FEATURES.txt`). Real defects fixed:
  - `[S01]`: three public routes added by another tool now use `authorize()`.
  - `[R32]`: picker URL restored.
  - `[N02]`: the faculty simulator no longer accepts arbitrary text.
  - `[S27]` and the N86–N89 file were load timeouts and pass on their own.
- **Part 1b**: `plans/FINAL_INTERACTIVE_VERIFY.md` (N90–N96: VERIFIED, PARTIAL or MISSING).
- **Part 2, N97 smart search**: `server/src/modules/registry/smartSearch.js`.
  - Matches acronyms (including dotted forms), aliases, short forms (engg, inst, tech, univ, coll, sch…) and 1–2 typos, case and accent insensitive.
  - Ranking: exact PID/ICID/acronym, then prefix, then substring, then close spelling (only when nothing else matches). Bounded to 20.
  - Wired into the existing `/institutions/search` with the row shape unchanged.
  - The picker now has a two-character minimum, a source badge, a "No match" hint and a details card with a map pin (intake, verify, lookup).
  - Demo grievances cannot name an imported real-list college.
- **Part 2, N98 import**: tolerant AICTE header mapping, RFC-4180 CSV, unknown-column report, `acceptValidRows` confirm (the default stays all-or-nothing), importer taken from the session, admin page `/admin/registry/import` (system_admin, sidebar "Official list import").
- **Part 3, N99 self-check**: `server/src/modules/identity/selfCheck.js`, `client/src/pages/trust/SelfCheckPanel.jsx` (on Verify, students only).
  - ABC lookup → confirm details → verified, with no officer and no OTP.
  - Synthetic Aadhaar-style numbers: 12 digits, Verhoeff checksum, simulator list.
  - Stores a salted hash plus the last four digits only.
  - Mismatch, "not mine", a reused number or 3 failed tries → the existing manual review.
  - The OTP and officer-assisted paths are unchanged.
- **Part 6, N100 map**: `IndiaMap.jsx` extended.
  - 37 selectable states and UTs with college counts (`GET /registry/state-counts`); clicking a state lists its colleges and opens the details.
  - Zoom, pan and reset buttons (40 px targets), region legend, saffron selection.
  - State-level pin with "Location shown at state level" unless the record has coordinates.
  - Visible label "Illustrative map, boundaries not official".
- **Tests added**:
  - `server/tests/final-interactive-search.test.js`: 13 tests, `[A-N97]` and `[A-N98]`.
  - `server/tests/final-interactive-selfcheck.test.js`: 7 tests, `[A-N99]`.
  - `client/tests/final-interactive.test.jsx`: 10 tests, `[A-N97]`, `[A-N99]` and `[A-N100]`.
  - All pass in focused runs.
- FEATURES.md rows N97–N100 DONE and N101–N102 TODO (no existing row changed). `docs/LIMITATIONS.md` has N97–N99 notes added.
- Verify page: a real university name ("Delhi Technological University") next to a made-up PID was replaced with the fictional catalogue name for that PID.

## Full proof run (finished)
Namespace `fi_final1`: server 291/291, client 97/97, 0 failed, 0 skipped. trace-check: 3 violations (N97–N99 "unexpected ID") because scripts/trace-check.js hard-codes N01–N96 and parses only two-digit IDs. **Needs Manish's approval to edit scripts/trace-check.js** (read-only under Rule 8): `range('N', 1, 102)` and the regex `[A-Z]\d{2,3}`.

## Left to do
1. **Part 4 (N101) no empty pages**: run the all-role page sweep (`e2e/page-audit.spec.js` on its isolated runner), list the empty states, add designed empty states, and plan the showcase fill. **Needs Manish's approval to rebuild `awaaz_dastak_showcase`.**
2. **Part 5 (N102) interactivity and saffron**: sortable/filterable tables, clickable stat tiles, copy-ID buttons, skeleton loaders and saffron accents across existing pages. Check 390 px and "no null/undefined/NaN".
3. **Part 7**: rewrite `plans/PS_FIT.md` as the evidence table with a rating out of 10. The last independent ratings were 7 and 7.5.
4. **Part 8**:
   - Client build (`npm run build` in client).
   - Screenshots per role and page at desktop and 390 px under `docs/screenshots/final-interactive/`.
   - Three judge-story rehearsals (Playwright, isolated DB, screenshots only), extended with the "sece" search, map pin and self-check steps.
   - Make the docs agree (STATUS, JUDGE_SCRIPT, JUDGE_QA, AI_METHODS, JURY_DEMO_GUIDE, screenshots/README).
   - `plans/FINAL_INTERACTIVE_REPORT.md`, then "FROZEN FOR JURY" in STATUS.md and STAGE_CHECKLIST.md.
5. **Live SECE acceptance check**: waits on Manish's AICTE file (see below).

## Exact commands (PowerShell, from nexus-ic, with no other runner active)
```
$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; $env:TEST_DB_NAMESPACE="fi_final2"; npm test --workspace=server -- --maxWorkers=2
npm run test:client
node scripts/merge-results.js
node scripts/trace-check.js
cd client; npm run build; cd ..
npm run dev:showcase    # UI http://localhost:5180 (restart it to load the new server code)
```

## What Manish needs to do for SECE to appear
1. Download the official AICTE approved-institutions list (and the IIC list, if you have one) yourself.
2. If it is .xlsx: open it in Excel, then File → Save As → "CSV UTF-8 (Comma delimited)".
3. Sign in to the showcase as `sysadmin1` → sidebar "Official list import" → choose the CSV, enter the list's as-of date → "Dry run preview" → check the new, updated and rejected counts and the reasons → "Confirm import".
4. Then search "sece" or "Sri Eshwar College of Engineering" in any college box.

## Decisions for Manish
- Approve or decline rebuilding `awaaz_dastak_showcase` (Part 4).
- Approve or decline an Excel reader package (CSV works without it).
- Supply a Survey of India–compliant SVG or GeoJSON for the map, or keep the illustrative label (N94 stays GAP).
- **Check the ID formats against your real file.** The validator requires PID `1-` plus 10 digits and ICID `IIC-` plus 8 characters (both existing rules from N96). If the real AICTE or IIC IDs differ, those rows will show as rejected in the dry run. Tell me the real format from your file; I won't guess it.
- RULES.md Rule 8 marks `docs/` read-only. I added notes to `docs/LIMITATIONS.md` because the prompt asks for doc updates; say "override rule 8" to confirm, or I'll revert that addition.
- The prompt says five AICTE regions; the repo uses six (including Central). I kept six.
