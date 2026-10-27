Follow RULES.md for this whole conversation. This is phase S3 ONLY.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in RULES.md, PARALLEL_PLAN.md and this prompt. Do not run any git command.

ROLE
You are the lead engineer and quality owner for NEXUS TRACE and NEXUS SYNC in AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264. You make sure a case can move between bureaus with nothing lost, that bureaus can coordinate without leaking what they should not, and that at every moment every case has exactly one accountable owner. You think before you code, you never guess, and you prove every claim with a passing test.

WORKSPACE (check this first)
- You work directly in this folder (nexus-ic). Do not create branches, copies or worktrees.
- S0, S1a, S1b, S2 and S4 are in this folder and npm test is green. Check that server/src/modules/rulebook/index.js (getActiveRule), the S2 lifecycle transition API and server/src/modules/prevent/ (case_actions, check-action) exist. If not, STOP and tell me.
- Codex is building S6a (PWA, email intake, CSV import channel, integrity page, benchmark, adapter stubs) in this SAME folder at the same time, in server/src/modules/channels/, pwa/, integrity/, benchmark/, adapters/ and client/src/pages/channels/, integrity/, benchmark/, client/src/routes/s6a.jsx, s6a-* tests, plus its S1a and S4 files. Never edit them. If one of its tests fails, report it; do not touch it.
- Overlap guard: touch only files you own; in shared files only append your own lines, re-read the file from disk right before editing, and never change anyone else's lines.
- Run tests only as (PowerShell): $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test . Run node --check on every file you change. Do not run npm install while Codex might be running it; ask me first.

CONTEXT (read fully before anything else; do not skim)
1. RULES.md (binding; wins over this prompt) and PARALLEL_PLAN.md.
2. docs/SPEC.md sections 9.1 (statuses and tracks), 9.2, 9.3, 9.4, 12.3, 13 (rows S17, S18, S24), 15.1 (communication_log), 16 (U20 to U23), Appendix V (layer 6, including "New Owner Active" and its caption), Appendix W (steps 7 to 9, rows N70, N72, N74, N75). If SPEC.md and docs/NEXUS-IC_Unified_24Oct.pdf differ, the PDF wins.
3. docs/ADDITIONS.md rows N54, N60 and the ground rules.
4. FEATURES.md rows of your IDs.
5. Existing code: S2's rulebook (DEMO-TRANSFER-ACK-v1, DEMO-SYNC-ACK-v1, DEMO-TASK-v1), routing, lifecycle and bureaus; S1b's cases, documents, rbac.js canAccessCase and abac.js; S4's server/src/modules/prevent/README.md (case_actions schema, check-action); S1a's identity/index.js (toOfficerView) and vault reveal audit events.

NON-NEGOTIABLE RULES (summary of RULES.md; RULES.md wins)
- Nothing missed, nothing changed, nothing merged. Keep exact names: NEXUS TRACE, NEXUS SYNC 2.0, the sequence Transfer Requested -> Acceptance Pending -> Transfer Accepted -> New Owner Active, the caption "Original Case ID remains same. Last accountable owner always recorded.", and the N75 steps "Share Case Information", "Record Coordination Requests and Responses", "Agree on Next Steps (where applicable)", "Each Unit Continues Its Assigned Work", "Maintain Shared Coordination Log".
- "New Owner Active" is the owner switch that happens on acceptance, NOT a new status; do not add a status to SPEC 9.1.
- Never invent missing source. F20, F21, F22 and E06 have no hint: build nothing for them. E02 (hint: SYNC state machine, SPEC 9.3): build only the steps SPEC and Appendix W name. All five stay BLOCKED-SOURCE with Notes. T15 is in the 23 Oct PDF: do not write a [T15] test.
- Every time window (transfer acknowledgement, SYNC acknowledgement, task clocks, insider thresholds) comes ONLY from the RuleBook via getActiveRule. Business days exclude Saturday and Sunday; there is no holiday calendar in the source, so say so in Notes and do not invent one.
- The system never moves ownership on its own, never closes a case and never rejects a grievance. Escalation only alerts people. Task completion is never case disposal.
- Internal notes never reach the complainant or the institution admin. Cross-bureau notices are blind and opaque: the other bureau learns only that a related matter exists and who to contact, never the narrative, documents or reporter.
- DONE means proven: real file paths in "Built in" plus a passing test titled "[<ID>] ..." (additions "[A-Nxx] ..."). Never skip or weaken a test. Every state change calls audit.record(); every route uses authorize(...); every case read goes through canAccessCase.
- Fixed stack, no TypeScript, no Digital Twin, synthetic data only, no complaint text or identity in logs, notifications or exports. Any new dependency goes in the plan for my approval.

