# Current status (read this first)

Updated by Claude on 25 Oct 2026, 13:00Z. This file is the single current picture. Older wave tables in PARALLEL_PLAN.md and BUILD_PLAN.md show the original plan, not progress. Status per ID always comes from `node scripts/trace-check.js` and FEATURES.md, never from memory or old plan files.

## Phases

| Phase | State | Built by | Report |
|---|---|---|---|
| S0 Foundation | Built, verified in the full run | Antigravity | plans/AUDIT, FINAL_AUDIT_REPORT.md |
| S1a Identity, NEXUS TRUST | Built, verified | Codex | plans/S1a_REPORT.md |
| S1b Institutions and intake | Built, verified; channel hooks added 25 Oct | Antigravity, hooks by Claude | plans/S1b_REPORT.md |
| S2 Trust and routing | Built, verified; POLICY_NOT_CONFIGURED fixes applied 25 Oct | Antigravity, fixes by Claude | plans/S2_REPORT.md |
| S3 SYNC and TRACE | Built, verified; HTTP user-id, import and seed fixes applied 25 Oct | Antigravity, fixes by Claude | plans/S3_REPORT.md |
| S4 PREVENT | Built, verified | Codex | plans/S4_REPORT.md |
| S5 Closure and recovery | **Built, verified** | Claude | plans/S5_REPORT.md |
| S6a Channels and integrity | **Built, verified**; S1b hooks and test fixes by Claude 25 Oct | Codex, fixes by Claude | plans/S6a_REPORT.md |
| S6b Judge Mode and differentiators | **Built, verified** | Claude | plans/S6b_REPORT.md |
| S7 Release evidence | **Built**; screenshots wait for Playwright approval | Claude | plans/S7_REPORT.md |
| Final audit | Done; release fixes applied | Claude | plans/FINAL_AUDIT_REPORT.md |

## Latest full test run (25 Oct 2026, server with `--maxWorkers=2`, then client)

**277 tests, 277 passed, 0 failed.** `node scripts/trace-check.js`: **No violations.** DONE 124, GAP 3, IN-PROGRESS 0, TODO 0, BLOCKED-SOURCE 217, PLANNED-P2 2, NOT-ADOPTED 3.

GAP rows: N63 (QR image needs the `qrcode` package), S08 (needs a real deployment review), S13 (audit schedule written, no audit run yet).

