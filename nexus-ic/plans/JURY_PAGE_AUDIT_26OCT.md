# Page-by-page jury audit, 26 Oct 2026 (Claude)

**Method.** On http://localhost:5180 (the showcase copy, with the data Codex rebuilt overnight), I signed in as each of 9 accounts and opened 40 screens in a real Chrome. That gave 324 screenshots, which I reviewed as contact sheets. I also tested the college-name → PID/ICID search by hand.

**Rating scale.** Each screen is scored out of 10 as an international hackathon jury would see it. 9–10 means jury-ready. 7–8 means good with polish needed. 5–6 means it works but looks like a prototype. 3–4 means it hurts the score.

**Overall: 6.4 / 10.**
- The new shell, command centre, case page, guided walkthrough and registry search are strong (8–9).
- About half the screens are still old-style or show internal wording, so they read as an unfinished prototype.

## What makes it look fake, demo or empty (fix first)

1. **Sequential IDs.** PIDs run 1-1000000001, 1-1000000002 … 1-1000000120. College names repeat one stem across cities, for example "Arohan Vidyarekha College of Pharmacy" in Agartala, Gangtok and Kohima. A juror spots this in seconds.
2. **Internal wording on screen:**
   - The "Registry availability control / Registry Online" toggle on the registry page.
   - The blue developer link bar on the trust pages ("System Administrator", "Local OTP inbox"), shown to students and officers.
   - RuleBook raw JSON, including `"_comment": "not from source; replace with AICTE policy"`.
   - "EmailSimulator / SmsSimulator (sandbox until approved)" on Notifications.
   - "UNKNOWN NO_BENCHMARK_RUN" on the benchmark page.
   - The old ICID example "ICID-2024-001", which uses the wrong format.
3. **No SLA clock anywhere.**
   - Every case shows `POLICY_NOT_CONFIGURED`, and Overdue / Near due are always 0 or UNKNOWN.
   - The 23 Oct source defines the demo policy **DEMO-CASE-STANDARD-v1: 14 calendar days, near-due 72 hours** (SOURCE_23OCT_FERTXD.md, "Reference demo SLA event logic").
   - Configuring it turns on overdue and near-due counts, RESCUE alerts, SLA badges and escalation. This is the biggest single upgrade.
4. **Empty modules:**
   - Appeals ("No appeals"), RESCUE ("No alerts"), Insider alerts, Reveal requests, and Coordinations/Tasks for most institutions.
   - The integrity page has only 2 days of fingerprints.
   - The benchmark has never been run.
   - /impact/cases shows "No number selected" when opened directly.
5. **Triage looks broken.** 270 cases sit in "pending human triage", all LOW_CONFIDENCE at 50%. Routing confidence for the seeded data is wrong, so it reads as a failure.
6. **Wrong permission link.** The sidebar shows "Channels" to officers, but the page is complainant-only, so they get "Access Denied".
7. **Slow first paint.** The command centre KPI cards show grey skeletons for 4+ seconds on first load.

## Ratings by screen

