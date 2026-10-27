const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function run() {
  console.log('Connecting to database...');
  const { connectDB, disconnectDB } = await import('../server/src/config/db.js');
  const { seedDemoAccounts } = await import('../server/src/modules/auth/seed.js');
  await connectDB();
  console.log('Seeding demo accounts...');
  const res = await seedDemoAccounts();
  console.log(`Seeding complete: ${res.created} created of ${res.total} total accounts.`);
  await (await import('../server/src/modules/identity/seed.js')).seedIdentityReporters();
  await (await import('../server/src/modules/institutions/seed.js')).seedInstitutionsAndRegions();
  await (await import('../server/src/modules/rulebook/seed.js')).seedRuleBook();
  await (await import('../server/src/modules/bureaus/seed.js')).seedBureaus();
  await (await import('../server/src/modules/sync/seed.js')).seedS3Fixtures();
  await (await import('../server/src/modules/authority/seed.js')).seedS5();
  await disconnectDB();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
