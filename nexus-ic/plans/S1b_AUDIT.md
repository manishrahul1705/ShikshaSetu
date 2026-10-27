# S1b audit — 24 October 2026

Stage to audit: S1, restricted for implementation review to S1b's 100 IDs: F01–F13, F29–F35, N09–N15, N31, N52, N58, N64, N67, S02, S03, S10–S12, S21, R01–R55, U01–U04, U11–U13. The repository-wide non-DONE inventory below is intentionally broader, as AUDIT.md requires.

This is an audit, not a repair. No application, test, checklist, configuration, plan or prior report was edited. Only this report was authored. The explicitly requested test command regenerated the normal three test-results JSON outputs. No git commands, dependency installation, source modification or persistent audit probe data were used.

Read AGENTS.md, RULES.md, PARALLEL_PLAN.md, prompts/AUDIT.md, prompts/S1b_ANTIGRAVITY_LOCAL_MASTER_PROMPT.md, prompts/S1b_institutions_intake.md, plans/S1b.md, SPEC, ADDITIONS, identity/README, S1b implementation and tests, and relevant S0 integration code. The local master prompt ends after its non-negotiable rules; the explicit 100-ID ownership list is in prompts/S1b_institutions_intake.md:5–8. The requested page list also appears in plans/S1b.md:155–164. Missing source text was not reconstructed. References below are repository-relative file:line citations, not proposed edits made during this audit.

## Test execution and trace-check

Ran `$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; npm test` successfully against local MongoDB. No fallback to older evidence was needed. Server: 81 passed, 0 failed, 0 skipped, 8 test files. Client: 22 passed, 0 failed, 0 skipped, 4 test files. Merged: **103 passed, 0 failed, 0 skipped**, exit 0, `test-results/results.json` regenerated on 2026-10-24 at 14:46:21 UTC / 20:16:21 IST. React Router emitted future-flag warnings, not test failures. S1b contributes 13 registry/institution tests, 14 intake/case/document tests and 4 UI tests. Passing titles are evidence of what those tests assert, not proof that the full specification is implemented.

`node scripts/trace-check.js` ran before tests and again after tests; both returned exit 0. Full final output:

```text
FEATURES.md: 349 rows, expected 349
  TODO            72
  IN-PROGRESS     3
  DONE            52
  GAP             0
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3

No violations.
```

## Requested checks: OK or MISSING

### 1. Required pages

| Page | Result | File and line / evidence |
|---|---|---|
| `/institutions/lookup` | **MISSING** | `client/src/routes/s1b.jsx:10–44` registers no lookup page; `institutions/:id` at line 12 would interpret `lookup` as a PID parameter, not render a lookup screen. The form's embedded PID input is not this page. |
| `/institutions/:id` | **OK — registered** | `client/src/routes/s1b.jsx:12–23`; implementation `client/src/pages/institutions/Institution360.jsx:6–46`. Security/completeness defects below remain. |
| `/review/identity` | **MISSING** | No route in `client/src/routes/s1b.jsx:10–44`, no IdentityReview page or persistent review queue in `server/src/modules/institutions/`; `institutionService.js:20–56` only returns a string. |
| `/grievances/new` | **OK — registered; operational flow MISSING** | `client/src/routes/s1b.jsx:26–28`; `GrievanceSubmit.jsx:45` calls nonexistent `/api/v1/identity/my-reporter`. Actual S1a endpoint is `server/src/modules/identity/routes.js:50–53`, `/identity/me`. The UI therefore fails its verification check even for a verified user and renders the gate at `GrievanceSubmit.jsx:264–292`. API-only N13 tests do not catch this. |
| `/my/cases` | **MISSING** | `client/src/routes/s1b.jsx:10–44`; no MyCases component or own-case list endpoint. `caseRoutes.js:17–35` only retrieves a single case. |
| `/admin/master/institutions` | **MISSING** | `client/src/routes/s1b.jsx:10–44`: no route with this path or any matching `system_admin` role. |
| `/admin/master/categories` | **MISSING** | Same route array; no category master page or management API, only a static config and GET at `intakeRoutes.js:12–18`. |
| `/admin/master/regions` | **MISSING** | Same route array; region reclassification on Institution 360 is not this administration page. |

All three actual master-data destinations are missing. S1a correctly keeps its placeholder and N79 IN-PROGRESS; its mock-route test fixtures do not supply real S1b pages. S1a discovery is at `client/src/pages/admin/Admin.jsx:5,19`. Six of the eight requested pages are missing, and the grievance page's mounted flow is broken.

### 2. `/track/:caseId` ownership

**OK as an early tracking stub; reported ownership overlap, not an automatic failure.** S1b does claim this route at `client/src/routes/s1b.jsx:31–42` and mounts its API at `server/src/routes.js:34`. `client/src/pages/cases/TrackCase.jsx:15–39,71–158` fetches and renders basic case status/classification; it has no feedback, appeal, receipt or full history implementation. SPEC:319,424 and ADDITIONS:30 place the fuller tracking journey with S5. Keep ownership explicit for S5; do not count this stub as completed S5 functionality. Current API scoping defects are judged separately below.

### 3. S1a integration contract

- **OK:** submission calls `isVerified` and `getReporterId` at `cases/caseService.js:104–120`, with no fabricated RP fallback and no S1b identity_vault reads. Intake tests obtain verified/unverified accounts through S1a seed/helpers at `server/tests/s1b-intake-cases.test.js:10–11,30–37`.
- **MISSING:** no S1b call/import of `setRevealScopeResolver`. The setter exists at `server/src/modules/vault/service.js:13`, but search of all server source finds no S1b registration. Case-access helper exists at `server/src/middleware/rbac.js:23`; bureau/region reveal integration remains fail-closed rather than implemented. Contract: `identity/README.md:15`.
- **MISSING:** no call to `recordFraudSignal(reporterId, 'burst_submissions', ...)` in S1b, no intake burst threshold/window in `intake/config.js:1–96`, and no counting path in `caseService.js:91–224`. The plan's five-in-ten-minutes proposal is not implemented policy. Do not turn that proposal into an official threshold. Add explicitly DEMO configuration and record the signal after accepting the triggering submission; never auto-reject because of a signal.
- **MISSING:** S1b never imports or calls `toOfficerView`; `caseService.js:6` imports only verification/reporter lookup. `institutionService.js:288` returns raw case records; `abac.js:150–151` returns raw documents for authority/supervisor/auditor/system_admin. These violate the required allowlist boundary even though the normal bureau/regional tracking policy removes `userId` (`abac.js:56–79,141–147`).

### 4. Cases store `userId` next to `reporterId`

**MISSING — pseudonym-only contract is violated.** Required User ObjectId reference at `cases/Case.js:37–42`; explicitly persisted at `caseService.js:187`. Ownership checks currently depend on this extra field (`middleware/rbac.js:34–38`, `institutionService.js:289–291`), but it is not necessary: resolve the signed-in user's reporterId through S1a's public helper and compare only that string. PARALLEL_PLAN's S1a↔S1b contract and `identity/README.md:7` require only reporterId on cases.

Actual response exposure:

- **Officers:** regional officers receive raw `userId` through Institution 360 (`institutionService.js:284–288`); supervisor and competent_authority also receive it there. The tracking API strips it for bureau/regional roles but returns it for supervisor/competent_authority/auditor/system_admin through `abac.js:150–151`. This is a persistent account join key, not itself a real name, but it breaks the privacy separation contract.
- **Institution admins:** tracking allowlist removes `userId` (`abac.js:34–54,120–129`), and Institution 360 builds a reduced object (`institutionService.js:274–283`). No direct userId return to this role was found. Their institution scoping is nevertheless unsafe, below.
- **Exports:** no S1b CSV/PDF/export endpoint exists, so no current export disclosure was observed. Do not claim exports are safe on the strength of an unused serializer; raw records and the admin fallback would be unsafe to reuse.

