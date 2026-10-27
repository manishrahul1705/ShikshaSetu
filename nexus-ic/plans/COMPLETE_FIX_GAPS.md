# COMPLETE-FIX GAP AUDIT (Part 1a & Part 1b)
**Date:** 26 October 2026  
**Lead Engineer / Product Designer:** Antigravity (Advanced Agentic Coding)  
**Workspace:** AWAAZ DASTAK (powered by NEXUS-IC)  
**Reference Sources:** `RULES.md`, `docs/SPEC.md`, `docs/ADDITIONS.md`, `docs/SOURCE_23OCT_FERTXD.md`, `FEATURES.md`, `prompts/`

---

## 1. Part 1a: Prompts Audit (Every Prompt in `prompts/`)

Every prompt in `prompts/` was audited against the codebase and test suite. Status is reported as **DONE**, **PARTIAL**, or **MISSING**.

| Prompt File | Core Requested Scope | Code Modules | Test Proof | Status | Notes |
|---|---|---|---|---|---|
| `S0_Foundation.md` / `S0_MASTER_PROMPT.md` / `S0_FIX_PROMPT.md` | Core server setup, MongoDB connection, security middleware, hash-chained audit log, models, user authentication, test setup. | `server/src/modules/audit/`, `server/src/modules/auth/`, `server/src/middleware/` | `audit.test.js`, `auth.test.js`, `authorize.test.js`, `logger.test.js` | **DONE** | Zero security regressions; S08 (real production encryption) and S13 (ongoing operational audit cadence) tracked as deployment GAPs per design. |
| `S1_Mandatory_PS_plus_front_half.md` | Mandatory PS capabilities, basic intake and core models. | `server/src/modules/intake/`, `server/src/modules/cases/` | `s1b-intake-cases.test.js` | **DONE** | Authoritative PID, snapshots, Master Case ID. |
| `S1a_identity.md` / `S1a_CODEX_MASTER_PROMPT.md` | Identity Vault, pseudonymous reporter IDs, student/faculty simulator, purpose-bound consent, local OTP sink, reveal workflow. | `server/src/modules/vault/`, `server/src/modules/identity/`, `server/src/modules/consent/` | `s1a-identity.test.js` | **DONE** | Complainant identity shielded behind RP-xxxx hashes. |
| `S1b_institutions_intake.md` / `S1b_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md` | Institution registry, 120 institutions, PID/ICID check, six regions, Institution 360, grievance filing form, file uploads, EXIF scrubber, receipt. | `server/src/modules/institutions/`, `server/src/modules/registry/`, `client/src/pages/intake/` | `s1b-registry-institutions.test.js`, `s1b-intake-cases.test.js` | **DONE** | All 120 fictional institutions loaded with valid ICID/PID mappings. |
| `S2_Trust_and_routing.md` / `S2_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md` | RuleBook governance, two-person approval workflow, versioning, explainable routing engine (NEXUS ROUTE), bureau queues, SLA engine. | `server/src/modules/rulebook/`, `server/src/modules/routing/`, `server/src/modules/priority/` | `s2-rulebook.test.js`, `s2-routing.test.js`, `s2-priority.test.js`, `s2-bureaus.test.js` | **DONE** | All routing decisions carry explainable reasons and rule versions. |
| `S3_SYNC_and_TRACE.md` / `S3_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md` | Cross-bureau coordination (NEXUS SYNC 2.0), zero-loss transfer protocol (NEXUS TRACE), absence-aware ownership handover, insider alerts, fieldwork. | `server/src/modules/sync/`, `server/src/modules/trace/`, `server/src/modules/absence/`, `server/src/modules/insider/` | `s3-sync.test.js`, `s3-trace.test.js`, `s3-insider-absence.test.js`, `s3-queries.test.js`, `s3-actions-fieldwork.test.js` | **DONE** | Accountability maintained; sender retains ownership until receiver accepts. |
| `S4_PREVENT.md` / `S4_CODEX_LOCAL_MASTER_PROMPT.md` | Seven-signal duplicate and conflict detection (NEXUS PREVENT), advisory pre-action conflict warning, matcher benchmark, overlap timeline, silent co-signing. | `server/src/modules/prevent/`, `client/src/pages/prevent/` | `s4-api.test.js`, `s4-matcher.test.js` | **DONE** | Pure advisory warnings; never auto-closes or auto-rejects. |
| `S5_Closure_and_recovery.md` | Cryptographic PROOF closure package, complainant feedback & appeals, retaliation watch, redaction helper, leak-trace watermark, receipt QR. | `server/src/modules/closure/`, `server/src/modules/appeals/`, `server/src/modules/feedback/`, `server/src/modules/additions/n51-retaliation-watch/`, `n55-watermark/`, `n63-receipt/` | `s5-closure.test.js`, `s5-feedback-appeals.test.js`, `s5-impact.test.js`, `s5-notices.test.js`, `s5-workspaces.test.js` | **DONE** | Two-officer separation on closure proposal vs approval. |
| `S6_Differentiators.md` / `S6a_channels.md` / `S6b_differentiators.md` | Channels (PWA, Web, Email, Bulk import, CPGRAMS adapter), daily integrity fingerprint (`/integrity`), quick exit, pattern alerts, bilingual i18n, what-if preview, Judge Demo mode. | `server/src/modules/channels/`, `server/src/modules/additions/n57-integrity/`, `client/src/additions/n46-judge-mode/`, `n58-quick-exit/`, `n61-patterns/`, `n64-i18n/`, `n65-whatif/` | `s6a-channels.test.js`, `s6a-integrity-benchmark.test.js`, `s6b-differentiators.test.js`, `s7-judge.test.js` | **DONE** | All channels and differentiators operational and verified. |
| `S7_Release_evidence.md` | Release evidence, judge script, negative role security tests, automated regression runs, rehearsal runner. | `e2e/`, `server/tests/s7-*.js` | `s7-release.test.js`, `s7-negative-roles.test.js`, `s7-release-fix.test.js` | **DONE** | Role negative checks pass with zero permission leak. |
| `FINAL_AUDIT.md` / `AUDIT.md` | End-to-end security audit, CSRF origin checks, session hardening, IDOR defenses, immutable audit log verification. | `server/src/middleware/authorize.js`, `server/src/modules/audit/` | `final-polish-registry.test.js`, `authorize.test.js` | **DONE** | Zero high/critical vulnerabilities; hash-chain intact. |
| `JURY91_CODEX_MASTER_PROMPT.md` | JURY-91 push: unified closed status vocabulary, CSRF origin enforcement, containment matcher signal, PILOT_PLAN, dependency audit. | `server/src/modules/prevent/signals.js`, `server/src/modules/closure/util.js` | `jury91-release.test.js` | **DONE** | Hard-case benchmark containment signal added. |
| `FINAL_POLISH_CODEX_MASTER_PROMPT.md` | 120-institution catalogue, bounded search, shared picker, Present story, Institution 360 trends, case journey explanation panel, QR image generation. | `client/src/components/InstitutionPicker.jsx`, `client/src/pages/cases/CaseJourney.jsx` | `final-polish-registry.test.js`, `ui-case-journey.test.js` | **DONE** | Clean presentation without internal development debug codes. |
| `GLOBAL_JURY_CODEX_MASTER_PROMPT.md` | 39-screen audit across 9 roles, DEMO-GLOBAL-APPEAL-v1 prototype rule, SLA clocks for open cases, performance profiling. | `client/src/pages/`, `e2e/page-audit.spec.js` | `global-jury-data.test.js`, `global-jury-contracts.test.js` | **PARTIAL** | Core data and contracts built; 3 slow pages (>3000ms) and incomplete 9-role browser pass left open (Part 1c). |
| `PS_FEATURES_CODEX_MASTER_PROMPT.md` | Problem statement features N81–N89: live conflict warning (N81), combined request (N82), document locker (N83), Today vs AWAAZ DASTAK replay (N84), coverage page (N85), student tracking (N86), monthly report (N87), institution redressal (N88), workload suggestions (N89). | `server/src/modules/additions/n81*` to `n89*`, `client/src/additions/n81*` to `n89*` | `additions-n81-integration.test.js`, `additions-n82-n83.test.js`, `additions-n86-n89.test.js`, `additions-n87-pdf.test.js` | **PARTIAL** | Implemented in code; test titles for N81, N84, N85 missing explicit `[A-Nxx]` prefix needed for trace-check; FEATURES.md left as IN-PROGRESS. |