SCOPE: exactly these 20 IDs
- N20 NEXUS TRACE (SPEC 9.2 and layer 6): a transfers collection; POST request, accept, reject; all 6 rules: (1) the Master Case ID never changes; (2) every transfer must be acknowledged by the receiving bureau; (3) at every moment a case has one accountable owner, or an open transfer with a named sender who stays accountable; (4) escalation fires if not acknowledged within DEMO-TRANSFER-ACK-v1 (2 business days), alerting the supervisors of both bureaus, never moving the case; (5) full transfer history with timestamps; (6) a rejection returns the case to the sender's queue with its reason, nothing reassigned silently. Status changes go through S2's lifecycle API (Transfer Requested, Transfer Accepted); on acceptance the owner switches (New Owner Active) and the last accountable owner is recorded. An escalation checker runs on a timer and can be triggered on demand for the demo.
- N21 NEXUS SYNC 2.0 (SPEC 9.3): shared view of all related cases for an institution (only cases the officer may access; the rest as "N restricted entries"); coordination requests and responses following the five N75 steps; tasks with DEMO-TASK-v1 clocks and DEMO-SYNC-ACK-v1 acknowledgement; document sharing only through scoped, time-bound grants (S18); internal notes for in-scope officers only (S24); one append-only communication_log { caseId or coordinationId, from, to, channel, at } (no message bodies with complainant text in the log); prevention of conflicting instructions by calling S4's check-action before an instruction is recorded (advisory, the officer can proceed); escalation of unresolved inter-departmental items. Completing a task never changes case status to Closed.
- N75 the SYNC steps "Agree on Next Steps (where applicable)" and "Each Unit Continues Its Assigned Work": an agreement record (who agreed, what, when) and each unit keeps its own tasks and ownership.
- N70 Query and response loop: officers send queries or information requests to the complainant or the institution; they answer with clarifications and documents; every query and reply is logged and timed. The complainant sees and answers queries addressed to them on /my/cases/:caseId; the institution admin sees only queries addressed to the institution, in the redacted form.
- N72 Process the Complaint with role-specific officer actions: preliminary scrutiny (PGRC); regulatory review / expert visit and recommend regulatory action (RB); take action as per jurisdiction (other bureaus); recommend transfer/escalation; recommend closure or further action (a recommendation only; closure is S5). Record each action in S4's case_actions (extend it only by a schema plugin in your module) and show S4's "Check before acting" result first. SPEC 9.4: every step records actor, time, remark and evidence.
- N74 Regional Office field verification: arrange inspections / site verification, provide regional inputs and reports, upload field documents (through S1b documents, scrubbed and encrypted).
- N54 Insider-access alerts (ADDITIONS.md): a new RuleBook family INSIDER with DEMO-INSIDER-v1 (created through S2's RuleBook, versioned and approved like any rule) flags bulk case opening, out-of-scope search attempts, unusual exports and repeated reveal requests (read S1a's identity.reveal.* audit events) to the supervisor. Warning only; never blocks an officer; each alert shows the rule and the counts.
- N60 Absence-aware ownership (ADDITIONS.md): an officer cannot be marked on leave or moved while they still own open cases; every owned case must first be handed over through NEXUS TRACE. Show which cases block it.
- S17 Blind, opaque cross-bureau notices. S18 Purpose-bound, time-boxed disclosure grants (purpose required, expiry enforced on every read, audited, revocable). S24 Internal notes never reach the complainant.
- U20 Transfer needs acknowledgement, escalates after the window, owner always visible. U21 Rejected transfer returns to the sender's queue with its reason. U22 A transferred case never reverts to Registered. U23 Internal notes are invisible to the complainant.
- E02 (hint only), E06, F20, F21, F22: BLOCKED-SOURCE, see the rules.

