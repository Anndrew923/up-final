import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDoc = vi.hoisted(() => vi.fn());
const getFirestoreDb = vi.hoisted(() => vi.fn(() => ({})));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, uid: string) => ({ collection, uid }),
  getDoc,
}));

vi.mock('../firebaseClient', () => ({
  getFirestoreDb,
}));

const { resolveServerProHydrate, fetchRedeemedReferrerCode } = await import('../userEntitlementService');

describe('fetchRedeemedReferrerCode session cache', () => {
  beforeEach(() => {
    getDoc.mockReset();
    getFirestoreDb.mockReturnValue({});
  });

  it('reuses the hydrate snapshot so bind does not issue a second getDoc', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        subscriptionStatus: 'pro',
        proExpiresAt: '2099-01-01T00:00:00.000Z',
        referrer: 'fin_s0',
      }),
    });

    await resolveServerProHydrate('uid-cache');
    const code = await fetchRedeemedReferrerCode('uid-cache');

    expect(code).toBe('FIN_S0');
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it('falls back to a user-doc read when this uid was not just hydrated', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ redeemedCode: '  coach_1  ' }),
    });

    const code = await fetchRedeemedReferrerCode('uid-fresh');
    expect(code).toBe('COACH_1');
    expect(getDoc).toHaveBeenCalledTimes(1);
  });
});
