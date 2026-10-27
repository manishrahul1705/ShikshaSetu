# NEXUS-IC additions (approved by Manish, 24 Oct 2026): N46–N67

These are **on top of** docs/SPEC.md. (N67 added 24 Oct at Manish's request.) They never change, replace, merge or renumber anything in SPEC.md.

Ground rules for every addition:
- An addition may *read* data an existing feature produces. It may never change how that feature decides, scores, routes, closes or shows anything.
- Each addition's code lives in its own module or component, named after its ID (for example `server/src/modules/additions/n51-retaliation-watch/`).
- Each addition has its own acceptance test, titled `[A-Nxx] ...`. The U01–U32 suite stays untouched and must still pass.
- N46 Judge Demo Mode and N66 chain-check button are hidden in production mode.
- N36–N45 are RESERVED (features from Manish's earlier chat; text not yet supplied). Do not build or invent anything for them.

## Adopted (build these)

| ID | Feature | How it works | Guardrail | Stage | Test |
|---|---|---|---|---|---|
| N46 | Judge Demo Mode | One click resets demo data and plays a captioned guided tour of the two-bureau overlap scenario | Demo-only route, disabled in production mode | S6 | A-N46 |
| N47 | Click any number to see its cases | Every dashboard count opens the exact list of cases behind it, filtered by the viewer's own access rights | Same query builder (PDF 4.9) and ABAC; shows nothing new | S6 | A-N47 |
| N48 | Realistic test-data generator | Thousands of synthetic complaints with typos, acronyms and Hindi and Tamil spellings | Synthetic only; also feeds the accuracy benchmark | S0 | A-N48 |
| N50 | Overlap timeline view | Two bureaus' actions on one institution side by side, conflict points marked | Read-only view of existing PREVENT and SYNC data | S6 | A-N50 |
| N51 | Retaliation Watch | After a complaint, the N01/N02 simulators re-check the complainant's enrolment or employment. A sudden suspension, expulsion or termination sends a private "possible retaliation, review" alert to the Competent Authority | Advisory only, a human decides; only for complainants with a recorded N07 consent for this purpose; names no guilt | S5 | A-N51 |
| N52 | Hidden-data scrubber for uploads | Strips GPS, device, author and edit history from photos and PDFs before officers or institution admins see them. The original is sealed in storage with its hash | Adds to S12 without changing it; original evidence kept | S1 | A-N52 |
| N54 | Insider-access alerts | RuleBook thresholds (new rule family `DEMO-INSIDER-v1`) flag bulk case opening, out-of-scope search attempts, unusual exports and repeated reveal requests to the supervisor | Warning only, never blocks an officer; rule-based and visible | S3 | A-N54 |
| N55 | Leak-trace watermark on exports | Each export carries a visible "exported by office/role at time" footer and an invisible per-export code stored in an `export_log` collection | Contains no reporter identity (S06, S25 hold) | S5 | A-N55 |
| N57 | Daily integrity fingerprint | Each day the audit chain's root hash is written to a read-only `/integrity` page | Adds outside proof to S09; still no blockchain claim | S6 | A-N57 |
| N58 | Quick-exit button | On sensitive-category complainant pages, one button hides the page and opens a neutral site | No data effect | S1 | A-N58 |
| N59 | Silent co-signing | Other verified students of the same institution can back an existing issue anonymously. Officers see a count such as "14 verified co-signers", never names | Information only; does NOT change the N19 priority formula or the PREVENT result | S4 | A-N59 |
| N60 | Absence-aware ownership | When an officer marks leave or is moved, every case they own must be handed over through NEXUS TRACE first | Uses N20 unchanged | S3 | A-N60 |
| N61 | Cross-institution pattern alert | Flags the same issue concept rising across many institutions in one region and suggests a policy review, citing the cases | Feeds N26 under E09 safeguards: cites rows, shows denominator, labelled synthetic | S6 | A-N61 |
| N62 | Redaction helper | Highlights names, roll numbers and phone numbers before a case enters the institution-facing form; officer confirms each | Tool only; the 12.3 redaction rule is unchanged | S5 | A-N62 |
| N63 | Case receipt with QR | Complainant downloads a receipt with Master Case ID and status history; the QR opens /track/:caseId after login | No internal notes; login still required (S21) | S5 | A-N63 |
| N64 | Hindi and English interface | Every complainant page and the grievance form work in Hindi and English (i18n files) | Labels only; data and rules unchanged. NO voice input | S1 | A-N64 |
| N65 | RuleBook what-if preview | Before approval, shows which open cases would change route or SLA under the new rule version | Read-only view of the existing dry-run | S2 | A-N65 |
| N67 | Multilingual complaints in the grievance form | The complaint text can be written in any Indian language and script (all 22 scheduled languages plus English, Unicode). The form records the language chosen or detected (detected locally, on the server), stores the original text unchanged, and shows officers a language tag next to it | The original text is never altered. No outside cloud translation, because complaint text must not leave the system (S04, S28). PREVENT and overlap matching rules stay as written in SPEC | S1 | A-N67 |
| N66 | Synthetic-data banner and chain-check button | Every screen and export says SYNTHETIC DATA; one button rechecks the audit chain and shows the first broken entry, if any | Display only | S0 | A-N66 |

## Not adopted (do NOT build)

| ID | Feature | Reason |
|---|---|---|
| N49 | Works on weak internet (offline sync) | Case and reporter data would sit on officer laptops (against S07, S10); sync conflicts could break N20's one-owner rule |
| N53 | Decoy records (honeytokens) | Fake cases risk leaking into counts; clashes with "completeness is never faked" and "every figure from an actual run" |
| N56 | Passkey login for officers | Demo-day setup risk; S14 OTP/MFA already covers it |
| N64 voice part | Voice input on grievance form | Browser speech input sends audio to an outside cloud service (against S04, S28) |

## Problem-statement features (approved by Manish, 26 Oct 2026)

| ID | Feature | How it works | Guardrail | Stage | Test |
|---|---|---|---|---|---|
| N81 | Live conflict warning inside the officer action form | Run PREVENT Stage 2 before institution actions; show scoped related actions, signals, counter-signals, SYNC link and reasoned proceed | Advisory only; never blocks; reason and proceed are audited | PS | A-N81 |
| N82 | One combined request to the institution | Bureaus confirm/withdraw their own open query and document request items; issue one reference and route each reply to its owner | Per-item ownership, RuleBook reply dates, independent items, no reporter identity to institution | PS | A-N82 |
| N83 | Submit once institution document locker | Institution nodal officer stores versioned documents once; a one-case, one-officer expiring grant can be revoked | Existing encrypted storage, malware scan, hash and N52 scrubber; audited access | PS | A-N83 |
| N84 | Today vs with AWAAZ DASTAK replay | Guided two-column story compares a scripted fragmented scenario with actual coordinated records | Distinguish sources; do not claim measured savings | PS | A-N84 |
| N85 | Problem-statement coverage page | Link problem needs, workflow steps and role actions to implementation, routes and merged test results | Planned work has a reason; no fake pass marks | PS | A-N85 |
| N86 | What happens next on student tracking | Show truthful status, accountable office/role, next step, policy clock, history and N70 query inbox | Student sees own case only; no internal data | PS | A-N86 |
| N87 | Monthly pendency report | Scope monthly pending, disposed, transfers, escalations and ageing; reconcile opening and closing balances | Existing IMPACT builder, ABAC and N55 watermark; no scores | PS | A-N87 |
| N88 | Institution's own redressal step | Record optional college committee/ombudsperson step; show raw response counts in Institution 360 | Advisory until Manish supplies regulation text; never reject or delay intake | PS | A-N88 |
| N89 | Officer workload and handover suggestions | Show bureau workload and leave; let supervisor confirm a TRACE handover suggestion | RuleBook threshold only; no automatic reassignment; TRACE unchanged | PS | A-N89 |

## Complete-fix features (approved by Product Owner, 26 Oct 2026)

| ID | Feature | How it works | Guardrail | Stage | Test |
|---|---|---|---|---|---|
| N90 | College name auto-fetch everywhere | Typing college name, city, state, PID or ICID populates PID, ICID, verification status, region, state and district without extra clicks | Bounded results, PID authoritative, ICID only corroborates | CF | A-N90 |
| N91 | ABC ID and APAAR ID verification (simulated) | Real inputs for APAAR/ABC ID and faculty staff ID with client/server format checks and simulated registry verification | Clearly labelled simulated; synthetic IDs only; stores only encrypted vault tokens | CF | A-N91 |
| N92 | ICID-based regional routing to Regional Grievance Cell | Automatically resolves college region and routes case to the corresponding Regional Grievance Cell | RuleBook rule DEMO-REGIONAL-ROUTE-v1; human triage fallback; never guesses | CF | A-N92 |
| N93 | Realistic, fast status updates | Dynamic complainant status stepper mapped to real recorded milestones with officer action recording | Never reverts; office and role displayed without personal names; refetch/short polling | CF | A-N93 |
| N94 | India map with college region marked | Offline illustrative regional map highlighting institution region and caseload | Local SVG; zero network/tiles; official boundary validation pending | CF | A-N94 |
| N95 | Saffron across every page | Consistent application of saffron tokens for eyebrows, buttons, active nav, focus rings and stripes | WCAG AA contrast compliance; tricolour aesthetic | CF | A-N95 |
