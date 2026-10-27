# Phase S1b (Institutions & Intake) — Build Plan

Machine trace-check baseline (`node scripts/trace-check.js --stage S1`):
```
FEATURES.md: 349 rows, expected 349
  TODO            72
  IN-PROGRESS     3
  DONE            52
  GAP             0
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3

Stage S1: 84 IDs not DONE
No violations.
```

---

## 1. Scope & ID Ownership

### (a) IDs Owned and Built by S1b (Exactly 100 IDs)

| ID | Requirement / Scope | Target Files | Proved by Test |
|---|---|---|---|
| **F01** | AICTE Permanent Institute ID (PID): exact match only, never fuzzy-linked (BLOCKED-SOURCE) | `server/src/modules/registry/RegistrySimulator.js`, `server/src/modules/institutions/institutionService.js` | `[F01] PID exact match only, never fuzzy-linked` |
| **F02** | Campus hierarchy rules; ambiguous campuses route to review (BLOCKED-SOURCE) | `server/src/modules/institutions/Institution.js`, `server/src/modules/institutions/institutionService.js` | `[F02] ambiguous campuses route to review` |
| **F03** | Verified aliases shown separately in profile (BLOCKED-SOURCE) | `server/src/modules/institutions/Institution.js`, `server/src/modules/institutions/institutionService.js` | `[F03] verified aliases displayed separately` |
| **F04** | Institution 360 composite view (BLOCKED-SOURCE) | `server/src/modules/institutions/institutionService.js`, `client/src/pages/institutions/Institution360.jsx` | `[F04] institution 360 composite view` |
| **F05** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F06** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F07** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F08** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F09** | Full text: 23 Oct PDF (BLOCKED-SOURCE; hint: analytic status mapping) | — | (BLOCKED-SOURCE) |
| **F10** | Full text: 23 Oct PDF (BLOCKED-SOURCE; hint: assignment) | — | (BLOCKED-SOURCE) |
| **F11** | Full text: 23 Oct PDF (BLOCKED-SOURCE; hint: status) | — | (BLOCKED-SOURCE) |
| **F12** | Full text: 23 Oct PDF (BLOCKED-SOURCE; hint: transfer) | — | (BLOCKED-SOURCE) |
| **F13** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F29** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F30** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F31** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F32** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F33** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F34** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **F35** | Full text: 23 Oct PDF (BLOCKED-SOURCE; build nothing invented) | — | (BLOCKED-SOURCE) |
| **N09** | ICID / IIC ID field, mapping, and search; all 4 hard rules & 12 touchpoints; export `resolveIdentity(pid, icid)` | `server/src/modules/institutions/InstitutionIdentifier.js`, `institutionService.js`, `institutionRoutes.js` | `[N09] ICID mapping resolves to PID and disagreement goes to review`, `[N09] an ICID that matches two PIDs never links; it goes to review` |
| **N10** | Master registry lookup & auto-fetch; read-only panel; offline toggle shows UNKNOWN with reason | `server/src/modules/registry/RegistrySimulator.js`, `registryRoutes.js`, `client/src/pages/institutions/InstitutionLookup.jsx` | `[N10] master registry lookup returns profile and UNKNOWN when offline`, `[N10] registry down shows UNKNOWN with a reason, never zeros` |
| **N11** | Six-region classification (`DEMO-REGIONS-v1`); reviewer reclassification with reason, audited | `server/src/modules/institutions/Region.js`, `institutionRoutes.js`, `client/src/pages/masterdata/MasterRegions.jsx` | `[N11] six-region classification and reviewer reclassification` |
| **N12** | Institution 360 at `/institutions/:id`: single-window view, attention indicators, opaque counterpart metadata, restricted entries disclosure | `server/src/modules/institutions/institutionService.js`, `client/src/pages/institutions/Institution360.jsx` | `[N12] institution 360 shows attention indicators and opaque counterpart metadata` |
| **N13** | Grievance submission portal at `/grievances/new`: structured form, guided fields, doc upload, auto-linked PID, preview/edit; verified reporter gate (`isVerified`) | `server/src/modules/intake/intakeRoutes.js`, `server/src/modules/cases/caseService.js`, `client/src/pages/grievances/GrievanceSubmit.jsx` | `[N13] grievance portal guided fields and preview confirmation` |
| **N14** | Master Case ID `NX-<year>-<6 digits>` immutable counter, unique `externalRefs[]`, duplicate registration validation | `server/src/modules/cases/Case.js`, `server/src/modules/cases/caseService.js`, `server/src/modules/cases/CaseCounter.js` | `[N14] master case ID generation and external ref preservation` |
| **N15** | Multi-channel intake: web portal channel ONLY (`channel: "web"`). Marked IN-PROGRESS | `client/src/pages/grievances/GrievanceSubmit.jsx` | `[N15] web portal grievance intake submission` |
| **N31** | Encrypted document storage with AES-256-GCM using `DOCS_KEY` (never reusing `VAULT_KEY`); MalwareScanSimulator rejects EICAR; SHA-256 hash stored | `server/src/modules/documents/Document.js`, `documentService.js`, `MalwareScanSimulator.js` | `[N31] encrypted document storage with malware scan` |
| **N52** | Hidden-data scrubber: strips GPS, device, author, edit history from JPEG, PNG, PDF; seals original with hash viewable only by complainant | `server/src/modules/intake/metadataScrubber.js`, `server/src/modules/documents/documentService.js` | `[A-N52] hidden-data scrubber strips metadata and seals original`, `[A-N52] an uploaded JPEG with GPS EXIF comes back to an officer without GPS; the sealed original keeps its hash` |
| **N58** | Quick-exit button on complainant pages for sensitive categories in `DEMO-CATEGORIES-v1`: hides page, redirects to neutral site, zero storage use | `client/src/components/QuickExitButton.jsx`, `client/src/pages/grievances/GrievanceSubmit.jsx` | `[A-N58] quick-exit button redirects and hides form` |
| **N64** | Hindi and English interface: dynamic glob loader in `client/src/i18n/index.js`, Layout toggle; s1b.en.json & s1b.hi.json; no voice input | `client/src/i18n/index.js`, `s1b.en.json`, `s1b.hi.json`, `client/src/components/Layout.jsx` | `[A-N64] hindi and english interface on complainant pages` |
| **N67** | Multilingual complaints: any of 22 scheduled languages + English in Unicode; stored byte-identical; local Unicode script detection; officers see tag; no cloud translation | `server/src/modules/intake/languageDetector.js`, `server/src/modules/cases/caseService.js` | `[A-N67] multilingual complaints detected locally without cloud translation`, `[A-N67] Tamil, Hindi (Devanagari) and Bengali texts are stored byte-identical and tagged with the right language` |
| **S02** | RBAC by bureau, region, and case level: centralized `canAccessCase(user, caseDoc)` | `server/src/middleware/rbac.js` | `[S02] RBAC enforces bureau and regional scoping` |
| **S03** | Field-level ABAC on read, write, search, export, and file: one policy per role; sockets noted as not existing | `server/src/middleware/abac.js` | `[S03] field-level ABAC filters restricted fields` |
| **S10** | Secure document storage with authorization on every download | `server/src/modules/documents/documentRoutes.js` | `[S10] document download requires case authorization` |
| **S11** | Server-proxied streaming downloads; raw storage paths and keys never reach client | `server/src/modules/documents/documentRoutes.js` | `[S11] downloads are server-proxied without exposing storage keys`, `[S11] no API response contains a storage path or key` |
| **S12** | Upload type and size checks (5MB limit), malware scan stub, file hash | `server/src/modules/intake/config.js`, `server/src/modules/documents/documentService.js` | `[S12] upload validation enforces types, sizes and malware check` |
| **S21** | Complainant sees own cases only; IDOR returns 404 with audited denial | `server/src/modules/cases/caseRoutes.js`, `server/src/modules/cases/caseService.js` | `[S21] IDOR denied: complainant sees own cases only`, `[S21] complainant B gets 404 for complainant A's case and document, and the denial is audited` |
| **R01–R31** | Requirements R01–R31 (BLOCKED-SOURCE; full text in 23 Oct PDF; build nothing invented) | — | (BLOCKED-SOURCE) |
| **R32** | Global search accepts ICID as key (BLOCKED-SOURCE, hint only) | `server/src/modules/institutions/institutionRoutes.js` | `[R32] global search accepts ICID as key` |
| **R33–R49** | Requirements R33–R49 (BLOCKED-SOURCE; full text in 23 Oct PDF; build nothing invented) | — | (BLOCKED-SOURCE) |
| **R50** | Regional officers see only their delegated region (BLOCKED-SOURCE, hint only) | `server/src/modules/institutions/institutionRoutes.js` | `[R50] regional officer scoped to delegated region` |
| **R51–R55** | Requirements R51–R55 (BLOCKED-SOURCE; full text in 23 Oct PDF; build nothing invented) | — | (BLOCKED-SOURCE) |
| **U01** | Acceptance: PID lookup returns profile, including ICID when available | `server/src/modules/registry/registryRoutes.js`, `server/src/modules/institutions/institutionRoutes.js` | `[U01] PID lookup returns the profile, including ICID when available` |
| **U02** | Acceptance: ICID search resolves to PID; ICID alone never links institutions | `server/src/modules/institutions/institutionRoutes.js`, `server/src/modules/institutions/institutionService.js` | `[U02] ICID search resolves to the PID; ICID alone never links institutions` |
| **U03** | Acceptance: PID and ICID disagreement goes to identity review | `server/src/modules/institutions/institutionService.js`, `server/src/modules/institutions/IdentityReviewQueue.js` | `[U03] PID and ICID disagreement goes to identity review, not auto-resolved` |
| **U04** | Acceptance: Missing ICID shows "not available"; case creation still works | `server/src/modules/registry/registryRoutes.js`, `server/src/modules/institutions/institutionService.js` | `[U04] Missing ICID shows "not available"; case creation still works` |
| **U11** | Acceptance: Form validation, preview, edit, bad uploads rejected | `server/src/modules/intake/intakeRoutes.js`, `server/src/modules/documents/documentRoutes.js` | `[U11] form validation, preview, and edit-before-confirm work; bad uploads are rejected` |
| **U12** | Acceptance: Master Case ID is unchanged after routing, transfer, appeal (immutable at schema/API; marked IN-PROGRESS) | `server/src/modules/cases/Case.js` | `[U12] master case ID remains unchanged across operations` |
| **U13** | Acceptance: External reference preserved; duplicate registration blocked | `server/src/modules/cases/caseService.js` | `[U13] external reference preserved and duplicate registration blocked` |

