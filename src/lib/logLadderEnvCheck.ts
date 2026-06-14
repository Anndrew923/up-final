import { isLadderCallableWritesEnabled } from '../config/ladderCallable';
import { isDynoIntelProBypassActive } from '../config/dynoIntelAccess';

/**
 * DEV-only ladder write-path probe at cold start.
 *
 * Design intent (WHY):
 * - `VITE_*` values are baked in when `npm run dev` starts; editing `.env` without restart
 *   leaves a stale bundle that still calls `leaderboardService` setDoc (P2 rules deny writes).
 * - Logging the resolved boolean (not only the raw string) matches runtime behavior of
 *   `isLadderCallableWritesEnabled()` used by batch upload and submit paths.
 * - DYNO INTEL client bypass requires matching Functions env (`DYNO_INTEL_DEV_BYPASS`).
 */
export function logLadderEnvCheckInDev(): void {
  if (!import.meta.env.DEV) return;

  // WHY: `console.debug` stays available under Verbose but drops out of the default Console filter.
  console.debug('[ENV_CHECK]', {
    ladderCallableWrites: isLadderCallableWritesEnabled(),
    dynoIntelProBypass: isDynoIntelProBypassActive(),
    firebaseUseEmulators: import.meta.env.VITE_FIREBASE_USE_EMULATORS,
    rawLadderCallableWrites: import.meta.env.VITE_LADDER_CALLABLE_WRITES,
    rawDynoIntelBetaFree: import.meta.env.VITE_DYNO_INTEL_BETA_FREE,
  });
}
