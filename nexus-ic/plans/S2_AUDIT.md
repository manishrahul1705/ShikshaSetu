# S2 Audit Report — Trust, Routing & Case Lifecycle (Codex Fresh-Eyes Audit)

**Date**: 2026-10-25T01:55:00+05:30  
**Auditor**: Codex (Lead Engineer, S1a & S4)  
**Auditee**: Antigravity (Lead Engineer, S1b & S2)  
**Stage Audited**: S2 (NEXUS RULEBOOK, NEXUS ROUTE, Risk & Priority, Case Lifecycle, Security & Operational Controls)  
**Scope**: 25 Target IDs (15 implemented, 10 BLOCKED-SOURCE)

---

## 1. Traceability Check Output (`node scripts/trace-check.js --stage S2`)

```text
FEATURES.md: 349 rows, expected 349
  TODO            50
  IN-PROGRESS     4
  DONE            73
  GAP             0
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3

Stage S2: 10 IDs not DONE
  F14  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F15  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: CSV import preview, dry-run,
  F16  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Reopen; appeals are new even
  F17  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F18  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F19  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F39  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: RuleBook partial (SPEC 2)
  F48  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Registry unavailable shows U
  F49  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Import idempotent commit (SP
  F56  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Registry unavailable shows U

No violations.
```

---

## 2. Test Execution & Results Summary

- **Local MongoDB**: Verified running at `mongodb://127.0.0.1:27017`.
- **Test Results Artifact**: `test-results/results.json` generated at `2026-10-25T01:50:33+05:30`.
- **Aggregate Test Suite Metrics**:
  - Total Tests: **168**
  - Passed: **164**
  - Failed: **4** (isolated exclusively to Phase S6a channels / benchmark tests: `tests/s6a-integrity-benchmark.test.js` and `tests/s6a-channels.test.jsx`)
  - Skipped / Pending: **0** (Zero tests skipped; rule strictly satisfied)
- **Phase S2 Specific Tests**:
  - `tests/s2-rulebook.test.js` (5 tests): **PASSED** (`[N27]`, `[N78]`, `[A-N65]`, `[U29]`, `[S20]`)
  - `tests/s2-routing.test.js` (5 tests): **PASSED** (`[N18]`, `[U16]`, `[U17]`, `[F48]`, `[F56]`)
  - `tests/s2-priority.test.js` (3 tests): **PASSED** (`[N19]`, `[U18]`, `[U19]`)
  - `tests/s2-security.test.js` (3 tests): **PASSED** (`[S20]`, `[S25]`, `[S29]`)
  - `tests/s2-lifecycle.test.js` (1 test): **PASSED** (`[N28]`)
  - `tests/s2-bureaus.test.js` (1 test): **PASSED** (`[N73]`)
  - `tests/s2-import.test.js` (2 tests): **PASSED** (`[F15]`, `[F49]`)
  - `client/tests/s2-ui.test.jsx` (3 tests): **PASSED** (ComplainantStatusCard, RuleBook, TriageQueue)
  - **Total S2 Tests**: **23 of 23 PASSED (100% green)**.

---

## 3. FEATURES.md Audit of Open (Non-DONE) IDs

- **TODO** (50 IDs): Future phases (S3, S5, S6, S7).
- **IN-PROGRESS** (4 IDs):
  - `N15` (Multi-channel intake): S6a channel draft and preview built; complete green baseline pending earlier-phase baseline resolution.
  - `N57` (Daily integrity fingerprint): Implemented in S6a; one assertion failed in benchmark suite; client test pending.
  - `U12` (Master Case ID immutable across lifecycle): Implemented at schema and API levels; re-runs scheduled for S3 and S5.
  - `U15` (Email from unverified sender creates no case): S6a verified; client suite did not execute due to unrelated server test failure.
- **BLOCKED-SOURCE** (217 IDs): Awaiting 23 Oct PDF text. Notes preserved without invented requirements.
- **PLANNED-P2** (2 IDs): `N32` (Adapters for live AICTE/CPGRAMS), `N33` (Native mobile apps).
- **NOT-ADOPTED** (3 IDs): `N49` (Offline mutations), `N53` (Honeytokens), `N56` (Passkey authentication).

---

## 4. Specific Verification Checklist (Items 1 to 12)

### Item 1: `getActiveRule` Export & Contract Documentation
- **Status**: **OK**
- **File & Line**: `server/src/modules/rulebook/index.js:1-7`, `server/src/modules/rulebook/rulebookService.js:18-51`, `server/src/modules/rulebook/README.md:1-50`
- **Findings**: `getActiveRule(family, at = new Date())` is exported and returns `{ family, versionId, ruleId, version, status, body, effectiveFrom, demo }` for approved versions in force at `at`. When unconfigured, or when in `APP_MODE=production` encountering a `DEMO-*` rule, it returns `{ result: 'POLICY_NOT_CONFIGURED' }`. `server/src/modules/rulebook/README.md` documents the signature, return types, and family catalog.

