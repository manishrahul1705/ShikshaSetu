/**
 * Business day calculation utilities (SPEC 9.2, N20, U20)
 *
 * Rules:
 * - Business days exclude Saturday (6) and Sunday (0).
 * - No holiday calendar is invented from source (noted per RULES.md).
 */

export function isBusinessDay(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function addBusinessDays(startDate, days) {
  const result = new Date(startDate);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      remaining--;
    }
  }

  return result;
}

export function diffBusinessDays(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  if (s >= e) return 0;

  let count = 0;
  const cur = new Date(s);
  while (cur < e) {
    cur.setDate(cur.getDate() + 1);
    if (isBusinessDay(cur)) {
      count++;
    }
  }
  return count;
}
