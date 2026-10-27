const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * S29 Database Restore Script
 * Refuses to restore into any database whose name does not end with "_demo"
 */
async function restoreDatabase(inputPath, customUri) {
  const uri = customUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/awaaz_dastak_demo';

  // Extract database name from URI
  const parsedUrl = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://'));
  const dbName = parsedUrl.pathname.replace(/^\//, '');

  if (!dbName.endsWith('_demo')) {
    const errorMsg =
      `[REFUSED] Database name is "${dbName}". ` +
      `For safety, restore will only operate on databases whose name ends with "_demo". ` +
      `This protects production, test, and live databases from accidental overwrite.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (!inputPath || !fs.existsSync(inputPath)) {
    throw new Error(`Backup file not found at: ${inputPath}`);
  }

  const dump = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const mongoose = (await import('mongoose')).default;
  const { connectDB, disconnectDB } = await import('../server/src/config/db.js');

  const wasConnected = mongoose.connection.readyState === 1;
  if (!wasConnected) {
    console.log(`Connecting to ${uri} to restore backup...`);
    await connectDB(uri);
  }

  const db = mongoose.connection.db;

  // Drop existing collections in the demo database
  console.log(`Clearing demo collections in "${dbName}"...`);
  const existingColls = await db.collections();
  for (const coll of existingColls) {
    if (!coll.collectionName.startsWith('system.')) {
      await coll.drop().catch(() => {});
    }
  }

  // Restore collections
  let totalRestored = 0;
  for (const [collName, docs] of Object.entries(dump.collections)) {
    if (Array.isArray(docs) && docs.length > 0) {
      // Re-hydrate dates and ObjectIds if needed
      await db.collection(collName).insertMany(docs);
      totalRestored += docs.length;
    }
  }

  console.log(`Restore completed: ${totalRestored} documents restored across ${Object.keys(dump.collections).length} collections.`);
  if (!wasConnected) {
    await disconnectDB();
  }

  return { success: true, totalRestored, collections: Object.keys(dump.collections).length };
}

if (require.main === module) {
  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error('Usage: node scripts/restore.js <path-to-backup-json>');
    process.exit(1);
  }

  restoreDatabase(inputArg)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Restore failed:', err.message);
      process.exit(1);
    });
}

module.exports = { restoreDatabase };
