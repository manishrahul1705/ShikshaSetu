# COMPLETE-FIX Master Implementation Plan
**Date:** 26 October 2026  
**Workspace:** AWAAZ DASTAK (powered by NEXUS-IC)  
**Lead Engineer / Product Designer:** Antigravity (Advanced Agentic Coding)  
**Status:** Awaiting Product Owner / User Approval  
**Binding Rules:** `RULES.md`

---

## 1. Gap List Summary (Part 1a & 1b Audit)

An exhaustive, read-only audit of all files in `prompts/` and `docs/SOURCE_23OCT_FERTXD.md` was conducted and saved to `plans/COMPLETE_FIX_GAPS.md`:
1. **Prompts Audit (S0 through S7, JURY91, FINAL_POLISH):** All promised baseline and differentiator capabilities are built and proved with passing tests. Deployment requirements S08 (real production encryption) and S13 (regular operational audit cadence) remain tracked as deployment GAPs per design.
2. **GLOBAL_JURY and PS_FEATURES (Part 1c):**
   - Three pages currently exceed the 3000 ms content deadline in browser audits:
     - Faculty `/institutions/:id` (3238 ms) -> Root cause: `getReporterId` called sequentially inside a loop over all cases. Fix: pre-resolve `getReporterId` once before loop.
     - Supervisor `/regional` (3407 ms) -> Root cause: unconstrained `listOverlaps` calculation across all cases during `/impact/summary`. Fix: memoize/optimize overlap computation.
     - Supervisor `/cases/:caseId` (2974 ms) -> Root cause: unindexed `targetId` search on `AuditEvent`. Fix: add index `auditEventSchema.index({ targetId: 1 })`.
   - N81–N89 additions were built by Codex, but tests in `additions-n81.test.js`, `additions-n84.test.js`, and `additions-n85.test.js` missed the `[A-Nxx]` title prefix required by `scripts/trace-check.js`. Adding these prefixes and updating `FEATURES.md` flips all 9 rows to `DONE`.
3. **217 BLOCKED-SOURCE Rows:**
   - 56 F rows, 8 E rows, 52 R rows, 30 T rows, 22 X rows, and 26 D rows are **COVERED** by built features and existing tests.
   - 8 F rows (F16, F17, F22, F24, F31, F32, F35, F47), 2 E rows (E08, E10), and 3 R rows (R01, R08, R50) are **BUILT** in Part 2 under features N90–N94.
   - 10 N rows (N36–N45) are **OUT OF SCOPE** (reserved rows from earlier chats with no text supplied in 23 Oct source or SPEC).

---

## 2. Part 2 Features: Detailed Design, Files, and Tests (N90–N95)

### N90: College Name Auto-Fetch Everywhere
- **Problem & Design:** Users previously had to know or manually copy institution PIDs, or faced duplicate manual PID input fields on forms. We unify institution selection using an enhanced `InstitutionPicker` across:
  1. Grievance submission form (`/grievances/new`): Remove the redundant manual PID input box; add a subtle "enter PID instead" toggle link for power users.
  2. Institution lookup and registration (`/institutions/lookup`).
  3. NEXUS SYNC cross-bureau coordination (`/sync`).
  4. Global header quick-search.
  - Typing a college name, city, state, PID, or ICID performs a debounced search to `/api/v1/institutions/search` (bounded to 20 results, strict field allowlist: `pid`, `name`, `city`, `state`, `region`, `icid`, `type`).
  - Selecting an institution instantly populates: PID, ICID, ICID check status (`MATCH`, `NOT_AVAILABLE`, or `IDENTITY_REVIEW`), Region, State, District, and Type with no secondary button clicks.
- **Authoritative Rules:** PID is authoritative, ICID only corroborates; any PID/ICID conflict automatically triggers `IDENTITY_REVIEW`.
- **Files Modified/Created:**
  - `client/src/components/InstitutionPicker.jsx`
  - `client/src/pages/intake/GrievanceSubmit.jsx`
  - `client/src/pages/institutions/InstitutionLookup.jsx`
  - `client/src/pages/sync/SyncPage.jsx`
  - `client/src/components/Layout.jsx`
  - `server/src/modules/institutions/institutionRoutes.js`
  - `server/src/modules/institutions/institutionService.js`
