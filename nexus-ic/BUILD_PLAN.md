# AWAAZ DASTAK Build Plan

> **Current status:** see [STATUS.md](STATUS.md) (updated 25 Oct 2026). The wave table below is the original plan, not progress: S5, S6b, S7 and the final audit are built; S0–S4 are verified in the full run.

Oct 24, 2026 · Manish · Live version: https://claude.ai/artifact/2H1j8avhVpJNooWaWRW5QJ

AWAAZ DASTAK (powered by NEXUS-IC) is built in 8 phases, S0 to S7, plus one waiting phase, SB, for items that depend on the 23 Oct PDF. Every one of the 349 IDs belongs to exactly one phase, and no phase is done until its checker run is clean.

## The loop every phase follows

Every phase runs the same 8 steps. Don't start the next phase until step 8 is done.

1. **New conversation.** Open a fresh Antigravity conversation with the strongest model and Planning mode on.
2. **Paste the phase prompt** from `prompts/` (file names are in the overview below).
3. **Check the plan.** The agent prints `node scripts/trace-check.js --stage S#` and a plan with one line per ID. Make sure every listed ID is in the plan, then approve.
4. **Build.** Let the agent work. Answer its questions; don't let it guess.
5. **Prove it.** The agent runs `npm test` (all green, nothing skipped) and `node scripts/trace-check.js --stage S#`, which must say "No violations".
6. **Look yourself.** Run `npm run dev`, log in with the demo accounts and click through what the phase built.
7. **Audit.** In another new conversation, paste `prompts/AUDIT.md` with the phase name filled in. Fix anything it reports as missing or changed.
8. **Commit.** When the audit says "Safe to commit: YES", run `git add -A`, then `git commit -m "stage S#: ..."`, then `git push`.

If a phase runs late, finish its P0 items first. P1 items and additions can be marked GAP with a reason and done later. Never mark them DONE early.

## Phase overview

| Phase | Goal | IDs | Prompt file | Time slot |
| --- | --- | --- | --- | --- |
| S0 Foundation | A running, resettable skeleton with login, audit chain and demo data | 7 | `S0_Foundation.md` | 10:30–11:15 |
| S1 Front half | Verified users, PID/ICID registry, regions, Institution 360, grievance portal, Master Case ID | 130 (55 are R01–R55) | `S1_Mandatory_PS_plus_front_half.md` | 11:15–12:30 |
| S2 Trust and routing | RuleBook, explainable routing, priority, truthful lifecycle | 25 | `S2_Trust_and_routing.md` | 12:30–13:45 |
| S3 SYNC and TRACE | Zero-loss transfers and cross-bureau coordination | 20 | `S3_SYNC_and_TRACE.md` | 13:45–15:00 |
| S4 PREVENT | Duplicate checks at intake and conflict checks before action | 12 | `S4_PREVENT.md` | 15:00–16:15 |
| S5 Closure and recovery | Closure gate, feedback, rescue, appeal, impact, complainant and admin views | 30 | `S5_Closure_and_recovery.md` | 16:15–17:30 |
| S6 Differentiators | Graph, radar, impact extras, Judge Demo Mode, more intake channels | 19 | `S6_Differentiators.md` | 17:30–20:00 |
| S7 Release evidence | Full test suites, negative-role sweep, screenshots, limitations | 78 | `S7_Release_evidence.md`, then `FINAL_AUDIT.md` | 20:00–22:00 |
| SB Waiting on sources | Items with no defining text yet | 25 | none yet | when the 23 Oct PDF and N36–N45 text arrive |
| Not built | Rejected additions | 3 | none | never |

Total: 349 IDs. Times assume you start at 10:30 today. 217 IDs are blocked until the 23 Oct PDF arrives, so S1 and S7 will move faster today than their counts suggest.

## Phase by phase

### S0 Foundation
- **Goal:** anyone can clone, run `npm install && npm run reset && npm run dev` and log in.
- **IDs:** F45, N48, N66, S01, S09, S16, S28.
- **Build:** server and client folders; root scripts (dev, seed, reset, gen, test); session login with HttpOnly cookies; authorization on every route; demo and complainant accounts; hash-chained audit log; a logger that refuses complainant text; the synthetic-data generator; the SYNTHETIC DATA banner and the chain-check button; the AWAAZ DASTAK title and taglines.
- **Verify:** fresh clone works; `[S01]`, `[S09]`, `[S16]`, `[S28]`, `[A-N48]` and `[A-N66]` pass.
- **Done when:** reset and dev work twice in a row on a clean database, and trace-check is clean.

### S1 Mandatory problem statement plus front half
- **Goal:** a verified student can find their institution by PID and file a grievance that gets a Master Case ID.
- **IDs:** F01–F13, F29–F35, F46–F47, F50–F51, F53–F54, N01–N15, N31, N52, N58, N64, N67, N68, N69, N79, S02–S07, S10–S12, S14–S15, S21, S26, R01–R55, U01–U13.
- **Build:** NEXUS TRUST verification (student, faculty, other users, OTP to a local sink, anti-proxy, alternative path); pseudonymous reporter ID with identity vault and audited reveal; consent ledger; PID registry auto-fetch with all 12 ICID touchpoints; six regions; Institution 360 with attention indicators; grievance portal with uploads, preview and edit; Master Case ID and external refs; encrypted document storage; the upload scrubber; quick-exit button; Hindi and English; complaints written in any Indian language (N67); Other Stakeholder complainants and eligibility check (N68, N69); System Administrator workspace (N79).
- **Verify:** U01–U13 pass. Try a fake PID, a mismatched ICID and a student without enrolment, and see each one correctly refused or sent to review.
- **Done when:** a judge could file a grievance end to end. R01–R55 and the F rows stay BLOCKED-SOURCE except what their hints describe.

