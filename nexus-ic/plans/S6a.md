# S6a plan — 2026-10-25

Scope: S6a only, local folder, no git, copies, worktrees, dependency installation or new dependencies. Continue after writing this plan.

Prerequisites: rulebook/index.js, lifecycle/importEngine.js (validateImportBatch, dryRunImport, commitImport), audit/audit.js, prevent and identity/index.js exist. plans/S2_REPORT.md is absent; import-engine contract was read directly, alongside plans/S2.md and rulebook/README.md. Baseline must be freshly verified; earlier runs were red in S2 and are not treated as green.

| ID | Work | Own files | Tagged proof |
|---|---|---|---|
| N15 | Installable PWA without offline data; simulator email verified-only encrypted draft and portal confirmation with PreventPanel; CSV preview/dry-run/commit wrapper over S2 engine with verified reporter and PID/ICID quarantine | server/src/modules/channels/, client/src/pages/channels/, client/src/pwa/, client/public/, client/src/routes/s6a.jsx | [N15] all channels and privacy/authorization/idempotency tests |
| U15 | Unverified email stores no body/draft/case; verified email cannot bypass portal preview/confirmation | channels/ and s6a-channel tests | [U15] negative and positive integration paths |
| N32 | Adapter contract and AICTE/CPGRAMS Simulator implementations, snapshots/watermarks, no network; retain PLANNED-P2 | channels/adapters.js, README | [N32] simulator contract |
| N33 | PWA note, native Android/iOS remain PLANNED-P2 | pwa/ and channels documentation/UI | [N33] native scope note |
| N57 | Daily immutable fingerprint history, chain verification, read-only /integrity, only hashes/counts/dates; independent downloadable public proof, no blockchain claim | server/src/modules/additions/n57-integrity/, client/src/additions/n57-integrity/ | [A-N57] capture/replay/tamper/privacy tests |
| N48 | Reuse S0 generator for labelled synthetic matcher benchmark; ground truth independent of predictions; numerator/denominator/scope, confusion counts, UNKNOWN coverage, rule and fixture version | server/src/modules/benchmark/, client/src/pages/benchmark/ | [A-N48] reproducibility, honest counts and unavailable-policy behavior |

Do not change N37 (BLOCKED-SOURCE), N49 (NOT-ADOPTED), F15 or F49 (S2 BLOCKED-SOURCE). Never create missing F/E content.

Every other S6 open ID is skipped as requested, "owned by S3 (SYNC and TRACE)": F05, F06, F28, F36, F37, F38, E03, E04, E05, E07, E08, E09, E10, N46, N47, N50, N61. This wording records the phase prompt's exclusion; it grants no editing rights.

Security: only keyed sender hashes, no plaintext sender storage; authenticated verified account binds its synthetic mailbox; simulator-only inbox, no external mail. Draft bodies encrypted with Node crypto and never logged/audited/exported. Current verification and reporter ownership rechecked on every read/confirm. No tokens, case, identity or documents in service worker caches; only a fixed offline page. S0 safe logger only. Every new route authorize, every state change attributed audit. All case reads canAccessCase. Error responses use fixed codes.

Shared integration: re-read routes.js before append-only mount. Own route registry imports PWA bootstrap; manifest link and service-worker registration installed by owned bootstrap, avoiding edits to main.jsx/index.html/App.jsx or S1b. No other shared edits planned. If existing contracts cannot support a requirement safely, report the exact gap instead of editing another phase.

Validation: tests only with TEST_MONGODB_URI=mongodb://127.0.0.1:27017; npm test. Direct local access if needed. No concurrent test runners. Syntax-check changed plain JS; JSX through existing Vitest/Vite. Report unrelated phase failures without changing their code/tests. Trace S6, own rows only, DONE only with fresh tagged passes; N32/N33 stay PLANNED-P2. Final plans/S6a_REPORT.md includes all gaps, exact counts and steps.
FEATURES.md: 349 rows, expected 349
  TODO            67
  IN-PROGRESS     2
  DONE            58
  GAP             0
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3

