# NEXUS-IC: Final Complete Solution (Unified Edition), as Markdown

> **Display title (chosen by Manish, 24 Oct):** the product is shown as **AWAAZ DASTAK**, with the subtitle **"powered by NEXUS-IC"**. This is the title only. NEXUS-IC, every module name (NEXUS TRACE, PREVENT, SYNC, PROOF, RESCUE, IMPACT, RULEBOOK, ROUTE, TRUST) and every ID stay exactly as written below.

> Source: `docs/NEXUS-IC_Unified_24Oct.pdf` (26 pages) plus `docs/architecture_journey.png`, `docs/architecture_layers.png`, `docs/workflow.png` and `docs/roles.png` (Appendices V and W).
> This file is a faithful transcription for coding agents. Wording is kept from the PDF. Nothing here may be shortened, reinterpreted or dropped.
> If this file and the PDF ever differ, **the PDF wins**.
>
> **Part B (bottom of this file) is a placeholder for the 23 October specification** (F01–F64, E01–E10, R01–R55, T01–T30, X01–X22, D01–D26, rules C1–C5, G04, PDF sections 4.7, 4.9, 10, 11, 20). Until Part B is filled, any item that depends on it is `BLOCKED-SOURCE` and must not be invented.

Integrated Institution Grievance Monitoring and Resolution System | AICTE | Problem Statement 26264

Edition 24 October 2026. Merges the 23 October specification (64 features, 10 enhancements, 9 corrections, 74 acceptance tests) with the later architecture visuals (the 6-stage journey and the 9-layer solution architecture). Status: proposed design on synthetic data. It is not a deployed AICTE system, and nothing here claims live AICTE, CPGRAMS, ABC/APAAR or SMS access.

---

## 1. Read this first

**What this edition does.** The earlier PDF defined an internal, officer-facing coordination layer (institution 360, overlap review, NEXUS PREVENT, NEXUS SYNC, SLA, audit). The later visuals added the front half of the journey (verified reporters, the institution registry with ICID, single intake, intelligent routing) and the back half (NEXUS TRACE, PROOF, RESCUE, appeal, IMPACT, RULEBOOK, zero-trust security). This document puts both into one specification and records every place where they disagreed (Section 17).

**Conventions.**
- Feature IDs F01-F64 and enhancements E01-E10 are kept unchanged from the PDF.
- New feature IDs from the visuals are N01-N35. New security controls are S01-S30. New acceptance tests are U01-U32. The old T01-T30, X01-X22 and D01-D26 tests stay in force.
- P0 is essential and demonstrated, P1 is a competitive differentiator, P2 is planned or optional. Every item is proposed until a test run proves it.
- Anything that needs an official AICTE system, an identity provider (ABC/APAAR, SSO), a messaging gateway or a legal timeline is contract-gated: it runs against a synthetic simulator until written approval exists.

## 2. Inclusion ledger: what came from where

| Element | Earlier PDF (23 Oct) | Later visuals | Where in this document |
|---|---|---|---|
| AICTE Permanent Institute ID (PID) | Yes (F01) | Yes | Sections 3, 6 |
| ICID / IIC ID | No | Yes (both visuals) | Section 3, then 6, 12, 13 |
| Student, faculty, other-user verification | Partial (demo accounts, F45) | Yes | Section 5 |
| Pseudonymous reporter ID, consent, no-proxy | No | Yes | Section 5.3 |
| Institution master registry with auto-fetch | Partial (F01-F04) | Yes | Section 6.1 |
| Six-region classification | Region field only | Yes | Section 6.3 |
| Institution 360 | Yes (F04) | Extended | Section 6.4 |
| Complaint submission portal | No (internal only) | Yes | Section 7.1 |
| Single Master Case ID | Partial (local ID + source key) | Yes | Section 7.2 |
| Multi-channel intake | Partial (CSV/API adapters) | Yes | Section 7.3 |
| NEXUS PREVENT Stage 1 (intake duplicates) | No | Yes | Section 7.4 |
| NEXUS PREVENT Stage 2 (action conflicts) | Yes (E01, F23-F24) | Yes | Section 8.5 |
| NEXUS ROUTE (intelligent routing) | Partial (assignment, F10) | Yes | Section 8.1 |
| Risk and priority analysis | Partial (demo SLA) | Yes | Section 8.2 |
| NEXUS TRACE (transfer handover) | Yes (F12, 4.7) | Extended | Section 9.2 |
| NEXUS SYNC 2.0 | Yes (E02) | Extended | Section 9.3 |
| NEXUS PROOF (closure) | Partial (F16, F26) | Yes | Section 10.1 |
| NEXUS RESCUE (stalled cases) | Partial (E05, E07) | Yes | Section 10.2 |
| Appeal and review | Partial (reopen, F16) | Yes | Section 10.3 |
| NEXUS IMPACT | Yes (E09) | Extended | Section 10.4 |
| NEXUS RULEBOOK | Partial (F39) | Yes | Section 11 |
| True and transparent status | Partial (F09, F11) | Yes | Section 9.1 |
| Competent Authority and governance | Yes (G04) | Yes | Section 12.2 |
| Zero-trust security framework | Yes (F45-F54) | Yes | Section 13 |
| Technology architecture, mobile, adapters | Web stack only | Yes | Section 14 |
| Tests, roadmap, demo | Yes | not shown | Sections 16, 18 |

## 3. Where the ICID is included

**Assumption to confirm.** The PDF never mentions ICID. In the visuals, the registry panel lists "IIC ID (if available)", Institution 360 lists "IIC ID mapping", and the architecture lists "AICTE Permanent Institute ID (PID) / ICID". This edition treats ICID as a secondary, optional institution identifier (the IIC ID) that maps to a PID. If ICID means something else at AICTE, only the field definition changes; the touchpoints below stay the same.

**Hard rules.**
1. The PID is the only authoritative institution key. ICID is a lookup and corroboration identifier.
2. ICID is never used alone to link or merge institutions.
3. If a PID and an ICID disagree, the record goes to the identity-review queue instead of being auto-resolved.
4. A missing ICID is shown as "not available", never as a failed verification.

**Every point where ICID appears.**

| # | Touchpoint | How ICID is included |
|---|---|---|
| 1 | Registry lookup (stage 2) | Enter PID; the fetched profile shows ICID when available |
| 2 | Auto-fetch panel | ICID listed with name, state/district, region, type, campus, approval status |
| 3 | Institution 360 | "IIC ID mapping" block: ICID, mapped PID, source, last verified date |
| 4 | Global search (R32) | ICID accepted as a search key; it resolves to the PID, then PID rules apply |
| 5 | Case creation | Case stores a snapshot of PID plus ICID at submission time |
| 6 | Matching Stage A | ICID agreement is supporting identity evidence; ICID conflict forces IDENTITY_REVIEW |
| 7 | Data model | New collection institution_identifiers (Section 15); institutions gains an icid field |
| 8 | API | GET /api/v1/institutions?icid=...; adapter contract carries institutionIdentifiers {pid, icid} |
| 9 | Imports | Rows with PID/ICID mismatch are quarantined to data-health review |
| 10 | Reports and export | Institution-wise report has an ICID column when permitted |
| 11 | Audit | Any ICID add, change or mapping correction is an attributed event |
| 12 | Tests | U01-U04 (Section 16) |

## 4. Product purpose and boundary (reconciled)

**Purpose.** One institution, one view, one complaint journey, accountable resolution. The unified product has two faces on one backend: a complainant-facing intake and tracking portal, and an officer-facing coordination workspace.

