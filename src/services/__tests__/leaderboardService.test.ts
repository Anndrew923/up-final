import { describe, expect, it } from 'vitest';
import { listLeaderboard, submitLeaderboardScore } from '../leaderboardService';
import type { EntitlementState } from '../../types/entitlement';

function ownedFreeEntitlement(): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'free',
    isPro: false,
    proExpiresAt: null,
    planId: 'core_lifetime_099',
    lastCheckedAt: null,
  };
}

function ownedProEntitlement(): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'pro',
    isPro: true,
    proExpiresAt: null,
    planId: 'pro_monthly_099',
    lastCheckedAt: null,
  };
}

describe('leaderboard service guards', () => {
  it('allows list leaderboard for non-pro when paywall is disabled', async () => {
    const result = await listLeaderboard({
      entitlement: ownedFreeEntitlement(),
      metric: 'armSize',
      page: 1,
    });
    expect(result.ok).toBe(true);
    expect(result.items).toBeDefined();
  });

  it('accepts non-pro submit when paywall is disabled', async () => {
    const result = await submitLeaderboardScore({
      entitlement: ownedFreeEntitlement(),
      input: { uid: 'u1', metric: 'armSize', score: 88, displayName: 'A' },
    });

    expect(result.ok).toBe(true);
    expect(result.updated).toBe(true);
  });

  it('blocks when over hourly upload limit', async () => {
    const entitlement = ownedProEntitlement();
    const input = { uid: 'u2', metric: 'gripStrength' as const, score: 100, displayName: 'B' };

    await submitLeaderboardScore({ entitlement, input: { ...input, score: 101 } });
    await submitLeaderboardScore({ entitlement, input: { ...input, score: 102 } });
    await submitLeaderboardScore({ entitlement, input: { ...input, score: 103 } });
    const result = await submitLeaderboardScore({ entitlement, input: { ...input, score: 104 } });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('rate-limited');
  });

  it('skips write when score is not greater than best', async () => {
    const entitlement = ownedProEntitlement();
    const first = await submitLeaderboardScore({
      entitlement,
      input: { uid: 'u3', metric: 'armSize', score: 120, displayName: 'C' },
    });
    const second = await submitLeaderboardScore({
      entitlement,
      input: { uid: 'u3', metric: 'armSize', score: 119, displayName: 'C' },
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.reason).toBe('not-best-score');
    expect(second.updated).toBe(false);
    expect(second.previousBest).toBe(120);
    expect(second.newBest).toBe(120);
    expect(second.improved).toBe(false);
  });

  it('persists optional ladder profile projection in memory backend', async () => {
    const entitlement = ownedProEntitlement();
    await submitLeaderboardScore({
      entitlement,
      input: {
        uid: 'u4',
        metric: 'strength',
        score: 140,
        displayName: 'D',
        profile: {
          gender: 'male',
          age: 33,
          heightCm: 175,
          weightKg: 78,
          ageBucket: '30-39',
          heightBucket: '170-180',
          weightBucket: '70-80kg',
          regionScope: 'country',
          countryCode: 'TW',
        },
      },
    });

    const listed = await listLeaderboard({
      entitlement,
      metric: 'strength',
      page: 1,
    });
    expect(listed.ok).toBe(true);
    expect(listed.items?.[0]).toMatchObject({
      uid: 'u4',
      ageBucket: '30-39',
      countryCode: 'TW',
      rank: 1,
    });
  });

});
