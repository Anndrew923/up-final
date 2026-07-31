/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();

const triggerProPurchaseCelebration = vi.fn().mockResolvedValue(undefined);

const revenueCat = vi.hoisted(() => ({
  isRevenueCatConfiguredFromEnv: vi.fn(() => true),
  isRevenueCatNativeBillingAvailable: vi.fn(() => true),
  logInRevenueCatUser: vi.fn().mockResolvedValue(undefined),
  purchaseRevenueCatPro: vi.fn(),
  restoreRevenueCatPurchases: vi.fn(),
}));

const syncProEntitlementToServer = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    ok: true,
    active: true,
    subscriptionStatus: 'pro',
    proExpiresAt: '2099-01-01T00:00:00.000Z',
    planId: 'up_pro_monthly',
  })
);

vi.mock('../hapticService', () => ({
  hapticService: {
    triggerProPurchaseCelebration,
    triggerProPurchaseIntent: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../revenueCatService', () => ({
  isRevenueCatConfiguredFromEnv: revenueCat.isRevenueCatConfiguredFromEnv,
  isRevenueCatNativeBillingAvailable: revenueCat.isRevenueCatNativeBillingAvailable,
  logInRevenueCatUser: revenueCat.logInRevenueCatUser,
  purchaseRevenueCatPro: revenueCat.purchaseRevenueCatPro,
  restoreRevenueCatPurchases: revenueCat.restoreRevenueCatPurchases,
}));

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
const { purchaseProSubscription } = await import('../subscriptionService');

function seedSignedInBuyer(): void {
  useEntitlementStore.getState().hydrateEntitlement({
    purchaseStatus: 'owned',
    subscriptionStatus: 'free',
    planId: 'core_lifetime_099',
    proExpiresAt: null,
  });
  useAuthStore.setState({
    status: 'signed-in',
    uid: 'rc-buyer',
    displayName: 'Buyer',
    email: 'buyer@example.com',
    firebaseDisplayName: 'Buyer',
    photoURL: null,
    isAnonymous: false,
  });
  useEntitlementStore.getState().bindEntitlementSession('rc-buyer');
}

describe('subscription service native purchase', () => {
  beforeEach(() => {
    memory.clear();
    vi.useFakeTimers();
    triggerProPurchaseCelebration.mockClear();
    syncProEntitlementToServer.mockReset();
    revenueCat.purchaseRevenueCatPro.mockReset();
    revenueCat.logInRevenueCatUser.mockClear();
    revenueCat.isRevenueCatConfiguredFromEnv.mockReturnValue(true);
    revenueCat.isRevenueCatNativeBillingAvailable.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    memory.clear();
    useEntitlementStore.getState().resetEntitlement();
    useAuthStore.getState().setSignedOut();
  });

  it('unlocks locally and returns ok even when first server sync fails', async () => {
    seedSignedInBuyer();
    revenueCat.purchaseRevenueCatPro.mockResolvedValue({
      active: true,
      productIdentifier: 'up_pro_monthly',
      expiresDate: '2099-01-01T00:00:00.000Z',
    });
    syncProEntitlementToServer
      .mockResolvedValueOnce({ ok: false, reason: 'verification-failed' })
      .mockResolvedValue({
        ok: true,
        active: true,
        subscriptionStatus: 'pro',
        proExpiresAt: '2099-01-01T00:00:00.000Z',
        planId: 'up_pro_monthly',
      });

    const resultPromise = purchaseProSubscription();
    const result = await resultPromise;

    expect(result.ok).toBe(true);
    expect(useEntitlementStore.getState().isPro).toBe(true);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('pro');
    expect(triggerProPurchaseCelebration).toHaveBeenCalledTimes(1);
    expect(syncProEntitlementToServer).toHaveBeenCalledTimes(1);
    expect(syncProEntitlementToServer).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'activate', source: 'revenuecat' })
    );

    await vi.advanceTimersByTimeAsync(1000);
    expect(syncProEntitlementToServer).toHaveBeenCalledTimes(2);
    expect(useEntitlementStore.getState().isPro).toBe(true);
  });

  it('aborts background sync retries after purchaser signs out', async () => {
    seedSignedInBuyer();
    revenueCat.purchaseRevenueCatPro.mockResolvedValue({
      active: true,
      productIdentifier: 'up_pro_monthly',
      expiresDate: '2099-01-01T00:00:00.000Z',
    });
    syncProEntitlementToServer.mockResolvedValue({ ok: false, reason: 'network' });

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(true);
    expect(syncProEntitlementToServer).toHaveBeenCalledTimes(1);

    useAuthStore.getState().setSignedOut();
    await vi.advanceTimersByTimeAsync(1000 + 3000 + 8000);
    expect(syncProEntitlementToServer).toHaveBeenCalledTimes(1);
  });

  it('never rolls back local Pro after a confirmed store entitlement', async () => {
    seedSignedInBuyer();
    revenueCat.purchaseRevenueCatPro.mockResolvedValue({
      active: true,
      productIdentifier: 'up_pro_monthly',
      expiresDate: '2099-06-01T00:00:00.000Z',
    });
    syncProEntitlementToServer.mockResolvedValue({ ok: false, reason: 'network' });

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(true);
    expect(useEntitlementStore.getState().isPro).toBe(true);

    await vi.advanceTimersByTimeAsync(1000 + 3000 + 8000);
    expect(syncProEntitlementToServer.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(useEntitlementStore.getState().isPro).toBe(true);
  });
});