**Design goals (not measured results).** Right institution, verified reporter, right bureau, no lost transfers, faster accountable resolution, transparent governance. These come from the visual's footer and are verified only by the test suites, never asserted as achieved savings.

| The product is | The product is not |
|---|---|
| A verified-reporter intake portal plus institution-wise coordination layer | A replacement for CPGRAMS or a promise of CPGRAMS write access |
| Explainable routing and overlap suggestions that humans confirm | An automatic judge of guilt, legality or case outcome |
| A workflow with acknowledgements, rescue alerts and audit trail | An unapproved disclosure channel between bureaus |
| A configurable SLA and policy engine (RuleBook) | A system with one assumed AICTE-wide 21-day rule |
| A synthetic-data demonstrator with reproducible tests | A deployed AICTE system or proof of real savings |

**The six-stage journey.**

| Stage | Name | Core components | Section |
|---|---|---|---|
| 1 | Verified users | Student, faculty, other authorized users; privacy-protected identity | 5 |
| 2 | Institution identification and regional classification | Master registry, PID/ICID, six regions, Institution 360 | 3, 6 |
| 3 | Grievance submission and case creation | Portal, Master Case ID, multi-channel intake, PREVENT Stage 1 | 7 |
| 4 | Intelligent routing and analysis | NEXUS ROUTE, risk and priority, PREVENT Stage 2 | 8 |
| 5 | Coordinated processing across bureaus | Workflow, NEXUS TRACE, NEXUS SYNC 2.0 | 9 |
| 6 | Resolution and impact | PROOF, RESCUE, appeal, IMPACT | 10 |

## 5. Stakeholders, verified users and privacy-protected identity (stage 1)

### 5.1 Stakeholders and entry points
Students, faculty and staff, institutions and colleges, regional offices, AICTE bureaus and cells, and the Competent Authority all use one unified coordination system, each through a role-scoped entry point.

### 5.2 Verification by user type

| User type | Verification evidence | Controls | Status |
|---|---|---|---|
| Student (N01) | ABC / APAAR-linked identity; current enrolment check against institution records | OTP and MFA; no proxy registration | Simulator now; real link contract-gated |
| Faculty (N02) | Institution staff registry; current employment verification; institutional login / SSO | OTP and MFA; no proxy registration | Simulator now; SSO contract-gated |
| Other authorized users (N03) | Institution admin records; regional and bureau officials; AICTE staff via SSO | Role-based access control | Demo accounts now |
| Institution official | Authorized-representative record | Consent-based access, SSO | P1 |

OTP/MFA is N04 (P0). In the prototype, OTP goes to a local sink, never a real phone.

### 5.3 Privacy-protected identity
- **Minimal data (N06).** Collect only what verification and routing need.
- **Consent-based verification (N07).** Each verification step records a consent entry (purpose, scope, time, withdrawal). Consent state is shown to the user.
- **Pseudonymous reporter ID (N06).** Officers and other bureaus see a reporter ID such as RP-7K2Q, not a name. The real identity sits in a separate identity vault collection.
- **Reveal on need.** Identity is visible only to authorized officers when required. Every reveal needs a purpose, approver and expiry, and is audited. Institution admins and counterpart bureaus never receive reporter identity by default.
- **Alternative verification (N08).** Users without ABC/APAAR or SSO can use an officer-assisted path with manual verification, logged and rate-limited.

### 5.4 Anti-proxy and fraud signals (N05)
One verified person per account; repeated registration attempts, mismatched enrolment or employment, burst submissions, and shared devices raise a fraud signal that routes to manual verification. A signal never auto-rejects a grievance; a human decides.

## 6. Institution identification, regions and Institution 360 (stage 2)

### 6.1 AICTE Institution Master Registry (N10)
The user enters the PID (example format shown in the UI: 1-1234567890). The registry returns a read-only profile:

| Fetched field | Notes |
|---|---|
| College name | Verified aliases shown separately (F03) |
| State / district | Feeds region classification |
| AICTE region | One of six (6.3) |
| Institution type | From registry |
| Campus details (if any) | Campus hierarchy rules (F02) |
| IIC ID / ICID (if available) | Section 3 |
| Approval status | Shown with as-of date |

If the registry is unavailable, the screen shows UNKNOWN with the reason, never a blank profile or zeros (F48, F56).

### 6.2 Identity rules
PID is exact-match only and never fuzzy-linked. Similar names with different PIDs are a hard identity block (D06). Ambiguous campuses go to review (F02, T02).

### 6.3 Region-wise classification (N11)
Cases carry one of six AICTE regions: Northern, Western, Southern, Central, Eastern, North Eastern. The state-to-region mapping lives in a versioned reference table that must be loaded from AICTE's official list, not typed from memory. Reclassification is a reviewer action with a reason. Regional officers see only their delegated region (R50).

### 6.4 Institution 360 (N12, extends F04)
Contents: complete institution profile; all related grievances, ongoing and past; actions taken by each bureau; region and jurisdiction details; IIC ID mapping; and attention indicators. Visibility follows the single-window contract in the PDF: other bureaus' entries appear as opaque metadata, restricted entries are disclosed as "restricted entries", and completeness is never faked.

**Naming change.** The visual says "risk indicators". To stay consistent with E07 and the no-guilt-score rule, this edition calls them attention indicators: transparent operational reasons such as overdue tasks, stalled acknowledgements and source conflicts. They are not an institutional wrongdoing or compliance score.

## 7. Grievance submission and case creation (stage 3)

### 7.1 Grievance submission portal (N13)
- Structured form with category and sub-category.
- Guided fields with examples for each field.
- Upload of supporting documents. Allowed types and size are enforced, files are malware-scanned and hashed (S12), and access is scoped.
- Institution is linked automatically from the verified PID.
- Preview and confirm before submit; the user can edit until confirmation.

### 7.2 Case creation (N14)
- Single Master Case ID for the whole journey, for example NX-2026-000123 (format illustrative). The same ID survives routing, transfers and appeals.
- Original external references are preserved. An imported CPGRAMS or bureau reference stays as externalRefs[] next to the Master Case ID. The PDF rule stays: the source-native ID is never overwritten and (sourceSystem, sourceCaseRef) remains unique (T09).
- Duplicate-registration validation before the case is created.
- Confirmation of institution and user details.

### 7.3 Multi-channel intake (N15)

| Channel | Status | Note |
|---|---|---|
| Web portal | P0 | Responsive React app |
| Mobile app | P1 as installable PWA; native Android/iOS is P2 | Same API and same verification |
| Email | P1 | Inbound to a monitored mailbox; sender must complete verification before a case is created |
| API (future) | P2, contract-gated | For approved partner systems |
| Import of existing systems | P1 | CSV preview, dry-run, idempotent commit (F15, F49) |

### 7.4 NEXUS PREVENT Stage 1: duplicate complaint check at intake (N16)
Before submission, the system compares the draft with open and past cases for the same verified institution.
1. Detect similar or duplicate complaints (same institution, same issue concept, overlapping period).
2. Check the same institution plus same issue.
3. Alert the user before submitting.
4. Allow a new case if the complaint is genuinely different.
5. Explain why it looks similar.

**Privacy guard (added).** The hint shown to a complainant refers only to that complainant's own earlier cases, or to a generic "a similar open matter exists" notice. It never shows another person's text, identity or case number. A match is advisory, is logged with the user's choice, and never blocks or merges anything.

