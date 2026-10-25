/**
 * Runs a second copy of the app against the showcase database, beside the normal
 * dev server: API on http://localhost:3100, UI on http://localhost:5180.
 * Seed it first with `npm run showcase:seed`. The shared demo database is untouched.
 */
const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env.showcase') });
require('dotenv').config({ path: path.join(root, '.env') });
const env = {
  ...process.env,
  MONGODB_URI: process.env.SHOWCASE_URI || 'mongodb://127.0.0.1:27017/awaaz_dastak_showcase',
  PORT: '3100',
  CLIENT_ORIGIN: 'http://localhost:5180',
  CLIENT_PORT: '5180',
  API_TARGET: 'http://localhost:3100',
  APP_MODE: 'demo',
  SESSION_COOKIE_NAME: 'awaaz.showcase.sid',
};
const identityUri = new URL(env.MONGODB_URI);
identityUri.pathname = '/awaaz_dastak_identity_simulator';
env.IDENTITY_SIMULATOR_URI = identityUri.toString();
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const kids = [
  // No --watch: edits by other tools must not restart the demo server mid-presentation.
  spawn(process.execPath, ['src/server.js'], { cwd: path.join(root, 'server'), env, stdio: 'inherit' }),
  spawn(npm, ['run', 'dev', '--workspace=client', '--', '--port', '5180', '--strictPort'], { cwd: root, env, stdio: 'inherit', shell: true }),
];
console.log('Showcase: UI http://localhost:5180  (API http://localhost:3100, database awaaz_dastak_showcase)');
const stop = () => kids.forEach((k) => k.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
kids.forEach((k) => k.on('exit', (code) => { stop(); process.exit(code || 0); }));
