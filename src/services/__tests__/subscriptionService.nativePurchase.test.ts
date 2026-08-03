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
const { purchaseProSubscription, restorePurchasesFromDevice } =
  await import('../subscriptionService');

function seedSignedInBuyer(): void {
  useEntitlementStore.getState().hydrateEntitlement({
    purchaseStatus: 'owned',
    subscriptionStatus: 'free',
    planId: 'core_lifetime_099',
    proExpiresAt: null,
    proPurchaseCooldownUntil: null,
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

describe('subscription service native purchase hard-sync', () => {
  beforeEach(() => {
    memory.clear();
    vi.useFakeTimers();
    triggerProPurchaseCelebration.mockClear();
    syncProEntitlementToServer.mockReset();
    syncProEntitlementToServer.mockResolvedValue({
      ok: true,
      active: true,
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      planId: 'up_pro_monthly',
    });
    revenueCat.purchaseRevenueCatPro.mockReset();
    revenueCat.restoreRevenueCatPurchases.mockReset();
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

  it('awaits hard-sync retries before unlocking local Pro', async () => {
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
    await Promise.resolve();
    expect(useEntitlementStore.getState().isPro).toBe(false);
    expect(triggerProPurchaseCelebration).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    const result = await resultPromise;

    expect(result.ok).toBe(true);
    expect(useEntitlementStore.getState().isPro).toBe(true);
    expect(useEntitlementStore.getState().subscriptionStatus).toBe('pro');
    expect(useEntitlementStore.getState().proPurchaseCooldownUntil).toBeTruthy();
    expect(triggerProPurchaseCelebration).toHaveBeenCalledTimes(1);
    expect(syncProEntitlementToServer).toHaveBeenCalledTimes(2);
    expect(syncProEntitlementToServer).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'activate', source: 'revenuecat' })
    );
  });

  it('keeps UI locked when hard-sync never confirms after charge', async () => {
    seedSignedInBuyer();
    revenueCat.purchaseRevenueCatPro.mockResolvedValue({
      active: true,
      productIdentifier: 'up_pro_monthly',
      expiresDate: '2099-01-01T00:00:00.000Z',
    });
    syncProEntitlementToServer.mockResolvedValue({ ok: false, reason: 'network' });

    const resultPromise = purchaseProSubscription();
    await vi.advanceTimersByTimeAsync(1000 + 3000 + 8000);
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('sync-failed');
    expect(useEntitlementStore.getState().isPro).toBe(false);
    expect(triggerProPurchaseCelebration).not.toHaveBeenCalled();
    expect(syncProEntitlementToServer.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it('rejects active snapshot without a valid expiry before optimistic unlock', async () => {
    seedSignedInBuyer();
    revenueCat.purchaseRevenueCatPro.mockResolvedValue({
      active: true,
      productIdentifier: 'up_pro_monthly',
      expiresDate: null,
    });

    const result = await purchaseProSubscription();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-expiry');
    expect(useEntitlementStore.getState().isPro).toBe(false);
    expect(syncProEntitlementToServer).not.toHaveBeenCalled();
    expect(triggerProPurchaseCelebration).not.toHaveBeenCalled();
  });

  it('blocks inactive restore reconcile while purchase cooldown protects SSOT', async () => {
    seedSignedInBuyer();
    useEntitlementStore.getState().commitServerProEntitlement({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      planId: 'up_pro_monthly',
      armPurchaseCooldown: true,
    });
    syncProEntitlementToServer.mockClear();
    revenueCat.restoreRevenueCatPurchases.mockResolvedValue({
      active: false,
      productIdentifier: null,
      expiresDate: null,
    });

    const result = await restorePurchasesFromDevice();

    expect(result.outcome).toBe('restored');
    expect(result.proActive).toBe(true);
    expect(useEntitlementStore.getState().isPro).toBe(true);
    expect(syncProEntitlementToServer).not.toHaveBeenCalled();
  });

  it('routes PRODUCT_ALREADY_PURCHASED into restore hard-sync', async () => {
    seedSignedInBuyer();
    revenueCat.purchaseRevenueCatPro.mockRejectedValue({
      code: 'PRODUCT_ALREADY_PURCHASED_ERROR',
      message: 'This product has already been purchased.',
    });
    revenueCat.restoreRevenueCatPurchases.mockResolvedValue({
      active: true,
      productIdentifier: 'up_pro_monthly',
      expiresDate: '2099-01-01T00:00:00.000Z',
    });

    const result = await purchaseProSubscription();

    expect(result.ok).toBe(true);
    expect(revenueCat.restoreRevenueCatPurchases).toHaveBeenCalled();
    expect(useEntitlementStore.getState().isPro).toBe(true);
    expect(triggerProPurchaseCelebration).toHaveBeenCalledTimes(1);
  });

  it('classifies restore without valid expiry', async () => {
    seedSignedInBuyer();
    revenueCat.restoreRevenueCatPurchases.mockResolvedValue({
      active: true,
      productIdentifier: 'up_pro_monthly',
      expiresDate: null,
    });

    const result = await restorePurchasesFromDevice();
    expect(result.outcome).toBe('invalid_expiry');
    expect(result.proActive).toBe(false);
    expect(syncProEntitlementToServer).not.toHaveBeenCalled();
  });

  it('classifies restore hard-sync failure', async () => {
    seedSignedInBuyer();
    revenueCat.restoreRevenueCatPurchases.mockResolvedValue({
      active: true,
      productIdentifier: 'up_pro_monthly',
      expiresDate: '2099-01-01T00:00:00.000Z',
    });
    syncProEntitlementToServer.mockResolvedValue({ ok: false, reason: 'network' });

    const resultPromise = restorePurchasesFromDevice();
    await vi.advanceTimersByTimeAsync(1000 + 3000 + 8000);
    const result = await resultPromise;

    expect(result.outcome).toBe('sync_failed');
    expect(result.proActive).toBe(false);
  });

  it('aborts hard-sync retries after purchaser signs out', async () => {
    seedSignedInBuyer();
    revenueCat.purchaseRevenueCatPro.mockResolvedValue({
      active: true,
      productIdentifier: 'up_pro_monthly',
      expiresDate: '2099-01-01T00:00:00.000Z',
    });
    syncProEntitlementToServer.mockResolvedValue({ ok: false, reason: 'network' });

    const resultPromise = purchaseProSubscription();
    // WHY: Let the first activate attempt finish, then revoke session before retry sleeps fire.
    await Promise.resolve();
    await Promise.resolve();
    expect(syncProEntitlementToServer).toHaveBeenCalledTimes(1);

    useAuthStore.getState().setSignedOut();
    await vi.advanceTimersByTimeAsync(1000 + 3000 + 8000);
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    expect(syncProEntitlementToServer).toHaveBeenCalledTimes(1);
    expect(useEntitlementStore.getState().isPro).toBe(false);
  });
});
