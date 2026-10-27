# S3 Final Report — Inter-Bureau Movement & Collaboration (NEXUS TRACE & NEXUS SYNC 2.0)

Date: 2026-10-25
Stage: S3 (NEXUS TRACE & NEXUS SYNC 2.0)
Status: **COMPLETE**
Trace-Check: **No violations** (`node scripts/trace-check.js --stage S3`)
Test Suite: **15/15 S3 Server Tests Passed (5 files)**, **5/5 S3 Client UI Tests Passed**

---

## 1. Executive Summary & Scope

Phase S3 delivers the inter-bureau coordination, ownership handover, and multi-agency collaboration backbone of **AWAAZ DASTAK** (powered by **NEXUS-IC**), implementing:

1. **NEXUS TRACE & Single Accountable Ownership** (`N20`, `U20`, `U21`, `U22`):
   - Strict accountable owner invariant: at every moment, every case has exactly one named accountable owner or one open transfer with a named accountable sender.
   - Handover SLA clock: transfers require acknowledgement within 2 business days (skipping Saturday and Sunday via RuleBook `DEMO-TRANSFER-ACK-v1`). If unacknowledged, an automated supervisor escalation triggers while the sending officer remains the named accountable owner throughout.
   - Rejection mechanics: rejection without a mandatory reason returns HTTP 400. With a reason, the case returns to the sender's queue, status reverts to `Under Process`, and the reason is visibly documented.
   - Lifecycle invariant: transferred cases can never revert to `Registered` or `Submitted`.
   - Master Case ID (`NX-2026-XXXXXX`) remains permanent and immutable across all transfers.

2. **NEXUS SYNC 2.0 & Multi-Bureau Coordination** (`N21`, `N75`, `S17`, `S18`, `S24`, `U23`):
   - Institution 360 shared view: multi-bureau matters relating to the same institution PID/ICID are presented in a unified workspace. Cases outside an officer's access boundary are strictly serialized as aggregated counts ("N restricted entries hidden").
   - Multi-bureau agreement (N75): "Agree on Next Steps" captures structured agreements (who agreed, what steps, timestamp). Each unit continues its assigned work with independent task queues and bureau ownership.
   - Coordination task clocks: tasks enforce RuleBook time windows for acknowledgement (`DEMO-SYNC-ACK-v1`) and completion (`DEMO-TASK-v1`). Task completion never closes a case.
   - S4 PREVENT conflict check integration: before recording instructions, an advisory pre-action check (`checkAction`) verifies potential conflicts across bureaus.
   - Counterpart notices (S17): cross-bureau notifications are blind and opaque ("Related open matter exists"), carrying zero complaint narrative, documents, or complainant identity.
   - Purpose-bound disclosure grants (S18): inter-bureau document sharing requires mandatory purpose and time-boxed duration. Expired or revoked grants refuse access with an audited denial.
   - Confidential internal notes (S24, U23): internal officer notes are completely invisible to complainants and institution admins. A deep sanitizer scans and purges note IDs and content from public and institutional APIs.
   - Append-only communication log: records all inter-bureau transmissions with zero complaint narrative or identity fields.

3. **Queries, Fieldwork, Insider-Access & Absence Management** (`N70`, `N72`, `N74`, `N54`, `N60`):
   - Query & response loop (N70): direct clarification channels with timestamped audit trail. Institution admins never see queries addressed to complainants.
   - Role-specific officer actions (N72): structured action records (preliminary scrutiny, regulatory review, expert inspection recommendations) backed by S4 pre-action verification and persisted to `case_actions`.
   - Regional Office field verification (N74): physical site inspection scheduling, site observation reports, regional recommendations, and supporting document uploads.
   - Insider-access alerts (N54): supervisory scanning of audit events for repeated reveal requests, bulk access, out-of-scope searches, and abnormal activity using RuleBook `DEMO-INSIDER-v1`. Invariant: alerts are strictly supervisory warnings and never block officer operations.
   - Absence-aware ownership (N60): officers holding active accountable ownership of open cases are blocked from taking leave until their cases are formally handed over via NEXUS TRACE.