Stage S6: 22 IDs not DONE
  F05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F06  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F28  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F36  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F37  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  F38  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B1)
  E03  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B2)
  E04  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B2)
  E05  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B2). Known: Related to RESCUE (SPEC 2)
  E07  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B2). Known: Attention indicators, no guilt score (SPEC 6.
  E08  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B2)
  E09  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B2). Known: IMPACT safeguards: synthetic label, numerator
  E10  BLOCKED-SOURCE  Full text: 23 Oct PDF (SPEC Part B2)
  N15  IN-PROGRESS     Multi-channel intake
  N32  PLANNED-P2      Integration adapters for real AICTE and CPGRAMS systems
  N33  PLANNED-P2      Native Android and iOS apps
  N46  TODO            Judge Demo Mode
  N47  TODO            Click any number to see its cases
  N50  TODO            Overlap timeline view
  N57  TODO            Daily integrity fingerprint
  N61  TODO            Cross-institution pattern alert
  U15  TODO            Email from an unverified sender creates no case

No violations.


## Implementation/verification notes

- Added channels/importContext.js and channels/plugins/case.plugin.js; append-only registration in server/src/models/plugins.js supplies PID/ICID snapshots only inside the S6a import invocation. Re-read the registry before appending; no owning model or S2 engine edit.
- Fingerprint proof files live in repo data/integrity/ (hash/date/count only), outside MongoDB. This is local write-once proof, not an external timestamp authority.
- Client build output is plans/S6a_BUILD/ so existing client/dist is untouched.
- Full run logs: S6a_TEST.log, S6a_TEST_RECHECK.log, S6a_FINAL_TEST.log. First repeat had all nine S6a backend tests passing but earlier-phase failures. A five-test S2 routing run replaced shared server-results.json afterwards; final run archives its result immediately. Root cause of disappearing seed state remains unproven.
- User explicitly selected “Wait for earlier-phase fixes” instead of authorizing a standalone client test run. No separate client tests will be run. S6a stays pending complete verification.
- Live verified-student email draft reached the real PREVENT preview (CLEAR, continue/cancel/edit). Automatic approval review rejected live persistent case creation as beyond preview inspection; draft remains unconfirmed. Backend confirmation/replay tests run only in the authorized test database.


# Revised S6a scope — user clarification, 2026-10-25

This section supersedes earlier design choices where they differ. No git, installs, new dependencies or edits to S6b. New source attachment: 1297dc95-9a75-4349-8f0f-94f0486e68d3/Pasted text.txt. Continue independent work while the S1b integration question is pending.

| ID | Revised implementation | Proof |
|---|---|---|
| N15 PWA | Manifest name AWAAZ DASTAK; cache only built JS/CSS/icons/offline notice; API and case navigations network-only; clear own caches on logout. One appended bootstrap import in main.jsx, one manifest link in index.html. Extend enum in owned Case plugin, retain existing values; WEB/PWA based on standalone signal, pending S1b hook. | [N15] static allowlist, network-only requests, logout clearing, manifest, channel behavior |
| N15 email / U15 | channels/email/ local inbound system_admin-only endpoint; normalize and resolve through S1a keyed-hash verified-sender contract. Unknown sender: no body/draft/case retained, neutral simulator outbox and exact safe audit meta. Verified sender: encrypted AWAITING_CONFIRMATION draft, EMAIL channel, languageTag, receivedAt, no case number. /my/email-drafts; S1b preview hook pending. Attachments are DROPPED with a fixed visible note; no alternate unscanned upload path. | [U15], [N15] verified/unverified, privacy, roles, preview/confirm/replay |
| N15 import | /admin/import, system_admin role initially (institution_admin only if S2 contract supports it). S2 preview/dry-run/idempotent commit, row-level create/skip/quarantine, sourceRef retained alongside engine sourceCaseRef through schema plugin; uppercase IMPORT. CSV must identify an existing verified RP reporter, never fabricate external-importer identity. | [N15] admin role, RP resolution, rows, source refs, snapshots, idempotency |
| N32 | New adapters/ interface names AICTE systems, institution registry, CPGRAMS; synthetic SimulatorAdapter implementations and network-free Real stubs returning CONTRACT_NOT_CONFIGURED. New docs/ADAPTERS.md requested explicitly by user. Stay PLANNED-P2. | [N32] interface/stub/no-network |
| N33 | New docs/MOBILE.md explicitly requested by user; PWA P1, native Android/iOS P2 unbuilt. Stay PLANNED-P2. | [N33] documented scope |
| N57 | Explicit integrity_fingerprints collection, yesterday UTC, last event hash of that day, eventCount/firstEventId/lastEventId/chainVerified/computedAt; append-only model refuses updates/deletes. Broken chain stores false instead of skipping. Daily timer and system_admin on-demand button; /integrity safe list + recompute-and-compare. Existing local prefix files retained as legacy artifacts, never silently overwritten or represented as daily end-of-day roots. | [A-N57] day boundaries, broken chain, append-only guards, comparison, safe UI |
| N48 | Read-only existing generator and S4 matcher; benchmark_runs stores correct/total, false matches/nonduplicate pairs, active rule version, seed, runtime and scope label. /benchmark supervisor/system_admin. No target accuracy. | [A-N48] formulas, version, timing, role, UNKNOWN |

