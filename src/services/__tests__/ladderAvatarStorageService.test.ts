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
  ensureAvatarHttpsUrl,
  ensureLadderAvatarHttpsForProSync,
  ladderAvatarStoragePath,
  resolveGuildCallableIdentity,
  resolveHttpsAvatarForGuildWrite,
} from '../ladderAvatarStorageService';

const proEntitlement: EntitlementState = {
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

const freeEntitlement: EntitlementState = {
  ...proEntitlement,
  isPro: false,
  subscriptionStatus: 'free',
  planId: null,
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

  it('ensureLadderAvatarHttpsForProSync no-ops for non-Pro entitlement', async () => {
    const result = await ensureLadderAvatarHttpsForProSync(freeEntitlement);
    expect(result).toEqual({ ok: true, avatarUrl: undefined });
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it('ensureAvatarHttpsUrl uploads for Free users (club path)', async () => {
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'FreePilot',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const result = await ensureAvatarHttpsUrl();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.avatarUrl).toMatch(/^https:\/\/firebasestorage\.googleapis\.com/);
    }
    expect(uploadBytes).toHaveBeenCalledTimes(1);
  });

  it('returns existing https without upload', async () => {
    const https = 'https://cdn.example.com/avatar.jpg';
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'Pilot',
      avatarUrl: https,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const result = await ensureAvatarHttpsUrl();
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

  it('resolveHttpsAvatarForGuildWrite never returns data URL', async () => {
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'Boss',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const url = await resolveHttpsAvatarForGuildWrite('data:image/jpeg;base64,abcd');
    expect(url).toMatch(/^https:\/\//);
    expect(url).not.toMatch(/^data:/);
  });

  it('resolveGuildCallableIdentity upgrades data URL and keeps displayName', async () => {
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'Boss',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const identity = await resolveGuildCallableIdentity();
    expect(identity.displayName).toBe('Boss');
    expect(identity.avatarUrl).toMatch(/^https:\/\//);
    expect(identity.avatarUrl).not.toMatch(/^data:/);
  });

  it('ensureAvatarHttpsUrl never returns data URL even without Storage (memory)', async () => {
    getFirebaseStorage.mockReturnValue(null);
    getFirestoreDb.mockReturnValue(null);
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'Boss',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const result = await ensureAvatarHttpsUrl();
    expect(result).toEqual({ ok: true, avatarUrl: undefined });
  });

  it('resolveHttpsAvatarForGuildWrite soft-fails to undefined when upload fails', async () => {
    getFirebaseStorage.mockReturnValue(null);
    getFirestoreDb.mockReturnValue({ configured: true });
    loadProfile.mockReturnValue({
      uid: 'user-1',
      displayName: 'Boss',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const url = await resolveHttpsAvatarForGuildWrite('data:image/jpeg;base64,abcd');
    expect(url).toBeUndefined();
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
    const first = ensureAvatarHttpsUrl();
    const second = ensureAvatarHttpsUrl();
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
    const result = await ensureAvatarHttpsUrl();
    expect(result).toEqual({
      ok: false,
      reason: 'upload-failed',
      message: 'firebase-storage-not-configured',
    });
  });
});
