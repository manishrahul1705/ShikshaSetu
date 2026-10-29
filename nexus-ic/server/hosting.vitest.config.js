import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/hosting.test.js'], setupFiles: [] } });
