# Judge questions: short, honest answers

Prepared by Claude, 25 Oct 2026. Every number here comes from a local run on synthetic data; none is a pilot result.

JURY-91 verification update (Codex, 25 October 2026): 278/278 tests passed, zero failed or skipped (215 server, 63 client); merged results written to test-results/results.json; trace-check reports No violations. The judge flow is currently proved at API level. A full browser rehearsal with screenshots/video and three consecutive passes has not yet run. The performance and matcher measurements below are the earlier recorded measurements; no new JURY-91 load or embedding benchmark has been completed.

## "How is this different from CPGRAMS or the AICTE portal?"
Those route a complaint to one office. AWAAZ DASTAK coordinates every bureau touching the same institution: it warns before two bureaus ask the same college for the same documents (PREVENT Stage 2), keeps the sender accountable until a transfer is accepted (TRACE), and refuses closure without evidence and a second approver (PROOF). It imports CPGRAMS references instead of replacing CPGRAMS.

## "Where exactly is the AI?"
Explainable rules and text similarity, with a human confirming every suggestion. On 5,000 hard synthetic pairs the duplicate matcher has **99.1% precision and 93.3% recall** (it was 73.5% before we added a containment signal). Paraphrases are the weakest case at 75%; a local multilingual embedding model is the next step. Details: docs/AI_METHODS.md and the hard-case panel on /benchmark.

## "What happens at 1 lakh complaints across 9,000 institutions?"
Measured on one laptop with a throwaway database and 52,000 synthetic cases (50,000 spread over 5,000 institutions, about ten each as 1 lakh over 9,000 colleges would be, plus one deliberately busy college with 2,000 cases). Command: `node server/scripts/load-test.mjs 50000`.

| Operation | Time |
|---|---|
| Duplicate check while a student files, at the 2,000-case college (worst case) | 0.26 s |
| Officer's queue, bureau scope (16,667 open cases) | 2.2 s |
| IMPACT dashboard, first build over 50,000 cases | 14.9 s |
| IMPACT dashboard again, nothing changed | 0.24 s |
| Index-backed case lookup by institution and status | 21 ms |

Before the scale work the same IMPACT build took 72 s at 50,000 cases (and 248 s on a 4,000-case set with one busy college). What changed: indexes on institution, status, bureau and category; the overlap scan compares only cases at the same institution that can actually match; text features are computed once; the report is reused until a case, check, transfer or closure changes; queues return the 200 most urgent rows. The next step is precomputing IMPACT in the background so even the first view is instant, and moving the audit-append queue to MongoDB for several app servers.

## "Can the institution find out who complained?"
No. Officers see a pseudonymous ID (RP-xxxx); identity sits in an AES-256-GCM vault; a reveal needs a purpose, an approver and an expiry, and is audited. Institution admins only ever see an officer-confirmed redacted text, and never for confirmed-sensitive cases. Retaliation Watch (opt-in) alerts the Competent Authority privately if the complainant's enrolment or employment changes after the complaint. A negative-role test sweep checks every role against about 35 read, search, export and download routes on each run.

## "How does this fit the DPDP Act 2023?"
Purpose-specific consent records (verification, OTP, manual verification, retaliation watch) that can be withdrawn; data minimisation; GPS/metadata scrubbing on uploads; pseudonymous IDs; an audited identity vault; retention hooks that return POLICY_NOT_CONFIGURED until counsel sets the rule. A legal review is part of deployment; we do not claim compliance.

## "What about colleges with poor internet, or students who do not read English or Hindi?"
The app installs as a PWA, sends status notices by SMS and email through the adapter (simulated until the gateway is approved), and the core screens already switch between English and Hindi through translation files, so adding Tamil, Bengali or Marathi there is a translation task. Full offline submission (N49) was not adopted for this release.

## "Who maintains the RuleBook, and what if a rule is wrong?"
An administrator drafts a new version, it runs a dry run and a what-if preview against fixture cases, and a different person approves it (requester and approver are enforced to differ). Versions are never edited and never retroactive, so a bad rule is replaced by a new version with a full record. Without an approved rule the system says POLICY_NOT_CONFIGURED rather than inventing an SLA.

## "What would it cost, and where would it run?"
A plain JavaScript stack (React, Express, MongoDB) with no licence cost, sized for a MeghRaj/NIC cloud VM pair plus a MongoDB replica set. A pilot needs one AICTE region, the official region and category tables loaded into the RuleBook, and written access to ABC/APAAR, SSO and the SMS gateway; until then every integration runs on its simulator behind the same adapter contract.

## "Is the data real?"
No. Every screen and export says SYNTHETIC DATA, and the limits are listed in docs/LIMITATIONS.md.
