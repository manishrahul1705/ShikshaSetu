Follow RULES.md for this whole conversation.

First:
1. Read RULES.md, then the SPEC.md sections and ADDITIONS.md rows listed below, in full. Do not skim.
2. Run `node scripts/trace-check.js --stage S0` and paste its output.
3. Write a plan with one line per open ID from that output: what you will build, which file(s), which test(s). Every ID must appear in the plan. If an ID is BLOCKED-SOURCE, say exactly what you will build from its "Known" hint and what you will not build.
4. Stop and wait for my approval of the plan.

# Stage S0: Foundation

Read: SPEC.md sections 1, 2, 4, 13 (S01, S09, S16, S28), 14, 18 (S0 row), Appendix V. ADDITIONS.md rows N48, N66.

Build:
- Monorepo: `server/` (Express, plain JS, Mongoose), `client/` (React JSX, Vite, Tailwind, React Router, TanStack Query). Root `package.json` with scripts:
  - `dev` (runs both), `seed`, `reset` (drop and reseed the demo database), `test`, `lint`.
  - `test` must run Vitest for server and client and write Jest-format JSON to `test-results/results.json` (`--reporter=default --reporter=json --outputFile=test-results/results.json`). Merge server and client results into that one file.
- `.env.example` with `MONGODB_URI`, `SESSION_SECRET`, `APP_MODE=demo|production`. Never commit `.env`.
- Auth: session login with HttpOnly Secure cookies, no tokens in localStorage (S16). Server-side authorization middleware on every route (S01). Role model ready for: complainant (student, faculty), institution admin, officer roles by bureau and region, regional officer, supervisor, Competent Authority, auditor.
- Demo accounts and complainant accounts seeded (SPEC 18 S0 row). Print them in README.
- Tamper-evident audit log as a hash chain: every event stores the previous hash (S09). A helper `audit.record(actor, action, target, meta)` used by all later modules. Never logs complainant text (S28).
- Logger that refuses to log complainant text or identity fields (S28).
- N48 realistic synthetic-data generator: `npm run gen -- --count 5000` makes complaints with typos, acronyms and Hindi and Tamil spellings. Synthetic only.
- N66: a SYNTHETIC DATA banner on every page and in every export footer, and an admin-only "Check audit chain" button showing intact or the first broken entry. Hidden in production mode for the button only.
- Title: AWAAZ DASTAK with the subtitle "powered by NEXUS-IC" in the browser tab, header, login and landing page (see RULES.md "Product title"). Also show the Appendix V header taglines on the landing page. Module names stay NEXUS TRACE, NEXUS PREVENT, and so on.
- Reproducible: `npm install && npm run reset && npm run dev` must work on a fresh clone. Write README steps.

Tests to write now: `[S01]`, `[S09]`, `[S16]`, `[S28]`, `[A-N48]`, `[A-N66]`.

When the plan is approved, build it. Then, before you report:
- Run `npm test` (it writes test-results/results.json). All tests must pass, including every earlier stage's tests.
- Update FEATURES.md for every ID in this stage: Status, Built in, Proved by, Notes. DONE only if the rules allow it.
- Run `node scripts/trace-check.js --stage S0` and paste the full output. It must say "No violations".
- Report in this shape:
  - DONE: IDs
  - GAP: IDs with reasons
  - BLOCKED-SOURCE: IDs and what was built from the hint
  - Anything in SPEC.md for this stage that you could not fit to an ID (should be none)
  - How I can see it working: URLs, demo accounts, steps
  - Suggested commit message: "stage S0: ..."
