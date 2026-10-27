# S1a — NEXUS TRUST implementation plan

Local execution in nexus-ic only. No git commands, branches, copies, worktrees or pull requests. User's LOCAL RUN instruction supersedes repository git instructions.

## Preflight and source review
All requested S0 prerequisite paths exist. Read AGENTS.md and PARALLEL_PLAN.md fully; read the relevant SPEC sections, ADDITIONS.md, scope rows, S0 application, routes, authorization, audit, safe logger, accounts, client routing/layout, seed/reset and test contracts. Relevant identity, role, collection, route and acceptance text was compared with the 26-page source PDF; no behavioral conflict was observed.

## Resolved extension points
The user supplied updated S0 extension points. Client routes are registered only in client/src/routes/s1a.jsx; App.jsx and routes/index.jsx remain untouched. Login limiter registration is appended to middleware/loginGuards.js; authRoutes.js remains untouched. The User enum plugin is appended through models/plugins.js; User.js remains untouched and User.ROLES is preserved. Seed/reset each receive one additive identity seed call as explicitly requested. S0 setup.js remains read-only. All tests use TEST_MONGODB_URI and never start mongodb-memory-server from S1a.

## Implementation order
Models and fixed synthetic simulators; OTP hash and local sink; consent ledger; encrypted vault and reveal grants; fraud/manual review; eligibility adapter; sysadmin; client pages; negative-role and privacy tests; integration verification and traceability. Run npm test and trace-check after each implementation change as AGENTS requires.

## Proposed added folder tree
server/src/modules/identity/{config.js,index.js,models.js,simulators.js,service.js,routes.js,rateLimit.js,seed.js,README.md}
server/src/modules/consent/{models.js,service.js,routes.js}
server/src/modules/vault/{models.js,crypto.js,service.js,routes.js}
server/src/modules/sysadmin/{routes.js,BackupSimulator.js}
client/src/pages/trust/{Verify.jsx,Consents.jsx,ManualVerification.jsx,RevealRequests.jsx,OtpInbox.jsx}
client/src/pages/admin/Admin.jsx
client/src/routes/s1a.jsx
client/src/i18n/{s1a.en.json,s1a.hi.json}
server/tests/s1a-identity.test.js
client/tests/s1a-trust.test.jsx
plans/{S1a.md,S1a_REPORT.md}

Shared edits, always re-read first: one module mount in server/src/routes.js; only the 30 assigned FEATURES rows; append VAULT_KEY documentation to .env.example. Client integration, login limiter and seed hooks as described above, subject to ownership resolution.

## Dependencies
None proposed. Use existing Express, Mongoose, Vitest, Supertest, mongodb-memory-server, React, React Router, TanStack Query, Testing Library and Node crypto. Do not change dependency versions or hand-edit package-lock.json.

## Open policy questions and prescribed temporary behavior
- Reveal approver roles: supervisor and competent_authority are DEMO defaults requested in the prompt, not source-defined policy; put them in config.js and request AICTE confirmation.
- N68 verification method: source does not specify one; use N08 officer-assisted manual verification as explicitly directed. Retain subtype inside encrypted identity payload because reporter_accounts has a strict minimal schema.
- OTP expiry, attempt limits, login/OTP/verification rate windows and counts, reveal expiry: clearly DEMO, with comment "not from source; set by AICTE policy". Values still to be selected and recorded during implementation; never describe them as official.
- Eligibility: RuleBook unavailable; checkEligibility returns { result: 'POLICY_NOT_CONFIGURED' } and does not block.
- Retention: applyRetentionPolicy returns POLICY_NOT_CONFIGURED. Consent UI and checklist say legal review needed. Withdrawal preserves ledger history.
- One-person uniqueness needs a keyed cryptographic fingerprint held only within identity_vault, never raw identity in reporter_accounts or fraud metadata. Determine strict index and concurrent-registration behavior in tests.
- Reveal scope must deny counterpart bureaus, institution admins and unauthorized IDs, as well as self-approval. Do not invent a case-access contract when S1b has not provided one; document required context explicitly.
- Approved reveals must audit view and expiry; ordinary responses use allowlisted toOfficerView serialization. Never put user-supplied purpose, reason, metadata or simulator identity into logs/audit metadata.
- OTP console output must go through the S0 safe logger, demo only; persisted OTP is hash only. Any display sink must be ephemeral and user-scoped, never plaintext storage.