---

### (b) S1 IDs Skipped (Owned by S1a — Identity, NEXUS TRUST) (Exactly 30 IDs)

- **F46**: Zero-trust identity hints (owned by S1a (identity, NEXUS TRUST))
- **F47**: Zero-trust identity hints (owned by S1a (identity, NEXUS TRUST))
- **F50**: Zero-trust identity hints (owned by S1a (identity, NEXUS TRUST))
- **F51**: Zero-trust identity hints (owned by S1a (identity, NEXUS TRUST))
- **F53**: Zero-trust identity hints (owned by S1a (identity, NEXUS TRUST))
- **F54**: Zero-trust identity hints (owned by S1a (identity, NEXUS TRUST))
- **N01**: Student verification (ABC/APAAR-linked, enrolment check) (owned by S1a (identity, NEXUS TRUST))
- **N02**: Faculty verification (staff registry, employment, SSO) (owned by S1a (identity, NEXUS TRUST))
- **N03**: Other authorized user onboarding (owned by S1a (identity, NEXUS TRUST))
- **N04**: OTP and MFA (owned by S1a (identity, NEXUS TRUST))
- **N05**: Anti-proxy and fraud signals (owned by S1a (identity, NEXUS TRUST))
- **N06**: Pseudonymous reporter ID and identity vault (owned by S1a (identity, NEXUS TRUST))
- **N07**: Consent-based verification and ledger (owned by S1a (identity, NEXUS TRUST))
- **N08**: Alternative verification path (owned by S1a (identity, NEXUS TRUST))
- **N68**: Other Stakeholder complainants (Parents, Alumni, Citizens) (owned by S1a (identity, NEXUS TRUST))
- **N69**: Validate complainant eligibility (owned by S1a (identity, NEXUS TRUST))
- **N79**: System Administrator workspace (owned by S1a (identity, NEXUS TRUST))
- **S04**: Minimal data collection (owned by S1a (identity, NEXUS TRUST))
- **S05**: Consent-based identity verification with consent ledger (owned by S1a (identity, NEXUS TRUST))
- **S06**: Pseudonymous reporter ID in all officer views and exports (owned by S1a (identity, NEXUS TRUST))
- **S07**: Identity vault separate from case data; audited reveal (owned by S1a (identity, NEXUS TRUST))
- **S14**: OTP and MFA (owned by S1a (identity, NEXUS TRUST))
- **S15**: Anti-proxy checks, fraud signals, rate limits (owned by S1a (identity, NEXUS TRUST))
- **S26**: Consent withdrawal and retention hooks (owned by S1a (identity, NEXUS TRUST))
- **U05**: Student without valid enrolment cannot submit a verified grievance (owned by S1a (identity, NEXUS TRUST))
- **U06**: Faculty with inactive employment is rejected (owned by S1a (identity, NEXUS TRUST))
- **U07**: Proxy registration attempt is blocked and flagged (owned by S1a (identity, NEXUS TRUST))
- **U08**: Reporter ID is pseudonymous in officer views and exports (owned by S1a (identity, NEXUS TRUST))
- **U09**: Identity reveal needs purpose, approver, expiry, and audit (owned by S1a (identity, NEXUS TRUST))
- **U10**: Consent withdrawal handled per policy and recorded (owned by S1a (identity, NEXUS TRUST))

