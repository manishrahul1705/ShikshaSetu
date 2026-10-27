# Two tools, one build: Antigravity + Codex

> **Current status:** see [STATUS.md](STATUS.md) (updated 25 Oct 2026). The wave table below is the original plan, not progress: S5, S6b, S7 and the final audit are built; S0–S4 are verified in the full run.

Antigravity reads `RULES.md`; Codex reads `AGENTS.md` (same rules plus the parallel rules below). Every phase prompt works in both.

## Who does what

| Wave | Antigravity | Codex | Can start when |
|---|---|---|---|
| 0 | Finish S0 (`S0_FIX_PROMPT.md`) | Set up: push repo to GitHub, connect Codex, check `npm install && npm test` runs there | now |
| 1 | **S1b** Institutions and intake (`S1b_institutions_intake.md`) | **S1a** Identity, NEXUS TRUST (`S1a_identity.md`) | S0 merged |
| 2 | **S2** Trust and routing | **S4** PREVENT | S1a + S1b merged |
| 3 | **S3** SYNC and TRACE | **S6a** Channels and integrity (`S6a_channels.md`) | S2 + S4 merged |
| 4 | **S5** Closure and recovery | Audit S3, then write the S7 negative-role tests for S1–S4 | S3 + S6a merged |
| 5 | Audit S6b, write LIMITATIONS and SECURITY_REVIEW | **S6b** Judge Mode and differentiators (`S6b_differentiators.md`) | S5 merged |
| 6 | **S7** Release evidence | **FINAL_AUDIT** (a fresh pair of eyes) | S6b merged |

Cross-check rule: **the tool that did not build a phase runs `prompts/AUDIT.md` on it** before it is merged.

Why this order: everything needs S1's users and cases. S2 (RuleBook, lifecycle) and S4 (PREVENT) only touch different modules. S3 needs S2's lifecycle. S5's closure gate needs S3's transfers. Judge Mode (S6b) needs S5's IMPACT.

## Git workflow (do exactly this)

1. **One folder per tool.** Never let both tools edit the same folder. Antigravity uses `nexus-ic/`. Codex works on GitHub (cloud) or in a second folder made with `git worktree add ../nexus-ic-codex <branch>`.
2. **Branch per phase:** `phase/S1a-identity`, `phase/S1b-intake`, `phase/S2-routing`, `phase/S4-prevent`, and so on. Start each from the latest `main`: `git checkout main`, then `git pull`, then `git checkout -b phase/<name>`.
3. **Merge only when green:** `npm test` passes, `node scripts/trace-check.js --stage <S#>` shows no violations, and the other tool's AUDIT says "Safe to commit: YES". Then open a pull request to `main` and merge it.
4. **After every merge to main,** the other tool's open branch runs `git pull origin main` (merge, don't rebase) and re-runs `npm test` before continuing.
5. **Merge order inside a wave:** whichever finishes first merges first. The second one pulls main, fixes conflicts, re-tests, then merges.

## Shared files: who owns what

| File or area | Rule |
|---|---|
| `FEATURES.md` | Edit **only your phase's rows**. Never reorder, re-sort or reformat the table. Conflicts are then line-level and easy: keep both sides. |
| `package.json` | Only **add** dependencies; never remove or bump someone else's. On conflict keep both lines. |
| `package-lock.json` | Never hand-merge. On conflict: `git checkout --theirs package-lock.json`, then `npm install`, then commit. |
| `server/src/routes.js` | Append one mount line per module. Never edit other lines. |
| `client/src/routes/` | Each phase adds its own file (`routes/s1a.jsx`, `routes/s2.jsx` …) that default-exports an array of `{ path, element, roles, public }`. `routes/index.jsx` picks them up automatically, so nobody edits it or `App.jsx`. |
| Login middleware | `server/src/middleware/loginGuards.js`: append one import line and one array entry (S1a's login limiter goes here). Never edit `authRoutes.js`. |
| Mongoose models | One owner per model (table below). Other phases **never edit** another owner's model file. To add fields, write a schema plugin in their own module (`server/src/modules/<mine>/plugins/<model>.plugin.js`) and register it in `server/src/models/plugins.js` by appending one import line and one registry entry. |
| `RULES.md`, `AGENTS.md`, `docs/`, `scripts/trace-check.js`, `prompts/` | Read-only for both tools. Only Manish (or Claude in the project thread) changes them. |
| Tests | Each phase writes its own test files. Never edit another phase's tests. If one breaks, report it; don't "fix" it by weakening it. |

### Model owners

| Model / collection | Owner phase |
|---|---|
| User, AuditEvent, sessions | S0 |
| reporter_accounts, identity_vault, consent_records, otp sink, fraud signals | S1a |
| institutions, institution_identifiers, regions, cases (core), documents | S1b |
| rule_book_versions, routing_decisions, case lifecycle/status fields, bureaus (N73) | S2 |
| case_actions (actions taken on a case, used by PREVENT Stage 2 and later by S3), intake_similarity_checks, co-signs (N59) | S4 |
| transfers, coordination, communication_log, queries (N70), field visits (N74) | S3 |
| closure_records, feedback_records, appeals, rescue_alerts, export_log | S5 |
| benchmark results, integrity fingerprints | S6a |

### Contracts for parallel phases (agree before Wave 2)

- **S4 → S2 RuleBook:** S4 reads thresholds only through `rulebook.getActiveRule('OVERLAP_DETECTION')` (S2 owns it). Until S2 merges, S4 uses `server/src/modules/prevent/defaults.js`, clearly labelled DEMO, and removes it after S2 merges.
- **S3 → S4 case_actions:** S3 writes actions into S4's `case_actions` model and does not change its schema except by plugin.
- **S1a ↔ S1b:** a case stores `reporterId` (the pseudonymous `RP-xxxx` string) only. S1b never reads `identity_vault`.

## Using Codex well

- Codex reads `AGENTS.md` automatically. In the Codex task, paste the same phase prompt as Antigravity, plus this one line: **"You are running as Codex: follow AGENTS.md, write your plan to plans/<S#>.md first, then continue without waiting."**
- In the Codex environment settings, use a setup script of `npm install` (this also downloads the MongoDB test binary while the internet is on). If tests can't reach MongoDB, say so in the report instead of skipping tests.
- Codex opens a pull request at the end. Don't merge it until the Antigravity AUDIT says "Safe to commit: YES".
