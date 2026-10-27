# S6a report — stopped on the latest ownership boundary (2026-10-25)

**Status: IN-PROGRESS; not DONE.** The latest ownership attachment permits a S1b page change of only “one import line plus one JSX line ... or stop and tell me”. That supersedes the earlier delegated decision to add narrow hooks. A correct reusable S1b email preview needs function-level prefill, preview and confirmation hooks; the ordinary server route also hardcodes lowercase web and has no standalone-context hook. A model enum extension cannot propagate an HTTP flag or bind the email confirmation to the existing form.

Stopped feature work under that instruction. Restored only Codex's known hook changes in client/src/pages/intake/GrievanceSubmit.jsx and server/src/modules/intake/intakeRoutes.js; no git reset and no edits to S1b tests. Their earlier content was preserved apart from removal of those known Codex changes. The owned email detail page now explicitly says integration is pending and offers no submission control. It does not render an unbound S1b form, monkeypatch fetch, inject DOM handlers or copy S1b's preview.

## Required handoff

S1b's owner needs to provide:

1. A reusable preview component or initialDraft + validated-preview + explicit-confirmation callbacks, so an email draft uses the actual category/PID/PreventPanel flow and confirms through the EMAIL service.
2. Standalone flag propagation through the ordinary web client and submit route, recording PWA only for that signal and WEB otherwise. Keep source-native IDs and existing authorization intact.

Alternatively, the owner must explicitly widen the edit budget. No further approval question is inferred: the present instruction says to stop when that budget cannot support the integration.

## ID status

- Newly DONE: none. N48's existing S0 generator remains DONE; its revised benchmark extension is unverified.
- IN-PROGRESS: N15, U15, N57. Revised code exists, but the latest scope, ownership, acceptance tests and judge flow are not complete.
- PLANNED-P2: N32, N33 remain unchanged in status. Three simulator adapters and Real stubs plus docs/ADAPTERS.md and docs/MOBILE.md exist. No real integration or native app was built.
- BLOCKED-SOURCE touched: no rows changed for F15, F49 or N37. CSV calls S2's engine near the F15/F49 hints; the benchmark is under N48, never invented as N37. N49 remains NOT-ADOPTED.
- Excluded: N46, N47, N50, N61, F05, F06, F28, F36-F38, E03-E10 and graph/radar/impact evidence are owned by S6b. None was built.

Only Status/Built in/Proved by/Notes of N15, U15, N32, N33, N57 and N48 were updated. Other row bytes, titles, IDs, priorities, sources and stages were preserved.

## Revised implementation present, but not verified

- Admin-only POST /api/v1/channels/email/inbound uses the local EmailSimulator. Production refuses it. Unknown/unverified senders retain no body/draft/case; the neutral simulator outbox stores a hash/template and the exact inbound audit meta is channel/outcome/senderHash. Verified receipts create encrypted EMAIL drafts with languageTag, receivedAt and AWAITING_CONFIRMATION. Attachments are dropped with a fixed note; no attachment name/content is retained. /my/email-drafts lists the complainant's draft summaries. Actual preview/confirm integration is blocked as above.
- /admin/import uses S2 validateImportBatch, dryRunImport and commitImport without copying/changing the engine. Existing verified RP reporter IDs are resolved through S1a rather than substituting the admin. UTF-8/multiline CSV is preserved; row statuses identify WOULD_CREATE, ALREADY_IMPORTED or IDENTITY_REVIEW. Quarantined rows are excluded from commit and retained in a data-health review list. The owned Case plugin adds uppercase enum values and mirrors sourceRef alongside S2 sourceCaseRef, preserving the native value/index; import snapshots come from the registry in a scoped AsyncLocalStorage context. This code's newest tests have not run.
- Manifest name is AWAAZ DASTAK. One main.jsx bootstrap import and one index.html manifest line are present. Handwritten worker eligibility is built JS/CSS, icons and offline notice only; APIs/navigation use the network, no API response or case data is cached, no queue exists, and logout clears owned caches. Latest install-button/canonical-path/live-install requirements are not complete.
- integrity_fingerprints now stores completed UTC day, last-event root, eventCount, firstEventId, lastEventId, chainVerified, computedAt. Broken chain records false rather than skipping. Model save/query replacement/update/delete/bulk guards are implemented. Timer computes yesterday at startup/UTC midnight; demo admin compute and read-only-history recompute comparison exist. Outside proof for S09, not a blockchain. Legacy prefix files are retained and not presented as completed-day roots.
- benchmark_runs now stores the synthetic labelled result with correct/total, false matches/nonduplicate denominator, actual approved RuleBook version, seed, runtime and scope. UI/API roles are supervisor/system_admin. The exact label is SYNTHETIC DATA - not a real-world accuracy claim. No target accuracy is embedded. Existing generator and S4 matcher are read-only. No seed benchmark result is claimed because that run has not been performed.

