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
const appCheckSiteKey = String(
  process.env.VITE_APP_CHECK_SITE_KEY ?? env.VITE_APP_CHECK_SITE_KEY ?? ''
).trim();
const knownTestAppCheckKeys = new Set([
  // Google-published reCAPTCHA v2 key that always passes; never valid for production App Check.
  '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
]);

if (callable !== 'true') {
  console.error(
    '[build] VITE_LADDER_CALLABLE_WRITES must be "true" for production builds.\n' +
      '       Set it in `.env` and/or `.env.production`, then run `npm run build` again.'
  );
  process.exit(1);
}

if (emulators === 'true') {
  console.error(
    '[build] VITE_FIREBASE_USE_EMULATORS must not be "true" for production builds.\n' +
      '       Refusing to create a bundle that targets local emulators.'
  );
  process.exit(1);
}

if (process.env.REQUIRE_WEB_APP_CHECK === 'true' && !appCheckSiteKey) {
  console.error(
    '[build] VITE_APP_CHECK_SITE_KEY is required for web/Hosting production builds.\n' +
      '       Refusing to ship a web client that cannot call App Check-protected Functions.'
  );
  process.exit(1);
}

if (
  process.env.REQUIRE_WEB_APP_CHECK === 'true' &&
  knownTestAppCheckKeys.has(appCheckSiteKey)
) {
  console.error(
    '[build] VITE_APP_CHECK_SITE_KEY is a public reCAPTCHA test key.\n' +
      '       Refusing to create a production Web/Hosting bundle with bypass credentials.'
  );
  process.exit(1);
}

console.log('[build] Ladder Callable writes: enabled (production env OK)');