---

## 2. Part 1b: Audit of the 217 BLOCKED-SOURCE Rows

With `docs/SOURCE_23OCT_FERTXD.md` now in the repository, each of the 217 rows previously marked `BLOCKED-SOURCE` was examined against its exact 23 October source definition.

### Summary of Decisions
- **F01–F64 (64 Baseline Features):**
  - **COVERED (56 rows):** Features already built in earlier phases (e.g., F01–F04 PID/Institution 360, F06 Attention indicators, F08 Vault, F09 Master Case ID, F10 Routing, F12 TRACE, F13 SYNC, F14 RuleBook, F15 PREVENT, F19 PROOF, F20 Appeals, F25–F30 Workspaces, F39–F44 SLA engine, F45–F64 Reporting & Security). Proved by existing tests (`[F01]`, `[F02]`, `[F03]`, `[F04]`, `[F15]`, `[F26]`, `[F45]`, `[F48]`, `[F49]`, `[F56]`, and matching module suites).
  - **BUILD (8 rows):** F16 (in-form conflict warning finalized under N81), F17 (document locker finalized under N83), F22 (combined institution request finalized under N82), F24 (student tracking stepper finalized under N93/N86), F31 (regional cell routing finalized under N92), F32 (institution lookup autocomplete finalized under N90), F35 (simulated ABC/APAAR verification finalized under N91), F47 (regional map display finalized under N94).
  - **OUT OF SCOPE (0 rows):** All 64 baseline features fall within the hackathon solution scope.
