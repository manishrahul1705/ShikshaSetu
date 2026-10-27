# S2 Final Report — Trust, Routing & Case Lifecycle (NEXUS RULEBOOK, NEXUS ROUTE)

Date: 2026-10-25
Stage: S2 (Trust, Routing & Case Lifecycle)
Status: **COMPLETE**
Trace-Check: **No violations** (`node scripts/trace-check.js --stage S2`)
Test Suite: **20/20 S2 Server Tests Passed (7 files)**, **3/3 S2 Client UI Tests Passed**

---

## 1. Executive Summary & Scope

Phase S2 delivers the core intelligence and governance backbone of **AWAAZ DASTAK** (powered by **NEXUS-IC**), implementing:
1. **NEXUS RULEBOOK** (`N27`, `N78`, `N65`, `U29`): Version-controlled governance rule engine with dry-run verification, non-destructive what-if preview simulations, two-step separation-of-duties approvals, and production protection against demo rules.
2. **NEXUS ROUTE & Jurisdiction Routing** (`N18`, `U16`, `U17`, `N73`): 6-factor deterministic routing engine evaluating category, subcategory, keyword, institution type, region, and workload, dispatching to 8 configured bureaus/cells. Ambiguous cases route to a supervisory Triage Queue. Route overrides require audited reasons.
3. **Risk, Priority & Sensitivity Analysis** (`N19`, `U18`, `U19`): Multilingual local keyword scanning (Hindi, English, Tamil) without external network or LLM calls; human supervisor confirmation of sensitivity; priority escalation to urgent; human-readable priority reasons (never opaque numerical scores); and non-retroactive SLA clock segment recalculation via active RuleBook SLA versions.
4. **Case Lifecycle & Complainant Transparency** (`N28`): 9-state lifecycle model (`DRAFT`, `SUBMITTED`, `ACKNOWLEDGED`, `UNDER_REVIEW`, `TRANSFERRED`, `ESCALATED`, `RESOLVED`, `CLOSED`, `REOPENED`). Transferred cases never revert to Registered or Submitted. Complainant tracking card displays true stage and accountable office while withholding internal notes and officer identities.
5. **Security, Separation of Duties & Operational Integrity** (`S20`, `S25`, `S29`):
   - Strict 403 rejection if a rule version requester attempts self-approval or if an officer attempts to confirm their own sensitivity flag.
   - Anti-retaliation protections: institution admins cannot read narratives (`[RESTRICTED: Sensitive case narrative withheld]`) or download documents (audited 404 `document.access_denied_sensitive`) of confirmed sensitive cases.
   - Standalone `scripts/backup.js` and `scripts/restore.js` with `_demo` database name enforcement; idempotent external CSV import engine rejecting duplicate `externalRef`s with audited denial.
6. **BLOCKED-SOURCE Verifications** (`F14`, `F15`, `F16`, `F17`, `F18`, `F19`, `F39`, `F48`, `F49`, `F56`): Sourced hints verified in targeted test assertions (`F15`, `F48`, `F49`, `F56`) while maintaining blank `Built in` fields and preserving blocked notes per traceability rules.

---

## 2. Detailed Item-by-Item Reconciliation

### RuleBook & Governance Engine
- **`N27` — NEXUS RULEBOOK** (`server/src/modules/rulebook/rulebookService.js`, `models.js`, `routes.js`, `seed.js`, `client/src/pages/rulebook/RuleBook.jsx`):
  - **Status**: **DONE**
  - **Implementation**: Created versioned rulebook schema (`RuleBookVersion`) with immutable active rules and draft transitions. Prevents `DEMO-*` rules from being activated when `APP_MODE === 'production'` (HTTP 400).
  - **Proof**: `server/tests/s2-rulebook.test.js` (`[N27] editing rule creates new version; APP_MODE=production cannot select DEMO-*`).

- **`N78` — RuleBook Families: Overlap Detection & Closure Requirements** (`server/src/modules/rulebook/seed.js`, `rulebookService.js`):
  - **Status**: **DONE**
  - **Implementation**: Seeded 11 rule families including `ROUTING`, `PRIORITY`, `SLA`, `TRANSFER`, `CLOSURE_REQUIREMENTS`, `OVERLAP_DETECTION`, `SENSITIVITY`, `APPEAL`, `RESCUE`, `FIELD_VERIFICATION`, and `ACCESS_CONTROL`.
  - **Proof**: `server/tests/s2-rulebook.test.js` (`[N78] overlap detection and closure requirements families loaded`).