## One line per owned ID
- N01: AbcApaarSimulator and current enrolment gate; identity/simulators.js, service.js; [N01] enrolled and non-enrolled student tests
- N02: StaffRegistrySimulator plus SsoSimulator, inactive rejection; identity/simulators.js, service.js; [N02] active and inactive faculty tests
- N03: Authorized representative and role-bound SSO; identity/simulators.js, service.js; [N03] authorized user and role spoof denial
- N04: Hashed OTP, session-bound expiry/attempt/replay checks, demo sink; identity/service.js, config.js; [N04] OTP lifecycle
- N05: One-person uniqueness, repeated attempts/device/mismatch signals, manual routing; identity/service.js, models.js; [N05] fraud cannot auto-reject
- N06: Random unique RP-xxxx and encrypted minimal vault; identity/models.js, vault/crypto.js; [N06] randomness, uniqueness and no plaintext
- N07: Per-step consent and visible history; consent/service.js, trust/Consents.jsx; [N07] consent required and ledger visible
- N08: Rate-limited manual queue and audited reasoned officer decisions; identity/service.js, trust/ManualVerification.jsx; [N08] manual approve/reject authorization
- N68: Other Stakeholder subtype via N08; identity/service.js, trust/Verify.jsx; [N68] manual path for stakeholders
- N69: RuleBook eligibility adapter with nonblocking POLICY_NOT_CONFIGURED; identity/index.js, trust/Verify.jsx; [N69] unavailable policy never blocks
- N79: System-admin users/roles, safe audit list/chain, denominated feeds, BackupSimulator, master links and RuleBook notice; sysadmin/routes.js, admin/Admin.jsx; [N79] positive/negative roles and real counters; IN-PROGRESS if master data unavailable
- S04: Strict reporter schema and unknown-field API rejection; identity/models.js, routes.js; [S04] extra fields rejected
- S05: Consent before verification evidence access; consent/service.js; [S05] refusal without current consent
- S06: Allowlisted toOfficerView export used on all officer responses; identity/index.js; [S06] no vault fields in views/exports
- S07: AES-256-GCM VAULT_KEY, separate vault and scoped expiring two-person grants; vault/crypto.js, service.js; [S07] ciphertext at rest and non-reveal JSON scan
- S14: OTP as second factor after session authentication; identity/service.js; [S14] verified state requires successful OTP
- S15: Login, verification and OTP throttles with fraud/manual queue; identity/rateLimit.js; [S15] limits, isolation and expiry
- S26: Append withdrawal history and retention hook, legal review note; consent/service.js, trust/Consents.jsx; [S26] withdrawal and POLICY_NOT_CONFIGURED
- U05: No current enrolment leaves isVerified false and no verified reporter; identity/index.js; [U05] full verification path
- U06: Inactive faculty rejected without verified status; identity/service.js; [U06] inactive employment
- U07: Second account for same verified person blocked and flagged atomically; identity/service.js; [U07] proxy and concurrent registration
- U08: Officer responses/exports RP-xxxx only; identity/index.js, owned routes; [U08] scan every officer-facing response
- U09: Purpose required, different approver, scoped requester, expiry hides payload, audited request/approve/view/expiry; vault/service.js; [U09] full reveal and denial flow
- U10: Withdrawal ownership, durable ledger, retention result and visible state; consent/service.js; [U10] withdrawal history
- F46: BLOCKED-SOURCE; no feature implementation; Notes identify nearby S04/S05/S06/S07/S14/S15/S26 controls only
- F47: BLOCKED-SOURCE; no feature implementation; Notes identify nearby source-defined S-controls only
- F50: BLOCKED-SOURCE; no feature implementation; Notes identify nearby source-defined S-controls only
- F51: BLOCKED-SOURCE; no feature implementation; Notes identify nearby source-defined S-controls only
- F53: BLOCKED-SOURCE; no feature implementation; Notes identify nearby source-defined S-controls only
- F54: BLOCKED-SOURCE; no feature implementation; Notes identify nearby source-defined S-controls only

Additional tests: [S28 regression] logger spy covering verification and reveal; client [N01] exact USER VERIFICATION (NEXUS TRUST) title; S0 [S01] route walker regression.

