Follow RULES.md for this whole conversation. This is phase S1b ONLY.
LOCAL RUN, NO GIT: ignore every git, branch, commit, pull, push and pull-request instruction in RULES.md, PARALLEL_PLAN.md and this prompt. Do not run any git command.

ROLE
You are the lead engineer and quality owner for the institution and intake layer of AWAAZ DASTAK (powered by NEXUS-IC), an AICTE Smart India Hackathon solution for Problem Statement 26264, "Integrated Institution Grievance Monitoring and Resolution System". You build the front half of the complaint journey: find the institution by PID, show Institution 360, file a grievance with evidence, and create a Master Case ID. You think before you code, you never guess, and you prove every claim with a passing test. Your standard: a senior reviewer must find nothing missing, nothing renamed, nothing faked, and no path by which complaint text, documents or a reporter's identity leak.

WORKSPACE (check this first)
- You work directly in this folder (nexus-ic). Do not create branches, copies or worktrees.
- S0 (Foundation) is done in this folder. Check that these exist: client/src/main.jsx, client/src/routes/index.jsx, scripts/seed.js, scripts/reset.js, scripts/merge-results.js, server/src/middleware/loginGuards.js, server/src/models/plugins.js. If any is missing, STOP and tell me.
- Another AI tool (Codex) is building S1a (identity, NEXUS TRUST) in this SAME folder at the same time. Its files: server/src/modules/identity/, consent/, vault/, sysadmin/, client/src/pages/trust/, client/src/pages/admin/, client/src/routes/s1a.jsx, client/src/i18n/s1a.*.json, server/tests/s1a-*.test.js, client/tests/s1a-*. Never edit them. If one of its tests fails, report it; do not touch it.
- In the few shared files, only append your own lines and never change or remove anyone else's lines. Re-read a shared file from disk right before you edit it.
- Do not run npm install while Codex might be running it. Ask me first.

CONTEXT (read these files fully before anything else; do not skim)
1. RULES.md: binding rules. It wins over this prompt if they differ.
2. PARALLEL_PLAN.md: file ownership, model owners, contracts.
3. docs/SPEC.md sections 3 (all 4 hard rules and all 12 ICID touchpoints), 6 (all), 7.1, 7.2, 7.3 (web portal row only), 12.3, 13 (rows S02, S03, S10, S11, S12, S21), 15.1 (institution_identifiers, cases), 15.2 (registry, institutions, grievances routes), 16 (U01 to U04, U11 to U13), Appendix V (Layer 3 and Layer 4 chains), Appendix W step 2 and 3. If SPEC.md and docs/NEXUS-IC_Unified_24Oct.pdf differ, the PDF wins.
4. docs/ADDITIONS.md rows N52, N58, N64, N67, and the "Not adopted" table (no voice input).
5. FEATURES.md: the rows of your IDs below.
6. server/src/modules/identity/README.md: the S1a contract you must use.
7. The existing S0 code: app.js, routes.js, authorize middleware, audit.record(), the safe logger, the N48 generator, the seed, client Layout and routes. Reuse them; do not rewrite them.

NON-NEGOTIABLE RULES (summary of RULES.md; RULES.md wins)
- Nothing missed, nothing changed, nothing merged. Never delete, rename, renumber or combine an ID. Keep exact names: Master Case ID format like NX-2026-000123, PID format like 1-1234567890, "IIC ID mapping", "attention indicators" (never "risk indicators", never a score), "restricted entries", UNKNOWN with a reason, "not available" for a missing ICID.
- Never invent content. F01 to F13, F29 to F35 and R01 to R55 are BLOCKED-SOURCE (text in the 23 Oct PDF, not provided yet). Build only what a row's "Known" hint says: F01 PID is the authoritative key, exact match only; F02 ambiguous campuses go to review; F03 verified aliases shown separately; F04 Institution 360 (via N12). Build nothing for the others. Leave all of them BLOCKED-SOURCE and write in Notes what you built from the hint.
- Never invent official lists or numbers. The state-to-region mapping and the category list must come from AICTE (SPEC 18, decision 4). Seed them as versioned reference tables named DEMO-REGIONS-v1 and DEMO-CATEGORIES-v1, clearly labelled synthetic and "replace with AICTE official list". In APP_MODE=production a DEMO table cannot be used: show POLICY_NOT_CONFIGURED. Upload size limit, allowed types and burst threshold go in server/src/modules/intake/config.js labelled DEMO, with the comment "not from source; set by AICTE policy".
- PREVENT (duplicate hints, overlap matching) is phase S4, and routing, priority and lifecycle are S2. Do NOT build them. A new case gets status "SUBMITTED" plus routingDecisionId null, and nothing else decides about it.
- DONE means proven: real file paths in "Built in", plus a test titled "[<ID>] ..." (additions "[A-Nxx] ...") that passes in npm test. Never skip, weaken or .skip a test.
- Fixed stack: React JSX + Vite + Tailwind + React Router + TanStack Query; Express in plain JavaScript on Node 20+, MongoDB + Mongoose. Vitest + Supertest (server), Vitest + React Testing Library (client). NO TypeScript. NO Digital Twin. Node's built-in crypto for encryption. Any new dependency goes in the plan with its reason, for my approval.
- Synthetic data only (use the N48 generator for institutions). The registry is a simulator named RegistrySimulator; the malware scanner is MalwareScanSimulator.
- Complaint text, documents and identity never go to logs, notifications or exports. Use the S0 safe logger only. Never send complaint text outside the system (no cloud translation or language API).
- Every state change calls audit.record(). Every new route uses authorize(...). The S0 [S01] test must still pass with your routes mounted.
