You are running as Codex: follow AGENTS.md, write your plan to plans/S1a.md first, then continue without waiting.

ROLE
You are the lead engineer and quality owner for the identity layer of AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264, "Integrated Institution Grievance Monitoring and Resolution System". You build NEXUS TRUST: who the complainant is, how they are verified, and how their identity stays hidden. You think before you code, you never guess, and you prove every claim with a passing test. Your standard: a senior reviewer must find nothing missing, nothing renamed, nothing faked, and no path by which a real identity leaks.

BRANCH (do this first)
- git checkout main, then git pull, then git checkout -b phase/S1a-identity. Work only on this branch. Never push to main. Open a pull request at the end.
- S0 (Foundation) must already be on main. Check that these exist: client/ (with client/src/main.jsx), scripts/seed.js, scripts/reset.js, scripts/merge-results.js, server/src/modules/auth, server/src/modules/audit. If any is missing, STOP and report "S0 incomplete on main: <missing items>". Do not build S0 yourself.
- Another AI tool (Antigravity) is building S1b (institutions, registry, grievance intake, cases) at the same time on branch phase/S1b-intake. Never touch its files.

CONTEXT (read these files fully before anything else; do not skim)
1. AGENTS.md: binding rules. It wins over this prompt if they differ.
2. PARALLEL_PLAN.md: branches, file ownership, model owners, contracts.
3. docs/SPEC.md sections 5 (all), 12.3, 13 (rows S04, S05, S06, S07, S14, S15, S26), 15.1 (reporter_accounts, identity_vault, consent_records), 15.2 (auth/verify, consents, identity/reveal-requests routes), 16 (U05 to U10), Appendix V (NEXUS TRUST panel, Layer 2 tiles), Appendix W (rows N68, N69, N79 and the Complainant and System Administrator rows of W2). If SPEC.md and docs/NEXUS-IC_Unified_24Oct.pdf differ, the PDF wins.
4. FEATURES.md: the rows of your IDs below. scripts/trace-check.js checks it.
5. The existing S0 code: server/src/app.js, server/src/routes.js, the authorize middleware, audit.record(), the safe logger, the seed accounts, client/src routes and layout. Reuse them; do not rewrite them.

NON-NEGOTIABLE RULES (summary of AGENTS.md; AGENTS.md wins)
- Nothing missed, nothing changed, nothing merged. Never delete, rename, renumber or combine an ID. Keep exact names from SPEC.md: the UI panel title is "USER VERIFICATION (NEXUS TRUST)", the badge is "No proxy / verified reporter", reporter IDs look like RP-7K2Q.
- Never invent content. F46, F47, F50, F51, F53, F54 are BLOCKED-SOURCE (zero-trust block F45 to F54, text in the 23 Oct PDF, not yet provided). Build nothing for them beyond what SPEC section 13 already requires. Leave them BLOCKED-SOURCE and write in Notes which S-controls you built that fall in that block.
- Never invent policy numbers. OTP expiry, OTP attempt limits, rate limits, reveal expiry and retention periods go in server/src/modules/identity/config.js as values clearly labelled DEMO, with a comment "not from source; set by AICTE policy". Eligibility rules (N69) come only from the RuleBook (owned by S2, not merged yet): until then return POLICY_NOT_CONFIGURED, never a made-up rule.
- DONE means proven: real file paths in "Built in", plus a test titled "[<ID>] ..." that passes in npm test. Never skip, weaken or .skip a test.
- Fixed stack: React JSX + Vite + Tailwind + React Router + TanStack Query on the client; Express in plain JavaScript on Node 20+ with MongoDB + Mongoose. Tests: Vitest + Supertest + mongodb-memory-server (server), Vitest + React Testing Library (client). NO TypeScript. NO Digital Twin. Node's built-in crypto for encryption; ask before adding any other dependency.
- Synthetic data only. OTP goes to a local sink, never a real phone or email. ABC/APAAR, staff registry and SSO are simulators named AbcApaarSimulator, StaffRegistrySimulator, SsoSimulator.
- Real identity lives ONLY in identity_vault, encrypted. Never log, notify, export or return it, except through an approved, unexpired reveal. Use the S0 safe logger only.
- A fraud signal never auto-rejects anyone. It routes to manual verification and a human decides.
- Every state change calls audit.record(). Every new route uses authorize(...). The S0 [S01] test must still pass with your routes mounted.

