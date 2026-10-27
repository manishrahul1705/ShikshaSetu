Follow RULES.md and AGENTS.md for this whole conversation unless I write "override rule N" below. You are GitHub Copilot (agent mode) working in the nexus-ic folder of AWAAZ DASTAK (powered by NEXUS-IC), AICTE SIH PS 26264.

OVERRIDES I GIVE (only these)
- Override Rule 5, on-screen labels only: remove on-screen "SYNTHETIC DATA" / "Fictional demo data" banners, badges and footers from the jury UI, as the Final Polish phase already did. KEEP the disclosure in docs/LIMITATIONS.md, docs/JUDGE_SCRIPT.md and docs/JUDGE_QA.md. The spoken script says the case and student data are a demo dataset.
- NOT overridden: the identity check keeps a small "Simulated check" tag (it must never look like a real UIDAI/ABC verification), and the live-lookup stub keeps "awaiting official API access".
- Override Rule 8 for docs/ only: you may update docs/LIMITATIONS.md, JUDGE_SCRIPT.md, JUDGE_QA.md, JURY_DEMO_GUIDE.md and docs/screenshots/README.md.

LOCAL RUN, NO GIT: run no git command. No npm install, no downloads, no new dependency unless I approve the exact package in this chat.
ADD AND FIX ONLY: no existing feature, page, route, field, role, test, ID or stored state may be removed, renamed or changed in behaviour, except the on-screen labels named above. Never skip, weaken or delete a test. If an existing test asserts a label you are removing, stop and ask me.

WORKSPACE FIRST
1. Ask me: "Are Claude and Codex closed or idle for this folder?" Wait for yes. Only one AI tool may work here at a time.
2. PowerShell: Get-Process node, npx, vitest, playwright -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, StartTime, Path. Then list files changed in the last 15 minutes (excluding node_modules). Stop and tell me if another tool or test run is active.
3. Never reset or reseed awaaz_dastak_demo. Rebuild awaaz_dastak_showcase (npm run showcase:seed) only after I say yes here.

READ FIRST
RULES.md, FEATURES.md, plans/FINAL_INTERACTIVE.md, plans/NEXT_STEPS.md, plans/CODEX_FINISH_FINAL_INTERACTIVE_PROMPT.md (the remaining feature list), and these files:
- server/src/modules/registry/ (smartSearch.js, search.js, adapters.js, catalogue.js, OfficialInstitution.js, registryRoutes.js)
- server/src/modules/identity/simulators.js, selfCheck.js
- client/src/components/IndiaMap.jsx, InstitutionPicker.jsx, InstitutionDetailsCard.jsx
- scripts/showcase-seed.js

PART 1. REAL COLLEGE LIST (no scraping)
- Do NOT fetch, scrape or call any AICTE, IIC or college website. Real colleges come only from the official list file I download myself and import through the existing screen /admin/registry/import (N98, CSV).
- Write docs/IMPORT_AICTE_LIST.md with my exact steps:
  1. Download the approved-institutions list from the official AICTE portal.
  2. Save it as "CSV UTF-8".
  3. Sign in as sysadmin1 → Official list import → enter the list date → Dry run → Confirm.
- Open the CSV I put in data/official/ (if present). Report its real column headers and ID formats. If the AICTE PID or IIC ID format differs from the current validators (PID 1- plus 10 digits; ICID IIC- plus 8), show me the real format and ask before changing a validator. Never guess.
- After import, prove: searching "sece" and "Sri Eshwar College of Engineering" returns the real row, with screenshots.
- Keep the existing guard: a demo grievance can never name a real imported college (assertNotRealListInDemo). Demo cases stay on the fictional catalogue, so no real college is shown with made-up complaints.

