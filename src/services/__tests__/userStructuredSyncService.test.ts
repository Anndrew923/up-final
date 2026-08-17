import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shouldBlockStructuredUserSync } from '../../logic/core/entitlement';
import type { EntitlementState } from '../../types/entitlement';
import { emptyTrainingFootprint } from '../../logic/core/trainingFootprint';
import { canRunStructuredUserSync, pushStructuredProfileFromLocal } from '../userStructuredSyncService';

const firebaseMocks = vi.hoisted(() => ({
  db: null as object | null,
  user: null as { uid: string; isAnonymous: boolean } | null,
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

const loadTrainingFootprint = vi.hoisted(() =>
  vi.fn(() => emptyTrainingFootprint())
);

vi.mock('../firebaseClient', () => ({
  getFirestoreDb: () => firebaseMocks.db,
  getCurrentFirebaseUser: () => firebaseMocks.user,
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...parts: unknown[]) => ({ parts })),
  doc: vi.fn((...parts: unknown[]) => ({ parts })),
  getDoc: (...args: unknown[]) => firebaseMocks.getDoc(...args),
  getDocs: vi.fn(),
  setDoc: (...args: unknown[]) => firebaseMocks.setDoc(...args),
  runTransaction: vi.fn(async (_db: unknown, updater: (tx: { get: typeof firebaseMocks.getDoc; set: typeof firebaseMocks.setDoc }) => Promise<void> | void) =>
    updater({
      get: () => firebaseMocks.getDoc(),
      set: firebaseMocks.setDoc,
    })
  ),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock('../trainingFootprintService', () => ({
  loadTrainingFootprint,
  applyMergedFootprint: vi.fn(),
}));

const entitlement: EntitlementState = {
  purchaseStatus: 'owned',
  subscriptionStatus: 'pro',
  isPro: true,
  proExpiresAt: '2099-01-01T00:00:00.000Z',
  planId: 'pro_monthly_099',
  lastCheckedAt: null,
  proPurchaseCooldownUntil: null,
};

describe('userStructuredSyncService gates', () => {
  beforeEach(() => {
    firebaseMocks.db = null;
    firebaseMocks.user = null;
  });

  it('canRunStructuredUserSync is false without Firestore session', () => {
    expect(shouldBlockStructuredUserSync(entitlement)).toBe(false);
    expect(canRunStructuredUserSync(entitlement)).toBe(false);
  });
});

describe('pushStructuredProfileFromLocal footprint merge', () => {
  beforeEach(() => {
    firebaseMocks.db = {};
    firebaseMocks.user = { uid: 'user-a', isAnonymous: false };
    firebaseMocks.getDoc.mockReset();
    firebaseMocks.setDoc.mockReset();
    firebaseMocks.setDoc.mockResolvedValue(undefined);
    loadTrainingFootprint.mockReset();
    loadTrainingFootprint.mockReturnValue(emptyTrainingFootprint());
  });

  it('unions cloud badge ids with local before backup write', async () => {
    loadTrainingFootprint.mockReturnValue({
      schemaVersion: 1,
      days: {},
      lifetimeDays: 0,
      unlockedBadgeIds: ['ARM-01'],
    });
    firebaseMocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        schemaVersion: 1,
        updatedAt: '2026-08-01T00:00:00.000Z',
        scores: {},
        footprint: {
          schemaVersion: 1,
          days: { '2026-08-16': 2 },
          lifetimeDays: 40,
          unlockedBadgeIds: ['IGN-01', 'SOM-01'],
        },
      }),
    });

    await pushStructuredProfileFromLocal(entitlement, undefined, { includeFootprint: true });

    expect(firebaseMocks.setDoc).toHaveBeenCalledTimes(1);
    const payload = firebaseMocks.setDoc.mock.calls[0][1] as {
      footprint?: { unlockedBadgeIds: string[]; lifetimeDays: number };
    };
    expect(payload.footprint?.unlockedBadgeIds).toEqual(['IGN-01', 'ARM-01', 'SOM-01']);
    expect(payload.footprint?.lifetimeDays).toBe(40);
  });

  it('omits footprint on debounce-style push so nested days are not replaced', async () => {
    firebaseMocks.getDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });
    await pushStructuredProfileFromLocal(entitlement);
    expect(firebaseMocks.getDoc).not.toHaveBeenCalled();
    expect(firebaseMocks.setDoc).toHaveBeenCalledTimes(1);
    const payload = firebaseMocks.setDoc.mock.calls[0][1] as { footprint?: unknown };
    expect(payload.footprint).toBeUndefined();
  });
});
