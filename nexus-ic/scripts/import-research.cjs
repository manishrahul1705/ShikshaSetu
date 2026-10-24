// Additive, idempotent import. Never resets or drops any database.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env.showcase'), quiet: true });
const load = relative => import(pathToFileURL(path.join(root, relative)).href);
(async () => {
  const { default: mongoose } = await import('mongoose');
  const { default: Research } = await load('server/src/modules/researchRegistry/ResearchInstitution.js');
  const { normalizeResearchRow, tokensFor } = await load('server/src/modules/researchRegistry/service.js');
  const uri = process.env.SHOWCASE_URI || 'mongodb://127.0.0.1:27017/awaaz_dastak_showcase';
  if (new URL(uri).pathname !== '/awaaz_dastak_showcase') throw new Error('SHOWCASE_DATABASE_REQUIRED');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/aicte/research-registry.json'), 'utf8'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const regions = await mongoose.connection.collection('regions').find({}).toArray();
  const byState = Object.fromEntries(regions.flatMap(r => r.states.map(s => [s, r.code])));
  byState['Jammu and Kashmir'] = byState['Jammu & Kashmir'];
  const joined = (sheet, pid) => (data[sheet] || []).filter(x => x.raw.PID === pid).map(x => ({ ...x.raw, sourceRow: x.sourceRow }));
  const rows = data.institutions.map(entry => {
    const row = normalizeResearchRow(entry, data, byState);
    row.courses = row.pid ? joined('courses', row.pid) : [];
    row.nameVariations = row.pid ? joined('nameVariations', row.pid) : [];
    row.duplicateReview = row.pid ? joined('duplicateReview', row.pid) : [];
    row.aliases = [...new Set([row.raw['Registry Name'], ...row.nameVariations.map(x => x['2026-27 letter name'])].filter(v => v && v !== 'Not publicly verified' && v !== row.name))];
    row.programmes = [...new Set(row.courses.map(x => x.Programme).filter(Boolean))];
    row.pickerTokens = tokensFor(row); return row;
  });
  const pids = rows.map(r => r.pid).filter(Boolean);
  if (new Set(pids).size !== pids.length) throw new Error('DUPLICATE_PID_REQUIRES_REVIEW');
  const collisions = await mongoose.connection.collection('institutions').countDocuments({ pid: { $in: pids } });
  if (collisions) throw new Error('REAL_SYNTHETIC_PID_COLLISION');
  const summary = { rows: rows.length, populatedPid: pids.length, missingPid: rows.length - pids.length, verifiedIcid: 0,
    unresolvedState: rows.filter(r => !r.state).length, courses: data.courses.length, caveat: data.caveat, mode: process.argv.includes('--apply') ? 'apply' : 'dry-run' };
  if (process.argv.includes('--apply')) {
    await Research.createIndexes();
    for (let i = 0; i < rows.length; i += 300) await Research.bulkWrite(rows.slice(i, i + 300).map(row => ({ updateOne: {
      filter: row.pid ? { pid: row.pid } : { sourceKey: row.sourceKey }, update: { $set: row }, upsert: true,
    } })));
    summary.stored = await Research.countDocuments();
    await mongoose.connection.collection('research_import_runs').insertOne({ ...summary, fileHash: data.fileHash, at: new Date(), actor: 'local-user-request-28Oct2026' });
    const { recordAudit } = await load('server/src/modules/audit/audit.js');
    await recordAudit({ actorId: 'local-user-request-28Oct2026', actorRole: 'system_admin', action: 'registry.research_import', targetType: 'ResearchInstitution', targetId: data.fileHash,
      meta: { rows: summary.rows, stored: summary.stored, missingPid: summary.missingPid, sourceFileName: data.sourceFileName, incompleteSource: true } });
  }
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
})().catch(error => { console.error(error.message); process.exitCode = 1; });
