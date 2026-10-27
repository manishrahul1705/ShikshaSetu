# Security review: AWAAZ DASTAK (powered by NEXUS-IC)

Written by Claude for stage S7 (25 Oct 2026). Covers SPEC 13 controls S08, S13 and S30, and feature N34. Everything here is a design proposal for a prototype on synthetic data. **No encryption, certification or compliance is claimed as achieved** (SPEC 13). Nothing has been deployed.

## S08 Encryption at rest and in transit (for real deployment)

What the prototype already does (proved by tests):

| Data | At rest | Proof |
|---|---|---|
| Uploaded documents | AES-256-GCM with `DOCS_KEY`, original and metadata-scrubbed copies, SHA-256 hashes | N31, S12, `[S08]` in server/tests/s7-release.test.js |
| Reporter identity (`identity_vault`) | Encrypted payload, key reference, separate from case data | S07, U09, `[S08]` |
| Email drafts and import batches | Encrypted payloads | U15, N15 |
| Audit log | Hash chain (tamper-evident, not encrypted, holds no complainant text) | S09, S28 |

What a real deployment still needs (gate before any pilot; deployment review is the proof SPEC 13 names):

1. TLS 1.2+ on every hop: browser to load balancer, load balancer to API, API to MongoDB (`tls=true`), API to object storage.
2. HSTS, Secure + HttpOnly + SameSite cookies (S16) behind HTTPS only; `CLIENT_ORIGIN` pinned.
3. MongoDB encryption at rest (storage-engine encryption or encrypted volumes) on a replica set, with encrypted backups (S29).
4. Keys (`DOCS_KEY`, `VAULT_KEY`, `SESSION_SECRET`) in a managed key store, never in `.env` on servers; separate keys per purpose (the app already refuses `DOCS_KEY == VAULT_KEY`); rotation procedure written and tested.
5. Object storage private, server-proxied downloads only (S10, S11).
6. Deployment review signed off by AICTE's security team.

Status: GAP until a deployment review happens.

## S13 Regular security audits and compliance reviews

SPEC 13 lists S13's proof as "Audit schedule, S34". There is no S34 in the document (security IDs end at S30). The reference is kept as written and flagged; it is not renumbered.

Audit schedule (proposed):

| When | Audit | Who | Evidence kept |
|---|---|---|---|
| Before any pilot | Full S30 checklist and penetration test | Independent tester, not the build team | Report, fixes, retest |
| Every release | `npm test`, `node scripts/trace-check.js`, negative-role sweep (`[NEG]` tests) | Release owner | `test-results/results.json` |
| Monthly | Audit chain check (N66), integrity fingerprint (N57), access review of officer accounts | Auditor role | Chain result, fingerprint, account list |
| Quarterly | RuleBook change review (two-step approvals, S20), identity reveal log review (S07), export log review (N55) | Auditor with Competent Authority | Review notes |
| Yearly | Data protection review against DPDP rules with counsel (S26), retention policy | Legal and security | Signed review |

Status: GAP. A schedule is not an audit; none has been run.

## S30 Threat model and penetration-test checklist before any pilot

### Threat model (STRIDE, summary)

| Threat | Example in this system | Controls |
|---|---|---|
| Spoofing | Proxy registration, stolen officer password | N04 OTP/MFA, N05 fraud signals, S15 rate limits, S16 sessions |
| Tampering | Editing audit history, changing a closed case | S09 hash chain, N57 fingerprint, PROOF gate plugin, immutable Master Case ID |
| Repudiation | Officer denies an action | Attributed audit events for every state change (Rule 6) |
| Information disclosure | Reporter identity or narrative reaching an institution, another bureau or the Authority | S03 ABAC, S06 pseudonymous ID, S07 vault, S19, S22, S24, S25, `[NEG]` sweep |
| Denial of service | Burst submissions, huge uploads | S12 size limits, S15 rate limits, burst fraud signal |
| Elevation of privilege | Officer approving own closure or rule change, IDOR | S01 server re-authorization, S02 RBAC, S20 separation of duties, S21 IDOR 404 |
| Retaliation (domain-specific) | Institution learns who complained | S22, S25, N51 (advisory watch), no identity in notices (S27) |

### Penetration-test checklist (must pass before any pilot)

