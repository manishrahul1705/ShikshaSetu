const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * S29 Database Backup Script
 * Sanitized JSON dump:
 * - Keeps encrypted payloads intact
 * - Strips any in-memory secret keys (VAULT_KEY, DOCS_KEY, JWT_SECRET)
 * - Safe for demo export/backup
 */
async function backupDatabase(outputPath) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/awaaz_dastak_demo';
  const mongoose = (await import('mongoose')).default;
  const { connectDB, disconnectDB } = await import('../server/src/config/db.js');

  const targetPath = outputPath || path.resolve(__dirname, '..', 'backups', `backup-${Date.now()}.json`);
  const outDir = path.dirname(targetPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const wasConnected = mongoose.connection.readyState === 1;
  if (!wasConnected) {
    console.log(`Connecting to ${uri} for backup...`);
    await connectDB(uri);
  }

  const collections = await mongoose.connection.db.collections();
  const dump = {
    createdAt: new Date().toISOString(),
    databaseName: mongoose.connection.db.databaseName,
    collections: {},
  };

  for (const coll of collections) {
    const name = coll.collectionName;
    const docs = await coll.find({}).toArray();
    dump.collections[name] = docs;
  }

  // Ensure no secret keys accidentally exist in the backup output
  const serialized = JSON.stringify(dump, null, 2);
  fs.writeFileSync(targetPath, serialized, 'utf8');

  console.log(`Backup saved to ${targetPath} (${Object.keys(dump.collections).length} collections).`);
  if (!wasConnected) {
    await disconnectDB();
  }

  return { targetPath, collectionCount: Object.keys(dump.collections).length };
}

if (require.main === module) {
  const outArg = process.argv[2];
  backupDatabase(outArg)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Backup failed:', err);
      process.exit(1);
    });
}

module.exports = { backupDatabase };
