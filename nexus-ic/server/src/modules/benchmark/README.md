# N48 — synthetic matcher benchmark

The existing S0 generator is used read-only, and S4's matcher is imported unchanged. The explicit benchmark_runs collection stores a summary. /benchmark and its GET/POST API require supervisor or system_admin.

Each run uses the active approved OVERLAP_DETECTION RuleBook version. If the matcher/approved RuleBook adapter is unavailable, results are UNKNOWN with honest coverage and null measured accuracy; a demo fallback is not represented as an active RuleBook result. No target accuracy is embedded in code or tests.

The fixed S6a-N48-v1 seed generates 1,000 complaints and constructs 3,000 independently labelled pairs: exact duplicates, local college→collge variants (unchanged if the token is absent), and different-PID negatives. Labels come from construction, never from predictions. Scope deliberately excludes general semantic-equivalence ground truth, same-PID hard-negative accuracy and pilot generalization. Hindi/Tamil/English text remains local. Generated names/addresses are discarded.

Stored/displayed results include matched correctly / all pairs, false matches / all non-duplicate pairs, confusion counts, evaluated-only accuracy with its own denominator, UNKNOWN count and coverage, the actual rule version, seed/fixture version/hash, runtimeMs and runAt. Every percentage has numerator, denominator and scope. The exact label is “SYNTHETIC DATA - not a real-world accuracy claim”. UNKNOWN is never counted correct and is not silently removed from the total denominator. All-UNKNOWN accuracy is null, not a claimed measured 0%.

This produces no institution guilt/risk score, policy recommendation, measured savings or “actions avoided” count. Production synthetic execution is refused. N37 stays BLOCKED-SOURCE. Real pilot validation and real integrations remain unconfigured.
