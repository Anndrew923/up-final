import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EntitlementState } from '../../types/entitlement';
import {
  bindStructuredSyncSession,
  captureStructuredSyncSession,
} from '../structuredSyncSession';

const mocks = vi.hoisted(() => ({
  uid: 'user-a',
  mode: 'backup' as 'backup' | 'restore',
  resolveLegacy: null as null | ((value: { exists: () => boolean }) => void),
  resolveHistory: null as null | ((value: { forEach: (fn: (doc: unknown) => void) => void }) => void),
  setDoc: vi.fn(),
  setScores: vi.fn(),
}));

vi.mock('../firebaseClient', () => ({
  getFirestoreDb: () => ({}),
  getCurrentFirebaseUser: () => ({ uid: mocks.uid, isAnonymous: false }),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...parts: unknown[]) => ({ parts })),
  doc: vi.fn((...parts: unknown[]) => ({ parts })),
  getDoc: vi.fn(() => {
    if (mocks.mode === 'restore') {
      return Promise.resolve({
        exists: () => true,
        data: () => ({
          schemaVersion: 1,
          updatedAt: '2026-07-19T00:00:00.000Z',
          scores: { strength: 100 },
        }),
      });
    }
    return (
      new Promise<{ exists: () => boolean }>((resolve) => {
        mocks.resolveLegacy = resolve;
      })
    );
  }),
  getDocs: vi.fn(
    () =>
      new Promise<{ forEach: (fn: (doc: unknown) => void) => void }>((resolve) => {
        mocks.resolveHistory = resolve;
      })
  ),
  setDoc: mocks.setDoc,
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock('../../stores/scoreStore', () => ({
  useScoreStore: {
    getState: () => ({ setScores: mocks.setScores }),
  },
}));

const entitlement: EntitlementState = {
  purchaseStatus: 'owned',
  subscriptionStatus: 'pro',
  isPro: true,
  proExpiresAt: '2099-01-01T00:00:00.000Z',
  planId: 'pro_monthly',
  lastCheckedAt: null,
};

describe('structured backup account boundary', () => {
  afterEach(() => {
    bindStructuredSyncSession(null);
    mocks.uid = 'user-a';
    mocks.mode = 'backup';
    mocks.resolveLegacy = null;
    mocks.resolveHistory = null;
    mocks.setDoc.mockClear();
    mocks.setScores.mockClear();
  });

  it('cancels A backup before any write after switching to B', async () => {
    bindStructuredSyncSession('user-a');
    expect(captureStructuredSyncSession()?.uid).toBe('user-a');
    const { runStructuredBackup } = await import('../userStructuredSyncService');
    const backup = runStructuredBackup(entitlement);

    mocks.uid = 'user-b';
    bindStructuredSyncSession('user-b');
    mocks.resolveLegacy?.({ exists: () => false });

    await expect(backup).rejects.toThrow('structured-sync-session-changed');
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });

  it('does not partially apply a restore after the session changes', async () => {
    mocks.mode = 'restore';
    bindStructuredSyncSession('user-a');
    const { runStructuredRestore } = await import('../userStructuredSyncService');
    const restore = runStructuredRestore(entitlement);
    await vi.waitFor(() => expect(mocks.resolveHistory).not.toBeNull());

    mocks.uid = 'user-b';
    bindStructuredSyncSession('user-b');
    mocks.resolveHistory?.({ forEach: () => undefined });

    await expect(restore).rejects.toThrow('structured-sync-session-changed');
    expect(mocks.setScores).not.toHaveBeenCalled();
  });
});
