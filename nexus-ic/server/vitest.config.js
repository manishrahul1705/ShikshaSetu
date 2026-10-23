import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    {
      name: 'decode-file-urls',
      resolveId(id) {
        if (id.startsWith('file://')) {
          return fileURLToPath(id);
        }
        if (id.includes('%20')) {
          return decodeURIComponent(id);
        }
      },
    },
  ],
  test: {
    globals: true,
    // Each worker starts a MongoDB instance; bound concurrency without relaxing assertions or timeouts.
    maxWorkers: 2,
    setupFiles: ['./tests/setup.js'],
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