## 8. Intelligent routing and analysis (stage 4)

### 8.1 NEXUS ROUTE: explainable jurisdiction engine (N18)
Routing uses several factors together: grievance category and sub-category; institution type and AICTE region; bureau and cell jurisdiction rules; existing ongoing cases for the same institution; policy and regulatory guidelines; and a confidence score with its explanation.

**Routing decision (always explainable).**
- Primary bureau or cell.
- Secondary bureau or cell, if required.
- Manual review, if the case is ambiguous or confidence is below the RuleBook threshold.
- Reason for routing, stored with the rule version.

Bureaus and cells in the architecture include the Regulation Bureau (RB), the Public Grievance Redressal Cell (PGRC), Regional Offices, the Academic Bureau, the Approval Process bureau, and other cells as configured.

**Guardrails.** Deterministic RuleBook rules run first; any ML ranking is optional and cannot override them. An officer can override a route only with a recorded reason. Routing assigns work; it does not decide the merits of a complaint and does not move ownership later (later moves go through NEXUS TRACE). Demo rules are labelled DEMO-ROUTE-v1 and are synthetic.

### 8.2 Risk and priority analysis (N19)
- Automatic priority: normal, high or urgent, from category, sensitivity and age.
- Sensitivity detection (for example ragging or safety) from category plus versioned keyword rules. A human confirms every sensitive flag, and sensitive cases get restricted handling.
- SLA timeline set by category from the RuleBook, with a policy clock (Section 11).
- Policy and compliance flags for officers.
- The priority reason is shown to the officer. It is a workload-prioritization signal, never a guilt or institutional compliance score. Urgent maps to the synthetic DEMO-CASE-PRIORITY-v1 policy in the demo.

### 8.3 Overlap detection (unchanged from the PDF)
The seven-signal weighted matcher (issue 25, time window 15, category 10, document or subject 15, remedy 10, shared entities 10, semantic 15), the identity gate and the thresholds all stay as specified, including the worked 93.75 example and the exact banner text **Potential Overlapping Cases – Coordination Required** on /dashboard, /institutions/:id and /review. The matcher now also receives ICID as supporting identity evidence (Section 3).

> Thresholds, identity gate and the worked 93.75 example are defined in the 23 Oct PDF → Part B. Do not invent them.

### 8.4 Routing output states
REGISTERED -> ROUTED (with decision record) -> ASSIGNED (officer named). Ambiguous cases wait in a human triage queue; they are never silently assigned.

### 8.5 NEXUS PREVENT Stage 2: duplicate action and conflict detection (N17)
This is the E01 pre-action checker, now shown as stage 2 of PREVENT. It detects overlapping actions across bureaus, repeated document requests, and conflicting instructions; shows related ongoing cases; suggests coordination before proceeding; and raises real-time alerts to officers. Output is CLEAR, REVIEW or UNKNOWN with reasons and counter-reasons, using rules C1-C5 from the PDF. Missing or stale feeds return UNKNOWN. It never blocks an official act.

> Rules C1-C5 are defined in the 23 Oct PDF → Part B.

## 9. Coordinated processing across bureaus (stage 5)

### 9.1 Truthful case lifecycle and status (N28)
Statuses: Registered (also called Submitted), Assigned, Under Process, Transfer Requested, Transfer Accepted, Under Review, Resolution Proposed, Verified/Approved, Closed.

Four parallel tracks per case: case status, transfer status, current owner, and SLA clock with escalation. A transferred case must never revert to Registered or Submitted.

| Lifecycle status | Mapped analytic status (F09) | Note |
|---|---|---|
| Registered | PENDING | Native status kept alongside |
| Assigned | PENDING | Owner named |
| Under Process, Under Review | IN_PROCESS | |
| Transfer Requested, Transfer Accepted | IN_PROCESS plus transferStatus | Counted in the transferred metric by event |
| Resolution Proposed, Verified/Approved | IN_PROCESS | Awaiting closure gate |
| Closed | DISPOSED | Escalated is a flag, not a status |

**What the complainant sees (true and transparent status).** The exact current status; no false closure; the accountable owner shown as office and role; real-time updates; a complete status history; the SLA clock and escalation alerts in summary form. Internal notes, other bureaus' narratives and reporter identity stay hidden.

### 9.2 NEXUS TRACE: zero-loss handover (N20)
Sequence: Transfer Requested -> Acceptance Pending -> Transfer Accepted.
1. The original Case ID remains the same.
2. Every transfer must be acknowledged by the receiving bureau.
3. Ownership is always visible: at any moment a case has one accountable owner, or an open transfer with a named sender who stays accountable.
4. Escalation fires if not acknowledged in time (synthetic DEMO-TRANSFER-ACK-v1: 2 business days).
5. Full transfer history with timestamps.
6. A rejection returns to the sender's queue with its reason; nothing is reassigned silently.

"No lost transfers" is a design goal, enforced by invariant tests T15, U20-U22, and not a measured result.

### 9.3 NEXUS SYNC 2.0 additions (N21)
Builds on E02 and its state machine. Adds: a shared view of all related cases for an institution; task coordination and document sharing (documents move only through scoped, time-bound grants); internal discussions and notes visible to officers in scope only; a common communication log; prevention of conflicting instructions; and escalation of unresolved inter-departmental cases. Task completion is never case disposal.

### 9.4 Processing workflow
Assigned to bureau -> Under Process -> Transfer (if required) -> Verification and Action -> Resolution Proposed. Each step records actor, time, remark and evidence.

## 10. Resolution and impact (stage 6)

### 10.1 NEXUS PROOF: evidence-based closure (N22, N23)
- Resolution needs evidence-based support and mandatory action records.
- Final documents are uploaded and hashed.
- An authorized officer approves; the approver must differ from the proposer.
- The complainant's feedback is collected after resolution is proposed or verified (N23). Feedback is recorded and shown to reviewers; it does not itself close, reopen or change a case.
- **Closure gate.** Closure is a human action, but the system blocks it until every task is complete, every transfer is acknowledged, evidence is attached and approval exists. The system never closes a case on its own.

### 10.2 NEXUS RESCUE: stalled-case recovery (N24)
Detects stalled or repeatedly transferred cases; alerts supervisors automatically; shows the reason for delay; suggests the next action; and prevents indefinite pendency.

Synthetic triggers (DEMO-RESCUE-v1, configurable in the RuleBook): three or more transfers; no recorded event for 7 calendar days on an open case; a transfer acknowledgement past its escalation point; a coordination task overdue twice. Alerts are deduplicated. Reasons point to work items, not to misconduct, and a late-arriving feed never counts as officer delay (F43).

### 10.3 Appeal and review (N25)
The complainant can appeal if required. Flow: Closed -> Appeal Filed -> Under Appeal Review (level 1 to n) -> Upheld, Modified or Remanded (reopened). Additional evidence can be submitted; the final decision is tracked. Appeals are new events; the original record is untouched (F16). The appeal reviewer must differ from the original resolver. The appeal window and number of levels come from the RuleBook, not from assumption.

### 10.4 NEXUS IMPACT: analytics and continuous improvement (N26)
Resolution-time tracking; reduction in duplicate actions; bureau-wise and region-wise insights; policy-level recommendations; downloadable reports. Safeguards from E09 apply: results are labelled synthetic until a pilot exists, every percentage shows numerator, denominator and scope, "action flagged" is never counted as "action avoided", and a policy recommendation must cite the report rows it rests on.

