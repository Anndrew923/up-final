import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

const AUTH_ONBOARDING_DONE_KEY = 'up.authOnboardingDone';

export function hasCompletedAuthOnboarding(): boolean {
  return safeGetItem(AUTH_ONBOARDING_DONE_KEY) === '1';
}

export function markAuthOnboardingCompleted(): void {
  safeSetItem(AUTH_ONBOARDING_DONE_KEY, '1');
}