OWNERSHIP
- You own: server/src/modules/trace/, sync/, queries/, fieldwork/, insider/, absence/, the models transfers, coordinations, tasks, disclosure_grants, internal_notes, communication_log, queries, field_visits, insider_alerts, client pages under client/src/pages/trace/, sync/, queries/, fieldwork/, client/src/routes/s3.jsx, client/src/i18n/s3.en.json and s3.hi.json, tests server/tests/s3-*.test.js and client/tests/s3-*. You also still own S1b and S2.
- Server routes: append ONE line per module at the bottom of server/src/routes.js in the existing style. Client routes: s3.jsx is picked up automatically. Schema changes to models you do not own go through server/src/models/plugins.js (append one import and one registry.push line).
- Seed: append so npm run reset includes one case with an open transfer, one rejected transfer, one overdue unacknowledged transfer, one SYNC coordination between PGRC and RB, one query to a complainant and one field visit.
- FEATURES.md: edit only your 20 rows (and U12's Notes, if your transfer test re-proves the Master Case ID). Never reorder or reformat the table.

UI (SYNTHETIC DATA banner on every page; Hindi and English through the i18n loader)
- Officer case view: Transfer panel (request with reason, accept, reject with reason, full history, current owner and "last accountable owner"), SYNC panel (related cases, coordination steps, tasks, grants, internal notes), Queries panel, Actions panel with S4's check first, Field verification panel for regional officers.
- /transfers (officers): incoming transfers awaiting acknowledgement, with time left in business days; outgoing open transfers.
- /sync/:institutionPid: the shared institution view.
- Supervisor: escalations and insider alerts list.
- Complainant (/my/cases/:caseId): queries addressed to them with a reply form; the status history shows transfers as office and role only; never internal notes.

TESTS TO WRITE (titles must start with the tag)
[U20] [U21] [U22] [U23], [N20] [N21] [N70] [N72] [N74] [N75] [S17] [S18] [S24], [A-N54] [A-N60]. Include at least these:
- [U20] an unacknowledged transfer escalates after exactly 2 business days (test across a weekend with a fake clock), the case does not move, and the sender stays the named accountable owner throughout.
- [N20] an invariant test: after every step of request, accept, reject and escalate, the case has exactly one accountable owner or one open transfer with a named sender; the Master Case ID never changes.
- [U21] rejection without a reason is 400; with a reason the case is back in the sender's queue and nothing else changed.
- [U22] after any transfer the lifecycle can never return to Registered/Submitted (try every path).
- [U23] and [S24] every complainant-facing and institution-admin response is scanned and contains no internal note text or note IDs.
- [S17] the counterpart bureau's notice contains no narrative, document, reporterId or complainant field.
- [S18] a grant without purpose is 400; after expiry the document is refused and the refusal is audited; revocation works.
- [N21] completing every task leaves the case status unchanged; a conflicting instruction shows S4's REVIEW result and can still be recorded.
- [N70] a query and its reply are logged with times; the institution admin never sees queries addressed to the complainant.
- [A-N54] repeated reveal requests and bulk case opening raise a supervisor alert with the rule ID and counts, and never block the officer.
- [A-N60] marking leave with an owned open case is refused and lists the case; after a TRACE handover it succeeds.
- [S28 regression] TRACE, SYNC and queries never write complaint text or identity to the logger or the communication_log.

HOW TO WORK
Step 1. Read every file in CONTEXT. Run node scripts/trace-check.js --stage S3 and paste its output.
Step 2. Write a PLAN with: (a) one line per ID: what, which files, which test; (b) the folder tree; (c) the lifecycle calls you will use from S2 and the case_actions plugin fields; (d) the DEMO-INSIDER-v1 values; (e) any dependency and why; (f) open questions (at least: who receives escalations, holiday calendar, /sync access roles). Save it to plans/S3.md. Then STOP and wait for my approval.
Step 3. After approval, build in small steps: transfers and the owner invariant, escalation, history; SYNC coordination, tasks, grants, notes, communication log; queries; officer actions and field verification; insider alerts; absence; then the client pages. Run the relevant tests after each step.
Step 4. Verify:
   - npm test as above: every test passes, none skipped, test-results/results.json written. If a Codex test fails, report it and do not edit it.
   - npm run reset, npm run dev: as an RB officer request a transfer to PGRC; as a PGRC officer reject it with a reason, then accept a second one; trigger the escalation check on the overdue seed transfer; as the complainant see the transfer only as office and role and answer a query.
   - Update FEATURES.md for your rows. Re-read the shared files (server/src/routes.js, server/src/models/plugins.js, package.json, FEATURES.md) from disk and check Codex's lines are untouched. Run npm test once more.
   - node scripts/trace-check.js --stage S3 must print "No violations". Paste the full output.
Step 5. Self-review: re-read RULES.md, PARALLEL_PLAN.md and every scope line, and list anything you did not do.

FINAL REPORT (print it here AND save it to plans/S3_REPORT.md)
- DONE / IN-PROGRESS or GAP (with reasons) / BLOCKED-SOURCE (with what was built near each)
- DEMO values used and their RuleBook versions
- Contract for S5: how closure reads transfers, tasks and coordination state (S5's closure gate must refuse while a transfer or task is open)
- Test summary, full trace-check output, how I can see it, decisions and open questions, every file you created or changed

DONE WHEN
Every case has exactly one accountable owner at every moment; transfers are acknowledged, escalated or returned with a reason and never silent; bureaus coordinate through blind notices, scoped grants and an append-only log; internal notes never reach the complainant; every test passes; trace-check --stage S3 prints "No violations"; nothing outside your scope was touched; no git command was run; and plans/S3_REPORT.md is saved.
