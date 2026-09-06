import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDoc = vi.fn();
const getFirestoreDb = vi.fn();
const getCurrentFirebaseUser = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}` }),
  getDoc,
}));

vi.mock('../firebaseClient', () => ({
  getFirestoreDb,
  getCurrentFirebaseUser,
}));

vi.mock('../../config/monetization', () => ({
  MONETIZATION_CONFIG: {
    leaderboardPaywallEnabled: false,
    genesisEarlyBirdSeatLimit: 2000,
  },
}));

describe('genesisSeatSummaryService', () => {
  beforeEach(async () => {
    getDoc.mockReset();
    getFirestoreDb.mockReset();
    getCurrentFirebaseUser.mockReset();
    const { clearGenesisSeatSummaryCache } = await import('../genesisSeatSummaryService');
    clearGenesisSeatSummaryCache();
  });

  it('does not poison cache with guest early fallback so login can fetch', async () => {
    getCurrentFirebaseUser.mockReturnValue(null);
    const { fetchGenesisSeatSummary } = await import('../genesisSeatSummaryService');

    const guest = await fetchGenesisSeatSummary({ now: 1_000 });
    expect(guest.stage).toBe('early');
    expect(getDoc).not.toHaveBeenCalled();

    getCurrentFirebaseUser.mockReturnValue({ uid: 'u1', isAnonymous: false });
    getFirestoreDb.mockReturnValue({});
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        seatLimit: 2000,
        stage: 'growth',
        percentBucket: 30,
        updatedAt: '2026-09-06T00:00:00.000Z',
      }),
    });

    const signedIn = await fetchGenesisSeatSummary({ now: 2_000 });
    expect(signedIn).toMatchObject({ stage: 'growth', percentBucket: 30 });
    expect(getDoc).toHaveBeenCalledTimes(1);

    // Fresh growth cache should skip network.
    const cached = await fetchGenesisSeatSummary({ now: 3_000 });
    expect(cached.stage).toBe('growth');
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('uses soft TTL after read errors so retries are not blocked for 30m', async () => {
    getCurrentFirebaseUser.mockReturnValue({ uid: 'u1', isAnonymous: false });
    getFirestoreDb.mockReturnValue({});
    getDoc.mockRejectedValueOnce(new Error('offline'));
    const { fetchGenesisSeatSummary } = await import('../genesisSeatSummaryService');

    const failed = await fetchGenesisSeatSummary({ now: 10_000 });
    expect(failed.stage).toBe('early');

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        seatLimit: 2000,
        stage: 'closing',
        remaining: 40,
      }),
    });

    // Within soft TTL (30s) — still served soft early.
    const softCached = await fetchGenesisSeatSummary({ now: 20_000 });
    expect(softCached.stage).toBe('early');
    expect(getDoc).toHaveBeenCalledTimes(1);

    // After soft TTL — retry network.
    const recovered = await fetchGenesisSeatSummary({ now: 50_000 });
    expect(recovered).toMatchObject({ stage: 'closing', remaining: 40 });
    expect(getDoc).toHaveBeenCalledTimes(2);
  });
});
