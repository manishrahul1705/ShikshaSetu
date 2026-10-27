Read PARALLEL_PLAN.md first. Another AI tool is building S1a (identity, NEXUS TRUST) at the same time on another branch. Work on branch `phase/S1b-intake` only.

Run the base prompt in `prompts/S1_Mandatory_PS_plus_front_half.md` exactly as written, with ONE change: your scope is ONLY the IDs listed below. Ignore every other ID that `trace-check --stage S1` prints; the other tool owns them. In your plan, list the IDs you skip and say "owned by S1a (identity, NEXUS TRUST)".

YOUR IDs:
F01–F13, F29–F35 (BLOCKED-SOURCE: build only from hints), N09, N10, N11, N12, N13, N14, N15 (web portal only), N31, N52, N58, N64, N67, S02, S03, S10, S11, S12, S21, R01–R55 (BLOCKED-SOURCE), U01, U02, U03, U04, U11, U12, U13

OWNERSHIP for this phase:
You own modules registry/, institutions/, intake/, cases/, documents/ and models institutions, institution_identifiers, regions, cases (core), documents. Store only `reporterId` (RP-xxxx) on a case, via S1a's `getReporterId(userId)`; until S1a merges, use a stub in your own module that returns 'RP-TEST' and remove it after merging main. Never read identity_vault.

When done: `git pull origin main` (merge), `npm test`, `node scripts/trace-check.js --stage S1`, then report. FEATURES.md: edit only the rows of YOUR IDs.
