# JURY-91 release plan — 2026-10-25 (Asia/Kolkata)

Local run only: no git, branches, worktrees or checkout copies. Re-read each file immediately before editing. STATUS.md is the current authority; preserve all completed S0–S7 work and Claude's 25 Oct fixes. Scope is release quality/evidence only. The external jury artifact URL is inaccessible via the browser search tool; use the supplied ranked scope.

## Baseline and ownership

STATUS records a 277/277 green run and a later 274/277 run with three setup timeouts; verify a fresh run before making any final claim. Earlier phase reports are historical, not grounds to redo completed features. N63 and S13 are eligible for status changes only after their specific proof; S08 remains GAP. All BLOCKED-SOURCE rows stay blocked until Manish supplies defining text. No 91/100 outcome can be promised or measured by this agent without a new jury assessment.

Read: STATUS, AGENTS, SPEC, ADDITIONS, FEATURES, JUDGE_SCRIPT, JUDGE_QA, AI_METHODS, LIMITATIONS, SECURITY_REVIEW and FINAL_AUDIT_REPORT. Inspect actual routes/pages/services before implementation; preserve seven matcher signals/weights, PID/ICID gate, RuleBook thresholds, human decisions, RBAC/ABAC, safe logging and synthetic labels.

## Ranked work

| Order | Work and files | Required proof / gate |
|---|---|---|
| 1 | playwright.config.js, e2e/judge.spec.js, optional owned e2e server helper, docs/screenshots/ and README; run complete JUDGE_SCRIPT as named users on a dedicated awaaz_dastak_e2e_demo DB and dedicated ports. Seed via existing Judge Mode reset only after approval. Screenshot every step, video, three consecutive passes. | [JUDGE] browser flow, isolated database guard, redacted screenshots/video: no narrative, email, OTP, real identity or prohibited visible fields. ASK MANISH before Playwright/Chromium installation/download and any demo DB reset. Shared awaaz_dastak_demo untouched until a separate final approval after three passing isolated runs. |
| 2 | Actual receipt rendering + QR, IMPACT/reports/regional charts, Institution360/graph React Flow, case/transfers visual timeline. Preserve exact displayed source text, row IDs/drill-downs and denominators; concise judge-script narration. | [A-N63] SVG QR to authenticated /track, [N26]/[A-N47] chart points/bars equal number drill-down, [N12] graph nodes/edges, [N20] all four transfer steps. ASK MANISH for qrcode/recharts/reactflow and required peers before installation. |
| 3 | Only semantic part of prevent/signals.js plus benchmark-owned supporting code/model setup as allowed; cache vectors by SHA-256, offline-only inference, explicit lexical fallback reason. No eighth signal, weight, threshold or fixture-label changes. | Easy + 5000-pair hard benchmark with real counts/version/seed/runtime; paraphrase recall must exceed 75.1%, precision >=98%, easy 100%. If constraints are not met, report failure rather than alter thresholds/ground truth. ASK MANISH for pinned local embedding package/model download. Check whether synchronous signals requires a narrowly scoped owner-approved await hook; do not silently expand ownership. |
| 4 | impact/ background warmup/debounce with fingerprint safety checks; workspaces/ DB-scoped aggregation counts + stable pagination and same authorized results; routes accept page/limit. | Differential pagination/count tests vs existing result set, no privacy expansion, no stale cache publication, cold/warm timings and 50000 load test. Only throwaway isolated load database; no shared demo mutation or unapproved MongoDB binary download. |
| 5 | Read-only npm audit, scoped approved dependency fixes and optional approved ZAP baseline; docs/SECURITY_REVIEW. | Date/tool versions/findings + retest; S13 DONE only for an actual scheduled audit run with evidence, S08 stays GAP. ASK MANISH before installs/major upgrades/ZAP. No blanket audit fix. |
| 6 | SPEC Part B verbatim and affected blocked rows only after exact original 23 Oct text supplied. | ASK MANISH to paste source. Keep every ID/name/number; map covered behavior before building real differences; no fabricated source or legal policy. |
| 7 | Reconcile STATUS, LIMITATIONS, JUDGE_QA with actual latest full run/browser evidence and add PILOT_PLAN: one region, official tables/policies, approvals, 90-day proposal, measures with numerator/denominator, hand-labelled real-complaint sample as first pilot objective. | Clearly separate proposed pilot milestones from measured synthetic results; no browser rehearsal claim until it actually happened. |

## Approval preparation

Before asking, inspect registry metadata (versions, unpacked package sizes, browser archive size, pinned model revision/file sizes) without installing packages or fetching model/browser archives. Present one consolidated install/download approval list. Ask separately for isolated e2e reset now; leave shared demo reset as final approval after concrete rehearsal evidence. Audit/ZAP major tool choices must be exact and approved before use. No secrets or complaint content in registry requests or approval evidence.

## Verification

Check no other test runner is active. Use exactly the requested sequence with TEST_MONGODB_URI=mongodb://127.0.0.1:27017: npm run test:server -- --maxWorkers=2 --minWorkers=1; npm run test:client; node scripts/merge-results.js; node scripts/trace-check.js. Preserve exit codes/counts and archive full evidence for this phase. Verify actual worker flags reach Vitest; do not edit S0 setup. No skipped/deleted/weakened tests or other tool's test repairs. New tests live in JURY91-owned files in the existing test harness; no changes to tests owned by another phase.

Re-read shared files before any approved package/script changes. Keep a running approval ledger and measured before/after evidence in plans/JURY91_REPORT.md. Update STATUS at each completed item; no early DONE/green claims. Final report includes exact test/trace output, three browser-run evidence sets, package/model versions, every approval/answer, remaining blockers and exact scope limits.
