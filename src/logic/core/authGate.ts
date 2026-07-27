/** Auth session status mirrored from `authStore` — kept local to avoid UI/store imports in logic. */
export type AuthGateStatus = 'loading' | 'signed-out' | 'signed-in';

export interface MainAppAccessInput {
  authStatus: AuthGateStatus;
  isAnonymous: boolean;
  hasOnboarding: boolean;
}

export type AuthGateInput = MainAppAccessInput & { isFirebaseReady: boolean };

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

/**
 * Settled session that must see identity choice.
 * WHY: While `loading`, forcing a redirect races with persistence restore and flashes wrong UI.
 */
export function shouldForceAuthChoice(input: AuthGateInput): boolean {
  if (!input.isFirebaseReady) return false;
  if (input.authStatus === 'loading') return false;
  return !canEnterMainApp(input);
}

/**
 * Cold-start splash only — pure bg, no AppShell underneath.
 * WHY: Overlay-over-mounted-shell still paints a few frames when the overlay unmounts.
 */
export function shouldHoldAuthBootstrapSplash(input: AuthGateInput): boolean {
  if (!input.isFirebaseReady) return false;
  if (input.authStatus !== 'loading') return false;
  return !canEnterMainApp(input);
}

/**
 * Hard render gate: AppShell must not mount during splash or forced auth choice.
 * WHY: Prevents FOUC / boot-sequence leak before the welcome modal is ready.
 */
export function canMountAppShell(input: AuthGateInput): boolean {
  return !shouldHoldAuthBootstrapSplash(input) && !shouldForceAuthChoice(input);
}