| Screen | Who | Rating | What works | What hurts |
|---|---|---|---|---|
| Landing `/` | public | 8 | Hero, journey, modules, role cards | Needs live numbers and a real product screenshot strip |
| Login | public | 8 | Split layout, quick-fill roles | "Demo" quick-fill list on screen; usernames visible |
| Command centre `/dashboard` (officers) | supervisor, authority, RB, regional, auditor, admin | 8 | KPI cards, 6 charts, decision support, overlap banner | Slow first paint; Overdue tile UNKNOWN; queue table shows raw `POLICY_NOT_CONFIGURED` |
| Command centre (student) | student | 7 | My grievances list, file button | Only a plain list; no status timeline, no "next step" |
| Command centre (institution) | inst_admin1 | 4 | Hero | Only 2 tiles, no numbers, no charts |
| Track my cases `/track` | student | 5 | Correct cases | Plain text list, old style |
| My filed grievances `/my/cases` | student | 7 | Clean table | Duplicates /track; PID shown instead of college name |
| File a grievance `/grievances/new` | student | 7 | College picker, category, narrative, upload, PREVENT preview | Still shows the old manual PID box under the picker; no step indicator |
| Verify identity `/verify` | student/faculty | 4 | Works, consent first | Old style, developer link bar, raw selects |
| My consents | student | 4 | Correct data | Old style, link bar |
| Case page `/cases/:id` | officers | 9 | Master Case ID, PID + ICID check, source trail, routing reasons, ownership path, timeline, "Explain this case" | Routing note says "sent to human triage" on most cases (data issue) |
| Bureau / Cell queue `/cases` | officers | 6 | Real queue, four lanes | Wide raw table; case IDs not clickable; raw SLA codes |
| NEXUS PREVENT `/review` | officers | 5 | Correct seven-signal explanation | Raw text dump of scores; needs bars per signal |
| NEXUS SYNC `/sync` | officers | 6 | Picker, cases, coordination, notes | Empty coordinations and tasks for most colleges |
| NEXUS TRACE `/transfers` | officers | 7 | Four-step transfer timeline, accept/reject | Request form first; inbox below the fold |
| Leave `/leave` | officers | 6 | Works | Bare form, no list of current absences |
| Reveal requests | officers | 4 | Works | Old style, empty |
| Identity verification queue | RB, regional | 5 | Approve/reject with reason | Old style, link bar |
| Regional view `/regional` | regional, supervisor | 6 | Real charts | Fixed-width charts, "counts" axis labels |
| Triage `/triage` | supervisor, authority | 5 | Good table design | 270 low-confidence cases make routing look broken |
| Institution identity review | supervisor, regional | 7 | Clear PID/ICID conflict row | Only 1 row |
| RESCUE `/rescue` | supervisor | 3 | Scan button | Empty, no SLA policy |
| Appeals | supervisor | 3 | — | Empty |
| RuleBook `/rulebook` | supervisor, admin | 5 | Versions, approvals, tabs | Raw JSON with "_comment … replace with AICTE policy" |
| Insider alerts | supervisor | 4 | Scan button | Empty |
| Matcher benchmark | supervisor, admin | 3 | — | Unstyled, "UNKNOWN NO_BENCHMARK_RUN" |
| NEXUS IMPACT `/impact` | officers | 6 | Real data, drill-down | Old chart style; fixed 720px width; "counts" labels; no KPI cards |
| Reports `/reports` | officers | 6 | CSV export | Same charts as IMPACT; no report list |
| IMPACT drill-down `/impact/cases` | officers | 4 | Works from a chart | Opened alone it says "No number selected" |
| Audit trail `/audit` | auditor, admin | 7 | Hash chain intact, 1,300+ events | Raw IDs as targets; needs filters and a chain badge |
| Integrity `/integrity` | all | 5 | Daily root hash | Plain text; only 2 days |
| Authority workspace `/authority` | authority | 5 | Real counts | A wall of 70 case IDs; needs a decision queue |
| Institution workspace `/institution` | inst_admin1 | 4 | Real cases | Plain list, no institution header or numbers |
| Administration `/admin` | sysadmin | 5 | Accounts, logs, master data, backup tabs | Old style, link bar |
| Channels `/channels` | student | 4 | Correct content | Unstyled text; officers get Access Denied from the sidebar |
| Notifications | all | 6 | Real transfer notices | "EmailSimulator / SmsSimulator" text |
| Registry lookup `/institutions/lookup` | all | 8 | **Type a college name → PID, ICID, MATCH, region, auto-fetch checklist** | "Registry Online" toggle, old PID/ICID radio boxes, wrong ICID example, campus/district "not available" |
| Institution 360 `/institutions/:pid` | officers | 7 | IIC ID mapping, attention indicators, grievances, graph | Old style; old PIDs from earlier screenshots no longer exist |
| Guided Walkthrough `/judge` | all | 8 | 12 steps, one-click account switch, floating card | Steps still use PID 1-1000000001 |

## How each page works (end to end)

- **Landing and login.** Public. Choose a role card or a quick-fill account. Every account uses the password demo1234.
- **Command centre.** The first screen after login, different for each role.
  - Officers see live KPI cards and charts from NEXUS IMPACT, the overlap banner and their case queue.
  - Students see their grievances and a "File a grievance" button.
- **Verify identity (NEXUS TRUST).** The student gives consent and picks a reference. STUDENT-ACTIVE verifies through the ABC/APAAR simulator plus a local OTP. The officer-assisted path (MANUAL-PERSON-1) goes to the Identity verification queue, where rb_officer1 or regional1 approves or rejects with a reason.
- **File a grievance.**
  1. Pick the college by name, city or ICID; the PID and ICID fill in.
  2. Choose a category and write the narrative.
  3. Upload files; EXIF data is scrubbed.
  4. Press Preview, and PREVENT Stage 1 warns about similar open matters.
  5. Confirm. This creates the Master Case ID with a snapshot of the PID and ICID, and the RuleBook routes the case to a bureau with reasons.
- **Case page.** Officers see:
  - the case identity
  - the ICID check
  - the source trail
  - the routing rule and reasons
  - the ownership path across bureaus
  - a dated timeline beside the audit-chain entries
  - "Explain this case"
- **NEXUS PREVENT.** Lists potential overlaps with the seven-signal scores. It is advisory only and never blocks or merges.
- **NEXUS SYNC.**
  - Pick an institution to see every case on it across bureaus.
  - Record multi-bureau agreements and send blind notices.
  - Keep internal notes that complainants never see.
- **NEXUS TRACE.** Request a transfer with a reason. The receiver accepts or rejects. The sender stays accountable until the receiver accepts, and a transferred case never reverts to Submitted.
- **Triage.** Cases below the RuleBook confidence threshold wait for a human to assign or override.
- **RESCUE / Appeals / Insider alerts.** Stalled-case scans, complainant appeals and unusual-access detection. All three are empty today.
- **IMPACT / Reports / Regional.** Counts with numerator, denominator and scope. Every bar opens the cases behind it. CSV export is available.
- **Authority workspace.** Closures and escalations that need a different approver.
- **Audit and integrity.** Every action is in a SHA-256 hash chain, with a daily root fingerprint.
- **Registry lookup.**
  1. Type a college name, city, state, PID or ICID.
  2. Pick a result to get its PID, ICID, ICID check, region and the auto-fetch checklist.
  3. "View Institution 360" opens the institution view.

## On "find my own college"

The registry holds 120 fictional colleges, so your real college will not appear. To make real colleges findable, the project needs an official list of institutions (name, PID, state, and ICID where published), taken from AICTE or IIC sources and imported with the existing admin import. Grievances must still never be attached to real colleges. The Codex prompt includes this as an option that waits for you to supply the list.
