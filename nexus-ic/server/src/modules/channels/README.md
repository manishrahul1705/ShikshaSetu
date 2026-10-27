# S6a channels — SYNTHETIC DATA

AWAAZ DASTAK — powered by NEXUS-IC. No new dependencies, real mailbox, partner integration or native application.

## Channel contract

Web portal P0; Mobile app P1 as installable PWA, native Android/iOS P2; Email P1; API P2 contract-gated; Import P1 with CSV preview, dry-run and idempotent commit. N32/N33 stay PLANNED-P2 and N49 remains NOT-ADOPTED.

The owned Case plugin extends (never replaces) the legacy enum with WEB/PWA/EMAIL/IMPORT. New web submissions carry X-Client-Standalone=true only when the client reports standalone display mode; the existing web API records PWA for that explicit signal and WEB otherwise. This metadata does not change verification, priority or routing. Existing lowercase values remain readable for older data/S2 callers. New S6a imports are mapped to IMPORT only inside the owned import context. The plugin also preserves sourceRef alongside S2's sourceCaseRef; neither source-native value nor its compound unique key is overwritten.

## Inbound email

POST /api/v1/channels/email/inbound is system_admin only. The local EmailSimulator refuses APP_MODE=production; no real mailbox exists. Fields: sender, body (or narrative), optional institutionPid/category/subCategory, optional attachments. Attachments are **dropped**, with the fixed visible note “Email attachments are dropped; no attachments are imported.” No file name/content is retained or passed to an alternate unscanned document route.

S1a normalizes the sender and performs a keyed-hash lookup through resolveVerifiedSender(email), returning only reporterId/userId or null. Verified synthetic accounts bind the fixture alias <username>@synthetic.invalid at successful verification or seed. These aliases are not proof of real mailbox ownership; no raw address is stored in sender bindings, drafts, outbox or audit. A real address-ownership/transport contract remains unconfigured. Current account activity and verification are rechecked for every resolution.

Unknown/unverified senders create no case or complaint draft, and no body is retained. The simulator outbox stores only the sender hash and the neutral VERIFY_ON_PORTAL template; no real message is sent. Inbound audit meta is exactly channel:EMAIL, outcome:SENDER_NOT_VERIFIED and senderHash. The neutral reply does not distinguish unknown from unverified accounts.

A verified message creates an encrypted EMAIL draft with languageTag, receivedAt and status AWAITING_CONFIRMATION. No Master Case ID is allocated at receipt. GET /api/v1/channels/email lists the authenticated complainant's summaries; /my/email-drafts is the portal list. The detail page renders S1b's actual GrievanceSubmit component with narrow prefill/preview/confirmation hooks, the actual category/PID checks and S4 PreventPanel. It does not copy the preview. The complainant edits missing fields, previews and explicitly confirms. Backend preview stores a token over the validated payload; confirmation calls S1b submitGrievance with channel EMAIL. Other reporters receive an audited 404. S1b's existing student/faculty intake roles are retained.

POST /channels/email/:id/preview and /confirm are under /api/v1. The legacy owned /channels/email/:id page remains an authenticated alias for old draft links. Sender receipt is no longer a complainant self-simulation endpoint. Confirmation replay is serialized within the demo process and guarded by the external-reference index; multi-process crash-atomic transactions/outbox recovery are not claimed.

## Admin CSV

/admin/import and its preview/dry-run/commit/review routes require system_admin. Institution-admin import has not been enabled without an explicit S2 authorization contract.

Headers: reporterId,institutionPid,institutionIcid,category,subCategory,narrative,sourceSystem,sourceRef. institutionIcid is optional. Legacy sourceCaseRef is accepted as an alias if identical; conflicting values are rejected. Each row must identify an existing active verified RP reporter through S1a's resolver; the administrator is never substituted as the complainant. No userId, arbitrary priority or document key can be supplied. UTF-8, quoted commas, doubled quotes and multiline original text are preserved; formulas are never executed.

The wrapper calls S2 validateImportBatch, dryRunImport and commitImport directly, without copying/changing the engine. It encrypts batches, serializes the authenticated admin's commits, checks current canAccessCase before existing-reference/duplicate reads, and returns row-level WOULD_CREATE/ALREADY_IMPORTED/IDENTITY_REVIEW outcomes. No narrative/storage key/identity is serialized in results. Dry-run and commit recheck verified reporters and PID/ICID mappings. Quarantined rows are excluded from S2's commit, retained in the data-health review queue, and visibly counted; only valid rows commit. Correcting authoritative registry data and re-previewing is a human operation, not an auto-merge. Replays create zero additional cases through S2 and its unique external-reference index. The owned AsyncLocalStorage Case plugin supplies authoritative PID/ICID snapshots only inside S6a's invocation.

All new routes authorize and reload the live account; all responses are no-store. State changes append attributed S0 audit events. S1a's mandatory VAULT_KEY/Node crypto encrypt draft and batch payloads; no fallback key or identity-vault reads from channel code. Existing original/legacy encrypted batches and prefix proof files are not deleted or silently migrated.

## PWA and adapters

See docs/MOBILE.md and docs/ADAPTERS.md. One appended main.jsx import registers the owned handwritten worker and one index.html link names the manifest. Static cache eligibility is limited to built JS/CSS/icons/offline notice. All API traffic is network-only; navigation never returns cached case data. Logout clears owned caches, including an offline logout attempt. Nothing is queued or synchronized offline.

## Verify

Use TEST_MONGODB_URI=mongodb://127.0.0.1:27017; npm test in PowerShell, one runner at a time. Do not change S0 setup. All implementation and negative-role tests are in the S6a-owned test files. Existing S1b lowercase-channel assertions must be aligned by that test's owner with the explicitly requested uppercase contract; they are not weakened here.