PART 2. SYNTHETIC DEMO DATASET (generated, never real people)
- Extend the generator (server/src/modules/additions/n48-data-generator and scripts/showcase-seed.js) to produce, deterministically from a seed:
  - fictional institutions (keep the 120-institution catalogue);
  - synthetic students with synthetic 12-digit ABC IDs that start with "1000" (the existing registry style), each with a name from a fixed fictional name list, an institution PID from the fictional catalogue, a programme and an enrolment status (active, inactive, mismatch, manual review);
  - matching synthetic Aadhaar-style test numbers using selfCheck.js's rule (start with "1", Verhoeff check digit), so no number can be a real Aadhaar;
  - cases across all statuses (submitted, forwarded, under review, action taken, completed) for every region, with regional queues, notifications, appeals, alerts and 30 days of activity.
- Store students in the simulator registry module (not in identity_vault, never plaintext numbers in logs). Self-check (N99) and the existing ABC path must work for every generated student.
- Tests titled [A-N103] (the next free ID; add a FEATURES.md row): deterministic output, every ABC ID 12 digits starting 1000, every Aadhaar-style number starts with 1 and passes Verhoeff, no real-college PID used in any generated case, and a self-check succeeds for a sample of generated students.
- Ask me before running npm run showcase:seed.

PART 3. ALL REMAINING IMPLEMENTATIONS
Do Steps 0, A, B, C and D exactly as written in plans/CODEX_FINISH_FINAL_INTERACTIVE_PROMPT.md:
- Step 0: the trace-check range and regex edit (I approve it).
- Step A: N92 regional cell referral, accepted by a human regional officer.
- Step B: N101 no empty pages.
- Step C: N102 interactive tables and saffron.
- Step D: full proof with screenshots and 3 rehearsals.

PART 4. INDIA MAP WITH CORRECT BORDERS, MORE INTERACTIVE (N104)
- Correct borders need an official outline. Do NOT hand-draw, trace or download one yourself. I will put a Survey of India–compliant GeoJSON (states and UTs, including Jammu and Kashmir, Ladakh with Aksai Chin, Arunachal Pradesh, Andaman and Nicobar, Lakshadweep) at client/public/maps/india-states.geojson, with its source and licence noted in docs/MAP_SOURCE.md.
- If that file is absent, stop Part 4, keep the current map and its label "Illustrative map, boundaries not official", and tell me.
- When the file exists: extend IndiaMap.jsx (replace nothing).
  - Render each state as its own SVG path with a small hand-written projection (no new package unless I approve d3-geo).
  - Hover shows state, region and college count; click selects the state and lists its colleges; keyboard focus and Enter work.
  - Zoom and pan with buttons, mouse wheel and pinch; reset; a region legend in accessible colours with the selection in saffron.
  - Smooth motion-safe transitions; tap targets of at least 40 px at 390 px width.
  - College pin at state level unless the record has real coordinates.
  - Change the label to "Boundaries: Survey of India (source in docs)" only when the official file is used.
- Tests [A-N104]: state paths render from the GeoJSON, hover and click select, zoom and reset, pin, and the label switch depends on the file.

HARD RULES
- Never invent a PID, ICID, coordinate or any detail for a real college.
- Never call UIDAI, DigiLocker, ABC, APAAR, AICTE or IIC systems, and never scrape.
- No complaint text, OTP, Aadhaar or ABC number in logs, screenshots or reports.
- audit.record() on every state change; authorize() on every route; canAccessCase on case reads; no automatic closure, rejection or ownership move.
- Unconfigured policy stays POLICY_NOT_CONFIGURED; missing values show UNKNOWN with a reason.

TESTS AFTER EVERY PART (PowerShell, no other runner active)
  $env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017"; $env:TEST_DB_NAMESPACE="cp_run1"; npm test --workspace=server -- --maxWorkers=2
  npm run test:client
  node scripts/merge-results.js
  node scripts/trace-check.js
Use a new namespace each run. Last known green: server 291/291, client 97/97. Finish with 0 failed, 0 skipped, "No violations", and cd client; npm run build succeeding.

FINISH: write plans/COPILOT_REPORT.md (what was done, test totals, what is waiting on me) and keep a dated log in plans/FINAL_INTERACTIVE.md.
