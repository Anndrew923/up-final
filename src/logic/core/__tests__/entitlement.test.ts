import { describe, expect, it } from 'vitest';
import { canAccessLeaderboard, hasCoreAccess, hasProAccess } from '../entitlement';
import type { EntitlementState } from '../../../types/entitlement';

function buildEntitlement(overrides: Partial<EntitlementState> = {}): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'free',
    isPro: false,
    proExpiresAt: null,
    planId: 'core_lifetime_099',
    lastCheckedAt: null,
    ...overrides,
  };
}

describe('entitlement core guards', () => {
  it('allows core local features when purchaseStatus=owned', () => {
    expect(hasCoreAccess(buildEntitlement({ purchaseStatus: 'owned' }))).toBe(true);
  });

  it('blocks leaderboard when subscription is free/expired', () => {
    const free = buildEntitlement({ subscriptionStatus: 'free' });
    const expired = buildEntitlement({ subscriptionStatus: 'expired' });

    expect(canAccessLeaderboard(free)).toBe(false);
    expect(canAccessLeaderboard(expired)).toBe(false);
  });

  it('allows leaderboard when subscription is pro/grace', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const pro = buildEntitlement({ subscriptionStatus: 'pro' });
    const grace = buildEntitlement({
      subscriptionStatus: 'grace',
      proExpiresAt: '2026-01-01T12:00:00.000Z',
    });

    expect(hasProAccess(pro, now)).toBe(true);
    expect(canAccessLeaderboard(pro, now)).toBe(true);
    expect(hasProAccess(grace, now)).toBe(true);
    expect(canAccessLeaderboard(grace, now)).toBe(true);
  });
});