- **Tests:**
  - `server/tests/additions-n90.test.js` titled `[A-N90] college name auto-fetch populates PID, ICID, region and verification status without manual entry`
  - Client component test `client/src/components/__tests__/InstitutionPicker.test.jsx`

---

### N91: ABC ID and APAAR ID Verification (Simulated)
- **Problem & Design:** Replace the fixture dropdown ("STUDENT-ACTIVE", etc.) on `/verify` (`Verify.jsx`) with realistic, validated form inputs:
  - **Students:** Real APAAR ID and/or ABC ID input, plus the institution selected via `InstitutionPicker`.
  - **Faculty:** Staff / Employee ID input, plus the institution selected via `InstitutionPicker`.
  - Validation enforced on both client and server.
  - Checks enrolment/employment status against `IdentitySimulator` registry.
  - Generates clear outcomes:
    - `VERIFIED`: Active enrolment/employment matching selected institution -> proceeds to consent & local OTP flow.
    - `NOT_ENROLLED`: ID not found in simulator registry.
    - `INACTIVE`: Enrolment or employment marked suspended/inactive.
    - `MISMATCH`: Student/faculty is enrolled at a different institution than selected.
    - `MANUAL_REVIEW`: Ambiguous records routed to Identity Verification Queue for human officer review.
  - Shows prominent visual banner: **"Simulated ABC / APAAR check"** (labeled simulated until AICTE grants production credentials).
  - Seed 20+ synthetic student and faculty IDs covering every outcome.
  - Store strictly encrypted pseudonymous vault records (`RP-xxxx`).
- **Files Modified/Created:**
  - `client/src/pages/trust/Verify.jsx`
  - `server/src/modules/identity/identityRoutes.js`
  - `server/src/modules/identity/identityService.js`
  - `server/src/modules/identity/IdentitySimulator.js`
  - `server/src/modules/vault/Vault.js`
- **Tests:**
  - `server/tests/additions-n91.test.js` titled `[A-N91] simulated ABC and APAAR verification validates format, detects mismatches, and gates OTP issuance`

---

### N92: ICID-Based Regional Routing to Regional Grievance Cell
- **Problem & Design:** Cases filed against institutions must automatically route to the corresponding AICTE Regional Grievance Cell while maintaining bureau collaboration:
  - On grievance registration, resolve institution ICID -> PID.
  - Fetch the authoritative AICTE region from the institution registry (`Northern`, `Western`, `Southern`, `Central`, `Eastern`, `North Eastern`).
  - Primary assigned unit: Regional Grievance Cell for that region (e.g. `Regional Grievance Cell (Northern)`).
  - Coordinating secondary bureau: Category-based Bureau (e.g. `Regulation Bureau` for fee disputes, `Public Grievance Redressal Cell` for administration).
  - Explainable Routing Decision recorded: RuleBook rule `DEMO-REGIONAL-ROUTE-v1` approved through the 2-person flow, storing reason `"Region Northern from PID 1-xxxx (ICID IIC-xxxx MATCH)"`.
  - Queues & Accounts: Seed a dedicated regional officer and Regional Grievance Cell queue for each of the 6 AICTE regions (`regional_northern`, `regional_western`, `regional_southern`, `regional_central`, `regional_eastern`, `regional_ne`).
  - Fallback logic: If ICID is unavailable, fallback to PID's region. If region is unknown or PID/ICID is in `IDENTITY_REVIEW`, route to human triage. Never guess a region.
- **Files Modified/Created:**
  - `server/src/modules/routing/routingService.js`
  - `server/src/modules/rulebook/seedRuleBook.js`
  - `server/src/modules/rulebook/RuleBook.js`
  - `server/src/modules/workspaces/workspaceService.js`
  - `server/src/modules/cases/intakeService.js`
  - `client/src/pages/workspace/CaseQueue.jsx`
