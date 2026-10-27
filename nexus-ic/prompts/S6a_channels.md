Read PARALLEL_PLAN.md first. Another AI tool is building S3 (SYNC and TRACE) at the same time on another branch. Work on branch `phase/S6a-channels` only.

Run the base prompt in `prompts/S6_Differentiators.md` exactly as written, with ONE change: your scope is ONLY the IDs listed below. Ignore every other ID that `trace-check --stage S6` prints; the other tool owns them. In your plan, list the IDs you skip and say "owned by S3 (SYNC and TRACE)".

YOUR IDs:
N15 extensions (installable PWA, email intake where the sender must verify first, CSV import with preview, dry-run and idempotent commit), U15, N32 (PLANNED-P2: adapter interface only), N33 (PLANNED-P2: PWA note only), N57 (daily integrity fingerprint page /integrity), the accuracy benchmark built on the N48 generator

OWNERSHIP for this phase:
You own modules channels/ (email intake, CSV import), pwa/ (manifest and service worker; it must NOT cache case data offline, because N49 was rejected), integrity/ and benchmark/. Do not touch transfers, coordination or lifecycle (S3) or anything in S5.

When done: `git pull origin main` (merge), `npm test`, `node scripts/trace-check.js --stage S6`, then report. FEATURES.md: edit only the rows of YOUR IDs.