Read-only in-memory probes, without DB writes, confirmed that authority `applyFieldPolicy` retains both `userId` and `narrative`, and that Institution 360 returns those fields for regional/authority fixtures. No probe changed files or persisted data.

### 5. Priority belongs to S2

**MISSING — S1b actively sets priority.** `Case.js:57–60` defines normal/high/urgent with default normal; `caseService.js:100,197` accepts and persists it; `intakeRoutes.js:72,88` forwards a client-provided priority unchanged. A verified caller can therefore choose urgent before S2/N19 policy exists. The client displays this value at `TrackCase.jsx:88–90`. This is more than a dormant schema field. S1b does correctly initialize `status: 'SUBMITTED'`, `routingDecisionId: null` and `owningBureau: null` (`caseService.js:199–201`); no automatic closure or later ownership change was found.

### 6. DEMO reference tables

**OK:** region rows carry `version: 'DEMO-REGIONS-v1', synthetic: true` (`institutions/Region.js:62`); category config carries `DEMO-CATEGORIES-v1`, DEMO and synthetic labels (`intake/config.js:18–21`). N48 synthetic institution generation is reused (`registry/RegistrySimulator.js:1,20`).

**MISSING:** neither table is refused in APP_MODE=production. `intakeRoutes.js:16` returns the DEMO list unconditionally; region seeding/use/reclassification has no production check (`Region.js:25–63`, `institutionService.js:150–179,314–317`). No “replace with AICTE official list” label exists in those table definitions or the rendered reference panels. Categories are a code constant rather than an administrable versioned reference collection. The Region collection is seeded but not consulted when deriving imported profile regions; `getInstitutionByPid` copies the generator's region (`institutionService.js:80–91`). An in-memory production-mode probe still read DEMO-CATEGORIES-v1. Source requirement: local master prompt's non-negotiable DEMO-table rule and SPEC:157,303.

### 7. N67 original text and outside services

**OK for the storage code path and no outside service:** the form sends the original `narrative` (`GrievanceSubmit.jsx:190–195,224–230`); `caseService.js:194` stores that same string without normalization; model `Case.js:54` has no trim/setter. A model-only probe preserved UTF-8 bytes including leading/trailing whitespace, CRLF, tabs and Hindi/Bengali/Tamil text. Hashing uses `narrative.trim()` (`caseService.js:146`), but that does not modify the stored string. Detection is local (`intake/languageDetector.js:34–90`); no external translation/language network call was found.

**MISSING proof and full language behavior:** `[A-N67]` at `server/tests/s1b-intake-cases.test.js:323–341` only invokes detect on Hindi/Tamil/English strings, and never submits/reloads a multilingual narrative or compares persisted bytes. Arabic-script scheduled languages return und; Devanagari Marathi is labelled hi (`languageDetector.js:16,64–65`); no chosen-language input exists in `GrievanceSubmit.jsx:27–28,190–195,224–230`. S1b must provide honest language selection/fallback rather than equate script with language. Officer allowlists omit narrative (`abac.js:56–79`), so the required language tag alongside readable complaint text is not implemented consistently. ADDITIONS:33 requires all scheduled-language input, original unchanged and a language tag for officers.

### 8. N52 / S10 / S11 / S12 / S21 documents

| Control | Result | Evidence |
|---|---|---|
| Encrypted original and scrubbed payloads | **OK** | `documentService.js:15–29,35–56,94–117`: mandatory independent DOCS_KEY, AES-256-GCM, random IVs, auth tags; both hashes retained. |
| Server-proxied downloads; no storage key/path response | **OK in reviewed routes** | `documentRoutes.js:43–51,122–131`: metadata allowlist and streamed bytes; no actual encryption key or storage path in response. Document ID and hashes are not storage keys. No export route was found. |
| `canAccessCase` on each linked download | **OK call site, MISSING end-to-end scoping** | `documentRoutes.js:79–95` loads the current case and invokes the helper, but the helper's missing-institution grant and the linkage gaps below defeat the intended scope. Unlinked drafts use a separate uploader/global-admin rule (`97–102`), not case authorization. |
| IDOR returns 404 and is audited | **MISSING for documents** | Foreign linked document returns 403 at `documentRoutes.js:94` without an audit event; unlinked foreign denial does the same at line 101. Missing linked case is audited at `82–89` but returns 403 at line 90. Missing document returns 404 at 74–75 without denial audit. Tests explicitly expect 403 at `s1b-intake-cases.test.js:414,418–419`, so green tests preserve the wrong contract. Case IDOR itself is correctly 404/audited at `caseService.js:244–260` and tested at lines 471–504. |
| Draft upload association and attachment authorization | **MISSING** | Form uploads without caseId (`GrievanceSubmit.jsx:140–144`). Submit trusts arbitrary `documentIds` (`intakeRoutes.js:71,87`, `caseService.js:99,203`) with no ownership/existence/count checks and never updates `Document.caseId`. Uploaded evidence remains unlinked, so a routed officer cannot read it through the associated case. Conversely upload accepts an arbitrary caseId (`documentRoutes.js:27,40`; `documentService.js:70,101`) without checking case access before writing. |
| N52 metadata removal | **MISSING for supported PDF variants and evidence preservation** | PDF scrubber is regex-only (`metadataScrubber.js:100–124`): `/Author <hex>` survives, nested/escaped values and compressed metadata/history are not handled, and deletions shift PDF offsets without rebuilding xref/stream lengths. In-memory probes confirmed a hex Author survives with stripped=false, and a shortened PDF retains the old startxref value. JPEG/PNG known metadata chunks are removed, and original bytes are separately sealed; the existing N52 test at `s1b-intake-cases.test.js:307–320` checks only a short synthetic JPEG buffer, not officer download, GPS content, PNG or real PDF validity. |
| S12 upload validation | **MISSING portions** | `config.js:88–95` checks only caller-supplied MIME label and upper size; no file signature check, empty file check or max-files enforcement. Scanner returns error on empty buffer (`MalwareScanSimulator.js:19–20`) but upload rejects only infected (`documentService.js:82–87`) and writes status clean at line 113. EICAR-prefix simulation is honestly named, but scanner errors must fail closed. `[S12]` at test lines 460–468 checks only scanner responses, not size boundaries or count. |

Filename privacy also fails: `documentService.js:83` passes caller-controlled originalName under `filename` to the safe logger; logger protects `name`, not `filename` (`config/logger.js:11–19,29–35`). `documentService.js:127` and `documentRoutes.js:118` place originalName in audit meta; `documentRoutes.js:126` reveals it in download filenames to officers/institution admins. A name embedded in a filename can survive metadata scrubbing and reach logs/officer responses. This is a concrete unsanitized input path, not a claim that any real user's data was present in this synthetic run.

### 9. FEATURES.md evidence

**OK mechanically:** S1b has 23 DONE, 2 IN-PROGRESS and 75 BLOCKED-SOURCE rows, totaling 100. Every DONE row has existing Built in paths and passing correctly tagged test results, including A-Nxx for additions. Both IN-PROGRESS rows give reasons: N15 web-only, later channels in S6 (`FEATURES.md:123`); U12 immutability now, routing/transfer/appeal rechecks in S3/S5 (`FEATURES.md:310`). The 75 blocked F/R rows remain blocked with empty Built in fields. Source text is still absent; a passing hint test does not unblock those IDs.

