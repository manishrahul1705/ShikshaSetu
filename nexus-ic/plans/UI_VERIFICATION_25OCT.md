# UI verification, 25 Oct 2026 (Claude, browser pass)

How it was checked: logged in as all nine demo roles in a real Chrome (Playwright, read-only) against http://localhost:5173 and the shared demo database `awaaz_dastak_demo`, opened 32 screens per role, and took screenshots. No data was changed. Some "Loading..." results came from the backend restarting while other tools edited server files; those screens were re-checked by hand.

## Headline result

Most features are built and reachable, but a jury would not see them, for three reasons:

1. **The demo data hides the features.** The shared demo database has 6 cases, and all 6 point to PID `1-1000000001`, which is not in the institution registry (the 10 registered institutions have other PIDs). So on every case the institution name, ICID and region show "not available" or UNKNOWN, Institution 360 and NEXUS SYNC for that institution fail with "Failed to load institution", 5 of 6 cases are in region UNKNOWN, nothing is disposed (resolution time UNKNOWN), and no case has an SLA clock (POLICY_NOT_CONFIGURED). RESCUE shows "No alerts" and Appeals "No appeals".
2. **Officers have no case page.** `/track/:caseId` is complainant-only, so every case link on the officer dashboard and in the overlap banner opens "Access Denied" for officers.
3. **Navigation hid ~30 screens.** The old header had Home, Dashboard and Logout; most modules were reachable only by typing URLs or from a row of plain link buttons.

## Feature by feature

| Feature | Built? | Visible to a jury before this pass? |
|---|---|---|
| ICID (N09, U01–U04) | Yes | Partly. Visible in registry lookup (PID or ICID search), Institution 360 "IIC ID mapping" (checked: PID 1-8177066976 → IIC-228M6C2D), identity review queue and the intake form. Not visible on any case, because no demo case carries an ICID, and officers cannot open a case. Global search by ICID did not exist in the UI. |
| Source tracing / provenance (F48, R05) | Data model only | No. Cases store `channel` and `externalRefs`, and the CSV import screen lists source refs, but no screen shows a case's source trail to an officer. |
| Case timeline | Partly | The complainant status card exists; there is no officer case timeline. Transfer timeline exists inside NEXUS TRACE. |
| NEXUS PREVENT overlap banner | Yes | Yes on dashboard, Institution 360 and /review, but with 0 pairs in the demo data it does not appear. |
| NEXUS SYNC, TRACE | Yes | Yes, but SYNC fails for the demo institution (unregistered PID). |
| NEXUS IMPACT, Reports, Regional | Yes, with Recharts | Yes, but charts are near-empty with 6 cases. |
| RESCUE, Appeals | Yes | Empty states only. |
| Audit trail, integrity fingerprint | Yes | Yes (hash chain intact, 200+ events). Integrity page is plain text. |
| Judge Mode (/judge) | Yes | A text stepper that asks the judge to log out and log in as another user at each step. |
| Student filing | Yes | student1 is unverified, so "File grievance" first sends them to verification (by design); their case list is empty. |
| Matcher benchmark | Yes | Page stayed blank in the check (did not finish loading). |

## Done in this pass (UI only, no data changes)

- Design system: navy, saffron and India-green tokens, Inter / Plus Jakarta Sans / JetBrains Mono, restyled tables, inputs and cards across every existing page.
- App shell: role-aware sidebar listing every module the role may use, global search (Master Case ID, PID, or ICID resolved to its PID), one-click "View as" demo account switcher (demo mode only), language toggle, notifications.
- New landing page and login page.
- Dashboard rebuilt as a command centre with KPI cards and Recharts (status, bureau workload, regions, monthly trend, top institutions with PID and ICID, decision support), keeping UNKNOWN values as UNKNOWN.