- **`N65` — RuleBook What-If Preview** (`server/src/modules/rulebook/previewService.js`, `client/src/pages/rulebook/WhatIfPreviewModal.jsx`):
  - **Status**: **DONE**
  - **Implementation**: `previewRuleChange` runs dry-run simulations against active cases without persisting changes (`simulation: true`), reporting total evaluated cases, affected cases count, and distribution shifts.
  - **Proof**: `server/tests/s2-rulebook.test.js` (`[A-N65] what-if preview lists affected open cases and changes nothing`).

- **`U29` — RuleBook Edit with Dry-Run & Two-Step Approval** (`server/src/modules/rulebook/rulebookService.js`, `routes.js`, `client/src/pages/rulebook/RuleChangeModal.jsx`):
  - **Status**: **DONE**
  - **Implementation**: Rule version edits create `DRAFT` versions. Direct approval is blocked until dry-run succeeds (`dryRunPassed === true`). Two-step approval requires a different actor (`version.requestedBy !== user._id`).
  - **Proof**: `server/tests/s2-rulebook.test.js` (`[U29] rulebook edit creates version with dry-run and two-step approval`).

### Routing & Jurisdictions
- **`N18` — NEXUS ROUTE** (`server/src/modules/routing/routingService.js`, `routingEngine.js`, `routes.js`, `models.js`):
  - **Status**: **DONE**
  - **Implementation**: 6-factor deterministic routing engine evaluating category, subcategory, keywords, institution type, region, and bureau workload. Persists immutable `RoutingDecision` records with `primaryBureau`, `secondaryBureau`, `reason`, and `ruleVersion`. Mongoose hooks reject mutations post-creation.
  - **Proof**: `server/tests/s2-routing.test.js` (`[N18] every decision has primary, reason and ruleVersion; immutable`).

- **`U16` — Routing Returns Primary, Secondary, Reason; Ambiguous to Triage** (`server/src/modules/routing/routingService.js`, `routingEngine.js`, `client/src/pages/routing/TriageQueue.jsx`):
  - **Status**: **DONE**
  - **Implementation**: Evaluation returns primary bureau, secondary bureau, and human-readable reason. Ambiguous cases (confidence score < 0.6) flag `requiresManualReview: true` and are routed to `/api/v1/routing/triage` for supervisor review.
  - **Proof**: `server/tests/s2-routing.test.js` (`[U16] routing returns primary, secondary and reason; ambiguous to triage`).

- **`U17` — Route Override Requires Reason and is Audited** (`server/src/modules/routing/routingService.js`, `routes.js`, `client/src/pages/routing/OfficerAssignmentModal.jsx`):
  - **Status**: **DONE**
  - **Implementation**: POST `/api/v1/routing/:caseId/override` validates mandatory `reason` parameter (rejects empty/whitespace with 400). Updates case `owningBureau` and records audit event `routing.overridden`.
  - **Proof**: `server/tests/s2-routing.test.js` (`[U17] route override requires reason and records audit`).

- **`N73` — Bureaus and Cells Operational Units** (`server/src/modules/bureaus/bureauService.js`, `models.js`, `routes.js`, `seed.js`):
  - **Status**: **DONE**
  - **Implementation**: Seeded 8 configurable units: `PGRC` (Public Grievance Redressal Cell), `RB` (Regulation Bureau), `AB` (Academic Bureau), `APB` (Approval Process Bureau), `SEB` (Skill Education Bureau), `TL` (Training and Learning), `RO` (Regional Offices), and `OTHER` (Other Cell). Seeded operational demo officers with uppercase bureau codes.
  - **Proof**: `server/tests/s2-bureaus.test.js` (`[N73] bureaus and cells seeded as configurable units with officers`).