4. **BLOCKED-SOURCE Verifications** (`F20`, `F21`, `F22`, `E02`, `E06`):
   - Retained with their exact defining notes from 23 Oct PDF; no speculative implementations invented.

---

## 2. Detailed Reconciliation of the 20 S3 IDs

| ID | Title | Status | Built in | Proved by | Implementation Details |
|---|---|---|---|---|---|
| **F20** | Full text: 23 Oct PDF (SPEC Part B1) | `BLOCKED-SOURCE` | *(blank)* | *(blank)* | Retained with note: Full text: 23 Oct PDF (SPEC Part B1). |
| **F21** | Full text: 23 Oct PDF (SPEC Part B1) | `BLOCKED-SOURCE` | *(blank)* | *(blank)* | Retained with note: Full text: 23 Oct PDF (SPEC Part B1). |
| **F22** | Full text: 23 Oct PDF (SPEC Part B1) | `BLOCKED-SOURCE` | *(blank)* | *(blank)* | Retained with note: Full text: 23 Oct PDF (SPEC Part B1). |
| **E02** | Full text: 23 Oct PDF (SPEC Part B2). Known: SYNC state machine (SPEC 9.3) | `BLOCKED-SOURCE` | *(blank)* | *(blank)* | Retained with note: Full text: 23 Oct PDF (SPEC Part B2). Known: SYNC state machine (SPEC 9.3). |
| **E06** | Full text: 23 Oct PDF (SPEC Part B2) | `BLOCKED-SOURCE` | *(blank)* | *(blank)* | Retained with note: Full text: 23 Oct PDF (SPEC Part B2). |
| **N20** | NEXUS TRACE extended | `DONE` | `server/src/modules/trace/traceService.js, server/src/modules/trace/routes.js, client/src/pages/trace/TransfersPage.jsx` | `N20, U20, U21, U22; server/tests/s3-trace.test.js, client/tests/s3-ui.test.jsx` | Invariant verified: single accountable owner guaranteed across request, accept, reject and escalate; Master Case ID never changes. |
| **N21** | SYNC 2.0 notes, communication log, conflict prevention | `DONE` | `server/src/modules/sync/syncService.js, server/src/modules/sync/routes.js, client/src/pages/sync/SyncPage.jsx` | `N21, U23; server/tests/s3-sync.test.js, client/tests/s3-ui.test.jsx` | Multi-bureau shared view with N restricted entries, append-only communication log without complaint text, S4 conflict check before instruction. |
| **N54** | Insider-access alerts | `DONE` | `server/src/modules/insider/insiderService.js, server/src/modules/insider/routes.js, client/src/pages/insider/InsiderAlertsPage.jsx` | `A-N54; server/tests/s3-insider-absence.test.js, client/tests/s3-ui.test.jsx` | Scans AuditEvent for repeated reveal requests, bulk access, out-of-scope searches; supervisory alerts only, never blocks officer. |
| **N60** | Absence-aware ownership | `DONE` | `server/src/modules/absence/absenceService.js, server/src/modules/absence/routes.js, client/src/pages/absence/LeaveManagementPage.jsx` | `A-N60; server/tests/s3-insider-absence.test.js, client/tests/s3-ui.test.jsx` | Refuses leave while officer is accountable owner of active cases; lists blocker cases requiring TRACE handover. |
| **N70** | Query and response loop between officers, complainant and institution | `DONE` | `server/src/modules/queries/queryService.js, server/src/modules/queries/routes.js, client/src/pages/queries/QueryThread.jsx` | `N70; server/tests/s3-queries.test.js, client/tests/s3-ui.test.jsx` | Timestamped query and response loop; institution admin never sees queries addressed to complainant. |
| **N72** | Process the Complaint with role-specific officer actions (PGRC, RB, other bureaus) | `DONE` | `server/src/modules/actions/actionService.js, server/src/modules/actions/routes.js, server/src/modules/actions/plugins/caseAction.plugin.js` | `N72; server/tests/s3-actions-fieldwork.test.js` | Role-specific officer actions with preliminary scrutiny, regulatory review and S4 pre-check before action. |
| **N74** | Regional Office field verification (inspections / site verification, field documents) | `DONE` | `server/src/modules/fieldwork/fieldworkService.js, server/src/modules/fieldwork/routes.js, client/src/pages/fieldwork/FieldVerificationPanel.jsx` | `N74; server/tests/s3-actions-fieldwork.test.js` | Regional Office physical inspection scheduling, field reports with findings, regional recommendations and documents. |
| **N75** | SYNC steps: Agree on Next Steps; Each Unit Continues Its Assigned Work | `DONE` | `server/src/modules/sync/syncService.js, server/src/modules/sync/routes.js, client/src/pages/sync/SyncPage.jsx` | `N75; server/tests/s3-sync.test.js, client/tests/s3-ui.test.jsx` | Agree on Next Steps records multi-bureau agreement; each unit continues assigned work with independent tasks and ownership. |
| **S17** | Blind, opaque cross-bureau notices | `DONE` | `server/src/modules/sync/noticeService.js, server/src/modules/sync/routes.js, client/src/pages/sync/SyncPage.jsx` | `S17; server/tests/s3-sync.test.js, client/tests/s3-ui.test.jsx` | Blind opaque counterpart notices contain Related open matter exists only; zero narrative, document, or complainant identity. |
| **S18** | Purpose-bound, time-boxed disclosure grants | `DONE` | `server/src/modules/sync/disclosureService.js, server/src/modules/sync/routes.js, client/src/pages/sync/SyncPage.jsx` | `S18; server/tests/s3-sync.test.js` | Mandatory purpose required; time-boxed duration with automatic expiry; download refusal audited; revocation verified. |
| **S24** | Internal notes never reach the complainant | `DONE` | `server/src/modules/sync/internalNotesService.js, server/src/modules/sync/routes.js, client/src/pages/sync/SyncPage.jsx` | `S24, U23; server/tests/s3-sync.test.js, client/tests/s3-ui.test.jsx` | Internal notes never reach complainant or institution admin; deep sanitizer purges internal notes from external responses. |
| **U20** | Transfer needs acknowledgement, escalates after the window, owner always visible | `DONE` | `server/src/modules/trace/traceService.js, server/src/modules/trace/businessDays.js, server/src/modules/trace/routes.js, client/src/pages/trace/TransfersPage.jsx` | `U20; server/tests/s3-trace.test.js, client/tests/s3-ui.test.jsx` | Transfer escalates after 2 business days skipping weekends; case does not move; sender remains named accountable owner throughout. |
| **U21** | Rejected transfer returns to the sender's queue with its reason | `DONE` | `server/src/modules/trace/traceService.js, server/src/modules/trace/routes.js, client/src/pages/trace/TransfersPage.jsx` | `U21; server/tests/s3-trace.test.js, client/tests/s3-ui.test.jsx` | Rejection without reason is 400; with reason case returns to sender queue; status reverts to Under Process. |
| **U22** | A transferred case never reverts to Registered | `DONE` | `server/src/modules/trace/traceService.js, server/src/modules/lifecycle/lifecycleService.js` | `U22; server/tests/s3-trace.test.js` | Transferred case lifecycle transition can never revert to Registered or Submitted. |
| **U23** | Internal notes are invisible to the complainant | `DONE` | `server/src/modules/sync/internalNotesService.js, server/src/modules/sync/routes.js, client/src/pages/sync/SyncPage.jsx` | `U23, S24; server/tests/s3-sync.test.js, client/tests/s3-ui.test.jsx` | Complainant and institution admin responses scanned; zero internal notes, note IDs or content leaked. |

