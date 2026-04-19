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
  it('blocks list leaderboard for non-pro before cache or remote', async () => {
    const result = await listLeaderboard({
      entitlement: ownedFreeEntitlement(),
      metric: 'armSize',
      page: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('pro-required');
  });

  it('returns pro-required without firestore calls for non-pro', async () => {
    const result = await submitLeaderboardScore({
      entitlement: ownedFreeEntitlement(),
      input: { uid: 'u1', metric: 'armSize', score: 88, displayName: 'A' },
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('pro-required');
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
  });
});
