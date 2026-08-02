import { afterEach, describe, expect, it } from 'vitest';
import {
  clearLeaderboardCache,
  getCachedLeaderboard,
  LEADERBOARD_CATALOG_CACHE_PAGE,
  LEADERBOARD_CATALOG_SWR_MAX_AGE_MS,
  LEADERBOARD_CATALOG_TTL_MS,
  lookupLeaderboardCache,
  setCachedLeaderboard,
} from '../leaderboardCacheService';

afterEach(() => {
  clearLeaderboardCache();
});

describe('leaderboard cache ttl', () => {
  it('returns cache within ttl', () => {
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

  it('returns null after ttl expiry for legacy getCachedLeaderboard', () => {
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

  it('serves catalog as stale after fresh TTL within SWR max age', () => {
    setCachedLeaderboard({
      metric: 'strength',
      page: LEADERBOARD_CATALOG_CACHE_PAGE,
      items: [
        { uid: 'u1', displayName: 'A', scoreBest: 150, updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      cachedAt: '2026-01-01T00:00:00.000Z',
    });

    const justAfterFresh = lookupLeaderboardCache({
      metric: 'strength',
      page: LEADERBOARD_CATALOG_CACHE_PAGE,
      ttlMs: LEADERBOARD_CATALOG_TTL_MS,
      swrMaxAgeMs: LEADERBOARD_CATALOG_SWR_MAX_AGE_MS,
      now: new Date(Date.parse('2026-01-01T00:00:00.000Z') + LEADERBOARD_CATALOG_TTL_MS + 1),
    });

    expect(justAfterFresh?.freshness).toBe('stale');
    expect(justAfterFresh?.data.items[0]?.uid).toBe('u1');
  });

  it('drops catalog after SWR max age', () => {
    setCachedLeaderboard({
      metric: 'strength',
      page: LEADERBOARD_CATALOG_CACHE_PAGE,
      items: [
        { uid: 'u1', displayName: 'A', scoreBest: 150, updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
      cachedAt: '2026-01-01T00:00:00.000Z',
    });

    const tooOld = lookupLeaderboardCache({
      metric: 'strength',
      page: LEADERBOARD_CATALOG_CACHE_PAGE,
      ttlMs: LEADERBOARD_CATALOG_TTL_MS,
      swrMaxAgeMs: LEADERBOARD_CATALOG_SWR_MAX_AGE_MS,
      now: new Date(
        Date.parse('2026-01-01T00:00:00.000Z') + LEADERBOARD_CATALOG_SWR_MAX_AGE_MS + 1
      ),
    });

    expect(tooOld).toBeNull();
  });

  it('stores endCursorUid for pagination rebuild', () => {
    setCachedLeaderboard({
      metric: 'armSize',
      page: 1,
      pageSize: 25,
      endCursorUid: 'u9',
      items: [
        { uid: 'u9', displayName: 'Z', scoreBest: 99, updatedAt: new Date().toISOString() },
      ],
      cachedAt: new Date().toISOString(),
    });

    const hit = lookupLeaderboardCache({ metric: 'armSize', page: 1, pageSize: 25 });
    expect(hit?.freshness).toBe('fresh');
    expect(hit?.data.endCursorUid).toBe('u9');
    expect(hit?.data.pageSize).toBe(25);
  });

  it('does not reuse a list page cached under a different pageSize', () => {
    setCachedLeaderboard({
      metric: 'armSize',
      page: 1,
      pageSize: 25,
      items: [
        { uid: 'u1', displayName: 'A', scoreBest: 10, updatedAt: new Date().toISOString() },
      ],
      cachedAt: new Date().toISOString(),
    });

    const miss = lookupLeaderboardCache({ metric: 'armSize', page: 1, pageSize: 20 });
    expect(miss).toBeNull();
  });
});
