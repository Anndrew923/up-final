import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
