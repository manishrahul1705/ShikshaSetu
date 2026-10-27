Read PARALLEL_PLAN.md first. Another AI tool is building S1b (institutions and intake) at the same time on another branch. Work on branch `phase/S1a-identity` only.

Run the base prompt in `prompts/S1_Mandatory_PS_plus_front_half.md` exactly as written, with ONE change: your scope is ONLY the IDs listed below. Ignore every other ID that `trace-check --stage S1` prints; the other tool owns them. In your plan, list the IDs you skip and say "owned by S1b (institutions and intake)".

YOUR IDs:
N01, N02, N03, N04, N05, N06, N07, N08, N68, N69, N79, S04, S05, S06, S07, S14, S15, S26, F46, F47, F50, F51, F53, F54 (BLOCKED-SOURCE: build only from their hints), U05, U06, U07, U08, U09, U10

OWNERSHIP for this phase:
You own modules identity/ (verification simulators, OTP sink, fraud signals), consent/, vault/ and the System Administrator workspace (N79), plus models reporter_accounts, identity_vault, consent_records. A case stores only the pseudonymous reporterId string (RP-xxxx); you expose `getReporterId(userId)` for S1b. Do not touch institutions, registry, intake or cases.

When done: `git pull origin main` (merge), `npm test`, `node scripts/trace-check.js --stage S1`, then report. FEATURES.md: edit only the rows of YOUR IDs.
