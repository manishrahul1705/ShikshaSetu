/**
 * N61 pattern alert parameters.
 *
 * DEMO-PATTERN-v1: synthetic, not from source; replace with AICTE policy.
 * No source document gives the window or the minimum number of institutions
 * for a "rising" cross-institution pattern, so these are demo values only and
 * every alert carries this version.
 */
export const PATTERN_DEFAULTS = Object.freeze({
  version: 'DEMO-PATTERN-v1',
  synthetic: true,
  _comment: 'not from source; replace with AICTE policy',
  windowDays: 30,
  minInstitutions: 3,
});