- [ ] S01 Every `/api` route rejects anonymous and wrong-role requests (`[S01]`).
- [ ] S02 Bureau, region and case scoping cannot be bypassed by changing IDs.
- [ ] S03 Field ABAC holds on read, search, export, socket and file routes.
- [ ] S04 No field collected beyond verification and routing needs.
- [ ] S05 Consent ledger is append-only; withdrawal is honoured.
- [ ] S06 Only `RP-xxxx` appears in officer views and exports.
- [ ] S07 Vault reveal needs purpose, approver and expiry; every reveal audited.
- [ ] S08 TLS everywhere; data and backups encrypted at rest; keys in a key store.
- [ ] S09 Audit chain detects any edited or deleted event.
- [ ] S10 Every download re-checks authorization.
- [ ] S11 No raw storage keys or paths reach the client.
- [ ] S12 Wrong type, oversize and EICAR uploads are rejected.
- [ ] S13 Audit schedule adopted and owned.
- [ ] S14 OTP brute force is rate-limited; codes expire.
- [ ] S15 Repeated registration, shared devices and bursts raise signals, never auto-reject.
- [ ] S16 No tokens in localStorage; cookies HttpOnly and Secure.
- [ ] S17 Cross-bureau notices are blind and opaque.
- [ ] S18 Disclosure grants expire and can be revoked.
- [ ] S19 Competent Authority receives no narrative or identity (`[S19]`, `[NEG]`).
- [ ] S20 Requester never approves own request (rules, closure, reveal, regulatory action).
- [ ] S21 Complainant IDOR attempts return 404 and are audited.
- [ ] S22 Institution admin never sees reporter identity.
- [ ] S23 Intake similarity hints leak no third-party data.
- [ ] S24 Internal notes never reach the complainant.
- [ ] S25 No identity in notifications, exports or logs; sensitive cases restricted.
- [ ] S26 Withdrawal and retention reviewed by counsel.
- [ ] S27 Outbox is idempotent; email and SMS carry no narrative or PII.
- [ ] S28 Log review finds no complainant text.
- [ ] S29 Backup restore and import replay tested.
- [ ] S30 This checklist re-run by an independent tester and signed off.
- [ ] Session fixation, CSRF on state-changing routes, open redirects, security headers (helmet), dependency audit (`npm audit`).

## N34 Recurring security audit programme

| Element | Programme |
|---|---|
| Owner | AICTE IT security lead (System Administrator role runs the tooling; Auditor role reviews) |
| Cadence | As in the S13 schedule: every release, monthly, quarterly, yearly, and before any pilot |
| Scope | All S01–S30 controls, the negative-role sweep, dependency vulnerabilities, RuleBook changes, identity reveals, exports (N55 export log) |
| Method | Automated suite (`npm test`, trace-check, `[NEG]`), manual review of logs and approvals, independent penetration test before pilot and yearly |
| Evidence | Archived `test-results/results.json`, chain check result, fingerprint, signed review notes; kept with the release |
| Findings | Critical (privacy or identity leak) blocks release until fixed and retested; others tracked with an owner and a date |

## Findings from the S7 negative-role sweep (25 Oct 2026)

- **Critical, fixed:** the Competent Authority received full case records, including private narratives, from `GET /api/v1/cases/:id` and `GET /api/v1/institutions/:pid/360`, because `applyFieldPolicy` returned the raw case for that role (D16, S19). Fixed in `server/src/middleware/abac.js`: the Authority now gets the officer field set without notes. Proved by `[NEG]` in server/tests/s7-negative-roles.test.js.
- No other leak found across complainant, other complainant, institution admin, other-bureau officer, other-region officer, supervisor, auditor, system admin and anonymous probes.

## Dependency audit run (25 Oct 2026, `npm audit`)

| Package | Severity | Where it runs | Exposure in this project |
|---|---|---|---|
| vitest, @vitest/mocker, tinypool, vite-node | critical / moderate | Test runner only | Never shipped or run in production; the Vitest UI server is not used. Upgrade with the next test-tool update. |
| vite, esbuild | high / moderate | Development server and build | The dev server is for the local demo only; production serves the built files. Do not expose the dev server on a network. |
| tailwindcss, postcss-nested, postcss-selector-parser | moderate | Build only (CSS) | CPU cost on hostile CSS at build time; our CSS is our own. |
| react-router-dom, react-router | moderate | Browser, at runtime | Open-redirect issue with backslashes in `<Link>` / `navigate`. Every link and redirect in this app uses fixed internal paths or a path the router itself recorded at login, never a URL taken from a query string. Still the first upgrade to make. |

Server runtime dependencies (express, mongoose, express-session, connect-mongo, helmet, bcryptjs) have no reported advisories. Every fix npm offers is a major-version upgrade (vitest 5, tailwindcss 4, react-router-dom 7), which needs a package install and Manish's approval, then a full test run. An OWASP ZAP baseline scan also needs a tool install and is on the same approval list. S13 stays GAP until a scheduled audit with these tools is run and recorded.

## JURY-91 dependency audit, 25 October 2026

Ran `npm audit --json` using npm 11.8.0 against the current lockfile. Exit code 1: 11 vulnerable dependency entries, comprising 2 critical, 1 high and 8 moderate (0 low, 0 informational). These counts are dependency entries, not independently deduplicated advisory counts. The initial restricted-network attempt failed DNS resolution and is not an audit result; the subsequent network-enabled run returned the findings.

The report includes Vitest/test infrastructure, Vite development tooling, CSS build dependencies and React Router runtime advisories. React Router remains the first proposed runtime upgrade. The newly returned report also includes an SSR hydration advisory; this client uses browser rendering, but that does not remove the dependency finding. No package upgrades, blanket audit fix, ZAP scan or independent penetration test has been performed in JURY-91. Major upgrades need approval and compatibility verification. S13 remains GAP while the broader scheduled audit evidence is incomplete; S08 still requires a real deployment review. This dependency scan alone is not a clean security sign-off.
