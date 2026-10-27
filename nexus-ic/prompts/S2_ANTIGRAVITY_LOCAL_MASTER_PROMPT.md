Follow RULES.md for this whole conversation. This is phase S2 ONLY.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in RULES.md, PARALLEL_PLAN.md and this prompt. Do not run any git command.

ROLE
You are the lead engineer and quality owner for the trust-and-routing layer of AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264. You build NEXUS RULEBOOK (every policy as a versioned, approved rule), NEXUS ROUTE (every case routed with a visible reason), risk and priority, and the truthful case lifecycle. You think before you code, you never guess, and you prove every claim with a passing test. Your standard: no case is ever silently assigned, no rule is ever changed without a version and a second person, and no number is invented.

WORKSPACE (check this first)
- You work directly in this folder (nexus-ic). Do not create branches, copies or worktrees.
- S0, S1a and S1b (including the S1b fixes) are in this folder. Check that these exist: server/src/modules/cases/Case.js, server/src/middleware/rbac.js, client/src/routes/s1b.jsx with /admin/master/categories. If the S1b fixes are not done, STOP and tell me.
- Codex is building S4 (NEXUS PREVENT) in this SAME folder at the same time: server/src/modules/prevent/, client/src/pages/prevent/, client/src/routes/s4.jsx, s4-* tests, plus its S1a files (identity/, consent/, vault/, sysadmin/, pages/trust/, pages/admin/). Never edit them. If one of its tests fails, report it; do not touch it.
- In shared files, only append your own lines and never change or remove anyone else's lines. Re-read a shared file from disk right before you edit it. Do not run npm install while Codex might be running it; ask me first.
- Run tests only as (PowerShell): $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test

CONTEXT (read fully before anything else; do not skim)
1. RULES.md (binding; wins over this prompt) and PARALLEL_PLAN.md (ownership, contracts).
2. docs/SPEC.md sections 8.1, 8.2, 8.4, 9.1, 10.1 (closure gate rules only, for the CLOSURE_REQUIREMENTS family), 11 (the whole RuleBook table and controls), 13 (rows S20, S25, S29), 15.1 (routing_decisions, rule_book_versions, cases extended), 15.2 (routing and rulebook routes), 16 (U16 to U19, U22, U29), 17 (auto-routing and SLA rows), Appendix V (layer 5 chain), Appendix W (step 5, rows N73 and N78). If SPEC.md and docs/NEXUS-IC_Unified_24Oct.pdf differ, the PDF wins.
3. docs/ADDITIONS.md row N65 and the ground rules.
4. FEATURES.md rows of your IDs.
5. Existing code: S1b's Case.js (it already has status 'SUBMITTED', owningBureau, routingDecisionId and a priority field), caseService.js, rbac.js canAccessCase, institutions (type, region), the DEMO-CATEGORIES-v1 table (with sensitive flags); S1a's identity/index.js checkEligibility (it expects a RuleBook family ELIGIBILITY); S4's server/src/modules/prevent/rules.js and defaults.js if they exist (S4 calls your getActiveRule('OVERLAP_DETECTION')).