### Risk, Priority & Sensitivity
- **`N19` — Risk & Priority Analysis** (`server/src/modules/priority/priorityService.js`, `sensitivityService.js`, `routes.js`):
  - **Status**: **DONE**
  - **Implementation**: Multilingual regex-based sensitivity keyword detection in Hindi, English, and Tamil running 100% locally. Priority evaluation returns plain text explanatory reasons, never opaque numerical probability scores.
  - **Proof**: `server/tests/s2-priority.test.js` (`[N19] priority has visible reason and never score; sensitivity works locally`).

- **`U18` — Sensitive Category Flagged, Human-Confirmed, and Restricted** (`server/src/modules/priority/sensitivityService.js`, `routes.js`, `server/src/modules/cases/caseService.js`):
  - **Status**: **DONE**
  - **Implementation**: Cases matching sensitivity triggers receive `SUGGESTED` sensitivity flags. Supervisors confirm flags via POST `/api/v1/priority/:caseId/confirm-sensitive`, which automatically escalates case priority to `urgent`, records `case.sensitivity.confirmed`, and marks case as restricted under S25.
  - **Proof**: `server/tests/s2-priority.test.js` (`[U18] sensitive category is flagged, human-confirmed, and restricted`).

- **`U19` — Priority Change Alters Clock via RuleBook, Never Retroactively** (`server/src/modules/priority/priorityService.js`, `routes.js`):
  - **Status**: **DONE**
  - **Implementation**: Priority escalation appends new clock segments using the active SLA rule version (`DEMO-CASE-STANDARD-v1` vs `DEMO-CASE-PRIORITY-v1`). Historical clock segments remain unmodified.
  - **Proof**: `server/tests/s2-priority.test.js` (`[U19] priority change alters clock via active rule version non-retroactively`).

### Lifecycle & Complainant Transparency
- **`N28` — Case Lifecycle & Complainant Status** (`server/src/modules/lifecycle/lifecycleService.js`, `lifecycleGuards.js`, `client/src/pages/lifecycle/ComplainantStatusCard.jsx`, `client/src/pages/cases/TrackCase.jsx`):
  - **Status**: **DONE**
  - **Implementation**: Enforces 9-state lifecycle model. Disallows illegal transitions. Transferred cases enter `TRANSFERRED` status and are prevented from reverting to `SUBMITTED` or `Registered`. `ComplainantStatusCard` renders true public status and accountable office name without exposing investigator notes or names.
  - **Proof**: `server/tests/s2-lifecycle.test.js` (`[N28] nine statuses and F09 mapping; transferred case never reverts`), `client/tests/s2-ui.test.jsx`.

### Security, Operations & Data Integrity
- **`S20` — Requester Differs from Approver on Sensitive Approvals** (`server/src/modules/rulebook/rulebookService.js`, `server/src/modules/priority/sensitivityService.js`, `server/src/modules/lifecycle/accessControl.js`):
  - **Status**: **DONE**
  - **Implementation**: Returns HTTP 403 if `version.requestedBy.toString() === user._id.toString()` during RuleBook approval or if `flag.suggestedBy.toString() === user._id.toString()` during sensitivity confirmation.
  - **Proof**: `server/tests/s2-security.test.js` (`[S20] requester differs from approver on sensitive approvals`).

- **`S25` — Anti-Retaliation Protections** (`server/src/modules/cases/caseService.js`, `server/src/modules/lifecycle/accessControl.js`):
  - **Status**: **DONE**
  - **Implementation**: For confirmed sensitive cases, `institution_admin` case queries return `narrative: '[RESTRICTED: Sensitive case narrative withheld]'`. Document downloads by `institution_admin` return HTTP 404 with audited `document.access_denied_sensitive`. Complainant retains full access to their own submission.
  - **Proof**: `server/tests/s2-security.test.js` (`[S25] institution_admin cannot read confirmed sensitive case narrative/docs`).

- **`S29` — Backup, Restore, Import Replay** (`scripts/backup.js`, `scripts/restore.js`, `server/src/modules/lifecycle/importEngine.js`):
  - **Status**: **DONE**
  - **Implementation**: CLI scripts `scripts/backup.js` and `scripts/restore.js` connect via MONGODB_URI and enforce that restore operations only proceed against databases ending with `_demo`. `commitImport` ensures idempotent commits rejecting duplicate `externalRef`s with audited rejection.
  - **Proof**: `server/tests/s2-security.test.js` (`[S29] backup and restore into _demo; import replay creates no duplicates`).

