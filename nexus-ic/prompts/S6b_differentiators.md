Read PARALLEL_PLAN.md first. Another AI tool is building audits and docs (Antigravity) at the same time on another branch. Work on branch `phase/S6b-differentiators` only.

Run the base prompt in `prompts/S6_Differentiators.md` exactly as written, with ONE change: your scope is ONLY the IDs listed below. Ignore every other ID that `trace-check --stage S6` prints; the other tool owns them. In your plan, list the IDs you skip and say "owned by audits and docs (Antigravity)".

YOUR IDs:
F05, F06 (differentiator part), F28, F36, F37, F38, E03, E04, E05, E07, E08, E09, E10 (all BLOCKED-SOURCE: build only what SPEC states), N46 (Judge Demo Mode), N47 (click any number), N50 (overlap timeline), N61 (cross-institution pattern alert)

OWNERSHIP for this phase:
You own modules judge-mode/, drilldown/, overlap-timeline/, patterns/ and the graph and radar views. N47 must reuse the existing IMPACT query builder; never change S5's report logic.

When done: `git pull origin main` (merge), `npm test`, `node scripts/trace-check.js --stage S6`, then report. FEATURES.md: edit only the rows of YOUR IDs.
