import mongoose from 'mongoose';
import { fingerprint } from '../vault/crypto.js';

let loaded = false;
let students = new Map();
export const simulatorStoreLoaded = () => loaded;
export function findSimulatorRecordByHash(hash, kind = 'abc') {
  if (!loaded) return null;
  if (kind === 'abc') return students.get(hash) || null;
  return [...students.values()].find(row => row.aadhaarHash === hash) || null;
}
export function findSimulatorStudent(reference) {
  if (!loaded) return null;
  const row = students.get(fingerprint(`abc-apaar-simulator:${reference}`));
  return row ? { ...row, id: reference, display: reference.replace(/(\d{4})(?=\d)/g, '$1-') } : null;
}
export async function loadSimulatorDatabase(uri) {
  if (!uri) return;
  if (process.env.APP_MODE !== 'demo') throw new Error('IDENTITY_SIMULATOR_DEMO_ONLY');
  if (!new URL(uri).pathname.endsWith('_identity_simulator')) throw new Error('SEPARATE_SIMULATOR_DATABASE_REQUIRED');
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
  try {
    const rows = await connection.collection('abc_apaar_registry').find({ synthetic: true }).toArray();
    if (!rows.length) throw new Error('SIMULATOR_DATABASE_EMPTY');
    students = new Map(rows.map(({ _id, ...row }) => [row.referenceHash, row]));
    loaded = true;
  } finally { await connection.close(); }
}
