Follow RULES.md for this whole conversation.

First:
1. Read RULES.md, then the SPEC.md sections and ADDITIONS.md rows listed below, in full. Do not skim.
2. Run `node scripts/trace-check.js --stage S2` and paste its output.
3. Write a plan with one line per open ID from that output: what you will build, which file(s), which test(s). Every ID must appear in the plan. If an ID is BLOCKED-SOURCE, say exactly what you will build from its "Known" hint and what you will not build.
4. Stop and wait for my approval of the plan.

# Stage S2: Trust and routing

Read: SPEC.md sections 8.1, 8.2, 8.4, 9.1, 11, 13 (S20, S25, S29), 15 (routing_decisions, rule_book_versions, routes), 16 (U16–U19, U22, U29), 17 (auto-routing, SLA rows), Appendix V layer 5. ADDITIONS.md row N65. SPEC Appendix W rows N73 (bureaus PGRC, RB, AB, APB, SEB, TL, Regional Offices) and N78 (RuleBook families Overlap Detection Rules and Closure Requirements).

Your roadmap for S2 (SPEC 18): F14–F19, F48–F49, N18, N19, N27, N28, evidence "Hard negatives, U16–U19, U29". Also here: F39 and F56 hints, S20, S25, S29.

Key points not to miss:
- NEXUS RULEBOOK first (N27): every rule family in the SPEC 11 table with its DEMO-* ID, appeal rules not seeded (POLICY_NOT_CONFIGURED). Every edit is a new immutable version with an effective date, never retroactive, two-step approval (requester ≠ approver), dry-run against the fixture set. In production mode demo rules cannot be selected.
- NEXUS ROUTE (N18): all six factors, output primary, secondary, manual review if ambiguous or below threshold, reason stored with rule version, immutable routing_decisions record. RuleBook rules run first; any ML ranking cannot override. Override only with a recorded, audited reason. States REGISTERED → ROUTED → ASSIGNED; ambiguous cases wait in a human triage queue.
- Risk and priority (N19): normal, high, urgent from category, sensitivity and age; sensitivity from category plus versioned keyword rules; a human confirms every sensitive flag; restricted handling; priority reason shown; DEMO-CASE-PRIORITY-v1 for urgent.
- Truthful lifecycle (N28): all nine statuses, the four parallel tracks, the F09 analytic mapping table, a transferred case never reverts to Registered; the complainant view in SPEC 9.1.
- N65: RuleBook what-if preview showing which open cases would change route or SLA (read-only).

Tests: `[U16]`–`[U19]`, `[U22]`, `[U29]`, hard-negative tests, one `[<ID>]` per N and S row, `[A-N65]`.

When the plan is approved, build it. Then, before you report:
- Run `npm test` (it writes test-results/results.json). All tests must pass, including every earlier stage's tests.
- Update FEATURES.md for every ID in this stage: Status, Built in, Proved by, Notes. DONE only if the rules allow it.
- Run `node scripts/trace-check.js --stage S2` and paste the full output. It must say "No violations".
- Report in this shape:
  - DONE: IDs
  - GAP: IDs with reasons
  - BLOCKED-SOURCE: IDs and what was built from the hint
  - Anything in SPEC.md for this stage that you could not fit to an ID (should be none)
  - How I can see it working: URLs, demo accounts, steps
  - Suggested commit message: "stage S2: ..."

PARALLEL NOTES (see PARALLEL_PLAN.md)
- Branch `phase/S2-routing`. S4 (PREVENT) is built at the same time by another tool.
- Provide `rulebook.getActiveRule(family)` and seed the family 'OVERLAP_DETECTION' (N78) with DEMO values labelled synthetic and configurable; S4 depends on this function name.
- You own rule_book_versions, routing_decisions, lifecycle/status fields (via a cases plugin) and the bureaus list (N73). Do not touch prevent/ or case_actions.