NON-NEGOTIABLE RULES (summary of RULES.md; RULES.md wins)
- Nothing missed, nothing changed, nothing merged. Keep exact names: NEXUS RULEBOOK, NEXUS ROUTE, the demo rule IDs DEMO-ROUTE-v1, DEMO-CASE-STANDARD-v1, DEMO-CASE-PRIORITY-v1, DEMO-TRANSFER-ACK-v1, DEMO-SYNC-ACK-v1, DEMO-TASK-v1, DEMO-RESCUE-v1, the states REGISTERED, ROUTED, ASSIGNED, the nine statuses (Registered/Submitted, Assigned, Under Process, Transfer Requested, Transfer Accepted, Under Review, Resolution Proposed, Verified/Approved, Closed), the analytic statuses PENDING, IN_PROCESS, DISPOSED, and priorities normal, high, urgent.
- Never invent missing source. F14, F17, F18, F19 have no hint: build nothing for them. F15, F16, F39, F48, F49, F56 have hints: build only what the hint says (see SCOPE) and leave all ten BLOCKED-SOURCE with Notes. Appeal rules are not seeded: POLICY_NOT_CONFIGURED. ELIGIBILITY is not seeded: POLICY_NOT_CONFIGURED. No AICTE-wide deadline is assumed anywhere.
- Every number you need (SLA days, confidence threshold, keyword lists, transfer window) lives ONLY in a DEMO-* RuleBook version labelled synthetic with the note "not from source; replace with AICTE policy". No number appears in code outside the RuleBook seed. In APP_MODE=production demo rules cannot be selected; a missing approved rule gives POLICY_NOT_CONFIGURED or UNKNOWN.
- Routing assigns work; it never decides the merits of a complaint, never closes or rejects, and never moves ownership after assignment (later moves are NEXUS TRACE, S3). Deterministic RuleBook rules run first; there is no ML ranking in this build (say so). Ambiguous or low-confidence cases go to a human triage queue and are never silently assigned.
- Priority is a workload signal with a visible reason, never a guilt, risk or compliance score for an institution. A human confirms every sensitive flag.
- PREVENT is S4 (Codex). Do not build similarity, overlap or action-conflict logic.
- DONE means proven: real file paths in "Built in" plus a passing test titled "[<ID>] ..." (additions "[A-Nxx] ..."). Never skip or weaken a test. Every state change calls audit.record(); every route uses authorize(...); every case read goes through canAccessCase.
- Fixed stack, no TypeScript, no Digital Twin, synthetic data only, no complaint text or identity in logs, notifications or exports (S0 safe logger only). Any new dependency goes in the plan for my approval.