- **Tests:**
  - `server/tests/additions-n92.test.js` titled `[A-N92] ICID regional routing forwards case to Regional Grievance Cell with explainable reason`

---

### N93: Realistic, Fast Status Updates
- **Problem & Design:** Complainants require a real-time, event-grounded milestone stepper without manual page reloads:
  - The stepper reflects real lifecycle state transitions and audit events:
    1. `Submitted` (State: `SUBMITTED`, event: `case.created`, actor: `Complainant`)
    2. `Verified and registered` (event: `identity.verified` / `case.registered`, office: `AICTE Registry`)
    3. `Forwarded to <Region> Regional Grievance Cell` (State: `Assigned`, event: `routing.decided`, office: `Routing Engine`)
    4. `Accepted by the cell` (event: `case.accepted` / `workspace.opened`, office: `<Region> Regional Grievance Cell`)
    5. `Under process` (State: `Under Process`, event: `case.processing`, office: `Regional Grievance Cell`)
    6. *Conditional:* `Transferred to <Bureau>` (displayed only if transfer event exists)
    7. *Conditional:* `Query raised to institution / reply received` (displayed only if N70/N82 query events exist)
    8. `Action taken` (displayed only when an officer action record exists, with action type and sanitized summary)
    9. `Resolution proposed` (State: `Resolution Proposed`, event: `closure.proposed`)
    10. `Closed` (State: `Closed`, event: `closure.approved` / `case.closed`)
  - Each milestone displays: exact date and time, accountable office and role (NEVER personal names).
  - Real-time updates: TanStack query refetch on window focus + short polling (every 4000ms while on tracking view).
  - Officer "Record action taken" capability: Add a prominent button and modal in the officer case journey view requiring action type (`NOTICE`, `INSTRUCTION`, `INSPECTION`, `OTHER`), short explanation note, and evidence reference.
- **Files Modified/Created:**
  - `client/src/pages/track/Track.jsx`
  - `client/src/pages/cases/CaseJourney.jsx`
  - `client/src/pages/lifecycle/ComplainantStatusCard.jsx`
  - `server/src/modules/track/trackService.js`
  - `server/src/modules/actions/actionService.js`
  - `server/src/modules/casejourney/journeyService.js`
- **Tests:**
  - `server/tests/additions-n93.test.js` titled `[A-N93] truthful status stepper reflects real recorded milestones and officer action taken`

---

### N94: India Map with the College's Region Marked
- **Problem & Design:** Visual geographic context for institution jurisdiction and national caseload distribution:
  - **Survey of India Compliance:** Self-contained SVG component representing all 6 AICTE regions with accurate official borders (proper depiction of Jammu & Kashmir, Ladakh, Arunachal Pradesh, Sikkim, and island territories).
  - **Zero Network / Zero External Packages:** Implemented as a pure, optimized React SVG component (`IndiaMap.jsx`). No map tile servers, no external API calls, completely bundled offline.
  - **Contexts of Use:**
    1. *Case Journey, Institution 360 & Complainant Track:* Highlights the institution's region and places a marker pin on its state.
    2. *Regional View & Command Centre Dashboard:* Choropleth map colouring each of the 6 regions by open-case density.
    3. *Drill-Down Interactivity:* Clicking any region navigates directly to the N47 case drill-down (`/impact/cases?row=region:${region}`) filtering cases for that exact jurisdiction.
- **Files Modified/Created:**
  - `client/src/components/IndiaMap.jsx`
  - `client/src/pages/cases/CaseJourney.jsx`
  - `client/src/pages/institutions/Institution360.jsx`
  - `client/src/pages/track/Track.jsx`
  - `client/src/pages/regional/RegionalView.jsx`
  - `client/src/pages/Dashboard.jsx`
- **Tests:**
  - `server/tests/additions-n94.test.js` titled `[A-N94] regional India map reflects jurisdiction boundaries, caseload counts, and drill-down links`
  - Client component test `client/src/components/__tests__/IndiaMap.test.jsx`

---

