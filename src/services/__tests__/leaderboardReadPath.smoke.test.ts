import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntitlementState } from '../../types/entitlement';

const {
  getDocsMock,
  getDocMock,
  startAfterMock,
  queryMock,
  orderByMock,
  limitMock,
  collectionMock,
  docMock,
} = vi.hoisted(() => ({
  getDocsMock: vi.fn(),
  getDocMock: vi.fn(),
  startAfterMock: vi.fn((...args: unknown[]) => ({ __startAfter: args })),
  queryMock: vi.fn((...args: unknown[]) => ({ __query: args })),
  orderByMock: vi.fn((field: string, dir?: string) => ({ __orderBy: [field, dir] })),
  limitMock: vi.fn((n: number) => ({ __limit: n })),
  collectionMock: vi.fn(() => ({ __collection: true })),
  docMock: vi.fn((_db: unknown, ...path: string[]) => ({ __path: path.join('/') })),
}));

vi.mock('firebase/firestore', () => ({
  collection: collectionMock,
  doc: docMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  getCountFromServer: vi.fn(),
  limit: limitMock,
  orderBy: orderByMock,
  query: queryMock,
  startAfter: startAfterMock,
  where: vi.fn(),
  setDoc: vi.fn(),
  deleteField: vi.fn(),
}));

vi.mock('../firebaseClient', () => ({
  getFirestoreDb: () => ({ __db: true }),
  getCurrentFirebaseUser: () => null,
}));

import {
  clearLeaderboardCache,
  LEADERBOARD_CATALOG_CACHE_PAGE,
  LEADERBOARD_CATALOG_TTL_MS,
  lookupLeaderboardCache,
  setCachedLeaderboard,
} from '../leaderboardCacheService';
import { clearLeaderboardReadCaches, listLeaderboard, listLeaderboardCatalog } from '../leaderboardService';

function ownedProEntitlement(): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'pro',
    isPro: true,
    proExpiresAt: null,
    planId: 'pro_monthly_099',
    lastCheckedAt: null,
    proPurchaseCooldownUntil: null,
  };
}

function fakeDoc(uid: string, scoreBest: number) {
  return {
    id: uid,
    data: () => ({
      displayName: uid,
      scoreBest,
      updatedAt: '2026-01-01T00:00:00.000Z',
    }),
    exists: () => true,
  };
}

describe('leaderboard read-path smoke', () => {
  beforeEach(() => {
    clearLeaderboardReadCaches();
    getDocsMock.mockReset();
    getDocMock.mockReset();
    startAfterMock.mockClear();
    queryMock.mockClear();
  });

  afterEach(() => {
    clearLeaderboardReadCaches();
    clearLeaderboardCache();
  });

  it('page 2 uses prior-page cursor instead of re-walking from page 1', async () => {
    const page1Docs = [fakeDoc('u1', 100), fakeDoc('u2', 99)];
    const page2Docs = [fakeDoc('u3', 98)];

    getDocsMock
      .mockResolvedValueOnce({ empty: false, docs: page1Docs })
      .mockResolvedValueOnce({ empty: false, docs: page2Docs });

    const entitlement = ownedProEntitlement();
    const first = await listLeaderboard({
      entitlement,
      metric: 'armSize',
      page: 1,
      pageSize: 2,
    });
    expect(first.ok).toBe(true);
    expect(first.items?.map((r) => r.uid)).toEqual(['u1', 'u2']);
    expect(getDocsMock).toHaveBeenCalledTimes(1);

    const second = await listLeaderboard({
      entitlement,
      metric: 'armSize',
      page: 2,
      pageSize: 2,
    });
    expect(second.ok).toBe(true);
    expect(second.items?.map((r) => r.uid)).toEqual(['u3']);
    // One query for page 1 + one for page 2 — never cumulative 1…N walk.
    expect(getDocsMock).toHaveBeenCalledTimes(2);
    expect(startAfterMock).toHaveBeenCalled();
  });

  it('does not cache an empty page when prior cursor is missing', async () => {
    const entitlement = ownedProEntitlement();
    const miss = await listLeaderboard({
      entitlement,
      metric: 'gripStrength',
      page: 3,
      pageSize: 25,
    });

    expect(miss.ok).toBe(false);
    expect(getDocsMock).not.toHaveBeenCalled();
    expect(
      lookupLeaderboardCache({ metric: 'gripStrength', page: 3, pageSize: 25 })
    ).toBeNull();
  });

  it('serves stale catalog from cache (SWR) before waiting on network', async () => {
    setCachedLeaderboard({
      metric: 'strength',
      page: LEADERBOARD_CATALOG_CACHE_PAGE,
      items: [
        {
          uid: 'cached',
          displayName: 'Cached',
          scoreBest: 120,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      cachedAt: new Date(Date.now() - LEADERBOARD_CATALOG_TTL_MS - 1_000).toISOString(),
    });

    // Background revalidate may call getDocs; keep it pending so the await path cannot be it.
    let resolveDocs!: (value: { empty: boolean; docs: unknown[] }) => void;
    getDocsMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDocs = resolve;
        })
    );

    const result = await listLeaderboardCatalog({
      entitlement: ownedProEntitlement(),
      metric: 'strength',
    });

    expect(result.ok).toBe(true);
    expect(result.fromCache).toBe(true);
    expect(result.stale).toBe(true);
    expect(result.items?.[0]?.uid).toBe('cached');
    resolveDocs?.({ empty: true, docs: [] });
  });
});