## 11. NEXUS RULEBOOK: policy configuration (N27)
One versioned registry that drives routing, SLA, transfer and escalation behaviour without code changes.

| Rule family | Drives | Demo ID (synthetic) |
|---|---|---|
| Jurisdiction rules | Which bureau or cell owns a category in a region | DEMO-ROUTE-v1 |
| Routing rules | Primary and secondary route, confidence threshold | DEMO-ROUTE-v1 |
| SLA timelines by category | Case clock, near-due, overdue | DEMO-CASE-STANDARD-v1, DEMO-CASE-PRIORITY-v1 |
| Transfer policies | Acknowledgement window | DEMO-TRANSFER-ACK-v1 |
| Escalation matrix | Who is told, and when | per policy above |
| Coordination and task clocks | SYNC and task deadlines | DEMO-SYNC-ACK-v1, DEMO-TASK-v1 |
| Rescue triggers | Stalled-case detection | DEMO-RESCUE-v1 |
| Appeal rules | Window, levels, reviewer separation | not seeded (POLICY_NOT_CONFIGURED) |

**Controls.** Every edit creates a new version with an effective date and is never retroactive. Changes need two-step approval (requester differs from approver) and a dry-run against the fixture set first. Versions are immutable and audit-ready. In production mode demo rules cannot be selected; a missing approved rule gives POLICY_NOT_CONFIGURED or UNKNOWN. No AICTE-wide deadline is assumed.

## 12. Workspaces, governance and outcomes (layers 8-9)

### 12.1 Role-based workspaces

| Workspace | Content | Route |
|---|---|---|
| Institution 360 | Profile, PID/ICID, cases, actions, region | /institutions/:id |
| Officer dashboard | My cases, tasks, SLA, actions | /dashboard |
| Regional view | Region-wise cases and analytics | /dashboard (regional scope) |
| Bureau/Cell queue | Assigned cases and coordination | /cases, /sync |
| Competent Authority workspace | Monitor, intervene, approve | /authority |
| Notifications | In-app, email, SMS (SMS sandbox until approved) | notification centre |
| Reports and analytics | Trends, performance, region-wise insights; ICID column when permitted | /reports |
| Audit trail | Complete history of all actions | /audit |
| Feedback and appeal | User feedback and appeal handling | /track/:caseId (complainant), /review |
| NEXUS IMPACT metrics | Outcome and impact measurement | /impact |

### 12.2 Governance and oversight
The Competent Authority dashboard shows all institutions and all cases in one view; pending, overdue and transferred cases; region-wise and bureau-wise insights; approvals and escalations; notifications; audit and evidence history; impact metrics; and feedback. Sensitive approvals need requester and approver to differ. Authority never gains automatic access to reporter identity or private narratives (D16).

### 12.3 Extended role matrix (additions to the PDF matrix)

| Role | Can see | Cannot see |
|---|---|---|
| Complainant (student or faculty) | Own cases, own status history, own documents | Other users' cases, internal notes, officer identities beyond office and role |
| Institution admin | Institution profile, cases about their institution in the redacted institution-facing form, requests addressed to them | Reporter identity, other bureaus' internal notes |
| All officer roles from the PDF | As specified in Section 10 of the PDF matrix | Unchanged |

### 12.4 Designed outputs and outcomes
Faster routing, clear ownership, no lost transfers, reduced duplication, timely resolution, verified accountability, real-time monitoring, institution-wise and region-wise insights. For managers: monitoring of pending, disposed, transferred and escalated cases; truthful status tracking; cross-bureau overlap detection; exact ownership at every stage; alerts for approaching timelines; complete audit history; decision support. These are design outputs; each is proven only by the tests in Section 16.

## 13. Security and privacy framework (zero-trust design)
Encryption, certification and compliance below are design proposals; none is claimed as achieved. "Source" shows whether a control came from the earlier PDF, the later visuals, or is added in this edition to close a gap the merge exposed.

| ID | Control | Source | Proved by |
|---|---|---|---|
| S01 | Zero trust: every request re-authorized server-side | PDF, visual | T14, X22 |
| S02 | RBAC by bureau, region and case level | Visual | U31 |
| S03 | Field-level ABAC on read, write, search, export, socket, file | PDF | T11, T14 |
| S04 | Minimal data collection | Both | U05 |
| S05 | Consent-based identity verification with consent ledger | Visual | U10 |
| S06 | Pseudonymous reporter ID in all officer views and exports | Visual | U08 |
| S07 | Identity vault separate from case data; audited, expiring reveal | Added | U09 |
| S08 | Encryption at rest and in transit (for real deployment) | Both | Deployment review |
| S09 | Tamper-evident audit log (hash chain, not a blockchain claim) | Both | T30 |
| S10 | Secure document storage with authorization on every download | Both | D21 |
| S11 | Server-proxied or signed downloads; raw storage keys never exposed | PDF | T13 |
| S12 | Upload type and size checks, malware scan, file hash | Added | U11 |
| S13 | Regular security audits and compliance reviews | Visual | Audit schedule, S34 |
| S14 | OTP and MFA | Visual | U05, U06 |
| S15 | Anti-proxy checks, fraud signals, rate limits | Visual, added | U07 |
| S16 | HttpOnly Secure session cookies, no tokens in localStorage | PDF | Auth tests |
| S17 | Blind, opaque cross-bureau notices | PDF | T12, X14 |
| S18 | Purpose-bound, time-boxed disclosure grants | PDF | T13, X13 |
| S19 | Competent Authority cannot bypass field ABAC | PDF | D16 |
| S20 | Requester differs from approver on sensitive approvals | PDF | D15, U25 |
| S21 | Complainant sees own cases only; IDOR denied | Added | U31 |
| S22 | Institution admin never sees reporter identity | Added | U32 |
| S23 | Intake similarity hints leak no third-party data | Added | U14 |
| S24 | Internal notes never reach the complainant | Added | U23 |
| S25 | Anti-retaliation: no reporter identity in notifications, exports or logs; sensitive cases get restricted handling | Added | U18, U08 |
| S26 | Consent withdrawal and retention hooks (DPDP-informed; legal review needed) | Visual, PDF | U10, F52 |
| S27 | Idempotent outbox; email and SMS carry no narrative or PII | PDF | D17-D19 |
| S28 | No complainant text in logs | PDF | Log review |
| S29 | Backup, restore, import replay | PDF | T09 |
| S30 | Threat model and penetration-test checklist before any pilot | Added | Pre-pilot gate |

GIGW 3.0 and WCAG 2.1 AA practices guide the UI; "accessible by design" is not a certification.

> Note: S13 says "Audit schedule, S34". There is no S34 in this document (security IDs end at S30). Treat as written; flag to the team, do not renumber.

## 14. Technology architecture
The architecture stays a modular JavaScript monolith: React JSX with Vite, Express in plain JavaScript on Node.js, MongoDB with Mongoose, Tailwind, React Router, TanStack Query, Recharts, optional React Flow. **No TypeScript. No Digital Twin.**

| Visual layer | Implementation in this specification | Priority |
|---|---|---|
| Web portal (responsive UI) | React JSX app with complainant and officer areas | P0 |
| Mobile app (Android / iOS) | Installable PWA on the same API first; native apps later | P1 PWA, P2 native |
| Database (secure, scalable) | MongoDB replica set, indexed collections | P0 |
| Document storage (encrypted) | Private object store, encrypted, scanned, hashed | P0 |
| APIs and integration layer | REST API plus adapters for AICTE systems, institution registry, CPGRAMS | Synthetic now; real contract-gated (P2) |
| Integration adapters | Source adapter contract with snapshots and watermarks (PDF Section 11) | P0 synthetic |
| Business logic and workflow engine | Rule-based, driven by the RuleBook, configurable without code changes | P0 |
| Analytics and reporting engine | One query builder for UI, CSV and PDF (PDF 4.9) | P0 |