---

### (c) Folder Tree to Add & Maintain

```
nexus-ic/
├── server/src/
│   ├── modules/
│   │   ├── registry/
│   │   │   ├── RegistrySimulator.js
│   │   │   └── registryRoutes.js
│   │   ├── institutions/
│   │   │   ├── Institution.js
│   │   │   ├── InstitutionIdentifier.js
│   │   │   ├── Region.js
│   │   │   ├── IdentityReviewQueue.js
│   │   │   ├── institutionService.js
│   │   │   ├── institutionRoutes.js
│   │   │   └── seed.js
│   │   ├── intake/
│   │   │   ├── config.js
│   │   │   ├── Category.js
│   │   │   ├── MalwareScanSimulator.js
│   │   │   ├── metadataScrubber.js
│   │   │   ├── languageDetector.js
│   │   │   └── intakeRoutes.js
│   │   ├── cases/
│   │   │   ├── Case.js
│   │   │   ├── CaseCounter.js
│   │   │   ├── caseService.js
│   │   │   └── caseRoutes.js
│   │   └── documents/
│   │       ├── Document.js
│   │       ├── documentService.js
│   │       └── documentRoutes.js
│   └── middleware/
│       ├── rbac.js
│       └── abac.js
├── client/src/
│   ├── routes/
│   │   └── s1b.jsx               (auto-picked up by routes/index.jsx)
│   ├── pages/
│   │   ├── institutions/
│   │   │   ├── InstitutionLookup.jsx  (/institutions/lookup)
│   │   │   ├── Institution360.jsx     (/institutions/:id)
│   │   │   └── IdentityReview.jsx     (/review/identity)
│   │   ├── grievances/
│   │   │   ├── GrievanceSubmit.jsx    (/grievances/new)
│   │   │   └── MyCases.jsx            (/my/cases)
│   │   └── masterdata/
│   │       ├── MasterInstitutions.jsx (/admin/master/institutions)
│   │       ├── MasterCategories.jsx   (/admin/master/categories)
│   │       └── MasterRegions.jsx      (/admin/master/regions)
│   ├── components/
│   │   └── QuickExitButton.jsx
│   └── i18n/
│       ├── index.js
│       ├── s1b.en.json
│       └── s1b.hi.json
├── server/tests/
│   ├── s1b-registry-institutions.test.js
│   └── s1b-intake-cases.test.js
└── client/tests/
    └── s1b-intake-ui.test.jsx
```