All other S6 IDs are **owned by S6b**: N46, N47, N50, N61, F05, F06, F28, F36, F37, F38, E03, E04, E05, E06, E07, E08, E09, E10; graph/radar/impact evidence. No implementation for them. Earlier plan wording assigning exclusions to S3 is superseded. N37, N49, F15/F49 remain untouched.

Authorized integration changes: S1a resolveVerifiedSender and keyed synthetic mailbox bindings; append-only Case plugin registration (already present, extend owned plugin); append-only main import and HTML manifest line; own new adapter/mobile docs. S1b form/route changes require the pending ownership answer. No hidden fetch monkeypatch, DOM injection or copied S1b preview as a substitute.

Verification remains the prescribed root command with TEST_MONGODB_URI=mongodb://127.0.0.1:27017. User previously chose waiting for earlier-phase fixes rather than separate client testing; preserve that constraint. Full test/trace results and blockers will be recorded honestly.

Ownership decision: user delegated the choice. Codex will add only the required S1b prefill/preview/confirmation hooks plus standalone header handling; no copied preview and no unrelated S1b changes. Existing lowercase channel expectations in S1b tests may need owner alignment with the newly required WEB/EMAIL/IMPORT/PWA labels; do not weaken or edit those tests.


## Ownership attachment supersedes hook decision — 2026-10-25

Latest attachment e60e5d17-f4c3-4568-8954-19becb485a7f limits GrievanceSubmit changes to “one import line plus one JSX line ... or stop and tell me”. This supersedes the earlier delegated choice. The required prefill/preview/confirmation/attachment hooks need function-level changes; the existing web route also hardcodes web and cannot see standalone metadata via a model enum extension alone. Restored only Codex's known edits to GrievanceSubmit.jsx and intakeRoutes.js, preserving the rest; no git reset. Owned email page now displays an explicit pending-integration state and has no submission control. No fetch/DOM monkeypatch or copied preview is used. Stopping feature work per the new instruction.

Needed S1b-owned contract: (1) reusable preview component or explicit initialDraft + preview/confirmation callbacks, including a way to keep email submission on the EMAIL confirmation service; (2) standalone flag propagation from the normal web client to the existing server submit route so WEB/PWA is recorded. Keep these hooks owned by S1b or explicitly widen the edit budget. Existing S1b tests remain untouched.

Additional latest requirements not yet implemented/verified: Install prompt button; Discard draft; /admin/channels/email simulator/outbox/rejection count; exact email_drafts/mail_outbox collection names; canonical public/offline.html and public/icons paths; reset seed integration/sample CSV/fingerprint/benchmark seed run; expanded acceptance tests and logger regression; new S1a README entry; full final test/trace and live judge flow. These are not claimed complete.
