# N57 — completed-day integrity fingerprint

SYNTHETIC DATA — AWAAZ DASTAK, powered by NEXUS-IC. Outside proof for S09, **not a blockchain** or trusted timestamp authority.

The explicit integrity_fingerprints collection stores day (UTC), rootHash (hash of the last event of that completed day), eventCount, firstEventId, lastEventId, chainVerified and computedAt. The S0 full-chain verifier runs first. A broken chain creates a record with chainVerified:false; it is not silently skipped. A connected but actually empty day has eventCount:0, null root/first/last IDs and an explicit no-events display. Database failure is UNKNOWN/error, not a fabricated empty day.

The timer computes yesterday at startup and at each subsequent UTC midnight. A unique day index makes restart/retry idempotent. The demo-only system_admin POST /api/v1/integrity/compute and its UI button compute yesterday on demand (an explicit older completed day is also accepted). Today/future/invalid days are rejected. Every publication is audited.

Published rows are append-only: document-save updates, query updates/replacements/deletes, document delete and model bulk mutations are refused. No API exposes editing or deletion. Native database administrator access is outside this model guard; it is not physical WORM storage or a certified security claim.

GET /api/v1/integrity and /integrity show only day, hash, count, verified yes/no and computation time. First/last event IDs are stored internally but not returned. No event content, actors or case data are serialized. Recompute-and-compare checks the current day's candidate against all recorded boundary/count/hash/verification fields, reports match/mismatch, audits the check and never replaces the published row. Previously published false remains false even if later repair makes a comparison differ.

The page is an outside publication of the audit log's fingerprints. Evaluators should retain hashes independently; rewriting both database history and all retained publications is not prevented. Earlier local prefix files from the initial S6a draft are retained as legacy artifacts and are not presented as completed-day roots. No missed past days are invented automatically. The scheduler is disabled in Vitest; tests construct synthetic day-boundary events and explicitly capture/compare them.
