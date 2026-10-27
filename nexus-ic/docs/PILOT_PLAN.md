# Proposed regional pilot

This is a proposal, not an approved deployment or a measured result. Current application and benchmark data are synthetic. The pilot covers one region selected by AICTE; no region, participating institution or official policy has been assumed.

The first pilot objective is an authorized, hand-labelled sample of real complaints for evaluating the matcher. AICTE must approve access, purpose, minimization, retention and secure handling before any real complaint is collected. Complaint text and identity must not enter screenshots, public reports, logs or synthetic benchmark fixtures. Identity remains encrypted in the identity vault. Publish only approved aggregate results.

## Inputs and approval gates

| Required from AICTE | Acceptance evidence before use |
|---|---|
| Institution PID/ICID master, regional mapping and category/subcategory tables | Named owner, version, effective date, provenance and resolution process for mismatches |
| Bureau jurisdiction and routing rules | Signed RuleBook; documented handling of ambiguous and missing rules |
| SLA timelines, calendar rules, escalation and transfer windows | Approved policy references and tested boundary examples; no DEMO values represented as policy |
| Verification, consent, reveal and retention policy | Named approvers, purpose limits, separation of duties and retention/deletion schedule |
| ABC/APAAR and staff verification, SSO, CPGRAMS, email and SMS | Separate integration and data-sharing approvals, credentials managed outside source, sandbox acceptance and operational owner |
| Deployment and security review | S08 review, access review, backup/restore evidence, incident response contacts and security audit findings disposition |

Simulators remain clearly labelled until each integration is separately approved. A missing policy or feed remains POLICY_NOT_CONFIGURED or UNKNOWN as applicable. Real pilot access does not authorize external model calls; inference remains local.

## Proposed 90-day sequence

| Days | Work and exit evidence |
|---|---|
| 1–15 | Select one region and accountable leads; approve the data-handling plan; obtain official tables and policy versions. No real intake before these gates pass. |
| 16–30 | Collect the approved complaint sample in a restricted environment. Two authorized reviewers label independent-complaint versus potentially overlapping pairs, including paraphrases and difficult negatives; adjudicate disagreements. Freeze a held-out evaluation set before tuning. |
| 31–45 | Configure approved RuleBook and scoped roles. Validate local matching, routing explanations, identity protection, document access, transfers and closure separation of duties. Record discrepancies and remediation. |
| 46–60 | Run supervised shadow operation: staff compare recommendations with human decisions. No automated rejection, ownership move or closure. Complete training and incident/rollback rehearsal. |
| 61–75 | If earlier gates pass, allow limited supervised intake in the selected region. Review false matches, missed overlaps, transfer acknowledgements and closure evidence weekly. |
| 76–90 | Evaluate the held-out set and operational measures, complete an access/security review, and issue a documented go/no-go decision. Expansion requires a new approval. |

Dates are proposed milestones, not statutory timelines. AICTE sets sample size, acceptance targets and operational windows before evaluation; this proposal invents no policy threshold.

## Measures to agree before collection

Every published measure states its period, region, eligible population, numerator, denominator and missing-data count. Do not treat missing timestamps or unavailable feeds as zero.

| Measure | Numerator / denominator |
|---|---|
| Matcher precision | Correctly flagged overlapping pairs / all flagged pairs in the held-out labelled set |
| Matcher recall | Correctly flagged overlapping pairs / all truly overlapping pairs in that set; also report the paraphrase stratum separately |
| Label agreement | Pairs with initial reviewer agreement / all independently double-labelled pairs; report adjudicated pairs separately |
| Routing agreement | Recommendations accepted by the authorized routing reviewer / all reviewed recommendations |
| Transfer acknowledgement within policy | Transfers acknowledged within the approved window / transfers with a complete elapsed window and valid timestamps |
| Evidence-backed closure | Approved closures satisfying the evidence gate / all approved closures; separately count prevented self-approval attempts |
| Avoided duplicate actions | Flagged actions explicitly recorded by a human as avoided / reviewed flagged actions; a flag alone is not avoidance |
| Student feedback | Feedback responses / eligible closed cases invited to respond; show satisfaction counts against respondents separately |
| Performance | Requests meeting the agreed latency target / measured requests, with p50/p95, workload and hardware recorded |
| Privacy and authorization | Correct denials / attempted unauthorized accesses in the approved test suite, plus a separate incident count and unresolved findings |

Retain an evaluation ledger with model/rule versions, sample selection method, split, label protocol, exclusions and denominators. Synthetic benchmark results remain separate from real pilot results. Human case decisions and attributed audit events remain the authoritative operational record.