## S1 IDs outside ownership
- F05: owned by S1b (institutions and intake)
- F06: owned by S1b (institutions and intake)
- N15: owned by S1b (institutions and intake)
- F01: owned by S1b (institutions and intake)
- F02: owned by S1b (institutions and intake)
- F03: owned by S1b (institutions and intake)
- F04: owned by S1b (institutions and intake)
- F07: owned by S1b (institutions and intake)
- F08: owned by S1b (institutions and intake)
- F09: owned by S1b (institutions and intake)
- F10: owned by S1b (institutions and intake)
- F11: owned by S1b (institutions and intake)
- F12: owned by S1b (institutions and intake)
- F13: owned by S1b (institutions and intake)
- F29: owned by S1b (institutions and intake)
- F30: owned by S1b (institutions and intake)
- F31: owned by S1b (institutions and intake)
- F32: owned by S1b (institutions and intake)
- F33: owned by S1b (institutions and intake)
- F34: owned by S1b (institutions and intake)
- F35: owned by S1b (institutions and intake)
- N09: owned by S1b (institutions and intake)
- N10: owned by S1b (institutions and intake)
- N11: owned by S1b (institutions and intake)
- N12: owned by S1b (institutions and intake)
- N13: owned by S1b (institutions and intake)
- N14: owned by S1b (institutions and intake)
- N31: owned by S1b (institutions and intake)
- N52: owned by S1b (institutions and intake)
- N58: owned by S1b (institutions and intake)
- N64: owned by S1b (institutions and intake)
- N67: owned by S1b (institutions and intake)
- S02: owned by S1b (institutions and intake)
- S03: owned by S1b (institutions and intake)
- S10: owned by S1b (institutions and intake)
- S11: owned by S1b (institutions and intake)
- S12: owned by S1b (institutions and intake)
- S21: owned by S1b (institutions and intake)
- R01: owned by S1b (institutions and intake)
- R02: owned by S1b (institutions and intake)
- R03: owned by S1b (institutions and intake)
- R04: owned by S1b (institutions and intake)
- R05: owned by S1b (institutions and intake)
- R06: owned by S1b (institutions and intake)
- R07: owned by S1b (institutions and intake)
- R08: owned by S1b (institutions and intake)
- R09: owned by S1b (institutions and intake)
- R10: owned by S1b (institutions and intake)
- R11: owned by S1b (institutions and intake)
- R12: owned by S1b (institutions and intake)
- R13: owned by S1b (institutions and intake)
- R14: owned by S1b (institutions and intake)
- R15: owned by S1b (institutions and intake)
- R16: owned by S1b (institutions and intake)
- R17: owned by S1b (institutions and intake)
- R18: owned by S1b (institutions and intake)
- R19: owned by S1b (institutions and intake)
- R20: owned by S1b (institutions and intake)
- R21: owned by S1b (institutions and intake)
- R22: owned by S1b (institutions and intake)
- R23: owned by S1b (institutions and intake)
- R24: owned by S1b (institutions and intake)
- R25: owned by S1b (institutions and intake)
- R26: owned by S1b (institutions and intake)
- R27: owned by S1b (institutions and intake)
- R28: owned by S1b (institutions and intake)
- R29: owned by S1b (institutions and intake)
- R30: owned by S1b (institutions and intake)
- R31: owned by S1b (institutions and intake)
- R32: owned by S1b (institutions and intake)
- R33: owned by S1b (institutions and intake)
- R34: owned by S1b (institutions and intake)
- R35: owned by S1b (institutions and intake)
- R36: owned by S1b (institutions and intake)
- R37: owned by S1b (institutions and intake)
- R38: owned by S1b (institutions and intake)
- R39: owned by S1b (institutions and intake)
- R40: owned by S1b (institutions and intake)
- R41: owned by S1b (institutions and intake)
- R42: owned by S1b (institutions and intake)
- R43: owned by S1b (institutions and intake)
- R44: owned by S1b (institutions and intake)
- R45: owned by S1b (institutions and intake)
- R46: owned by S1b (institutions and intake)
- R47: owned by S1b (institutions and intake)
- R48: owned by S1b (institutions and intake)
- R49: owned by S1b (institutions and intake)
- R50: owned by S1b (institutions and intake)
- R51: owned by S1b (institutions and intake)
- R52: owned by S1b (institutions and intake)
- R53: owned by S1b (institutions and intake)
- R54: owned by S1b (institutions and intake)
- R55: owned by S1b (institutions and intake)
- U01: owned by S1b (institutions and intake)
- U02: owned by S1b (institutions and intake)
- U03: owned by S1b (institutions and intake)
- U04: owned by S1b (institutions and intake)
- U11: owned by S1b (institutions and intake)
- U12: owned by S1b (institutions and intake)
- U13: owned by S1b (institutions and intake)

