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
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('i18next')) return 'vendor-i18n';
          // Keep React shims in the React chunk — avoids vendor-misc ↔ vendor-react circular imports
          // that leave `React.createContext` undefined at runtime (production black screen).
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('use-sync-external-store') ||
            id.includes('framer-motion') ||
            id.includes('motion-dom') ||
            id.includes('motion-utils') ||
            id.includes('zustand')
          ) {
            return 'vendor-react';
          }
          if (id.includes('@revenuecat') || id.includes('@capacitor')) return 'vendor-native';
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
