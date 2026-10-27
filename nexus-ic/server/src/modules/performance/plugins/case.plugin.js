/**
 * Case plugin (S7 scale): indexes for the queries every workspace runs, so they stay
 * index-backed at lakhs of cases (institution + status for Stage 1 and Institution 360,
 * status for open-case scans, bureau for queues, category and createdAt for IMPACT trends).
 */
export default function caseIndexesPlugin(schema) {
  schema.index({ institutionPid: 1, status: 1 });
  schema.index({ status: 1, createdAt: -1 });
  schema.index({ owningBureau: 1, status: 1 });
  schema.index({ category: 1, createdAt: -1 });
}
