# Limitations: AWAAZ DASTAK (powered by NEXUS-IC)

Written by Claude for stage S7 (25 Oct 2026). This is a proposed design running on synthetic data. It is not a deployed AICTE system.

Final polish disclosure, 25 October 2026: the prototype uses sample data and fictional institutions, complaints and accounts. Integrations remain simulators. Manish explicitly removed on-screen data labels and chose no data-disclosure footer on exports; this does not establish production deployment, official approval, real savings or certified compliance. Disclosure stays in README, this document and the presenter's spoken script. N55 attribution and invisible trace codes remain. The newly downloaded semantic model is an unbenchmarked experiment, disabled by default; no improved model-quality result is claimed.

## Read this first: what is built

- **125 features and controls are DONE**, proved by named tests. Final-polish verification on 26 October 2026 passed **307/307 tests** (227 server, 80 client), with zero failed or skipped tests; trace-check reports No violations. Three final showcase browser rehearsals passed with zero failures, skips or retries; each has 25 numbered screenshots and a video. Sampled video QA and capture limitations are recorded in docs/screenshots/README.md. Earlier JURY-91 videos are historical evidence.
- All 21 P0 rows and all 32 acceptance tests U01–U32 are DONE. Of the approved additions N46–N67, every adopted one is DONE; N49, N53 and N56 were not adopted.
- **2 rows remain GAP**: S08 needs a real deployment review and S13 needs an actual security audit. N63 now renders a real QR image with the approved qrcode package.

## About the 217 "BLOCKED-SOURCE" rows (not "62% unbuilt")

These IDs (F01–F64, E01–E10, R01–R55, T01–T30, X01–X22, D01–D26, N36–N45) are **defined only in the 23 October document, whose text is not in this repository**. The rules forbid inventing their content, so they stay BLOCKED-SOURCE until the text is supplied. That is a missing source document, not missing work:

- Most of what they name is already covered by the 24 Oct N-series and U-series, which are built and tested. Examples: Institution 360 (F04, extended by N12), PID identity rules (F01–F03), transfers (F12, extended by N20), reopen and appeals (F16, built as N25), closure (F26, built as N22), attention indicators (E07), IMPACT safeguards (E09), late-feed handling (F43), consent withdrawal (F52).
- 22 of them were built from the "Known" hint in FEATURES.md and say so in their notes.
- When the 23 Oct text arrives, each row is checked against the built feature that covers it, and only real differences become new work.

## Not claimed (SPEC 18, word for word)

Not claimed: live AICTE data, government approval, measured savings, or certified compliance.

## Simulated, not real

Every external system is a simulator until written approval exists (SPEC 1, Rule 5). Nothing leaves the machine.

| Simulator | Stands in for |
|---|---|
| AbcApaarSimulator | ABC / APAAR student identity and enrolment |
| StaffRegistrySimulator | Institution staff registry and employment |
| SsoSimulator | Institutional login / SSO |
| RegistrySimulator | AICTE institution master registry (PID, ICID) |
| AicteSimulator, CpgramsSimulator (adapters) | AICTE systems and CPGRAMS feeds |
| EmailSimulator, SmsSimulator | Email and SMS gateways (status notices) |
| OTP local sink (`/dev/otp-inbox`) | SMS / email OTP delivery |
| MalwareScanSimulator | Document malware scanning |
| BackupSimulator | Backup and restore service |

Also synthetic: every DEMO-* RuleBook rule (DEMO-ROUTE-v1, DEMO-CASE-STANDARD-v1, DEMO-CASE-PRIORITY-v1, DEMO-TRANSFER-ACK-v1, DEMO-SYNC-ACK-v1, DEMO-TASK-v1, DEMO-RESCUE-v1, DEMO-OVERLAP-v1, DEMO-CLOSURE-v1, DEMO-ESCALATION-v1, DEMO-SENSITIVITY-v1, DEMO-INSIDER-v1), the region table DEMO-REGIONS-v1, and DEMO-PATTERN-v1 for N61. The APPEAL rule family is not seeded, so appeals return POLICY_NOT_CONFIGURED until one is approved.

## Known defects at release (25 Oct 2026, after the "rectify and correct all" round)

- The latest completed server/client verification passed 307 of 307 tests. With TEST_MONGODB_URI pointing to local MongoDB, the supported Vitest 4 server command is `npm test --workspace=server -- --maxWorkers=2`, followed by `npm run test:client`, result merge and trace-check. The removed `--minWorkers` flag is not silently ignored. Client workers are bounded to two. A green suite does not establish absence of defects or deployment readiness.
- Approved qrcode, Playwright, Recharts and React Flow packages are installed; real QR, chart and graph checks pass. Fresh npm audit reports zero vulnerabilities after the approved upgrades. ZAP was not approved or run. Final showcase browser evidence is tracked separately in plans/FINAL_POLISH_REPORT.md.

