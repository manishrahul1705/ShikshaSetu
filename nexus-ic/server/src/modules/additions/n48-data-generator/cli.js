#!/usr/bin/env node

/**
 * N48 CLI: npm run gen -- --count 5000 --seed 42
 *
 * Generates reproducible synthetic data and inserts into the database.
 * Every record has synthetic: true.
 */

import { generate } from './generator.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

function parseArgs(argv) {
  const args = { count: 100, seed: 42 };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--count' && argv[i + 1]) {
      args.count = parseInt(argv[i + 1], 10);
      i++;
    } else if (argv[i] === '--seed' && argv[i + 1]) {
      args.seed = argv[i + 1];
      i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`Generating ${args.count} complaints with seed=${args.seed}...`);

  const data = generate(args);

  console.log(`Generated: ${data.institutions.length} institutions, ${data.complainants.length} complainants, ${data.complaints.length} complaints`);

  // Connect to DB and insert
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/awaaz_dastak_demo';
  await mongoose.connect(uri);

  const db = mongoose.connection.db;

  // Upsert institutions
  const instBulk = data.institutions.map((inst) => ({
    updateOne: {
      filter: { pid: inst.pid },
      update: { $set: inst },
      upsert: true,
    },
  }));
  if (instBulk.length) await db.collection('institutions').bulkWrite(instBulk);

  // Insert complainants (replace all synthetic)
  await db.collection('synthetic_complainants').deleteMany({ synthetic: true });
  if (data.complainants.length) await db.collection('synthetic_complainants').insertMany(data.complainants);

  // Insert complaints (replace all synthetic)
  await db.collection('synthetic_complaints').deleteMany({ synthetic: true });
  if (data.complaints.length) await db.collection('synthetic_complaints').insertMany(data.complaints);

  console.log('Data inserted successfully.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Generator failed:', err.message);
  process.exit(1);
});
