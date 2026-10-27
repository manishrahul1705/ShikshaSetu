You are running as Codex, locally. Follow AGENTS.md. LOCAL RUN, NO GIT: run no git command.
This is an AUDIT ONLY: do not edit any file except plans/S1b_AUDIT.md. Antigravity built S1b (institutions, registry, grievance intake, cases); you built S1a. Audit S1b with fresh eyes.

Follow prompts/AUDIT.md exactly, with "Stage to audit: S1 (the S1b IDs listed in prompts/S1b_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md)". Run tests as: $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test (if you cannot reach MongoDB, say so and use the latest test-results/results.json, stating its time).

Also check at least these, against prompts/S1b_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md, and report each as OK or MISSING with file and line:
1. Pages: /institutions/lookup, /institutions/:id, /review/identity, /grievances/new, /my/cases, /admin/master/institutions, /admin/master/categories, /admin/master/regions (system_admin, so the N79 Master data tab finds them).
2. /track/:caseId is S5's route (complainant tracking). Is S1b claiming it? Report it; do not judge it a failure if it is only a stub.
3. The S1a contract: setRevealScopeResolver registered from S1b code with canAccessCase; recordFraudSignal('burst_submissions') called over the DEMO threshold; toOfficerView used for officer-facing reporter fields.
4. The cases model stores a userId next to reporterId. The contract says a case stores only reporterId (RP-xxxx). Report whether userId is ever returned to officers, institution admins or exports, and whether it is needed.
5. The cases model has a priority field with a default. Priority belongs to S2 (N19). Report whether anything sets it.
6. DEMO-REGIONS-v1 and DEMO-CATEGORIES-v1 are labelled synthetic, and production mode refuses them.
7. N67: the original text is stored byte for byte, with no outside service.
8. N52, S10, S11, S12, S21: documents encrypted, downloads only through the server with canAccessCase each time, no storage path or key in any response, IDOR returns 404 and is audited.
9. FEATURES.md: every S1b row marked DONE has real paths and a passing [ID] test; IN-PROGRESS rows have a reason.

Write everything to plans/S1b_AUDIT.md and end with "Safe to commit: YES / NO" and a numbered list of fixes for Antigravity, each one line, with the file to change.