## Rows not DONE

Generated from FEATURES.md (349 rows): BLOCKED-SOURCE 217, DONE 125, PLANNED-P2 2, GAP 2, NOT-ADOPTED 3.

### GAP (2)

| ID | Title | Reason / notes |
|---|---|---|
| S08 | Encryption at rest and in transit (for real deployment) | GAP: proof is a deployment review, which needs a real deployment. Prototype at-rest encryption of documents and the identity vault is proved by [S08]; TLS, encrypted database/backups and key store are deployment notes in docs/SECURITY_REVIEW.md. |
| S13 | Regular security audits and compliance reviews | GAP: the schedule and historical dependency audit are in docs/SECURITY_REVIEW.md. The approved upgrades now have zero reported npm vulnerabilities, but a broader security audit has not run; ZAP was not approved. 'S34' is kept as written (no S34 exists), flagged, not changed. |

### PLANNED-P2 (2)

| ID | Title | Reason / notes |
|---|---|---|
| N32 | Integration adapters for real AICTE and CPGRAMS systems | Three synthetic snapshot/watermark adapters and network-free Real stubs are implemented; registry simulator is read-only. Real integrations remain contract-gated P2. Revised acceptance tests are written but unexecuted; explicit http/fetch denial test still pending. |
| N33 | Native Android and iOS apps | Native Android/iOS remain unbuilt P2; PWA static-cache/network-only/logout-clear revision and mobile doc implemented. Install-offer button, canonical public paths, standalone S1b handoff and live install/offline verification pending. |

### NOT-ADOPTED (3)

| ID | Title | Reason / notes |
|---|---|---|
| N49 | Works on weak internet (offline sync) | see ADDITIONS.md; do not build |
| N53 | Decoy records (honeytokens) | see ADDITIONS.md; do not build |
| N56 | Passkey login for officers | see ADDITIONS.md; do not build |

### BLOCKED-SOURCE (217)

The defining text is in the 23 Oct PDF (SPEC Part B) or the reserved N36–N45 rows, which are not in the repo. Nothing was invented for them. Rows where something was built from the "Known" hint say so in their notes.

- **F** (64): F01, F02, F03, F04, F05, F06, F07, F08, F09, F10, F11, F12, F13, F14, F15, F16, F17, F18, F19, F20, F21, F22, F23, F24, F25, F26, F27, F28, F29, F30, F31, F32, F33, F34, F35, F36, F37, F38, F39, F40, F41, F42, F43, F44, F45, F46, F47, F48, F49, F50, F51, F52, F53, F54, F55, F56, F57, F58, F59, F60, F61, F62, F63, F64
- **E** (10): E01, E02, E03, E04, E05, E06, E07, E08, E09, E10
- **N** (10): N36, N37, N38, N39, N40, N41, N42, N43, N44, N45
- **R** (55): R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12, R13, R14, R15, R16, R17, R18, R19, R20, R21, R22, R23, R24, R25, R26, R27, R28, R29, R30, R31, R32, R33, R34, R35, R36, R37, R38, R39, R40, R41, R42, R43, R44, R45, R46, R47, R48, R49, R50, R51, R52, R53, R54, R55
- **T** (30): T01, T02, T03, T04, T05, T06, T07, T08, T09, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22, T23, T24, T25, T26, T27, T28, T29, T30
- **X** (22): X01, X02, X03, X04, X05, X06, X07, X08, X09, X10, X11, X12, X13, X14, X15, X16, X17, X18, X19, X20, X21, X22
- **D** (26): D01, D02, D03, D04, D05, D06, D07, D08, D09, D10, D11, D12, D13, D14, D15, D16, D17, D18, D19, D20, D21, D22, D23, D24, D25, D26

Built from a hint (see each row's notes in FEATURES.md): F01, F02, F03, F04, F26, F43, F52, E05, E07, E09, R32, R50.

## Self-service identity check (N99), added 27 Oct 2026

The instant ABC / Aadhaar self-check is a **simulated check, not a government verification**. It never calls UIDAI, DigiLocker, ABC or APAAR systems. It accepts only the simulator's synthetic numbers; the synthetic Aadhaar-style numbers start with "1", which no real Aadhaar number does. The server stores a keyed (salted) hash and the last four digits, never the full number. A real deployment needs an authorised API agreement and a lawful consent flow, and this feature must not be presented as replacing real verification.

## Official AICTE list (N97, N98)

No real college is bundled. Real colleges appear only after an administrator imports the official AICTE list as CSV (Excel needs an approved reader package). The live IIC/AICTE lookup stays disabled ("awaiting official API access"). Imported real colleges cannot be named in demo grievances. The India map remains an illustrative drawing ("Illustrative map, boundaries not official") until a Survey of India–compliant outline is supplied.
