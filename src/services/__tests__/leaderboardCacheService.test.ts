import { describe, expect, it } from 'vitest';
import {
  clearLeaderboardCache,
  getCachedLeaderboard,
  setCachedLeaderboard,
} from '../leaderboardCacheService';

describe('leaderboard cache ttl', () => {
  it('returns cache within ttl', () => {
    clearLeaderboardCache();
    setCachedLeaderboard({
      metric: 'armSize',
      page: 1,
      items: [
        { uid: 'u1', displayName: 'A', scoreBest: 100, updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      cachedAt: '2026-01-01T00:00:00.000Z',
    });

    const hit = getCachedLeaderboard({
      metric: 'armSize',
      page: 1,
      ttlMs: 120000,
      now: new Date('2026-01-01T00:01:00.000Z'),
    });

    expect(hit).not.toBeNull();
    expect(hit?.items).toHaveLength(1);
  });

  it('returns null after ttl expiry', () => {
    clearLeaderboardCache();
    setCachedLeaderboard({
      metric: 'gripStrength',
      page: 1,
      items: [
        { uid: 'u1', displayName: 'A', scoreBest: 120, updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      cachedAt: '2026-01-01T00:00:00.000Z',
    });

    const expired = getCachedLeaderboard({
      metric: 'gripStrength',
      page: 1,
      ttlMs: 120000,
      now: new Date('2026-01-01T00:03:01.000Z'),
    });

    expect(expired).toBeNull();
  });
});
