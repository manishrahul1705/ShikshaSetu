# Judge script: 5-minute AWAAZ DASTAK demo (powered by NEXUS-IC)

Spoken disclosure is mandatory before the walkthrough: this is a prototype using sample data and fictional institutions and complaints; all external integrations are simulators, not live government connections.

Prepare the approved showcase using `npm run showcase:seed` only after Manish authorizes the rebuild. Do not reset the shared demo database. Open **Guided Walkthrough** (N46). Manish's 25 October 2026 override removes on-screen data labels; the presenter must state: **"This prototype uses sample data and fictional institutions and complaints. External integrations are simulators; no live AICTE, CPGRAMS, ABC/APAAR or SMS access is claimed."** The polished interface is not evidence of deployment approval or real-world savings.

The story is one student, one institution and two bureaus, with nothing lost and nothing faked.

| Time | Who is logged in | Show | Say (one line) | IDs proven |
|---|---|---|---|---|
| 0:00–0:20 | (landing page) | AWAAZ DASTAK title, "powered by NEXUS-IC", and the taglines: "One Institution, One View, One Complaint Journey, Real Resolution" | "AWAAZ DASTAK means a voice that knocks. AICTE's bureaus each see a piece of an institution. We give them one view and one accountable journey." | 4 |
| 0:20–0:50 | Student | NEXUS TRUST: ABC/APAAR simulator, enrolment check, OTP to the local sink, consent screen. Then show the reporter ID RP-xxxx | "Verified, not anonymous to the system, but pseudonymous to everyone who doesn't need to know." | N01, N04, N06, N07 |
| 0:50–1:20 | Student | Search Lucknow and choose Arohan Vidyarekha Institute of Engineering (PID 1-1000000001) → auto-fetch panel with ICID, region, approval status. Switch to Hindi (N64) | "The PID is authoritative. The ICID only corroborates it, and a mismatch goes to review, never auto-fixed." | N09, N10, N11, N64 |
| 1:20–1:50 | Student | Fill the grievance form, upload a photo (show GPS stripped, N52), preview, edit, confirm. PREVENT Stage 1 hint appears: "a similar open matter exists". Proceed anyway. Master Case ID NX-2026-xxxxxx | "We warn about duplicates but never block, and we never show someone else's complaint." | N13, N14, N16, N52, S23 |
| 1:50–2:20 | Officer, bureau A | Routing decision: primary, secondary, confidence, reason, Routing rule v1 (stored ID DEMO-ROUTE-v1). Priority with its reason | "Every route is explainable. Rules first, a human for anything ambiguous." | N18, N19, N27 |
| 2:20–3:00 | Officer, bureau A | Institution 360 → banner "Potential Overlapping Cases – Coordination Required". Overlap timeline (N50) shows bureau B already asked for the same documents. PREVENT Stage 2 says REVIEW with reasons and counter-reasons | "Two bureaus were about to ask the same college for the same thing. Now they coordinate first." | N12, N17, N50, 8.3 |
| 3:00–3:30 | Officer A, then bureau B | NEXUS TRACE: transfer requested → acceptance pending (sender still accountable) → bureau B accepts → new owner active. Show the history and the escalation timer | "No transfer is complete until it's acknowledged. The owner is always visible, so nothing is lost." | N20, N21 |
| 3:30–4:00 | Officer B, then supervisor | Try to close → gate blocks with the list of what's missing. Attach evidence, propose; a different officer approves. Case closed | "The system never closes a case itself, and no one approves their own closure." | N22, S20 |
| 4:00–4:20 | Student | /track/:caseId: true status history, owner as office and role, no internal notes. Download the QR receipt (N63). Leave feedback | "The student sees the real status, never a false closure." | N28, N29, N23, N63 |
| 4:20–4:45 | Competent Authority | /authority and /impact: every percentage with numerator and denominator. Click a number → its exact cases (N47). RESCUE alert list | "Every figure comes from the recorded prototype data, with its scope and denominator. As disclosed at the start, these are fictional records, not pilot outcomes." | N24, N26, N47, 12.2 |
| 4:45–5:00 | Auditor | Press "Check audit chain" → intact. Show the /integrity fingerprint | "Every action is attributed and tamper-evident. We witness, we never judge." | S09, N57, N66 |

## 90-second PS story segment (N81–N89)

**5:00–6:30 — One institution, one accountable request**

Sign in as `rb_officer1`, open `/queries/NX-2026-000018`, choose Institution and enter `Fee notification`. Submit once to run the check. PREVENT Stage 2 checks the action before submit. Pause at **Potential overlapping action**: read the other office, action, date and case reference, then point to the evidence and the counter-signals. Select **Coordinate via NEXUS SYNC** and show both cases together. Explain that the check advises; an officer still decides. Return and proceed only if needed, with a recorded reason.

In SYNC, show each bureau confirming only its own request items. Issue the single combined request; the institution answers item by item, and each answer returns to its owning case. Reuse a previously submitted locker document by granting one officer access for one case, with an expiry. Then switch to the student: show the current status, accountable office and role, next step, policy clock, history and open AICTE query. No reporter identity or internal note is present.

Close with the Competent Authority monthly report. Choose the month and scope, check the opening-to-closing reconciliation, and open one count into its cases. If the report marks historical evidence incomplete, explain that imported Closed states have no PROOF packet; do not claim a certified reconciliation. Finish on **Today vs with AWAAZ DASTAK**. The left side is labelled **Illustrative scenario**; the right side comes from the current recorded run. Read each source label aloud. These counts compare the scripted scenario with records shown here; they are not measured savings or AICTE outcomes.

## Backup answers for judges
- **"How is this different from CPGRAMS?"** CPGRAMS receives complaints. NEXUS-IC coordinates many AICTE bureaus around one institution so they don't duplicate, contradict or lose each other's work. It imports CPGRAMS references instead of replacing them.
- **"Where is the AI?"** It's in explainable routing confidence, intake and overlap matching with a semantic signal, and sensitivity detection. Humans confirm every one of them. Show the N48 benchmark accuracy with its denominator.
- **"Is this real AICTE data?"** No. Everything is synthetic, and the real integrations are contract-gated (SPEC 1).
- **"What if a bureau ignores a transfer?"** It escalates after the RuleBook window, and RESCUE alerts the supervisor.

## Before going on stage
- [ ] `npm run reset` done on the demo laptop. The judge flow test `[JUDGE]` passed three times in a row.
- [ ] Demo accounts printed on one card.
- [ ] Screenshots in docs/screenshots/ as a backup if the laptop fails.
