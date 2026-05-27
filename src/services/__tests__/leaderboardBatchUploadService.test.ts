import { describe, expect, it } from 'vitest';
import type { EntitlementState } from '../../types/entitlement';
import { runLeaderboardBatchUpload } from '../leaderboardBatchUploadService';

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

describe('runLeaderboardBatchUpload', () => {
  it('tallies unchanged shards without counting them as writes', async () => {
    const entitlement = ownedProEntitlement();
    const uid = 'batch-unchanged-user';
    const targets = [
      { metric: 'armSize' as const, score: 88 },
      { metric: 'gripStrength' as const, score: 72 },
    ];

    const first = await runLeaderboardBatchUpload({
      entitlement,
      uid,
      displayName: 'Batch',
      targets,
      delayMs: 0,
    });
    expect(first.summary.updated).toBe(2);
    expect(first.summary.unchanged).toBe(0);

    const second = await runLeaderboardBatchUpload({
      entitlement,
      uid,
      displayName: 'Batch',
      targets,
      delayMs: 0,
    });
    expect(second.summary.attempted).toBe(2);
    expect(second.summary.updated).toBe(0);
    expect(second.summary.unchanged).toBe(2);
    expect(second.summary.errors).toBe(0);
  });
});