---

## 3. Architecture, Invariants & Security Controls

### Accountable Owner Invariant (SPEC 9.2, N20)
At every moment $t$, for every active case $C$:
$$\text{AccountableOwner}(C, t) = \begin{cases} 
\text{senderOfficer}, & \text{if transferStatus} = \text{REQUESTED} \\ 
\text{senderOfficer}, & \text{if transferStatus} = \text{REJECTED} \\ 
\text{recipientOfficer}, & \text{if transferStatus} = \text{ACCEPTED} \\ 
\text{currentOwner}, & \text{if transferStatus} = \text{NONE} 
\end{cases}$$
There are zero gaps, floating states, or auto-reassignments. Escalation notifies the supervisor but leaves the sending officer explicitly accountable until acceptance.

### Business Days SLA Calculation (`businessDays.js`)
All transfer and sync clocks compute business days excluding Saturday and Sunday:
- `addBusinessDays(startDate, n)` skips weekend days without relying on arbitrary external calendars.
- `diffBusinessDays(start, end)` calculates elapsed business days.
- Overdue transfers trigger escalation events to `audit_events`.

### Complainant Privacy & Zero Data Leakage (SPEC 13, S17, S24, U23, S28)
- Counterpart notices are opaque: `{ notice: 'Related open matter exists', institutionPid, contactOffice }`. No case narrative, document hashes, reporter IDs, or complainant information are included.
- `communication_log` is strictly append-only and contains only routing metadata (`from`, `to`, `channel`, `at`).
- All internal notes are segregated in `InternalNote` collections and stripped from all public or institutional API responses via `sanitizeCaseResponse`.

