# NEXUS TRUST / S1a integration

All data is synthetic. No real ABC/APAAR, SSO, phone or email integration exists.

Import from `server/src/modules/identity/index.js`:

- `await getReporterId(userId)` returns the random `RP-xxxx` string, or `null` before onboarding. A case stores only this string. Never read `identity_vault` from intake or case code.
- `await isVerified(userId)` returns a boolean. It requires a verified reporter and a unique vault person claim. S1b must call this at submission; a pending OTP, invalid current enrolment, inactive employment or fraud/manual review returns false.
- `await recordFraudSignal(reporterId, type, meta)` routes the reporter to manual review, invalidates pending OTP, and audits the signal. Supported types: repeated_registration, enrolment_mismatch, employment_mismatch, burst_submissions, shared_device, proxy_attempt. Arbitrary meta is deliberately discarded to prevent identity/text leakage. No grievance is auto-rejected.

`toOfficerView(row)` allowlists reporterId, userType, status, verificationMethod and verifiedAt. Reuse it for exports. Never serialize a vault or populated reporter/user model directly.

`checkEligibility(reporterId, context)` returns `{ result: 'POLICY_NOT_CONFIGURED' }` until S2 provides an approved ELIGIBILITY RuleBook adapter. It does not block intake. Retention has the same explicit unconfigured result, pending legal review.

Bureau/region reveal requests fail closed until S1b supplies case scope: register an async `setRevealScopeResolver(user, reporterId)` from `vault/service.js`. It must read current server-side case access and return true only for the owning office. Do not trust a client bureau or grant automatic access to counterpart bureaus. Supervisor and competent_authority are temporary DEMO requester/approver roles; they still need a different approving person. Only the original requester can view an approved unexpired reveal. Institution admins and system admins never gain reveal access. Expiry is checked and audited on reveal access/list, even when the browser has been closed.

Configuration: a 32-byte hex `VAULT_KEY` is mandatory. No fallback key. DEMO OTP and reveal TTLs, attempts and rate limits live in config.js, not AICTE policy. Restarting loses the plaintext demo OTP inbox; request a new OTP. Only hashes persist. OTP sink is demo-only and scoped to the logged-in user.

Consent grants are immutable; withdrawal appends an event with withdrawalOf and withdrawnAt. API presents the effective state. Manual reasons and reveal purposes stay inside the encrypted vault. Fraud signals contain only enumerated types.

The BackupSimulator returns a synthetic manifest, explicitly `recoverable: false`; it is not a production backup system. Missing performance feeds show UNKNOWN.

Run: `$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test`. Do not change S0 setup. Demo seed accounts use `trust_<userType>_verified` and `trust_<userType>_unverified`, password `demo1234`. Existing S0 accounts remain usable. N68 uses officer-assisted review, not an invented provider.
