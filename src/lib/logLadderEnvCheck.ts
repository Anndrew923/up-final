import { isLadderCallableWritesEnabled } from '../config/ladderCallable';

/**
 * DEV-only ladder write-path probe at cold start.
 *
 * Design intent (WHY):
 * - `VITE_*` values are baked in when `npm run dev` starts; editing `.env` without restart
 *   leaves a stale bundle that still calls `leaderboardService` setDoc (P2 rules deny writes).
 * - Logging the resolved boolean (not only the raw string) matches runtime behavior of
 *   `isLadderCallableWritesEnabled()` used by batch upload and submit paths.
 */
export function logLadderEnvCheckInDev(): void {
  if (!import.meta.env.DEV) return;

  // WHY: `console.debug` stays available under Verbose but drops out of the default Console filter.
  console.debug('[ENV_CHECK]', {
    ladderCallableWrites: isLadderCallableWritesEnabled(),
    firebaseUseEmulators: import.meta.env.VITE_FIREBASE_USE_EMULATORS,
    rawLadderCallableWrites: import.meta.env.VITE_LADDER_CALLABLE_WRITES,
  });
}