## S1a sender contract

resolveVerifiedSender(email) normalizes trim/NFC/lowercase and looks up a namespaced HMAC-SHA256 sender hash using the existing mandatory VAULT_KEY through the S1a crypto helper. No key is printed or logged. It returns only {reporterId,userId} for an active currently verified account with its person claim, or null. Raw addresses are never stored in sender bindings. Synthetic <username>@synthetic.invalid bindings are created at successful verification/seed; these are simulator fixture aliases, not proof of real mailbox ownership. resolveVerifiedReporter(reporterId) supports verified pseudonymous import ownership. The new S1a README entry is still pending.

## Exported function inventory

channels/common.js: fail, uid, digest, audit, verified, demoOnly, handle.
channels/csv.js: parseCsv.
channels/email/service.js: EmailSimulator.receive, listEmailDrafts, readEmail, previewEmail, confirmEmail; ATTACHMENT_NOTE/VERIFY_REPLY are constants. channels/email.js re-exports this service.
channels/imports.js: previewImport, dryRun, commit, dataHealthReview.
channels/plugins/case.plugin.js: default channelImportPlugin; importContext.js exports its AsyncLocalStorage object. models.js exports EmailDraft, EmailOutbox and ImportBatch model handles; routes.js exports its router.
Legacy channels/adapters.js still exports SourceAdapter, AicteSimulator and CpgramsSimulator from the earlier draft; new source adapter entry is adapters/index.js. Legacy cleanup remains pending rather than pretending both contracts are identical.
integrity service (additions/n57-integrity): yesterday, computeDay, capture, history, compareDay, publishDaily, startDailyPublisher; Fingerprint model and router are exported.
benchmark/service.js: fixtures, evaluate, runBenchmark; BenchmarkRun model/router exported.
adapters/index.js: SourceAdapter.snapshot, SimulatorAdapter.snapshot, RealAdapter.snapshot, ADAPTER_SOURCES and per-source adapters object. All Real snapshots return CONTRACT_NOT_CONFIGURED without a call; registry simulator is reused read-only and unavailability is UNKNOWN.

## Latest ownership checklist still incomplete

- S1b preview/confirmation/standalone hooks, as above.
- Install-offer button, Discard action, /admin/channels/email simulator form/outbox/rejected-sender count.
- Exact email_drafts and mail_outbox collection names (current draft implementation still uses its earlier collection names).
- Canonical public/offline.html and public/icons/ assets (current earlier assets are under public/pwa/).
- Reset seed additions: unknown sender, verified awaiting-confirmation draft, sample CSV under channels/import/samples/ with duplicate and mismatch, fingerprint and measured seed benchmark result.
- Full latest-run benchmark history UI (current page fetches the latest run), complete bilingual labels, and S1a README contract entry.
- Expanded acceptance proof: scan every collection for rejected email body, explicit http/fetch denial for adapters, [S28 regression] logger scan, draft-discard/install UI tests, and explicit PREVENT-before-confirm ordering.
- Full root tests, current result JSON, live reset/seed/dev/Chrome install/offline flow, final self-review and green trace. No prior observation is substituted for these new requirements.

## Validation and provenance

No full npm test was started for this revised scope before the ownership stop. Current tests were not skipped or weakened. The revised code had passed plain-JavaScript syntax checks and a 140-module client production build while the larger S1b hooks were present. Those hooks have now been restored, and email UI has been replaced by the explicit pending state; that build is not claimed as final validation of this stopped revision. intakeRoutes.js syntax passed after restoration.

The previous revision's archived full run (plans/S6a_SERVER_RESULTS.json) was 112 passed / 16 failed / 0 skipped, including 8/9 prior S6a server tests. It is historical only: implementations/tests have since changed. Shared results have also been replaced by other focused/full runs, so no fresh current-revision test count or benchmark percentage is claimed.

The latest S6 trace reports one violation: U10 failed in the shared report. It reports no violation on the six scoped rows, but that is not proof the new S6a tests ran or the phase is complete. Full output is included below.

