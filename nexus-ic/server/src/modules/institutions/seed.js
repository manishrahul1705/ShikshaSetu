import { seedRegions } from './Region.js';
import Institution from './Institution.js';
import InstitutionIdentifier from './InstitutionIdentifier.js';
import { listInstitutions } from '../registry/RegistrySimulator.js';
import logger from '../../config/logger.js';
import { institutionSearchTokens, CATALOGUE_VERSION } from '../registry/catalogue.js';
import IdentityReview from './IdentityReview.js';
import { resolveIdentity } from './institutionService.js';
import { recordAudit } from '../audit/audit.js';

/**
 * Seed DEMO-REGIONS-v1 and initial institutions/ICID mappings.
 */
export async function seedInstitutionsAndRegions() {
  // 1. Seed regions (DEMO-REGIONS-v1)
  const regResult = await seedRegions();
  logger.info({ action: 'seed_regions_complete', created: regResult.created });

  const actor = { actorId: 'institution-catalogue-seed', actorRole: 'system' };
  if (regResult.created) await recordAudit({ ...actor, action: 'institution.regions.seeded', targetType: 'RegionCatalogue', targetId: 'DEMO-REGIONS-v1', meta: { created: regResult.created } });
  const catalogue = listInstitutions();
  const existingPids = new Set((await Institution.find({ pid: { $in: catalogue.map(row => row.pid) } }).select('pid').lean()).map(row => row.pid));
  const fresh = catalogue.filter(row => !existingPids.has(row.pid)).map(row => ({
    pid: row.pid, icid: row.icid, name: row.name, city: row.city, state: row.state, region: row.region,
    district: row.district, establishedYear: row.establishedYear, intake: row.intake, approvalValidUntil: row.approvalValidUntil,
    type: row.type, approvalStatus: row.approvalStatus, aliases: row.aliases, campuses: row.campuses,
    registrySnapshot: row, lastRegistryFetch: new Date(), synthetic: true, pickerTokens: institutionSearchTokens(row),
  }));
  if (fresh.length) {
    await Institution.insertMany(fresh);
    await recordAudit({ ...actor, action: 'institution.catalogue.seeded', targetType: 'InstitutionCatalogue', targetId: CATALOGUE_VERSION, meta: { created: fresh.length, pids: fresh.map(row => row.pid) } });
  }
  const existingIcids = new Set((await InstitutionIdentifier.find({ icid: { $in: catalogue.filter(row => row.icid).map(row => row.icid) } }).select('icid').lean()).map(row => row.icid));
  const mappings = catalogue.filter(row => row.icid && !existingIcids.has(row.icid)).map(row => ({ icid: row.icid, pid: row.pid, source: 'seed_registry', verifiedAt: new Date(), status: 'active', synthetic: true }));
  if (mappings.length) {
    await InstitutionIdentifier.insertMany(mappings);
    await recordAudit({ ...actor, action: 'institution.identifiers.seeded', targetType: 'InstitutionCatalogue', targetId: CATALOGUE_VERSION, meta: { created: mappings.length, pids: mappings.map(row => row.pid) } });
  }
  // A deliberately reported disagreement, not a corrupted master mapping.
  // No identifier is changed or auto-resolved; a human must review it.
  const [first, second] = catalogue.filter(row => row.icid);
  if (first && second && !(await IdentityReview.exists({ pid: first.pid, icid: second.icid, conflictType: 'PID_ICID_DISAGREEMENT' })) && await resolveIdentity(first.pid, second.icid) === 'IDENTITY_REVIEW') {
    const review = await IdentityReview.create({ pid: first.pid, icid: second.icid, conflictType: 'PID_ICID_DISAGREEMENT', institutionName: first.name,
      details: 'Reported identifier maps to another PID. Human review is required; no identifiers were changed.', status: 'PENDING', synthetic: true });
    await recordAudit({ ...actor, action: 'institution.identity_review.queued', targetType: 'IdentityReview', targetId: String(review._id), meta: { pid: first.pid, icid: second.icid } });
  }
  const instCreated = fresh.length;

  logger.info({ action: 'seed_institutions_complete', created: instCreated });
  return { regions: regResult.created, institutions: instCreated };
}