## Verification gates
No DONE row without a passing tagged npm test and real Built in files. Run npm install, authorized demo reset, startup and role-by-role UI checks after integration is resolved. No S1b files/tests edited. Re-read shared files before final npm test and trace check. Report all missing work honestly.

## Initial trace-check output (full)

FEATURES.md: 349 rows, expected 349
  TODO            127
  IN-PROGRESS     0
  DONE            0
  GAP             0
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3
  (no test-results/results.json yet: run the test suite with the JSON reporter)

Stage S1: 130 IDs not DONE
  F01  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: AICTE Permanent Institute ID
  F02  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Campus hierarchy rules; ambi
  F03  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Verified aliases shown separ
  F04  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Institution 360 (extended by
  F05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F06  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F07  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F08  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F09  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Analytic status mapping PEND
  F10  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Assignment (extended by N18,
  F11  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Status (extended by N28, SPE
  F12  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Transfer (PDF 4.7; extended 
  F13  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F29  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F30  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F31  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F32  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F33  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F34  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F35  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F46  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F47  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F50  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F51  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F53  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F54  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  N01  TODO            Student verification (ABC/APAAR-linked, enrolment check)
  N02  TODO            Faculty verification (staff registry, employment, SSO)
  N03  TODO            Other authorized user onboarding
  N04  TODO            OTP and MFA
  N05  TODO            Anti-proxy and fraud signals
  N06  TODO            Pseudonymous reporter ID and identity vault
  N07  TODO            Consent-based verification and ledger
  N08  TODO            Alternative verification path
  N09  TODO            ICID / IIC ID field, mapping and search
  N10  TODO            Institution master registry lookup and auto-fetch
  N11  TODO            Six-region classification
  N12  TODO            Institution 360 extended with attention indicators
  N13  TODO            Grievance submission portal
  N14  TODO            Master Case ID, external refs, duplicate-registration check
  N15  TODO            Multi-channel intake
  N31  TODO            Encrypted document storage with malware scan
  N52  TODO            Hidden-data scrubber for uploads
  N58  TODO            Quick-exit button
  N64  TODO            Hindi and English interface (no voice input)
  N67  TODO            Multilingual complaints in the grievance form (any Indian language and script; original te
  N68  TODO            Other Stakeholder complainants (Parents, Alumni, Citizens, etc.); verification via N08 pat
  N69  TODO            Validate complainant eligibility (according to AICTE rules), RuleBook-driven
  N79  TODO            System Administrator workspace (users, roles, master data, logs, backup)
  S02  TODO            RBAC by bureau, region and case level
  S03  TODO            Field-level ABAC on read, write, search, export, socket, file
  S04  TODO            Minimal data collection
  S05  TODO            Consent-based identity verification with consent ledger
  S06  TODO            Pseudonymous reporter ID in all officer views and exports
  S07  TODO            Identity vault separate from case data; audited, expiring reveal
  S10  TODO            Secure document storage with authorization on every download
  S11  TODO            Server-proxied or signed downloads; raw storage keys never exposed
  S12  TODO            Upload type and size checks, malware scan, file hash
  S14  TODO            OTP and MFA
  S15  TODO            Anti-proxy checks, fraud signals, rate limits
  S21  TODO            Complainant sees own cases only; IDOR denied
  S26  TODO            Consent withdrawal and retention hooks (DPDP-informed; legal review needed)
  R01  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R02  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R03  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R04  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R06  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R07  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R08  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R09  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R10  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R11  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R12  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R13  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R14  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R15  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R16  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R17  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R18  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R19  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R20  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R21  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R22  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R23  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R24  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R25  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R26  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R27  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R28  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R29  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R30  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R31  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R32  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4). Known: Global search; accepts ICID as key (SPEC 3)
  R33  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R34  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R35  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R36  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R37  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R38  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R39  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R40  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R41  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R42  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R43  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R44  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R45  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R46  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R47  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R48  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R49  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R50  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4). Known: Regional officers see only their delegated re
  R51  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R52  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R53  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R54  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R55  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  U01  TODO            PID lookup returns the profile, including ICID when available
  U02  TODO            ICID search resolves to the PID; ICID alone never links institutions
  U03  TODO            PID and ICID disagreement goes to identity review, not auto-resolved
  U04  TODO            Missing ICID shows "not available"; case creation still works
  U05  TODO            Student without valid enrolment cannot submit a verified grievance
  U06  TODO            Faculty with inactive employment is rejected
  U07  TODO            Proxy registration attempt is blocked and flagged
  U08  TODO            Reporter ID is pseudonymous in officer views and exports
  U09  TODO            Identity reveal needs purpose and approver, expires, and is audited
  U10  TODO            Consent withdrawal is handled per policy and recorded
  U11  TODO            Form validation, preview, and edit-before-confirm work; bad uploads are rejected
  U12  TODO            Master Case ID is unchanged after routing, transfer and appeal
  U13  TODO            External reference is preserved; duplicate registration is blocked

No violations.


## Baseline test evidence
Baseline npm test failed before implementation: MongoMemoryServer.create crashed with Mongod internal fassert failure in all five suites. 0 passed; 5 failed suites; 19 tests runner-skipped following setup failure. No tests edited or deliberately skipped. Client and merged results did not run. See interim S1a_REPORT.md. No git command run.

## Updated execution contract (user clarification)
The client route loader, loginGuards registry, and schema plugin registry now exist. Earlier integration conflicts are resolved. Do not edit App.jsx, routes/index.jsx, authRoutes.js or S0 setup.js. Register the owned plugin by appended import and registry.push. Client routes default-export an array. Tests always use TEST_MONGODB_URI=mongodb://127.0.0.1:27017; never launch mongodb-memory-server. The sandbox reported EACCES; continue implementation and request an external test run if needed. No additional dependencies.

## Implementation and verification update
Models, simulators, OTP, consent, vault/reveal, fraud/manual review, nonblocking eligibility, sysadmin and six client pages implemented. N03 reuses S0 official roles; N68 alone extends the User enum through the plugin, preserving User.ROLES for S0. Seed hooks add eight synthetic trust accounts, reserving second provider fixtures so student1/faculty1 can use active fixtures. Key generated locally only when VAULT_KEY was absent; never printed. No new dependencies. Relevant PDF pages 5,6,15-22 compared; no behavioral conflict observed for assigned requirements. Appendices V/W are image-derived additions in SPEC.md.

Bureau/region reveal scope is denied until S1b provides a current case-scope resolver. Supervisor/competent_authority need distinct-person approval. Reveal denials are audited; purposes and manual decision history stay encrypted in identity_vault. Consent withdrawal appends an immutable event. Queries are account-scoped; reveal payload bypasses Query cache. API results remain unproven because TEST_MONGODB_URI connections report EACCES in sandbox and ECONNREFUSED with escalation. Continue building as user requested; ask for a laptop test run. All 24 implementable rows remain IN-PROGRESS rather than falsely DONE; six F rows remain BLOCKED-SOURCE.

## Latest trace-check output (full)
FEATURES.md: 349 rows, expected 349
  TODO            97
  IN-PROGRESS     24
  DONE            6
  GAP             0
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3

Stage S1: 130 IDs not DONE
  F01  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: AICTE Permanent Institute ID
  F02  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Campus hierarchy rules; ambi
  F03  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Verified aliases shown separ
  F04  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Institution 360 (extended by
  F05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F06  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F07  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F08  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F09  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Analytic status mapping PEND
  F10  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Assignment (extended by N18,
  F11  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Status (extended by N28, SPE
  F12  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Transfer (PDF 4.7; extended 
  F13  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F29  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F30  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F31  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F32  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F33  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F34  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F35  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F46  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F47  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F50  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F51  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F53  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F54  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  N01  IN-PROGRESS     Student verification (ABC/APAAR-linked, enrolment check)
  N02  IN-PROGRESS     Faculty verification (staff registry, employment, SSO)
  N03  IN-PROGRESS     Other authorized user onboarding
  N04  IN-PROGRESS     OTP and MFA
  N05  IN-PROGRESS     Anti-proxy and fraud signals
  N06  IN-PROGRESS     Pseudonymous reporter ID and identity vault
  N07  IN-PROGRESS     Consent-based verification and ledger
  N08  IN-PROGRESS     Alternative verification path
  N09  TODO            ICID / IIC ID field, mapping and search
  N10  TODO            Institution master registry lookup and auto-fetch
  N11  TODO            Six-region classification
  N12  TODO            Institution 360 extended with attention indicators
  N13  TODO            Grievance submission portal
  N14  TODO            Master Case ID, external refs, duplicate-registration check
  N15  TODO            Multi-channel intake
  N31  TODO            Encrypted document storage with malware scan
  N52  TODO            Hidden-data scrubber for uploads
  N58  TODO            Quick-exit button
  N64  TODO            Hindi and English interface (no voice input)
  N67  TODO            Multilingual complaints in the grievance form (any Indian language and script; original te
  N68  IN-PROGRESS     Other Stakeholder complainants (Parents, Alumni, Citizens, etc.); verification via N08 pat
  N69  IN-PROGRESS     Validate complainant eligibility (according to AICTE rules), RuleBook-driven
  N79  IN-PROGRESS     System Administrator workspace (users, roles, master data, logs, backup)
  S02  TODO            RBAC by bureau, region and case level
  S03  TODO            Field-level ABAC on read, write, search, export, socket, file
  S04  IN-PROGRESS     Minimal data collection
  S05  IN-PROGRESS     Consent-based identity verification with consent ledger
  S06  IN-PROGRESS     Pseudonymous reporter ID in all officer views and exports
  S07  IN-PROGRESS     Identity vault separate from case data; audited, expiring reveal
  S10  TODO            Secure document storage with authorization on every download
  S11  TODO            Server-proxied or signed downloads; raw storage keys never exposed
  S12  TODO            Upload type and size checks, malware scan, file hash
  S14  IN-PROGRESS     OTP and MFA
  S15  IN-PROGRESS     Anti-proxy checks, fraud signals, rate limits
  S21  TODO            Complainant sees own cases only; IDOR denied
  S26  IN-PROGRESS     Consent withdrawal and retention hooks (DPDP-informed; legal review needed)
  R01  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R02  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R03  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R04  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R06  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R07  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R08  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R09  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R10  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R11  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R12  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R13  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R14  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R15  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R16  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R17  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R18  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R19  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R20  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R21  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R22  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R23  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R24  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R25  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R26  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R27  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R28  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R29  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R30  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R31  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R32  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4). Known: Global search; accepts ICID as key (SPEC 3)
  R33  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R34  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R35  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R36  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R37  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R38  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R39  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R40  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R41  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R42  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R43  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R44  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R45  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R46  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R47  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R48  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R49  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R50  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4). Known: Regional officers see only their delegated re
  R51  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R52  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R53  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R54  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  R55  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B4)
  U01  TODO            PID lookup returns the profile, including ICID when available
  U02  TODO            ICID search resolves to the PID; ICID alone never links institutions
  U03  TODO            PID and ICID disagreement goes to identity review, not auto-resolved
  U04  TODO            Missing ICID shows "not available"; case creation still works
  U05  IN-PROGRESS     Student without valid enrolment cannot submit a verified grievance
  U06  IN-PROGRESS     Faculty with inactive employment is rejected
  U07  IN-PROGRESS     Proxy registration attempt is blocked and flagged
  U08  IN-PROGRESS     Reporter ID is pseudonymous in officer views and exports
  U09  IN-PROGRESS     Identity reveal needs purpose and approver, expires, and is audited
  U10  IN-PROGRESS     Consent withdrawal is handled per policy and recorded
  U11  TODO            Form validation, preview, and edit-before-confirm work; bad uploads are rejected
  U12  TODO            Master Case ID is unchanged after routing, transfer and appeal
  U13  TODO            External reference is preserved; duplicate registration is blocked

5 violation(s):
  ✗ N48: test "[A-N48]" skipped
  ✗ S01: test "[S01]" skipped
  ✗ S09: test "[S09]" skipped
  ✗ S16: test "[S16]" skipped
  ✗ S28: test "[S28]" skipped

## Self-review
Re-read AGENTS.md, PARALLEL_PLAN.md and current prompt scope. See S1a_REPORT.md for every missing verification and integration. No git command; no S0/S1b source/test edits except explicitly permitted append-only registrations and requested seed hook calls. Full npm test is not green because MongoDB is unreachable. 16 separate client/crypto checks pass. No owned feature is falsely DONE.

## Closing evidence after user S0 audit fix
Full npm test against TEST_MONGODB_URI=mongodb://127.0.0.1:27017 passed: 68 passed, 0 failed, 0 skipped, 9 suites. Existing tests and S0 audit files were not modified. Validated every tagged owned ID in results.json before marking 23 DONE. N79 remains IN-PROGRESS for missing S1b master-data pages. Final trace-check has no violations; full output is in S1a_REPORT.md. No git commands.
