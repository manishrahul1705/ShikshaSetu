You are running as Codex, locally. Follow AGENTS.md. LOCAL RUN, NO GIT: run no git command.
This is an AUDIT ONLY: do not edit any file except plans/S2_AUDIT.md. Antigravity built S2 (NEXUS RULEBOOK, NEXUS ROUTE, priority, lifecycle); you built S4, which depends on it. Audit S2 with fresh eyes.

Follow prompts/AUDIT.md exactly, with "Stage to audit: S2 (the 25 IDs listed in prompts/S2_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md)". Run tests as: $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test (if you cannot reach MongoDB, say so and use the latest test-results/results.json, stating its time). Run node scripts/trace-check.js --stage S2 and paste the output.

Also check at least these, against prompts/S2_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md, and report each as OK or MISSING with file and line:
1. server/src/modules/rulebook/index.js exports getActiveRule(family, at) returning exactly { family, versionId, ruleId, body, effectiveFrom, demo } or { result: 'POLICY_NOT_CONFIGURED' }, and README.md documents it.
2. Every SPEC 11 family exists, with the exact demo IDs DEMO-ROUTE-v1, DEMO-CASE-STANDARD-v1, DEMO-CASE-PRIORITY-v1, DEMO-TRANSFER-ACK-v1 (2 business days), DEMO-SYNC-ACK-v1, DEMO-TASK-v1, DEMO-RESCUE-v1, DEMO-CLOSURE-v1; APPEAL and ELIGIBILITY unseeded.
3. OVERLAP_DETECTION is seeded from server/src/modules/prevent/defaults.js read-only, and your S4 rules.js now gets the same values through getActiveRule (run [N16]/[N17] again and say so). In APP_MODE=production no DEMO rule is ever returned.
4. Every rule edit makes a new immutable version, never retroactive; dry-run is required before approval; requester differs from approver (S20); every step audited.
5. Routing: all six factors, immutable routing_decisions, override only with a reason and a new record pointing to the old one (U17), manual review below the threshold, and exactly one routing call added to caseService.submitGrievance.
6. Lifecycle: the nine statuses and the F09 mapping exactly as SPEC 9.1, Escalated is a flag not a status, 'SUBMITTED' maps to Registered without renaming stored values, and a transferred case can never return to Registered/Submitted. Report the transition API S3 will call (function name, file) so Antigravity can use it.
7. Priority: S2 is the only code that sets priority; U19 clock segments are never retroactive; sensitivity flags are suggestions until a human confirms (U18); restricted handling keeps institution_admin away from a confirmed sensitive narrative.
8. S29: backup never writes VAULT_KEY or DOCS_KEY (check by searching the backup output for the key names only; never print key values), restore refuses a database not ending in _demo, import replay creates no duplicate.
9. The server-side import engine (F15, F49 hints): preview, dry-run and idempotent commit exist and are exported so S6a can call them; name the functions and file. F15, F49, F14, F16 to F19, F39, F48, F56 stay BLOCKED-SOURCE with Notes.
10. S25: no reporter identity or complaint text in S2's notifications, exports or logs.
11. Shared files: S2's lines in server/src/routes.js and server/src/models/plugins.js are appended only, and your S1a and S4 lines are unchanged.
12. FEATURES.md: every S2 row marked DONE has real paths and a passing [ID] test; IN-PROGRESS rows have a reason.

Write everything to plans/S2_AUDIT.md and end with "Safe to commit: YES / NO" and a numbered list of fixes for Antigravity, each one line, with the file to change.