### N95: Saffron Across Every Page
- **Problem & Design:** Consistent, professional tricolour design identity using existing Tailwind saffron tokens:
  - Saffron accent stripe: 3px top border accent on every page header card.
  - Page eyebrow labels: `text-saffron-600 font-semibold uppercase tracking-wider text-xs`.
  - Primary call-to-action buttons: `bg-saffron-600 hover:bg-saffron-700 text-white font-medium shadow-sm transition-colors`.
  - Active sidebar navigation item: `border-l-4 border-saffron-600 bg-saffron-50 text-saffron-900 font-semibold`.
  - Focus rings: `focus:ring-2 focus:ring-saffron-500 focus:outline-none`.
  - Section underlines: `border-b-2 border-saffron-500`.
  - Color Palette Harmony: Navy/Slate base (`ink-*`) provides institutional gravitas, Green (`bharat-*`) indicates verified/success states, and Saffron (`saffron-*`) highlights active work, delivering an authentic tricolour government aesthetic.
  - Accessibility: Strict WCAG AA contrast ratio compliance (at least 4.5:1 for normal text, 3:1 for large headings) on every saffron surface.
- **Files Modified/Created:**
  - `client/tailwind.config.js`
  - `client/src/index.css`
  - `client/src/components/ui/PageKit.jsx`
  - `client/src/components/Layout.jsx`
  - Review pass across all 40 page views in `client/src/pages/` and `client/src/additions/`.
- **Tests:**
  - Client theme test `client/src/components/__tests__/SaffronTheme.test.jsx` titled `[A-N95] saffron design tokens applied consistently with WCAG AA contrast compliance`

---

## 3. Technical Specifications

### (c) ABC ID and APAAR ID Formats and Sources
- **APAAR ID (Automated Permanent Academic Account Registry):**
  - *Source:* Ministry of Education, Government of India (Public Standard: `apaar.education.gov.in`).
  - *Format:* 12-digit numeric identifier.
  - *Validation Regex:* `/^\d{12}$/` (optional hyphen display format: `/^\d{4}-?\d{4}-?\d{4}$/`).
- **ABC ID (Academic Bank of Credits ID):**
  - *Source:* Academic Bank of Credits Portal / DigiLocker (`abc.gov.in`).
  - *Format:* 12-digit numeric identifier (under NEP 2020, ABC ID is unified into APAAR).
  - *Validation Regex:* `/^\d{12}$/` (optional hyphen display format: `/^\d{4}-?\d{4}-?\d{4}$/`).
- **Faculty / Staff ID:**
  - *Source:* AICTE Faculty Portal and standard university payroll registers.
  - *Format:* Alphanumeric identifier, 3 to 20 characters.
  - *Validation Regex:* `/^[A-Za-z0-9\-]{3,20}$/`.

### (d) Regional Routing Rule and SPEC 8.1 Fit
- SPEC Section 6.3 establishes the 6 AICTE regions: `Northern`, `Western`, `Southern`, `Central`, `Eastern`, `North Eastern`.
- SPEC Section 8.1 and Appendix V mandate that Regional Offices serve as primary front-line hubs for field coordination, institution inspection, and regional dispute resolution.
- `DEMO-REGIONAL-ROUTE-v1` defines:
  - `ruleId`: `DEMO-REGIONAL-ROUTE-v1`
  - `status`: `approved`
  - `approvedFor`: `SYNTHETIC_DEMO`
  - Condition: Maps institution PID region to the corresponding `Regional Grievance Cell (<Region>)` as the primary owner.
  - Secondary owner: Category Bureau (`Regulation Bureau`, `PGRC`, etc.) for regulatory policy coordination.
  - Audit trail: Decision records explicit reason `"Region <Region> from PID <PID> (ICID <ICID> <STATUS>)"`.

### (e) India Map Approach & Dependencies
- **Proposed Approach:** Pure React SVG component (`IndiaMap.jsx`) using self-contained vector paths representing the 6 AICTE regional boundaries according to official Survey of India boundary guidelines.
- **Zero Package Downloads:** Requires **NO** new npm packages, **NO** downloads, **NO** external map tiles, and **NO** network requests.
- **Licence & Assets:** Hand-crafted SVG polygon vectors based on public-domain Survey of India boundary outlines, fully compatible with project license constraints.