- **E01–E10 (10 Integrated Innovations):**
  - **COVERED (8 rows):**
    - E01 Action Conflict Prevention -> PREVENT (`s4-api.test.js`)
    - E02 Accountable Coordination -> SYNC (`s3-sync.test.js`)
    - E03 Institution Evidence Graph -> Graph (`graphService.js`, `InstitutionGraph.jsx`)
    - E04 Privacy Vault -> Vault (`s1a-identity.test.js`)
    - E05 Adaptive Policy Engine -> RuleBook (`s2-rulebook.test.js`)
    - E06 Zero-Loss Handover Protocol -> TRACE (`s3-trace.test.js`)
    - E07 Multi-Source Attention Indicators -> Institution 360 (`institutionService.js`) [Proved by `[E07]`]
    - E09 Executive Analytics -> IMPACT (`s5-impact.test.js`) [Proved by `[E09]`]
  - **BUILD (2 rows):**
    - E08 Cryptographic Closure Verification -> finalized with complete tamper-evident PROOF packet verification (`closureService.js`).
    - E10 Unified Multi-Channel Intake & Triage -> auto-fetch integration across all intake channels (N90).
  - **OUT OF SCOPE (0 rows).**
- **R01–R55 (55 Problem Statement Capabilities):**
  - In `SOURCE_23OCT_FERTXD.md` (lines 156–280), R01–R55 are the verbatim Problem Statement requirements mapped to planned features F01–F64.
  - **COVERED (52 rows):** Mapped to corresponding F features and verified by existing test suites (`[R32]` in `s1b-registry-institutions.test.js`, `[R50]` in `s5-impact.test.js`, etc.).
  - **BUILD (3 rows):** R01/R02 (auto-fetch lookup across all forms N90), R08 (simulated ABC/APAAR identity verification N91), R50 (regional routing & regional map N92/N94).
  - **OUT OF SCOPE (0 rows).**
- **T01–T30 (30 Correlation & Triage Test Scenarios):**
  - T01–T30 define exact positive and hard-negative test cases for institution matching, case linking, and triage (lines 2228–2300 of `SOURCE_23OCT_FERTXD.md`).
  - **COVERED (30 rows):** Quoted and implemented in `server/tests/s4-matcher.test.js`, `server/tests/s4-api.test.js`, and `server/tests/s7-release-fix.test.js`.
