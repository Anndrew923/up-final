import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();

const triggerProPurchaseCelebration = vi.fn().mockResolvedValue(undefined);

vi.mock('../hapticService', () => ({
  hapticService: {
    triggerProPurchaseCelebration,
    triggerProPurchaseIntent: vi.fn().mockResolvedValue(undefined),
  },
}));

const syncProEntitlementToServer = vi.fn().mockResolvedValue({
  ok: true,
  proExpiresAt: null,
  planId: 'pro_monthly',
});

vi.mock('../subscriptionSyncService', () => ({
  syncProEntitlementToServer,
}));

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
    triggerProPurchaseCelebration.mockClear();
    syncProEntitlementToServer.mockReset();
    syncProEntitlementToServer.mockResolvedValue({
      ok: true,
      proExpiresAt: null,
      planId: 'pro_monthly',
    });
  });

  afterEach(() => {
    memory.clear();
    useEntitlementStore.getState().resetEntitlement();
    useAuthStore.getState().setSignedOut();
  });

  it('allows purchase path when Core is download-included (always owned)', async () => {
    useEntitlementStore.getState().resetEntitlement();
    expect(useEntitlementStore.getState().purchaseStatus).toBe('owned');
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
    expect(result.ok).toBe(true);
    expect(triggerProPurchaseCelebration).toHaveBeenCalled();
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
    expect(triggerProPurchaseCelebration).toHaveBeenCalledTimes(1);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('pro');
    expect(useEntitlementStore.getState().isPro).toBe(true);

    const persisted = loadPersistedEntitlement('tester');
    expect(persisted?.isPro).toBe(true);
    expect(persisted?.subscriptionStatus).toBe('pro');
  });

  it('rolls back local pro when server sync fails after simulation purchase', async () => {
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
    syncProEntitlementToServer.mockResolvedValueOnce({ ok: false, reason: 'simulation-denied' });

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(false);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('free');
    expect(useEntitlementStore.getState().isPro).toBe(false);
  });

  it('returns empty restore result when no provider and no snapshot', async () => {
    const restored = await restorePurchasesFromDevice();
    expect(restored.hadSnapshot).toBe(false);
    expect(restored.proActive).toBe(false);
  });
});