**MISSING substantive completion:** the DONE labels overstate the behaviors below. Trace-check checks paths/tags/status, not whether tests exercise all sentences of the source. Checklist rows were not changed by this audit. The old `plans/S1b_REPORT.md:1–6` is also stale: it claims 16 DONE repair rows and an N79-only red run, whereas current N15/U12 are IN-PROGRESS and the current full run is green.

## Specification comparison and additional findings

### Institution identity: SPEC section 3, four hard rules and twelve touchpoints

1. **PID authoritative/exact lookup: implemented** at `institutionService.js:63–75`, with no fuzzy search. However lookup with both pid and icid ignores supplied pid because `institutionRoutes.js:27–33` takes the icid branch first; it does not call resolveIdentity and can silently return a different PID.
2. **ICID lookup only through PID: basic implementation exists** at `institutionService.js:126–136`. The schema invents an unsupported mandatory `IIC-` plus eight-character format (`InstitutionIdentifier.js:18`; service line 127). SPEC does not define that official format; distinguish synthetic examples from production validation.
3. **Conflicts/ambiguous campus go to review: missing workflow.** `resolveIdentity` returns IDENTITY_REVIEW but is not called by submit/lookup to create a queue entry; ambiguous campus flags are returned without a review action or gate. `[U03]` only compares a helper return string (`registry test:113–115`); `[F02]` only asserts ambiguous=true (`registry test:318–319`). No IdentityReviewQueue model, authorized decisions or page exists.
4. **Missing ICID: API uses exact “not available”** at `institutionService.js:117`. UI mapping fallback says “No secondary ICIDs mapped” (`Institution360.jsx:155`), not the specified phrase; the `[U04]` test at registry lines 118–142 never creates a case, despite its title.

Touchpoints 1/2: registry/API exists but district, approval as-of source date and full fresh aliases/campuses are missing; simulator projection (`RegistrySimulator.js:65–74`) drops those fields, Institution has no district (`Institution.js:17–42`), and UI omits them (`GrievanceSubmit.jsx:500–530`). Touchpoint 3: mapping block exists but UI never renders mappedPid (`Institution360.jsx:139–152`), while approvalDate is fabricated from local createdAt (`institutionService.js:310`). Touchpoint 4: ICID API search exists, global search UI absent. Touchpoint 5: PID/ICID snapshots exist (`caseService.js:132–142,189–191`). Touchpoints 6,9,10 belong to later S4/S6/S5 integrations: helper exists but matching/import quarantine/report export behavior must remain unclaimed. Touchpoint 7: runtime model uses collection **institutionidentifiers**, not specified **institution_identifiers** (`InstitutionIdentifier.js:39`); no institutionId field, no Institution.icid field, pid indexed but not unique (`identifier schema:21–25`). This was confirmed by model introspection without DB writes. Touchpoint 8: ICID GET exists; adapter contract integration is future scope. Touchpoint 11: auto-fetch writes institutions and identifier mappings with no attributed audit (`institutionService.js:80–106`). Touchpoint 12: U01–U04 tags pass, but tests omit queue creation, both-identifiers API conflict and actual no-ICID case submission.

### Institution 360 / RBAC / field ABAC: SPEC 6.3, 6.4, 12.3, S02, S03

**P1 — inconsistent authorization exposes cross-institution case metadata and private fields.** `getInstitution360` duplicates permissions rather than calling canAccessCase/applyFieldPolicy (`institutionService.js:259–298`). Every institution_admin receives redacted entries for any requested PID regardless of user.institutionPid (`274–283`); canAccessCase itself returns true for any routed institution when user.institutionPid is absent (`rbac.js:66–70`). Region-matching 360 paths bypass unrouted-case restrictions and return raw records (`284–288`), and supervisory roles bypass field ABAC (`abac.js:150–151`). A read-only fixture with a mismatching institution_admin PID still received case metadata. Same-bureau officers fall into the final restricted branch instead of receiving their authorized cases (`institutionService.js:265–297`). Regional list filtering applies only when a region is set (`institutionRoutes.js:45–47`) and direct PID/ICID lookups bypass that filter. Other Stakeholder roles are missing from submission, download-original, complainant ownership and route guards (`intakeRoutes.js:29,61`; `rbac.js:34`; `documentService.js:151`; `s1b.jsx:28`) despite SPEC Appendix W's complainant role.

**P1 — invented 30-day overdue policy.** `institutionService.js:226–237` marks SUBMITTED cases as overdue after a hard-coded 30 days, outside RuleBook and outside DEMO intake config. SPEC 6.4 permits attention indicators with reasons, not invented SLA periods; SPEC 11 requires policy-controlled, versioned timelines. No actual rule/feed produces this threshold. Use UNKNOWN/POLICY_NOT_CONFIGURED until the owner supplies policy.

**P2 — incomplete profile/history UI.** No actual bureau-action history exists or UNKNOWN explanation replaces it; aliases have no verification provenance; approvalDate uses local creation time. No “REGION-WISE CLASSIFICATION” map or six coloured chips required by SPEC Appendix V:573; the reclassification select does not meet that requirement. Unknown attendance feed is explicitly UNKNOWN (`institutionService.js:251–256`), so it is not misrepresented as zero, but this invented biometric-feed tile is not a substitute for required bureau actions or source data.

### Grievance/case creation: SPEC 7.1–7.3, Appendix V/W

**P1 — form unreachable for verified users** due to wrong identity endpoint (above). Guided field labels, PID lookup, preview/edit and uploads are coded, but the server only checks truthiness of required fields (`intakeRoutes.js:34–35,75–76`); arbitrary category/subcategory, non-string narrative and whitespace-only narrative can pass route validation or yield 500. No server validation against an approved category table exists. No confirmation of the user details required by SPEC 7.2:177 is rendered in the preview (`GrievanceSubmit.jsx:358–421`), although draft response contains user information (`caseService.js:68–71`).

**P2 — duplicate checks are not atomic.** `caseService.js:146–157` checks then inserts without a unique reporterId+institutionPid+narrativeHash index (`Case.js:83–90` only indexes externalRefs). Concurrent identical submissions can both pass the pre-check. External-ref lookup at `caseService.js:163–166` lacks $elemMatch, so a source from one entry and ref from another can falsely collide. Numeric year is hard-coded to 2026 (`caseService.js:16,181`) rather than derived at creation; do not claim future-year correctness. Master ID counter uses atomic increment; current document/query guards reject ordinary Master ID changes. U12 appropriately remains IN-PROGRESS for actual routing/transfer/appeal tests.

**P2 — incomplete labels/journey.** N64 context/default language works without browser storage (`i18n/index.js:28–59`), but many actual complainant strings remain English (`GrievanceSubmit.jsx:178,181,333,347,383,392,460`; `TrackCase.jsx:44,59,65,89,128,141,153,155`). Categories/subcategories are English-only. `[A-N64]` renders a test-only LanguageTestComponent rather than actual pages (`client/tests/s1b-intake-ui.test.jsx:8–19,62–100`). N15 correctly stays IN-PROGRESS; the specified channel tiles are absent and later channels must not be faked. N58 immediate hiding/replacement works (`QuickExitButton.jsx:18–22`), but its default neutral destination is an AICTE portal; confirm the intended neutral destination rather than claim a stronger safety guarantee.

## Forbidden-pattern review (AUDIT.md step 5)

