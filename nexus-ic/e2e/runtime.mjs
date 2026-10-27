import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

// No reset or seeding here: those require approval and the Judge Mode API.
// Set before importing application modules, which read environment on import.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/awaaz_dastak_showcase';
process.env.PORT = '4317';
process.env.CLIENT_ORIGIN = 'http://127.0.0.1:5317';
process.env.APP_MODE = 'demo';
process.env.NODE_ENV = 'development';
if (!process.env.VAULT_KEY || !process.env.DOCS_KEY) throw new Error('REHEARSAL_ENCRYPTION_KEYS_REQUIRED');
const clientRequire = createRequire(new URL('../client/package.json', import.meta.url));

const [{ createApp }, { connectDB, disconnectDB }, { createServer }, { default: react }] = await Promise.all([
  import('../server/src/app.js'),
  import('../server/src/config/db.js'),
  import(pathToFileURL(clientRequire.resolve('vite')).href),
  import(pathToFileURL(clientRequire.resolve('@vitejs/plugin-react')).href),
]);
await connectDB(process.env.MONGODB_URI);
// Approved isolated rehearsal: bootstrap login accounts only when the dedicated
// database is empty. Full reset/seed remains the authenticated Judge Mode call.
const { default: User } = await import('../server/src/modules/auth/User.js');
if (!(await User.exists({ username: 'supervisor1' }))) throw new Error('PREPARED_SHOWCASE_REQUIRED');
const api = createApp().listen(4317, '127.0.0.1');
await new Promise((resolve, reject) => {
  api.once('listening', resolve);
  api.once('error', reject);
});

// Tailwind's existing relative content paths expect the client workspace cwd.
process.chdir(fileURLToPath(new URL('../client/', import.meta.url)));
const client = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('../client/', import.meta.url)),
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5317,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:4317', changeOrigin: false } },
  },
});
await client.listen();

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await client.close();
  await new Promise((resolve) => api.close(resolve));
  await disconnectDB();
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => stop().then(() => process.exit(0)).catch(() => process.exit(1)));
}