### Pre-Action Check Integration (`stage2.js`)
- NEXUS SYNC and Officer Actions invoke S4's `checkAction` prior to saving.
- If conflicts arise, advisory alerts are created with `REVIEW` status without silently blocking valid officer operations.

---

## 4. Test Verification Evidence

### Server Tests: 15/15 Passed
- `server/tests/s3-trace.test.js`:
  - `[U20]`: unacknowledged transfer escalates after 2 business days across weekend with fake clock, sender stays named accountable owner throughout. (PASS)
  - `[N20]`: invariant test across request, accept, reject and escalate; case has exactly one accountable owner or open transfer with named sender; Master Case ID never changes. (PASS)
  - `[U21]`: rejection without reason is 400; with reason case returns to sender queue and status reverts to Under Process. (PASS)
  - `[U22]`: transferred case lifecycle can never return to Registered or Submitted across every transition path. (PASS)
  - `[S28 regression]`: TRACE, SYNC and queries never write complaint text or identity to logger or communication_log. (PASS)
- `server/tests/s3-sync.test.js`:
  - `[N21]`: completing every task leaves case status unchanged; conflicting instruction shows S4 REVIEW result and records action. (PASS)
  - `[N75]`: SYNC steps "Agree on Next Steps" and "Each Unit Continues Its Assigned Work"; agreement recorded with participants, each unit keeps separate tasks. (PASS)
  - `[S17]`: counterpart notice contains zero narrative, document, reporterId or complainant fields. (PASS)
  - `[S18]`: grant without purpose is 400; expired grant refuses document download and audits refusal; revocation works. (PASS)
  - `[U23] / [S24]`: complainant and institution responses scanned and contain zero internal note text or note IDs. (PASS)
- `server/tests/s3-queries.test.js`:
  - `[N70]`: query and reply logged with timestamps; institution admin never sees queries addressed to complainant. (PASS)
- `server/tests/s3-actions-fieldwork.test.js`:
  - `[N72]`: role-specific officer actions with preliminary scrutiny, regulatory review and S4 pre-action check. (PASS)
  - `[N74]`: Regional Office physical inspection scheduling, site report submission with regional inputs and uploaded documents. (PASS)
- `server/tests/s3-insider-absence.test.js`:
  - `[A-N54]`: repeated reveal requests and bulk access raise supervisor alerts with rule ID and counts; never block officer. (PASS)
  - `[A-N60]`: leave request with owned open case is refused and lists blockers; succeeds after TRACE handover. (PASS)

### Client UI Tests: 5/5 Passed
- `client/tests/s3-ui.test.jsx`:
  - `TransfersPage`: incoming/outgoing tabs, SLA countdown, overdue indicator, accept/reject actions. (PASS)
  - `SyncPage`: institution 360 shared view, restricted entries count, next steps agreement, internal notes warning. (PASS)
  - `QueryThread`: query loop, replied state, role separation. (PASS)
  - `InsiderAlertsPage`: supervisory advisory notice that alerts never block officers. (PASS)
  - `LeaveManagementPage`: transfer handover blocker when active cases exist. (PASS)

---

## 5. Deliverables & Files Summary

