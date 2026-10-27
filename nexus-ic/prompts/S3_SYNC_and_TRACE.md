Follow RULES.md for this whole conversation.

First:
1. Read RULES.md, then the SPEC.md sections and ADDITIONS.md rows listed below, in full. Do not skim.
2. Run `node scripts/trace-check.js --stage S3` and paste its output.
3. Write a plan with one line per open ID from that output: what you will build, which file(s), which test(s). Every ID must appear in the plan. If an ID is BLOCKED-SOURCE, say exactly what you will build from its "Known" hint and what you will not build.
4. Stop and wait for my approval of the plan.

# Stage S3: NEXUS SYNC and NEXUS TRACE

Read: SPEC.md sections 9.2, 9.3, 9.4, 13 (S17, S18, S24), 15 (communication_log), 16 (U20–U23), Appendix V layer 6 (including "New Owner Active"). ADDITIONS.md rows N54, N60. SPEC Appendix W rows N70 (query and response loop), N72 (Process the Complaint with role-specific actions), N74 (Regional Office field verification), N75 (SYNC: agree on next steps; each unit continues its work).

Your roadmap for S3 (SPEC 18): F20–F22, E02, E06, N20, N21, evidence "Handshake, receipt, U20–U23". Also here: S17, S18, S24.

Key points not to miss:
- NEXUS TRACE (N20): Transfer Requested → Acceptance Pending → Transfer Accepted → New Owner Active (the owner switch on acceptance, not a new status). Same Case ID; the receiving bureau must acknowledge; one accountable owner at every moment or an open transfer with a named sender who stays accountable; escalation after DEMO-TRANSFER-ACK-v1 (2 business days); full timestamped history; rejection returns to the sender's queue with its reason; nothing reassigned silently.
- NEXUS SYNC 2.0 (N21): shared view of related cases for an institution; task coordination; document sharing only through scoped, time-bound grants (S18); internal notes visible to in-scope officers only and never to the complainant (S24); common communication log (append-only); conflicting-instruction prevention; escalation of unresolved inter-departmental cases; task completion is never case disposal. Blind, opaque cross-bureau notices (S17).
- E02, E06, F20–F22: BLOCKED-SOURCE; build only what SPEC states.
- N54 insider-access alerts with a new RuleBook family DEMO-INSIDER-v1 (warning only). N60 absence-aware ownership: an officer marking leave must hand over every owned case through TRACE first.

Tests: `[U20]`–`[U23]`, `[T15]` only if its text is in the repo, one `[<ID>]` per N and S row, `[A-N54]`, `[A-N60]`.

When the plan is approved, build it. Then, before you report:
- Run `npm test` (it writes test-results/results.json). All tests must pass, including every earlier stage's tests.
- Update FEATURES.md for every ID in this stage: Status, Built in, Proved by, Notes. DONE only if the rules allow it.
- Run `node scripts/trace-check.js --stage S3` and paste the full output. It must say "No violations".
- Report in this shape:
  - DONE: IDs
  - GAP: IDs with reasons
  - BLOCKED-SOURCE: IDs and what was built from the hint
  - Anything in SPEC.md for this stage that you could not fit to an ID (should be none)
  - How I can see it working: URLs, demo accounts, steps
  - Suggested commit message: "stage S3: ..."

PARALLEL NOTES (see PARALLEL_PLAN.md)
- Branch `phase/S3-trace`. S6a (channels, integrity) is built at the same time by another tool.
- Record officer actions (N72, N74) into S4's existing `case_actions` model; extend it only through a schema plugin in your own module.
- You own transfers, coordination, communication_log, queries (N70) and field visits (N74).
