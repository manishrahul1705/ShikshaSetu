// SOURCE_23OCT_FERTXD.md, Reference demo SLA event logic. No legal SLA claim.
export function classifyDemoCase({ receivedAt, now = new Date(), status, policy, mode = process.env.APP_MODE }) {
  if (mode === 'production' || policy?.approvedFor !== 'SYNTHETIC_DEMO' || !(policy.calendarDays > 0)) return { state: 'POLICY_NOT_CONFIGURED' };
  const receipt = receivedAt && new Date(receivedAt);
  if (!receipt || !Number.isFinite(receipt.getTime())) return { state: 'UNKNOWN_EVENT_TIME' };
  const dueAt = new Date(receipt.getTime() + policy.calendarDays * 86400000);
  if (['Closed', 'CLOSED', 'DISPOSED'].includes(status)) return { state: 'CLOSED', dueAt };
  const remaining = dueAt - new Date(now);
  if (remaining < 0) return { state: 'OVERDUE', dueAt };
  if (policy.nearDueHours > 0 && remaining <= policy.nearDueHours * 3600000) return { state: 'NEAR_DUE', dueAt };
  return { state: 'ON_TRACK', dueAt };
}