SCOPE: exactly these 30 IDs
NEXUS TRUST features:
- N01 Student verification: AbcApaarSimulator returns an APAAR-linked identity and a current-enrolment answer checked against institution records (simulated). No current enrolment means no verified status.
- N02 Faculty verification: StaffRegistrySimulator for current employment, plus SsoSimulator for institutional login. Inactive employment means rejected.
- N03 Other authorized user onboarding: institution admin (authorized-representative record), regional and bureau officials, AICTE staff via SsoSimulator. Role-based access, reusing S0 roles.
- N04 OTP and MFA: OTP to a local sink (a dev inbox page at /dev/otp-inbox, visible only when APP_MODE=demo, and server console). Store only a hash of the OTP. Expiry and attempt limit from config.js (DEMO values).
- N05 Anti-proxy and fraud signals: one verified person per account; repeated registration attempts, mismatched enrolment or employment, burst submissions and shared devices raise a fraud signal that routes to manual verification. Export recordFraudSignal(reporterId, type, meta) so S1b can report burst submissions later. Never auto-reject.
- N06 Pseudonymous reporter ID and identity vault: generate RP-xxxx (4 random uppercase letters and digits, unique, never derived from identity). Minimal data. Real identity in identity_vault only.
- N07 Consent-based verification and consent ledger: every verification step writes a consent entry (purpose, scope, grantedAt, withdrawnAt). Append-only. Consent state is shown to the user.
- N08 Alternative verification path: officer-assisted manual verification for users without ABC/APAAR or SSO. Logged, rate-limited, and the officer's decision is audited.
- N68 Other Stakeholder complainants (Parents, Alumni, Citizens, etc.): user type "other_stakeholder" with a sub-type. No source says how to verify them, so use the N08 officer-assisted path. Note this decision in FEATURES.md.
- N69 Validate complainant eligibility (according to AICTE rules): a function checkEligibility(reporterId, context) that reads the active ELIGIBILITY rule from the RuleBook. Since the RuleBook is not built yet, return { result: 'POLICY_NOT_CONFIGURED' } and show that text in the UI. Never block a complainant on it.
- N79 System Administrator workspace (/admin, system_admin only): create and manage user accounts and roles; view system logs (audit events list and the S0 chain check); security and performance view (health, failed logins, fraud-signal counts, each count with its denominator, UNKNOWN if a feed is missing); backup (a "Run backup" action that calls a BackupSimulator and records an audit event). Master data (institutions, categories, regions) belongs to S1b: add a "Master data" tab that links to S1b's admin pages; if they are not on main yet, show "Available after S1b merge" and keep N79 IN-PROGRESS with that note. Rule changes go through the RuleBook only (S2): show "Managed in RuleBook" with no edit control.
Security controls:
- S04 Minimal data collection: reporter_accounts uses a strict schema with only pseudonymousReporterId, userType, verificationMethod, verifiedAt, status (plus userId link and timestamps). Verification APIs reject unknown fields.
- S05 Consent-based identity verification with consent ledger (via N07).
- S06 Pseudonymous reporter ID in all officer views and exports: one serializer toOfficerView() used by every officer-facing response; export S06 helpers so later export code reuses them.
- S07 Identity vault separate from case data; audited, expiring reveal: identity_vault stores reporterId, encrypted payload (AES-256-GCM, key from VAULT_KEY in .env, added to .env.example), keyRef. Reveal flow: POST /api/v1/identity/reveal-requests with purpose; a different person approves (approver differs from requester); the reveal expires (config.js DEMO value); every request, approval, view and expiry is audited. Institution admins and counterpart bureaus can never request or receive a reveal. Default approver roles: supervisor and competent_authority (not stated in source, so list it as a question in your plan and keep it in config.js).
- S14 OTP and MFA (via N04).
- S15 Anti-proxy checks, fraud signals, rate limits (via N05, plus rate limits on login, OTP and verification routes).
- S26 Consent withdrawal and retention hooks (DPDP-informed; legal review needed): POST /api/v1/consents/:id/withdraw records withdrawnAt (never deletes), shows the new state, and calls a retention hook applyRetentionPolicy(reporterId) that returns POLICY_NOT_CONFIGURED until AICTE sets a policy. Put "legal review needed" in the UI note and FEATURES.md.
Blocked (hint only): F46, F47, F50, F51, F53, F54.
Acceptance tests:
- U05 Student without valid enrolment cannot submit a verified grievance. You own verification, S1b owns submission: export isVerified(userId) and make the test prove that a student with no current enrolment ends with isVerified false and no verified reporter account. S1b will call isVerified() at submission.
- U06 Faculty with inactive employment is rejected.
- U07 Proxy registration attempt is blocked and flagged (the second account for the same verified person is blocked and a fraud signal is recorded).
- U08 Reporter ID is pseudonymous in officer views and exports.
- U09 Identity reveal needs purpose and approver, expires, and is audited.
- U10 Consent withdrawal is handled per policy and recorded.

OWNERSHIP (from PARALLEL_PLAN.md)
- You own: server/src/modules/identity/ (simulators, OTP sink, fraud signals, config.js), server/src/modules/consent/, server/src/modules/vault/, server/src/modules/sysadmin/ (N79), the models reporter_accounts, identity_vault, consent_records, fraud_signals, otp_sink, and your client pages under client/src/pages/trust/ and client/src/pages/admin/, plus client/src/routes/s1a.jsx.
- Shared files: append ONE mount line to server/src/routes.js. Client pages: create client/src/routes/s1a.jsx that default-exports an array of { path, element, roles, public } (picked up automatically; do not edit routes/index.jsx or App.jsx). Login rate limiter: append one import line and one array entry to server/src/middleware/loginGuards.js (do not edit authRoutes.js). Add dependencies only; never bump or remove. Never hand-merge package-lock.json.
- The contract for S1b: export from server/src/modules/identity/index.js exactly getReporterId(userId) returning the RP-xxxx string, isVerified(userId), and recordFraudSignal(reporterId, type, meta). S1b stores only reporterId on a case and never reads identity_vault. Document these three functions in server/src/modules/identity/README.md.
- Never touch registry/, institutions/, intake/, cases/, documents/ or S0's model files. To add a field to the S0 User model, write a plugin in your module and register it in server/src/models/plugins.js by appending one import line and one registry entry.
- Text for your pages: put every user-visible string in client/src/i18n/s1a.en.json and client/src/i18n/s1a.hi.json, your own files, so S1b's Hindi/English work (N64) can load them. Do not edit S1b's i18n files.
- FEATURES.md: edit only the rows of your 30 IDs. Never reorder or reformat the table.

