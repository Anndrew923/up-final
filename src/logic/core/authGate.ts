/** Auth session status mirrored from `authStore` — kept local to avoid UI/store imports in logic. */
export type AuthGateStatus = 'loading' | 'signed-out' | 'signed-in';

export interface MainAppAccessInput {
  authStatus: AuthGateStatus;
  isAnonymous: boolean;
  hasOnboarding: boolean;
}

/**
 * Whether the user may enter AppShell (home and tabs).
 * WHY: Anonymous Firebase sessions must not be treated as unsigned-out; onboarding flag alone
 * races with indexedDB persistence on Capacitor first launch.
 */
export function canEnterMainApp(input: MainAppAccessInput): boolean {
  if (input.hasOnboarding) return true;
  if (input.authStatus !== 'signed-in') return false;
  return true;
}

export function shouldForceAuthChoice(
  input: MainAppAccessInput & { isFirebaseReady: boolean }
): boolean {
  if (!input.isFirebaseReady) return false;
  if (input.authStatus === 'loading') return false;
  return !canEnterMainApp(input);
}

export function shouldShowAuthBootstrapFallback(
  input: MainAppAccessInput & { isFirebaseReady: boolean }
): boolean {
  if (!input.isFirebaseReady) return false;
  if (input.authStatus !== 'loading') return false;
  return !canEnterMainApp(input);
}
