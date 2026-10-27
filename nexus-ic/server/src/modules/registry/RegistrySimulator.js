import { fictionalInstitutions } from './catalogue.js';
import logger from '../../config/logger.js';

/**
 * N10: Master Registry Simulator.
 *
 * Simulates the AICTE institution registry using N48 synthetic data.
 * Returns institution profile by PID (name, region, campus, approval status).
 * When the registry is unavailable, returns UNKNOWN with reason (Rule 5).
 */

let cache = null;
let available = true;

/**
 * Load or return cached synthetic registry data.
 */
function getRegistry() {
  if (!cache) {
    const institutions = fictionalInstitutions();
    cache = new Map();
    for (const inst of institutions) {
      cache.set(inst.pid, inst);
    }
  }
  return cache;
}

/**
 * Simulate registry availability (for testing).
 * @param {boolean} isAvailable
 */
export function setAvailable(isAvailable) {
  available = isAvailable;
}

export const setOnlineStatus = setAvailable;

/**
 * Reset the registry cache (for testing).
 */
export function resetCache() {
  cache = null;
  available = true;
}

/**
 * Look up an institution by PID in the simulated registry.
 * @param {string} pid - PID in format 1-XXXXXXXXXX
 * @returns {{ found: boolean, profile?: Object, reason?: string }}
 */
export function lookup(pid) {
  if (!available) {
    logger.warn({ action: 'registry_lookup_unavailable', pid });
    return { found: false, reason: 'REGISTRY_UNAVAILABLE' };
  }

  const registry = getRegistry();
  const entry = registry.get(pid);

  if (!entry) {
    return { found: false, reason: 'PID_NOT_FOUND' };
  }

  return {
    found: true,
    profile: {
      pid: entry.pid,
      name: entry.name,
      state: entry.state,
      city: entry.city,
      district: entry.district,
      establishedYear: entry.establishedYear,
      intake: entry.intake,
      approvalValidUntil: entry.approvalValidUntil,
      region: entry.region,
      type: entry.type,
      approvalStatus: entry.approvalStatus,
      icid: entry.icid,
      campuses: entry.campuses,
      synthetic: true,
    },
  };
}

/**
 * Look up an institution by its Innovation Council ID.
 * The registry remains read-only; callers decide whether to persist a snapshot.
 */
export function lookupByIcid(icid) {
  const normalizedIcid = String(icid || '').toUpperCase();
  if (!available) {
    logger.warn({ action: 'registry_icid_lookup_unavailable', icid: normalizedIcid });
    return { found: false, reason: 'REGISTRY_UNAVAILABLE' };
  }

  const entry = [...getRegistry().values()].find(row => row.icid === normalizedIcid);
  if (!entry) return { found: false, reason: 'ICID_NOT_FOUND' };
  return lookup(entry.pid);
}

/**
 * Get all PIDs from the registry (for seeding/testing).
 */
export function listPids() {
  const registry = getRegistry();
  return [...registry.keys()];
}

/**
 * Get a specific count of institutions from the registry.
 */
export function listInstitutions(count) {
  const registry = getRegistry();
  const all = [...registry.values()];
  return count ? all.slice(0, count) : all;
}
