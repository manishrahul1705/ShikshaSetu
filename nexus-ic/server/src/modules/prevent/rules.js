import { overlapDefaults, actionDefaults } from './defaults.js';
import { existsSync } from 'node:fs';
import env from '../../config/env.js';
// The adapter contract is documented in README. No PDF thresholds or C1-C5 here.
export async function getRules() {
  const demo = (process.env.APP_MODE || env.APP_MODE) === 'demo';
  let active;
  try {
    const url = new URL('../rulebook/index.js', import.meta.url);
    if (existsSync(url)) {
      const rulebook = await import(/* @vite-ignore */ url.href);
      active = await rulebook.getActiveRule('OVERLAP_DETECTION');
    }
  } catch (error) {
    if (!(error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('rulebook/index.js'))) return { configured: false, reason: 'RULEBOOK_UNAVAILABLE' };
  }
  const body = active?.body;
  if (active?.status === 'approved' && typeof active.version === 'string' && (demo || !active.version.startsWith('DEMO-')) && body &&
      Number.isFinite(body.overlapThreshold) && body.overlapThreshold > 0 && body.overlapThreshold <= 100 &&
      Number.isFinite(body.minIssueSimilarity) && body.minIssueSimilarity > 0 && body.minIssueSimilarity <= 1 &&
      Number.isInteger(body.gramSize) && body.gramSize > 0 && Number.isFinite(body.freshnessMs) && body.freshnessMs > 0) {
    return { configured: true, version: active.version, ...body, synthetic: active.version.startsWith('DEMO-') };
  }
  if (!demo) return { configured: false, reason: 'POLICY_NOT_CONFIGURED' };
  return { ...actionDefaults, ...overlapDefaults, actionVersion: actionDefaults.version, configured: true, synthetic: true };
}
