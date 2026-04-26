import { describe, expect, it } from 'vitest';
import type { DocumentSnapshot } from 'firebase/firestore';
import type { EntitlementState } from '../../types/entitlement';
import { tryApplyRemoteProfileFromSnapshot } from '../userStructuredSyncService';

vi.mock('../firebaseClient', () => ({
  getFirestoreDb: vi.fn(() => ({})),
  getCurrentFirebaseUser: vi.fn(() => ({ uid: 'test-uid', isAnonymous: false })),
}));

const proEnt: EntitlementState = {
  purchaseStatus: 'owned',
  subscriptionStatus: 'pro',
  isPro: true,
  proExpiresAt: null,
  planId: 'pro_monthly_099',
  lastCheckedAt: null,
};

const freeEnt: EntitlementState = {
  purchaseStatus: 'owned',
  subscriptionStatus: 'free',
  isPro: false,
  proExpiresAt: null,
  planId: null,
  lastCheckedAt: null,
};

describe('tryApplyRemoteProfileFromSnapshot', () => {
  it('returns false when snapshot does not exist', () => {
    const snap = {
      exists: () => false,
      data: () => ({}),
    } as unknown as DocumentSnapshot;
    expect(tryApplyRemoteProfileFromSnapshot(proEnt, snap)).toBe(false);
  });

  it('returns false for non-Pro even if snapshot exists', () => {
    const snap = {
      exists: () => true,
      data: () => ({
        schemaVersion: 1,
        updatedAt: '2099-01-01T00:00:00.000Z',
        scores: {},
      }),
    } as unknown as DocumentSnapshot;
    expect(tryApplyRemoteProfileFromSnapshot(freeEnt, snap)).toBe(false);
  });
});