No git commands, checkout copies/worktrees, dependency installs or new dependencies. Shared code changes remaining are append-only S6a mounts/plugin registration, the single main import and single manifest line. S1b hook edits were restored; its files/tests and S3/S5 code must remain under their owners. No reset, new demo case confirmation or PWA installation was performed for this revision.

## URLs and demo accounts (implemented entry points, not a completed judge-flow claim)

http://localhost:5173/my/email-drafts — trust_student_verified / demo1234; detail is explicitly pending S1b integration.
http://localhost:5173/admin/import — sysadmin1 / demo1234; revised implementation unverified.
http://localhost:5173/integrity — login required; admin demo compute and historical comparison.
http://localhost:5173/benchmark — supervisor1 or sysadmin1 / demo1234; no measured seed result yet.
/admin/channels/email is not built yet. Synthetic sender fixture alias is trust_student_verified@synthetic.invalid. Inbound API is system_admin-only and synthetic/demo-only.

## Created/changed source-file inventory for S6a to date

The two S1b files are intentionally excluded from this current-change list because only the known Codex edits were restored. Generated logs/build/results are grouped below separately.

- client/src/additions/n57-integrity/Integrity.jsx
- client/src/pages/benchmark/Benchmark.jsx
- client/src/pages/channels/AdminImport.jsx
- client/src/pages/channels/Channels.jsx
- client/src/pages/channels/EmailDraft.jsx
- client/src/pages/channels/EmailDrafts.jsx
- client/src/pages/channels/api.js
- client/src/pwa/bootstrap.js
- client/src/pwa/display.js
- server/src/modules/adapters/index.js
- server/src/modules/additions/n57-integrity/README.md
- server/src/modules/additions/n57-integrity/routes.js
- server/src/modules/additions/n57-integrity/service.js
- server/src/modules/benchmark/README.md
- server/src/modules/benchmark/routes.js
- server/src/modules/benchmark/service.js
- server/src/modules/channels/README.md
- server/src/modules/channels/adapters.js
- server/src/modules/channels/common.js
- server/src/modules/channels/csv.js
- server/src/modules/channels/email.js
- server/src/modules/channels/email/service.js
- server/src/modules/channels/importContext.js
- server/src/modules/channels/imports.js
- server/src/modules/channels/models.js
- server/src/modules/channels/plugins/case.plugin.js
- server/src/modules/channels/routes.js
- server/src/modules/identity/senders.js
- server/src/modules/identity/index.js
- server/src/modules/identity/service.js
- server/src/modules/identity/seed.js
- server/src/routes.js
- server/src/models/plugins.js
- client/src/main.jsx
- client/index.html
- client/src/routes/s6a.jsx
- client/src/i18n/s6a.en.json
- client/src/i18n/s6a.hi.json
- client/public/manifest.webmanifest
- client/public/sw.js
- client/public/pwa/offline.html
- client/public/pwa/icon-192.png
- client/public/pwa/icon-512.png
- docs/ADAPTERS.md
- docs/MOBILE.md
- server/tests/s6a-channels.test.js
- server/tests/s6a-integrity-benchmark.test.js
- client/tests/s6a-channels.test.jsx
- FEATURES.md
- plans/S6a.md
- plans/S6a_REPORT.md

Generated evidence/artifacts: plans/S6a_BUILD/ (including public copies/hashed assets), plans/S6a_BUILD.log, plans/S6a_TEST.log, plans/S6a_TEST_RECHECK.log, plans/S6a_FINAL_TEST.log, plans/S6a_SERVER_RESULTS.json, plans/S6a_CLIENT_RESULTS.json, plans/S6a_TEST_PROCESSES.log, plans/S6a_TRACE.log, plans/S6a_SCOPE_RECHECK.log; earlier data/integrity/2026-10-24.json legacy prefix proof; test-results files generated by earlier runs/merge (not current proof). No generated result is relabelled as this revision's success.

## Full latest trace

```text
FEATURES.md: 349 rows, expected 349
  TODO            0
  IN-PROGRESS     4
  DONE            119
  GAP             4
  BLOCKED-SOURCE  217
  PLANNED-P2      2
  NOT-ADOPTED     3

Stage S6: 18 IDs not DONE
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
  N57  IN-PROGRESS     Daily integrity fingerprint
  U15  IN-PROGRESS     Email from an unverified sender creates no case

1 violation(s):
  ✗ U10: test "[U10]" failed

```
