import { isCapacitorNativePlatform } from '../lib/capacitorPlatform';
import { getFirebaseAuthErrorDetails } from './firebaseAuthError';
import { ensureFreshAppCheckToken } from './firebaseAppCheck';
import { ensureFreshFirebaseIdToken } from './firebaseClient';

/** Firestore read failure surfaced from FirebaseError.code (not entitlement gates). */
export type LeaderboardFirestoreErrorReason =
  | 'permission-denied'
  | 'unauthenticated'
  | 'unavailable'
  | 'failed-precondition'
  | 'app-check'
  | 'unknown';

export type LeaderboardReadFailureReason = 'pro-required' | LeaderboardFirestoreErrorReason;

let inFlightPrepareRead: Promise<void> | null = null;

function shouldLogLeaderboardFirestoreErrors(): boolean {
  // WHY: iOS/Android shells ship production bundles — Safari / Xcode still need structured logs.
  return import.meta.env.DEV || isCapacitorNativePlatform();
}

/** Structured Firestore failure log for DEV + native WebView inspectors. */
export function logLeaderboardFirestoreError(scope: string, err: unknown): void {
  if (!shouldLogLeaderboardFirestoreErrors()) return;
  const { code, message } = getFirebaseAuthErrorDetails(err);
  const resolvedCode = code || 'unknown';
  const payload = { code: resolvedCode, message, err };
  if (resolvedCode === 'permission-denied' || resolvedCode === 'unauthenticated') {
    console.error(`[leaderboard] ${scope}`, payload);
    return;
  }
  console.warn(`[leaderboard] ${scope}`, payload);
}

export function resolveLeaderboardFirestoreErrorReason(
  err: unknown
): LeaderboardFirestoreErrorReason {
  const { code, message } = getFirebaseAuthErrorDetails(err);
  const normalizedMessage = message.toLowerCase();
  if (code === 'permission-denied') return 'permission-denied';
  if (code === 'unauthenticated') return 'unauthenticated';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'unavailable';
  if (code === 'failed-precondition') return 'failed-precondition';
  if (code.includes('app-check') || normalizedMessage.includes('app check')) return 'app-check';
  return 'unknown';
}

/**
 * Prefetch Auth + App Check before native Firestore ladder reads.
 * WHY: Callable writes already refresh tokens; direct getDocs had no equivalent warm-up.
 * Concurrent ladder hooks share one in-flight prepare to avoid triple native bridge bursts.
 */
export async function prepareLeaderboardFirestoreRead(): Promise<void> {
  if (!isCapacitorNativePlatform()) return;
  if (inFlightPrepareRead) {
    await inFlightPrepareRead;
    return;
  }

  inFlightPrepareRead = Promise.all([
    ensureFreshFirebaseIdToken(),
    ensureFreshAppCheckToken(false),
  ])
    .then(() => undefined)
    .finally(() => {
      inFlightPrepareRead = null;
    });

  await inFlightPrepareRead;
}

/** Test-only reset for vitest isolation. */
export function resetLeaderboardFirestoreSessionForTests(): void {
  if (!import.meta.env.VITEST) return;
  inFlightPrepareRead = null;
}
