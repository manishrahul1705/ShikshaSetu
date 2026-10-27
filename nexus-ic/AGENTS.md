# AGENTS.md: rules for Codex (same rules as RULES.md, which Antigravity uses)

You are building NEXUS-IC for AICTE SIH Problem Statement 26264. These rules apply to every conversation in this workspace and override anything else you are asked, unless the human writes "override rule N".

## Product title
- The app's displayed title is **AWAAZ DASTAK**, with the subtitle **"powered by NEXUS-IC"** (browser tab, header, login and landing page, PWA name, export footers, receipt). Tagline: "Every voice, at the right door."
- Title only: keep NEXUS-IC as the system name, and keep every module name (NEXUS TRACE, NEXUS PREVENT, NEXUS SYNC and the rest) and every ID unchanged.

## Sources of truth (read before any work)
1. `docs/SPEC.md` is the solution. It is a word-for-word copy of `docs/NEXUS-IC_Unified_24Oct.pdf`. If they differ, the PDF wins.
2. `docs/ADDITIONS.md` lists the approved additions (N46–N67). They sit on top of SPEC.md.
3. `FEATURES.md` is the checklist of every ID. `node scripts/trace-check.js` checks it.

## Rule 1: nothing missed, nothing changed, nothing merged
- Every ID in FEATURES.md must end as DONE, GAP (with a reason), BLOCKED-SOURCE, PLANNED-P2 or NOT-ADOPTED. Never delete, merge, rename or renumber a row.
- Build each feature exactly as SPEC.md describes it. Do not simplify, "improve", rename or combine features. Keep exact names and texts, for example the banner "Potential Overlapping Cases – Coordination Required", status names, demo rule IDs such as DEMO-ROUTE-v1, and the route paths.
- Never summarise SPEC.md from memory. Open the section you are building and follow it line by line.
- If something is unclear or two parts of the spec conflict, stop and ask the human. Do not guess.

## Rule 2: never invent missing content
- Rows marked BLOCKED-SOURCE (F01–F64, E01–E10, R01–R55, T, X, D tests, N36–N45) have no defining text in the repo yet. Build only what SPEC.md and the row's "Known" hint state. Do not make up the rest. Leave the status as BLOCKED-SOURCE and write in Notes what you built from the hint.
- Do not invent thresholds, SLA days, region mappings, category lists or legal timelines. Use the synthetic DEMO-* rules named in SPEC.md, and POLICY_NOT_CONFIGURED where the spec says so.

## Rule 3: DONE means proven
- Only mark a row DONE when: (a) "Built in" lists the real file paths, (b) a test titled `[<ID>] ...` exists (additions use `[A-Nxx] ...`), and (c) that test passes in `npm test`.
- After every change, run `npm test` and then `node scripts/trace-check.js`. Never report success while either fails.
- Never skip, delete, weaken or `.skip` a test to make it pass.

## Rule 4: fixed stack (SPEC 14)
- React JSX with Vite, Tailwind, React Router, TanStack Query, Recharts, optional React Flow.
- Express in plain JavaScript on Node.js 20+, MongoDB with Mongoose.
- Tests: Vitest + Supertest + mongodb-memory-server (server), Vitest + React Testing Library (client), Playwright only for screenshots and the judge flow.
- **No TypeScript. No Digital Twin.** No other frameworks or databases without the human's approval.
- Modular monolith: `server/src/modules/<module>/` and `client/src/pages/`. Additions go in `server/src/modules/additions/<id>-<name>/` and `client/src/additions/<id>-<name>/`.

## Rule 5: data, privacy and honesty
- Synthetic data only. No real names, phone numbers, Aadhaar, APAAR or institution data scraped from anywhere. Every screen and export shows SYNTHETIC DATA (N66).
- OTP goes to a local sink (console or a dev inbox page), never a real phone or email.
- ABC/APAAR, SSO, registry, CPGRAMS, email and SMS are simulators until approved. Name them `*Simulator`.
- Reporter identity lives only in `identity_vault`. Never put complainant text or identity in logs, notifications or exports.
- Never show a missing or failed feed as zero. Show UNKNOWN with the reason.
- No guilt, compliance or risk score for institutions. Use "attention indicators" with visible reasons.
- The system never closes a case, never auto-rejects a grievance and never moves ownership on its own. Humans decide; the system gates and explains.
- Every percentage shows its numerator, denominator and scope.

## Rule 6: security defaults
- Every API route re-checks authorization on the server (S01), with RBAC by bureau, region and case (S02) and field-level ABAC (S03).
- Sessions use HttpOnly Secure cookies; no tokens in localStorage (S16).
- Every state change writes an attributed event to the hash-chained audit log (S09).
- Approver must differ from requester or proposer wherever SPEC says so (S20, N22, N25, N27).

## Rule 7: how to work
- Work on one stage per conversation, using the prompt in `prompts/`.
- Start by printing the stage's open IDs: `node scripts/trace-check.js --stage <S#>`. Write a plan that names every one of them to `plans/<S#>.md`. When running as a non-interactive task, continue after writing the plan; the human reviews it in the pull request.
- End every stage with: all tests green, trace-check with no violations, FEATURES.md updated, and a short report (done, gap, blocked, with reasons) in the pull request description. Commit on your phase branch and open a pull request to `main`; never push to `main` directly.
- Never run commands that delete files outside your own new files, drop a non-test database, force-push or rewrite git history.
- If tests cannot reach MongoDB in your environment, say so in the report. Never skip or delete tests to get green.

## Rule 8: working in parallel with another AI tool
- Two tools build this repo at the same time (Antigravity and Codex). Read `PARALLEL_PLAN.md` before starting any phase.
- Work only on your phase branch (`phase/<name>`) and only on the IDs your phase prompt lists.
- Edit only your phase's rows in FEATURES.md. Never reorder or reformat the table.
- Never edit another phase's model file, module or tests. Extend models only by a schema plugin in your own module (see PARALLEL_PLAN.md, "Shared files").
- `package.json`: only add dependencies. `package-lock.json`: never hand-merge.
- `RULES.md`, `AGENTS.md`, `docs/`, `scripts/trace-check.js` and `prompts/` are read-only.
- Before you finish: `git pull origin main` (merge), then `npm test` and trace-check again.
