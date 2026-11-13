import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntitlementState } from '../../types/entitlement';

const { getDocMock, docMock } = vi.hoisted(() => ({
  getDocMock: vi.fn(),
  docMock: vi.fn((_db: unknown, ...path: string[]) => ({ __path: path.join('/') })),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: docMock,
  getDoc: getDocMock,
  getDocs: vi.fn(),
  getCountFromServer: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  startAfter: vi.fn(),
  where: vi.fn(),
  setDoc: vi.fn(),
  deleteField: vi.fn(),
}));

vi.mock('../firebaseClient', () => ({
  getFirestoreDb: () => ({ __db: true }),
  getCurrentFirebaseUser: () => null,
}));

vi.mock('../leaderboardFirestoreSession', () => ({
  prepareLeaderboardFirestoreRead: vi.fn(async () => undefined),
  logLeaderboardFirestoreError: vi.fn(),
  resolveLeaderboardFirestoreErrorReason: () => 'unknown',
}));

import {
  __resetMyLeaderboardEntryCacheForTests,
  invalidateMyLeaderboardEntryCache,
  LEADERBOARD_MY_ENTRY_TTL_MS,
  lookupMyLeaderboardEntryCache,
  seedMyLeaderboardEntryFromRows,
  setMyLeaderboardEntryCache,
} from '../myLeaderboardEntryCache';
import {
  clearLeaderboardReadCaches,
  getMyLeaderboardEntry,
} from '../leaderboardService';

function ownedProEntitlement(): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'pro',
    isPro: true,
    proExpiresAt: null,
    promoExpiresAt: null,
    planId: 'pro_monthly_099',
    lastCheckedAt: null,
    proPurchaseCooldownUntil: null,
    isGenesisEarlyBird: false,
    genesisSeatNumber: null,
  };
}

describe('myLeaderboardEntryCache + getMyLeaderboardEntry TTL', () => {
  beforeEach(() => {
    __resetMyLeaderboardEntryCacheForTests();
    getDocMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    __resetMyLeaderboardEntryCacheForTests();
    clearLeaderboardReadCaches();
    vi.useRealTimers();
  });

  it('caches positive and negative entries for 120s (single getDoc)', async () => {
    getDocMock.mockResolvedValue({
      id: 'u1',
      exists: () => true,
      data: () => ({
        displayName: 'Bruce',
        scoreBest: 90.5,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    });

    const first = await getMyLeaderboardEntry({
      entitlement: ownedProEntitlement(),
      metric: 'ladderScore',
      uid: 'u1',
    });
    expect(first.ok).toBe(true);
    expect(first.fromCache).toBe(false);
    expect(first.item?.scoreBest).toBe(90.5);
    expect(getDocMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-01-01T00:01:59.000Z'));
    const second = await getMyLeaderboardEntry({
      entitlement: ownedProEntitlement(),
      metric: 'ladderScore',
      uid: 'u1',
    });
    expect(second.fromCache).toBe(true);
    expect(second.item?.scoreBest).toBe(90.5);
    expect(getDocMock).toHaveBeenCalledTimes(1);

    getDocMock.mockResolvedValue({
      exists: () => false,
    });
    invalidateMyLeaderboardEntryCache({ uid: 'u1', metric: 'ladderScore' });
    const miss = await getMyLeaderboardEntry({
      entitlement: ownedProEntitlement(),
      metric: 'ladderScore',
      uid: 'u1',
    });
    expect(miss.fromCache).toBe(false);
    expect(miss.item).toBeNull();
    expect(getDocMock).toHaveBeenCalledTimes(2);

    const negCached = await getMyLeaderboardEntry({
      entitlement: ownedProEntitlement(),
      metric: 'ladderScore',
      uid: 'u1',
    });
    expect(negCached.fromCache).toBe(true);
    expect(negCached.item).toBeNull();
    expect(getDocMock).toHaveBeenCalledTimes(2);
  });

  it('re-reads after TTL expiry', async () => {
    getDocMock.mockResolvedValue({
      id: 'u1',
      exists: () => true,
      data: () => ({
        displayName: 'Bruce',
        scoreBest: 80,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    });

    await getMyLeaderboardEntry({
      entitlement: ownedProEntitlement(),
      metric: 'strength',
      uid: 'u1',
    });
    expect(getDocMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(
      new Date(Date.parse('2026-01-01T00:00:00.000Z') + LEADERBOARD_MY_ENTRY_TTL_MS + 1)
    );
    getDocMock.mockResolvedValue({
      id: 'u1',
      exists: () => true,
      data: () => ({
        displayName: 'Bruce',
        scoreBest: 88,
        updatedAt: '2026-01-01T00:03:00.000Z',
      }),
    });

    const refreshed = await getMyLeaderboardEntry({
      entitlement: ownedProEntitlement(),
      metric: 'strength',
      uid: 'u1',
    });
    expect(refreshed.fromCache).toBe(false);
    expect(refreshed.item?.scoreBest).toBe(88);
    expect(getDocMock).toHaveBeenCalledTimes(2);
  });

  it('seeds my-entry from list rows without inventing a negative cache', () => {
    seedMyLeaderboardEntryFromRows({
      metric: 'ladderScore',
      uid: 'u1',
      items: [
        {
          uid: 'u2',
          displayName: 'Other',
          scoreBest: 50,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    expect(lookupMyLeaderboardEntryCache({ uid: 'u1', metric: 'ladderScore' })).toBeNull();

    seedMyLeaderboardEntryFromRows({
      metric: 'ladderScore',
      uid: 'u1',
      items: [
        {
          uid: 'u1',
          displayName: 'Me',
          scoreBest: 91,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    expect(
      lookupMyLeaderboardEntryCache({ uid: 'u1', metric: 'ladderScore' })?.item?.scoreBest
    ).toBe(91);
  });

  it('invalidate and clearLeaderboardReadCaches force a fresh getDoc', async () => {
    setMyLeaderboardEntryCache({
      uid: 'u1',
      metric: 'ladderScore',
      item: {
        uid: 'u1',
        displayName: 'Stale',
        scoreBest: 70,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    expect(
      lookupMyLeaderboardEntryCache({ uid: 'u1', metric: 'ladderScore' })?.item?.scoreBest
    ).toBe(70);

    clearLeaderboardReadCaches('ladderScore');
    expect(lookupMyLeaderboardEntryCache({ uid: 'u1', metric: 'ladderScore' })).toBeNull();

    getDocMock.mockResolvedValue({
      id: 'u1',
      exists: () => true,
      data: () => ({
        displayName: 'Fresh',
        scoreBest: 99,
        updatedAt: '2026-01-01T00:00:30.000Z',
      }),
    });
    const result = await getMyLeaderboardEntry({
      entitlement: ownedProEntitlement(),
      metric: 'ladderScore',
      uid: 'u1',
    });
    expect(result.fromCache).toBe(false);
    expect(result.item?.scoreBest).toBe(99);
    expect(getDocMock).toHaveBeenCalledTimes(1);

    invalidateMyLeaderboardEntryCache({ uid: 'u1' });
    expect(lookupMyLeaderboardEntryCache({ uid: 'u1', metric: 'ladderScore' })).toBeNull();
  });
});
