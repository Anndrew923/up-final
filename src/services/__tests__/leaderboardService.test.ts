import { describe, expect, it } from 'vitest';
import {
  getMyLeaderboardEntry,
  getRankByScoreBest,
  listLeaderboard,
  submitLeaderboardScore,
} from '../leaderboardService';
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

  it('accepts a lower score and updates the stored row (body-weight changes can move rank)', async () => {
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
    expect(first.updated).toBe(true);
    expect(first.submittedScore).toBe(120);
    expect(typeof first.rateLimitResetAt).toBe('string');
    expect(first.rateLimitRemaining).toBe(2);

    expect(second.ok).toBe(true);
    expect(second.updated).toBe(true);
    expect(second.submittedScore).toBe(119);
    expect(second.previousScore).toBe(120);
    expect(second.improved).toBe(false);
    expect(second.rateLimitRemaining).toBe(1);
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

  it('persists avatarUrl in memory backend when provided', async () => {
    const entitlement = ownedProEntitlement();
    const avatarUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    await submitLeaderboardScore({
      entitlement,
      input: {
        uid: 'u5',
        metric: 'explosive_composite',
        score: 200,
        displayName: 'WithFace',
        avatarUrl,
      },
    });

    const listed = await listLeaderboard({ entitlement, metric: 'explosive_composite', page: 1 });
    expect(listed.ok).toBe(true);
    expect(listed.items?.find((r) => r.uid === 'u5')?.avatarUrl).toBe(avatarUrl);
  });

  it('memory backend stores score-only rows (no displayRaw)', async () => {
    const entitlement = ownedProEntitlement();
    await submitLeaderboardScore({
      entitlement,
      input: {
        uid: 'u6',
        metric: 'gripStrength',
        score: 90,
        displayName: 'G',
      },
    });
    const listed = await listLeaderboard({ entitlement, metric: 'gripStrength', page: 1 });
    expect(listed.ok).toBe(true);
    const row = listed.items?.find((r) => r.uid === 'u6');
    expect(row?.scoreBest).toBe(90);
    expect(row?.displayRaw).toBeUndefined();
    expect(row?.displayRawUnit).toBeUndefined();
  });

  it('masks display name and strips avatar when anonymous mode is enabled', async () => {
    const entitlement = ownedProEntitlement();
    await submitLeaderboardScore({
      entitlement,
      input: {
        uid: 'u6-anon',
        metric: 'gripStrength',
        score: 95,
        displayName: 'RealName',
        avatarUrl: 'https://example.com/avatar.png',
        profile: {
          gender: 'male',
          age: 30,
          heightCm: 175,
          weightKg: 75,
          ageBucket: '30-39',
          heightBucket: '170-180',
          weightBucket: '70-80kg',
          regionScope: 'country',
          countryCode: 'TW',
          isAnonymousInLadder: true,
        },
      },
    });
    const listed = await listLeaderboard({ entitlement, metric: 'gripStrength', page: 1 });
    expect(listed.ok).toBe(true);
    const row = listed.items?.find((r) => r.uid === 'u6-anon');
    expect(row?.displayName).toBe('Anonymous');
    expect(row?.avatarUrl).toBeUndefined();
    expect(row?.isAnonymousInLadder).toBe(true);
  });

  it('returns my entry and global rank for shard', async () => {
    const entitlement = ownedProEntitlement();
    await submitLeaderboardScore({
      entitlement,
      input: { uid: 'u7-top', metric: 'ladderScore', score: 150, displayName: 'Top' },
    });
    await submitLeaderboardScore({
      entitlement,
      input: { uid: 'u7-me', metric: 'ladderScore', score: 120, displayName: 'Me' },
    });

    const myEntry = await getMyLeaderboardEntry({
      entitlement,
      metric: 'ladderScore',
      uid: 'u7-me',
    });
    expect(myEntry.ok).toBe(true);
    expect(myEntry.item?.scoreBest).toBe(120);

    const rank = await getRankByScoreBest({
      entitlement,
      metric: 'ladderScore',
      uid: 'u7-me',
      scoreBest: 120,
    });
    expect(rank.ok).toBe(true);
    expect(rank.rank).toBe(2);
  });

  it('returns null rank when no valid score is provided', async () => {
    const entitlement = ownedProEntitlement();
    const rank = await getRankByScoreBest({
      entitlement,
      metric: 'armSize',
      uid: 'u8',
      scoreBest: 0,
    });
    expect(rank.ok).toBe(true);
    expect(rank.rank).toBeNull();
  });
});
