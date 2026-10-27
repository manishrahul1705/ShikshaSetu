// Guided jury tour state, held in memory for this tab only. It survives page changes and
// account switches (both happen without a reload); nothing is stored in the browser or sent.
let current = null;
const listeners = new Set();

export function readTour() {
  return current;
}

export function writeTour(tour) {
  current = tour || null;
  listeners.forEach((fn) => fn(current));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Extra steps that show the case journey, ICID, audit and the complainant view. */
export function withExtraSteps(tour) {
  if (!tour?.scenario?.cases?.length) return tour.steps;
  const [a] = tour.scenario.cases;
  const pid = tour.scenario.institutionPid;
  const base = tour.steps.map((s) => ({ ...s, look: s.look || [] }));
  const added = [
    { caption: 'PREVENT checks an RB inspection for overlapping action before submit; the warning shows evidence and lets the officer coordinate or proceed with a reason.', link: '/review', loginAs: 'rb_officer1', look: ['Inline warning', 'Reason required to proceed anyway'] },
    { caption: 'Bureaus confirm only their own request items; institution replies return to each owning case.', link: `/requests/combined?pid=${pid}`, loginAs: 'rb_officer1', look: ['Per item owner office and role', 'Independent replies'] },
    { caption: 'The institution reuses a document already submitted with an audited grant scoped to one case and one officer.', link: '/documents/locker', loginAs: 'inst_admin1', look: ['Document versions', 'Scoped access'] },
    { caption: 'The student sees current status, accountable office and role, next step, policy clock and open AICTE queries.', link: '/track', loginAs: 'trust_student_verified', look: ['Status history', 'Reply through the query thread'] },
    { caption: 'The Competent Authority checks monthly balances and opens the cases behind a count.', link: '/reports/monthly', loginAs: 'authority1', look: ['Scope and ageing', 'Reconciliation check'] },
    { caption: 'Finish with one institution in a side-by-side comparison. The left is illustrative; the right counts recorded actions.', link: `/walkthrough/compare?pid=${pid}`, loginAs: 'rb_officer1', look: ['Source label on both columns', 'No measured savings claim'] },
  ];
  const extra = [
    { caption: `Open ${a.masterCaseId} as the RB officer: one page shows the Master Case ID, the PID and ICID with the identity check, the source trail, the ownership path and the dated timeline.`, link: `/cases/${a.masterCaseId}`, loginAs: 'rb_officer1', look: ['ICID / IIC ID card and its check result', 'Source trail: intake channel and external references', 'Ownership path and case timeline'] },
    { caption: `Institution 360 for ${pid}: the IIC ID mapping, attention indicators with reasons (never a score) and every related grievance.`, link: `/institutions/${pid}`, loginAs: 'supervisor1', look: ['IIC ID mapping block', 'Banner: Potential Overlapping Cases – Coordination Required'] },
    { caption: 'The verified student sees only their own cases, with the exact status and owner as office and role. No internal notes.', link: '/track', loginAs: 'trust_student_verified', look: ['Own cases only', 'Status history and receipt'] },
    { caption: 'The Competent Authority workspace: pending, overdue and transferred counts with approvals that need a different officer.', link: '/authority', loginAs: 'authority1', look: ['Approver must differ from proposer'] },
    { caption: 'The auditor verifies the SHA-256 hash chain: every step you just saw is an attributed event.', link: '/audit', loginAs: 'auditor1', look: ['Hash chain: intact', 'Actor role and action for every event'] },
  ];
  const overlapIndex = base.findIndex((s) => /overlap-timeline/.test(s.link || ''));
  const story = overlapIndex >= 0 ? [...base.slice(0, overlapIndex + 1), ...added, ...base.slice(overlapIndex + 1)] : [...base, ...added];
  return [...story, ...extra].slice(0, 17).map((s, i) => ({ ...s, n: i + 1 }));
}
