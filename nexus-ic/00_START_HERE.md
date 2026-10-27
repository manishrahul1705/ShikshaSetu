# Start here: building AWAAZ DASTAK (powered by NEXUS-IC) in Antigravity

> **Current status:** see [STATUS.md](STATUS.md) (updated 25 Oct 2026). The wave table below is the original plan, not progress: S5, S6b, S7 and the final audit are built; S0–S4 are verified in the full run.

## What's in this folder

| File | What it is |
|---|---|
| `RULES.md` | Paste into Antigravity once: Customizations → Rules → Workspace (or keep the file here; the prompts tell the agent to read it) |
| `docs/SPEC.md` | Your 24 Oct Unified doc, word for word, plus details that appear only in your four images (Appendices V and W). Part B is a placeholder for the 23 Oct PDF |
| `docs/ADDITIONS.md` | The 19 approved additions (N46–N67) and the 3 rejected ones |
| `FEATURES.md` | Checklist of all 349 IDs. Never edit the ID or Title columns |
| `scripts/trace-check.js` | Run `node scripts/trace-check.js` to prove nothing is missed |
| `prompts/S0_…` to `prompts/S7_…` | One prompt per stage, to paste into a new Antigravity conversation |
| `prompts/AUDIT.md` | Run after every stage, in a new conversation |
| `prompts/FINAL_AUDIT.md` | Run once at the end |
| `docs/JUDGE_SCRIPT.md` | The 5-minute demo |
| `BUILD_PLAN.md` | Phase-by-phase build plan: goal, IDs, what to build, how to verify, done criteria |
| `PARALLEL_PLAN.md` | How Antigravity and Codex split the phases, branches and file ownership |
| `AGENTS.md` | Rules for Codex (same as RULES.md plus parallel rules) |
| `prompts/S1a_…`, `S1b_…`, `S6a_…`, `S6b_…` | Split prompts for running S1 and S6 in both tools at once |
| `prompts/S1a_CODEX_MASTER_PROMPT.md` | Self-contained master prompt for Codex, phase S1a |

## Before you start
1. Install Antigravity IDE (the classic one only, not 2.0 as well), Node.js 20+, Git, and MongoDB (local, or Atlas if you'll demo on another laptop).
2. Put your PDFs into `docs/`: `NEXUS-IC_Unified_24Oct.pdf`, `NEXUS-IC_Spec_23Oct.pdf`, `architecture_journey.png`, `architecture_layers.png`.
3. Open this folder in Antigravity. In a terminal, run `git init`, then `git add -A`, then `git commit -m "spec and checklist"`.
4. Settings: use the strongest model (Gemini 3.1 Pro or Claude) for plans and audits, turn Planning mode on, and set terminal commands to ask before deleting files or resetting the database.

## Loop for each stage (S0 → S7)
1. Start a new conversation. Paste the stage prompt.
2. Read the agent's plan. Check that every ID from `trace-check --stage` is in it. Approve.
3. When it reports, run the app and look at it yourself.
4. Start a new conversation and paste `prompts/AUDIT.md`, filling in the stage name.
5. If the audit says "Safe to commit: YES", run `git add -A` and `git commit` with the suggested message.

## When the 23 Oct PDF arrives
Send it to Claude in the project thread. Claude will fill in Part B of SPEC.md and the F, E, R, T, X and D rows of FEATURES.md, so those rows stop being BLOCKED-SOURCE. Do the same with the N36–N45 text from your earlier chat.

## Suggested time plan
| Time | Stages |
|---|---|
| 10:30–12:30 | S0, S1 |
| 12:30–15:00 | S2, S3 |
| 15:00–17:30 | S4, S5 |
| 17:30–20:00 | S6 |
| 20:00–22:00 | S7, final audit, rehearse the judge script |

If you fall behind, finish every P0 feature before any P1 feature or addition.