### BLOCKED-SOURCE Verifications
- **`F15` / `F49` — External CSV Import Preview & Idempotent Commit** (`server/tests/s2-import.test.js`):
  - **Status**: **BLOCKED-SOURCE**
  - **Proof**: Tested in `server/tests/s2-import.test.js` (`[F15] import preview and dry-run validate externalRefs`, `[F49] import idempotent commit rejects duplicate externalRef`).
- **`F48` / `F56` — Registry Simulator Downtime Handling** (`server/tests/s2-routing.test.js`):
  - **Status**: **BLOCKED-SOURCE**
  - **Proof**: Tested in `server/tests/s2-routing.test.js` (`[F48] registry unavailable causes routing to flag manual review UNKNOWN`, `[F56] registry down produces no zero values in routing`).
- **`F14`, `F16`, `F17`, `F18`, `F19`, `F39`**:
  - **Status**: **BLOCKED-SOURCE**
  - **Compliance**: Preserved with empty `Built in` fields and exact notes in `FEATURES.md`.

---

## 3. Verification Commands & Outputs

1. **Syntax Verification**:
   ```powershell
   @(
     "server/src/modules/routing/routingService.js",
     "server/src/modules/routing/routingEngine.js",
     "server/src/modules/routing/routes.js",
     "server/src/modules/routing/models.js",
     "server/src/modules/priority/priorityService.js",
     "server/src/modules/priority/sensitivityService.js",
     "server/src/modules/priority/routes.js",
     "server/src/modules/rulebook/rulebookService.js",
     "server/src/modules/rulebook/previewService.js",
     "server/src/modules/rulebook/models.js",
     "server/src/modules/rulebook/routes.js",
     "server/src/modules/rulebook/seed.js",
     "server/src/modules/lifecycle/lifecycleService.js",
     "server/src/modules/lifecycle/lifecycleGuards.js",
     "server/src/modules/lifecycle/accessControl.js",
     "server/src/modules/lifecycle/importEngine.js",
     "server/src/modules/lifecycle/plugins/caseLifecycle.plugin.js",
     "server/src/modules/lifecycle/routes.js",
     "server/src/modules/cases/caseService.js",
     "server/src/modules/bureaus/bureauService.js",
     "server/src/modules/bureaus/models.js",
     "server/src/modules/bureaus/routes.js",
     "server/src/modules/bureaus/seed.js",
     "scripts/backup.js",
     "scripts/restore.js"
   ) | ForEach-Object { node --check $_ }
   # Output: All syntax valid!
   ```

2. **Server Tests (S2 Suites)**:
   ```powershell
   $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test --workspace=server -- tests/s2-rulebook.test.js tests/s2-routing.test.js tests/s2-priority.test.js tests/s2-security.test.js tests/s2-lifecycle.test.js tests/s2-bureaus.test.js tests/s2-import.test.js
   # Output: Test Files  7 passed (7)
   #         Tests  20 passed (20)
   ```

3. **Client UI Tests**:
   ```powershell
   npm test --workspace=client -- tests/s2-ui.test.jsx
   # Output: Test Files  1 passed (1)
   #         Tests  3 passed (3)
   ```

4. **Traceability Verification**:
   ```powershell
   node scripts/trace-check.js --stage S2
   # Output:
   # FEATURES.md: 349 rows, expected 349
   #   TODO            50
   #   IN-PROGRESS     4
   #   DONE            73
   #   GAP             0
   #   BLOCKED-SOURCE  217
   #   PLANNED-P2      2
   #   NOT-ADOPTED     3
   #
   # Stage S2: 10 IDs not DONE
   #   F14  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
   #   F15  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: CSV import preview, dry-run,
   #   F16  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Reopen; appeals are new even
   #   F17  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
   #   F18  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
   #   F19  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
   #   F39  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: RuleBook partial (SPEC 2)
   #   F48  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Registry unavailable shows U
   #   F49  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Import idempotent commit (SP
   #   F56  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Registry unavailable shows U
   #
   # No violations.
   ```
