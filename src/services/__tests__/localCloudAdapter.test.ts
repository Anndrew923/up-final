import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import type { EntitlementState } from '../../types/entitlement';
import * as firebaseClient from '../firebaseClient';
import { getCloudAdapterForEntitlement, noopLocalCloudAdapter } from '../localCloudAdapter';
import { doc, getDoc, setDoc } from 'firebase/firestore';

vi.mock('../firebaseClient', () => ({
  getFirestoreDb: vi.fn(),
  getCurrentFirebaseUser: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ __ref: 'mock' })),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
}));

function proEntitlement(): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'pro',
    isPro: true,
    proExpiresAt: '2099-01-01T00:00:00.000Z',
    planId: 'pro_monthly_099',
    lastCheckedAt: null,
  };
}

function freeEntitlement(): EntitlementState {
  return {
    purchaseStatus: 'owned',
    subscriptionStatus: 'free',
    isPro: false,
    proExpiresAt: null,
    planId: null,
    lastCheckedAt: null,
  };
}

const mockDb = {} as Firestore;

describe('getCloudAdapterForEntitlement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns noop adapter when Firestore is not configured', () => {
    vi.mocked(firebaseClient.getFirestoreDb).mockReturnValue(null);
    const adapter = getCloudAdapterForEntitlement(proEntitlement());
    expect(adapter).toBe(noopLocalCloudAdapter);
  });

  it('returns noop adapter when user is not Pro', () => {
    vi.mocked(firebaseClient.getFirestoreDb).mockReturnValue(mockDb);
    const adapter = getCloudAdapterForEntitlement(freeEntitlement());
    expect(adapter).toBe(noopLocalCloudAdapter);
  });

  it('real adapter: isAvailable is false for anonymous user', async () => {
    vi.mocked(firebaseClient.getFirestoreDb).mockReturnValue(mockDb);
    vi.mocked(firebaseClient.getCurrentFirebaseUser).mockReturnValue({
      uid: 'anon-uid',
      isAnonymous: true,
    } as import('firebase/auth').User);

    const adapter = getCloudAdapterForEntitlement(proEntitlement());
    expect(adapter).not.toBe(noopLocalCloudAdapter);
    expect(await adapter.isAvailable()).toBe(false);
  });

  it('real adapter: isAvailable is true for signed-in non-anonymous user', async () => {
    vi.mocked(firebaseClient.getFirestoreDb).mockReturnValue(mockDb);
    vi.mocked(firebaseClient.getCurrentFirebaseUser).mockReturnValue({
      uid: 'google-uid',
      isAnonymous: false,
    } as import('firebase/auth').User);

    const adapter = getCloudAdapterForEntitlement(proEntitlement());
    expect(await adapter.isAvailable()).toBe(true);
  });

  it('real adapter: backup writes merged doc under users/{uid}/artifacts/up_cloud_sync_v1', async () => {
    vi.mocked(firebaseClient.getFirestoreDb).mockReturnValue(mockDb);
    vi.mocked(firebaseClient.getCurrentFirebaseUser).mockReturnValue({
      uid: 'google-uid',
      isAnonymous: false,
    } as import('firebase/auth').User);

    const adapter = getCloudAdapterForEntitlement(proEntitlement());
    const payload = {
      scores: { strength: 10 } as import('../../types/scoring').ScoreMap,
      history: [],
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    await adapter.backup(payload);

    expect(doc).toHaveBeenCalledWith(
      mockDb,
      'users',
      'google-uid',
      'artifacts',
      'up_cloud_sync_v1'
    );
    expect(setDoc).toHaveBeenCalledWith(
      { __ref: 'mock' },
      expect.objectContaining({
        updatedAt: payload.updatedAt,
        json: JSON.stringify(payload),
      }),
      { merge: true }
    );
  });

  it('real adapter: restore parses json payload', async () => {
    vi.mocked(firebaseClient.getFirestoreDb).mockReturnValue(mockDb);
    vi.mocked(firebaseClient.getCurrentFirebaseUser).mockReturnValue({
      uid: 'google-uid',
      isAnonymous: false,
    } as import('firebase/auth').User);

    const stored = {
      scores: { strength: 42 },
      history: [],
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ json: JSON.stringify(stored) }),
    } as unknown as import('firebase/firestore').DocumentSnapshot);

    const adapter = getCloudAdapterForEntitlement(proEntitlement());
    const out = await adapter.restore();

    expect(getDoc).toHaveBeenCalled();
    expect(out).toEqual(stored);
  });
});
