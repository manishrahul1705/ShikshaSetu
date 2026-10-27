Follow RULES.md. LOCAL RUN, NO GIT: run no git command.
This is an AUDIT ONLY: do not edit any file except plans/S1a_AUDIT.md. Codex built S1a (identity, NEXUS TRUST); you built S1b. Audit S1a with fresh eyes.

Follow prompts/AUDIT.md exactly, with "Stage to audit: S1 (the S1a IDs listed in prompts/S1a_CODEX_LOCAL_MASTER_PROMPT.md)". Run tests as: $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test

Also check at least these, against prompts/S1a_CODEX_LOCAL_MASTER_PROMPT.md, and report each as OK or MISSING with file and line:
1. The panel title is exactly "USER VERIFICATION (NEXUS TRUST)" and the badge exactly "No proxy / verified reporter".
2. identity_vault payload is encrypted (AES-256-GCM, VAULT_KEY), and no API response outside an approved, unexpired reveal contains a name, email, phone, enrolment or APAAR value.
3. Reveal: purpose required, approver differs from requester, institution_admin and system_admin can never request or view, expiry enforced, every step audited.
4. OTP: only a hash is stored, the sink is demo-only, expiry and attempt limits come from identity/config.js labelled DEMO.
5. Fraud signals never auto-reject; they route to manual verification (N08), which needs a reason and is audited.
6. N68 Other Stakeholders use the officer-assisted path; N69 returns POLICY_NOT_CONFIGURED and never blocks.
7. Consent records are append-only; withdrawal adds a record and calls the retention hook, which returns POLICY_NOT_CONFIGURED.
8. N79: accounts and roles, logs, security/performance with denominators and UNKNOWN, BackupSimulator; rules show "Managed in RuleBook" with no editor.
9. reporter_accounts holds only the minimal fields (S04).
10. FEATURES.md: every S1a row marked DONE has real paths and a passing [ID] test.

Write everything to plans/S1a_AUDIT.md and end with "Safe to commit: YES / NO" and a numbered list of fixes for Codex, each one line, with the file to change.
