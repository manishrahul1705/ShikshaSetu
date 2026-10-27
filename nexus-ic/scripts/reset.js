const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/awaaz_dastak_demo';

  // Extract database name from URI
  const parsedUrl = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, 'http://'));
  const dbName = parsedUrl.pathname.replace(/^\//, '');

  if (!dbName.endsWith('_demo')) {
    console.error(
      `[REFUSED] Database name is "${dbName}". ` +
      `For safety, reset will only drop databases whose name ends with "_demo". ` +
      `This protects production, test, and live databases from accidental data loss.`
    );
    process.exit(1);
  }

  const mongoose = (await import('mongoose')).default;
  const { connectDB, disconnectDB } = await import('../server/src/config/db.js');
  const { seedDemoAccounts } = await import('../server/src/modules/auth/seed.js');

  console.log(`Connecting to ${uri}...`);
  await connectDB(uri);

  console.log(`Dropping demo database "${dbName}"...`);
  await mongoose.connection.db.dropDatabase();
  console.log(`Database "${dbName}" dropped.`);

  console.log('Reseeding demo accounts...');
  const res = await seedDemoAccounts();
  console.log(`Reseed complete: ${res.created} created of ${res.total} accounts.`);

  await (await import('../server/src/modules/identity/seed.js')).seedIdentityReporters();
  await (await import('../server/src/modules/institutions/seed.js')).seedInstitutionsAndRegions();
  await (await import('../server/src/modules/rulebook/seed.js')).seedRuleBook();
  await (await import('../server/src/modules/bureaus/seed.js')).seedBureaus();
  await (await import('../server/src/modules/sync/seed.js')).seedS3Fixtures();
  await disconnectDB();
  console.log('Reset complete.');
}

run().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
