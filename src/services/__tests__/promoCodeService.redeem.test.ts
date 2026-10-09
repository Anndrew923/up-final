import { beforeEach, describe, expect, it, vi } from 'vitest';

const callable = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({
  currentUser: { uid: 'buyer-1', isAnonymous: false } as {
    uid: string;
    isAnonymous: boolean;
  } | null,
}));
const setReferrerAttribute = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../firebaseClient', () => ({
  getFirebaseAuth: () => ({ currentUser: authState.currentUser }),
  getFirebaseFunctions: () => ({}),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: () => callable,
}));

vi.mock('../revenueCatService', () => ({
  setReferrerAttribute,
}));

const { redeemPromoCode } = await import('../promoCodeService');

describe('redeemPromoCode', () => {
  beforeEach(() => {
    callable.mockReset();
    setReferrerAttribute.mockReset();
    setReferrerAttribute.mockResolvedValue(undefined);
    authState.currentUser = { uid: 'buyer-1', isAnonymous: false };
  });

  it('sends a trimmed uppercase code and tags RevenueCat after success', async () => {
    callable.mockResolvedValue({
      data: {
        ok: true,
        promoExpiresAt: '2099-01-01T00:00:00.000Z',
        grantDays: 60,
        attributionEndsAt: '2099-06-01T00:00:00.000Z',
      },
    });

    const result = await redeemPromoCode('  fin_s0  ');

    expect(result).toEqual({
      ok: true,
      promoExpiresAt: '2099-01-01T00:00:00.000Z',
      grantDays: 60,
      attributionEndsAt: '2099-06-01T00:00:00.000Z',
    });
    expect(callable).toHaveBeenCalledWith({ code: 'FIN_S0' });
    expect(setReferrerAttribute).toHaveBeenCalledWith('FIN_S0', 'buyer-1');
  });

  it('still returns ok when RevenueCat tagging throws', async () => {
    callable.mockResolvedValue({
      data: {
        ok: true,
        promoExpiresAt: '2099-01-01T00:00:00.000Z',
        grantDays: 60,
        attributionEndsAt: '2099-06-01T00:00:00.000Z',
      },
    });
    setReferrerAttribute.mockRejectedValueOnce(new Error('sdk down'));

    const result = await redeemPromoCode('FIN_S0');
    expect(result.ok).toBe(true);
  });

  it('rejects blank input without calling the callable', async () => {
    const result = await redeemPromoCode('   ');
    expect(result).toEqual({ ok: false, reason: 'invalid' });
    expect(callable).not.toHaveBeenCalled();
    expect(setReferrerAttribute).not.toHaveBeenCalled();
  });
});
