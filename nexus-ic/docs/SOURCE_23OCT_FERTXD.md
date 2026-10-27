# 23 October source text (F01-F64, E01-E10, R01-R55, T01-T30, X01-X22, D01-D26, C1-C5, G04)

Extracted word for word by Claude on 25 Oct 2026 with `pdftotext -layout` from `NEXUS-IC-Final-Complete-Solution.pdf` (Manish's Downloads folder, dated 23 Oct 2026 15:13; title page says "64 baseline features + 10 integrated innovations + 9 verified corrections | 23 OCTOBER 2026"). A copy of the PDF is at docs/NEXUS-IC_Final_Complete_Solution_23Oct.pdf. Nothing below has been edited; where layout extraction splits a table cell across lines, check the PDF.

```text
                 SMART INDIA HACKATHON / SOFTWARE / AICTE REGULATION BUREAU

           NEXUS-IC

    COMPLETE SOLUTION & IMPLEMENTATION BLUEPRINT

                                                      Problem Statement 26264

             Integrated Dashboard for Monitoring and Tracking
    Institution-Related Complaint Cases Across AICTE Bureaus/Cells

                        NEXUS SYNC - INTELLIGENT CROSS-BUREAU COORDINATION
     NEXUS PREVENT + NEXUS SYNC: prevent duplicate action, coordinate safely, verify outcomes.

           64 baseline features + 10 integrated innovations + 9 verified corrections | 23 OCTOBER 2026

Implementation proposal - not a deployed AICTE system. Synthetic data assumed; official integrations, legal timelines, authority and pilot
outcomes must be verified with AICTE.
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

0. Read this specification first

What is being built        An internal case-intelligence and coordination application for authorized AICTE officers. It does not
                           replace official grievance intake, does not automatically decide case guilt or status, and never claims
                           live AICTE/CPGRAMS access during a synthetic prototype.

Primary innovation         NEXUS PREVENT checks proposed administrative actions before work is duplicated. NEXUS
                           SYNC: identity-safe case overlap review -> evidence explanation -> blind bureau-to-bureau notice ->
                           authorized acknowledgement -> lead and task assignment -> outcome receipt. Case source truth
                           remains intact.

Engineering baseline       Frontend: React with JSX and JavaScript (Vite); no TypeScript. Backend: Express with plain
                           JavaScript on Node.js. Database: MongoDB/Mongoose. UI: Tailwind, React Router, TanStack Query,
                           Recharts; optional React Flow for the graph. Test: Vitest, React Testing Library, Supertest,
                           Playwright.

Document contract          P0 denotes essential implemented-and-demonstrated behavior; P1 adds competitive proof; P2 is
                           planned/optional. Every item is proposed until actual evidence exists. All visualizations and statements
                           use only synthetic institutions unless authorized data is later supplied.

Contents / working index

Section  Purpose
1        Problem framing plus before/after pain story
2        55-item direct PS coverage matrix
3        64-feature detailed catalogue with priority/acceptance
4        Major module behavioral contracts
5        Technical architecture and deployment
6        Data schema, keys, indexes, immutable history
7        REST API and event contracts
8        React JSX screens plus six visual wireframes
9        Exact matching formula, thresholds and examples
10       Single-window policy, Competent Authority and SYNC
11       Data ingestion, provenance and source truth
12       Demo SLA policies, notification delivery, reports
13       Security, privacy, audit and accessibility
14       Ten strategic enhancements: technical specifications
15       Integrated architecture, data models and APIs
16       New screens, experimental evidence and skills
17       30 core release tests
18       Operational limits and acceptance gates

Project specification | 23 October 2026 | Synthetic-data reference design  Page 2
NEXUS-IC | AICTE PS 26264                                                                                                MASTER SOLUTION

Section              Purpose
19                   Additional enhancement tests
20                   One integrated roadmap and finals demo
21                   Nine-gap remediation tests + implementation tree
References           Primary sources and public context

1. Product purpose and constraints

AICTE receives institution-related grievances that may be processed by RB, PGRC and other Bureaus/Cells. The stated
challenge is the inability to see and coordinate all matters concerning one institution, creating potential repeated work,
untracked ownership and slow disposal. NEXUS-IC consolidates authorized read views and adds a tracked coordination
response. [P]

What the product is - and is not

Is                                                                          Is not

Internal institution-wise coordination and monitoring layer                 Replacement for existing complaint portals or a promise of CPGRAMS
                                                                            write access

Human-verified, explainable potential overlap detector                      Automatic merger of source cases; wrongdoing or legality classifier

Scoped workflow with acknowledgements and audit trail                       Unapproved bureau disclosure or automated statutory decisions

Configurable policy-specific SLA monitor                                    Assumed single AICTE-wide 21-day legal rule

Synthetic-data demonstrator with reproducible tests                         AICTE deployment, statutory validation or measured operational savings

Objective hierarchy

1. Prove all PS 26264 functional requirements are represented by a working, persistent screen or service.
2. Prove one end-to-end RB-PGRC coordination interaction is safe and accountable.
3. Prove hard negatives: similar names, different incidents, different proceedings, stale feeds, denied access.
4. Measure technical quality and usability; do not invent review precision, time savings or successful rollout.

Priority contract

Tier        Meaning                                                         Evidence for sign-off

P0          Core SIH demonstration and PS compliance                        Working backend mutation, persistence, integration or E2E test, and reviewer
                                                                            screenshot.

P1          Strong finals differentiator after P0 is stable                 Reviewer-visible interaction plus positive and negative test.

P2          Optional post-core enhancement                                  Feature flagged and clearly labeled; cannot masquerade as built.

Before versus after - fictional pain story, not measured impact

Conventional fragmented handling                                            NEXUS-IC with authorized cooperation

Monday: PGRC receives a complaint about unreturned certificates. Its own    Monday: PG-031 is stored with verified AICTE Permanent ID and native
case PG-031 is opened.                                                      PGRC state.

Tuesday: RB gets a differently phrased complaint from the same institution  RB-008 is retained as an independent case. Identity gate and issue matching
and opens RB-008.                                                           flag a potential relation.

Project specification | 23 October 2026 | Synthetic-data reference design                                                                     Page 3
NEXUS-IC | AICTE PS 26264                                                                                         MASTER SOLUTION

Conventional fragmented handling                                            NEXUS-IC with authorized cooperation

Officers independently draft the same request for academic documents.       NEXUS PREVENT checks an action proposal and returns REVIEW with
                                                                            linked reasons.

Two request letters may be issued; neither bureau knows the other action until Officer reviews the exact evidence; the banner invites NEXUS SYNC, with

later.                                                                      no automatic merger.

No single acknowledgement or shared next-step owner is visible.             PGRC accepts a blind coordination request; authorized lead, tasks, dates and
                                                                            receipt are recorded.

Duplicated effort is plausible, but no real savings have been established.  If one redundant letter is explicitly cancelled and recorded, the synthetic trial
                                                                            counts one demonstrated avoidance.

   Before/after quantities are illustrative and must not be presented as savings achieved at AICTE. Impact Lab will run paired seeded
   simulations using identical fixtures and publish the raw event trace, denominators and fixture hash.

2. Exhaustive problem statement traceability

Every explicit sub-requirement from the supplied PS is mapped to one or more feature IDs. Inclusion here means included in
the build specification, not already implemented. The acceptance test for each feature appears in Section 3.

R1 Institution profile

PS ID   Exact capability / interpretation                                                                         Planned feature IDs
R01     Unique AICTE Permanent ID                                                                                 F01,F02
R02     Institution name, address, region, relevant metadata                                                      F01,F04
R03     Consolidated institution complaint history                                                                F04,F05,F33
R04     Identity and alias/campus ambiguity reviewed                                                              F02,F03,F17

R2 Complaint tracking

PS ID   Exact capability / interpretation                                                                         Planned feature IDs
R05     Unique case/complaint ID and source ID                                                                    F07,F08
R06     Receipt date and complaint category                                                                       F08
R07     Native and current case status                                                                            F08,F09
R08     Present handling bureau/cell                                                                              F08,F10
R09     Assigned officer/official                                                                                 F08,F10
R10     Last action and timestamp                                                                                 F08,F11
R11     Next action required and expected disposal date                                                           F08,F22,F39
R12     Transfer/escalation status, acknowledgement                                                               F12,F41
R13     Remarks and documents linked                                                                              F11,F13

R3 Overlap detection

PS ID   Exact capability / interpretation                                                                         Planned feature IDs
R14     Recognize same institution handled by RB and PGRC                                                         F17,F18
R15     Warn authorized officers about overlap                                                                    F20,F42

Project specification | 23 October 2026 | Synthetic-data reference design                                                              Page 4
NEXUS-IC | AICTE PS 26264                                                          MASTER SOLUTION

PS ID      Exact capability / interpretation                               Planned feature IDs
R16        Link related cases without destroying source IDs                F14,F19
R17        Differently worded complaints considered                        F18,F28
R18        Related-but-separate and false match supported                  F18,F19,F14
R19        Prevent duplicated administrative coordination effort           F21,F22,F23

R4 Dashboard                                                               Planned feature IDs
                                                                           F29,F30
PS ID      Exact capability / interpretation                               F30
R20        Total complaint volume with stated scope                        F30
R21        Pending and under process counts                                F30,F40
R22        Disposed, transferred and escalated counts                      F33,F04
R23        Beyond-timeline and approaching due counts                      F31
R24        Institution-wise status visibility                              F29,F48
R25        Bureau/cell-wise workload
R26        As-of time and missing source not counted as zero               Planned feature IDs
                                                                           F11
R5 Workflow and history                                                    F11,F47
                                                                           F11,F13
PS ID      Exact capability / interpretation                               F12,F41
R27        Complete chronological case actions                             F21,F22,F26
R28        Officer/bureau responsible for event
R29        Date/time, remarks, file evidence                               Planned feature IDs
R30        Transfers and escalations with acknowledgements                 F03,F32
R31        Coordinated handling and responsibilities                       F32
                                                                           F32
R6 Search                                                                  F32
                                                                           F32
PS ID      Exact capability / interpretation                               F46
R32        Institution name / aliases / Permanent ID
R33        Complaint ID                                                    Planned feature IDs
R34        Bureau/cell and region                                          F18,F20,F42
R35        Complaint category and case status                              F40
R36        Receipt and action date-range filtering
R37        Search restricted to role-allowed fields                                                    Page 5

R7 Alerts

PS ID      Exact capability / interpretation
R38        Potential duplicates and overlaps
R39        Pending case reminders

Project specification | 23 October 2026 | Synthetic-data reference design
NEXUS-IC | AICTE PS 26264                                                                             MASTER SOLUTION

PS ID  Exact capability / interpretation                                                              Planned feature IDs
R40    Escalation alerts                                                                              F41,F42
R41    Deadline approaching or breach alerts                                                          F39,F40,F43
R42    Notification delivery/acknowledgement                                                          F42,F44

R8 Reports

PS ID  Exact capability / interpretation                                                              Planned feature IDs
R43    Bureau-wise and region-wise reports                                                            F31,F34
R44    Institution-wise history                                                                       F04,F34
R45    Pending case ageing                                                                            F35
R46    Disposal rate and definitions                                                                  F35
R47    Overlapping/duplicate case trend reports                                                       F36
R48    Monthly/quarterly analytics                                                                    F38
R49    Permission-checked export and audit                                                            F34,F46,F47

Roles + outcomes + innovation

PS ID  Exact capability / interpretation                                                              Planned feature IDs
R50    RB, PGRC, other bureaus, regional offices and managers                                         F45,F46
R51    Authorized senior management/competent authority views                                         F37,F46
R52    Rule-based or AI-assisted institution/incident matching                                        F17,F18,F28
R53    Coordination required alert and tracked outcome                                                F20,F21,F22,F26
R54    Institutional source-of-truth with reconciled disagreement                                     F48,F49
R55    Accountability, timely follow-up and data-driven decisions                                     F39,F40,F47,F35

Completeness check: 55 requirement checks covering institution data, every required case field, overlaps, dashboard status counts, movements,
search filters, four alert categories, report categories, user roles and the matching innovation. Any new official PS amendment must produce a
new traceability version.

Nine-gap review: correction locator

Gap                          Correction designed in this edition                                      Validation
G01 - SLA defaults           Demo-only seeded timelines and exact trigger examples (Section 12)       D01-D05
G02 - matching vague         Formula, gates, thresholds, two calculated examples (Section 9)          D06-D12
G03 - banner absent          Exact quoted alert on dashboard, institution and review (Sections 8-9)   D13
G04 - Competent Authority    Dedicated role, dashboard, sign-off and policy controls (Section 10)     D14-D16
G05 - delivery channels      Email transport with retries; SMS sandbox/approval gate (Section 12)     D17-D19
G06 - single-window tension  Discoverable cross-bureau metadata; role-scoped narratives (Section 10)  D20-D23
G07 - no wireframes          Six black-and-white screen wireframes (Section 8)                        D24
G08 - before-after missing   Fictional workflow baseline and paired measurement (Section 1)           D25

Project specification | 23 October 2026 | Synthetic-data reference design                                                  Page 6
NEXUS-IC | AICTE PS 26264                                                        MASTER SOLUTION

Gap                        Correction designed in this edition                   Validation
G09 - structural defects   Unique sections 0-22; one test/roadmap/demo location  D26

   G01-G09 are specification fixes and acceptance contracts, not evidence that working source code has already been deployed.

3. Feature inventory: 64 explicitly buildable capabilities

Use this as the sprint backlog and regression audit. All 64 items have an ID, priority, implementation target and an observable
acceptance demonstration. Parent categories are functional workstreams, not additional marketing features.

A / Institution intelligence

F01 Permanent-ID institution master [P0]

Build behavior: Authoritative ID, name, region, address and active history; PID never fuzzy-auto-linked.
Proof / test: Search exact PID; validate no cross-PID data mixing.

F02 Campus and institute hierarchy [P0]

Build behavior: Parent/campus/year validity with explicit uncertainty and reviewer approvals.
Proof / test: Wrong-campus names do not auto-collapse.

F03 Name/alias resolution [P0]

Build behavior: Verified aliases; fuzzy candidates only; provenance of every alias.
Proof / test: Find institute by alternate name.

F04 Institution 360 summary [P0]

Build behavior: Cases, source status, bureau ownership, action history, due work, location.
Proof / test: RB/PGRC entries shown with visibility boundaries.

F05 Institution-wide activity ribbon [P1]

Build behavior: Chronological action/status sequence across permitted sources.
Proof / test: View two separate cases without blending procedural status.

F06 Institution relationship graph [P1]

Build behavior: Typed case links with evidence; no inferred transitivity.
Proof / test: Select link and inspect reasons.

B / Intake and case management

F07 Multi-source complaint intake [P0]

Build behavior: Synthetic adapters and manual authorized case entry; unique case ID.
Proof / test: Create cases from two bureaus and refresh.

F08 Complete case metadata [P0]

Build behavior: Receipt/category/status/source/assignee/action dates/next action/due date.
Proof / test: All PS fields displayed and persisted.

F09 Native + analytical status mapping [P0]

Build behavior: Versioned native status and mapped status stored separately.
Proof / test: View native and harmonized views side-by-side.

Project specification | 23 October 2026 | Synthetic-data reference design                                                      Page 7
NEXUS-IC | AICTE PS 26264                                                                      MASTER SOLUTION
                                                                                                                   Page 8
 F10 Editable officer work queue [P0]

  Build behavior: Searchable role-scoped caseload, assign/reassign with recorded reason.
  Proof / test: Officer assignment changes survive reload.

 F11 Action timeline and notes [P0]

  Build behavior: Append-only activity with actor, event/observed time and remarks.
  Proof / test: Inspect sequence after action edit.

 F12 Transfer acceptance and return [P0]

  Build behavior: Recipient acknowledgement with pending/accepted/rejected and time.
  Proof / test: Recipient rejects transfer and reason remains auditable.

 F13 Evidence and supporting documents [P0]

  Build behavior: Metadata, hash, secure scoped file reference, file access audit.
  Proof / test: Unauthorized role cannot download attachment.

 F14 Case relationship management [P1]

  Build behavior: Link/keep separate/false match with exact identity of distinct cases.
  Proof / test: Separate proceedings remain separate.

 F15 Bulk import with preview [P1]

  Build behavior: CSV template, validation, dry-run, row error report, idempotent commit.
  Proof / test: Replay a batch with zero duplicates.

 F16 Case lifecycle correction and reopen [P1]

  Build behavior: Authorized state changes as new events; original state intact.
  Proof / test: Reopen produces recorded reversal, not overwrite.

 C / NEXUS SYNC flagship innovation

 F17 Verified institution candidate blocking [P0]

  Build behavior: Generate case pairs only within trusted identity/campus rules.
  Proof / test: Different PIDs never auto-same institution.

 F18 Explainable overlap review cards [P0]

  Build behavior: Positive reasons, counter-signals, source dates, scope and uncertainty.
  Proof / test: Different wording suggests relation; unrelated same PID stays distinct.

 F19 Human reviewer dispositions [P0]

  Build behavior: Coordinate/Keep Separate/False Match/More Info/Defer with mandatory reason.
  Proof / test: Decision saved with actor and rule version.

 F20 Blind cross-bureau handshake [P0]

  Build behavior: Send opaque prospective overlap notice to authorized counterpart.
  Proof / test: Other bureau receives no restricted narrative.

 F21 Ack + lead/support assignment [P0]

  Build behavior: Accept/decline with reason, nominate lead, create responsibility map.
  Proof / test: Switch role and accept ping; lead persists.

Project specification | 23 October 2026 | Synthetic-data reference design
NEXUS-IC | AICTE PS 26264                                                                             MASTER SOLUTION

 F22 Coordination task board [P0]

  Build behavior: Owner, description, dependencies, dueAt, state, evidence and acknowledgement.
  Proof / test: Complete cross-bureau task end to end.

 F23 Pre-action collision checker [P1]

  Build behavior: Compare action class/purpose/doc type/time using deterministic rules.
  Proof / test: Change proposed document class; warning updates.

 F24 Action Passport [P1]

  Build behavior: Display preflight finding, connected source coverage, permitted advisory outcome.
  Proof / test: Shows CLEAR/REVIEW/UNKNOWN with reason.

 F25 Scoped consent to reveal case context [P1]

  Build behavior: Time-bound approved field disclosure with reason and audit.
  Proof / test: Expired grant hides private text again.

 F26 Coordination outcome receipt [P1]

  Build behavior: Evidence snapshot, responsibilities, acknowledgements and outcome chronology.
  Proof / test: Download role-redacted receipt matching events.

 F27 Contradictory action monitor [P1]

  Build behavior: Detect source-disagreeing statuses or incompatible action intents.
  Proof / test: Record conflict without falsely attributing officer delay.

 F28 Multilingual semantic reranker [P1]

  Build behavior: Finals-target ranker, human-audited and measured; versioned rules remain fallback.
  Proof / test: Show tested gain only with held-out data.

 D / Dashboard, search and analytics

 F29 Real-time/near-real-time command dashboard [P0]

  Build behavior: Accurate totals and as-of timestamp; scoped updates or polling.
  Proof / test: Counts change when a case is entered.

 F30 All mandatory status counts [P0]

  Build behavior: Pending, under process, disposed, transferred, escalated, overdue.
  Proof / test: Dashboard totals reconcile with filtered list.

 F31 Bureau and regional workload [P0]

  Build behavior: Queues by bureau/region/officer with scoped drill-down.
  Proof / test: Regional and bureau reports agree.

 F32 Universal compound search [P0]

  Build behavior: PID/name/case ID/bureau/region/category/status/date range.
  Proof / test: Combine three filters and export same result.

 F33 Cases-by-institution panel [P0]

  Build behavior: Institution-wise case status and source-health context.
  Proof / test: Filter institution and inspect every visible case.

Project specification | 23 October 2026 | Synthetic-data reference design                             Page 9
NEXUS-IC | AICTE PS 26264                                                                    MASTER SOLUTION

 F34 Scheduled reporting and CSV/PDF export [P0]

  Build behavior: Scope-respecting, definition-stamped, audit-logged exports.
  Proof / test: Download bureau/region/institute/status report.

 F35 Pending ageing and disposal metrics [P0]

  Build behavior: Bucket ages, aging trends, disposal denominator and date window explicit.
  Proof / test: Ageing changes after clock advances in tests.

 F36 Overlap effectiveness measures [P1]

  Build behavior: Candidates, accepted links, dismissed links, coordination completions.
  Proof / test: Never label alerts as avoided actions without evidence.

 F37 Management executive summary [P1]

  Build behavior: Task bottlenecks, stale feed gaps, overdue groups, relevant trends.
  Proof / test: Inspect scope and counts underlying each card.

 F38 Time-comparison reports [P1]

  Build behavior: Month/quarter periods by reported definitions, not extrapolation.
  Proof / test: Change dates and see recalculation.

 E / SLA, alerts and follow-up

 F39 Configurable SLA rule registry [P0]

  Build behavior: Category, bureau, event, time zone, pause/holiday and approval version.
  Proof / test: Rule edit creates version, not retroactive rewrite.

 F40 Pending/near due/overdue alerts [P0]

  Build behavior: Pre-due, breach, transfer waiting and assigned task reminders.
  Proof / test: Alert triggers and is deduplicated.

 F41 Controlled escalation workflow [P0]

  Build behavior: Role-based escalation level and reason; management acknowledgment.
  Proof / test: Escalate overdue case without modifying source record.

 F42 Role-aware notification centre [P0]

  Build behavior: Unread, acknowledge, dismiss, link to authorized record.
  Proof / test: Notifications persist after refresh.

 F43 Clock integrity and pauses [P1]

  Build behavior: Distinguish official event time from sync-observed time; pause reasons.
  Proof / test: Late data does not misclassify officer delay.

 F44 Delivery outbox and retries [P1]

  Build behavior: Deduplicated event delivery with at-least-once safe consumers.
  Proof / test: Retry failure without duplicate notification.

 F / Trust, privacy, governance

Project specification | 23 October 2026 | Synthetic-data reference design                    Page 10
NEXUS-IC | AICTE PS 26264                                                                           MASTER SOLUTION

 F45 Authentication and demo accounts [P0]

  Build behavior: Secure sessions; RB/PGRC/management/reviewer seeded synthetic users.
  Proof / test: Guest denied all protected routes.

 F46 Server-side RBAC and field ABAC [P0]

  Build behavior: Policy checked on read, write, search, export, socket and attachment.
  Proof / test: Cross-role API returns no restricted fields.

 F47 Full audit timeline [P0]

  Build behavior: Log who did what, when, to which source, with reason and policy version.
  Proof / test: Rejected access/override also recorded.

 F48 Source provenance and freshness [P0]

  Build behavior: Current/Stale/Conflicted/Not connected; source payload revisions and watermarks.
  Proof / test: Unconnected source shows UNKNOWN not zero.

 F49 Idempotent & conflict-preserving sync [P0]

  Build behavior: Deduplicate per (system,ref); preserve source contradictions.
  Proof / test: Reimport unchanged batch yields zero new cases.

 F50 Accessible, responsive government UI [P0]

  Build behavior: Keyboard, labels, contrast, focus, zoom, semantic status and printable view.
  Proof / test: Core journey works at 200% zoom via keyboard.

 F51 Audit integrity proofs [P1]

  Build behavior: Hash chain with controlled storage and tamper-evidence validation.
  Proof / test: Mutated event fails verifier without claiming blockchain.

 F52 Data retention and purge policy hooks [P1]

  Build behavior: Classification, retention labels, approval for deletion and archival.
  Proof / test: Expired sample records eligible for approved policy.

 F53 Import health and dead-letter inspection [P1]

  Build behavior: Connector status, errors, watermark, quarantine and rerun job.
  Proof / test: Malformed row is quarantined, not silently dropped.

 F54 Field-level disclosure approval [P1]

  Build behavior: Justification, issuer, permitted scope, expiry, reversal.
  Proof / test: Disclosure expires without role escalation.

 G / UX, quality, operations

 F55 Stateful navigation and deep links [P0]

  Build behavior: Stable routes for institution/case/task with permission checks.
  Proof / test: Reload selected entity directly.

 F56 Loading/empty/error/unknown states [P0]

  Build behavior: Clear recovery messages, not zero or blank screens for missing feeds.
  Proof / test: Source outage and partial loading tested.

Project specification | 23 October 2026 | Synthetic-data reference design                           Page 11
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

F57 Synthetic dataset and reset utility [P0]

Build behavior: Reproducible fictional cases, overlap positives/hard negatives and demo users.
Proof / test: One-command reset produces same fixture hashes.

F58 Automated acceptance and security tests [P0]

Build behavior: API, unit, contract, end-to-end, negative authorization and replay cases.
Proof / test: Run published test command and inspect raw results.

F59 Guided in-app judge walkthrough [P1]

Build behavior: Role switch scenario, explanation overlay and reset.
Proof / test: Six-minute scripted walkthrough repeatable.

F60 Operational error monitor [P1]

Build behavior: Structured logs, health endpoint, request IDs, non-sensitive telemetry.
Proof / test: Failed connector diagnosed from correlation ID.

F61 Optional advanced trend explanations [P2]

Build behavior: Verified aggregate trend summarization with sources; no invented causes.
Proof / test: Summary grounded to report rows.

F62 Optional language translation assist [P2]

Build behavior: Reviewer-editable translated synopsis, source retained.
Proof / test: Original complaint always viewable with language tag.

F63 Optional external integrations [P2]

Build behavior: AICTE source APIs, official SSO, approved messaging only after agreements.
Proof / test: Connector never claims live use before authorization.

F64 Optional point-in-time audit replay [P2]

Build behavior: Replay versioned events and permissions at past cut-off; access audited.
Proof / test: Reconstruct older state deterministically.

4. Major modules: detailed implementation behavior

4.1 Institution 360

Officer-visible behavior. A canonical institution object is keyed only by authoritative verified Permanent ID. The display
resolves approved name aliases and campus boundaries. The panel shows name, address, region, verified ID, case counts
grouped by bureau and native/mapped status, linked case candidates, transfer state, the latest attributable action, next task, and
source freshness.
Implementation. GET /institutions/:id aggregates only records the logged-in actor may see. Different source case identities
remain separate; source feeds not connected produce UNKNOWN rather than an apparent zero.
Acceptance and edge cases. Case list filters and case URLs remain stable. Each displayed count declares its source scope and
as-of timestamp.

4.2 Case management

Officer-visible behavior. Each incoming case has local UUID and an immutable (sourceSystem,sourceCaseRef). Store receipt,
complaint text classification, category, native and mapped status, current bureau/officer, last event, next required action, due
date, documents, and actor-attributed timeline.
Implementation. Never overwrite action history; mutation writes versioned case projection + append-only case_events in an
atomic database transaction where required.

Project specification | 23 October 2026 | Synthetic-data reference design  Page 12
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

Acceptance and edge cases. Concurrent edits must reject stale entity versions and ask user to reload. Closing one coordinated
task must not auto-close the source case.

4.3 Intelligent institution matching

Officer-visible behavior. First exact verified PID; then campus checks. String similarity, alias, regional and document clues
produce an identity-review candidate only. Similar institution names with different verified PIDs are hard negative barriers.

Implementation. Normalize accents and punctuation for search but not for authoritative identity; each tentative identity
assertion keeps a reviewer and proof source.

Acceptance and edge cases. No fuzzy-only automatic link. Where identity evidence is insufficient, mark unresolved and
suppress unsafe aggregated conclusions.

4.4 Cross-bureau case relationship review

Officer-visible behavior. Within safe identity groups, produce candidate pairs from issue category, event timing, described
incident, referenced documents, affected timeframe and requested remedy; list both supporting and contradicting factors.

Implementation. Assign relationship type (potentially related, same incident candidate, parallel proceeding, duplicate action
candidate, keep separate, false match). Reviewer supplies disposition and reason.

Acceptance and edge cases. Same institution is not enough: unrelated cases and proceedings remain separate. Reviewers can
reverse earlier decisions only through attributed correction records.

4.5 NEXUS SYNC handshake

Officer-visible behavior. A potential overlap creates a reviewer item. After review, a blind notice to another bureau contains
opaque identifiers and non-sensitive coordination topic only. The recipient acknowledges or declines; a lead reviewer creates
owned tasks and due dates.

Implementation. State machine permits controlled role-specific transitions and an explicit unresolved/conflict pathway.
Notifications use an idempotent outbox. Access grants are independent of coordination status.

Acceptance and edge cases. Demonstrate RB->PGRC acknowledgement, named lead, completed task, and a receipt; denied
RB access to private PGRC complaint content remains enforced.

4.6 Pre-action overlap checking

Officer-visible behavior. Before drafting an official document request, officer enters target institution, action type, document
class, purpose and period. Engine examines known active action metadata and emits CLEAR, REVIEW or UNKNOWN with
actual rule reasons.

Implementation. Read-only/advisory prototype. If source data is absent, UNKNOWN; no automated blocking or new statutory
authority. Do not mislabel a draft comparison as a Digital Twin.

Acceptance and edge cases. Change proposed document class and show warning appearance/removal with fixture cases.
Distinct proceedings or periods should not be blocked.

4.7 Transfer, ownership and escalation

Officer-visible behavior. Officer creates a transfer request with reason, target bureau, prior owner and relevant documents.
Receiver can accept/reject; unresolved transfers have a pending status, reminder and full movement history.

Implementation. Lead officer and senior manager can escalate based on delegated scopes and policy version. Every task action
requires actor, time and comment.

Acceptance and edge cases. No ownership is silently reassigned before recipient ack. Failed transfer and reminders remain
visible to the original officer.

Project specification | 23 October 2026 | Synthetic-data reference design  Page 13
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

4.8 SLA and alert policy

Officer-visible behavior. Explicit policy records define target duration, clock start/end, business-day calendar, pause triggers,
effective version and escalation contacts per relevant complaint category.

Implementation. Event time is separate from feed observation time. Due flags are calculated from approved policy + relevant
task events; no fixed 21-day rule applies to all AICTE complaints by assumption.

Acceptance and edge cases. Timeline tested on boundary day, local timezone, pause, transfer and late import. Alert outbox
retries without duplication.

4.9 Reports and analytics

Officer-visible behavior. Bureau-wise, region-wise, institution-wise and status-wise dashboards;
total/pending/under-process/disposed/transferred/escalated; overdue; source coverage; average/median pending age; disposal
rate with denominator.

Implementation. Use the same query builder for UI, CSV and PDF export. Each metric has definitionVersion, sourceScope,
asOfTime and visibility restrictions. Show small group suppression.

Acceptance and edge cases. A clicked KPI must lead to a case table whose count reconciles. Never display missing-feed
populations as measured zeros.

4.10 Data ingestion, coverage and provenance

Officer-visible behavior. Adapters accept source namespace, case key, authoritative field map, source revision,
sourceUpdateAt, observedAt, access policy and batch ID. Store raw immutable snapshot and re-computable canonical
projection.

Implementation. Replay is idempotent, conflicting records preserved with source claims and reconciliation owner, stale feeds
flagged. Imported data is not evidence of official API approval.

Acceptance and edge cases. Corrupt CSV quarantined; unchanged replay makes zero additional case records; out-of-order
status updates do not erase later official actions.

4.11 Secure evidence exchange

Officer-visible behavior. Default alert sees only opaque overlap and minimal shared references. Request access to restricted
narrative/docs with reason, target reviewer, purpose, allowed fields and expiry.

Implementation. Backend enforces field rules in search, APIs, Socket.IO emissions, notification, exports and file downloads.
Security event audit records reveals/denials/grants.

Acceptance and edge cases. Attempt GET/download/export after grant expiry and confirm sensitive content denied.

4.12 Administration and audit

Officer-visible behavior. Admin configures source registries, status mappings, calendars, category definitions, role grants,
import health, controlled demo reset and audit search.

Implementation. Operational admin has no blanket access to all case narratives. Audit is append-only and can be hash-chained,
but hash-chaining alone is not a certified tamper-proof ledger.

Acceptance and edge cases. Configuration changes versioned. Auditor views meaningful traces; destructive audit edit is
rejected.

Project specification | 23 October 2026 | Synthetic-data reference design  Page 14
NEXUS-IC | AICTE PS 26264                                                                                                           MASTER SOLUTION

 5. System architecture and deployment

                                                                  OFFICER WEB APP - REACT JSX / VITE
                                                       Role-aware pages | Global search | Institution 360 | NEXUS SYNC | Analytics

                                  EXPRESS API - NODE.JS / JAVASCRIPT
               Auth, roles, validation and access policy / Case, institution and movement modules
             Matching and evidence review / Coordination state machine / Reports, SLA and audit

        MongoDB                                        Private file store                                                               Outbox / jobs
Domain + event collections                        Evidence object references                                                        Retryable notifications
                                                  Access-controlled download                                                        Imports and deadlines
 Indexes and transactions

SOURCE ADAPTERS / APPROVAL REQUIRED                                                  MATCHING ENGINE / OPTIONAL NLP
              RB, PGRC, other authorized feeds                                                  Verified PID -> rule evidence

          CSV and API; synthetic demo connectors                                        Optional semantic ranker, never auto-merge

Figure: Five-tier modular JavaScript design. Authorized feed adapters are separate from the internal matching service; the optional NLP
feature is not on the critical path.

Why one Node.js modular monolith

A modular Express application with domain services reduces same-night deployment complexity. Unit boundaries are
institution, case, ingestion, matching, findings, coordination, action-preflight, alerts/SLA, reporting and admin/audit. Contract
tests allow later service separation without building extra microservices prematurely.

Layer        Concrete choice                                               Contract
UI
API          React JSX, Vite, React Router, Tailwind,                      No .ts/.tsx; keyboard operation; role-aware page layouts.
Persistence  Recharts, TanStack Query
Files
Async        Node.js LTS, Express in .js, Zod/Joi equivalent REST, structured error codes, pagination and correlation ID.
Matching     validators
Testing
             MongoDB + Mongoose, replica set for                           Compound unique keys; indexes; outbox and events.
             transaction-dependent writes

             Private local object store for demo; S3/MinIO Signed access or server proxy; never expose raw keys.
             deploy option

             In-process dev worker with durable MongoDB Retries/idempotence and scheduling must remain verifiable.
             outbox; Redis/BullMQ optional

             Verified PID + RapidFuzz-like JS similarity / Optional Python/embedding model only after measured validation.
             deterministic evidence rules

             Vitest, RTL, Supertest, Playwright, k6 optional Prove E2E, role negative tests, performance metrics.

Project specification | 23 October 2026 | Synthetic-data reference design                                                                                    Page 15
NEXUS-IC | AICTE PS 26264                                                                                            MASTER SOLUTION

Deployment topology

1. Build React into static /dist and host behind a reverse proxy on HTTPS.

2. Run Express API as private application service; configure restrictive CORS, secure session cookies, rate limits and server-side role
policy.

3. Run MongoDB (transactions require replica set); use non-production synthetic data for demo.

4. Store attachments privately; keep secrets outside repository; rotate demo credentials.

5. Run seed/reset and regression suites before jury demo; collect test reports, build hash and known limitations.

Project structure (.jsx + .js only)

  nexus-ic/
   client/src/pages/*.jsx # dashboard, institution, case, sync, reports
   client/src/components/*.jsx # cards, filters, tables, timeline, evidence
   client/src/services/api.js # scoped server requests
   server/src/routes/*.js # auth, cases, institutions, findings, sync
   server/src/domain/*.js # ingestion, matching, policies, reporting
   server/src/models/*.js # Mongoose schemas
   server/src/policies/*.js # role + field checks
   server/src/jobs/*.js # outbox, deadline, import retries
   tests/{unit,api,e2e}/* # fixture-backed verification
   scripts/{seed,reset}.js # synthetic reproducible scenario

6. Database design and transactional rules

                        institutions                                                        cases

              permanentId, campusIds, aliases                              sourceSystem + sourceCaseRef, owner

                       source_snapshots                                            case_events

              immutable raw payload, revision/hash                         eventTime, observedAt, actor

                   findings & links                                            coordination

              typed relationship + reviewer                                lead, participants, tasks

                permission_grants                                                  audit_events

              scope, expiry, justification                                 actor, action, subject, prevHash

Figure: Document relationships: source snapshots and event chronology are preserved; no graph database is required.

Collection                 Key fields                                      Integrity rule/index
institutions
                           permanentId(unique), name, region, address, activeFrom, metadata Permanent ID unique; region/campus indexes

Project specification | 23 October 2026 | Synthetic-data reference design                                            Page 16
NEXUS-IC | AICTE PS 26264                                                                       MASTER SOLUTION

Collection                 Key fields                                                           Integrity rule/index
campuses                   institutionId, campusRef, name, validYears                           (institutionId,campusRef) unique
institution_aliases        institutionId, alias, proofSource, reviewedAt                        alias text + institutionId
identity_assertions        candidateA/B, evidence, reviewer, disposition, ruleVersion           no automatic fuzzy binding
source_systems             sourceCode, owner, authority, supportedFields, heartbeat             unique sourceCode
sync_runs                  sourceCode, batchId, watermark, counts, errors, startedAt            (sourceCode,batchId) unique
source_snapshots           sourceSystem, sourceRef, revision, rawHash, rawPayload,              immutable and unique source revision
                           observedAt
cases                      caseId, sourceSystem, sourceRef, institutionId, bureau, officer,     unique (sourceSystem,sourceRef); indexes for
                           nativeStatus, mappedStatus, category, dueAt, version                 search
case_events                caseId, eventType, actor, eventTime, observedAt, remarks,            append-only by caseId/eventTime
                           prevVersion
case_movements             caseId, fromBureau, toBureau, requestedAt, ackAt, response           index (toBureau,state)
evidence_refs              caseId, storageKey, mime, fileHash, classification, accessPolicy     no raw private document in case list
case_relationships         caseA, caseB, typedRelation, positive, negative, reviewReason        unique ordered pair + relation type; no transitivity
match_findings             caseA, caseB, kind, modelVersion, ruleVersion, priority, state       index state and createdAt
finding_dispositions       findingId, reviewerId, decision, reason, at                          append-only
coordination_records       leadBureau, participants, findingIds, state, disclosureScope         index lead + state
coordination_tasks         coordinationId, ownerId, dependencies, dueAt, ackAt, evidence        index owner + dueAt
action_proposals           actor, institutionId, purpose, documentClass, timePeriod, preflight  idempotencyKey unique
notifications              recipientId, kind, opaqueSummary, deliveredAt, ackAt                 recipient+dedupeKey unique
sla_policies               policyKey, scope, businessCalendar, period, pauses, validFrom,       immutable rule versions
                           version
access_grants              subject, scope, purpose, approver, expiry, revocation                index grantee and expiry
rule_versions              mapping, reviewerThresholds, policyApproval, effectiveAt             version immutable
audit_events               actor, resource, action, reason, occurredAt, prevHash, hash          append-only; retention governance

Critical invariants

1. Source-native case ID is never overwritten by local case ID. Unique (sourceSystem,sourceCaseRef) prevents duplicate ingest.
2. Every source snapshot is immutable; logical corrections create new revisions or attributed events.
3. Case relationships are typed pairwise and not transitively inferred; no automatic case merge/closure.
4. Version checks are required on concurrent officer and coordination mutations; idempotency keys for retries.
5. Audit events are append-only and authorized evidence/download events include actor, subject, purpose and policy decision.
6. Views/exports must use the same backend policy; source gaps yield UNKNOWN.

Representative case shape - abbreviated

  {
   caseId: "C-00031", sourceSystem: "PGRC-DEMO", sourceCaseRef: "PG-31",
   institutionId: "TEST-PID-001", category: "Fee/Certificates",
   nativeStatus: "Under Scrutiny", mappedStatus: "UNDER_PROCESS",
   currentBureau: "PGRC", assignedOfficerId: "demo-pgrc-01",
   receivedAt: "2026-10-19T10:30:00+05:30",

Project specification | 23 October 2026 | Synthetic-data reference design                                                       Page 17
NEXUS-IC | AICTE PS 26264                                                         MASTER SOLUTION

   lastActionAt: "...", nextAction: "Await documents", expectedDisposalAt: null,
   policyVersion: "DEMO-1", sourceRevision: 2, version: 5,
   classification: "RESTRICTED", sourceScope: "PGRC-DEMO"
  }

7. API endpoint specifications and response discipline

The table defines a proposed application API, not existing AICTE endpoints. Every API is server-authorized, validated,
paginated where relevant, with standardized errors: VALIDATION_ERROR, NOT_AUTHORIZED, NOT_FOUND,
STALE_VERSION, FEED_UNKNOWN, RULE_NOT_CONFIGURED and INTERNAL_ERROR.

Verb Endpoint                          Purpose                                    Mandatory guarantee
                                       Return role and authorized scopes          role claim verified server-side
GET   /api/v1/me                       Search PID/name/region/campus              search filters by authorized scope
                                       Institution 360 projection                 response redacts hidden bureau fields
GET   /api/v1/institutions             Filter cases and paginate                  parameter whitelist, allowed scopes
                                       Authorized manual case creation            unique source key, input validation
GET   /api/v1/institutions/:id         Case detail + native and mapped state      source policy + field-level filters
                                       Append case action or correction           optimistic version, audit event
GET   /api/v1/cases                    Request movement                           recipient ack required
                                       Accept/reject transfer                     only target officers
POST /api/v1/cases                     Validate CSV feed without commit           quarantine invalid rows
                                       Idempotent import batch                    unique(sourceSystem,sourceRef)
GET   /api/v1/cases/:id                List scoped overlap candidates             opaque across restricted bureaus
                                       Coordinate/Keep Separate/False Match       mandatory reason and role
POST /api/v1/cases/:id/events          Send blind handshake                       opaque payload and audience guard
                                       Accept/decline/request info                version check, authorized participant
POST /api/v1/cases/:id/transfers       Assign accountable task                    lead/delegate authorization
                                       Update task state with evidence            audit status transition
POST /api/v1/transfers/:id/respond     Advisory action collision result           CLEAR/REVIEW/UNKNOWN not legal
                                                                                  ruling
POST /api/v1/imports/preview           Request time-limited reveal                approval path, default deny
                                       KPI data with scope/as-of metadata         privacy suppression
POST /api/v1/imports/commit            Audit-logged CSV/PDF                       same authorization as screen
                                       Role inbox                                 no forbidden content in preview
GET   /api/v1/findings                 Ack alert                                  idempotent
                                       Connector status + conflicts               admin or delegated reader
POST /api/v1/findings/:id/disposition  Authorized trace of events                 append-only log filtering
                                       Liveness/readiness                         non-sensitive public response
POST /api/v1/coordination/requests

POST /api/v1/coordination/:id/respond

POST /api/v1/coordination/:id/tasks

PATCH /api/v1/tasks/:id

POST /api/v1/actions/preflight

POST  /api/v1/access-requests
GET   /api/v1/reports
GET   /api/v1/reports/export
GET   /api/v1/notifications
POST  /api/v1/notifications/:id/ack
GET   /api/v1/data-health
GET   /api/v1/audit/:resourceId
GET   /api/v1/health

Project specification | 23 October 2026 | Synthetic-data reference design                                               Page 18
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

Example - candidate review and coordination

  POST /api/v1/findings/FND-004/disposition
  { "decision":"COORDINATE", "reason":"Same verified PID and request period",

   "expectedVersion":2 }
  -> 200 { "findingId":"FND-004", "state":"COORDINATION_REQUESTED",

        "auditEventId":"EV-239", "caseIds":["RB-008","PG-031"] }
  POST /api/v1/coordination/requests
  { "findingId":"FND-004", "targetBureau":"PGRC", "messageClass":"OVERLAP" }
  -> 201 { "coordinationId":"CO-107", "recipient":"PGRC",

         "exposedFields":["institutionOpaqueId","caseRefOpaque"] }

Common API rules

· Responses identify asOfTime and scope when showing counts, source-cached state or analytics.
· Prevent IDOR: caller-controlled institutionId, officerId or sourceSystem is always verified against permitted scope.
· The server returns redacted objects, not frontend-hidden fields. Errors never return private details.
· Replay/duplicate writes respond idempotently and never create second tasks; optimistic version gates edits.

Additional APIs required by the nine corrections

Method  API route                                                          Responsibilities
GET     /api/v1/authority/overview                                         Role-filtered KPIs, escalations, policy and approval inbox
POST    /api/v1/authority/decisions                                        Delegated sign-off + actor != requester and version checks
GET     /api/v1/institutions/:id/catalog                                   One-window catalog projection with per-case metadata redaction
GET     /api/v1/matching/explain/:pairId                                   Detailed contributions, raw permitted evidence and counter signals
GET     /api/v1/sla/policies                                               List demo vs approved policy versions, calendar and active state
POST    /api/v1/sla/policies/:id/versions                                  Create nonretroactive policy version; authority approval
POST    /api/v1/notifications/test                                         Admin/test-only email/sms simulator, no actual private data
POST    /api/v1/notifications/:id/ack                                      Idempotent acknowledgement and trace
GET     /api/v1/notifications/delivery-status                              Retry/failed/dead letter audit for delegated admins

8. React JSX UI structure and state contracts

Project specification | 23 October 2026 | Synthetic-data reference design                                               Page 19
NEXUS-IC | AICTE PS 26264                       COMMAND CENTER / BUREAU VIEW                                                                     MASTER SOLUTION
                                               Data health, aging, task inbox, trend, overlap queue
                   INSTITUTION 360                                                                                                    REVIEW DESK
                 Verified PID, cases, aliases                CASE WORKSPACE                                                      Explanation, counter-signals
                                                               Timeline, assignee, docs

    NEXUS SYNC                                 ACTION CHECK                                                                        REPORTS / ADMIN
Bureau handshake, tasks                        Rule-based preflight                                                              SLA, exports, source health

                                                        CROSS-CUTTING WORKSTATION FUNCTIONS
                                               Global search | Alerts | Role-scoped views | Accessibility | Help | Audit status

Figure: Navigation from command dashboard into institution, case, evidence review and coordination; cross-cutting search and
accessibility.

Route / component      Major fields and interactions                                                 Empty/error/permission state
/login.jsx             Demo role sign-in, invalid credentials, session expiry
                                                                                                     No access to application state without
/dashboard.jsx         Status cards, aging, workload, urgent tasks, feed health                      server session
/institutions.jsx      Search PID/name/region; aliases, campus markers
                                                                                                     Unknown feed banner; never fake totals
/institutions/:id.jsx  Institution 360, status, source coverage, activity ribbon
                                                                                                     Ambiguous campus identity requires
/cases.jsx             Filterable and exportable case list                                           review

/cases/:id.jsx         Native/mapped status, assignment, documents, complete timeline                Private bureau record masked if not
/findings.jsx          Evidence cards, false-match review and counter signals                        entitled

/sync.jsx              Blind requests, lead and tasks, acknowledgement, closure                      No results vs no feed vs denied are
/action-check.jsx      Proposed class/period/purpose and CLEAR/REVIEW/UNKNOWN                        distinct
/reports.jsx           Ageing, bureau/region/institution/status, trends/export
/data-health.jsx       Connector sync errors, stale/conflict queue                                   Case edits lock version; audit visible

/admin.jsx             Role policy, SLA registry, mapping, audit search                              Uncertain model gives review not
                                                                                                     decision

                                                                                                     No private content before scoped grant

                                                                                                     UNKNOWN for absent source

                                                                                                     Metric definition/time/coverage shown

                                                                                                     Missing connector never displayed as
                                                                                                     healthy

                                                                                                     Only delegated administration routes

Project specification | 23 October 2026 | Synthetic-data reference design                                                                                     Page 20
NEXUS-IC | AICTE PS 26264                                                                                               MASTER SOLUTION

Important small UX behaviors - must not be missed

· Top bar: current role, permission scope, accessible global search, as-of time, demo banner, help and log out.
· List tables: sort, multi-filter, clear filters, result count, pagination, sticky header, keyboard focus, empty/loading/error states.
· Case views: copy safe reference, last/next action, status badge with text label, timestamp and timezone, source-native history,
attachment metadata.
· Overlap cards: show both case refs, same-institute proof, event period, positive and counter evidence, uncertainty, source freshness
and reason-required decision.
· Coordination panel: unread notice, approve/request info/decline, lead selection, owner task/due date, notes, ack/receipt, controlled
close.
· Reports: date range, region/bureau/category/status selectors, provenance footnote, CSV export, print view, suppressed small
populations.
· Mobile/tablet/desktop: no horizontal body overflow, 200% zoom, logical tab order, text alternatives and predictable dialog behavior.

Six complete screen wireframes - implementation reference

These are functional layout plans, not screenshots of an implemented React application. All six views must render loading,
empty, denied, error and source-UNKNOWN conditions.

  NEXUS-IC | Global search | Role | As-of | Alerts | Sign out

  Potential Overlapping Cases ­ Coordination Required
  Review evidence | Request coordination | verified PID / source as-of

TOTAL CASES                             PENDING                            OVERDUE               UNKNOWN FEEDS
Count + policy scope                    Count + policy scope               Count + policy scope  Count + policy scope

WORK QUEUE                                                                                       BUREAU WORKLOAD
Case, bureau, officer, next action                                                               RB / PGRC / Region
Near due / overdue / awaiting transfer                                                           Ageing + refreshed at
View task / review candidate

Wireframe: proposed layout; not a screenshot of deployed functionality.

   Figure: Command Dashboard: KPIs, data coverage, exact overlap banner and due-work lists.

Project specification | 23 October 2026 | Synthetic-data reference design                                               Page 21
NEXUS-IC | AICTE PS 26264                                                                                                                  MASTER SOLUTION

    NEXUS-IC | Global search | Role | As-of | Alerts | Sign out            STATUS SUMMARY
                                                                           Cases by owner, mapped/native state
    INSTITUTION 360 / TEST-PID-001                                         Overlaps / handovers / due alerts
     Name | Region | Campus / aliases | Verification state
                                                                                                      ACTIVITY RIBBON
    SOURCE / ACCESS                                                                                       Event -> bureau -> time
     RB current | PGRC current                                                                            Transfer / source status
     Restricted details explicitly masked                                                                 Evidence and as-of

    UNIFIED CASE INDEX
     RB-008 | RB | records | IN_PROCESS
     PG-031 | PGRC | fee | IN_PROCESS
     Selected confidential fields: RESTRICTED
     View permitted details / request access

Wireframe: proposed layout; not a screenshot of deployed functionality.

   Figure: Institution 360: verifiable ID, unified case index, source-native statuses and timeline.

 NEXUS-IC | Global search | Role | As-of | Alerts | Sign out

Potential Overlapping Cases ­ Coordination Required                        COUNTER-SIGNALS / UNKNOWN
FND-004 / RB-008 and PG-031 / source coverage                              Distinct proceedings? campus?
                                                                           Source stale? missing complaint period?
MATCHED CASES + POSITIVE                                                   Evidence refs + explanation
Same verified PID
Certificates / payment / period
Example score 93.75; demo only

DISPOSITION (REASON REQUIRED)
[Coordinate] [Keep separate] [False match] [Need information]
Reviewer, source version, decision time, rationale

 REVIEWER TRACE
  Prior decision / version / no automatic merge or case closure

Wireframe: proposed layout; not a screenshot of deployed functionality.

   Figure: Overlap Review: evidence/counter-evidence, thresholds and human disposition.

Project specification | 23 October 2026 | Synthetic-data reference design                                           Page 22
NEXUS-IC | AICTE PS 26264                                                                                   MASTER SOLUTION

NEXUS-IC | Global search | Role | As-of | Alerts | Sign out                PREFLIGHT RESULT: REVIEW
                                                                           Potential duplicate request
PROPOSED ACTION                                                            Known related action RB/PGRC
PID | type: document request                                               Connected feed / unknown scope
Purpose / doc class / period
Officer & source case / submit preflight

EVIDENCE & COUNTER-EVIDENCE
Same class / period / verified PID / related incident
Counter: separate proceedings, older dates, uncertain feed
Rule version / as-of; no autonomous hard block

OFFICER OPTIONS
[Proceed with recorded reason] [Edit action] [Start NEXUS SYNC]
Log decision and permitted action; no official action auto-executed

Wireframe: proposed layout; not a screenshot of deployed functionality.

   Figure: NEXUS PREVENT: action proposal, rule result and approved alternatives.

 NEXUS-IC | Global search | Role | As-of | Alerts | Sign out

NEXUS SYNC / CO-107
Blind notice | PGRC: accept / decline / ask information
Explicitly NO complainant narrative before approval

LEAD AND PARTICIPANTS                                                      COORDINATION TASK BOARD
Lead Bureau: PGRC [Approve]                                                Collect prior documents | owner
RB support / authority contact                                             Due time, state, dependencies
Acknowledgements and timestamp                                             Escalate if unacknowledged

 DECISION AND AUDIT RECEIPT
  Typed relationship | exact source case IDs kept separate
  Task evidence / reviewer sign-off / completion receipt
  No auto closure; scope-limited download

Wireframe: proposed layout; not a screenshot of deployed functionality.

   Figure: NEXUS SYNC: blind notice, bureau acknowledgement and owned tasks.

Project specification | 23 October 2026 | Synthetic-data reference design                                   Page 23
NEXUS-IC | AICTE PS 26264                                                                                        MASTER SOLUTION

    NEXUS-IC | Global search | Role | As-of | Alerts | Sign out            MANAGEMENT CONTROLS
                                                                           Bureau/region trend and workload
    COMPETENT AUTHORITY OVERVIEW                                           Delegation registry / audit evidence
     Institution-wide exceptions | Region and bureau coverage              No blanket private text access
     Pending sign-offs / overdue coordination / source conflicts

    APPROVAL INBOX
     Escalation request | approve / return
     Disclosure scope | grant expiry
     SLA policy v2 | review / reject

SIGNED DECISIONS + HISTORY
Actor, reason, scope, rule version, event time
Requester / approver separation | appeal / reversal with event

Wireframe: proposed layout; not a screenshot of deployed functionality.

   Figure: Competent Authority: escalations, access policy, SLA approval and audit.

Required banner behavior - exact problem-statement text

Potential Overlapping  Display this exact wording (including capitalization and dash) as a text-labelled, keyboard-accessible
Cases ­ Coordination   alert on /dashboard, /institutions/:id and /review whenever an authorized pending candidate meets the
Required               configured review threshold. Include count, involved case references as permitted, as-of time,
                       source-coverage note and action: Review evidence / Request coordination. Do not show it for
                       confirmed false matches or merely same-institution unrelated cases.

9. Matching and advisory collision logic

Project specification | 23 October 2026 | Synthetic-data reference design                                        Page 24
NEXUS-IC | AICTE PS 26264                                                                         MASTER SOLUTION

                                                       VERIFY IDENTITY
                                            Same authoritative PID? Campus ambiguity?

      RELATIONSHIP CANDIDATE                                                           ACTION COLLISION CANDIDATE
      Incident, document, period, category                                                 Purpose, owner, period, request class
                                                                                           known + unknown source coverage
            positive + counter evidence

                                                    HUMAN REVIEW + POLICY
                                            Coordinate, keep separate, false match, request info

                                               Audit decision; never force a statutory action

                                                    OWNED NEXUS SYNC TASK
                                            Authorized confirmation, acknowledgement, receipt

Figure: Three distinct operations: authoritative identity, suggestive incident relationship, and pre-action collision; human review is the
only bridge to coordination decisions.

Identity and case matching pipeline

1. Candidate generation: restrict to verified Permanent ID or identity-review queue. Never equate similar names with the same
institution.
2. Relationship features: source category, incident period, optional document reference overlap, issue and remedy terms, relevant
bureau pair and counter-signals.
3. Create evidence card: exact source facts, last sync, positive/counter reasons, incomplete feed flags, versioned rule ID.
4. Review: human chooses Coordinate/Keep Separate/False Match/Request Information/Defer and writes the mandatory reason.
5. Only authorized accepted links enter NEXUS SYNC; no automatic merge or statutory decision.

Example deterministic collision rules (illustrative, not AICTE regulation)

Rule  Trigger                                                                                     Result
C1    Exact verified PID + same doc class + same period + active action purpose
C2    Different verified PID                                                                      REVIEW: likely repeated document
C3    Same PID, different incident and non-overlapping period                                     demand
C4    PGRC feed disconnected/stale at point of decision
C5    Different legal proceeding with same evidence request                                       CLEAR on identity; no cross-PID
                                                                                                  merge

                                                                                                  No collision from identity alone

                                                                                                  UNKNOWN with missing-coverage
                                                                                                  reason

                                                                                                  REVIEW coordination only, never
                                                                                                  procedural merger

Project specification | 23 October 2026 | Synthetic-data reference design                                                          Page 25
NEXUS-IC | AICTE PS 26264                                                                      MASTER SOLUTION

Model release validation, semantic integration and rule fallback

Only when labeled, approval-cleared data exists: split by institution (not random case pair) to avoid leakage; compare PID-only
and rule-only baselines; report precision/recall/F1/PR-AUC and false-match review cost; calibrate thresholds. Embeddings may
rank human-review candidates, but model text must not fabricate reasons. If the ML component fails, rules still run. Do not
claim accuracy until reproduced.

Executable matching specification M-1 - not just a feature title

Stage A (institution identity): normalize Permanent ID and match exact institution plus validity period/campus. Different
verified IDs are an authoritative NOT-SAME gate. Missing/ambiguous IDs go to a human identity-resolution queue, never
automatic same-institution linking. Names alone create identity-review suggestions only.

Stage B (issue relationship): Within verified identity, compare two complaint incidents using seven independently inspectable
signals. For each signal s in [0,1], the default demo score is:

Weighted evidence score                    S = 25(issueConcept) + 15(timeWindow) + 10(category) + 15(documentOrSubject) +
                                           10(remedyIntent) + 10(sharedEntitiesOrReferences) + 15(semanticSimilarity). Each term is weight
                                           times a normalized 0-to-1 evidence value. Weights sum to 100. Missing evidence scores zero and adds
                                           an explicit missing-evidence warning; an NLP outage does not silently inflate the score. Output is a
                                           relationship-review score, NOT probability of guilt or factual certainty.

Signal                                     Demo weight  How it is computed and evidenced
Issue concept overlap                      25           Curated, versioned issue taxonomy and synonyms; e.g., retained certificates == withheld
                                                        originals.
Incident-date proximity                    15           1 for same/adjacent week, 0.5 for next 30 days, 0 if absent/far; adjustable by category.
Complaint category                         10           1 same normalized category, .5 related family, 0 unrelated.
Document / subject                         15           Exact normalized object class (original certificates, fee receipt, building inspection).
Requested remedy                           10           Shared practical objective such as release originals or stop a duplicate document demand.
Shared entities / refs                     10           Signed document ref, incident ID, names or scoped institution facts with confidence.
Semantic text similarity                   15           Versioned multilingual sentence embedding normalized/calibrated from held-out reviewer
                                                        labels.

Thresholds and safe disposition - demo starting values only

Score / condition                            Proposed system behavior                          Follow-up
Verified IDs differ                          IDENTITY BLOCK: not same institution              No overlap alert; investigate bad source data
                                                                                               only
80-100 and >=3 independent non-text signals  HIGH REVIEW candidate; prominent warning          Officer still decides; never auto-merge
60-79                                                                                          Evidence card, acknowledge and human
40-59                                        REVIEW candidate; exact coordination-required     disposition
0-39                                         banner                                            Request documents or re-score after new data

                                             LOW candidate in reviewer queue; no cross-bureau  Record retrieval only, unless reviewer
                                             broadcast                                         manually links
                                                                                               Do not report CLEAR based on missing data
                                             No overlap banner by default                      Counter-evidence prevents duplicate-action
                                                                                               conclusion
Unknown ID or stale source                   IDENTITY REVIEW / COVERAGE UNKNOWN
Explicit different incident or proceeding
                                             Typed RELATED-BUT-SEPARATE /
                                             KEEP_SEPARATE

Project specification | 23 October 2026 | Synthetic-data reference design                      Page 26
NEXUS-IC | AICTE PS 26264                                                         MASTER SOLUTION

Worked positive example - differently worded fictional complaints

RB-008 (RB)                PID TEST-PID-001; 10 Oct 2026; category Fee/Documents. Text: "The college retained original study
                           certificates after our fee balance was cleared." Proposed remedy: return originals.

PG-031 (PGRC)              PID TEST-PID-001; 11 Oct 2026; category Student Records. Text: "Despite settlement of outstanding
                           charges, the registrar will not hand back academic originals." Requested remedy: release papers.

Signal                     Normalized evidence                                    Contribution
Issue concept              1.00 (same withholding issue)                          25.00
Date window                1.00 (adjacent day)                                    15.00
Category                   1.00 (same mapped family)                              10.00
Subject class              1.00 (original certificates)                           15.00
Remedy                     1.00 (return originals)                                10.00
Shared refs/entities       0.60 (institution + registrar context)                 6.00
Semantic                   0.85 (example model score, not a trained measurement)  12.75
TOTAL                      Illustrative score: 93.75 / 100                        93.75

Result: HIGH REVIEW; display "Potential Overlapping Cases ­ Coordination Required" with source case refs and
counter-signals. The 0.85 semantic value is deliberately illustrative; do not claim a trained model produced it. Officers may still
choose KEEP_SEPARATE.

Worked hard negative and failure fallback

Same PID, RB-009 complaint about laboratory fire-door maintenance (June), PG-031 about return of certificates (October).
Example feature values issue=0, period=0, category=0, subject=0, remedy=0, shared=0.3 and semantic=0.1 produce S=4.5/100
(3 + 1.5); no banner. Same text across two different verified PIDs is identity-blocked regardless of textual score. If embeddings
are unavailable, present RULE-ONLY ranking with explicit unavailability, and evaluate separate calibrated thresholds; never
claim semantic capability is working when the service is off.

Calibration and implementation acceptance

· Build a minimum locked validation set: 40 true relation pairs plus 40 hard negatives, including at least 10 semantically paraphrased,
10 multilingual or translated and 10 identical-institution unrelated pairs; do not train and test on the same institution.
· Compute confusion matrix, precision, recall, F1, review queue precision, per-language results and false-positive costs. Freeze
threshold/rule/model versions before demo and show errors.
· Semantic feature (F28) is a required finals-target integration in this final specification; if its evaluated result is worse than rules,
disable by feature flag and transparently report rule-only fallback.
· Every evidence card shows contributions, source references, timestamps, counter-signals, provenance, candidate generation method
and role-restricted fields. Reviewer decisions always require reasons.

Project specification | 23 October 2026 | Synthetic-data reference design                       Page 27
NEXUS-IC | AICTE PS 26264                                                                         MASTER SOLUTION

 10. NEXUS SYNC lifecycle, business controls and permissions

                                                       1 DETECT
                                        Verified institution; candidate relationship

                                                       2 REVIEW
                                        Positive/counter proof; human disposition

                                                       3 NOTICE
                                        Opaque cross-bureau coordination request

                                                 4 ACKNOWLEDGE
                                        Accept, decline, request more information

                                         5 COORDINATE
                            Lead/support officers; tasks and dependencies

                                                                           6 VERIFY
                                                                   Evidence-based closure; audit and receipt

                                                           No source complaint is merged or closed by the matching engine.

Figure: Default process: detect, review, notice, acknowledge, coordinate, verify. Keep Separate and False Match are alternative audited
dispositions.

Coordination state machine

Current            Authorized event                                        Next                   Mandatory side effect
CANDIDATE          Reviewer opens evidence                                 UNDER_REVIEW
                                                                           NOTICE_PENDING         Viewer and evidence
UNDER_REVIEW       COORDINATE decision                                     CLOSED_WITH_REASON     version recorded
                                                                           AWAITING_RESPONSE
UNDER_REVIEW       KEEP_SEPARATE / FALSE_MATCH                             ACCEPTED / DECLINED /  Reason and typed case
                                                                           NEED_INFO              link recorded
NOTICE_PENDING     Create blind notice                                     IN_PROGRESS
                                                                           VERIFIED_CLOSED        No coordinated task;
AWAITING_RESPONSE  Accept / decline / ask info                             ESCALATED              corrections auditable

ACCEPTED           Assign lead, roles and tasks                                                   Opaque event to
                                                                                                  authorized recipient
IN_PROGRESS        All work acknowledged and signed
                                                                                                  Responder, timestamp,
ANY OPEN           Approved escalation or conflict                                                reason captured

                                                                                                  Task/owner/due date +
                                                                                                  scoped visibility

                                                                                                  Evidence and signed
                                                                                                  receipt created

                                                                                                  Owner and escalation
                                                                                                  reason logged

Project specification | 23 October 2026 | Synthetic-data reference design                         Page 28
NEXUS-IC | AICTE PS 26264                                                                                                            MASTER SOLUTION

                                RB CASE OWNER                                                           PGRC CASE OWNER
                  May see native RB record, edit authorized actions                       May see native PGRC record, edit authorized actions

                                              BLIND NEXUS SYNC NOTICE
                                     Verified institution match; source refs & category only
                                     No complainant identity, narrative or document bytes

                                       APPROVED TEMPORARY DISCLOSURE
                                     Purpose bound | Officer scope | Time limit | Audit entry

Figure: The coordination handshake does not itself grant access to restricted complainant identities, case narratives or documents.

Role and action matrix - proposed, approval required

Role                    View policy                                        Action policy                              Export scope
RB Officer
                        Unified cross-bureau safe-metadata catalog;        Accept/request coordination; own actions   Own assignments; no private
PGRC Officer            own-bureau full details; other narratives                                                     cross-bureau export
                        masked
Regional Officer
Reviewer / Coordinator  Unified cross-bureau safe-metadata catalog;        Accept/request coordination; own actions   Own assignments; no private
Bureau Lead             own-bureau full details; other narratives                                                     cross-bureau export
Senior Management       masked
Competent Authority
                        Authorized region and approved case                Triage/reassign in delegated regional scope Region reports with
System Admin            categories                                                                                                  suppression
Independent Auditor
                        Case evidence when role+purpose+scope              Disposition candidate; lead assignment;    Authorized receipt only
                        grants permit                                      coordination tasks

                        Bureau-wide permitted views                        Approve transfer/escalation as delegated   Bureau metrics, audit scoped

                        Scoped aggregates, exception catalog plus          Approve escalations/policies if delegated  Management reports; limited
                        approved case detail                                                                          PII

                        Dedicated oversight dashboard, scoped              Delegated escalation, disclosure and policy Scoped management reports,
                        exceptions and approvals; no automatic PII
                        reveal                                             approval with independent requester        attributable signed decisions

                        Connector/identity/policy config; no blanket       Configure demo data, access grants subject Audit admin operations, not
                        complaint narrative
                                                                           to approval                                content by default

                        Read-only audit subset and permitted evidence No operational decisions                        Scoped compliance extracts

Access escalation principle

Default-deny disclosure: cross-bureau counterpart receives a minimum-data blind notice. If case text or documents are
necessary, request a purpose-bound temporary grant approved by designated roles. Log requester, approver, legal basis/policy,
specific fields, expiry, revocation and every view/export. Do not assume bureau-to-bureau narrative visibility is legally
authorized.

Project specification | 23 October 2026 | Synthetic-data reference design                                                                        Page 29
NEXUS-IC | AICTE PS 26264                                                                                     MASTER SOLUTION

Single-window contract: discoverability is not universal disclosure

An authenticated officer with a legitimate case-related purpose can search ONE institution-wide case catalog across connected
and authorized bureau sources, even when a detailed narrative is restricted. Search results show only a minimum common
schema: opaque case reference, verified Permanent ID, source bureau, coarse issue category, mapped status, assigned-office
label, last action timestamp, source-as-of and existence of a potential coordination flag. Hidden cases may require even the
metadata to be masked by category-specific policy; disclose the omission as "restricted entries" when permitted, never silently
pretend completeness.

Viewer                     Unified catalog                                 Case narrative/evidence            Permitted action
RB / PGRC owner
Regional officer           All permitted institution index entries;        Own cases; other case text masked  Request coordination, propose action,
Cross-bureau reviewer      own bureau details                              unless granted                     modify own case
Senior Management
Competent Authority        Regional case catalog with                      Region-authorized details only     Triage, transfer and escalate if delegated
                           restricted-case placeholders
System administrator
                           Scoped catalog plus evidence-card               Purpose-bound reviewed grant       Human overlap disposition, coordinated
                           allowed signals                                 required for PII                   tasks

                           Institution/bureau aggregates and               Case text only by separately       Escalate and supervise through
                           exception summaries                             approved delegation                documented scope

                           Dedicated institution-level control panel Only expressly authorized case           Approve delegated escalation, policy and
                                                                                                              disclosure; issue signed administrative
                           and policy/audit index                          detail; not automatic PII access   oversight decisions

                           Connector, user, role and import                No automatic complaint narrative   Configure permissions; cannot
                           metadata                                        access                             self-approve disclosure

Competent Authority dedicated screen and powers - delegated, not assumed

· Route /authority.jsx: total/pending/overdue cases with source coverage, bureau-wide handover failures, unresolved source conflicts,
policy violations and pending approvals.
· Decision inbox: cross-bureau escalation requests, stalled transfer acknowledgements, scope-limited disclosure requests, approved
SLA policy versions and assigned review delegations.
· Two-step sensitive approvals (requester != approver), required justification, affected field list, effective dates, expiry, electronic
attribution and append-only audit.
· Authority does not overwrite native regulatory decisions or acquire unrestricted complainant identity merely because of position.
Operating permissions require AICTE validation.

Single-window authorization invariants

· Server-side ABAC applies consistently to list counts, search, institution profile, knowledge graph, export, API, file downloads,
notifications and sockets.
· Every catalog count shows scope, connected/unknown source coverage and asOfTime. Masked entries never leak via filters, facet
counts, logs or export.
· A blind coordination notice does not automatically authorize access to sensitive complainant narrative. Temporary grants are field-,
purpose-, actor- and time-bound, with expiry enforced server side.

Project specification | 23 October 2026 | Synthetic-data reference design                                                                     Page 30
NEXUS-IC | AICTE PS 26264                                                                MASTER SOLUTION

 11. Source integrity, timing and reconciliation

                                                                                SOURCE FEED
                                                                          System + case ref, revision, updatedAt

                                                                             ADAPTER CHECK
                                                                         Schema, authority, permissions, batch id

                                                                           SOURCE SNAPSHOT
                                                                      Immutable raw payload + hash + observedAt

                                                                       VERSIONED PROJECTION
                                                                         Native & mapped status, institution refs

                                                                         EVENTS + RECONCILE
                                                                       Conflicts, stale data and import diagnostics

   Figure: Every connector writes immutable source truth first; normalized state and workflow analytics are derived, with explicit conflicts
   and absent-feed conditions.

Adapter contract

  {
   "sourceSystem":"RB-DEMO", "sourceCaseRef":"RB-007",
   "sourceRevision":"0007", "sourceUpdatedAt":"2026-10-21T09:20:00+05:30",
   "observedAt":"2026-10-21T09:30:01+05:30",
   "batchId":"SEED-20261023-1", "rawHash":"sha256:...",
   "nativeStatus":"Action Initiated", "fieldAuthority":{"status":"RB"},
   "classification":"RESTRICTED", "accessPolicy":"RB_POLICY_V1"

  }

Integrity rules

· Current: fresh successful sync relative to approved freshness budget. Stale: watermark age exceeds threshold. Conflicted:
authoritative sources disagree. Not connected: source absent - coverage unknown.
· When a late feed arrives, preserve official eventTime versus observedAt; UI displays both where necessary.
· Source field authority can differ: e.g. one bureau owns its native procedural status, not a global source overriding all other bureaus.
· Escalate mismatched Permanent IDs, invalid status mappings, missing source keys and duplicate revisions to data-health review.
· Never use data-ingest timing alone as evidence that an officer failed to act by deadline.

12. SLA, dashboard metrics and reports

Configured, not invented, SLA rules

Prescribed timelines depend on authoritative policy, grievance category, source and administrative procedure. DARPG
CPGRAMS guidance is public context, not blanket proof of the governing timeline for each AICTE institution complaint. A
policy admin must configure rules, start/pause/end events and holiday calendars with approval and effective dates.

Metric        Formula and disambiguation                                   Must display
Open/pending
              Count cases mapped to PENDING or IN_PROCESS at selected as-of time Case scope, source coverage, definition version

Project specification | 23 October 2026 | Synthetic-data reference design                Page 31
NEXUS-IC | AICTE PS 26264                                                                      MASTER SOLUTION

Metric                Formula and disambiguation                                               Must display
Transferred           Count source cases/events classified as transferred within window        Whether snapshot or event-count measure
Disposed              Count cases with authorized disposition event in selected window         Denominator and per-source status mapping
Disposal rate         Disposed cases / eligible cases in selected cohort/window                Cohort definition; do not mix stock and flow
Overdue               Open cases with active approved SLA rule and dueAt < reference clock     Timezone, pause, as-of date, unknown policy count
Pending age           Reference date minus receipt/effective event date per policy             Median, ageing buckets and censored incomplete
                                                                                               cases
Overlap rate          Reviewer-confirmed related pairs / reviewed pairs                        Not equivalent to misconduct or savings
Coordination success  Verified completed coordination records / accepted coordination records  Unfinished cases still counted separately

Report/filter catalogue

· Institution-wise history (all permitted cases and movement ledger); region-wise and bureau-wise workloads; status-wise totals.
· Date-range report by receipt date, action date or completion date, selected explicitly.
· Pending age buckets, near-due and breached policy clock, paused clock share, unresolved transfer acks.
· Monthly/quarterly disposal trend with source coverage and mapping version; overlap review and false-match counts.
· CSV/PDF print/role-filtered export; record file creation event, actor and applied filters.

Seeded SLA policies that actually trigger - SYNTHETIC DEMO ONLY

These values are fictional training defaults for local demo accounts. They are deliberately NOT described as AICTE rules. An
official CPGRAMS 21-day guidance exists for CPGRAMS cases, but applicability to a specific AICTE Bureau/Cell case
requires separate written mapping and approval. In production mode, demonstration policies cannot be selected: missing
approved policy produces POLICY_NOT_CONFIGURED / UNKNOWN.

Policy ID                  Start and target (Asia/Kolkata)                 Near due / breach / escalation
DEMO-CASE-STANDARD-v1      receiptAt + 14 calendar days                    near due <=72h; overdue when dueAt passed; escalate to
                                                                           Bureau Lead at +24h
DEMO-CASE-PRIORITY-v1      receiptAt + 3 calendar days
DEMO-TRANSFER-ACK-v1       transferRequestedAt + 2 business days           near due <=24h; overdue immediately; escalate at +12h

DEMO-SYNC-ACK-v1           blindNoticeAt + 48 elapsed hours                near due <=1 business day; bureau lead escalation +24h
DEMO-TASK-v1               task.assignedAt + 5 business days               after due

                                                                           near due <=12h; coordinator escalation +12h after due

                                                                           near due <=1 business day; lead escalation +1 business day

Clock semantics and synthetic trigger examples

· Business calendar: Monday-Friday 09:00-17:00 Asia/Kolkata in the synthetic demo, with a versioned demonstration holiday list.
Deadline addition for business-day rules moves to the same local clock after eligible days; test Friday-to-Tuesday transitions.

· For STANDARD, receipt 01 Oct 2026 10:00 IST yields due 15 Oct 2026 10:00 IST (14 calendar days). At 12 Oct 10:00 it becomes
NEAR_DUE; at 15 Oct 10:00:01 it becomes OVERDUE; at 16 Oct 10:00:01 escalation is eligible. Test on a frozen reference clock.

· PAUSED applies only to an approved source/bureau-specific pause code (e.g., waiting for requested information) with audited
pauseFrom and resumedAt. Add elapsed eligible pause duration to dueAt; no silent pauses or arbitrary officer edits.

· Case status DISPOSED pauses further open-case breach alerting but retains the historical breach record; transfer does not
automatically restart the statutory clock.

· Scheduler persists deterministic alert key (policyId, caseId/taskId, state, thresholdAt, version). Reprocessing and time travel produce
zero duplicate delivery intents.

Project specification | 23 October 2026 | Synthetic-data reference design                      Page 32
NEXUS-IC | AICTE PS 26264                                                                             MASTER SOLUTION

External notifications: implemented contract, not a disabled afterthought

Channel                    How it works                                            Safety/conditions
In-app (core)
Email (core integration)   MongoDB notification + websocket/poll; read/ack states  Full actionable info only within authorized login
SMS (deployment-gated)     persist
Fallback / dead letter
Preferences / quiet hours  MongoDB outbox worker to SMTP/provider (local test      Send to approved officer work email only; subject: action
                           sink by default); templates + retries + bounce status   needed, no case narrative/PII

                           Provider-neutral SMS transport and local simulator; actual Minimal opaque code + secure login link; explicit

                           gateway behind admin approval flag                      organization approval & sender requirements

                           Retry with backoff 1, 5, 30 min; cap attempts;          Never mark delivered until provider acknowledges;
                           dead-letter/admin repair                                idempotent send key

                           Urgency tier, escalation routing, officer channel       Mandatory legal notifications require separately validated
                           preferences and timezone                                policy

Example payload - safe email/SMS notification

  { eventType: "OVERLAP_REVIEW_REQUIRED", notificationId: "NOT-0005",
   recipientOfficerId: "demo-rb-01", deliveryChannel: "EMAIL",
   subject: "NEXUS-IC: coordination review requested",
   body: "A restricted coordination item awaits your review. Sign in to NEXUS-IC.",
   safeLink: "/review/FND-004", idempotencyKey: "NOT-0005:EMAIL:v1",
   noCaseNarrative: true, sourcePolicy: "DEMO-ALERT-v1" }

Test with a local email sink; verify retry, duplicate suppression, bounce/dead-letter, recipient change and zero leaked
complainant fields. Production SMS and email cannot be claimed live until transport and permissions are validated.

13. Privacy, security, reliability and accessibility

Area                       Required implementation                                                  Negative test / risk
Auth/session               HttpOnly Secure cookies or safely rotated sessions; server rechecks      Token theft/localStorage exposure avoided
                           authorization
Cross-bureau privacy       Default-deny ABAC and opaque notices                                     Forbidden narrative absent from
                                                                                                    JSON/export/socket
Input and output           Schema validation, restricted attachments, content security protections  XSS/injection/untrusted file payload
Concurrency                Version lock and idempotency key for stateful operations                 No duplicate task after network retry
Audit                      Append-only events with actor, purpose, timestamp, before/after ref      Silent edits not permitted
At rest/in transit         Encrypted storage and HTTPS proposed for real deployment                 No secret/data accidentally committed
Data minimization          Synthetic sample, scoped fields, purpose bound retention                 No authentic complainant data in demo
Accessibility              Keyboard, skip link, field labels, WCAG 2.1 AA-informed review           200% zoom, focus order, screen-reader labels
Observability              Health probes, request IDs and non-sensitive structured logs             No complainant text in logs
Disaster readiness         Backup, restore, import replay, signed artifact digests                  Recover from failed deploy/seed state

Government UX and information integrity

Design to GIGW 3.0 and WCAG 2.1 Level AA practices in the implementation, then independently test. "Accessible by
design" is not a certification. Any production environment also needs AICTE approval for identity, security, retention,
procurement and integration. [4]

Project specification | 23 October 2026 | Synthetic-data reference design                                                                Page 33
NEXUS-IC | AICTE PS 26264                                                                   MASTER SOLUTION

14. Ten strategic improvements - complete technical specifications

These ten enhancements are ADDITIONS OR EXTENSIONS to baseline F01-F64, not replacements. Each entry cites the
original features it extends; overlapping capability is intentionally reused rather than counted as a completely new system.
"P0/P1/P2" denote planned implementation priority, not completion status.

ID   Strategic improvement                           Mapped baseline feature IDs            Priority
                                                     F17, F23, F24, F27, F48                P1 (core extension)
E01  NEXUS PREVENT - Action Conflict Prevention      F18-F22, F25-F27, F41, F42             P0 + P1
                                                     F01-F06, F11, F14, F19                 P1
E02  NEXUS SYNC 2.0 - Accountable Coordination       F02, F03, F17-F19, F28, F62            P1 measured semantic ranking
                                                                                            (rules fallback)
E03  Institution Evidence Knowledge Graph                                                   P0 policy + P1 analytics
                                                                                            P0 + P1
E04  Explainable Multilingual Relationship Matching                                         P1
                                                                                            P0 + P1
E05  Smart SLA and Bottleneck Intelligence           F10, F12, F22, F35, F39-F44            P1
                                                                                            P0 + P1
E06  Privacy-Safe Cross-Bureau Collaboration         F20, F25, F45-F47, F54

E07  Institution Attention Radar                     F04, F30, F33, F35, F37, F39, F48

E08  Data Trust, Field Authority and Reconciliation  F09, F15, F27, F48, F49, F53

E09  NEXUS IMPACT - Measurable Coordination Value    F35, F36, F58, F59, F60

E10  Interactive Case Command Centre                 F04, F29-F34, F37, F50, F55, F56, F59

E01 / NEXUS PREVENT - Action Conflict Prevention

Priority: P1 (core extension). Existing feature anchors: F17, F23, F24, F27, F48.

Problem addressed and value. Add an officer-facing pre-action workspace for document requests, inspections, notices and
follow-ups. Compare the *proposed action* to active known actions, not just the complaint text. Avoid duplicate effort before it
is created.

Implementation and data. Fields: verifiedInstitutionId, actionClass, purposeCode, documentClasses, periodStart/periodEnd,
proceedingRef, ownerBureau, sourceCompleteness. Candidate eligibility requires verified identity plus compatible action
purpose and overlapping temporal scope; contradictory proceeding evidence is visible.

API contract / technical deliverable. POST /api/v1/prevent/check -> decision CLEAR|REVIEW|UNKNOWN; reasons[],
counterReasons[], candidateActionIds[], sourceCoverage, ruleVersion, evaluatedAt. Store immutable preflight_findings with
unique idempotency key.

Live demonstration / acceptance. Judge drafts an RB document request already requested by PGRC; REVIEW appears.
Changing the period or document class changes the output. Disconnecting PGRC returns UNKNOWN, not CLEAR.

Safety and scope control. No automatic statutory block. Reviewer may proceed with a reason or open NEXUS SYNC. A real gateway
enforcement mode requires explicit AICTE legal authority, formal policy and independent testing.

E02 / NEXUS SYNC 2.0 - Accountable Coordination

Priority: P0 + P1. Existing feature anchors: F18-F22, F25-F27, F41, F42.

Problem addressed and value. Complete the six-step handshake with requests, acknowledgement, lead/support roles,
dependencies, accept/decline, request-more-information, stalled handovers, disagreement escalation and verifiable resolution
receipts.

Implementation and data. coordination state machine: PROPOSED -> NOTICE_SENT -> ACK_PENDING ->
ACCEPTED/DECLINED/INFO_REQUESTED -> PLAN_ACTIVE -> EVIDENCE_REVIEW -> COMPLETED. A declined
or expired request remains visible and auditable. Never transfer source-case ownership implicitly.

Project specification | 23 October 2026 | Synthetic-data reference design                                                     Page 34
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

API contract / technical deliverable. POST /api/v1/coordination/:id/respond; POST /api/v1/coordination/:id/escalate; GET
/api/v1/coordination/:id/receipt; all transitions require permitted actor, prior version, idempotency key and audit event.

Live demonstration / acceptance. RB sends privacy-safe coordination request, PGRC acknowledges with a separate login,
lead assigns task, dependent task completes and a redacted receipt reconstructs the sequence.

Safety and scope control. Task completion is not case disposal; preserve separate RB and PGRC case statuses and legal proceedings.

E03 / Institution Evidence Knowledge Graph

Priority: P1. Existing feature anchors: F01-F06, F11, F14, F19.

Problem addressed and value. Show a browsable, institution-centered graph with institutions/campuses, source cases,
bureaus, officers, actions, tasks, documents and typed *reviewed* relationships.

Implementation and data. Use MongoDB graph_nodes (projection) and case_relationships/graph_edges (typed source-backed
assertions), indexed by institutionId/fromId/toId/type. Server constructs a bounded neighborhood, redacts hidden nodes and
never infers identity transitively.

API contract / technical deliverable. GET /api/v1/graph/institutions/:id?depth=1&limit=75 -> nodes[], edges[], visibleScope,
omittedCount, asOf. React Flow layout; edge click opens its evidence card and permitted source record.

Live demonstration / acceptance. Click institution -> RB case -> suspected matching PGRC case -> evidence card. An
unrelated case is shown separate; a forbidden attachment or person node is omitted.

Safety and scope control. Graph edges are not proof of wrongdoing, and no link appears purely because two cases share a common neighbor.

E04 / Explainable Multilingual Relationship Matching

Priority: P1 measured semantic ranking (rules fallback). Existing feature anchors: F02, F03, F17-F19, F28, F62.

Problem addressed and value. Support differently phrased complaints in English, Hindi and other locally validated languages
through verified-ID blocking, normalized keywords, date/entity signals and optionally a multilingual reranker.

Implementation and data. Persist original UTF-8 text, detected language, reviewer-correctable translation, input language and
model/rule version. Ranking needs both positive clues and counter-signals such as distinct incidents, periods, campuses or
proceedings.

API contract / technical deliverable. POST /api/v1/matching/candidates; POST /api/v1/matching/evaluate. Response includes
candidate relation type, reasons with source pointers, missing data, evidence and modelVersion (nullable).

Live demonstration / acceptance. Two differently worded cross-language synthetic complaints rank as review candidates;
same-PID unrelated cases remain low confidence or KEEP_SEPARATE.

Safety and scope control. Never present unmeasured language accuracy or auto-merge. Use locked institution-grouped holdout with
precision/recall and language-stratified false positives.

E05 / Smart SLA and Bottleneck Intelligence

Priority: P0 policy + P1 analytics. Existing feature anchors: F10, F12, F22, F35, F39-F44.

Problem addressed and value. Provide due-soon/overdue calendars, handover delays, stalled coordination tasks, reasoned
follow-up suggestions and bureau workload analysis from policy-approved clocks.

Implementation and data. Policy table defines applicable category, start event, target days, business calendar, pause/resume
reasons, holidays, applicable bureau and effective version; keep source event time distinct from ingest observation time.

API contract / technical deliverable. GET /api/v1/sla/attention?scope=...; POST /api/v1/sla/policies/:id/versions. Suggested
priority uses overdue days, unacknowledged transfer and verified missing information - not misconduct score.

Live demonstration / acceptance. Move an action date across a tested holiday/pause boundary; due date and reason trail
recompute correctly without rewriting historical policy versions.

Safety and scope control. Predicted disposal dates only after valid local historical evaluation; no assumed AICTE-wide statutory SLA.

Project specification | 23 October 2026 | Synthetic-data reference design  Page 35
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

E06 / Privacy-Safe Cross-Bureau Collaboration

Priority: P0 + P1. Existing feature anchors: F20, F25, F45-F47, F54.

Problem addressed and value. A bureau initially sees a blind, opaque overlap notice. Restricted narratives, identifiers and
evidence are disclosed only through purpose-bound reviewed grants.

Implementation and data. ABAC computes actor + bureau + case + category + purpose + field policy and approved grant with
expiry. Apply to API, search, graph, Socket.IO, file downloads and exports. Log reveal/deny and policy change.

API contract / technical deliverable. POST /api/v1/access-requests; POST /api/v1/access-requests/:id/decision; GET
/api/v1/disclosures/:id. Do not include hidden case titles or narrative in errors, count badges or notification payloads.

Live demonstration / acceptance. RB cannot read PGRC protected material before approval; reviewed grant permits only
allowed fields and expires automatically. Export after expiry is denied.

Safety and scope control. No general admin bypass; approval policy and retention must be formally verified before a real pilot.

E07 / Institution Attention Radar

Priority: P1. Existing feature anchors: F04, F30, F33, F35, F37, F39, F48.

Problem addressed and value. Give managers an operational queue of institutions needing administrative follow-up because
of verified overdue actions, stalled acknowledgements, unresolved source conflicts or repeated pending tasks.

Implementation and data. Compute transparent attention reasons (counts, due dates, conflict IDs, acknowledged backlog);
link each flag to permissible evidence. No opaque institutional wrongdoing ranking, no automatic penalty or regulatory
recommendation.

API contract / technical deliverable. GET /api/v1/attention/institutions?region=...; response reasons[], sourceCoverage,
overdueTaskCount, conflictCount, taskOwner, dataAsOf.

Live demonstration / acceptance. Select a high-attention fictional institution, inspect linked overdue task and stale source.
When feed disconnects, mark incomplete rather than ranking on fake zero.

Safety and scope control. Call it attention/operations prioritization; never institution guilt or compliance risk score.

E08 / Data Trust, Field Authority and Reconciliation

Priority: P0 + P1. Existing feature anchors: F09, F15, F27, F48, F49, F53.

Problem addressed and value. Expose data health and field-level disagreements, not only connector status. Quarantine
malformed imports, support replay and retain every source-native status.

Implementation and data. Immutable source_snapshot carries system, version, watermark, source_updated_at, observed_at,
payload hash and access label; source_claims carries field, assertedValue, issuing source and authority priority. Reconciler
proposes attributed resolution.

API contract / technical deliverable. GET /api/v1/data-quality/claims; POST /api/v1/data-quality/conflicts/:id/resolve.
Accepted correction creates new projection version and audit, never mutates raw snapshots.

Live demonstration / acceptance. Import two contradictory statuses, inspect both with timestamps, reconcile only an allowed
field, rerun batch and show zero duplicated cases.

Safety and scope control. Any source not connected is UNKNOWN, not 0. A delayed feed does not prove an officer missed a deadline.

E09 / NEXUS IMPACT - Measurable Coordination Value

Priority: P1. Existing feature anchors: F35, F36, F58, F59, F60.

Problem addressed and value. Provide a reproducible comparison lab instead of claiming unmeasured savings: same seeded
scenarios through conventional independent-bureau handling and through PREVENT + SYNC.

Project specification | 23 October 2026 | Synthetic-data reference design  Page 36
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

Implementation and data. Define operational metrics in advance: duplicate-request attempts identified, review precision,
irrelevant alert share, acknowledgement latency, officer steps, unresolved handovers, case-age distribution. Label observed
simulation vs measured pilot vs hypothesis.

API contract / technical deliverable. POST /api/v1/impact/scenarios/run (demo admin only); GET /api/v1/impact/trials/:id;
GET /api/v1/impact/definitions. Store trialId, fixture hash, method, event log, start/end, outcome and comparison method.

Live demonstration / acceptance. Judge triggers identical seeded scenarios in both modes and sees an audit-backed
comparison with raw event logs, denominators, caveats and reproducibility hash.

Safety and scope control. "Action flagged" does not equal "action avoided"; only trace-backed non-execution after documented coordination
qualifies as observed avoided work in the prototype.

E10 / Interactive Case Command Centre

Priority: P0 + P1. Existing feature anchors: F04, F29-F34, F37, F50, F55, F56, F59.

Problem addressed and value. Build a role-personalized responsive interface: command KPIs, Institution 360, full case
workspace, overlap review, PREVENT desk, SYNC board, graph, radar, source-trust view, Impact Lab and reports.

Implementation and data. React JSX components, React Router, TanStack Query, Tailwind, Recharts, React Flow. Every
data panel has loading/empty/error/UNKNOWN states, scope/asOf metadata, keyboard focus and accessible controls.

API contract / technical deliverable. Routes /dashboard, /institutions/:id, /cases/:id, /review, /prevent, /sync, /graph/:id,
/attention, /impact, /reports, /admin. Deep-links enforce auth and expose no hidden fields.

Live demonstration / acceptance. A reviewer demonstrates all major flows without dead-end buttons. At 200% zoom all
critical actions remain reachable by keyboard, with no incorrect chart totals.

Safety and scope control. Graph and animations are optional presentation, never a substitute for reliable workflow logic or screen-reader
information.

15. Unified architecture, new data models and execution contracts

The system remains a modular JavaScript monolith; feature-rich does not mean microservice-heavy. Deterministic rules run
reliably without any generative AI service. An optional multilingual ranker is a bounded internal adapter, not an agent with
administrative authority.

Project specification | 23 October 2026 | Synthetic-data reference design  Page 37
NEXUS-IC | AICTE PS 26264                                                                                                       MASTER SOLUTION

                                                   REACT JSX + VITE - ACCESSIBLE OFFICER WORKSPACE
                                                             Command Centre | Institution 360 | Case Desk | PREVENT | SYNC
                                                              Knowledge Graph | Attention Radar | Impact Lab | Audit / Reports

                                 EXPRESS / NODE.JS - SINGLE MODULAR JAVASCRIPT API
                                    Auth & field policy | Institution & Case | Events | Matching & Explain

                                   PREVENT rules | SYNC coordination | SLA / Attention | Trust & Impact
                                        REST / Socket updates | Validation | Transaction + audit outbox

MONGODB / MONGOOSE                            EVIDENCE / JOBS                                                                   RULE & AI ADAPTER
   Indexed domain collections               Private attachment objects                                                           Deterministic identity first
                                                                                                                                Optional multilingual ranker
Source snapshots & audit events                  Alert/retry outbox                                                               Feature flag and fallback
  Graph edges & impact events             Import quarantine & schedules

APPROVED SOURCE CONTRACTS                                                   SECURITY AND GOVERNANCE
 RB / PGRC / regional feeds by agreement                                   ABAC / opaque handshake / expiring grants
      Synthetic CSV/API data for finals
                                                                                Policy versions / replay / reporting

Figure: Updated deployment architecture integrating all 10 improvements with the original case platform, persistence, audit, source
adapters and optional multilingual support.

Project specification | 23 October 2026 | Synthetic-data reference design                                                                                      Page 38
NEXUS-IC | AICTE PS 26264                                                                                                  MASTER SOLUTION

 NEXUS PREVENT - authoritative decision path

                                                                               1. PROPOSE ACTION
                                                                             Institution ID, type, document class, period

                                                                      2. CHECK ACCESS & COVERAGE
                                                                               Role scope and connected/current feeds

                                                                      3. COMPARE VERIFIED ACTIONS
                                                                              Purpose, class, dates, proceeding, owner

                                                                             4. EXPLAIN EVIDENCE
                                                                                Matched action refs + counter-signals

                                                                            5. ADVISORY RESPONSE
                                                                       CLEAR / REVIEW / UNKNOWN, not a legal ruling

                                                                              6. OFFICER CHOOSES
                                                                               Proceed, edit, request SYNC or escalate

                                       No AI-only hard block; only expressly approved gateway rules could prevent commits.
Figure: Proposed actions are compared before external administrative execution; advisory output does not block an official act.

Project specification | 23 October 2026 | Synthetic-data reference design                                                        Page 39
NEXUS-IC | AICTE PS 26264                                                                                                     MASTER SOLUTION

 Institution Evidence Knowledge Graph

                                                     Links are typed, reviewable, scoped and never transitively auto-merged.

                                                                                   INSTITUTION
                                                                                        Verified Permanent ID

                                                                                           Campus boundary

                             RB CASE                                                   PGRC CASE
                     Native state; source owner                                    Independent case record

                     OFFICER / BUREAU                                              ACTION + TASK
                        Scoped RB authority                                        Purpose; time period

                                                                      TYPED EVIDENCE EDGE
                                                                    Visible only with authorized source evidence

Figure: Typed relationship graph uses verified institution identity and permission-filtered nodes and edges.

Existing collections retained - new/extended collections

Collection / object  Essential stored fields                                       Invariant / index
action_intents
preflight_findings   intentId, PID, actionClass, purposeCode, docClasses, period,  idempotencyKey unique; proposal not official action
graph_edges          actor, version
attention_signals
impact_trials        intentId, CLEAR/REVIEW/UNKNOWN, reasons,                      immutable evaluation snapshot
impact_events        candidateIds, evaluatedAt, ruleVersion
field_claims
access_requests      fromId, toId, type, sourceRefs, visibility, decisionId, reviewer typed edge; indexed by institutionId and source
language_assertions
policy_versions      institutionId, reasonCode, underlyingTaskIds, asOf, coverage, refreshable projection, no guilt score
                     version

                     fixtureHash, arm, runId, startedAt, scenarioVersion,          test-arm provenance, immutable raw traces
                     environment

                     trialId, actorRole, action, occurredAt, caseRef, taskRef,     append-only, no sensitive narratives
                     outcome

                     sourceSnapshotId, entityId, field, value, authority, observedAt conflict preserved; reviewer resolves projection

                     requester, case, fields, purpose, approver, grantedUntil      default deny, expired grant enforced

                     caseRef, detectedLanguage, originalHash, translationRef,      original never replaced
                     reviewedBy

                     scope, calendar, startRule, stopRule, pauseRules,             version immutable and traceable
                     effectiveFrom

Project specification | 23 October 2026 | Synthetic-data reference design                                                     Page 40
NEXUS-IC | AICTE PS 26264                                                           MASTER SOLUTION

Request and response design examples

  POST /api/v1/prevent/check
  {institutionId, actionClass, purposeCode, documentClasses, period, expectedVersion}
  -> {decision:"REVIEW", ruleVersion, candidates:[opaqueId], reasons, counterReasons,

     dataCoverage:"CURRENT", evaluatedAt, preflightId}

  GET /api/v1/graph/institutions/:id?depth=1&limit=75
  -> {nodes:[{id,type,label,visibility}], edges:[{from,to,type,evidenceRef}],

     asOf, omittedCount, scope, sourceCoverage}

  GET /api/v1/impact/trials/:trialId
  -> {scenarioVersion, fixtureHash, baseline:{events,metrics}, nexus:{events,metrics},

     comparison:{definitions, denominators, limitations}, measurementType:"SYNTHETIC"}

Operational event order and consistency guarantees

1. Read user, bureau, purpose and field scope from verified backend session; never trust role in React local state.
2. Resolve exact verified Permanent ID, campus and source authority; if no trusted match, return identity-review/UNKNOWN.
3. For each proposed action, compare only role-permitted metadata and disclose the minimum reasons sufficient for action.
4. Commit coordinator decisions using expected-version + idempotency-key + case/coordination events in a Mongo transaction.
5. Write notification outbox within the transaction; deliver asynchronously; retry safely without duplicate notices.
6. Recalculate aggregate projections and attention reasons from authorized events; retain asOf and source coverage.
7. Record export and proof-trial provenance; action and metric results must be reproducible from persisted events.

Expanded frontend routes and components

Route              Primary components                                               Empty/denied/unknown behavior

/dashboard         KpiStrip, ScopedFilters, WorkloadCharts, FollowUpInbox           No source -> coverage banner, UNKNOWN
/institutions/:id  IdentityHeader, CaseTimeline, SourceStatus, RelatedCases         count

                                                                                    Ambiguous campus -> review badge

/cases/:id         CaseHeader, NativeStatus, Events, MovementPanel, SecureEvidence  Unauthorized fields omitted by API
/review            CandidateEvidenceCard, CounterSignals, DispositionModal          Low-evidence candidate -> more information

/prevent           ActionIntentForm, PreflightDecision, KnownActions                Unconnected feed -> UNKNOWN, no green
/sync              HandshakeInbox, RoleAssignment, TaskDependencyBoard, Receipt     all-clear

                                                                                    Declined/expired request is audited

/graph/:id         InstitutionGraph, EdgeDetail, EvidenceDrawer                     Restricted node/edge never returned
/attention         FollowUpReasons, DueFilters, ConflictDrilldown                   Missing scopes labelled incomplete

/impact            PairedScenarioRunner, MetricDefinitions, RawTraceViewer          No run -> no impact claim

/data-trust        SourceWatermarks, ConflictQueue, ImportErrors                    No latest import -> explicit not connected
/reports           DateRange, MetricTable, ExportPanel, PrintableReport             CSV/API obey same ABAC filter

Project specification | 23 October 2026 | Synthetic-data reference design                                                    Page 41
NEXUS-IC | AICTE PS 26264                                                                                                           MASTER SOLUTION

 16. Technical UX, evaluation design and team skills

                                                                          MAIN ROLE NAVIGATION
                                                      Dashboard | Institution | Cases | Findings | PREVENT | SYNC | Graph | Impact

ACTION WORKBENCH                KNOWLEDGE GRAPH                                                                                     ATTENTION RADAR
   Advisory rule + reasons          Nodes + typed edges                                                                              Actionable backlog only
       Access policy first            Access policy first
                                                                                                                                         Access policy first

SOURCE TRUST + AUDIT                                                       NEXUS IMPACT LAB
     Freshness and conflicts                                                   Paired scenario runs

 Permission + evidence history                                             Definitions and raw traces
       Unknown never zero                                                  Export reproducible results

Figure: Unified navigation: the added PREVENT, Graph, Radar and Impact Lab screens integrate with original case and coordination
journeys.

Project specification | 23 October 2026 | Synthetic-data reference design                                                                                     Page 42
NEXUS-IC | AICTE PS 26264                                                                                     MASTER SOLUTION

 NEXUS IMPACT - defensible benchmark methodology                              NEXUS-IC WORKFLOW
                                                                           PREVENT alert + SYNC handshake
                           CONTROL WORKFLOW
                               Independent bureau handling                      Identical synthetic scenarios
                                Identical synthetic scenarios

TRACE A: OBSERVED EVENTS                                                   TRACE B: OBSERVED EVENTS
      Actions, attempts, timestamps                                              Actions, attempts, timestamps
      Task completions, corrections                                              Task completions, corrections

                               NEXUS IMPACT - PAIRED COMPARISON
                                Time, extra requests, alert precision, review burden
                              Observed / modelled / unknown explicitly distinguished

                                                         Simulated difference is not evidence of real AICTE savings.
Figure: Predefined, paired synthetic workflow runs; measured prototype effect is not equivalent to observed real-world AICTE efficiency
gains.

Metric                        Operational numerator and denominator                                     Failure to avoid
Alert precision               Confirmed relevant relation alerts / all alerts reviewed                  Do not divide by all created cases
Unnecessary alert share       Reviewer-dismissed alerts / alerts reviewed                               Report category and reviewer uncertainty
Duplicate action attempts     Action proposals matching an already active same-purpose+period action    An attempt detected is not saved work
Demonstrated avoided request  Confirmed coordinated request not repeated in completed scenario /        Must have event trace and exclusion rules
                              eligible tasks
Acknowledgement latency       Accepted notice timestamp minus sent timestamp, by completed notice       Do not treat unacknowledged items as zero
                                                                                                        time
Review workload               Steps, time and correction count per scripted officer task                Compare identical scenario and role
Case ageing                   Open cases by elapsed valid clock, scope and cohort                       Do not infer disposal SLA without
                                                                                                        approved policy
Missing source fraction       Disconnected/stale required source streams / expected authorized streams  Not a complaint count or AICTE-wide
                                                                                                        denominator

Evaluation protocol - evidence standards

1. Freeze seeded case fixture set and scenario version before comparison; verify the same cases and scripted roles in each arm.
2. Define outcome labels independently; use a held-out institution-grouped set for matching and a separate hard-negative set.
3. Record raw event traces, effective date/time zone, tool versions, seed hash and machine environment.
4. Report per-language subgroup performance only if sample size is disclosed and adequate; do not claim generalization beyond
synthetic labels.
5. Publish numerator, denominator and scope behind every displayed impact percentage; include confidence intervals only when
statistical design justifies them.

Project specification | 23 October 2026 | Synthetic-data reference design                                                        Page 43
NEXUS-IC | AICTE PS 26264                                                                                    MASTER SOLUTION

6. Require privacy-negative and false-match suites to pass before enabling optional semantic suggestions.
7. Clearly separate measured synthetic-demo results from projected or hypothetical deployment benefits.

Detailed user journeys

Persona                    Start -> decision -> outcome                                                      Essential proof
RB officer                 Login -> case search -> draft action -> PREVENT REVIEW -> request SYNC            Case does not silently transfer; result
                                                                                                             persisted
PGRC officer               Opaque notification -> ack -> request narrow field disclosure -> help coordinate  Unapproved narrative never exposed
Lead reviewer              Evidence card -> compare counter-signals -> record reason -> assign tasks         False positives can remain separate
Regional office            Filter institutions/region -> attention item -> pending handover                  Only own delegated region visible
Senior management          View scoped workload and SLA trends -> inspect source health -> escalate          Every KPI reconciles with records
Independent auditor        Open coordination receipt -> replay relevant event trail -> verify export         Read-only scope, no silent edit

Development skills and ownership

Responsibility             Skills and concrete implementation ownership
UI / product               React JSX, Vite, forms, navigation, accessible components, Recharts, optional React Flow
Backend / workflow         Node.js, Express, JavaScript, request validation, REST, state machines, idempotency
Database / sources         MongoDB/Mongoose, compound indexes, transactions, projections, source import reconciliation
Matching / NLP             Identity blocking, rule features, text similarity, multilingual offline evaluation and explainability
Security / QA              RBAC/ABAC, threat modeling, Playwright, Supertest, negative-role tests, audit evidence
Design / jury              Problem-fit narrative, impact metric definitions, scenarios, repeatable demo, limitations

Role and scope in implementation

Source system owners must approve access, dataset classification, permanent-ID/campus semantics, field disclosure
boundaries, applicable timelines and responsible escalation authority. A coding team cannot infer these from the challenge text
alone. Government accessibility guidance (GIGW 3.0) and applicable Indian data-protection rules inform design; compliance
requires a later institutional legal/security review. [4][5][6]

17. Test plan: 30 baseline acceptance checks

Test ID  Verifiable case                                                                                     Category
T01      Exact verified same PID; correct bureau case linking                                                Positive
T02      Similar name but different verified PIDs                                                            Hard negative
T03      Same institution, unrelated incident                                                                Hard negative
T04      Related incident under legally separate proceedings                                                 Hard negative
T05      Same document class but different periods                                                           Hard negative
T06      Transitive A-B and B-C do not imply A-C                                                             Hard negative
T07      Unknown source coverage is never displayed as zero                                                  Safety
T08      Late-arriving source update preserves event vs observed time                                        Temporal
T09      Replaying same source batch creates zero duplicate cases                                            Import

Project specification | 23 October 2026 | Synthetic-data reference design                                                         Page 44
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

Test ID  Verifiable case                                                   Category
T10      Conflicting source statuses retained in disagreement queue        Integrity
T11      RB cannot export PGRC private narrative without grant             Security
T12      Opaque notification contains no private text                      Security
T13      Expired disclosure grant stops reading docs                       Security
T14      Role query/search/export/socket share same policy filter          Security
T15      Wrong actor cannot accept another bureau transfer                 Authorization
T16      Review decision requires nonempty reason                          Workflow
T17      Concurrent coordination updates reject stale version              Concurrency
T18      Action check returns UNKNOWN for missing feed                     Safety
T19      Only configured rule marks SLA overdue                            Correctness
T20      Policy version change does not rewrite historical ageing          Temporal
T21      Real-time count reconciles with filtered records                  Data
T22      Bad CSV row quarantined; good rows imported                       Import
T23      All essential flows keyboard navigable / 200% zoom                Accessibility
T24      Notification retry does not multiply alerts                       Reliability
T25      Event correction does not erase original audit entry              Audit
T26      Synthetic end-to-end RB->PGRC->task->receipt persists             Judge demo
T27      Case relationship does not auto-close a source case               Safety
T28      Report export records who, filter, time and scope                 Privacy
T29      Offline NLP service falls back to rule-only matching              Resilience
T30      Tampered audit hash is detected by verifier                       Audit

Minimum evidence pack

1. Automated test logs with pass/fail, execution command, runtime and environment; never fabricate passing results.
2. Playwright screenshots/video of roles, two matching cases, a hard negative, decision, ack, task, audit and report.
3. Database fixtures and exact seed version hash; replay and reset scripts.
4. Measured latency/load results only when test actually run, with sample counts and machine specs.
5. Known limitations and unimplemented P1/P2 clearly flagged in readme and demo.

18. Risk register, open questions and definition of done

Risk / unknown                          Mitigation or required owner decision
Official connector access unavailable   Synthetic adapters only; no live feed claims; API contracts require approval
Source ownership of status disputed     Keep native statuses; map analytically with field authority and review
One Permanent ID across campuses/years  Campus hierarchy and identity-review queue; test ambiguous cases
Cross-bureau privacy authorization      Field ABAC, blind notices, purpose-bound grants; obtain formal approval

Project specification | 23 October 2026 | Synthetic-data reference design                                              Page 45
NEXUS-IC | AICTE PS 26264                                                            MASTER SOLUTION

Risk / unknown                       Mitigation or required owner decision
Real SLA ambiguity                   Configurable effective policies, never assert universal deadline
AI false positives                   Hard-negative lock set, human dispositions and optional model release gate
Unapproved live email/SMS transport  SMTP email sink and SMS simulator available locally; live dispatch gated behind written
                                     approval
Poor internet / staging failure      Local Docker/Node demo and sealed seed/reset evidence
Large scope within one night         P0 path first; P1 only with end-to-end proof; P2 defer

Final acceptance gates

1. Every requirement R01-R55 is mapped and either verified working or explicitly listed as not yet implemented.
2. Every P0 feature F01-F64 tagged P0 passes its relevant UI and API tests; no role visibility leak.
3. Two-bureau judge scenario completes without manually editing the database.
4. Source history and actor provenance persist; missing feeds do not produce false zeros.
5. Real metrics come from actual local execution; no imaginary savings, accuracy, integration or deployment claims.
6. Readme contains environment setup, test commands, fixture reset, demo users, limitations, architecture and screenshots.

19. Additional enhancement verification: 22 release tests

These tests complement T01-T30. No feature is declared complete merely because it appears in this document. Every passed
test must have evidence from an actual run.

Test  Verifiable behavior                                                            Feature anchor
                                                                                     E01
X01   PREVENT warns for verified same-PID, same-purpose, overlapping-period request  E01
                                                                                     E01 E08
X02   PREVENT clear for unrelated period or document class                           E01
                                                                                     E02
X03   Disconnected required source causes UNKNOWN not CLEAR                          E02
                                                                                     E02 E09
X04   PREVENT advice does not block legitimate official record updates               E03
                                                                                     E03 E06
X05   Declined and info-requested SYNC states preserve timeline and ownership        E04
                                                                                     E04
X06   Two simultaneous ACK updates cannot overwrite one another                      E05
                                                                                     E06
X07   Coordination receipt reconstructs final tasks and countersigned notices        E06
                                                                                     E07
X08   Knowledge graph refuses inferred transitive A-C edge                           E07 E08
                                                                                     E08
X09   Graph omits restricted nodes/edges for wrong role

X10   Multilingual matching shows references and counter-signals

X11   Unrelated same institution remains a nonmatch across languages

X12   SLA pause and holiday boundary produce correct versioned clock

X13   Field grant expires and blocks files, search, graph and exports

X14   Opaque alert response contains no protected names/narrative

X15   Attention Radar flags only attributable work items, not guilt

X16   Missing source degrades attention completeness visibly

X17   Source conflict remains visible after a reconciled projection change

Project specification | 23 October 2026 | Synthetic-data reference design                                                     Page 46
NEXUS-IC | AICTE PS 26264                                                                                   MASTER SOLUTION

Test           Verifiable behavior                                                                          Feature anchor
                                                                                                            E09
X18            Impact run repeated with same fixture hash yields same deterministic events                  E09
                                                                                                            E10
X19            Impact percent matches trace-based denominator; no action-found=avoided shortcut             E01 E02 E03 E09 E10
                                                                                                            E06 E10
X20            Role-scoped command centre supports keyboard and 200% zoom

X21            One browser journey spans PREVENT->SYNC->graph->impact without blank/error screens

X22            Permission checks for API, realtime push and exports remain consistent

Proposed measurable gates (tune with mentors, not official SIH cutoffs)

Gate                           Minimum completion proof                                                     Blocking failure
Functionality                  All R01-R55 mapped to working screen/API or clearly disclosed gap            Silent missing mandatory field / fake
                                                                                                            UI state
Privacy                        No restricted narrative or node in negative-role API/download/export/socket  Any cross-bureau content leak
Identity                       No false authoritative institution merge in locked negative tests            Same-name cross-PID merge
PREVENT                        All known positive/hard-negative rules plus UNKNOWN pass on fixtures         Automatic arbitrary case/action block
SYNC                           Ack/lead/task/receipt persist across role switch and reload                  Unowned alert or silent reassignment
Data trust                     Idempotent imports and source-conflict preservation work                     Missing feed displayed as zero
Graph                          Visible evidence ref per relationship; nontransitive matching                Unsupported or forbidden edge
Impact                         Seed, definitions, event trace and denominators shipped together             Fabricated savings or misleading
                                                                                                            percentages
Accessibility                  Keyboard, focus, labels and 200% zoom on core and added journeys             Critical task unavailable without
                                                                                                            mouse

20. Unified delivery roadmap and project definition of done

The ten improvements enrich the complete target system, but should be delivered behind functional gates. This is the only
canonical consolidated roadmap and takes precedence over any older blueprint. All milestones and demo tasks are owned here;
there is no competing schedule.

Release stage                  Integrated feature coverage                                                  Strict completion evidence
S0 - foundation                Repo and seed, React JSX, Express, MongoDB, authentication, basic UI state
S1 - mandatory PS              F01-F13, F29-F35, F39-F42, F45-F50, F55-F58                                  Reproducible install and reset; both demo
S2 - trust and relationships   F14-F19, F48-F49, E04 baseline, E08                                          roles
S3 - NEXUS SYNC 2.0            F20-F22, F25-F27, E02 and E06
S4 - NEXUS PREVENT             F23-F24, E01 + versioned action rules                                        All eight PS groups demonstrable; all
S5 - finalist differentiation  F05-F06, F28, F36-F38, F43-F44, E03/E04/E05/E07/E09/E10                      field/filter/status requirements

                                                                                                            Hard negatives, preserved snapshots,
                                                                                                            idempotent replay, case evidence

                                                                                                            Full cross-bureau handshake, field denial,
                                                                                                            owner task, receipt

                                                                                                            REVIEW/CLEAR/UNKNOWN with
                                                                                                            persisted reasons and no AI-only blocks

                                                                                                            Permission-filtered graph, radar, Impact
                                                                                                            Lab, accessible experience

Project specification | 23 October 2026 | Synthetic-data reference design                                   Page 47
NEXUS-IC | AICTE PS 26264                                                                                     MASTER SOLUTION

Release stage              Integrated feature coverage                                             Strict completion evidence
S6 - advanced optional     F51-F54, F59-F64, pilot adapters; F28 moved to measured P1 target
                                                                                                   Feature flags; language tests; institutional
S7 - release evidence      T01-T30 + X01-X22 + D01-D26, E2E demo, diagrams, screenshots, known     approvals
                           limitations
                                                                                                   No release with critical privacy, wrong
                                                                                                   identity or false result

Six-minute finals demonstration - improved integrated version

Clock                   Live system action                                                         Judge takeaway
00:00-00:35             RB role opens scoped dashboard and shows missing-source indicator          Not merely a generic public grievance form
00:35-01:10             Institution 360 + graph show distinct RB and PGRC cases                    One verified institution; source cases remain
                                                                                                   separate
01:10-01:50             Explain differently phrased cross-bureau candidate and one rejected false  Evidence + contradictions, not opaque similarity
01:50-02:40             positive
02:40-03:45                                                                                        Proactive prevention before duplicate execution
03:45-04:30             Draft document request; PREVENT returns REVIEW with underlying active
                        action                                                                     Actionable, privacy-safe, persistent coordination
                                                                                                   Real accountability and least-privilege
                        Request SYNC; switch PGRC role, accept and name lead with assigned task    enforcement
                                                                                                   Management insight with trusted numbers
                        Complete task, show receipt, negative-role evidence denial                 Proof-oriented value, no invented savings

04:30-05:20             Open attention queue, SLA reason and reconciled data source view
05:20-06:00             Run Impact Lab paired scenario, show raw counts and repeatable reset

Final explicit scope and exclusions

· All 64 baseline feature IDs F01-F64 remain specified; every strategic improvement E01-E10 is integrated and linked to its baseline
dependencies.
· No Digital Twin is proposed or represented as built; NEXUS PREVENT is an explainable pre-action rules engine.
· No automatic case closure, guilt determination, unauthorized complainant-data sharing or statutory order generation.
· No claim of live AICTE databases, CPGRAMS write integration, government approval or demonstrated real-world savings.
· Optional multilingual ML and external connectors must remain correctly labelled until tested and authorized.
· Implementation is complete only when a test report references the exact code revision, environment, seed hash and observed pass/fail
for each promised feature.

Source and claim policy

The problem-statement requirements and initial solution lineage derive from the user-supplied PS 26264 and NEXUS-IC 8.0.
Official public context [4]-[6] informs government-friendly accessibility, grievance integration practices and privacy planning.
Features E01-E10 are original design proposals; none is asserted as current AICTE operation or a measured improvement.

21. Nine-gap remediation checklist and final release decision

All nine critique points are corrected at specification level in this edition. The following D-series tests are executable acceptance
requirements; none should be reported as PASS without actual code execution and archived evidence.

Test ID      Required acceptance evidence
D01          Seed DEMO-CASE-STANDARD-v1 from clean reset; scheduler computes dueAt receipt +14 calendar days
D02          Near-due alert appears within 72 hours and not before; clock frozen in test

Project specification | 23 October 2026 | Synthetic-data reference design                                     Page 48
NEXUS-IC | AICTE PS 26264                                                                                     MASTER SOLUTION

Test ID  Required acceptance evidence
D03      Overdue and escalation fire after respective thresholds; no duplicate notifications on retry
D04      Business-day calendar and approved pause add time; source event vs observed time retained
D05      Production source without approved SLA shows POLICY_NOT_CONFIGURED, never demo defaults
D06      Verified distinct Permanent IDs block authoritative identity merge regardless of description
D07      RB and PGRC differently phrased positive fixture produces transparent computed 93.75 score
D08      Same-ID unrelated fire-door and certificate cases stay below alert threshold
D09      Threshold 60-79 shows exact Potential Overlapping Cases ­ Coordination Required text
D10      NLP outage displays RULE-ONLY and documented fallback, never invented semantic precision
D11      Evidence cards expose 7 contributions, missing fields, counter-signals and version
D12      Reviewer cannot coordinate without reason; saved KEEP_SEPARATE suppresses repeat alert
D13      Exact banner is accessible on Dashboard/Institution/Review, role-sensitive and timestamped
D14      Competent Authority has dedicated /authority route and delegated approval inbox
D15      Authority approval enforces requester != approver; audit attributes decision
D16      Authority cannot bypass field-ABAC to read private narratives or attachments
D17      External email delivered to sink via outbox; retry and idempotency trace present
D18      Email and SMS templates contain no complaint narrative or complainant PII
D19      SMS provider flagged off in sandbox; simulator receives the same minimal message
D20      RB authorized officer can discover PGRC case existence from unified case catalog
D21      RB without grant cannot download PGRC private files or case narrative
D22      Authorized temporary grant enables only selected fields until expiry; cross-role counts do not leak
D23      Search / graph / exports apply identical scopes and UNKNOWN source state
D24      Six wireframe-specified screens navigable and accessible at 200% zoom
D25      Before/after scenarios reproduce with same seed and report only trace-proven avoided actions
D26      PDF has unique sequential numbered main headings and one canonical roadmap/test/demo

Implementation-ready file and folder outline (all JavaScript / JSX)

  nexus-ic/
   client/src/pages/{Dashboard,Institution,Case,Review,Prevent,Sync,Authority}.jsx
   client/src/pages/{KnowledgeGraph,Impact,Reports,DataHealth}.jsx
   client/src/components/{OverlapBanner,SourceCoverage,CaseTimeline}.jsx
   client/src/lib/api.js
   server/src/modules/{institutions,cases,matching,prevent,sync}/
   server/src/modules/{sla,notifications,authority,trust,impact}/
   server/src/policies/{catalogVisibility,fieldDisclosure}.js
   server/src/jobs/{slaAlerts,notificationOutbox,sourceSync}.js
   server/src/db/models/*.js
   server/src/seeds/{institutions,cases,roles,policies}.js
   tests/{api,matching,e2e,security,fixtures}/
   docs/{architecture,policy,modelCard,benchmark,knownLimitations}/

Project specification | 23 October 2026 | Synthetic-data reference design                                     Page 49
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

Reference implementation logic - JavaScript (illustrative, requires integration tests)

This is a precise JavaScript implementation sketch for the key relationship gate and scorer. In a real application the seven signal
values are produced by versioned extractors with source references and negative tests; this code is not a substitute for a running
server.

  // server/src/modules/matching/scorePair.js
  const WEIGHTS = Object.freeze({ issue:25, period:15, category:10,

   subject:15, remedy:10, entities:10, semantic:15 });
  function scorePair(a, b, signal) {

   if (a.verifiedPid && b.verifiedPid && a.verifiedPid !== b.verifiedPid)
     return { state:"IDENTITY_BLOCK", score:null, reasons:["DIFFERENT_PID"] };

   if (!a.verifiedPid || !b.verifiedPid || !a.campusResolved || !b.campusResolved)
     return { state:"IDENTITY_REVIEW", score:null, reasons:["UNVERIFIED_IDENTITY"] };

   const contributions = Object.fromEntries(Object.entries(WEIGHTS).map(([key, w]) => {
     const n = Number.isFinite(signal[key]) ? Math.max(0, Math.min(1, signal[key])) : 0;
     return [key, Math.round(w*n*100)/100];

   }));
   const score = Object.values(contributions).reduce((s,n)=>s+n,0);
   const independent = ["issue","period","category","subject","remedy","entities"]

     .filter(key => (signal[key] ?? 0) >= 0.5).length;
   const bucket = score >= 80 && independent >= 3 ? "HIGH_REVIEW"

     : score >= 60 ? "REVIEW" : score >= 40 ? "LOW" : "NO_ALERT";
   return { state:bucket, score, contributions,

     missing:Object.keys(WEIGHTS).filter(k => !Number.isFinite(signal[k])),
     ruleVersion:"DEMO-MATCH-v1", requiresHumanDecision:true };
  }

Reference demo SLA event logic

  // server/src/modules/sla/classify.js; calendar-day policy only
  function classifyDemoCase({receivedAt, now, status, policy}) {

   if (!policy || policy.approvedFor !== "SYNTHETIC_DEMO")
     return { state:"POLICY_NOT_CONFIGURED" };

   if (!receivedAt) return { state:"UNKNOWN_EVENT_TIME" };
   const dueAt = new Date(new Date(receivedAt).getTime()

     + policy.calendarDays * 86_400_000);
   const remainingMs = dueAt.getTime() - new Date(now).getTime();
   if (status === "DISPOSED") return { state:"CLOSED", dueAt };
   if (remainingMs < 0) return { state:"OVERDUE", dueAt };
   if (remainingMs <= policy.nearDueHours*3_600_000)

     return { state:"NEAR_DUE", dueAt };
   return { state:"ON_TRACK", dueAt };
  }
  const demoStandard = { id:"DEMO-CASE-STANDARD-v1",
   approvedFor:"SYNTHETIC_DEMO", calendarDays:14, nearDueHours:72 };
  // Business-day or paused clocks use the separately specified calendar engine.

   These snippets are implementation aids only; they do not cover approved pauses, holidays, PII-safe feature extraction or real government
   policies. Test the actual API, database events, outbound queue, calendar engine and role restrictions before release.

Final source-control and delivery gates

· Implement P0 items first; no P1/P2 feature is described as live until routed, persisted and tested. All 64 baseline IDs and 10
enhancements remain accounted for.

· The definitive acceptance suite is T01-T30, X01-X22 and D01-D26; run results, known failures, environments, seed hash and code
revision must accompany an actual delivery.

· Before a government pilot: validate official bureau access policies, legal basis and processing agreements, statutory SLA definitions,
official login integration, source API contracts, retention and transport permissions.

Project specification | 23 October 2026 | Synthetic-data reference design  Page 50
NEXUS-IC | AICTE PS 26264                                                  MASTER SOLUTION

· No Digital Twin. No TypeScript. No automatic case merges or source closures. No claims of real AICTE access or quantified savings
from fictional fixtures.

REFERENCES. Sources, assumptions and evidence boundary

[P] User-supplied PS 26264 text in this conversation - Primary requirements; not an externally validated legal interpretation.
[B] User-uploaded NEXUS-IC 8.0 Complete MERN Solution Document (22 October 2026) - Structural template and initial domain design; this
edition changes TypeScript to React JSX and removes Digital Twin.
[1] AICTE Public Grievance Redressal Cell - https://www.aicte-india.org/bureaus/grievance-redressal
[2] AICTE Centralized Support System - https://www.aicte.gov.in/centralized-support-system
[3] CPGRAMS public portal, DARPG - https://pgportal.gov.in/
[4] Guidelines for Indian Government Websites and Apps, GIGW 3.0 - https://guidelines.india.gov.in/guidelines/
[5] DARPG comprehensive public grievance guidelines, 23 August 2024 -
https://www.darpg.gov.in/sites/default/files/Comprehensive_guidelines_for_handling_the_Public_Grievances.pdf
[6] MeitY DPDP Rules, 2025 (check applicable enforcement stage and counsel) -
https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa

Project specification | 23 October 2026 | Synthetic-data reference design  Page 51
```
