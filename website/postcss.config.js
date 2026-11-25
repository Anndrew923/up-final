import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    /*
      WHY absolute pin: Vite HMR from monorepo root can resolve the app
      tailwind.config.ts (no `fg`/`void`) and 500 on `@apply text-fg-*`.
    */
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