### (f) Status Stepper Mapping Table

| Stored Lifecycle State (`SPEC 9.1`) | Triggering Recorded Event / Record | Complainant Stepper Display Label | Accountable Entity Displayed | Condition / Note |
|---|---|---|---|---|
| `SUBMITTED` | `case.created` | Submitted | Complainant | Always step 1 |
| `SUBMITTED` | `identity.verified` | Verified and registered | AICTE Central Registry | Verified via APAAR/ABC Simulator |
| `Assigned` | `routing.decided` | Forwarded to `<Region>` Regional Grievance Cell | RuleBook Routing Engine | Cites `DEMO-REGIONAL-ROUTE-v1` |
| `Assigned` / `Under Process` | `workspace.opened` / `case.accepted` | Accepted by the cell | `<Region>` Regional Grievance Cell | Regional Cell confirms ownership |
| `Under Process` | `case.processing` | Under process | Assigned Regional Officer | Investigation underway |
| `Transfer Requested` / `Transfer Accepted` | `transfer.requested` / `transfer.accepted` | Transferred to `<Bureau>` | Sending / Receiving Bureau | Shown ONLY if transfer occurs |
| `Under Process` | `query.issued` / `query.replied` | Query raised / reply received | Institutional Nodal Officer | Shown ONLY if N70/N82 queries exist |
| `Under Process` | `action.recorded` | Action taken | Assigned Regional Officer | Shown ONLY if officer action recorded |
| `Resolution Proposed` | `closure.proposed` | Resolution proposed | Regional Grievance Cell | Awaiting final review & feedback |
| `Closed` / `DISPOSED` | `closure.approved` / `case.closed` | Closed | AICTE Competent Authority | Cryptographic PROOF package sealed |

*(A transferred case never reverts to Submitted; each step shows timestamp, office, and role; never a person's name).*

### (g) Showcase Seed Changes (`awaaz_dastak_showcase`)
- Seed RuleBook rule `DEMO-REGIONAL-ROUTE-v1` (approved via 2-person workflow).
- Seed 6 regional officers (`regional_northern`, `regional_western`, `regional_southern`, `regional_central`, `regional_eastern`, `regional_ne`) and their Regional Grievance Cell queues.
- Seed 20+ synthetic student and faculty IDs in `IdentitySimulator` covering:
  - 10 `VERIFIED` (active students and faculty across various colleges).
  - 3 `NOT_ENROLLED` (IDs not in registry).
  - 3 `INACTIVE` (suspended/graduated students).
  - 2 `MISMATCH` (student ID enrolled at College A, selected College B).
  - 2 `MANUAL_REVIEW` (records flagged for officer verification).
- Seed realistic action records on showcase cases to exercise the "Action taken" status stepper.
- *Note:* The shared database `awaaz_dastak_demo` is untouched; only `awaaz_dastak_showcase` is updated via `npm run showcase:seed`.

---

## 4. Approvals Requested from Product Owner

Before executing Step 3, the following explicit approvals are submitted for your confirmation:
1. **Approval of this complete implementation plan (`plans/COMPLETE_FIX.md`).**
2. **Approval of the zero-dependency, pure SVG Survey of India-compliant map approach (N94)** (requires no new npm package or network downloads).
3. **Approval of the showcase seed additions** (rule `DEMO-REGIONAL-ROUTE-v1`, 6 regional officers, 20+ synthetic APAAR/ABC IDs).
4. **Approval of the Part 4 AI Model benchmark evaluation strategy:** Run the 5000-pair benchmark with the local model off vs on; if the local model does not improve paraphrase recall without dropping precision or if inference latency exceeds thresholds, keep the model OFF by default and document lexical/hybrid performance honestly in `docs/AI_METHODS.md`.

---

## 5. Open Questions
- None. All requirements, specifications, boundaries, and test criteria are unambiguous.

---
*STOP: Awaiting your explicit approval to proceed to Step 3 build.*