New server modules beside the PDF's modules: identity (verification, consent, vault), registry (PID/ICID), intake, routing, rescue, appeals, rulebook, feedback. New client pages: Track.jsx (complainant), Submit.jsx, Verify.jsx, Appeals.jsx, RuleBook.jsx.

## 15. Data model, APIs and feature catalogue

### 15.1 New and extended collections

| Collection | Key fields | Invariant |
|---|---|---|
| institution_identifiers | institutionId, pid, icid, source, verifiedAt, status | PID unique; ICID never links alone; conflict goes to review |
| reporter_accounts | pseudonymousReporterId, userType, verificationMethod, verifiedAt, status | No raw identity stored here |
| identity_vault | reporterId, encrypted identity payload, keyRef | Reveal only via approved, expiring, audited request |
| consent_records | reporterId, purpose, scope, grantedAt, withdrawnAt | Append-only |
| cases (extended) | masterCaseId, externalRefs[], channel, subCategory, priority, sensitivityFlags, routingDecisionId, pidSnapshot, icidSnapshot | Master ID stable; (sourceSystem, sourceRef) unique |
| routing_decisions | caseId, primary, secondary, confidence, reasons, ruleVersion, overriddenBy, reason | Immutable |
| intake_similarity_checks | draftHash, reporterId, shownHints, userChoice | No third-party text stored |
| closure_records | caseId, evidenceRefs, proposedBy, approvedBy, gateResults, packetHash | Approver differs from proposer |
| feedback_records | caseId, reporterId, rating, text, at | Does not change status |
| appeals | caseId, level, filedAt, evidenceRefs, reviewerId, outcome | Original case events untouched |
| rescue_alerts | caseId, trigger, ruleVersion, supervisorId, state, dedupeKey | Unique dedupeKey |
| communication_log | caseId or coordinationId, from, to, channel, at | Append-only |
| rule_book_versions | family, body, effectiveFrom, approvedBy, requestedBy | Immutable; non-retroactive |

### 15.2 New API routes (all server-authorized; error codes as in the PDF)

| Method | Route | Purpose |
|---|---|---|
| POST | /api/v1/auth/verify/student, /faculty | Verification (simulator in prototype) |
| POST | /api/v1/consents, /consents/:id/withdraw | Consent ledger |
| POST | /api/v1/identity/reveal-requests | Audited reveal request |
| GET | /api/v1/registry/institutions/:pid | Registry lookup and auto-fetch, includes icid |
| GET | /api/v1/institutions?icid= | ICID search, resolves to PID |
| POST | /api/v1/grievances/draft, /check-similar | Draft and intake similarity check |
| POST | /api/v1/grievances | Submit; returns masterCaseId |
| POST | /api/v1/routing/:caseId/decide, /override | Route and override with reason |
| GET | /api/v1/track/:caseId | Complainant status view (own cases only) |
| POST | /api/v1/cases/:id/closure/propose, /approve | PROOF closure gate |
| POST | /api/v1/cases/:id/feedback | Complainant feedback |
| POST | /api/v1/cases/:id/appeals, /appeals/:id/decide | Appeal and review |
| GET | /api/v1/rescue/alerts | Stalled-case alerts for supervisors |
| GET, POST | /api/v1/rulebook/families, /versions | RuleBook read and versioned change |

### 15.3 Feature catalogue N01-N35 (added to F01-F64)

| ID | Feature | Pri | Section |
|---|---|---|---|
| N01 | Student verification (ABC/APAAR-linked, enrolment check) | P0 simulated | 5.2 |
| N02 | Faculty verification (staff registry, employment, SSO) | P0 simulated | 5.2 |
| N03 | Other authorized user onboarding | P0 | 5.2 |
| N04 | OTP and MFA | P0 | 5.2 |
| N05 | Anti-proxy and fraud signals | P1 | 5.4 |
| N06 | Pseudonymous reporter ID and identity vault | P0 | 5.3 |
| N07 | Consent-based verification and ledger | P0 | 5.3 |
| N08 | Alternative verification path | P1 | 5.3 |
| N09 | ICID / IIC ID field, mapping and search | P0 | 3 |
| N10 | Institution master registry lookup and auto-fetch | P0 | 6.1 |
| N11 | Six-region classification | P0 | 6.3 |
| N12 | Institution 360 extended with attention indicators | P0 | 6.4 |
| N13 | Grievance submission portal | P0 | 7.1 |
| N14 | Master Case ID, external refs, duplicate-registration check | P0 | 7.2 |
| N15 | Multi-channel intake | P0 web, P1 others | 7.3 |
| N16 | PREVENT Stage 1: intake similarity check | P1 | 7.4 |
| N17 | PREVENT Stage 2: action conflict detection | P1 | 8.5 |
| N18 | NEXUS ROUTE | P0 | 8.1 |
| N19 | Risk and priority analysis | P0 | 8.2 |
| N20 | NEXUS TRACE extended | P0 | 9.2 |
| N21 | SYNC 2.0 notes, communication log, conflict prevention | P1 | 9.3 |
| N22 | NEXUS PROOF closure gate | P0 | 10.1 |
| N23 | Complainant feedback | P1 | 10.1 |
| N24 | NEXUS RESCUE | P1 | 10.2 |
| N25 | Appeal and review | P1 | 10.3 |
| N26 | NEXUS IMPACT extended, downloadable reports | P1 | 10.4 |
| N27 | NEXUS RULEBOOK | P0 | 11 |
| N28 | True and transparent complainant status | P0 | 9.1 |
| N29 | Complainant workspace | P0 | 12.3 |
| N30 | Institution admin scoped view | P1 | 12.3 |
| N31 | Encrypted document storage with malware scan | P0 | 13 |
| N32 | Integration adapters for real AICTE and CPGRAMS systems | P2 | 14 |
| N33 | Native Android and iOS apps | P2 | 14 |
| N34 | Recurring security audit programme | P1 | 13 |
| N35 | Minimal status notices by email and SMS to complainants | P1 | 12.1 |

## 16. Acceptance tests added: U01-U32
The T01-T30, X01-X22 and D01-D26 tests remain in force. A test counts as passed only with an archived real run.

