Follow RULES.md. Continue phase S0 only. An external audit found S0 is NOT complete. Fix exactly these items, in this order, and do not start S1.

1. [S01] test is broken. In server/tests/authorize.test.js, extractRoutes() drops "/v1" from mounted paths (it produces /api/health, /api/auth/logout ...), so the requests hit 404, not 401. Fix the route walker so it builds the real paths (/api/v1/health, /api/v1/auth/logout, /api/v1/auth/me, /api/v1/audit/verify, /api/v1/users/). Add an assertion that the extracted list contains "/api/v1/auth/me", so this can never silently break again. Also assert that every non-public route layer has a middleware with _isAuthorize === true.
2. Missing root scripts. package.json calls scripts/seed.js, scripts/reset.js and scripts/merge-results.js, which do not exist. Create them:
   - seed.js: connect to MONGODB_URI, run seedDemoAccounts(), disconnect.
   - reset.js: refuse to run unless the database name ends with "_demo" (print why); ask me before the first run; drop that database only; then seed.
   - merge-results.js: merge test-results/server-results.json and test-results/client-results.json into ONE Jest-format test-results/results.json (concatenate testResults, sum the totals). scripts/trace-check.js reads that file.
3. The client does not exist. Create client/ (React JSX + Vite + Tailwind + React Router + TanStack Query, no TypeScript) as an npm workspace with scripts dev and test (Vitest + React Testing Library + jsdom, json reporter to ../test-results/client-results.json). Build:
   - Login page (POST /api/v1/auth/login with credentials: 'include'; no token storage anywhere).
   - Home/landing page: title "AWAAZ DASTAK", subtitle "powered by NEXUS-IC", tagline "Every voice, at the right door.", and the SPEC Appendix V taglines "One Institution, One View, One Complaint Journey, Real Resolution" and "Verified People • Verified Institutions • Coordinated Bureaus • No Lost Transfers • Faster, Accountable Resolution". Browser tab title "AWAAZ DASTAK".
   - Role-aware empty dashboard placeholders and logout.
   - N66: a SYNTHETIC DATA banner on every page (put it in the root layout), and an admin-only "Check audit chain" button (system_admin, auditor, competent_authority) that calls GET /api/v1/audit/verify and shows "Intact" or the first broken seq. Hide the button when GET /api/v1/config/mode returns production. Put N66 code in client/src/additions/n66-integrity-banner/.
   - Vite dev proxy for /api to the server port.
   - Add an export-footer helper (server/src/modules/additions/n66-integrity-banner/exportFooter.js) that returns the "SYNTHETIC DATA" footer line, for every future export.
4. Tests for N66 in client/tests: "[A-N66] banner renders on every route" (render each route in the router) and "[A-N66] chain-check button hidden in production mode". Make the [S16] client check meaningful now that client/src exists: also fail on any localStorage/sessionStorage access at all in client/src.
5. S28 hardening: the logger only redacts by object key, so a string like logger.info("complaint: " + text) leaks. Make the logger refuse plain string arguments longer than 80 characters (replace them with "[REDACTED-STRING]") and add a test "[S28] long free-text strings are redacted".
6. README.md: prerequisites (Node 20+, MongoDB), install, cp .env.example .env, npm run reset, npm run dev, demo accounts table (username, role, bureau/region, password demo1234), npm test, node scripts/trace-check.js.
7. Run npm install, npm test (all green, none skipped, test-results/results.json created), then update FEATURES.md rows for F45, S01, S09, S16, S28, N48, N66 only (Status, Built in, Proved by, Notes; F45 stays BLOCKED-SOURCE with a note of what was built). Run node scripts/trace-check.js --stage S0 and paste the full output; it must say "No violations".

Report in the S0 report shape: DONE, BLOCKED-SOURCE, GAP, test counts, full trace-check output, how I can see it, suggested commit message.