### S2 Trust and routing
- **Goal:** every new case is routed with a visible reason, and every rule lives in the RuleBook.
- **IDs:** F14–F19, F39, F48–F49, F56, N18, N19, N27, N28, N65, N73, N78, S20, S25, S29, U16–U19, U29.
- **Build:** NEXUS RULEBOOK with versioning, dry-run and two-step approval, plus the what-if preview; NEXUS ROUTE (primary, secondary, manual review, reason, rule version, override with reason); risk and priority with human-confirmed sensitive flags; the nine-status truthful lifecycle with four tracks.
- **Verify:** U16–U19, U22 and U29 pass. Change a rule and confirm that old cases keep their old clock.
- **Done when:** no case is ever silently assigned, and an ambiguous case lands in human triage.

### S3 SYNC and TRACE
- **Goal:** a case can move between bureaus with nothing lost, and bureaus can coordinate.
- **IDs:** F20–F22, E02, E06, N20, N21, N54, N60, N70, N72, N74, N75, S17, S18, S24, U20–U23.
- **Build:** NEXUS TRACE (request, acceptance pending, accepted, new owner active; escalation after 2 business days; rejection returns to sender); NEXUS SYNC 2.0 (shared view, tasks, time-bound document grants, internal notes, communication log); insider-access alerts; absence-aware ownership.
- **Verify:** U20–U23 pass. Reject a transfer, then let one time out, and watch the owner stay visible throughout.
- **Done when:** at every moment, every case has exactly one accountable owner.

### S4 PREVENT
- **Goal:** duplicates are caught at intake, and conflicting actions are caught before they happen.
- **IDs:** F23–F24, E01, N16, N17, N59, S23, U14, X01–X04.
- **Build:** PREVENT Stage 1 with the privacy guard; the seven-signal overlap matcher with exact weights and the exact banner text; PREVENT Stage 2 returning CLEAR, REVIEW or UNKNOWN; silent co-signing.
- **Verify:** U14 passes. The banner "Potential Overlapping Cases – Coordination Required" shows on /dashboard, /institutions/:id and /review.
- **Done when:** PREVENT never blocks or merges anything and never shows third-party data. Thresholds and C1–C5 stay configurable until the 23 Oct PDF arrives.

### S5 Closure and recovery
- **Goal:** a case can be closed only with proof, appealed, rescued when stuck and measured.
- **IDs:** F26, F43, F52, N22–N26, N29, N30, N35, N51, N55, N62, N63, N71, N76, N77, N80, S19, S22, S27, U24–U28, U30–U32.
- **Build:** NEXUS PROOF closure gate (approver differs from proposer); feedback; NEXUS RESCUE with its four triggers; multi-level appeal; NEXUS IMPACT reports with denominators; complainant workspace /track; institution admin redacted view; Competent Authority workspace; email and SMS simulators; Retaliation Watch; export watermark; redaction helper; QR receipt.
- **Verify:** U24–U28 and U30–U32 pass. Try to close a case with an open task, and as a complainant try to open someone else's case.
- **Done when:** the system never closes a case on its own, and no role sees what it shouldn't.

### S6 Differentiators
- **Goal:** the features that make judges remember you.
- **IDs:** F28, F36–F38, E03–E05, E07–E10, N32, N33, N46, N47, N50, N57, N61, U15. F05, F06 and N15 are counted in S1 but get their differentiator and extra-channel parts finished here.
- **Build:** graph and radar views; Judge Demo Mode; click-a-number drill-down; overlap timeline; integrity fingerprint page; cross-institution pattern alert; PWA, email intake and CSV import; adapter interface stubs for N32 and N33; the accuracy benchmark.
- **Verify:** Judge Demo Mode runs the two-bureau story start to finish with no manual database edits.
- **Done when:** the judge script in `docs/JUDGE_SCRIPT.md` works step by step.

### S7 Release evidence
- **Goal:** prove everything, and admit honestly what isn't done.
- **IDs:** N34, S08, S13, S30, T01–T30, X05–X22, D01–D26.
- **Build:** a negative-role sweep for every role; LIMITATIONS.md; SECURITY_REVIEW.md; screenshots of every route; the judge flow test run three times.
- **Verify:** run `prompts/FINAL_AUDIT.md` in a new conversation.
- **Done when:** there is no critical privacy or identity failure, every ID is DONE, GAP with a reason, BLOCKED-SOURCE, PLANNED-P2 or NOT-ADOPTED, and the judge script has been rehearsed twice.

### SB Waiting on sources
- **IDs:** F25, F27, F40–F42, F44, F55, F57–F64, and N36–N45.
- **What happens:** these have no stage in your roadmap and no defining text yet. When you send the 23 Oct PDF and the N36–N45 text, I fill in Part B of SPEC.md and place each ID into the right stage. You then run that stage's prompt again for just those IDs.

## Coverage check

All 349 IDs are accounted for, each in exactly one phase: 7 + 130 + 25 + 20 + 12 + 30 + 19 + 78 + 25 + 3 not built = 349. That covers F01–F64, E01–E10, N01–N80, S01–S30, R01–R55, U01–U32, T01–T30, X01–X22 and D01–D26. Running `node scripts/trace-check.js` on the pack today reports 349 rows, 349 expected and no violations. The same command fails the moment any ID is missing, duplicated or wrongly marked DONE.
