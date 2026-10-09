import { beforeEach, describe, expect, it, vi } from 'vitest';

const revenueCat = vi.hoisted(() => ({
  isRevenueCatConfiguredFromEnv: vi.fn(() => true),
  isRevenueCatNativeBillingAvailable: vi.fn(() => true),
  logInRevenueCatUser: vi.fn().mockResolvedValue(undefined),
  purchaseRevenueCatPro: vi.fn(),
  restoreRevenueCatPurchases: vi.fn(),
  readLocallySyncedReferrer: vi.fn(() => null as string | null),
  setReferrerAttribute: vi.fn().mockResolvedValue(undefined),
}));

const fetchRedeemedReferrerCode = vi.hoisted(() => vi.fn());
const logEntitlementSync = vi.hoisted(() => vi.fn());

vi.mock('../hapticService', () => ({
  hapticService: {
    triggerProPurchaseCelebration: vi.fn(),
    triggerProPurchaseIntent: vi.fn(),
  },
}));

vi.mock('../subscriptionSyncService', () => ({
  syncProEntitlementToServer: vi.fn(),
}));

vi.mock('../revenueCatService', () => ({
  isRevenueCatConfiguredFromEnv: revenueCat.isRevenueCatConfiguredFromEnv,
  isRevenueCatNativeBillingAvailable: revenueCat.isRevenueCatNativeBillingAvailable,
  logInRevenueCatUser: revenueCat.logInRevenueCatUser,
  purchaseRevenueCatPro: revenueCat.purchaseRevenueCatPro,
  restoreRevenueCatPurchases: revenueCat.restoreRevenueCatPurchases,
  readLocallySyncedReferrer: revenueCat.readLocallySyncedReferrer,
  setReferrerAttribute: revenueCat.setReferrerAttribute,
}));

vi.mock('../userEntitlementService', () => ({
  logEntitlementSync,
  fetchRedeemedReferrerCode,
  shouldPreserveLocalProAgainstInactiveStore: vi.fn(),
}));

const { bindRevenueCatIdentityForSession } = await import('../subscriptionService');

describe('bindRevenueCatIdentityForSession referrer backfill', () => {
  beforeEach(() => {
    revenueCat.isRevenueCatNativeBillingAvailable.mockReturnValue(true);
    revenueCat.logInRevenueCatUser.mockClear();
    revenueCat.logInRevenueCatUser.mockResolvedValue(undefined);
    revenueCat.readLocallySyncedReferrer.mockReturnValue(null);
    revenueCat.setReferrerAttribute.mockReset();
    revenueCat.setReferrerAttribute.mockResolvedValue(undefined);
    fetchRedeemedReferrerCode.mockReset();
    logEntitlementSync.mockClear();
  });

  it('skips Firestore and SDK when this Native session already tagged the referrer', async () => {
    revenueCat.readLocallySyncedReferrer.mockReturnValue('FIN_S0');
    await bindRevenueCatIdentityForSession('uid-1');
    expect(revenueCat.logInRevenueCatUser).toHaveBeenCalledWith('uid-1');
    expect(fetchRedeemedReferrerCode).not.toHaveBeenCalled();
    expect(revenueCat.setReferrerAttribute).not.toHaveBeenCalled();
  });

  it('backfills from Firestore when a redeemed code exists and local is empty', async () => {
    fetchRedeemedReferrerCode.mockResolvedValue('FIN_S0');
    await bindRevenueCatIdentityForSession('uid-1');
    await vi.waitFor(() => {
      expect(fetchRedeemedReferrerCode).toHaveBeenCalledWith('uid-1');
      expect(revenueCat.setReferrerAttribute).toHaveBeenCalledWith('FIN_S0', 'uid-1');
    });
  });

  it('does not write when Firestore has no redeemed code', async () => {
    fetchRedeemedReferrerCode.mockResolvedValue(null);
    await bindRevenueCatIdentityForSession('uid-1');
    await vi.waitFor(() => {
      expect(fetchRedeemedReferrerCode).toHaveBeenCalledWith('uid-1');
    });
    expect(revenueCat.setReferrerAttribute).not.toHaveBeenCalled();
  });

  it('does not block login when Firestore read fails', async () => {
    fetchRedeemedReferrerCode.mockRejectedValue(new Error('offline'));
    await expect(bindRevenueCatIdentityForSession('uid-1')).resolves.toBeUndefined();
    expect(revenueCat.logInRevenueCatUser).toHaveBeenCalledWith('uid-1');
    await vi.waitFor(() => {
      expect(logEntitlementSync).toHaveBeenCalledWith(
        'rc-referrer-sync-error',
        expect.objectContaining({ uid: 'uid-1' })
      );
    });
  });
});
