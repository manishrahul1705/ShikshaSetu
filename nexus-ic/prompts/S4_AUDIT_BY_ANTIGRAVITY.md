Follow RULES.md for this whole conversation. LOCAL RUN, NO GIT: run no git command.
This is an AUDIT ONLY: do not edit any file except plans/S4_AUDIT.md. Codex built S4 (NEXUS PREVENT Stage 1 and Stage 2, co-signing); you built S1b and S2, which it depends on, and S3 will write into its case_actions. Audit S4 with fresh eyes.

Follow prompts/AUDIT.md exactly, with "Stage to audit: S4 (the 12 IDs listed in prompts/S4_CODEX_LOCAL_MASTER_PROMPT.md)". Run tests as (PowerShell): $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test . Run node scripts/trace-check.js --stage S4 and paste the output.

Also check at least these, against prompts/S4_CODEX_LOCAL_MASTER_PROMPT.md, and report each as OK or MISSING with file and line:
1. Exact texts: the panel title "AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)", the banner "Potential Overlapping Cases – Coordination Required" (with the en dash), the outputs CLEAR, REVIEW and UNKNOWN.
2. The seven weights are exactly issue 25, time window 15, category 10, document or subject 15, remedy 10, shared entities 10, semantic 15 (total 100), and each signal returns its reason.
3. Thresholds come only through server/src/modules/prevent/rules.js, which now reads your S2 getActiveRule('OVERLAP_DETECTION'); defaults.js DEMO-OVERLAP-v1 and DEMO-PREVENT-v1 carry the comment "not from source; replace with 23 Oct PDF values"; production mode gives UNKNOWN with POLICY_NOT_CONFIGURED.
4. PREVENT never blocks a submission or an act, never merges or links cases, and never changes status, owner, routing or priority (check that S4 writes none of your S2 fields).
5. Privacy (S23, U14): a complainant sees only their own earlier cases or "a similar open matter exists"; intake_similarity_checks holds no third-party text.
6. Identity: different PIDs never match; ICID conflict forces REVIEW; resolveIdentity is used as SPEC 3 touchpoint 6 says.
7. The semantic signal is local (no network call) and works for Devanagari and Tamil.
8. Stage 2: the three named detections only (repeated document request, overlapping action by another bureau, conflicting instruction), missing or stale data gives UNKNOWN, Proceed always works and is audited; they are not called C1 to C5.
9. case_actions schema and POST /api/v1/prevent/check-action are documented in server/src/modules/prevent/README.md exactly enough for S3 to write actions and call check-action; list anything S3 will need that is missing.
10. N59: once per reporter per case; officers see only the count; priority, routing and PREVENT results unchanged after co-signs; getVerifiedInstitutionPid returns a PID only.
11. The one-line insertions in Dashboard.jsx, Institution360.jsx and GrievanceSubmit.jsx are the only S4 edits to your S1b files, and nothing else in them changed.
12. F23, F24, E01, X01 to X04 and the B6/B7 items stay BLOCKED-SOURCE, with no test claiming 93.75 or C1 to C5.
13. FEATURES.md: every S4 row marked DONE has real paths and a passing [ID] test.

Write everything to plans/S4_AUDIT.md and end with "Safe to commit: YES / NO" and a numbered list of fixes for Codex, each one line, with the file to change.
