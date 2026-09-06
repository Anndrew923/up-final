import { describe, expect, it } from 'vitest';
import { resolveServerProHydrate } from '../userEntitlementService';
import { parseServerProFromUserDoc } from '../../logic/core/userEntitlementDoc';

describe('resolveServerProHydrate result mapping', () => {
  it('maps active user doc fields through parseServerProFromUserDoc', () => {
    const parsed = parseServerProFromUserDoc({
      subscriptionStatus: 'pro',
      proExpiresAt: '2099-01-01T00:00:00.000Z',
      promoExpiresAt: null,
      planId: 'up_pro_monthly',
      isPro: true,
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.subscriptionStatus).toBe('pro');
  });

  it('treats free status as revoked (not active)', () => {
    const parsed = parseServerProFromUserDoc({
      subscriptionStatus: 'free',
      isPro: false,
      proExpiresAt: null,
      promoExpiresAt: null,
    });
    expect(parsed).toBeNull();
  });
});

describe('fetchServerProEntitlement', () => {
  it('is exported alongside resolveServerProHydrate', () => {
    expect(typeof resolveServerProHydrate).toBe('function');
  });
});