| ID | Verifiable behaviour |
|---|---|
| U01 | PID lookup returns the profile, including ICID when available |
| U02 | ICID search resolves to the PID; ICID alone never links institutions |
| U03 | PID and ICID disagreement goes to identity review, not auto-resolved |
| U04 | Missing ICID shows "not available"; case creation still works |
| U05 | Student without valid enrolment cannot submit a verified grievance |
| U06 | Faculty with inactive employment is rejected |
| U07 | Proxy registration attempt is blocked and flagged |
| U08 | Reporter ID is pseudonymous in officer views and exports |
| U09 | Identity reveal needs purpose and approver, expires, and is audited |
| U10 | Consent withdrawal is handled per policy and recorded |
| U11 | Form validation, preview, and edit-before-confirm work; bad uploads are rejected |
| U12 | Master Case ID is unchanged after routing, transfer and appeal |
| U13 | External reference is preserved; duplicate registration is blocked |
| U14 | Similarity alert explains why, lets the user proceed, shows no third-party data |
| U15 | Email from an unverified sender creates no case |
| U16 | Routing returns primary, secondary and reason; ambiguous goes to manual review |
| U17 | Route override requires a reason and is audited |
| U18 | Sensitive category is flagged, human-confirmed, and restricted |
| U19 | Priority change alters the clock via a RuleBook version, never retroactively |
| U20 | Transfer needs acknowledgement, escalates after the window, owner always visible |
| U21 | Rejected transfer returns to the sender's queue with its reason |
| U22 | A transferred case never reverts to Registered |
| U23 | Internal notes are invisible to the complainant |
| U24 | Closure is blocked until the gate passes |
| U25 | Closure approver differs from proposer |
| U26 | Feedback is stored and does not change status |
| U27 | RESCUE fires on three transfers or a stall, once per case (deduplicated) |
| U28 | Appeal adds events, leaves the original intact, uses a different reviewer |
| U29 | RuleBook edit makes a new version with dry-run and two-step approval |
| U30 | IMPACT report downloads with denominator and synthetic label; recommendations cite rows |
| U31 | Complainant sees only own cases; IDOR attempts are denied |
| U32 | Institution admin sees no reporter identity |

Total acceptance suite: T01-T30, X01-X22, D01-D26 and U01-U32 (110 checks).

> Note: 30 + 22 + 26 + 32 = 110. Section 0 says the 23 Oct PDF had "74 acceptance tests" and T+X+D = 78. Keep both numbers as written; flag the difference to the team, do not resolve it in code.

## 17. Where the two sources disagreed, and the resolution

| Topic | Earlier PDF | Later visuals | Resolution |
|---|---|---|---|
| Audience | Internal officer tool; not an intake system | Complainant-facing portal | Both faces exist on one backend; complainant role is strictly scoped (Section 12.3) |
| Risk indicators | No institutional guilt or compliance score | "Risk indicators" on Institution 360 | Renamed attention indicators with visible reasons |
| Auto-routing | No automatic decisions | Automatic jurisdiction engine | Routing assigns work only; ambiguous goes to a human; override with reason |
| Closure | No automatic closure | "Closure only after all actions completed" | System gates closure; a human performs it |
| Real-time status for users | Minimal disclosure | Full transparent status | Complainant sees own status only; internal notes hidden |
| Duplicate check at intake | PREVENT is a pre-action officer check | AI case matching at intake | Added as Stage 1 with a privacy guard |
| Mobile app | JavaScript web stack only | Android / iOS | PWA first; native is P2 |
| ICID | Absent | Present | Secondary identifier; PID stays authoritative |
| SLA values | Seeded demo only | Category-wise SLA | RuleBook with demo defaults; production without approved rule shows POLICY_NOT_CONFIGURED |
| Outcome claims | No claimed savings | "No lost transfers", "faster resolution" | Treated as design goals proven by tests, not as results |

## 18. Roadmap, decisions needed and definition of done

**Staged delivery (extends PDF Section 20).**

| Stage | Adds | Evidence |
|---|---|---|
| S0 Foundation | Repo, seed, auth, demo and complainant accounts | Reproducible install and reset |
| S1 Mandatory PS plus front half | F01-F13, F29-F35, N01-N04, N06, N07, N09-N14, N31 | R01-R55 demonstrable; U01-U13 |
| S2 Trust and routing | F14-F19, F48-F49, N18, N19, N27, N28 | Hard negatives, U16-U19, U29 |
| S3 SYNC and TRACE | F20-F22, E02, E06, N20, N21 | Handshake, receipt, U20-U23 |
| S4 PREVENT | F23-F24, E01, N16, N17 | U14, X01-X04 |
| S5 Closure and recovery | N22-N26, N29, N30, N35 | U24-U32 |
| S6 Differentiators | F05-F06, F28, F36-F38, E03-E10 | Graph, radar, impact |
| S7 Release evidence | T, X, D and U suites, screenshots, limitations | No critical privacy or identity failure |

> Note (S0–S7 here are delivery stages; S01–S30 are security controls. Same letter, different things.)

**Decisions and approvals needed from AICTE or the team.**
1. Confirm what ICID stands for and its authoritative source (Section 3).
2. Approve the complainant-facing scope, or keep the portal as a prototype module only.
3. Obtain written access terms for ABC/APAAR, institution registries, SSO, CPGRAMS and SMS gateways; until then use simulators.
4. Provide the official state-to-region mapping, category list, jurisdiction rules, SLA timelines, appeal levels and escalation matrix for the RuleBook.
5. Legal and security review of consent, pseudonymous identity, retention and reveal rules before any pilot.

**Definition of done.** Every requirement R01-R55 is mapped and working or listed as a gap; every P0 feature passes its UI and API tests; the two-bureau judge scenario runs without database edits; no restricted data leaks in any negative-role test; missing feeds never display as zero; and every figure comes from an actual local run. Not claimed: live AICTE data, government approval, measured savings, or certified compliance.

**References**
1. AICTE Public Grievance Redressal Cell: https://www.aicte-india.org/bureaus/grievance-redressal
2. AICTE Centralized Support System: https://www.aicte.gov.in/centralized-support-system
3. CPGRAMS public portal, DARPG: https://pgportal.gov.in/
4. Guidelines for Indian Government Websites and Apps (GIGW 3.0): https://guidelines.india.gov.in/guidelines/
5. DARPG comprehensive public grievance guidelines, 23 August 2024: https://www.darpg.gov.in/sites/default/files/Comprehensive_guidelines_for_handling_the_Public_Grievances.pdf
6. MeitY Digital Personal Data Protection Rules, 2025 (check applicable enforcement stage with counsel)

Internal: NEXUS-IC Final Complete Solution PDF (23 October 2026); NEXUS-IC architecture visuals (6-stage journey and 9-layer solution architecture).

---

## Appendix V: details that appear only in the two architecture images

These are on the visuals but not spelled out in the PDF text. They belong to existing IDs (shown in brackets). They are **not** new features and must be built as part of the ID they belong to.

**6-stage journey image (`architecture_journey.png`)**
- Header taglines: "Verified People • Verified Institutions • Coordinated Bureaus • No Lost Transfers • Faster, Accountable Resolution"; "One Institution, One View, One Complaint Journey, Real Resolution"; pillars "Transparent, Accountable", "Student & Faculty Focused", "Institution-Centric View", "Actionable Insights for Better Governance". Use on the landing / login page. [N13, N29]
- Stage 1 panel is titled "USER VERIFICATION (NEXUS TRUST)". Use the name NEXUS TRUST in the UI for the verification module. [N01-N08]
- Stage 2 search box placeholder: "Enter AICTE Permanent Institute ID (PID)", example "e.g., 1-1234567890", with a search button; a "Fetch Institution Details (Auto)" checklist; a "REGION-WISE CLASSIFICATION" panel with an India map and six coloured region chips. [N10, N11]
- Stage 3 intake channel tiles: Web Portal, Mobile App, Email, API (Future), Import from Existing Systems. PREVENT Stage 1 is labelled "AI-ASSISTED CASE MATCHING (NEXUS PREVENT - Stage 1)". [N15, N16]
- Stage 4 "Routing Decision (Explainable)" box with Primary Bureau / Cell, Secondary Bureau (if required), Manual review (if ambiguous), Reason for routing. [N18]
- Stage 5 workflow strip: Assigned to Bureau → Under Process → Transfer (if required) → Verification & Action → Resolution Proposed; bureau tiles: Regulation Bureau (RB), Public Grievance Redressal Cell (PGRC), Regional Offices, Academic Bureau, Approval Process, Other Cells (if any). [9.4, N18]
- Stage 6 "Closure only after all actions completed" in PROOF. [N22]
- Supporting layers: TRUE & TRANSPARENT STATUS panel (Shows exact current status; No false closure; Visible accountable owner; Real-time updates to complainant; Complete status history; SLA clock and escalation alerts). [N28]
- KEY OUTCOMES list: Verified and authentic complaints; Correct institution and region mapping; No duplicate registrations or actions; Intelligent and explainable routing; No lost transfers with full accountability; Coordinated actions across bureaus. [12.4]
- Footer: RIGHT INSTITUTION | VERIFIED REPORTER | RIGHT BUREAU | NO LOST TRANSFERS | FASTER ACCOUNTABLE RESOLUTION | TRANSPARENT GOVERNANCE. [4, design goals]

