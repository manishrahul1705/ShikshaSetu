# Integration adapters — N32 (PLANNED-P2)

AWAAZ DASTAK — powered by NEXUS-IC. SYNTHETIC DATA.

SPEC 14 names AICTE systems, the institution registry and CPGRAMS. Each has a `SimulatorAdapter` and a `RealAdapter` in `server/src/modules/adapters/index.js`. `snapshot(watermark)` carries sourceSystem, watermark, synthetic records, institutionIdentifiers `{pid, icid}`, original externalRefs `{sourceSystem, sourceRef}` and a source snapshot. The existing S1b RegistrySimulator supplies registry fixtures read-only; it is not modified.

Simulators are deterministic local fixtures. They do not fetch outside data. Generated complainant identities are discarded. Every RealAdapter returns `{result:'CONTRACT_NOT_CONFIGURED'}` without contacting any service or claiming an empty real feed.

Real integration is P2 and requires approved source contracts, credentials, lawful purpose and a reviewed transport/verification interface. The adapter interface is not an authentication bypass. Import still previews, dry-runs and commits through S2's idempotent engine, preserves source-native IDs, and quarantines PID/ICID mismatches to data-health review. No adapter can link institutions by ICID alone. No blockchain, approval or live AICTE/CPGRAMS connectivity is claimed.
