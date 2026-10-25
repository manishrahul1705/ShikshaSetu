// Additive materialization of the existing synthetic verification fixtures.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env.showcase'), quiet: true });
const load = relative => import(pathToFileURL(path.join(root, relative)).href);
(async () => {
  const { default: mongoose } = await import('mongoose');
  const { studentVerificationRecords } = await load('server/src/modules/identity/studentDataset.js');
  const uri = new URL(process.env.SHOWCASE_URI || 'mongodb://127.0.0.1:27017/awaaz_dastak_showcase');
  if (uri.pathname !== '/awaaz_dastak_showcase') throw new Error('SHOWCASE_DATABASE_REQUIRED');
  uri.pathname = '/awaaz_dastak_identity_simulator';
  const connection = await mongoose.createConnection(uri.toString(), { serverSelectionTimeoutMS: 10000 }).asPromise();
  try {
    const collection = connection.collection('abc_apaar_registry');
    await collection.createIndex({ referenceHash: 1 }, { unique: true });
    const rows = studentVerificationRecords().map(({ id, display, abcId, apaarId, aadhaar, ...row }) => ({
      ...row, last4: id.slice(-4), aadhaarLast4: aadhaar.slice(-4), synthetic: true,
      version: 'SYNTH-ABC-APAAR-v2', source: 'Deterministic local student fixtures with linked test contacts',
    }));
    await collection.bulkWrite(rows.map(row => ({ updateOne: { filter: { referenceHash: row.referenceHash }, update: { $set: row }, upsert: true } })));
    await collection.createIndex({ aadhaarHash: 1 }, { unique: true, partialFilterExpression: { aadhaarHash: { $type: 'string' } } });
    const fs = require('node:fs');
    const directory = path.join(root, 'data/students'); fs.mkdirSync(directory, { recursive: true });
    const columns = ['name', 'abcId', 'apaarId', 'aadhaar', 'pid', 'programme', 'linkedEmail', 'linkedPhone', 'status', 'synthetic'];
    const csv = [columns.join(','), ...studentVerificationRecords().map(row => columns.map(key => '"' + String(row[key] ?? '').replaceAll('"', '""') + '"').join(','))].join('\n');
    fs.writeFileSync(path.join(directory, 'student-verification.csv'), csv, 'utf8');
    console.log(JSON.stringify({ database: uri.pathname.slice(1), students: await collection.countDocuments(), synthetic: true, rawIdentifiersStored: false }));
  } finally { await connection.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
