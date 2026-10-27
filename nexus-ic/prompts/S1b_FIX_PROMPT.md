Follow RULES.md for this whole conversation. LOCAL RUN, NO GIT: run no git command.
Continue phase S1b only. Codex is working on S4 (PREVENT) in this same folder: never edit its files (server/src/modules/prevent/, identity/, consent/, vault/, sysadmin/, client/src/pages/prevent/, trust/, admin/, routes/s1a.jsx, routes/s4.jsx, s1a-* and s4-* tests). Codex may add one import line plus one JSX line to Dashboard.jsx, institutions/Institution360.jsx and intake/GrievanceSubmit.jsx: re-read those files from disk before you edit them and keep its lines.

An external check found S1b incomplete against prompts/S1b_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md. Re-read that prompt, then fix exactly these items, in this order. Do not start S2.

1. Missing pages. client/src/routes/s1b.jsx has only institutions/:id, grievances/new and track/:caseId. Add, with their pages under client/src/pages/institutions/, grievances/ (or intake/) and masterdata/:
   - /institutions/lookup: PID (example 1-1234567890) or ICID search, the auto-fetch panel, UNKNOWN with reason when the registry is down.
   - /review/identity (supervisor, regional_officer): the identity-review queue for PID/ICID conflicts and ambiguous campuses, resolved only with a reason, audited.
   - /my/cases and /my/cases/:caseId (student, faculty): the complainant's own cases and own documents.
   - /admin/master/institutions, /admin/master/categories, /admin/master/regions (roles ['system_admin']): read the reference tables and make a versioned edit with a required reason, audited; DEMO tables stay labelled synthetic. S1a's N79 Master data tab picks these up automatically from s1b.jsx.
2. /track/:caseId belongs to S5 (complainant tracking, N63 QR). Move your page to /my/cases/:caseId, and remove track/:caseId from s1b.jsx (and any /api/v1/track route you added) so S5 can build it.
3. S1a reveal scope is not wired. In your own cases module, call setRevealScopeResolver(async (user, reporterId) => ...) from server/src/modules/vault/service.js at startup. It returns true only if canAccessCase(user, caseDoc) is true for at least one open case of that reporterId. Never trust a bureau sent by the client. Add a test "[S02] reveal scope follows case access".
4. Burst signal: confirm caseService calls recordFraudSignal(reporterId, 'burst_submissions', {}) above the DEMO threshold in intake/config.js and never rejects the grievance. Add a test if there is none.
5. The Case model stores userId. The contract is that a case stores ONLY reporterId (RP-xxxx). Remove userId from Case.js and decide ownership by comparing getReporterId(currentUser) with case.reporterId (S21 stays: other cases return 404 and the denial is audited). Update your own tests. Prove with a test that no case response, to any role, contains userId.
6. Leave the priority field alone for now (S2 takes it over next), but make sure no S1b code sets or shows priority.
7. Run: $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test. Every test passes, none skipped. Then node scripts/trace-check.js --stage S1 (must say "No violations"), update only your S1b rows in FEATURES.md, and update plans/S1b_REPORT.md.

If Codex's audit (plans/S1b_AUDIT.md) exists when you finish, read it and fix any additional item it lists for S1b, or explain in the report why not.
Report: what you fixed per item, test counts, full trace-check output, and every file you changed.
