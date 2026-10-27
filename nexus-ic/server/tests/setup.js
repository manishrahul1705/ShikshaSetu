import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';

let mongod;

// Optional: set TEST_MONGODB_URI (for example mongodb://127.0.0.1:27017) to run
// the same tests against a real local MongoDB instead of mongodb-memory-server.
// Each test worker gets its own database ending in _test, which is dropped at the end.
const externalBase = process.env.TEST_MONGODB_URI;

function externalUri() {
  const worker = process.env.VITEST_POOL_ID || process.env.VITEST_WORKER_ID || process.pid;
  // Keep independent local test runs apart when another tool also uses MongoDB.
  const namespace = process.env.TEST_DB_NAMESPACE || '';
  if (namespace && !/^[a-zA-Z0-9_]{1,32}$/.test(namespace)) throw new Error('Invalid test database namespace');
  const dbName = `awaaz_dastak_${namespace ? `${namespace}_` : ''}w${worker}_test`;
  const url = new URL(externalBase);
  url.pathname = `/${dbName}`;
  return url.toString();
}

beforeAll(async () => {
  let uri;
  if (externalBase) {
    uri = externalUri();
    if (!/_test$/.test(new URL(uri).pathname)) throw new Error('Refusing to run tests on a database not ending in _test');
  } else {
    mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    uri = mongod.getUri();
  }
  process.env.MONGODB_URI = uri;
  process.env.SESSION_SECRET = 'test-secret';
  process.env.APP_MODE = 'demo';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (externalBase) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
