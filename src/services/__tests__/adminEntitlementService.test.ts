import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDoc = vi.fn();
const getCurrentFirebaseUser = vi.fn();
const getFirestoreDb = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  getDoc: (...args: unknown[]) => getDoc(...args),
}));

vi.mock('../firebaseClient', () => ({
  getCurrentFirebaseUser: () => getCurrentFirebaseUser(),
  getFirestoreDb: () => getFirestoreDb(),
}));

vi.mock('../firestorePaths', () => ({
  USER_CLOUD_COLLECTION: 'users',
}));

describe('adminEntitlementService session cache', () => {
  beforeEach(async () => {
    vi.resetModules();
    getDoc.mockReset();
    getCurrentFirebaseUser.mockReset();
    getFirestoreDb.mockReset();
    getFirestoreDb.mockReturnValue({});
  });

  it('fails closed for guests and clears cache', async () => {
    const { fetchCurrentUserIsAdmin, clearAdminEntitlementCache } = await import(
      '../adminEntitlementService'
    );
    clearAdminEntitlementCache();
    getCurrentFirebaseUser.mockReturnValue(null);
    await expect(fetchCurrentUserIsAdmin()).resolves.toBe(false);
  });

  it('caches isAdmin within TTL for the same uid', async () => {
    const { fetchCurrentUserIsAdmin, clearAdminEntitlementCache } = await import(
      '../adminEntitlementService'
    );
    clearAdminEntitlementCache();
    getCurrentFirebaseUser.mockReturnValue({ uid: 'admin-1', isAnonymous: false });
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ isAdmin: true }),
    });

    await expect(fetchCurrentUserIsAdmin()).resolves.toBe(true);
    await expect(fetchCurrentUserIsAdmin()).resolves.toBe(true);
    expect(getDoc).toHaveBeenCalledTimes(1);
  });
});
