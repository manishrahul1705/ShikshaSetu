ROLE
You are the lead engineer and quality owner for AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264, "Integrated Institution Grievance Monitoring and Resolution System". You think before you code, you never guess, and you prove every claim with a passing test. Your standard: a senior reviewer must find nothing missing, nothing renamed and nothing faked.

CONTEXT (read these files fully before anything else; do not skim)
1. RULES.md: binding rules for this whole workspace.
2. docs/SPEC.md: the solution, a word-for-word copy of docs/NEXUS-IC_Unified_24Oct.pdf. If they differ, the PDF wins.
3. docs/ADDITIONS.md: approved additions N46–N67 (and 4 rejected items you must never build).
4. FEATURES.md: one row per ID (349 rows). scripts/trace-check.js checks it.
5. BUILD_PLAN.md: the 8-phase plan. This conversation is phase S0 (Foundation) ONLY.

NON-NEGOTIABLE RULES (summary of RULES.md; RULES.md wins if they differ)
- Nothing missed, nothing changed, nothing merged. Never delete, rename, renumber or combine an ID. Keep exact names and texts from SPEC.md.
- Never invent content. Rows marked BLOCKED-SOURCE (F, E, R, T, X, D, N36–N45) have no defining text yet. Build only what SPEC.md or the row's "Known" hint states.
- DONE means proven: real file paths in "Built in" + a test titled "[<ID>] ..." (additions: "[A-Nxx] ...") that passes in `npm test`. Never skip or weaken a test.
- Fixed stack: React JSX + Vite + Tailwind + React Router + TanStack Query (+ Recharts, optional React Flow) on the client; Express in plain JavaScript on Node.js 20+ with MongoDB + Mongoose on the server. Vitest + Supertest + mongodb-memory-server for server tests, Vitest + React Testing Library for client tests. NO TypeScript. NO Digital Twin. No other frameworks or databases.
- Synthetic data only. OTP goes to a local sink, never a real phone or email. External systems are simulators named *Simulator.
- Never log, notify or export complainant text or identity. Never show a missing feed as 0 (show UNKNOWN with the reason). No institution guilt, risk or compliance score.
- Title: the app shows "AWAAZ DASTAK" with the subtitle "powered by NEXUS-IC" and the tagline "Every voice, at the right door." Module names (NEXUS TRACE, NEXUS PREVENT, NEXUS SYNC and the rest) and all IDs stay unchanged.
- Ask me before any command that deletes files, drops a database or resets git. Do not commit or push. Suggest the commit message instead.

PHASE S0 SCOPE: exactly these 7 IDs
- F45 (BLOCKED-SOURCE; hint: demo accounts, part of the zero-trust block F45–F54). Build the demo accounts only. Leave the status BLOCKED-SOURCE and note what you built.
- S01 Zero trust: every request re-authorized server-side.
- S09 Tamper-evident audit log (hash chain, not a blockchain claim).
- S16 HttpOnly Secure session cookies, no tokens in localStorage.
- S28 No complainant text in logs.
- N48 Realistic test-data generator (ADDITIONS.md).
- N66 Synthetic-data banner and audit-chain check button (ADDITIONS.md).

WHAT TO BUILD IN S0
1. Repository layout (modular monolith):
   server/src/app.js, server/src/server.js, server/src/config/, server/src/middleware/, server/src/modules/<module>/ (auth, audit, users first), server/src/modules/additions/n48-data-generator/, server/src/modules/additions/n66-integrity-banner/, server/tests/
   client/src/main.jsx, client/src/App.jsx, client/src/pages/, client/src/components/, client/src/additions/n66-integrity-banner/, client/tests/
   scripts/ (trace-check.js already exists; do not change its rules)
2. Root package.json scripts: `dev` (server + client together), `seed`, `reset` (drop and reseed ONLY the demo database named in .env; ask me before the first run), `gen` (N48), `test`, `lint`.
   `npm test` must run server and client Vitest suites and write ONE merged Jest-format JSON file to test-results/results.json (Vitest json reporter with outputFile, then merge). trace-check reads this file.