**9-layer architecture image (`architecture_layers.png`)**
- Layers: 1 Stakeholders & Entry Points; 2 Identity & Security Verification; 3 Institution Identity & Region Mapping; 4 Single Intake & Case Identity; 5 Intelligent Routing & SLA; 6 3 Core Innovations; 7 Truthful Case Lifecycle; 8 Role-Based Workspaces & Oversight; 9 Outputs & Outcomes.
- Layer 2 tile "Institution / Official Verification": Authorized representative, Role-based access, SSO (Single Sign-On). Tile "Security & Privacy": Consent-based minimum data, Anti-proxy checks, fraud signals, Manual verification if needed. Badge "No proxy / verified reporter". [N03, N05, N08]
- Layer 4 intake chain: Single Grievance Submission Form → Complaint details → Supporting documents → Category selection → Auto-linked institution → Import existing grievances / external case references → Master Case ID generation → Duplicate-registration validation → **Case enrichment**. Tagline "One complaint, one case journey." [N13, N14, N15]
- Layer 5 chain: Grievance Category → Jurisdiction Rules → Institution Region → Existing Ownership → Automatic Routing to RB / PGRC / Regional Office / Other Bureau → SLA & Priority Engine → Human Triage if ambiguous → Officer Assignment. Tagline "Short-period resolution with configurable timelines." [N18, N19, N27]
- Layer 6 NEXUS TRACE chain shows a fourth step, **New Owner Active**: Transfer Requested → Acceptance Pending → Transfer Accepted → New Owner Active. Caption "Original Case ID remains same. Last accountable owner always recorded." [N20] (Build the fourth step as the owner switch that happens on acceptance; do not add a new status to Section 9.1.)
- Layer 6 NEXUS PREVENT panel shows the banner "Potential Overlapping Cases — Coordination Required" (the PDF uses an en dash "–"; use the PDF text exactly). [8.3]
- Layer 7 lifecycle swimlanes: Case Status, Transfer Status, Current Owner, SLA Clock & Escalation; warning box "Transferred cases must NEVER revert to Submitted status." [N28]
- Layer 8 workspace tiles as in 12.1, including "Institution 360: Institution profile, cases, compliance view". Per Section 6.4 / 17, show attention indicators, never a compliance score. [N12]
- Layer 9 "Manager Expectations Implemented": Institution-centric single window; Truthful status tracking; Cross-bureau overlap detection; Exact ownership at every stage; Pending / disposed / transferred / escalated monitoring; Alerts for nearing timelines; Complete audit history; Decision support. [12.4]

---

## Appendix W: details from the workflow and roles images (added 24 Oct)

Sources: `docs/workflow.png` ("Complete workflow of the solution", 13 steps) and `docs/roles.png` ("Roles, departments and responsibilities", 8 roles). Text is copied as it appears. Details already in Sections 1–18 are only cross-referenced. Details that are new got new IDs, N68–N80. No existing ID was changed.

### W1. Complete workflow (workflow.png)
Complainants: Student, Faculty, Other Stakeholders → Submit Complaint.

1. **Verify Complainant**: Authenticate identity; Validate eligibility (according to AICTE rules). [N01–N04; eligibility = **N69**]
2. **Identify Institution**: Search using AICTE Permanent ID (PID); Optional: ICID; Fetch registered details. [N09, N10]
3. **Submit Complaint**: Provide complaint details and evidence; Select category; Create unique Case ID. [N13, N14]
4. **NEXUS PREVENT (Stage 1)**: Check for potential duplicate complaints; Show similar existing cases; Allow user to continue if genuinely different. Badge: "Alert if potential duplicate". [N16]
5. **NEXUS ROUTE**: Apply jurisdiction rules (NEXUS RULEBOOK); Recommend appropriate Bureau/Cell; Assign to authorized officer; Manual review if ambiguous. [N18]
6. **NEXUS PREVENT (Stage 2)**: Detect overlapping or conflicting actions across Bureaus/Cells; Alert relevant officials; Suggest coordination. Badge: "Alert if potential overlap". [N17]
7. **NEXUS SYNC – Coordination across Bureaus/Cells**: Relevant Bureaus/Cells (PGRC, RB, Other Bureau/Cell) → Share Case Information → Record Coordination Requests and Responses → Agree on Next Steps (where applicable) → Each Unit Continues Its Assigned Work → Maintain Shared Coordination Log. [N21; "Agree on next steps" and "Each unit continues its assigned work" = **N75**]
8. **NEXUS TRACE – Transfers and Ownership**: Initiate Transfer/Hand-off → Receiving Unit Acknowledges → Track Transfer History and Timestamps → Escalate if Not Acknowledged (in configured time) → Return if Rejected (with reason). [N20; same as Section 9.2 items 2, 4, 5, 6]
9. **Process the Complaint**: Conduct inquiry / regulatory review (as per rules); Record actions and communications; Upload supporting documents; Update case status. [9.4; role actions = **N72**]
10. **NEXUS RESCUE – Stalled Case Detection**: Monitor timelines and inactivity; Identify stuck or overdue cases; Alert responsible officials; Suggest escalation (as per configured rules). [N24]
11. **NEXUS PROOF – Closure and Accountability**: Record actions performed; Upload evidence and findings; Provide closure reason; Obtain required approvals; Mark case as disposed (as per workflow). [N22; closure reason = **N76**]
12. **Disposal / Appeal (if applicable)**: Case disposed with full record; Allow appeal / reopening (as per rules); Update final status. [N25]
13. **NEXUS IMPACT – Management Analytics**: tiles Total Complaints, Pending Cases, Disposed Cases, Overdue Cases, Transfer Delays, Potential Overlaps, Bureau-wise Workload, Institution-wise History, Trends and Insights. [N26; the tile set = **N77**]

**NEXUS RULEBOOK – Configurable Policies and Rules (Used Across All Stages)**: Routing Rules, Jurisdiction Mapping, Deadlines and Escalations, Overlap Detection Rules, Closure Requirements, Appeal Rules. [N27; "Overlap Detection Rules" and "Closure Requirements" as rule families = **N78**]

**Security and Governance (Across All Stages)**: Role-Based Access, Audit Logs, Data Protection, Compliance with AICTE Policies. [S01–S30]

**Order difference, flagged and not changed:** the image draws PREVENT Stage 1 (step 4) after "Create unique Case ID" (step 3). Section 7.4 says the check runs before submission, and Section 7.2 says duplicate-registration validation happens before the case is created. Build to Sections 7.2 and 7.4. The team should confirm.

