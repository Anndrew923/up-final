/**
 * Fails `npm run build` when ladder Callable writes would be disabled in production.
 * WHY: P2 Firestore rules deny client leaderboard setDoc; a false build ships "sync" UI
 * that only reads via getDoc and fails writes with permission-denied / system errors.
 */
import { loadEnv } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('production', root, 'VITE_');

const callable = String(env.VITE_LADDER_CALLABLE_WRITES ?? '').trim();
const emulators = String(env.VITE_FIREBASE_USE_EMULATORS ?? '').trim();

if (callable !== 'true') {
  console.error(
    '[build] VITE_LADDER_CALLABLE_WRITES must be "true" for production builds.\n' +
      '       Set it in `.env` and/or `.env.production`, then run `npm run build` again.'
  );
  process.exit(1);
}

if (emulators === 'true') {
  console.warn(
    '[build] Warning: VITE_FIREBASE_USE_EMULATORS=true — production bundle will target local emulators.'
  );
}

console.log('[build] Ladder Callable writes: enabled (production env OK)');
