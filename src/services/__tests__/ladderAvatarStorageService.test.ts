import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntitlementState } from '../../types/entitlement';

const {
  getCurrentFirebaseUser,
  getFirebaseStorage,
  getFirestoreDb,
  loadProfile,
  saveLadderIdentity,
  uploadBytes,
  getDownloadURL,
} = vi.hoisted(() => ({
  getCurrentFirebaseUser: vi.fn(),
  getFirebaseStorage: vi.fn(),
  getFirestoreDb: vi.fn(),
  loadProfile: vi.fn(),
  saveLadderIdentity: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock('../firebaseClient', () => ({
  getCurrentFirebaseUser,
  getFirebaseStorage,
  getFirestoreDb,
}));

vi.mock('../localStorageService', () => ({
  loadProfile,
  saveProfile: vi.fn(),
}));

vi.mock('../ladderIdentityService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ladderIdentityService')>();
  return {
    ...actual,
    saveLadderIdentity,
  };
});

vi.mock('firebase/storage', () => ({
  ref: vi.fn(() => ({ path: 'mock-ref' })),
  uploadBytes,
  getDownloadURL,
}));

import {
  ensureLadderAvatarHttpsForProSync,
  ladderAvatarStoragePath,
} from '../ladderAvatarStorageService';

const proEntitlement: EntitlementState = {
  purchaseStatus: 'owned',
  subscriptionStatus: 'pro',
  isPro: true,
  proExpiresAt: null,
  planId: 'pro_monthly_099',
  lastCheckedAt: null,
};

describe('ladderAvatarStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentFirebaseUser.mockReturnValue({ uid: 'user-1', isAnonymous: false });
    getFirebaseStorage.mockReturnValue({});
    getFirestoreDb.mockReturnValue({});
    uploadBytes.mockResolvedValue(undefined);
    getDownloadURL.mockResolvedValue('https://firebasestorage.googleapis.com/v0/b/test/o/avatar.jpg');
  });

  it('builds ladder avatar storage path', () => {
    expect(ladderAvatarStoragePath('abc')).toBe('ladder-avatars/abc/avatar.jpg');
  });

  it('no-ops for non-Pro entitlement', async () => {
    const result = await ensureLadderAvatarHttpsForProSync({
      ...proEntitlement,
      isPro: false,
      subscriptionStatus: 'free',
    });
    expect(result).toEqual({ ok: true, avatarUrl: undefined });
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it('returns existing https without upload', async () => {
    const https = 'https://cdn.example.com/avatar.jpg';
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'Pilot',
      avatarUrl: https,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const result = await ensureLadderAvatarHttpsForProSync(proEntitlement);
    expect(result).toEqual({ ok: true, avatarUrl: https });
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it('uploads data URL and persists https locally', async () => {
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'Boss',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const result = await ensureLadderAvatarHttpsForProSync(proEntitlement);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.avatarUrl).toMatch(/^https:\/\/firebasestorage\.googleapis\.com/);
      expect(result.avatarUrl).toContain('v=');
    }
    expect(uploadBytes).toHaveBeenCalledTimes(1);
    expect(saveLadderIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Boss',
        avatarUrl: expect.stringMatching(/^https:\/\//),
      })
    );
  });

  it('coalesces concurrent uploads for the same uid', async () => {
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'Boss',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    let resolveUpload!: () => void;
    uploadBytes.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpload = resolve;
        })
    );
    const first = ensureLadderAvatarHttpsForProSync(proEntitlement);
    const second = ensureLadderAvatarHttpsForProSync(proEntitlement);
    resolveUpload!();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toEqual(b);
    expect(uploadBytes).toHaveBeenCalledTimes(1);
  });

  it('fails when Storage is not configured', async () => {
    getFirebaseStorage.mockReturnValue(null);
    getFirestoreDb.mockReturnValue({ configured: true });
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'Boss',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const result = await ensureLadderAvatarHttpsForProSync(proEntitlement);
    expect(result).toEqual({
      ok: false,
      reason: 'upload-failed',
      message: 'firebase-storage-not-configured',
    });
  });
});
