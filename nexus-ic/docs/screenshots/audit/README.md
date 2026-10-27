# Global Jury browser evidence

Recorded against the dedicated local showcase. Screenshots mask input values and protected text before capture. Evidence records preserve failures; a passing automated check does not assign a visual design score. Desktop is 1440 × 1000; mobile is 390 × 844.

Latest per-page records: 40; passed 27; failed 13.

| Viewport | Role | Route | Content ready | Result | Screenshot |
|---|---|---|---:|---|---|
| desktop | supervisor | / | 2170 ms | PASS | [Open](desktop/supervisor/landing.png) |
| desktop | supervisor | /login | 895 ms | PASS | [Open](desktop/supervisor/login.png) |
| desktop | supervisor | /dashboard | 2274 ms | FAIL: Banned visible wording: POLICY_NOT_CONFIGURED | [Open](desktop/supervisor/dashboard.png) |
| desktop | supervisor | /verify | 1308 ms | FAIL: Banned visible wording: simulator, POLICY_NOT_CONFIGURED; Console: Failed to load resource: the server responded with a status of 404 (Not Found) | [Open](desktop/supervisor/verify.png) |
| desktop | supervisor | /my/consents | 686 ms | FAIL: Banned visible wording: POLICY_NOT_CONFIGURED; Console: Failed to load resource: the server responded with a status of 404 (Not Found) | [Open](desktop/supervisor/my-consents.png) |
| desktop | supervisor | /officer/reveal-requests | 1028 ms | PASS | [Open](desktop/supervisor/officer-reveal-requests.png) |
| desktop | supervisor | /dev/otp-inbox | 613 ms | PASS | [Open](desktop/supervisor/dev-otp-inbox.png) |
| desktop | supervisor | /institutions/lookup | 800 ms | PASS | [Open](desktop/supervisor/institutions-lookup.png) |
| desktop | supervisor | /institutions/:id | 1840 ms | FAIL: Banned visible wording: simulator | [Open](desktop/supervisor/institutions-id.png) |
| desktop | supervisor | /review/identity | 774 ms | PASS | [Open](desktop/supervisor/review-identity.png) |
| desktop | supervisor | /my/cases/:caseId | 812 ms | PASS | [Open](desktop/supervisor/my-cases-caseId.png) |
| desktop | supervisor | /rulebook | 1053 ms | PASS | [Open](desktop/supervisor/rulebook.png) |
| desktop | supervisor | /triage | 910 ms | PASS | [Open](desktop/supervisor/triage.png) |
| desktop | supervisor | /transfers | 1696 ms | PASS | [Open](desktop/supervisor/transfers.png) |
| desktop | supervisor | /sync/:institutionPid | 847 ms | PASS | [Open](desktop/supervisor/sync-institutionPid.png) |
| desktop | supervisor | /sync | 3040 ms | FAIL: Content not ready within 3000 ms; Content deadline exceeded: 3040 ms | [Open](desktop/supervisor/sync.png) |
| desktop | supervisor | /queries/:caseId | 743 ms | FAIL: Console: Failed to load resource: the server responded with a status of 404 (Not Found) | [Open](desktop/supervisor/queries-caseId.png) |
| desktop | supervisor | /fieldwork/:caseId | 765 ms | FAIL: Console: Failed to load resource: the server responded with a status of 404 (Not Found) | [Open](desktop/supervisor/fieldwork-caseId.png) |
| desktop | supervisor | /insider/alerts | 886 ms | PASS | [Open](desktop/supervisor/insider-alerts.png) |
| desktop | supervisor | /leave | 984 ms | FAIL: Console: Failed to load resource: the server responded with a status of 404 (Not Found) | [Open](desktop/supervisor/leave.png) |
| desktop | supervisor | /review | 619 ms | PASS | [Open](desktop/supervisor/review.png) |
| desktop | supervisor | /closure/:caseId | 881 ms | PASS | [Open](desktop/supervisor/closure-caseId.png) |
| desktop | supervisor | /review/appeals | 819 ms | PASS | [Open](desktop/supervisor/review-appeals.png) |
| desktop | supervisor | /rescue | 749 ms | PASS | [Open](desktop/supervisor/rescue.png) |
| desktop | supervisor | /impact | 1607 ms | PASS | [Open](desktop/supervisor/impact.png) |
| desktop | supervisor | /cases/:caseId/redaction | 831 ms | PASS | [Open](desktop/supervisor/cases-caseId-redaction.png) |
| desktop | supervisor | /integrity | 688 ms | PASS | [Open](desktop/supervisor/integrity.png) |
| desktop | supervisor | /benchmark | 536 ms | PASS | [Open](desktop/supervisor/benchmark.png) |
| desktop | supervisor | /judge | 859 ms | PASS | [Open](desktop/supervisor/judge.png) |
| desktop | supervisor | /walkthrough/compare | 645 ms | PASS | [Open](desktop/supervisor/walkthrough-compare.png) |
| desktop | supervisor | /coverage | 807 ms | PASS | [Open](desktop/supervisor/coverage.png) |
| desktop | supervisor | /impact/cases | 3029 ms | FAIL: Content not ready within 3000 ms; Content deadline exceeded: 3029 ms | [Open](desktop/supervisor/impact-cases.png) |
| desktop | supervisor | /overlap-timeline/:pid | 745 ms | PASS | [Open](desktop/supervisor/overlap-timeline-pid.png) |
| desktop | supervisor | /graph/institutions/:pid | 1026 ms | FAIL: Banned visible wording: simulator | [Open](desktop/supervisor/graph-institutions-pid.png) |
| desktop | supervisor | /cases | 1104 ms | FAIL: Banned visible wording: POLICY_NOT_CONFIGURED | [Open](desktop/supervisor/cases.png) |
| desktop | supervisor | /reports | 1465 ms | PASS | [Open](desktop/supervisor/reports.png) |
| desktop | supervisor | /audit | 1465 ms | PASS | [Open](desktop/supervisor/audit.png) |
| desktop | supervisor | /notifications | 1553 ms | PASS | [Open](desktop/supervisor/notifications.png) |
| desktop | supervisor | /regional | 2019 ms | FAIL: Banned visible wording: POLICY_NOT_CONFIGURED | [Open](desktop/supervisor/regional.png) |
| desktop | supervisor | /cases/:caseId | 1117 ms | FAIL: Banned visible wording: SIMULATOR | [Open](desktop/supervisor/cases-caseId.png) |

Raw route metadata: [inventory](route-inventory.json). Current database counts: [showcase evidence](showcase-evidence.json). API timing measurements: [profile](api-profile.json).

The source audit and subjective before/after assessments are in [JURY_PAGE_AUDIT_26OCT](../../../plans/JURY_PAGE_AUDIT_26OCT.md).
