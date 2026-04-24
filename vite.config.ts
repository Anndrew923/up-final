import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJsonPath = resolve(__dirname, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version?: string };
const appVersion = packageJson.version ?? '0.0.0';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('i18next')) return 'vendor-i18n';
          return 'vendor-misc';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