- **X01–X22 (22 Innovation Test Scenarios):**
  - X01–X22 define verifiable behaviors for PREVENT, SYNC, TRACE, and PROOF (lines 2305–2445 of `SOURCE_23OCT_FERTXD.md`).
  - **COVERED (22 rows):** Tested in `server/tests/s4-api.test.js`, `server/tests/s3-sync.test.js`, `server/tests/s3-trace.test.js`, and `server/tests/s5-closure.test.js`.
- **D01–D26 (26 Demo / SLA / Lifecycle Scenarios):**
  - D01–D05: SLA receipt-based clocks (14 days), near-due 72h boundaries. **COVERED** (tested by `[D01]`, `[D02]`, `[D03]`, `[D05]` in `s5-rescue.test.js` and `global-jury-contracts.test.js`).
  - D06–D26: Lifecycle, transfer, appeal, and presentation scenarios. **COVERED** across `s2-lifecycle.test.js`, `s3-trace.test.js`, `s5-feedback-appeals.test.js`, and `s7-judge.test.js`.
- **N36–N45 (10 Reserved Additions Rows):**
  - Per `docs/ADDITIONS.md` line 10: "N36–N45 are RESERVED (features from Manish's earlier chat; text not yet supplied). Do not build or invent anything for them."
  - **OUT OF SCOPE (10 rows):** Text was not supplied in `SOURCE_23OCT_FERTXD.md` or `SPEC.md`.

---

## 3. Part 1c: Pending Items from GLOBAL_JURY and PS_FEATURES

### 1. Fix the Three Slow Pages (> 3000 ms Content Deadline)
1. **Faculty `/institutions/:id` (observed: 3238 ms):**
   - *Root Cause:* In `server/src/modules/institutions/institutionService.js` (`getInstitution360`), `await getReporterId(user._id || user.id)` was being invoked inside a loop over `allCases`. In large test/showcase datasets, executing repeated sequential database queries inside the loop caused severe latency.
   - *Fix:* Resolve `getReporterId` once prior to the loop and perform memory-based comparison.
2. **Supervisor `/regional` (observed: 3407 ms):**
   - *Root Cause:* In `client/src/pages/regional/RegionalView.jsx`, `/api/v1/impact/summary` was called while simultaneously rendering `<OfficerWorkspace />` which loads the full case queue. In `impactService.js`, Tile 6 invoked unconstrained pairwise `listOverlaps(user)` across all cases in the database.
   - *Fix:* Optimize `computeImpactReport` to use cached overlap counts when valid, and index case lookups by region.
3. **Supervisor `/cases/:caseId` (observed: 2974 ms):**
   - *Root Cause:* In `server/src/modules/casejourney/journeyService.js`, the query `AuditEvent.find({ targetId: { $in: [c.masterCaseId, String(c._id)] } })` scanned the entire unindexed `audit_events` collection.
   - *Fix:* Add an index on `targetId` in `server/src/modules/audit/AuditEvent.js`: `auditEventSchema.index({ targetId: 1 })`.

### 2. Complete Nine-Role Page Audit
- Complete automated Playwright test run across all 9 roles (`student`, `faculty`, `institution_admin`, `bureau_officer`, `regional_officer`, `supervisor`, `competent_authority`, `auditor`, `system_admin`) at 1366×768 desktop and 390px mobile viewports.
- Confirm zero console errors, zero forbidden visible wording, no horizontal overflow, and load times under 3000 ms.

### 3. Transition N81–N89 from `IN-PROGRESS` to `DONE`
- Update test descriptions in `server/tests/additions-n81.test.js`, `server/tests/additions-n84.test.js`, and `server/tests/additions-n85.test.js` to include exact `[A-N81]`, `[A-N84]`, and `[A-N85]` identifiers.
- Update `FEATURES.md` to register `DONE` status, valid file paths, and passing tests for all N81–N89 additions.
