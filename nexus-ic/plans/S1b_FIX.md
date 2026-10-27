# Phase S1b Fix Plan: Comprehensive Consolidation of Fix Prompt & Codex Audit (Items 1 to 24)

This plan consolidates:
- **A)** Every item in `prompts/S1b_FIX_PROMPT.md`
- **B)** Every numbered fix (1 to 24) at the end of `plans/S1b_AUDIT.md` (Codex's audit), with **Item 1 first**.

Where items overlap between (A) and (B), they are consolidated into a single unified specification below.

---

## Non-Negotiable Constraints & Boundaries
1. **LOCAL RUN, NO GIT**: No git commands (no branch, commit, push, pull, worktree, status).
2. **Never edit Codex's files**:
   - `server/src/modules/prevent/`
   - `server/src/modules/identity/`
   - `server/src/modules/consent/`
   - `server/src/modules/vault/`
   - `server/src/modules/sysadmin/`
   - `client/src/pages/prevent/`
   - `client/src/pages/trust/`
   - `client/src/pages/admin/`
   - `client/src/routes/s1a.jsx`
   - `client/src/routes/s4.jsx`
   - `server/tests/s1a-*`
   - `server/tests/s4-*`
3. **Preserve Codex's insertions**: Keep Codex's imports and JSX lines in `Dashboard.jsx` (`OverlapBanner`), `Institution360.jsx` (`OverlapBanner`), and `GrievanceSubmit.jsx` (`PreventPanel`).
4. **Phase Boundary**: Phase S1b ONLY. Do not start S2.

---

## Detailed Consolidated Action Plan (Items 1 to 24)

### Fix 1 (Priority 1): GrievanceSubmit Identity Endpoint & Real Verified-User UI Form Test
- **Source**: Codex Fix #1; `plans/S1b_AUDIT.md:504`
- **Actions**:
  1. Confirm `client/src/pages/intake/GrievanceSubmit.jsx:45` calls S1a's GET `/api/v1/identity/me` (not `/api/v1/identity/my-reporter`).
  2. In `client/tests/s1b-intake-ui.test.jsx`, add a complete end-to-end form journey test for verified users:
     - Mock `/api/v1/identity/me` returning `{ status: 'verified', pseudonymousReporterId: 'RP-2026-000001', userType: 'student' }`.
     - Render `GrievanceSubmit` inside `I18nProvider` and `MemoryRouter`.
     - Assert that the unverified blocking gate ("Verification Required") is NOT rendered.
     - Assert that the intake form (PID lookup, category selector, sub-category selector, narrative textarea, file upload, preview/submit) renders properly for verified users.
  3. Keep Codex's `PreventPanel` import and JSX block untouched.
- **Files**: `client/src/pages/intake/GrievanceSubmit.jsx`, `client/tests/s1b-intake-ui.test.jsx`
- **Test**: `client/tests/s1b-intake-ui.test.jsx` -> `[N13/U11] verified user can view and interact with the grievance submission form`

---

### Fix 2: Common Case Scope & Field Allowlists for Institution 360
- **Source**: Codex Fix #2; `plans/S1b_AUDIT.md:505`
- **Actions**:
  1. In `server/src/modules/institutions/institutionService.js` (`getInstitution360`), replace duplicated permission logic with `canAccessCase(user, caseDoc)` and `applyFieldPolicy(caseDoc, user.role)`.
  2. Prevent cross-institution disclosures: if `user.role === 'institution_admin'`, verify that `user.institutionPid === inst.pid`. If it does not match, return 0 cases and no case metadata for other institutions.
  3. Prevent raw regional/authority leaks: apply `applyFieldPolicy` to all cases returned to regional officers, supervisors, and competent authorities (never raw documents with `userId`).
- **Files**: `server/src/modules/institutions/institutionService.js`
- **Test**: `server/tests/s1b-registry-institutions.test.js` -> `[S02/S03] Institution 360 enforces case scoping and strips userId for all roles`

---

### Fix 3: Fail Closed on Missing Institution Scope & Supervisory Allowlists
- **Source**: Codex Fix #3; `plans/S1b_AUDIT.md:506`
- **Actions**:
  1. In `server/src/middleware/rbac.js` (`canAccessCase`):
     - For `role === 'institution_admin'`: if `!user.institutionPid`, fail closed (`return false`). Never default to `true`.
  2. In `server/src/middleware/abac.js` (`applyFieldPolicy`):
     - For supervisory/admin roles (`supervisor`, `competent_authority`, `system_admin`, `auditor`), do NOT return raw unsanitized objects. Apply an explicit allowlist that excludes `userId` and internal secrets.
- **Files**: `server/src/middleware/rbac.js`, `server/src/middleware/abac.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[S02/S03] missing institution scope fails closed and supervisory allowlist excludes userId`

---

### Fix 4: Remove `userId` from Case Model & Derive Ownership via ReporterId
- **Source**: Codex Fix #4; `S1b_FIX_PROMPT.md` Item 5; `plans/S1b_AUDIT.md:507`
- **Actions**:
  1. Remove `userId` property from `server/src/modules/cases/Case.js` schema and all queries/indexes.
  2. In `server/src/modules/cases/caseService.js`, remove `userId` from `Case.create`.
  3. In `server/src/middleware/rbac.js` and `caseService.js`, check complainant ownership strictly by comparing `await getReporterId(currentUser._id || currentUser.id)` with `case.reporterId`.
  4. Non-matching case queries return 404 and record `case.access_denied_idor` audit event.
  5. Prove with an explicit test that NO API response to ANY role contains `userId`.
- **Files**: `server/src/modules/cases/Case.js`, `server/src/modules/cases/caseService.js`, `server/src/middleware/rbac.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[S04/S21] no case response contains userId to any role`

---

### Fix 5: Audited 404 for Document IDOR Denials
- **Source**: Codex Fix #5; `plans/S1b_AUDIT.md:508`
- **Actions**:
  1. In `server/src/modules/documents/documentRoutes.js`, ensure all unauthorized or foreign document accesses return `404 Not Found` (never 403) to prevent IDOR probing.
  2. Record audit log `document.access_denied_idor` with `actorId`, `actorRole`, `targetType: 'Document'`, `targetId: documentId`, `meta: { reason: 'IDOR_DENIED' }`.
  3. Update existing tests in `server/tests/s1b-intake-cases.test.js` that previously expected 403 to expect 404 and verify the audit event.
- **Files**: `server/src/modules/documents/documentRoutes.js`, `server/tests/s1b-intake-cases.test.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[S10/S21] foreign document access returns 404 and records IDOR audit event`

---

### Fix 6: Upload Case Linkage, Ownership Validation & Draft Binding
- **Source**: Codex Fix #6; `plans/S1b_AUDIT.md:509`
- **Actions**:
  1. In `server/src/modules/documents/documentRoutes.js` (POST `/upload`):
     - If `caseId` is provided, verify `await canAccessCase(req.user, caseDoc)` before accepting upload. If unauthorized, reject with 404/audited IDOR.
  2. In `server/src/modules/cases/caseService.js` (`submitGrievance`):
     - Validate that all `documentIds` belong to the uploading user, are unlinked, and count <= `UPLOAD_CONFIG.maxFilesPerCase`.
     - After creating `newCase`, bind the documents to the case:
       `await Document.updateMany({ _id: { $in: validDocIds } }, { caseId: newCase._id })`.
- **Files**: `server/src/modules/documents/documentRoutes.js`, `server/src/modules/cases/caseService.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[S10/N31] uploaded draft documents are bound to created case and attachment access is authorized`

---

### Fix 7: Safe PDF Metadata Removal Preserving Document Validity
- **Source**: Codex Fix #7; `plans/S1b_AUDIT.md:510`
- **Actions**:
  1. In `server/src/modules/intake/metadataScrubber.js` (`stripPdfMetadata`):
     - Replace regex string deletion (which breaks xref table offsets and byte counts) with offset-preserving byte blanking (replacing metadata values with spaces) or structural stream rewriting.
     - Match `/Author`, `/Creator`, `/Producer`, `/CreationDate`, `/ModDate` in both literal string `(...)` and hex `<...>` formats.
     - Neutralize embedded XMP metadata packets (`<x:xmpmeta>...</x:xmpmeta>`).
     - Ensure the resulting PDF maintains a valid `%PDF-` header and readable structure while stripping private author names.
- **Files**: `server/src/modules/intake/metadataScrubber.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[A-N52] PDF scrubber neutralizes author hex/string and preserves PDF integrity`

---

### Fix 8: Upload File Magic Number Validation, Empty Check & Scan Failure Fail-Closed
- **Source**: Codex Fix #8; `plans/S1b_AUDIT.md:511`
- **Actions**:
  1. In `server/src/modules/intake/config.js` and `server/src/modules/documents/documentService.js`:
     - Validate file signatures (magic bytes):
       - PDF: `%PDF-` (`0x25 0x50 0x44 0x46`)
       - PNG: `\x89PNG\r\n\x1a\n` (`0x89 0x50 0x4E 0x47`)
       - JPEG: `\xFF\xD8\xFF`
     - Reject empty files (`buffer.length === 0`).
     - Reject files exceeding `UPLOAD_CONFIG.maxFileSizeBytes` (5 MB) or exceeding `UPLOAD_CONFIG.maxFilesPerCase`.
     - In `documentService.js`: fail closed if malware scanner returns any status other than `'clean'` (e.g. `'error'`, `'infected'`, or unrecognized).
- **Files**: `server/src/modules/documents/documentService.js`, `server/src/modules/intake/config.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[S12] upload validates file magic bytes, rejects empty files, and scanner errors fail closed`

---

### Fix 9: Sanitize Filenames in Logs, Audits, and Officer Downloads
- **Source**: Codex Fix #9; `plans/S1b_AUDIT.md:512`
- **Actions**:
  1. In `server/src/modules/documents/documentService.js`:
     - Remove `originalName` from logger payload in `processUpload` (log only `mimeType`, `sizeBytes`, `documentId`).
     - In `recordAudit`: replace `originalName` in audit `meta` with generic metadata (`sanitizedExtension`, `sizeBytes`).
  2. In `server/src/modules/documents/documentRoutes.js` (GET `/:id/download`):
     - For non-complainant downloads (officers, admins), set `Content-Disposition` to `document-${doc._id}.${ext}` instead of `decrypted.originalName` so complainant names embedded in filenames do not leak.
- **Files**: `server/src/modules/documents/documentService.js`, `server/src/modules/documents/documentRoutes.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[S11/N31] officer document download receives sanitized non-identifying filename`

---

### Fix 10: Remove S1b Client-Controlled Priority & Defer to S2
- **Source**: Codex Fix #10; `S1b_FIX_PROMPT.md` Item 6; `plans/S1b_AUDIT.md:513`
- **Actions**:
  1. In `server/src/modules/intake/intakeRoutes.js`: do not accept or extract `priority` from request body.
  2. In `server/src/modules/cases/caseService.js`: default `priority` to `'normal'` internally; S1b never computes or accepts client-selected priority.
  3. In `client/src/pages/cases/TrackCase.jsx`: remove priority display tag so priority is not exposed to complainants.
- **Files**: `server/src/modules/intake/intakeRoutes.js`, `server/src/modules/cases/caseService.js`, `client/src/pages/cases/TrackCase.jsx`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[N19/S1b] submission ignores client-supplied priority and defaults to normal`

---

### Fix 11: Gate DEMO Reference Tables in Production Mode & Add Official List Labels
- **Source**: Codex Fix #11; `plans/S1b_AUDIT.md:514`
- **Actions**:
  1. In `server/src/modules/intake/config.js` and `intakeRoutes.js`:
     - When `APP_MODE === 'production'`, refuse DEMO categories and return `{ result: 'POLICY_NOT_CONFIGURED', error: 'DEMO categories disabled in production; replace with official AICTE list' }`.
     - In `DEMO_CATEGORIES`, label `_comment: 'not from source; replace with official AICTE list'`.
  2. In `server/src/modules/institutions/Region.js`:
     - Refuse DEMO region seeding or reclassification in production without approved policy; add label `"not from source; replace with official AICTE list"`.
- **Files**: `server/src/modules/intake/config.js`, `server/src/modules/intake/intakeRoutes.js`, `server/src/modules/institutions/Region.js`
- **Test**: `server/tests/s1b-registry-institutions.test.js` -> `[N11/DEMO] DEMO reference tables refuse production selection and display replacement notices`

---

### Fix 12: Burst Submission Fraud Signal without Grievance Rejection
- **Source**: Codex Fix #12; `S1b_FIX_PROMPT.md` Item 4; `plans/S1b_AUDIT.md:515`
- **Actions**:
  1. In `server/src/modules/intake/config.js`:
     - Add `BURST_CONFIG`: `{ maxSubmissionsInWindow: 5, windowMinutes: 10, label: 'DEMO', _comment: 'not from source; replace with AICTE policy' }`.
  2. In `server/src/modules/cases/caseService.js` (`submitGrievance`):
     - Count submissions by `reporterId` within `windowMinutes`.
     - If count >= `maxSubmissionsInWindow`, call `await recordFraudSignal(reporterId, 'burst_submissions', { windowMinutes, count })`.
     - **NEVER** reject the grievance due to the signal; accept and save the case normally.
- **Files**: `server/src/modules/intake/config.js`, `server/src/modules/cases/caseService.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[N05] burst submission records fraud signal without rejecting grievance`

---

### Fix 13: Wire S1a Reveal Scope Resolver to Live Case Access
- **Source**: Codex Fix #13; `S1b_FIX_PROMPT.md` Item 3; `plans/S1b_AUDIT.md:516`
- **Actions**:
  1. In `server/src/modules/cases/caseService.js` (at initialization):
     - Import `setRevealScopeResolver` from `server/src/modules/vault/service.js`.
     - Register resolver: `(user, reporterId)` returns `true` only if `canAccessCase(user, caseDoc)` is true for at least one open case belonging to `reporterId`.
     - Never trust a client-supplied bureau or region.
- **Files**: `server/src/modules/cases/caseService.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[S02] reveal scope follows case access`

---

### Fix 14: Simultaneous PID/ICID Validation, Review Queue Persistence & Auditing
- **Source**: Codex Fix #14; `plans/S1b_AUDIT.md:517`
- **Actions**:
  1. In `server/src/modules/institutions/institutionRoutes.js`:
     - If both `pid` and `icid` are provided in query, call `resolveIdentity(pid, icid)`.
     - If result is `IDENTITY_REVIEW`, create an entry in `IdentityReview` queue, return `{ status: 'IDENTITY_REVIEW', message: 'Identity review required for mismatched PID/ICID' }`, and record an audit log.
  2. Audit all identifier additions, modifications, and mappings.
- **Files**: `server/src/modules/institutions/institutionRoutes.js`, `server/src/modules/institutions/institutionService.js`, `server/src/modules/institutions/IdentityReview.js`
- **Test**: `server/tests/s1b-registry-institutions.test.js` -> `[N09/U03] simultaneous PID and ICID conflict creates identity review entry and audits change`

---

### Fix 15: Align InstitutionIdentifier Schema Contract
- **Source**: Codex Fix #15; `plans/S1b_AUDIT.md:518`
- **Actions**:
  1. In `server/src/modules/institutions/InstitutionIdentifier.js`:
     - Use collection name `'institution_identifiers'` explicitly: `mongoose.model('InstitutionIdentifier', schema, 'institution_identifiers')`.
     - Ensure fields: `institutionId`, `pid`, `icid`, `source`, `verifiedAt`, `status`.
     - Relax synthetic `IIC-[A-Z0-9]{8}` format validation to allow valid arbitrary ICID strings while labelling demo examples.
- **Files**: `server/src/modules/institutions/InstitutionIdentifier.js`
- **Test**: `server/tests/s1b-registry-institutions.test.js` -> `[N09] institution_identifiers collection schema matches contract`

---

### Fix 16: Complete Missing S1b Pages & Routes
- **Source**: Codex Fix #16; `S1b_FIX_PROMPT.md` Items 1 & 2; `plans/S1b_AUDIT.md:519`
- **Actions**:
  1. Implement missing client pages:
     - `client/src/pages/institutions/InstitutionLookup.jsx`: PID (e.g. 1-1234567890) or ICID search, auto-fetch panel, UNKNOWN with reason when registry down.
     - `client/src/pages/institutions/IdentityReviewQueue.jsx`: Review queue for `['supervisor', 'regional_officer']`, resolution with required reason, audited.
     - `client/src/pages/cases/MyCases.jsx`: Complainant view for `['student', 'faculty']` to see own cases and documents.
     - Master data pages under `client/src/pages/masterdata/`:
       - `MasterInstitutions.jsx` (`['system_admin']`)
       - `MasterCategories.jsx` (`['system_admin']`)
       - `MasterRegions.jsx` (`['system_admin']`)
       Each supports versioned edit with required reason, audited. S1a's `Admin.jsx` discovers these automatically.
  2. In `client/src/routes/s1b.jsx`:
     - Mount `/institutions/lookup`, `/review/identity`, `/my/cases`, `/my/cases/:caseId`, `/admin/master/institutions`, `/admin/master/categories`, `/admin/master/regions`.
     - Remove `/track/:caseId` route (belongs to S5).
     - Remove `/api/v1/track` from `server/src/routes.js`.
- **Files**: `client/src/routes/s1b.jsx`, `client/src/pages/institutions/InstitutionLookup.jsx`, `client/src/pages/institutions/IdentityReviewQueue.jsx`, `client/src/pages/cases/MyCases.jsx`, `client/src/pages/masterdata/*`, `server/src/routes.js`
- **Test**: `client/tests/s1b-intake-ui.test.jsx` -> `[N79/S1b] s1b exports all required routes and master data paths match system_admin role`

---

### Fix 17: Remove Invented 30-Day Overdue Rule from Institution 360
- **Source**: Codex Fix #17; `plans/S1b_AUDIT.md:520`
- **Actions**:
  1. In `server/src/modules/institutions/institutionService.js`:
     - Remove the hard-coded 30-day overdue check on `SUBMITTED` cases.
     - Show an unconfigured notice or `UNKNOWN: SLA policy not configured in this phase` until S2 RuleBook SLA policies take effect.
- **Files**: `server/src/modules/institutions/institutionService.js`
- **Test**: `server/tests/s1b-registry-institutions.test.js` -> `[N12] Institution 360 contains no invented 30-day overdue threshold`

---

### Fix 18: Complete Registry Simulator Fields & Institution 360 UI
- **Source**: Codex Fix #18; `plans/S1b_AUDIT.md:521`
- **Actions**:
  1. In `server/src/modules/registry/RegistrySimulator.js`:
     - Return `district`, `approvalAsOfDate`, `verifiedAliases`, `campuses`, and `mappedPid` in lookup responses without faking data.
  2. In `client/src/pages/institutions/Institution360.jsx`:
     - Render district, approval date, verified aliases, campus list, mapped PID, bureau-action availability, and the 6-region classification map/chips per SPEC Appendix V.
- **Files**: `server/src/modules/registry/RegistrySimulator.js`, `client/src/pages/institutions/Institution360.jsx`
- **Test**: `server/tests/s1b-registry-institutions.test.js` -> `[N10/U01] registry returns district, as-of date, campuses and mapped PID`

---

### Fix 19: Strict Intake Input Validation & Omit Free Text from Audit Meta
- **Source**: Codex Fix #19; `plans/S1b_AUDIT.md:522`
- **Actions**:
  1. In `server/src/modules/intake/intakeRoutes.js`:
     - Validate that `narrative` is a non-empty string, trimmed length > 10 chars, max length 5000 chars. Reject whitespace-only or non-string narrative with 400.
     - Validate that `category` and `subCategory` exist in the active category table. Reject unknown categories with 400.
     - In `recordAudit`: omit uncontrolled free text (`narrative`) from audit metadata to prevent log leakage. Log only `narrativeHash`, `category`, `subCategory`, `institutionPid`.
- **Files**: `server/src/modules/intake/intakeRoutes.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[N13/S04] intake validates narrative type and category relationships without narrative in audit`

---

### Fix 20: Race-Safe Duplicate Registration, $elemMatch External Refs & Dynamic Year
- **Source**: Codex Fix #20; `plans/S1b_AUDIT.md:523`
- **Actions**:
  1. In `server/src/modules/cases/Case.js`:
     - Add unique compound sparse index on `{ reporterId: 1, institutionPid: 1, narrativeHash: 1 }` to guarantee race-safe duplicate rejection at database level.
  2. In `server/src/modules/cases/caseService.js`:
     - Use `$elemMatch` for external reference duplicate check:
       `Case.findOne({ externalRefs: { $elemMatch: { sourceSystem: ref.sourceSystem, sourceCaseRef: ref.sourceCaseRef } } })`.
     - Derive Master Case ID year dynamically: `const year = new Date().getFullYear();` instead of hardcoded 2026.
- **Files**: `server/src/modules/cases/Case.js`, `server/src/modules/cases/caseService.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[N14/U13] duplicate submission is race-safe, external refs match atomically, and year is dynamic`

---

### Fix 21: Multilingual Language Selection, Local Detection & Persisted UTF-8 Round-Trip
- **Source**: Codex Fix #21; `plans/S1b_AUDIT.md:524`
- **Actions**:
  1. In `client/src/pages/intake/GrievanceSubmit.jsx`:
     - Support honest language selection (user can choose from scheduled languages or select "Auto-detect").
  2. In `server/src/modules/intake/languageDetector.js`:
     - Provide fallback for scheduled languages and handle Indian scripts accurately.
  3. In `server/tests/s1b-intake-cases.test.js`:
     - Submit grievances in Hindi, Tamil, Bengali, and Marathi; reload from database and assert exact byte-for-byte UTF-8 equality.
- **Files**: `client/src/pages/intake/GrievanceSubmit.jsx`, `server/src/modules/intake/languageDetector.js`, `server/tests/s1b-intake-cases.test.js`
- **Test**: `server/tests/s1b-intake-cases.test.js` -> `[A-N67] multilingual complaints persist exact UTF-8 bytes for scheduled languages`

---

### Fix 22: Complete Multilingual i18n Strings on Real Complainant Pages
- **Source**: Codex Fix #22; `plans/S1b_AUDIT.md:525`
- **Actions**:
  1. Complete English and Hindi strings in `client/src/i18n/s1b.en.json` and `s1b.hi.json`.
  2. Update `GrievanceSubmit.jsx` and `TrackCase.jsx` to use `t('key')` for all user-facing labels, categories, error messages, and unavailable-feed reasons.
  3. In `client/tests/s1b-intake-ui.test.jsx`, test language switching on the actual `GrievanceSubmit` component.
- **Files**: `client/src/i18n/s1b.en.json`, `client/src/i18n/s1b.hi.json`, `client/src/pages/intake/GrievanceSubmit.jsx`, `client/src/pages/cases/TrackCase.jsx`, `client/tests/s1b-intake-ui.test.jsx`
- **Test**: `client/tests/s1b-intake-ui.test.jsx` -> `[A-N64] grievance submit form switches between English and Hindi completely`

---

### Fix 23: Complete Substantive Test Assertions
- **Source**: Codex Fix #23; `plans/S1b_AUDIT.md:526`
- **Actions**:
  1. In `server/tests/s1b-registry-institutions.test.js`:
     - Add test for `[U03]` verifying actual `IdentityReview` queue record creation and resolution.
     - Add test for `[U04]` creating an actual grievance for an institution without ICID ("not available").
     - Add test for production mode gating of DEMO tables.
  2. In `server/tests/s1b-intake-cases.test.js`:
     - Add test verifying officer download receives scrubbed metadata and non-identifying filename.
     - Add test verifying ABAC field-level enforcement across roles.
- **Files**: `server/tests/s1b-registry-institutions.test.js`, `server/tests/s1b-intake-cases.test.js`
- **Test**: Run all tests in both suites to verify substantive assertion coverage.

---

### Fix 24: Reconcile FEATURES.md and Update S1b Report
- **Source**: Codex Fix #24; `S1b_FIX_PROMPT.md` Item 7; `plans/S1b_AUDIT.md:527`
- **Actions**:
  1. Run:
     ```powershell
     $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test
     node scripts/trace-check.js --stage S1
     ```
  2. Update ONLY S1b rows in `FEATURES.md` (reconciling `Status`, `Built in`, `Proved by`, `Notes`).
  3. Update `plans/S1b_REPORT.md` with what was fixed per item (1 to 24), test counts, and trace-check output.
  4. Leave all BLOCKED-SOURCE rows blocked.
- **Files**: `FEATURES.md`, `plans/S1b_REPORT.md`

---

## Verification & Completion Criteria
- `$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test` passes with 0 failed, 0 skipped.
- `node scripts/trace-check.js --stage S1` outputs `No violations`.
- No Codex files modified; Codex insertions preserved.
- `plans/S1b_REPORT.md` updated with item-by-item resolution.
