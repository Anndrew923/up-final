import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => memory.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  safeRemoveItem: (key: string) => {
    memory.delete(key);
  },
}));

const { useAuthStore } = await import('../../stores/authStore');
const { useEntitlementStore } = await import('../../stores/entitlementStore');
const { loadPersistedEntitlement } = await import('../entitlementPersistenceService');
const { purchaseProSubscription, restorePurchasesFromDevice } =
  await import('../subscriptionService');

describe('subscription service', () => {
  beforeEach(() => {
    memory.clear();
  });

  afterEach(() => {
    memory.clear();
    useEntitlementStore.getState().resetEntitlement();
    useAuthStore.getState().setSignedOut();
  });

  it('requires core entitlement before purchase', async () => {
    useEntitlementStore.getState().resetEntitlement();
    useAuthStore.setState({
      status: 'signed-in',
      uid: 'tester',
      displayName: 'Tester',
      email: 'tester@example.com',
      firebaseDisplayName: 'Tester',
      photoURL: null,
      isAnonymous: false,
    });

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('core-required');
    }
  });

  it('requires signed-in identity when purchasing', async () => {
    useEntitlementStore.getState().hydrateEntitlement({
      purchaseStatus: 'owned',
      subscriptionStatus: 'free',
      planId: 'core_lifetime_099',
      proExpiresAt: null,
    });
    useAuthStore.getState().setSignedOut();

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('auth-required');
    }
  });

  it('uses local simulation fallback when RC env keys are unset', async () => {
    useEntitlementStore.getState().hydrateEntitlement({
      purchaseStatus: 'owned',
      subscriptionStatus: 'free',
      planId: 'core_lifetime_099',
      proExpiresAt: null,
    });
    useAuthStore.setState({
      status: 'signed-in',
      uid: 'tester',
      displayName: 'Tester',
      email: 'tester@example.com',
      firebaseDisplayName: 'Tester',
      photoURL: null,
      isAnonymous: false,
    });
    useEntitlementStore.getState().bindEntitlementSession('tester');

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(true);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('pro');
    expect(useEntitlementStore.getState().isPro).toBe(true);

    const persisted = loadPersistedEntitlement('tester');
    expect(persisted?.isPro).toBe(true);
    expect(persisted?.subscriptionStatus).toBe('pro');
  });

  it('returns empty restore result when no provider and no snapshot', async () => {
    const restored = await restorePurchasesFromDevice();
    expect(restored.hadSnapshot).toBe(false);
    expect(restored.proActive).toBe(false);
  });
});
