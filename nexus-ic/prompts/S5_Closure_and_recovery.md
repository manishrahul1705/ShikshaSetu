Follow RULES.md for this whole conversation.

First:
1. Read RULES.md, then the SPEC.md sections and ADDITIONS.md rows listed below, in full. Do not skim.
2. Run `node scripts/trace-check.js --stage S5` and paste its output.
3. Write a plan with one line per open ID from that output: what you will build, which file(s), which test(s). Every ID must appear in the plan. If an ID is BLOCKED-SOURCE, say exactly what you will build from its "Known" hint and what you will not build.
4. Stop and wait for my approval of the plan.

# Stage S5: Closure and recovery

Read: SPEC.md sections 9.1 (complainant view), 10.1–10.4, 12.1, 12.2, 12.3, 13 (S19, S22, S27), 15 (closure_records, feedback_records, appeals, rescue_alerts, routes), 16 (U24–U32). ADDITIONS.md rows N51, N55, N62, N63. SPEC Appendix W rows N71 (Institute Nodal Officer actions), N76 (closure reason), N77 (the 9 IMPACT tiles), N80 (Competent Authority members and decisions).

Your roadmap for S5 (SPEC 18): N22–N26, N29, N30, N35, evidence "U24–U32". Also here: F26, F43 and F52 hints, S19, S22, S27.

Key points not to miss:
- NEXUS PROOF (N22): evidence and mandatory action records, hashed final documents, approver ≠ proposer, closure gate blocks until every task is complete, every transfer acknowledged, evidence attached and approval exists. The system never closes on its own.
- Feedback (N23) is recorded and shown to reviewers but never changes status.
- NEXUS RESCUE (N24): all four DEMO-RESCUE-v1 triggers, supervisor alerts, reason for delay, suggested next action, deduplicated by dedupeKey; reasons point to work items, not misconduct; a late feed never counts as officer delay (F43).
- Appeal and review (N25): Closed → Appeal Filed → Under Appeal Review (level 1 to n) → Upheld, Modified or Remanded; extra evidence; appeals are new events; original untouched; reviewer ≠ original resolver; window and levels from the RuleBook (POLICY_NOT_CONFIGURED if unset).
- NEXUS IMPACT (N26): resolution time, reduction in duplicate actions, bureau-wise and region-wise insights, policy recommendations that cite report rows, downloadable reports; synthetic label; numerator, denominator and scope on every percentage; "flagged" never counted as "avoided".
- Complainant workspace at /track/:caseId (N29), own cases only, IDOR denied (S21). Institution admin scoped, redacted view, never reporter identity (N30, S22). Competent Authority workspace /authority per SPEC 12.2; cannot bypass field ABAC (S19). Minimal status notices by email and SMS simulators, idempotent outbox, no narrative or PII (N35, S27).
- N51 Retaliation Watch (only with N07 consent for that purpose; advisory alert to the Authority). N55 leak-trace watermark on every export. N62 redaction helper before the institution-facing form. N63 case receipt with QR to /track/:caseId (login required).

Tests: `[U24]`–`[U32]`, one `[<ID>]` per N and S row, `[A-N51]`, `[A-N55]`, `[A-N62]`, `[A-N63]`.

When the plan is approved, build it. Then, before you report:
- Run `npm test` (it writes test-results/results.json). All tests must pass, including every earlier stage's tests.
- Update FEATURES.md for every ID in this stage: Status, Built in, Proved by, Notes. DONE only if the rules allow it.
- Run `node scripts/trace-check.js --stage S5` and paste the full output. It must say "No violations".
- Report in this shape:
  - DONE: IDs
  - GAP: IDs with reasons
  - BLOCKED-SOURCE: IDs and what was built from the hint
  - Anything in SPEC.md for this stage that you could not fit to an ID (should be none)
  - How I can see it working: URLs, demo accounts, steps
  - Suggested commit message: "stage S5: ..."
