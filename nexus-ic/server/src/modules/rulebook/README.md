# NEXUS RULEBOOK Module (SPEC Section 11, N27, N78)

## 1. getActiveRule Contract
The module exports `getActiveRule(family, at = new Date())` from `server/src/modules/rulebook/index.js`.

### Signature
```javascript
getActiveRule(family: string, at?: Date): Promise<RuleResult>
```

### Return Types
If an approved rule version exists for `family` with `effectiveFrom <= at`:
```javascript
{
  family: string,
  versionId: string, // e.g. 'DEMO-ROUTE-v1'
  ruleId: string,
  version: string,
  status: 'approved',
  body: object,      // rule body definition
  effectiveFrom: Date,
  demo: boolean      // true if synthetic demo rule
}
```

If no approved rule exists, or if running in `APP_MODE=production` and the active rule is a `DEMO-*` rule:
```javascript
{
  result: 'POLICY_NOT_CONFIGURED'
}
```

## 2. Rule Families Supported
- `JURISDICTION` & `ROUTING` (`DEMO-ROUTE-v1`): Jurisdiction mappings and confidence thresholds for NEXUS ROUTE.
- `SLA` (`DEMO-CASE-STANDARD-v1`, `DEMO-CASE-PRIORITY-v1`): Policy clocks for normal, high, and urgent priority cases.
- `TRANSFER` (`DEMO-TRANSFER-ACK-v1`): Acknowledgement window (2 business days) for inter-bureau transfers.
- `ESCALATION` (`DEMO-ESCALATION-v1`): Triggers for notifying supervisors and escalating overdue cases.
- `COORDINATION` (`DEMO-SYNC-ACK-v1`, `DEMO-TASK-v1`): Deadlines for multi-bureau SYNC collaboration.
- `RESCUE` (`DEMO-RESCUE-v1`): Synthetic stalled-case recovery triggers (3+ transfers, 7 days inactivity).
- `OVERLAP_DETECTION` (`DEMO-OVERLAP-v1`): Read from S4 defaults (`defaults.js`) for duplicate action checks.
- `CLOSURE_REQUIREMENTS` (`DEMO-CLOSURE-v1`): Proof and approval requirements for closing cases.
- `SENSITIVITY` (`DEMO-SENSITIVITY-v1`): Multilingual keyword definitions for flagging sensitive cases.
- `APPEAL`: Unseeded (`POLICY_NOT_CONFIGURED`).
- `ELIGIBILITY`: Unseeded (`POLICY_NOT_CONFIGURED`).

## 3. Immutability & Controls (S20, U29)
1. Every edit creates a new version with an effective date; rules are never retroactive.
2. A dry-run against synthetic fixtures is required before any version can be approved.
3. Separation of duties: `requestedBy` cannot equal `approvedBy` (S20).
4. What-if preview (N65) allows simulating the effect of a pending rule on open cases without making any changes.