### W2. Roles, departments and responsibilities (roles.png)

| Role | Mapped department / users | Description | Key actions | IDs |
|---|---|---|---|---|
| Complainant (Student / Faculty / Other Stakeholder) | Students of AICTE Approved Institutions; Faculty Members; Other Stakeholders (Parents, Alumni, Citizens, etc.) | External user who raises a complaint about a technical institution. | Register and verify identity; Search and select institution (AICTE ID); Submit complaint with evidence; Track complaint status; Respond to queries from AICTE; File appeal if not satisfied (as per rules) | N01, N02, N13, N28, N25; Other Stakeholders = **N68**; respond to queries = **N70** |
| Institution Representative (Institute Nodal Officer) | AICTE Approved Technical Institutions (Management / Nodal Officer) | Authorized representative of the institution concerned, who can view and respond to complaints related to their institution. | View complaints related to their institute; Submit clarifications and documents; Respond to AICTE queries; Track institution-wise case status; Ensure timely compliance | N30; actions = **N71**, **N70** |
| PGRC Officer (Public Grievance Redressal Cell) | Public Grievance Redressal Cell (PGRC) AICTE | Handles public grievances and complaints received from students, faculty and other stakeholders. | View and process assigned complaints; Conduct preliminary scrutiny; Seek information from institution; Coordinate with other Bureaus/Cells if required; Record actions, remarks and upload documents; Recommend transfer/escalation (if needed) | **N72**, **N70**, N21, N20 |
| RB Officer (Regulation Bureau) | Regulation Bureau (RB) AICTE | Handles regulatory matters, compliance issues and technical scrutiny of institutions. May be involved based on the nature of the complaint. | View complaints routed to RB; Conduct regulatory review / expert visit (if required); Seek compliance reports from institution; Record findings and upload documents; Coordinate with PGRC and other Bureaus/Cells; Recommend regulatory action as per rules | **N72**, **N70**, N21 |
| Other Bureau/Cell Officers | Academic Bureau (AB); Approval Bureau (APB); Skill Education Bureau (SEB); Training and Learning (TL); Other AICTE Bureaus/Cells (as applicable) | Handle complaints and cases falling under their specific jurisdiction, as per AICTE norms and internal rules. | View and process relevant complaints; Take necessary action as per jurisdiction; Coordinate with other Bureaus/Cells; Upload documents, findings and status; Recommend closure or further action | bureaus = **N73**; actions = **N72** |
| Regional Office Officer (RO) | AICTE Regional Offices / Regional Centres (Six Regions: North, South, East, West, Central, North-East) | Supports verification, field coordination and regional-level follow-up when required. | View region-wise complaints; Coordinate with institutions in their region; Arrange inspections / site verification (if required); Provide regional inputs and reports; Update status and upload field documents | N11, R50; field work = **N74** |
| Competent Authority (AICTE Administration) | Chairperson, Member Secretary and Authorized Senior Officials | Senior management who monitors overall complaints, approvals, escalations and final decisions. | View consolidated dashboard and reports; Monitor pending, overdue and critical cases; Review escalated/complex cases; Take final decisions as per AICTE rules; Approve closure, appeal outcomes or regulatory actions | 12.2; members and decisions = **N80** |
| System Administrator (IT / Admin Team) | AICTE IT Team / System Administrators | Manages users, system configuration and policy rules. | Create and manage user accounts and roles; Configure routing rules, timelines and escalations; Manage master data (institutions, categories, etc.); Monitor system logs, security and performance; Ensure data backup and compliance | **N79**, N27, S29 |

**Guardrails that still apply to these images:** "Ensure timely compliance", "compliance reports" and "regulatory action" are workflow actions only. They never produce an institution score (Section 6.4, 17). The System Administrator changes rules only through the RuleBook's two-step approval (Section 11). Other Stakeholders are complainants, so S21 (own cases only) and the identity vault apply to them too.

### W3. New IDs from these images

| ID | Feature (from the images) | Source | Stage |
|---|---|---|---|
| N68 | Other Stakeholder complainants (Parents, Alumni, Citizens, etc.). The verification method isn't stated in any source, so use the N08 officer-assisted path until the team decides | workflow.png, roles.png | S1 |
| N69 | Validate complainant eligibility (according to AICTE rules). Rules come from the RuleBook; if none is approved, show POLICY_NOT_CONFIGURED | workflow.png step 1 | S1 |
| N70 | Query and response loop: officers send queries or information requests to the complainant or the institution; they respond with clarifications and documents; every query and reply is logged and timed | roles.png | S3 |
| N71 | Institution Representative (Institute Nodal Officer) actions: submit clarifications and documents, respond to AICTE queries, track institution-wise case status | roles.png | S5 |
| N72 | Process the Complaint with role-specific officer actions: preliminary scrutiny (PGRC), regulatory review / expert visit and recommend regulatory action (RB), take action as per jurisdiction (other bureaus), recommend transfer/escalation, recommend closure or further action | workflow.png step 9, roles.png | S3 |
| N73 | Bureaus and cells seeded as configurable units: PGRC, RB, Academic Bureau (AB), Approval Bureau (APB), Skill Education Bureau (SEB), Training and Learning (TL), Regional Offices, other cells | roles.png | S2 |
| N74 | Regional Office field verification: arrange inspections / site verification, provide regional inputs and reports, upload field documents | roles.png | S3 |
| N75 | SYNC steps "Agree on Next Steps (where applicable)" and "Each Unit Continues Its Assigned Work" | workflow.png step 7 | S3 |
| N76 | Closure reason is required at PROOF; "Mark case as disposed (as per workflow)" | workflow.png step 11 | S5 |
| N77 | IMPACT management analytics tiles: Total Complaints, Pending Cases, Disposed Cases, Overdue Cases, Transfer Delays, Potential Overlaps, Bureau-wise Workload, Institution-wise History, Trends and Insights | workflow.png step 13 | S5 |
| N78 | RuleBook families "Overlap Detection Rules" and "Closure Requirements" | workflow.png | S2 |
| N79 | System Administrator workspace: manage user accounts and roles, master data (institutions, categories), system logs, security and performance monitoring, backup. Rule changes go through the RuleBook only | roles.png | S1 |
| N80 | Competent Authority members (Chairperson, Member Secretary, Authorized Senior Officials) and decisions: review escalated/complex cases, final decisions, approve closure, appeal outcomes or regulatory actions | roles.png | S5 |

---

# Part B: 23 October specification (NOT YET PROVIDED)

> **Status: SOURCE-PENDING.** The 23 Oct PDF has not been supplied. Everything below must be filled in by copying from that PDF, not written by an agent.
> Until it is filled, every row in FEATURES.md whose Source column says `23Oct` stays `BLOCKED-SOURCE`, except where Part A above already gives enough detail to build it (noted in FEATURES.md).

Sections to paste here, word for word:
- B1. Features F01-F64 (ID, name, description, priority)
- B2. Enhancements E01-E10
- B3. The 9 corrections
- B4. Requirements R01-R55
- B5. Acceptance tests T01-T30, X01-X22, D01-D26
- B6. PREVENT rules C1-C5
- B7. Overlap matcher thresholds, identity gate, worked 93.75 example (PDF overlap section)
- B8. Section 4.7 (transfer), 4.9 (query builder), Section 10 (role matrix), Section 11 (source adapter contract), Section 20 (roadmap), G04 (governance), error codes