- **OK:** no application .ts/.tsx implementation, Digital Twin, localStorage/sessionStorage access in client/src, active skipped/only/todo tests or commented-out test declarations were found. Comments saying “never a score” are not score implementations.
- **OK:** no automatic closure, fraud-based grievance rejection or post-submission ownership transfer was found. Duplicate-registration rejection and verified-user gating are source-required checks, not automatic judgment of merits. Initial SUBMITTED/null routing/null bureau are explicit.
- **OK:** no computed institution risk/compliance/guilt score found. The operational indicator still fails the policy-source requirement because of its 30-day cutoff.
- **MISSING:** caller-controlled filename goes to logger/audit/download header (`documentService.js:83,127`, `documentRoutes.js:118,126`); arbitrary reclassification reason is recorded unfiltered (`institutionService.js:178`). Caller-controlled category/subCategory/languageTag are also placed in audit without enum/type validation (`caseService.js:216–218`). These strings can carry identity or complaint text; no runtime sanitization is supplied by audit.record (its comment at `audit/audit.js:10–11` explicitly makes callers responsible). No notification/export module currently sends S1b narratives.
- **MISSING:** browser console.error bypasses the designated safe logger (`GrievanceSubmit.jsx:53,71`); current messages are generic and no concrete narrative payload was observed in those two calls. Keep the distinction from the demonstrable filename path.
- **MISSING:** hard-coded 30-day overdue threshold (`institutionService.js:228,237`) outside RuleBook. Upload constants 5 MiB/five files are explicitly DEMO in `intake/config.js:8–15`, not presented as sourced AICTE policy; five-file limit is unused. Burst config is entirely missing. The plan's five-in-ten-minutes threshold was not implemented.
- **OK / limited:** missing registry feed emits UNKNOWN+reason on the registry API (`registryRoutes.js:32–37`); UNKNOWN attendance is explicit. **MISSING:** the form discards the registry reason and substitutes “institution not found” (`GrievanceSubmit.jsx:102–103`), and categories load failures silently leave an empty array (`63–72`). Neither is a truthful unavailable-feed experience. No missing numeric feed rendered as numeric zero was found in S1b.

## Source catalogue coverage (AUDIT.md step 6)

All defined feature/control/acceptance IDs in SPEC and ADDITIONS have a FEATURES.md row. One referenced but undefined ID is **S34** (`docs/SPEC.md:353,374`), explicitly called out by SPEC itself: security IDs stop at S30. Report this source defect; do not invent a row or renumber anything. Blocked Part B content, C/G source details and N36–N45 remain source-pending; source cross-references do not authorize fabrication. No other missing defined-ID row was found.

## Detailed DONE evidence and repository-wide non-DONE inventory

The following generated tables use the fresh merged results, the current checklist and the reviewed source. “Passing” below denotes the archived test assertion only; the specification findings above still apply.


| ID / checklist line | Built in paths checked | Fresh tagged proof | Sentence-level comparison result |
|---|---|---|---|
| N09 / FEATURES.md:117 | server/src/modules/institutions/InstitutionIdentifier.js, server/src/modules/institutions/institutionService.js, server/src/modules/institutions/institutionRoutes.js | server/tests/s1b-registry-institutions.test.js:144 [N09] passed | SPEC 3: basic exact PID and ICID lookup exists; conflict API ignores PID, no review queue/audit, collection/fields differ; touchpoint-by-touchpoint review above. |
| N10 / FEATURES.md:118 | server/src/modules/registry/RegistrySimulator.js, server/src/modules/registry/registryRoutes.js, client/src/pages/intake/GrievanceSubmit.jsx | server/tests/s1b-registry-institutions.test.js:172 [N10] passed | SPEC 6.1: simulator/API and offline UNKNOWN pass; actual form gate broken, profile incomplete, UI hides unavailable reason, lookup page missing. |
| N11 / FEATURES.md:119 | server/src/modules/institutions/Region.js, server/src/modules/institutions/institutionRoutes.js, client/src/pages/institutions/Institution360.jsx | server/tests/s1b-registry-institutions.test.js:190 [N11] passed | SPEC 6.3 / Appendix V: six names and reasoned reclassification exist; production gating, official-list replacement label, map/chips and admin page missing. |
| N12 / FEATURES.md:120 | server/src/modules/institutions/institutionService.js, client/src/pages/institutions/Institution360.jsx | server/tests/s1b-registry-institutions.test.js:230 [N12] passed | SPEC 6.4: opaque counterpart/restricted notice exists; scope/ABAC bypass, no bureau actions, invented overdue threshold and incomplete profile prevent completion. |
| N13 / FEATURES.md:121 | server/src/modules/cases/caseService.js, server/src/modules/intake/intakeRoutes.js | server/tests/s1b-intake-cases.test.js:186 [N13] passed | SPEC 7.1,7.2: API preview and verified gate exist; real UI uses nonexistent identity endpoint; validation and user confirmation incomplete. |
| N14 / FEATURES.md:122 | server/src/modules/cases/Case.js, server/src/modules/cases/caseService.js | server/tests/s1b-intake-cases.test.js:231 [N14] passed | SPEC 7.2: atomic counter and external references exist; duplicate race, cross-element external-ref match and hard-coded year gaps. |
| N31 / FEATURES.md:139 | server/src/modules/documents/documentService.js | server/tests/s1b-intake-cases.test.js:279 [N31] passed | SPEC 14 document storage: original/scrubbed GCM encryption and separate key implemented; attachment authorization, scanner-error and metadata gaps remain. |
| N52 / FEATURES.md:164 | server/src/modules/intake/metadataScrubber.js | server/tests/s1b-intake-cases.test.js:307 [A-N52] passed | ADDITIONS N52: original sealed; partial JPEG/PNG stripping; PDF author/history variants and file validity not secured or tested end to end. |
| N58 / FEATURES.md:168 | client/src/components/QuickExitButton.jsx | client/tests/s1b-intake-ui.test.jsx:34 [A-N58] passed | ADDITIONS N58: synchronous hiding plus replacement navigation implemented and tested; sensitive-category page integration is blocked by wrong verification URL. |
| N64 / FEATURES.md:174 | client/src/i18n/index.js | client/tests/s1b-intake-ui.test.jsx:62 [A-N64] passed; client/tests/s1b-intake-ui.test.jsx:87 [A-N64] passed; client/tests/s1b-intake-ui.test.jsx:94 [A-N64] passed | ADDITIONS N64: context state, browser default and translated sample keys pass; actual complainant pages retain many English strings. |
| N67 / FEATURES.md:177 | server/src/modules/intake/languageDetector.js | server/tests/s1b-intake-cases.test.js:323 [A-N67] passed | ADDITIONS N67: original string storage and local detection implemented; persistence-byte proof, language selection/coverage and consistent officer text/tag display missing. |
| S02 / FEATURES.md:205 | server/src/middleware/rbac.js | server/tests/s1b-registry-institutions.test.js:430 [S02] passed | SPEC 13/12.3: tracking scopes bureau/region; missing institution scope grants access and Institution 360 bypasses common authorization. |
| S03 / FEATURES.md:206 | server/src/middleware/abac.js | server/tests/s1b-intake-cases.test.js:343 [S03] passed | SPEC 13: some read allowlists work; authority/raw 360 bypass, no complete write/search/export/file policy integration. |
| S10 / FEATURES.md:213 | server/src/modules/documents/documentRoutes.js | server/tests/s1b-intake-cases.test.js:366 [S10] passed | SPEC 13: linked downloads call case helper; draft linkage and helper gaps leave end-to-end authorization incomplete. |
| S11 / FEATURES.md:214 | server/src/modules/documents/documentRoutes.js | server/tests/s1b-intake-cases.test.js:422 [S11] passed | SPEC 13: server streams bytes and reviewed success responses contain no raw storage path/key; IDOR and filename findings are separate controls. |
| S12 / FEATURES.md:215 | server/src/modules/intake/config.js, server/src/modules/intake/MalwareScanSimulator.js | server/tests/s1b-intake-cases.test.js:460 [S12] passed | SPEC 13/7.1: MIME-label and upper size checks exist; content signature, zero length, scan errors, max-count and boundary-test proof missing. |
| S21 / FEATURES.md:224 | server/src/modules/cases/caseService.js | server/tests/s1b-intake-cases.test.js:471 [S21] passed | SPEC 13/12.3: foreign case returns audited 404; foreign document returns unaudited 403 and institution scopes bypassed elsewhere. |
| U01 / FEATURES.md:299 | server/src/modules/registry/registryRoutes.js, server/src/modules/institutions/institutionRoutes.js | server/tests/s1b-registry-institutions.test.js:27 [U01] passed | SPEC 16: PID and available ICID assertions pass; test profile lacks district/source as-of completeness required by N10. |
| U02 / FEATURES.md:300 | server/src/modules/institutions/institutionRoutes.js, server/src/modules/institutions/institutionService.js | server/tests/s1b-registry-institutions.test.js:65 [U02] passed | SPEC 16: simple ICID-to-PID resolution passes; both-identifiers mismatch through actual API is untested and ignored. |
| U03 / FEATURES.md:301 | server/src/modules/institutions/institutionService.js | server/tests/s1b-registry-institutions.test.js:101 [U03] passed | SPEC 16: helper returns IDENTITY_REVIEW; no actual persisted review workflow is exercised or implemented. |
| U04 / FEATURES.md:302 | server/src/modules/registry/registryRoutes.js, server/src/modules/institutions/institutionService.js | server/tests/s1b-registry-institutions.test.js:118 [U04] passed | SPEC 16: missing ICID API and helper assertions pass; test never submits a case, so second clause is not proven. |
| U11 / FEATURES.md:309 | server/src/modules/intake/intakeRoutes.js, server/src/modules/documents/documentRoutes.js | server/tests/s1b-intake-cases.test.js:52 [U11] passed | SPEC 16: API draft validation and invalid upload cases pass; no actual UI preview/edit journey test and incomplete validation. |
| U13 / FEATURES.md:311 | server/src/modules/cases/caseService.js | server/tests/s1b-intake-cases.test.js:129 [U13] passed | SPEC 16: sequential duplicate and external-ref preservation pass; concurrent duplicates/cross-entry reference collision untested. |