UI (all pages show the S0 SYNTHETIC DATA banner automatically)
- /verify: the panel "USER VERIFICATION (NEXUS TRUST)" with user-type choice (Student, Faculty, Other authorized user, Other Stakeholder), simulator step, consent step, OTP step, the result with the badge "No proxy / verified reporter" and the user's RP-xxxx ID.
- /my/consents: the user's consent entries and their state, with a Withdraw button.
- /officer/manual-verification: the N08 queue (manual requests and fraud-signal cases) for bureau_officer and regional_officer, with approve or reject plus a required reason.
- /officer/reveal-requests: request a reveal with a purpose; approvers see pending requests; an approved reveal shows the identity until it expires, then hides it.
- /admin: the N79 workspace.
- /dev/otp-inbox: demo mode only.
- Seed: add synthetic verified and unverified reporters for each user type to the S0 seed so the demo works after npm run reset.

TESTS TO WRITE (titles must start with the tag; one or more per ID)
[N01] [N02] [N03] [N04] [N05] [N06] [N07] [N08] [N68] [N69] [N79] [S04] [S05] [S06] [S07] [S14] [S15] [S26] [U05] [U06] [U07] [U08] [U09] [U10]. Include at least these:
- [S07] the identity_vault payload on disk is not plaintext, and no API response outside an approved reveal contains it.
- [U09] reveal without purpose is 400; approval by the requester is 403; an institution_admin request is 403; after expiry the identity is hidden; all of it appears in the audit chain.
- [U08] every officer-facing response from your routes contains RP-xxxx and none of the vault fields (scan the JSON).
- [S28 regression] verifying and revealing never writes identity fields to the logger.
- [N69] eligibility returns POLICY_NOT_CONFIGURED and does not block.
- A client test that /verify renders the exact title "USER VERIFICATION (NEXUS TRUST)".

HOW TO WORK
Step 1. Read every file in CONTEXT. Run node scripts/trace-check.js --stage S1 and copy its output into plans/S1a.md.
Step 2. Write plans/S1a.md with: (a) one line per ID in your scope: what, which files, which test; (b) every S1 ID you skip, each marked "owned by S1b (institutions and intake)"; (c) the folder tree you will add; (d) any dependency you want and why; (e) open questions (at least: reveal approver roles, N68 verification method, DEMO config values). Commit the plan. Then continue without waiting; the human reviews it in the pull request.
Step 3. Build in small steps: models and simulators, then OTP, then consent, then vault and reveal, then fraud signals and manual verification, then N69, then N79, then the client pages. Run the relevant tests after each step, and commit after each green step.
Step 4. Verify:
   - npm install, npm run reset, npm run dev works; log in as a student, a bureau officer, a supervisor and the system admin and click through every page above.
   - npm test: all tests pass, including every S0 test; none skipped; test-results/results.json exists. If tests cannot reach MongoDB in your environment, say so plainly. Do not skip tests.
   - Update FEATURES.md for your 30 rows only (Status, Built in, Proved by, Notes). Never edit the ID, Title, Source, Pri or Stage columns.
   - git pull origin main (merge, do not rebase). If S1b merged first, run npm test again and replace nothing of theirs.
   - node scripts/trace-check.js --stage S1 must show no violations for your IDs. S1b's IDs may still be TODO; that is expected. Paste the full output.
Step 5. Self-review: re-read AGENTS.md, PARALLEL_PLAN.md and every scope line above, and list anything you did not do.

FINAL REPORT (put it in the pull request description, exactly this shape)
- DONE: IDs
- IN-PROGRESS or GAP: IDs with reasons (N79 may be IN-PROGRESS only for the master-data tab)
- BLOCKED-SOURCE: F46, F47, F50, F51, F53, F54, with what was built near them
- Skipped as owned by S1b: the list
- Contract for S1b: the three exported functions and where they live
- Test summary: passed / failed / skipped counts
- trace-check output (full)
- How I can see it: URLs, demo accounts, steps
- Decisions and open questions I should know about
- Suggested commit message: "stage S1a: NEXUS TRUST identity, consent, vault, admin workspace"

DONE WHEN
A student, faculty member, other user and Other Stakeholder can each be verified or routed to manual review; no response, log or export outside an approved, unexpired reveal contains a real identity; every S0 and S1a test passes; trace-check shows no violations for your IDs; nothing outside your scope was touched; and the pull request is open with the report.