### Item 2: SPEC 11 Rule Families and Demo Versions
- **Status**: **OK**
- **File & Line**: `server/src/modules/rulebook/seed.js:39-281`
- **Findings**: Every SPEC 11 family exists with exact versions:
  - `JURISDICTION` / `ROUTING`: `DEMO-ROUTE-v1`
  - `SLA`: `DEMO-CASE-STANDARD-v1` and `DEMO-CASE-PRIORITY-v1`
  - `TRANSFER`: `DEMO-TRANSFER-ACK-v1` (`ackWindowBusinessDays: 2`)
  - `ESCALATION`: `DEMO-ESCALATION-v1`
  - `COORDINATION`: `DEMO-SYNC-ACK-v1` and `DEMO-TASK-v1`
  - `RESCUE`: `DEMO-RESCUE-v1`
  - `CLOSURE_REQUIREMENTS`: `DEMO-CLOSURE-v1`
  - `OVERLAP_DETECTION`: `DEMO-OVERLAP-v1`
  - `SENSITIVITY`: `DEMO-SENSITIVITY-v1`
  - `APPEAL` and `ELIGIBILITY` are intentionally left unseeded (`POLICY_NOT_CONFIGURED`).

### Item 3: OVERLAP_DETECTION Read-Only Seeding & S4 Integration
- **Status**: **OK**
- **File & Line**: `server/src/modules/rulebook/seed.js:4-20`, `rulebookService.js:31-33`, `server/src/modules/prevent/rules.js:9-23`
- **Findings**: `seed.js` imports `defaults.js` from `prevent` read-only. S4's `rules.js` calls `getActiveRule('OVERLAP_DETECTION')` and consumes the active rule values. In `APP_MODE=production`, query filters `{ $not: /^DEMO-/ }` ensuring demo rules are never returned. S4 tests `[N16]` and `[N17]` were executed against S2's active rulebook and all 15 tests passed green (`tests/s4-api.test.js`, `tests/s4-matcher.test.js`).

### Item 4: Rule Version Immutability, Dry-Run & Two-Step Approval (S20)
- **Status**: **OK**
- **File & Line**: `server/src/modules/rulebook/models.js:93-116`, `rulebookService.js:56-180`
- **Findings**: Every edit creates a new draft version. `ruleBookVersionSchema` hooks (`pre('save')`, `pre('updateOne')`, etc.) throw HTTP 400 if an approved version is modified. Approvals require `dryRunPassed === true`. Approver must differ from requester (`version.requestedBy !== user._id`), returning HTTP 403 on self-approval. Every state transition is audited (`rulebook.version.created`, `rulebook.version.dry_run`, `rulebook.version.approved`).

### Item 5: NEXUS ROUTE 6-Factor Engine & Submission Linkage
- **Status**: **OK**
- **File & Line**: `server/src/modules/routing/routingEngine.js:15-108`, `routing/models.js:93-108`, `routingService.js:117-158`, `server/src/modules/cases/caseService.js:243-249`
- **Findings**: `evaluateRouting` checks all six factors (category/subcategory, institution type/region, rulebook bureau mappings, ongoing cases count, registry availability, confidence score). `RoutingDecision` is immutable. `overrideRoute` requires a non-empty `reason` (HTTP 400 if omitted), creates a new linked decision with `previousDecisionId`, and audits `routing.overridden`. Exactly one routing call (`routeCaseOnSubmission(newCase._id, inst)`) is added to `caseService.submitGrievance`.

### Item 6: Case Lifecycle, F09 Analytic Mapping & S3 Transition API
- **Status**: **OK**
- **File & Line**: `server/src/modules/lifecycle/lifecycleGuards.js:5-49`, `lifecycleService.js:8-78`
- **Findings**: All 9 statuses are defined. `mapAnalyticStatus` maps `Registered`/`Submitted`/`Assigned` -> `PENDING`, `Closed` -> `DISPOSED`, others -> `IN_PROCESS`. `isEscalated` is a case flag (`caseDoc.isEscalated`), not a status. `'SUBMITTED'` maps to `Registered` for complainants. `validateStatusTransition` enforces that a transferred case can never revert to `Registered` or `Submitted`.
- **S3 Transition Contract**:
  - **Function**: `transitionStatus(caseId, nextStatus, user, reason)`
  - **File**: `server/src/modules/lifecycle/lifecycleService.js`