### Server Modules Created & Modified
- `server/src/modules/trace/`:
  - `businessDays.js`: Business days arithmetic skipping weekends.
  - `models.js`: `Transfer` schema with accountable sender tracking.
  - `traceService.js`: Transfer state machine, acceptance handover, rejection, SLA escalation, S5 closure helper (`hasOpenTransfers`).
  - `routes.js`: `/api/v1/transfers` REST API endpoints.
  - `index.js`: Public module exports.
- `server/src/modules/sync/`:
  - `models.js`: `Coordination`, `CoordinationTask`, `DisclosureGrant`, `InternalNote`, `CommunicationLog`.
  - `noticeService.js`: Blind opaque counterpart notices (S17).
  - `disclosureService.js`: Purpose-bound, time-boxed disclosure grants (S18).
  - `internalNotesService.js`: Internal notes with sanitization (S24, U23).
  - `syncService.js`: Shared institution view, N75 agreements, task clocks, conflict pre-check, S5 closure helper (`hasPendingTasks`).
  - `seed.js`: S3 fixtures for local run & `npm run reset`.
  - `routes.js`: `/api/v1/sync` REST API endpoints.
  - `index.js`: Public module exports.
- `server/src/modules/queries/`:
  - `models.js`: `Query` schema.
  - `queryService.js`: Timestamped query-reply loop with role separation (N70).
  - `routes.js`: `/api/v1/queries` REST API endpoints.
  - `index.js`: Public module exports.
- `server/src/modules/actions/`:
  - `plugins/caseAction.plugin.js`: Schema plugin for `CaseAction` (`actionSubtype`, `remark`, `evidenceRefs`).
  - `actionService.js`: Role-specific officer actions with S4 pre-action check (N72).
  - `routes.js`: `/api/v1/actions` REST API endpoints.
  - `index.js`: Public module exports.
- `server/src/modules/fieldwork/`:
  - `models.js`: `FieldVisit` schema.
  - `fieldworkService.js`: Inspection scheduling, field report submission with documents (N74).
  - `routes.js`: `/api/v1/fieldwork` REST API endpoints.
  - `index.js`: Public module exports.
- `server/src/modules/insider/`:
  - `models.js`: `InsiderAlert` schema.
  - `insiderService.js`: Audit log pattern scanning with RuleBook `DEMO-INSIDER-v1` (N54).
  - `routes.js`: `/api/v1/insider` REST API endpoints.
  - `index.js`: Public module exports.
- `server/src/modules/absence/`:
  - `plugins/userAbsence.plugin.js`: Schema plugin for `User` (`isOnLeave`, `leaveDetails`).
  - `absenceService.js`: Leave management with active ownership blocking (N60).
  - `routes.js`: `/api/v1/absence` REST API endpoints.
  - `index.js`: Public module exports.
- `server/src/models/plugins.js`: Appended S3 schema plugins (`caseActionPlugin`, `userAbsencePlugin`).
- `server/src/routes.js`: Appended route mounts for S3 modules.
- `scripts/reset.js`, `scripts/seed.js`: Appended `seedS3Fixtures()`.

### Client Pages & Routes
- `client/src/pages/trace/TransfersPage.jsx`
- `client/src/pages/sync/SyncPage.jsx`
- `client/src/pages/queries/QueryThread.jsx`
- `client/src/pages/fieldwork/FieldVerificationPanel.jsx`
- `client/src/pages/insider/InsiderAlertsPage.jsx`
- `client/src/pages/absence/LeaveManagementPage.jsx`
- `client/src/routes/s3.jsx`: Registered routes for `/transfers`, `/sync/:institutionPid`, `/sync`, `/queries/:caseId`, `/fieldwork/:caseId`, `/insider/alerts`, `/leave`.
- `client/src/i18n/s3.en.json` & `client/src/i18n/s3.hi.json`: Complete bilingual translations.
- `client/tests/s3-ui.test.jsx`: Complete Vitest / Testing Library UI suite.

---

## 6. Verification Status

```
$ node scripts/trace-check.js --stage S3
FEATURES.md: 349 rows, expected 349
  TODO            8
  IN-PROGRESS     29
  DONE            88
  GAP             2
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3

Stage S3: 5 IDs not DONE (F20, F21, F22, E02, E06: BLOCKED-SOURCE retained with source notes)
All 15 S3 target items: DONE with passing tagged tests in test-results/results.json.
```