Fixed on 25 Oct (after Manish's "rectify and correct all"): the intake regression (S1b form hooks for email drafts; PWA/WEB channel from the standalone signal), N51 Retaliation Watch (consent purpose, opt-in, simulator re-check), U12 end-to-end proof, S6a test bugs, and N15, U15, N57 now DONE.

Jury-audit hardening (25 Oct, "make the weakest stronger"): one closed-status vocabulary in every module (a case closed as `CLOSED` or `DISPOSED` no longer counts as open for identity-reveal scope); no session-secret fallback; CSRF origin check on state-changing requests; matcher containment signal (hard-case recall 73.5% to 93.3%, precision 99.1%) and a hard-case benchmark with precision and recall per stratum; honest description of the AI parts in docs/AI_METHODS.md; LIMITATIONS.md now leads with what is built.

Score push (25 Oct, "i want 91/100"): scale work with a measured 52,000-case load test (IMPACT first build 72 s to 15 s, repeat 0.24 s; duplicate check 0.26 s at a 2,000-case college; see docs/JUDGE_QA.md), PREVENT made cheaper without changing results, new indexes, spec IDs removed from user-facing labels, docs/JUDGE_QA.md and docs/AI_METHODS.md for the jury. Latest full run: 277 tests, 274 passed; the 3 failures (`[S23]`, `[U15]`, `[N15]`) were 120-second setup timeouts while the machine was busy, and all 17 tests in those two files pass when run on their own.

Jury round 2 (77/100): Claude added the regional-office view (/regional) and recorded an npm audit in docs/SECURITY_REVIEW.md. The remaining fixes are handed to Codex in prompts/JURY91_CODEX_MASTER_PROMPT.md; Claude has paused edits on those items.

## Open decisions for Manish

- Install Playwright (screenshots and the browser judge flow).
- Reset the shared demo database `awaaz_dastak_demo` (a dev server is using it).
- Add `qrcode` (N63 QR image), `reactflow` and `recharts` (graph and radar views).

## How to run the tests here

Check that no other tool is running tests, then: `npm run test:server -- --maxWorkers=2` (with `TEST_MONGODB_URI=mongodb://127.0.0.1:27017`), `npm run test:client`, `node scripts/merge-results.js`, `node scripts/trace-check.js`. Eight workers time out against the local MongoDB.

## JURY-91 work in progress (Codex, 25 October 2026)

Plan written to plans/JURY91.md; running evidence is in plans/JURY91_REPORT.md. Manish approved and Codex installed the pinned browser/visual/model packages and downloaded the pinned model. Three consecutive isolated browser rehearsals passed (22 screenshots and video each; Chrome 155.0.8059.85; no failures, skips or retries); see docs/screenshots/README.md. Downloaded Chromium 156 failed Windows side-by-side activation, so the existing Chrome runs with a fresh temporary profile. The shared demo has not been reset; that still needs separate approval. Manish additionally approved targeted transfer-history authorization, transfer-response field policy, priority-reason persistence and a minimal semantic await hook. History/response/routing fixes are implemented; final full-suite verification and later visual/model/performance work are still underway. Added the proposed one-region, 90-day PILOT_PLAN; no real-pilot outcome is claimed. Dependency audit: 11 vulnerable dependency entries (2 critical, 1 high, 8 moderate); security upgrades and ZAP approval pending. S08 and S13 remain GAP.

The root test wrapper consumed the worker flags as npm options. Fresh verification used `npm test --workspace=server -- --maxWorkers=2 --minWorkers=1`, which visibly forwarded both limits to Vitest, followed by `npm run test:client`, result merge and trace-check. **278 tests passed: 215 server and 63 client, zero failures or skips.** Both suites, merge and trace-check exited 0. FEATURES remains 124 DONE, 3 GAP, 217 BLOCKED-SOURCE, 2 PLANNED-P2 and 3 NOT-ADOPTED; **No violations**. No test setup or package scripts were changed. Earlier green and timeout runs above remain historical evidence. This is test evidence, not browser rehearsal or a completed JURY-91 release.

## Jury UI redesign (Claude, 25 October 2026)

Browser verification of all 9 roles found most features built but hidden: the shared demo database's 6 cases all point to an unregistered PID (so ICID, region and Institution 360 showed "not available"), officers had no case page, and about 30 screens were only reachable by URL. Full findings: plans/UI_VERIFICATION_25OCT.md. Built: design system and sidebar shell (global case/PID/ICID search, "View as" demo switcher), new landing, login and command-centre dashboard with Recharts, officer case page `/cases/:caseId` on new `GET /api/v1/cases/:caseId/journey` (PID, ICID check, source trail, routing, ownership path, dated timeline, audit entries; tests `[N09]`, `[S21]` in server/tests/ui-case-journey.test.js), guided jury tour in Judge Mode, and a separate showcase database (`npm run showcase:seed`, `npm run dev:showcase` on http://localhost:5180; see docs/JURY_DEMO_GUIDE.md). The shared `awaaz_dastak_demo` was not touched. No FEATURES status changed.

## Final polish (Codex)

26 October 2026. Plan: plans/FINAL_POLISH.md; evidence/report: plans/FINAL_POLISH_REPORT.md. Added the approved Institution plugin hook, unified fictional 120-institution catalogue (114 ICIDs, six unavailable), authorized bounded search and shared picker, full-screen Present story with live IMPACT, Institution 360 trend/graph and the case explanation panel. Removed on-screen data labels by the explicit override; disclosure remains in documents/spoken script. Export disclosure footer removed by approval; N55 attribution and trace retained. Shared demo unchanged; three approved showcase rebuilds used.

Fresh test evidence: **307/307 passed (227 server, 80 client), zero failed or skipped**; trace-check **No violations**. FEATURES: 125 DONE, 2 GAP, 217 BLOCKED-SOURCE, 2 PLANNED-P2, 3 NOT-ADOPTED. N63 real QR now DONE; N79 master-data links and role tests pass. Approved security upgrades installed; npm audit reports zero vulnerabilities. ZAP was not approved/run. Final showcase browser proof: **3/3 passed**, zero failures, skips or retries, 25 numbered screenshots and a video each (Chrome 155.0.8059.85, 8.0 minutes). Final manifests and sampled video QA are documented in docs/screenshots/README.md and plans/FINAL_POLISH_REPORT.md. The old JURY-91 videos remain historical.
