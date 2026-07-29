import { beforeEach, describe, expect, it, vi } from 'vitest';

function createMemoryStorage(): Storage {
  const memory = new Map<string, string>();
  return {
    get length() {
      return memory.size;
    },
    clear: () => memory.clear(),
    getItem: (key: string) => memory.get(key) ?? null,
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    removeItem: (key: string) => {
      memory.delete(key);
    },
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
}

const localMemory = createMemoryStorage();
vi.stubGlobal('localStorage', localMemory);

const setDoc = vi.fn();
const getCurrentFirebaseUser = vi.fn();
const getFirestoreDb = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  setDoc: (...args: unknown[]) => setDoc(...args),
}));

vi.mock('../../services/firebaseClient', () => ({
  getCurrentFirebaseUser: () => getCurrentFirebaseUser(),
  getFirestoreDb: () => getFirestoreDb(),
}));

import {
  hasAcceptedHealthTerms,
  markHealthTermsAccepted,
  persistHealthTermsAcceptance,
  syncAcceptedHealthTermsToCloudIfNeeded,
  syncHealthTermsAcceptanceToUserDoc,
} from '../../services/termsAcceptanceService';
import { HEALTH_TERMS_VERSION, termsAcceptedStorageKey } from '../../logic/core/termsAcceptance';

describe('termsAcceptanceService', () => {
  beforeEach(() => {
    localMemory.clear();
    setDoc.mockReset();
    getCurrentFirebaseUser.mockReset();
    getFirestoreDb.mockReset();
  });

  it('markHealthTermsAccepted writes local flag and timestamp', () => {
    expect(hasAcceptedHealthTerms()).toBe(false);
    const { acceptedAt } = markHealthTermsAccepted();
    expect(hasAcceptedHealthTerms()).toBe(true);
    expect(localStorage.getItem(termsAcceptedStorageKey(HEALTH_TERMS_VERSION))).toBe('1');
    expect(localStorage.getItem(`${termsAcceptedStorageKey(HEALTH_TERMS_VERSION)}.at`)).toBe(
      acceptedAt
    );
  });

  it('syncs to user doc for signed-in non-anonymous users', async () => {
    getCurrentFirebaseUser.mockReturnValue({ uid: 'u1', isAnonymous: false });
    getFirestoreDb.mockReturnValue({});
    setDoc.mockResolvedValue(undefined);

    const ok = await syncHealthTermsAcceptanceToUserDoc({
      acceptedAt: '2026-07-29T00:00:00.000Z',
    });
    expect(ok).toBe(true);
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        termsAcceptedVersion: 'v1',
        termsAcceptedAt: '2026-07-29T00:00:00.000Z',
      },
      { merge: true }
    );
  });

  it('skips cloud sync for anonymous users', async () => {
    getCurrentFirebaseUser.mockReturnValue({ uid: 'anon', isAnonymous: true });
    getFirestoreDb.mockReturnValue({});

    const ok = await syncHealthTermsAcceptanceToUserDoc({
      acceptedAt: '2026-07-29T00:00:00.000Z',
    });
    expect(ok).toBe(false);
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('persistHealthTermsAcceptance stamps local without awaiting cloud', async () => {
    getCurrentFirebaseUser.mockReturnValue({ uid: 'u1', isAnonymous: false });
    getFirestoreDb.mockReturnValue({});
    let resolveSetDoc: (() => void) | undefined;
    setDoc.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSetDoc = resolve;
        })
    );

    const result = persistHealthTermsAcceptance();
    expect(hasAcceptedHealthTerms()).toBe(true);
    expect(result.acceptedAt).toBeTruthy();
    // Cloud kick-off must not block the return.
    expect(setDoc).toHaveBeenCalled();
    resolveSetDoc?.();
    await Promise.resolve();
  });

  it('syncAcceptedHealthTermsToCloudIfNeeded backfills when local accepted', async () => {
    getCurrentFirebaseUser.mockReturnValue({ uid: 'u1', isAnonymous: false });
    getFirestoreDb.mockReturnValue({});
    setDoc.mockResolvedValue(undefined);
    markHealthTermsAccepted();

    syncAcceptedHealthTermsToCloudIfNeeded();
    await vi.waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    });
  });

  it('syncAcceptedHealthTermsToCloudIfNeeded no-ops when local not accepted', () => {
    getCurrentFirebaseUser.mockReturnValue({ uid: 'u1', isAnonymous: false });
    getFirestoreDb.mockReturnValue({});
    syncAcceptedHealthTermsToCloudIfNeeded();
    expect(setDoc).not.toHaveBeenCalled();
  });
});