---

### (d) Dependencies
**Zero new npm dependencies.** Built entirely using Node 20+ built-ins (`crypto`, `fs`, `path`), Express, Mongoose, React, React Router, and Tailwind.

---

### (e) Open Questions & Design Decisions

1. **Who sees unrouted cases before S2 routes them?**
   - *Design Choice*: The specification does not define visibility for an unassigned, unrouted case (`owningBureau == null`, `routingDecisionId == null`). S1b scopes access strictly to the submitting complainant (for their own case) and supervisory/administrative roles (`supervisor`, `competent_authority`, `system_admin`, `auditor`). Regional and bureau officers cannot view unrouted cases until they are routed or delegated.
2. **DEMO Reference Tables**:
   - `DEMO-REGIONS-v1`: 6 AICTE regions (Northern, Western, Southern, Central, Eastern, North Eastern) mapped to states.
   - `DEMO-CATEGORIES-v1`: 10 standard grievance categories with sub-categories. Sensitive categories (`Ragging`, `Safety Concern`) trigger the N58 quick-exit button.
3. **DEMO Config Values (Intake & Security)**:
   - Max upload size: 5 MB (`UPLOAD_CONFIG.maxFileSizeBytes = 5 * 1024 * 1024`).
   - Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`.
   - Max files per grievance: 5.
   - Burst submissions threshold: 5 submissions within 10 minutes per reporter. Exceeding triggers `recordFraudSignal(reporterId, 'burst_submissions', {})` which routes the reporter to manual review without auto-rejecting the grievance.
4. **S1a Identity Contract Integration**:
   - `getReporterId(userId)` provides the pseudonymous `RP-xxxx` string. Case documents store only `reporterId` and never complainant name, email, phone, or enrolment.
   - `isVerified(userId)` is called at submission. If false, grievance intake returns 403 `VERIFICATION_REQUIRED` with a redirect to `/verify`.
   - `toOfficerView(row)` is used for all officer-facing reporter fields.
   - `setRevealScopeResolver(resolver)` is registered in `server/src/modules/vault/service.js` so that identity reveals check `canAccessCase(user, caseDoc)` server-side, never trusting client-supplied bureau headers.
5. **Localization Review Note**:
   - Hindi translations in `s1b.hi.json` are marked "needs native-speaker review". Voice input is explicitly excluded.

---

> [!IMPORTANT]
> **Stopping here per instructions for your approval of this plan before continuing.**
