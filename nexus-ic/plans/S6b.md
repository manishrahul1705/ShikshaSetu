# S6b plan: Judge Mode and differentiators (built by Claude)

Read: RULES.md, PARALLEL_PLAN.md, prompts/S6b_differentiators.md, prompts/S6_Differentiators.md, SPEC 6.4, 7.3, 10.4, 12.1, 14, 18, ADDITIONS N46, N47, N50, N61.

`node scripts/trace-check.js --stage S6` (start): 22 IDs not DONE, no violations.

## Scope

Mine: F05, F06 (differentiator part), F28, F36, F37, F38, E03, E04, E05, E07, E08, E09, E10, N46, N47, N50, N61.

Skipped, owned by audits and docs (Antigravity) / S6a (Codex): N15, N32, N33, N57, U15.

## Rules I follow

- New code only in `server/src/modules/additions/{n46-judge-mode,n47-drilldown,n50-overlap-timeline,n61-patterns}/`, `server/src/modules/graph/`, `client/src/additions/{n46-judge-mode,n47-drilldown,n50-overlap-timeline,n61-patterns}/`, `client/src/pages/graph/`, `client/src/routes/s6b.jsx`, `server/tests/s6b-*.test.js`, `client/tests/s6b-*.test.jsx`.
- Additions only read existing data (ADDITIONS ground rule). N47 reuses the IMPACT case selection; S5's report logic is not changed (only `scopedCases` is exported so the drill-down uses the same scope). A test checks every drill-down list length equals the IMPACT count it opens.
- Append-only shared edits: mount lines in `server/src/routes.js`, my FEATURES.md rows.
- Tests run isolated (`npx vitest run tests/s6b-*`, in-memory MongoDB, nothing written to `test-results/`). Full `npm test` waits for Manish's test slot. No git.

## Plan, one line per ID

| ID | What I build | Files | Test |
|---|---|---|---|
| N46 | Judge Demo Mode at `/judge` (public route, demo only). `POST /api/v1/judge/reset` clears the demo database and re-runs the same seeds as `scripts/reset.js` plus a two-bureau overlap scenario (one institution, a student case routed to RB and a faculty case routed to PGRC with the same issue, both bureaus recording a document request). `GET /api/v1/judge/tour` returns captioned steps with the scenario's case IDs, the PREVENT match result and the exact banner "Potential Overlapping Cases – Coordination Required". Refused (404) when APP_MODE is production, and reset refuses any database whose name does not end in `_demo` (or `_test` for tests). No manual database edits. | `additions/n46-judge-mode/*`, `client/src/additions/n46-judge-mode/JudgeMode.jsx` | `[A-N46]`, `[N46]` |
| N47 | Click any number. `GET /api/v1/impact/cases?row=<rowId>` returns the exact cases behind an IMPACT count (tiles, bureau, region, institution, month rows; delayed transfers and overlap pairs for those tiles), using IMPACT's own scoping and a minimal allow-list projection, so nothing new is shown (S19 holds). IMPACT and Authority numbers become links to `/impact/cases?row=...`. | `additions/n47-drilldown/*`, `client/src/additions/n47-drilldown/*`, link edits in my own S5 pages | `[A-N47]`, `[N47]` |
| N50 | Overlap timeline `/overlap-timeline/:pid`: two bureaus' case actions on one institution side by side by time; conflict points are only the PREVENT Stage 2 checks that already returned REVIEW (read-only, nothing recomputed). Other bureaus' entries are opaque metadata; cases outside the viewer's scope show as restricted. | `additions/n50-overlap-timeline/*`, `client/src/additions/n50-overlap-timeline/OverlapTimeline.jsx` | `[A-N50]`, `[N50]` |
| N61 | Cross-institution pattern alert: per region and issue concept (category + sub-category), count distinct institutions in the current window vs the previous one; flag when rising and at or above a minimum, suggest a policy review, cite the cases (restricted ones counted, not shown), show numerator/denominator/scope, labelled synthetic. No source gives window or minimum, so they sit in a clearly labelled `DEMO-PATTERN-v1` defaults file ("not from source; replace with AICTE policy"), the same way S4 handled its thresholds. Shown beside IMPACT, not inside S5's report. | `additions/n61-patterns/*`, `client/src/additions/n61-patterns/PatternAlerts.jsx` | `[A-N61]`, `[N61]` |
| E07 | BLOCKED-SOURCE. From the hint: attention indicators with reasons, never a score. Radar view of the Institution 360 attention indicators as counts per reason type, labelled "counts, not a score"; UNKNOWN indicators shown as UNKNOWN, not zero. | `graph/*`, `client/src/pages/graph/InstitutionRadar.jsx` | `[E07]` |
| E09 | BLOCKED-SOURCE. From the hint: IMPACT safeguards. Test that IMPACT, N47 and N61 all carry the synthetic label, numerator/denominator/scope, flagged ≠ avoided, cited rows. Nothing new built. | tests only | `[E09]` |
| E05 | BLOCKED-SOURCE. Hint says only "related to RESCUE"; RESCUE is N24 (S5). Nothing new built. | — | none |
| F05, F06 | BLOCKED-SOURCE, no hint. "Graph" is the roadmap evidence: an institution graph (institution → cases → bureaus, transfer edges from NEXUS TRACE) from data SPEC 6.4 and 9.2 already define, scoped like Institution 360. Recorded as evidence only; the rows stay BLOCKED-SOURCE with no feature text invented. | `graph/*`, `client/src/pages/graph/InstitutionGraph.jsx` | `[F05]` (graph data is scoped) |
| F28, F36, F37, F38, E03, E04, E08, E10 | BLOCKED-SOURCE, no hint. Nothing built. | — | none |

## Decision for Manish (work continues on the default)

React Flow and Recharts are not installed. May I add `reactflow` and `recharts` to the client? Default: the graph and radar are plain SVG with the same data, so they can switch to those libraries later.