### Every repository ID not DONE, grouped by current status

These are checklist states, not approval of each item. Source-blocked reasons are preserved; a stage assignment alone is not a completed implementation. No checklist row was edited.

#### TODO (72)

- N16 (FEATURES.md:124, S4): No completion reason recorded; PREVENT Stage 1: intake similarity check is assigned to S4.
- N17 (FEATURES.md:125, S4): X01-X04 text is in 23 Oct PDF; rules C1-C5 too
- N18 (FEATURES.md:126, S2): No completion reason recorded; NEXUS ROUTE is assigned to S2.
- N19 (FEATURES.md:127, S2): No completion reason recorded; Risk and priority analysis is assigned to S2.
- N20 (FEATURES.md:128, S3): No completion reason recorded; NEXUS TRACE extended is assigned to S3.
- N21 (FEATURES.md:129, S3): No completion reason recorded; SYNC 2.0 notes, communication log, conflict prevention is assigned to S3.
- N22 (FEATURES.md:130, S5): No completion reason recorded; NEXUS PROOF closure gate is assigned to S5.
- N23 (FEATURES.md:131, S5): No completion reason recorded; Complainant feedback is assigned to S5.
- N24 (FEATURES.md:132, S5): No completion reason recorded; NEXUS RESCUE is assigned to S5.
- N25 (FEATURES.md:133, S5): No completion reason recorded; Appeal and review is assigned to S5.
- N26 (FEATURES.md:134, S5): No completion reason recorded; NEXUS IMPACT extended, downloadable reports is assigned to S5.
- N27 (FEATURES.md:135, S2): No completion reason recorded; NEXUS RULEBOOK is assigned to S2.
- N28 (FEATURES.md:136, S2): No completion reason recorded; True and transparent complainant status is assigned to S2.
- N29 (FEATURES.md:137, S5): No completion reason recorded; Complainant workspace is assigned to S5.
- N30 (FEATURES.md:138, S5): No completion reason recorded; Institution admin scoped view is assigned to S5.
- N34 (FEATURES.md:142, S7): stage chosen by Claude (not in roadmap 18)
- N35 (FEATURES.md:143, S5): No completion reason recorded; Minimal status notices by email and SMS to complainants is assigned to S5.
- N46 (FEATURES.md:159, S6): No completion reason recorded; Judge Demo Mode is assigned to S6.
- N47 (FEATURES.md:160, S6): No completion reason recorded; Click any number to see its cases is assigned to S6.
- N50 (FEATURES.md:162, S6): No completion reason recorded; Overlap timeline view is assigned to S6.
- N51 (FEATURES.md:163, S5): No completion reason recorded; Retaliation Watch is assigned to S5.
- N54 (FEATURES.md:165, S3): No completion reason recorded; Insider-access alerts is assigned to S3.
- N55 (FEATURES.md:166, S5): No completion reason recorded; Leak-trace watermark on exports is assigned to S5.
- N57 (FEATURES.md:167, S6): No completion reason recorded; Daily integrity fingerprint is assigned to S6.
- N59 (FEATURES.md:169, S4): No completion reason recorded; Silent co-signing is assigned to S4.
- N60 (FEATURES.md:170, S3): No completion reason recorded; Absence-aware ownership is assigned to S3.
- N61 (FEATURES.md:171, S6): No completion reason recorded; Cross-institution pattern alert is assigned to S6.
- N62 (FEATURES.md:172, S5): No completion reason recorded; Redaction helper is assigned to S5.
- N63 (FEATURES.md:173, S5): No completion reason recorded; Case receipt with QR is assigned to S5.
- N65 (FEATURES.md:175, S2): No completion reason recorded; RuleBook what-if preview is assigned to S2.
- N70 (FEATURES.md:188, S3): priority not stated in source
- N71 (FEATURES.md:189, S5): priority not stated in source
- N72 (FEATURES.md:190, S3): priority not stated in source
- N73 (FEATURES.md:191, S2): priority not stated in source
- N74 (FEATURES.md:192, S3): priority not stated in source
- N75 (FEATURES.md:193, S3): priority not stated in source
- N76 (FEATURES.md:194, S5): priority not stated in source
- N77 (FEATURES.md:195, S5): priority not stated in source
- N78 (FEATURES.md:196, S2): priority not stated in source
- N80 (FEATURES.md:198, S5): priority not stated in source
- S08 (FEATURES.md:211, S7): stage chosen by Claude (security controls are not in roadmap 18)
- S13 (FEATURES.md:216, S7): stage chosen by Claude (security controls are not in roadmap 18); 'S34' is as written in the doc (no S34 exists) - flagged, not changed
- S17 (FEATURES.md:220, S3): stage chosen by Claude (security controls are not in roadmap 18)
- S18 (FEATURES.md:221, S3): stage chosen by Claude (security controls are not in roadmap 18)
- S19 (FEATURES.md:222, S5): stage chosen by Claude (security controls are not in roadmap 18)
- S20 (FEATURES.md:223, S2): stage chosen by Claude (security controls are not in roadmap 18)
- S22 (FEATURES.md:225, S5): stage chosen by Claude (security controls are not in roadmap 18)
- S23 (FEATURES.md:226, S4): stage chosen by Claude (security controls are not in roadmap 18)
- S24 (FEATURES.md:227, S3): stage chosen by Claude (security controls are not in roadmap 18)
- S25 (FEATURES.md:228, S2): stage chosen by Claude (security controls are not in roadmap 18)
- S27 (FEATURES.md:230, S5): stage chosen by Claude (security controls are not in roadmap 18)
- S29 (FEATURES.md:232, S2): stage chosen by Claude (security controls are not in roadmap 18)
- S30 (FEATURES.md:233, S7): stage chosen by Claude (security controls are not in roadmap 18)
- U14 (FEATURES.md:312, S4): No completion reason recorded; Similarity alert explains why, lets the user proceed, shows no third-party data is assigned to S4.
- U15 (FEATURES.md:313, S6): U15 is not listed in roadmap 18; placed with email intake (N15, P1)
- U16 (FEATURES.md:314, S2): No completion reason recorded; Routing returns primary, secondary and reason; ambiguous goes to manual review is assigned to S2.
- U17 (FEATURES.md:315, S2): No completion reason recorded; Route override requires a reason and is audited is assigned to S2.
- U18 (FEATURES.md:316, S2): No completion reason recorded; Sensitive category is flagged, human-confirmed, and restricted is assigned to S2.
- U19 (FEATURES.md:317, S2): No completion reason recorded; Priority change alters the clock via a RuleBook version, never retroactively is assigned to S2.
- U20 (FEATURES.md:318, S3): No completion reason recorded; Transfer needs acknowledgement, escalates after the window, owner always visible is assigned to S3.
- U21 (FEATURES.md:319, S3): No completion reason recorded; Rejected transfer returns to the sender's queue with its reason is assigned to S3.
- U22 (FEATURES.md:320, S3): No completion reason recorded; A transferred case never reverts to Registered is assigned to S3.
- U23 (FEATURES.md:321, S3): No completion reason recorded; Internal notes are invisible to the complainant is assigned to S3.
- U24 (FEATURES.md:322, S5): No completion reason recorded; Closure is blocked until the gate passes is assigned to S5.
- U25 (FEATURES.md:323, S5): No completion reason recorded; Closure approver differs from proposer is assigned to S5.
- U26 (FEATURES.md:324, S5): No completion reason recorded; Feedback is stored and does not change status is assigned to S5.
- U27 (FEATURES.md:325, S5): No completion reason recorded; RESCUE fires on three transfers or a stall, once per case (deduplicated) is assigned to S5.
- U28 (FEATURES.md:326, S5): No completion reason recorded; Appeal adds events, leaves the original intact, uses a different reviewer is assigned to S5.
- U29 (FEATURES.md:327, S2): roadmap lists U29 under S2
- U30 (FEATURES.md:328, S5): No completion reason recorded; IMPACT report downloads with denominator and synthetic label; recommendations cite rows is assigned to S5.
- U31 (FEATURES.md:329, S5): No completion reason recorded; Complainant sees only own cases; IDOR attempts are denied is assigned to S5.
- U32 (FEATURES.md:330, S5): No completion reason recorded; Institution admin sees no reporter identity is assigned to S5.