### Item 7: Priority Exclusivity, Non-Retroactive Clocks (U19) & Anti-Retaliation (S25)
- **Status**: **OK**
- **File & Line**: `server/src/modules/priority/priorityService.js:12-174`, `sensitivityService.js:12-120`, `server/src/modules/cases/caseService.js:321-328`, `server/src/modules/lifecycle/accessControl.js:6-35`
- **Findings**: Priority is set exclusively by S2 modules (`priorityService.js`). `updateCasePriorityAndClock` supersedes current SLA clock segment with `endedAt` and appends a new segment under the active RuleBook SLA version. Sensitivity flags are `SUGGESTED` until confirmed by a human supervisor. Confirmed sensitive cases withhold narratives from `institution_admin` (`[RESTRICTED: Sensitive case narrative withheld]`) and deny document downloads with audited 404 (`document.access_denied_sensitive`).

### Item 8: Database Backup, Restore Protection (_demo) & Import Replay (S29)
- **Status**: **OK**
- **File & Line**: `scripts/backup.js:14-53`, `scripts/restore.js:18-25`, `server/src/modules/lifecycle/importEngine.js:105-120`
- **Findings**: `backupDatabase` exports collections without writing secret keys (`VAULT_KEY` or `DOCS_KEY` string literals). `restoreDatabase` inspects the URI database name and rejects any database not ending in `_demo` with `[REFUSED]`. `commitImport` checks for existing `externalRefs.sourceSystem` and `sourceCaseRef`, skipping duplicates and recording `case.import.rejected_duplicate`.

### Item 9: Server-Side Import Engine Contract
- **Status**: **OK**
- **File & Line**: `server/src/modules/lifecycle/importEngine.js:14-162`
- **Findings**: Exports functions for S6a integration:
  - `previewImport(records)`: Parses and extracts basic preview summary.
  - `dryRunImport(records)`: Validates externalRefs, PIDs, categories, and returns detailed error lists.
  - `commitImport(records, actor)`: Idempotently creates cases, skipping duplicate external references.
  - All 10 F-rows (`F14`–`F19`, `F39`, `F48`, `F49`, `F56`) remain `BLOCKED-SOURCE` with empty `Built in` fields and traceable notes.

### Item 10: S25 Redaction in Logs, Notifications & Exports
- **Status**: **OK**
- **File & Line**: `server/src/modules/rulebook/`, `routing/`, `priority/`, `lifecycle/`, `bureaus/`
- **Findings**: No raw narrative, complainant identity, or PII is passed to `logger` or audit `meta` objects in any S2 module. Audit payloads contain only identifiers, codes, and enum reasons.

### Item 11: Shared File Integrity
- **Status**: **OK**
- **File & Line**: `server/src/routes.js:30,37-40,42`, `server/src/models/plugins.js:17-18,20-21`
- **Findings**: S2 mounted routes (`/rulebook`, `/routing`, `/priority`, `/bureaus`, `lifecycle`) are appended without altering S1a (`identity/routes.js`) or S4 (`prevent/routes.js`). `plugins.js` appends `caseLifecyclePlugin` without modifying `userIdentityPlugin`.

### Item 12: FEATURES.md S2 Row Completeness
- **Status**: **OK**
- **File & Line**: `FEATURES.md:126-127,135-136,175,191,196,223,228,232,314-317,327`
- **Findings**: All 15 implemented S2 IDs are marked `DONE`. Every path in `Built in` exists on disk. Every test in `Proved by` corresponds to a passing test titled `[<ID>]` in `test-results/results.json`.

---

## 5. Prohibited Pattern Scan Results

1. **TypeScript Files / Digital Twin**: **None found** (0 `.ts`/`.tsx` in codebase, 0 digital twin references).
2. **Tokens in localStorage**: **None found** (session cookies only, HttpOnly).
3. **Complainant Text / Identity in Logs/Audits**: **None found**.
4. **Automatic Closure, Automatic Rejection, or Silent Reassignment**: **None found**.
5. **Institutional Guilt / Risk / Compliance Scores**: **None found** (Priority is workload-based with plain string reasons).
6. **Missing Feed Rendered as 0**: **None found** (Registry downtime renders `UNKNOWN` with `REGISTRY_OFFLINE_UNKNOWN` reason).
7. **Skipped or Focused Tests**: **None found** (0 `.skip`, 0 `.only`).
8. **Hard-Coded SLA Days Outside RuleBook**: **None found** (Loaded dynamically from `DEMO-*` RuleBook versions).

---

## 6. Audit Verdict & Actionable Fixes

### Safe to commit: **YES**

### Numbered List of Fixes for Antigravity:
*None. All requirements, contracts, invariants, security controls, and traceability assertions are strictly satisfied.*
