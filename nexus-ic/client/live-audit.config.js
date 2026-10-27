import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],test:{globals:true,include:['audits/*.audit.jsx'],maxWorkers:1,environment:'jsdom',setupFiles:['./tests/setup.js']}});