#### IN-PROGRESS (3)

- N15 (FEATURES.md:123, S1 web; S6 PWA, email, import): Web portal channel only; PWA, email and import remain S6 scope.
- N79 (FEATURES.md:197, S1): priority not stated in source. Tagged tests pass in test-results/results.json (103/103 overall), including actual route discovery and populated/empty mocked glob results. No eligible system_admin master-data routes currently exist in client/src/routes/s1b.jsx: institutions, categories and regions admin pages are all missing; N79 remains IN-PROGRESS. Rules: Managed in RuleBook. BackupSimulator is not a recoverable backup.
- U12 (FEATURES.md:310, S1): Proved immutable at schema and API levels; re-run in S3 and S5.

#### GAP (0)

None.

#### BLOCKED-SOURCE (217)

- F01 (FEATURES.md:25, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: AICTE Permanent Institute ID (PID): authoritative key, exact match only (SPEC 3, 6.2). Built from hint: exact match PID lookup only, never fuzzy-linked (server/src/modules/registry/RegistrySimulator.js, server/src/modules/institutions/institutionService.js; test [F01])
- F02 (FEATURES.md:26, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Campus hierarchy rules; ambiguous campuses go to review (SPEC 6.1, 6.2, T02). Built from hint: campus hierarchy rules, ambiguous campuses route to review (server/src/modules/institutions/Institution.js; test [F02])
- F03 (FEATURES.md:27, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Verified aliases shown separately (SPEC 6.1). Built from hint: verified aliases displayed separately (server/src/modules/institutions/Institution.js; test [F03])
- F04 (FEATURES.md:28, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Institution 360 (extended by N12, SPEC 6.4). Built from hint: single-window profile with attention indicators and restricted entries (client/src/pages/institutions/Institution360.jsx; test [F04])
- F05 (FEATURES.md:29, S1+S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F06 (FEATURES.md:30, S1+S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F07 (FEATURES.md:31, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F08 (FEATURES.md:32, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F09 (FEATURES.md:33, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Analytic status mapping PENDING / IN_PROCESS / DISPOSED (SPEC 9.1). 
- F10 (FEATURES.md:34, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Assignment (extended by N18, SPEC 2). 
- F11 (FEATURES.md:35, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Status (extended by N28, SPEC 2). 
- F12 (FEATURES.md:36, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Transfer (PDF 4.7; extended by N20). 
- F13 (FEATURES.md:37, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F14 (FEATURES.md:38, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F15 (FEATURES.md:39, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: CSV import preview, dry-run, idempotent commit (SPEC 7.3). 
- F16 (FEATURES.md:40, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Reopen; appeals are new events, original record untouched (SPEC 10.3). 
- F17 (FEATURES.md:41, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F18 (FEATURES.md:42, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F19 (FEATURES.md:43, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F20 (FEATURES.md:44, S3): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F21 (FEATURES.md:45, S3): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F22 (FEATURES.md:46, S3): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F23 (FEATURES.md:47, S4): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: PREVENT action conflicts (SPEC 2, 8.5). 
- F24 (FEATURES.md:48, S4): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: PREVENT action conflicts (SPEC 2, 8.5). 
- F25 (FEATURES.md:49, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F26 (FEATURES.md:50, S5): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Closure-related (SPEC 2: NEXUS PROOF partial F16, F26). stage chosen by Claude (not in roadmap 18)
- F27 (FEATURES.md:51, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F28 (FEATURES.md:52, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F29 (FEATURES.md:53, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F30 (FEATURES.md:54, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F31 (FEATURES.md:55, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F32 (FEATURES.md:56, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F33 (FEATURES.md:57, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F34 (FEATURES.md:58, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F35 (FEATURES.md:59, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F36 (FEATURES.md:60, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F37 (FEATURES.md:61, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F38 (FEATURES.md:62, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). 
- F39 (FEATURES.md:63, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: RuleBook partial (SPEC 2). stage chosen by Claude (not in roadmap 18)
- F40 (FEATURES.md:64, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F41 (FEATURES.md:65, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F42 (FEATURES.md:66, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F43 (FEATURES.md:67, S5): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Late-arriving feed never counts as officer delay (SPEC 10.2). stage chosen by Claude (not in roadmap 18)
- F44 (FEATURES.md:68, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F45 (FEATURES.md:69, S0): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Demo accounts; zero-trust block F45-F54 (SPEC 2, 5.2). stage chosen by Claude (not in roadmap 18); seeded 10 demo accounts across 9 roles, 2 bureaus, 1 region from F45 hint
- F46 (FEATURES.md:70, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). stage chosen by Claude (not in roadmap 18); zero-trust block F45-F54 (SPEC 2) S1a implements nearby SPEC 13 controls S04, S05, S06, S07, S14, S15, S26; Tagged S-control tests pass in test-results/results.json. No defining F-feature text invented.
- F47 (FEATURES.md:71, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). stage chosen by Claude (not in roadmap 18); zero-trust block F45-F54 (SPEC 2) S1a implements nearby SPEC 13 controls S04, S05, S06, S07, S14, S15, S26; Tagged S-control tests pass in test-results/results.json. No defining F-feature text invented.
- F48 (FEATURES.md:72, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Registry unavailable shows UNKNOWN with reason, never blank or zeros (SPEC 6.1). 
- F49 (FEATURES.md:73, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Import idempotent commit (SPEC 7.3). 
- F50 (FEATURES.md:74, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). stage chosen by Claude (not in roadmap 18); zero-trust block F45-F54 (SPEC 2) S1a implements nearby SPEC 13 controls S04, S05, S06, S07, S14, S15, S26; Tagged S-control tests pass in test-results/results.json. No defining F-feature text invented.
- F51 (FEATURES.md:75, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). stage chosen by Claude (not in roadmap 18); zero-trust block F45-F54 (SPEC 2) S1a implements nearby SPEC 13 controls S04, S05, S06, S07, S14, S15, S26; Tagged S-control tests pass in test-results/results.json. No defining F-feature text invented.
- F52 (FEATURES.md:76, S5): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Consent withdrawal and retention (SPEC 13 S26). stage chosen by Claude (not in roadmap 18)
- F53 (FEATURES.md:77, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). stage chosen by Claude (not in roadmap 18); zero-trust block F45-F54 (SPEC 2) S1a implements nearby SPEC 13 controls S04, S05, S06, S07, S14, S15, S26; Tagged S-control tests pass in test-results/results.json. No defining F-feature text invented.
- F54 (FEATURES.md:78, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). stage chosen by Claude (not in roadmap 18); zero-trust block F45-F54 (SPEC 2) S1a implements nearby SPEC 13 controls S04, S05, S06, S07, S14, S15, S26; Tagged S-control tests pass in test-results/results.json. No defining F-feature text invented.
- F55 (FEATURES.md:79, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F56 (FEATURES.md:80, S2): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). Known from Unified doc: Registry unavailable shows UNKNOWN, never zeros (SPEC 6.1). stage chosen by Claude (not in roadmap 18)
- F57 (FEATURES.md:81, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F58 (FEATURES.md:82, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F59 (FEATURES.md:83, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F60 (FEATURES.md:84, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F61 (FEATURES.md:85, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F62 (FEATURES.md:86, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F63 (FEATURES.md:87, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- F64 (FEATURES.md:88, SB): Defining source pending: Full text: 23 Oct PDF (SPEC Part B1). not in roadmap 18; phase SB (placed into a stage once the 23 Oct PDF arrives)
- E01 (FEATURES.md:94, S4): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). Known: Pre-action checker = PREVENT Stage 2 (SPEC 8.5). 
- E02 (FEATURES.md:95, S3): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). Known: SYNC state machine (SPEC 9.3). 
- E03 (FEATURES.md:96, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). 
- E04 (FEATURES.md:97, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). 
- E05 (FEATURES.md:98, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). Known: Related to RESCUE (SPEC 2). 
- E06 (FEATURES.md:99, S3): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). 
- E07 (FEATURES.md:100, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). Known: Attention indicators, no guilt score (SPEC 6.4). 
- E08 (FEATURES.md:101, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). 
- E09 (FEATURES.md:102, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). Known: IMPACT safeguards: synthetic label, numerator/denominator/scope, flagged != avoided, cite rows (SPEC 10.4). 
- E10 (FEATURES.md:103, S6): Defining source pending: Full text: 23 Oct PDF (SPEC Part B2). 
- N36 (FEATURES.md:144, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- N37 (FEATURES.md:145, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- N38 (FEATURES.md:146, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- N39 (FEATURES.md:147, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- N40 (FEATURES.md:148, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- N41 (FEATURES.md:149, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- N42 (FEATURES.md:150, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- N43 (FEATURES.md:151, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- N44 (FEATURES.md:152, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- N45 (FEATURES.md:153, SB): Defining source pending: RESERVED: feature from Manish's earlier chat; text not supplied. do not build or invent
- R01 (FEATURES.md:239, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R02 (FEATURES.md:240, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R03 (FEATURES.md:241, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R04 (FEATURES.md:242, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R05 (FEATURES.md:243, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R06 (FEATURES.md:244, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R07 (FEATURES.md:245, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R08 (FEATURES.md:246, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R09 (FEATURES.md:247, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R10 (FEATURES.md:248, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R11 (FEATURES.md:249, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R12 (FEATURES.md:250, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R13 (FEATURES.md:251, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R14 (FEATURES.md:252, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R15 (FEATURES.md:253, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R16 (FEATURES.md:254, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R17 (FEATURES.md:255, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R18 (FEATURES.md:256, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R19 (FEATURES.md:257, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R20 (FEATURES.md:258, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R21 (FEATURES.md:259, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R22 (FEATURES.md:260, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R23 (FEATURES.md:261, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R24 (FEATURES.md:262, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R25 (FEATURES.md:263, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R26 (FEATURES.md:264, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R27 (FEATURES.md:265, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R28 (FEATURES.md:266, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R29 (FEATURES.md:267, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R30 (FEATURES.md:268, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R31 (FEATURES.md:269, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R32 (FEATURES.md:270, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). Known: Global search; accepts ICID as key (SPEC 3). Built from hint: global search accepts ICID as key (server/src/modules/institutions/institutionRoutes.js; test [R32])
- R33 (FEATURES.md:271, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R34 (FEATURES.md:272, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R35 (FEATURES.md:273, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R36 (FEATURES.md:274, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R37 (FEATURES.md:275, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R38 (FEATURES.md:276, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R39 (FEATURES.md:277, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R40 (FEATURES.md:278, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R41 (FEATURES.md:279, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R42 (FEATURES.md:280, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R43 (FEATURES.md:281, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R44 (FEATURES.md:282, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R45 (FEATURES.md:283, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R46 (FEATURES.md:284, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R47 (FEATURES.md:285, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R48 (FEATURES.md:286, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R49 (FEATURES.md:287, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R50 (FEATURES.md:288, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). Known: Regional officers see only their delegated region (SPEC 6.3). Built from hint: regional officer scoped to delegated region (server/src/modules/institutions/institutionRoutes.js; test [R50])
- R51 (FEATURES.md:289, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R52 (FEATURES.md:290, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R53 (FEATURES.md:291, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R54 (FEATURES.md:292, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- R55 (FEATURES.md:293, S1): Defining source pending: Full text: 23 Oct PDF (SPEC Part B4). roadmap: R01-R55 demonstrable in S1
- T01 (FEATURES.md:336, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T02 (FEATURES.md:337, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T03 (FEATURES.md:338, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T04 (FEATURES.md:339, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T05 (FEATURES.md:340, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T06 (FEATURES.md:341, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T07 (FEATURES.md:342, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T08 (FEATURES.md:343, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T09 (FEATURES.md:344, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T10 (FEATURES.md:345, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T11 (FEATURES.md:346, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T12 (FEATURES.md:347, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T13 (FEATURES.md:348, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T14 (FEATURES.md:349, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T15 (FEATURES.md:350, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T16 (FEATURES.md:351, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T17 (FEATURES.md:352, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T18 (FEATURES.md:353, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T19 (FEATURES.md:354, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T20 (FEATURES.md:355, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T21 (FEATURES.md:356, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T22 (FEATURES.md:357, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T23 (FEATURES.md:358, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T24 (FEATURES.md:359, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T25 (FEATURES.md:360, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T26 (FEATURES.md:361, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T27 (FEATURES.md:362, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T28 (FEATURES.md:363, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T29 (FEATURES.md:364, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- T30 (FEATURES.md:365, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X01 (FEATURES.md:366, S4): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X02 (FEATURES.md:367, S4): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X03 (FEATURES.md:368, S4): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X04 (FEATURES.md:369, S4): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X05 (FEATURES.md:370, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X06 (FEATURES.md:371, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X07 (FEATURES.md:372, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X08 (FEATURES.md:373, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X09 (FEATURES.md:374, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X10 (FEATURES.md:375, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X11 (FEATURES.md:376, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X12 (FEATURES.md:377, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X13 (FEATURES.md:378, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X14 (FEATURES.md:379, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X15 (FEATURES.md:380, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X16 (FEATURES.md:381, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X17 (FEATURES.md:382, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X18 (FEATURES.md:383, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X19 (FEATURES.md:384, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X20 (FEATURES.md:385, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X21 (FEATURES.md:386, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- X22 (FEATURES.md:387, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D01 (FEATURES.md:388, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D02 (FEATURES.md:389, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D03 (FEATURES.md:390, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D04 (FEATURES.md:391, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D05 (FEATURES.md:392, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D06 (FEATURES.md:393, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D07 (FEATURES.md:394, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D08 (FEATURES.md:395, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D09 (FEATURES.md:396, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D10 (FEATURES.md:397, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D11 (FEATURES.md:398, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D12 (FEATURES.md:399, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D13 (FEATURES.md:400, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D14 (FEATURES.md:401, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D15 (FEATURES.md:402, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D16 (FEATURES.md:403, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D17 (FEATURES.md:404, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D18 (FEATURES.md:405, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D19 (FEATURES.md:406, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D20 (FEATURES.md:407, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D21 (FEATURES.md:408, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D22 (FEATURES.md:409, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D23 (FEATURES.md:410, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D24 (FEATURES.md:411, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D25 (FEATURES.md:412, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 
- D26 (FEATURES.md:413, S7): Defining source pending: Full text: 23 Oct PDF (SPEC Part B5). 

#### PLANNED-P2 (2)

- N32 (FEATURES.md:140, S6): stage chosen by Claude (not in roadmap 18); P2: build only the adapter interface / PWA note + doc, no real integration
- N33 (FEATURES.md:141, S6): stage chosen by Claude (not in roadmap 18); P2: build only the adapter interface / PWA note + doc, no real integration

#### NOT-ADOPTED (3)

- N49 (FEATURES.md:178, -): see ADDITIONS.md; do not build
- N53 (FEATURES.md:179, -): see ADDITIONS.md; do not build
- N56 (FEATURES.md:180, -): see ADDITIONS.md; do not build

## Audit limits

No browser click-through, adversarial persistence tests, pilot review, official-list verification or production deployment was performed. Additional probes were in-memory function/model invocations with synthetic fixtures, not new committed tests or a claim of live API exploit execution. The PDF was not separately rendered/reconciled in this audit; comparisons use the supplied faithful SPEC transcription, ADDITIONS and the explicit local prompt/contracts. The missing 23 October source and undefined S34 remain source issues. Green tests and clean trace-check do not supersede the concrete security and completeness findings.

**Safe to commit: NO** — verified UI submission is broken; authorization/identity boundaries, document IDOR/auditing, metadata scrubbing, production policy gating and required pages are incomplete despite 103 passing tests.

Numbered fixes for Antigravity (one line each; no fixes were applied):

1. client/src/pages/intake/GrievanceSubmit.jsx:45 — use S1a /identity/me and add a real verified-user form journey test in client/tests/s1b-intake-ui.test.jsx.
2. server/src/modules/institutions/institutionService.js:259 — use common case scope and field allowlists for every 360 result; prevent cross-institution/admin and raw regional/authority disclosures.
3. server/src/middleware/rbac.js:66 and server/src/middleware/abac.js:150 — fail closed on missing institution scope and remove unrestricted supervisory/authority serialization.
4. server/src/modules/cases/Case.js:37 and server/src/modules/cases/caseService.js:187 — remove the case userId join; resolve signed-in reporterId through S1a for ownership checks.
5. server/src/modules/documents/documentRoutes.js:79 — return audited 404 for foreign/orphan document denials and update server/tests/s1b-intake-cases.test.js:414 to assert the full contract.
6. server/src/modules/documents/documentRoutes.js:27 and server/src/modules/cases/caseService.js:203 — authorize upload case linkage, validate document ownership/count, and bind accepted draft uploads to their created case.
7. server/src/modules/intake/metadataScrubber.js:100 — replace unsafe PDF regex deletion with verified metadata/history removal that preserves valid PDFs and rejects unsupported unsafe inputs.
8. server/src/modules/documents/documentService.js:72 — validate actual content/type and empty files, fail closed on scanner errors, and test size/count/scan boundaries.
9. server/src/modules/documents/documentService.js:83 and server/src/modules/documents/documentRoutes.js:118 — remove user filenames from logs/audit and use non-identifying download names for officer/institution responses.
10. server/src/modules/intake/intakeRoutes.js:72 and server/src/modules/cases/Case.js:57 — remove client-controlled/default priority behavior from S1b and leave priority decisions to S2/N19.
11. server/src/modules/intake/config.js:18 and server/src/modules/institutions/Region.js:25 — gate DEMO tables in production, label replacement by AICTE lists, and use versioned administrable reference data.
12. server/src/modules/cases/caseService.js:91 — add explicitly DEMO burst configuration/counting and recordFraudSignal after the accepted threshold-crossing submission without automatic rejection.
13. server/src/modules/cases/caseRoutes.js:8 — register setRevealScopeResolver from S1b using live canAccessCase and S1a pseudonymous reporter helpers; test owning-office/counterpart denial.
14. server/src/modules/institutions/institutionRoutes.js:27 — validate simultaneous PID/ICID, persist conflict/ambiguous-campus review entries, and audit attributed identifier changes.
15. server/src/modules/institutions/InstitutionIdentifier.js:12 — align the collection/field contract and avoid treating the synthetic ICID example format as an official validation rule.
16. client/src/routes/s1b.jsx:10 — register the six missing lookup, identity-review, own-case and administrator master pages with correct roles and implementations in S1b-owned page folders.
17. server/src/modules/institutions/institutionService.js:228 — remove the invented 30-day overdue rule and show an honest unconfigured result until versioned RuleBook policy exists.
18. server/src/modules/registry/RegistrySimulator.js:65 and client/src/pages/institutions/Institution360.jsx:139 — complete registry district/as-of/campus/mapped-PID fields, bureau-action availability and region map/chips without inventing data.
19. server/src/modules/intake/intakeRoutes.js:34 — enforce narrative types/non-empty content and approved category/subcategory relationships; omit uncontrolled free text from audit metadata.
20. server/src/modules/cases/caseService.js:146 — make duplicate registration race-safe, match external-ref pairs with $elemMatch, and derive the creation year; add corresponding S1b tests.
21. server/src/modules/intake/languageDetector.js:16 and client/src/pages/intake/GrievanceSubmit.jsx:27 — support honest chosen-language/fallback behavior and add persisted UTF-8 round-trip tests for scheduled-language text.
22. client/src/pages/intake/GrievanceSubmit.jsx:333 and client/src/pages/cases/TrackCase.jsx:44 — complete Hindi/English strings on actual pages, translate category labels, preserve unavailable-feed reasons and test the real UI.
23. server/tests/s1b-registry-institutions.test.js:101 and server/tests/s1b-intake-cases.test.js:307 — replace insufficient title-only coverage with queue, actual no-ICID submission, officer download scrubbing, ABAC and production-gate assertions.
24. FEATURES.md:117–123,139,164,174,177,205–224,299–311 and plans/S1b_REPORT.md:1 — reconcile only S1b statuses/claims with remaining gaps and new full behavior tests; leave all BLOCKED-SOURCE rows blocked.