3. .env.example with MONGODB_URI, SESSION_SECRET, APP_MODE=demo|production, CLIENT_ORIGIN. Add .env to .gitignore.
4. Auth (S16, S01): session login with express-session (or equivalent), cookies HttpOnly + Secure (Secure may be relaxed only on localhost in demo mode, documented) + SameSite=Lax; passwords hashed with bcrypt; NO tokens in localStorage or sessionStorage anywhere in the client. An `authorize(...)` middleware that re-checks the session and role on EVERY API route; any route without it fails a test. Role model ready for later phases: student, faculty, institution_admin, bureau_officer (bureau + region), regional_officer, supervisor, competent_authority, auditor, system_admin.
5. Demo and complainant accounts (F45 hint): seed at least one account per role, two bureaus (e.g. Regulation Bureau, Public Grievance Redressal Cell) and one regional office, all synthetic. Print the list in README.md.
6. Audit log (S09): collection audit_events with seq, at, actorId, actorRole, action, targetType, targetId, meta (no complainant text), prevHash, hash = SHA-256 of the canonical event + prevHash. One helper `audit.record(...)` used by every state change from now on. An admin-only `GET /api/v1/audit/verify` that recomputes the chain and returns { intact: true } or the first broken seq.
7. Safe logger (S28): a logger wrapper that strips or refuses known complainant/identity fields (narrative, description, name, email, phone, enrolment, identity payload) and is the only logger used.
8. N48 data generator: `npm run gen -- --count 5000 --seed 42` creates reproducible synthetic institutions (PID format like 1-1234567890, some with ICID, some without), synthetic complainants and synthetic complaints with typos, acronyms and Hindi and Tamil spellings. Mark every generated record synthetic: true. Never real names or real institutions.
9. N66: a SYNTHETIC DATA banner on every page and a footer line for every future export; an admin-only "Check audit chain" button that calls the verify endpoint and shows "Intact" or the first broken entry. Hide the button when APP_MODE=production.
10. Client shell: login page, a home page with the AWAAZ DASTAK title, subtitle and the SPEC Appendix V taglines ("One Institution, One View, One Complaint Journey, Real Resolution"; "Verified People • Verified Institutions • Coordinated Bureaus • No Lost Transfers • Faster, Accountable Resolution"), role-aware empty dashboards as placeholders for later phases, logout. Responsive.
11. README.md: prerequisites, install, `npm run reset`, `npm run dev`, demo accounts, how to run tests and trace-check.

TESTS TO WRITE (titles must start with the tag)
- [S01] every /api route except login/health rejects unauthenticated and wrong-role requests (iterate the Express router so a new unprotected route fails the test).
- [S09] chain verifies after 50 events; editing one stored event makes verify report that seq.
- [S16] login sets an HttpOnly cookie; the client bundle source contains no localStorage/sessionStorage token use.
- [S28] the logger never outputs the protected fields.
- [A-N48] same seed gives identical output; output contains typos, acronyms, Hindi and Tamil spellings; every record has synthetic: true.
- [A-N66] banner renders on every route; chain-check button hidden in production mode.

HOW TO WORK
Step 1. Read the five files above. Then run `node scripts/trace-check.js --stage S0` and paste the output.
Step 2. Write a PLAN with: (a) one line per S0 ID: what, which files, which test; (b) the folder tree you will create; (c) every dependency you will install with its purpose; (d) anything in the spec you find unclear, as questions. Then STOP and wait for my approval. Do not write code before I approve.
Step 3. After approval, build in small steps. After each step, run the relevant tests.
Step 4. Verify:
   - `npm install`, then `npm run reset`, then `npm run dev` works from a clean clone; log in as two different roles.
   - `npm test`: all tests pass, none skipped; test-results/results.json exists.
   - Update FEATURES.md rows for the 7 S0 IDs only (Status, Built in, Proved by, Notes). Never edit ID, Title, Source, Pri or Stage columns, and never touch rows of other phases.
   - `node scripts/trace-check.js --stage S0` must print "No violations". Paste its full output.
Step 5. Self-review before reporting: re-read RULES.md and the S0 section of BUILD_PLAN.md line by line, and list anything you did not do.

FINAL REPORT (exactly this shape)
- DONE: IDs
- BLOCKED-SOURCE: F45, with what was built from its hint
- GAP: IDs with reasons (should be none)
- Test summary: passed / failed / skipped counts
- trace-check output (full)
- How I can see it: URLs, demo accounts, steps
- Decisions you made that I should know about
- Suggested commit message: "stage S0: foundation, auth, audit chain, data generator, synthetic banner"

DONE WHEN
A fresh clone runs with three commands, every S0 test passes, trace-check shows no violations, and nothing outside S0 has been started.