SCOPE: exactly these 25 IDs
RuleBook:
- N27 NEXUS RULEBOOK (SPEC 11): one versioned registry with every family in the SPEC 11 table: JURISDICTION and ROUTING (DEMO-ROUTE-v1), SLA (DEMO-CASE-STANDARD-v1, DEMO-CASE-PRIORITY-v1), TRANSFER (DEMO-TRANSFER-ACK-v1, which SPEC 9.2 gives as 2 business days), ESCALATION (per the policies above), COORDINATION (DEMO-SYNC-ACK-v1, DEMO-TASK-v1), RESCUE (DEMO-RESCUE-v1 with the four synthetic triggers in SPEC 10.2), APPEAL (not seeded, POLICY_NOT_CONFIGURED); plus SENSITIVITY (versioned keyword rules for N19) and ELIGIBILITY (not seeded, for S1a's N69). Controls: every edit creates a new immutable version with an effective date, never retroactive; two-step approval (requester differs from approver, S20); a dry-run against a fixture set of synthetic cases (server/src/modules/rulebook/fixtures/) is required before approval; every step audited. API: GET, POST /api/v1/rulebook/families and /versions, plus request, dry-run, approve.
- Export from server/src/modules/rulebook/index.js exactly: getActiveRule(family, at = new Date()) returning { family, versionId, ruleId, body, effectiveFrom, demo } for the approved version in force at that time, or { result: 'POLICY_NOT_CONFIGURED' }. S4 (Codex) and S1a call this name. Document it in server/src/modules/rulebook/README.md.
- N78 RuleBook families "Overlap Detection Rules" (OVERLAP_DETECTION) and "Closure Requirements" (CLOSURE_REQUIREMENTS). OVERLAP_DETECTION: if server/src/modules/prevent/defaults.js exists, seed DEMO-OVERLAP-v1 by importing its values read-only so S4 and the RuleBook agree; if it does not exist yet, leave the family unseeded and say so. CLOSURE_REQUIREMENTS: seed DEMO-CLOSURE-v1 with only what SPEC 10.1 states (evidence required, approver differs from proposer); S5 will use it.
- N65 RuleBook what-if preview (ADDITIONS.md): before approval, a read-only view of which open cases would change route or SLA under the pending version, reusing the dry-run. It never changes a case.
- F39 (hint: RuleBook partial) is covered by N27: Notes only, stays BLOCKED-SOURCE.
Routing:
- N18 NEXUS ROUTE (SPEC 8.1): uses all six factors (category and sub-category; institution type and AICTE region; bureau and cell jurisdiction rules; existing ongoing cases for the same institution; policy and regulatory guidelines; confidence score with its explanation). Output: primary bureau or cell, secondary if required, manual review if ambiguous or confidence is below the RuleBook threshold, and the reason stored with the rule version. Each decision is an immutable routing_decisions record { caseId, primary, secondary, confidence, reasons, ruleVersion, overriddenBy, reason }. POST /api/v1/routing/:caseId/decide and /override. Routing runs automatically right after submission: add one call in S1b's caseService.submitGrievance (you own S1b too).
- Override (U17): only with a recorded reason, audited, creating a new decision record that points to the old one; the old record is never edited.
- States (SPEC 8.4): REGISTERED, then ROUTED (with decision record), then ASSIGNED (officer named). A human triage queue at /triage for supervisor and competent_authority holds every manual-review case; nothing in it is assigned automatically. Assignment to an officer is a human action with the officer named.
- N73 Bureaus and cells as configurable units: PGRC, RB, Academic Bureau (AB), Approval Bureau (APB), Skill Education Bureau (SEB), Training and Learning (TL), Regional Offices, other cells. Seed them in a bureaus collection you own; add seed officers for each so routing has somewhere to go. Keep S0's two bureaus working.
Risk and priority:
- N19 (SPEC 8.2): automatic priority normal, high or urgent from category, sensitivity and age, with the reason shown to the officer. Sensitivity detection from category plus versioned SENSITIVITY keyword rules, run locally on the original text (any script, no outside service). Every sensitive flag is a suggestion until a human confirms it (U18); confirmed sensitive cases get restricted handling. SLA timeline by category from the RuleBook with a policy clock. Policy and compliance flags for officers. Urgent maps to DEMO-CASE-PRIORITY-v1. Never a score for an institution.
- U19: a priority change starts a new clock segment under the RuleBook version in force at that moment; earlier segments and old cases keep their old version. Never retroactive.
- S25 Anti-retaliation: no reporter identity in notifications, exports or logs; sensitive cases get restricted handling. Restricted handling is not defined in the source: use narrative and documents visible only to the owning bureau's officers, supervisor and competent_authority, never institution_admin, and list it as a question.
Lifecycle:
- N28 True and transparent complainant status (SPEC 9.1): all nine statuses, the four parallel tracks (case status, transfer status, current owner, SLA clock with escalation), the F09 analytic mapping table exactly as in SPEC 9.1 (Escalated is a flag, not a status), and the rule that a transferred case never reverts to Registered or Submitted (enforce it in a transition guard and test it; the U22 row itself is S3's). Map S1b's existing 'SUBMITTED' to Registered without renaming stored values. Complainant view (on S1b's /my/cases/:caseId page, one inserted component): exact current status, no false closure, owner shown as office and role only, full status history, SLA clock and escalation in summary. Internal notes, other bureaus' narratives and identity stay hidden.
- Extra case fields (transferStatus, currentOwner, assignedOfficerId, slaClock segments, sensitivityFlags, analyticStatus) go in a schema plugin from your module registered in server/src/models/plugins.js, unless they already exist in Case.js. Take over the existing priority field: S2 is now the only code that sets it.
Security and operations:
- S20 Requester differs from approver on sensitive approvals: RuleBook approvals and sensitive-flag confirmations at least. Test both.
- S29 Backup, restore, import replay: scripts/backup.js writes a JSON export of the demo database (never VAULT_KEY or DOCS_KEY, and vault payloads stay encrypted); scripts/restore.js restores only into a database whose name ends in _demo and asks before overwriting; import replay is idempotent through the unique (sourceSystem, sourceCaseRef) index, so replaying the same import twice creates no duplicates. Leave S1a's BackupSimulator button as it is and note the link in the report.
- F15 and F49 (hints: CSV import preview, dry-run, idempotent commit): build the server-side import engine only (preview, dry-run, idempotent commit through externalRefs); the import channel and UI are S6. Leave both BLOCKED-SOURCE with Notes.
- F16 (hint: reopen; appeals are new events): build nothing; appeals are S5. Notes only.
- F48 and F56 (hint: registry unavailable shows UNKNOWN): already built by S1b's N10. Notes only, plus one routing test: when the registry is unavailable, routing gives manual review with an UNKNOWN reason and no zero values.
- F14, F17, F18, F19: BLOCKED-SOURCE, no hint, build nothing.
Acceptance tests:
- U16 Routing returns primary, secondary and reason; ambiguous goes to manual review.
- U17 Route override requires a reason and is audited.
- U18 Sensitive category is flagged, human-confirmed, and restricted.
- U19 Priority change alters the clock via a RuleBook version, never retroactively.
- U29 RuleBook edit makes a new version with dry-run and two-step approval.

OWNERSHIP (from PARALLEL_PLAN.md)
- You own: server/src/modules/rulebook/, routing/, priority/, lifecycle/, bureaus/, scripts/backup.js, scripts/restore.js, the models rule_book_versions, routing_decisions, bureaus, the case lifecycle plugin, client pages under client/src/pages/rulebook/, routing/ and lifecycle/, client/src/routes/s2.jsx, client/src/i18n/s2.en.json and s2.hi.json, tests server/tests/s2-*.test.js and client/tests/s2-*. You also still own S1b.
- Server routes: append ONE line per module at the bottom of server/src/routes.js in the existing style. Client routes: s2.jsx is picked up automatically.
- Do not touch prevent/ or case_actions (S4). If S4's rules.js already reads getActiveRule, make sure your return shape matches what it expects and say so in the report.
- Seed: append to the S0 seed so npm run reset gives the full DEMO RuleBook, all N73 bureaus with officers, and the seeded S1b cases routed, with at least one in the triage queue and one confirmed sensitive.
- FEATURES.md: edit only your 25 rows (and your S1b rows if a fix touches them). Never reorder or reformat the table.

UI (SYNTHETIC DATA banner on every page; Hindi and English through the i18n loader)
- /rulebook (system_admin can request; supervisor and competent_authority can approve; auditor can read): families, versions with effective dates, request a change, dry-run results, what-if preview (N65), approve (only by a different person).
- /triage (supervisor, competent_authority): manual-review cases with the routing reasons; assign to a named officer or route with a reason.
- Case routing panel on the officer case view: primary, secondary, confidence, reasons, rule version, override with reason, decision history.
- Sensitive flags: suggestion, confirm or dismiss with reason (by a different person from the one who raised it, where applicable).
- Complainant status component on /my/cases/:caseId.

TESTS TO WRITE (titles must start with the tag)
[U16] [U17] [U18] [U19] [U29], one or more [<ID>] per N and S row: [N18] [N19] [N27] [N28] [N73] [N78] [S20] [S25] [S29], plus [A-N65], and hard-negative tests. Include at least these:
- [N27] editing a rule never changes an existing version; a version without a dry-run cannot be approved; approval by the requester is 403; a case opened under v1 keeps v1's clock after v2 takes effect.
- [N27] APP_MODE=production cannot select any DEMO-* rule; a family with no approved rule returns POLICY_NOT_CONFIGURED.
- [N27] getActiveRule('OVERLAP_DETECTION') returns the shape S4 expects (or POLICY_NOT_CONFIGURED), and getActiveRule('ELIGIBILITY') returns POLICY_NOT_CONFIGURED.
- [N18] every decision has primary, reason and ruleVersion; low confidence or no matching jurisdiction goes to triage and is never assigned; routing records are immutable (an update attempt fails).
- [N28] the nine statuses and the F09 mapping table match SPEC 9.1 exactly; a case that has had a transfer can never move back to Registered.
- [N19] priority has a visible reason and never appears on an institution page as a score; sensitivity from Hindi and Tamil keyword rules works locally with no network call.
- [S25] notifications, exports and logs created by S2 contain no reporter identity and no complaint text; institution_admin cannot read a confirmed sensitive case's narrative.
- [S29] backup then restore into a _demo database reproduces the cases; restore refuses a database not ending in _demo; replaying the same import twice creates no duplicate.
- [A-N65] the what-if preview lists the open cases whose route or SLA would change and changes nothing.
- Hard negatives: a student, an institution_admin and an auditor cannot request, approve, override or assign (403).

HOW TO WORK
Step 1. Read every file in CONTEXT. Run node scripts/trace-check.js --stage S2 and paste its output.
Step 2. Write a PLAN with: (a) one line per ID: what, which files, which test; (b) the folder tree you will add; (c) every DEMO value you will seed, by family; (d) the one call you will add to submitGrievance and the plugin fields; (e) any dependency and why; (f) open questions (at least: restricted-handling roles, DEMO SLA days, confidence threshold, who confirms sensitive flags). Save it to plans/S2.md. Then STOP and wait for my approval.
Step 3. After approval, build in small steps: RuleBook model, versions, dry-run, approval, getActiveRule; seed; bureaus; routing engine and decisions; triage and assignment; priority and sensitivity; lifecycle guard and complainant status; backup, restore, import replay; then the client pages. Run the relevant tests after each step.
Step 4. Verify:
   - npm test as above: every test passes (S0, S1a, S1b, S4 if present, S2), none skipped, test-results/results.json written. If an S4 test fails, report it and do not edit it.
   - npm run reset, then npm run dev: submit a grievance as trust_student_verified and see it routed with a reason; as supervisor1 open /triage and assign a case; as system_admin request a rule change, dry-run it, see the what-if preview, and approve it as competent_authority.
   - Update FEATURES.md for your 25 rows (Status, Built in, Proved by, Notes). Never edit the ID, Title, Source, Pri or Stage columns.
   - Re-read the shared files (server/src/routes.js, server/src/models/plugins.js, caseService.js, package.json, FEATURES.md) from disk: your lines are there and Codex's lines are untouched. Run npm test once more.
   - node scripts/trace-check.js --stage S2 must print "No violations". Paste the full output.
Step 5. Self-review: re-read RULES.md, PARALLEL_PLAN.md and every scope line above, and list anything you did not do.

FINAL REPORT (print it here AND save it to plans/S2_REPORT.md, exactly this shape)
- DONE: IDs
- IN-PROGRESS or GAP: IDs with reasons
- BLOCKED-SOURCE: F14 to F19, F39, F48, F49, F56, with what was built from each hint
- DEMO values seeded, by family
- Contract for other phases: getActiveRule and every exported function (rulebook/README.md), the lifecycle transition API for S3, CLOSURE_REQUIREMENTS for S5
- Test summary: passed / failed / skipped counts
- trace-check output (full)
- How I can see it: URLs, demo accounts, steps
- Decisions and open questions I should know about
- Every file you created or changed (one list)

DONE WHEN
Every new case is routed with a visible reason and rule version, or waits in human triage; no rule changes without a new version, a dry-run and a second person; no clock changes retroactively; the complainant sees the true status; no number lives outside the RuleBook; every test passes; trace-check --stage S2 prints "No violations"; nothing outside your scope was touched; no git command was run; and plans/S2_REPORT.md is saved.
