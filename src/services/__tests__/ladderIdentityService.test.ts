import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  finalizeLadderProfileMergeForLocalApply,
  LEADERBOARD_AVATAR_URL_MAX_CHARS,
  mergeLadderProfileWithLocal,
  normalizeLadderDisplayName,
  resolveLeaderboardAvatarUrlForCloud,
  sanitizeAvatarUrlForLeaderboard,
  saveLadderIdentity,
} from '../ladderIdentityService';

const { loadProfile, saveProfile } = vi.hoisted(() => ({
  loadProfile: vi.fn(),
  saveProfile: vi.fn(),
}));

vi.mock('../localStorageService', () => ({
  loadProfile,
  saveProfile,
}));

describe('sanitizeAvatarUrlForLeaderboard', () => {
  it('allows https URLs', () => {
    expect(sanitizeAvatarUrlForLeaderboard('  https://cdn.example.com/a.png  ')).toBe(
      'https://cdn.example.com/a.png'
    );
  });

  it('allows jpeg data URLs', () => {
    const s = 'data:image/jpeg;base64,abcd';
    expect(sanitizeAvatarUrlForLeaderboard(s)).toBe(s);
  });

  it('rejects non-https non-data', () => {
    expect(sanitizeAvatarUrlForLeaderboard('http://insecure')).toBeUndefined();
    expect(sanitizeAvatarUrlForLeaderboard('data:text/plain;base64,xx')).toBeUndefined();
  });

  it('rejects oversized strings', () => {
    const huge = `data:image/jpeg;base64,${'x'.repeat(LEADERBOARD_AVATAR_URL_MAX_CHARS)}`;
    expect(sanitizeAvatarUrlForLeaderboard(huge)).toBeUndefined();
  });
});

describe('normalizeLadderDisplayName', () => {
  it('trims and clamps length', () => {
    expect(normalizeLadderDisplayName('  abc  ')).toBe('abc');
    const long = 'a'.repeat(100);
    expect(normalizeLadderDisplayName(long).length).toBeLessThanOrEqual(20);
  });
});

describe('saveLadderIdentity', () => {
  beforeEach(() => {
    loadProfile.mockReturnValue({ uid: 'u1', displayName: 'Pilot', updatedAt: '' });
    saveProfile.mockClear();
  });

  it('rejects profane display names at the service layer', () => {
    expect(() => saveLadderIdentity({ displayName: 'shitlord' })).toThrow(
      'ladder-identity-profanity'
    );
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it('persists sanitized display names', () => {
    saveLadderIdentity({ displayName: '  CleanName  ' });
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'CleanName' })
    );
  });
});

describe('resolveLeaderboardAvatarUrlForCloud', () => {
  beforeEach(() => {
    loadProfile.mockReset();
  });

  it('prefers ensured https over stale data URL in preferred', () => {
    const https = 'https://cdn.example.com/a.jpg';
    expect(
      resolveLeaderboardAvatarUrlForCloud('data:image/jpeg;base64,xx', https)
    ).toBe(https);
  });

  it('uses data URL only when no https candidate exists', () => {
    const data = 'data:image/jpeg;base64,xx';
    expect(resolveLeaderboardAvatarUrlForCloud(data)).toBe(data);
  });

  it('mergeLadderProfileWithLocal keeps local data avatar when remote has none', () => {
    loadProfile.mockReturnValue({
      uid: 'u1',
      displayName: 'LocalBoss',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-06-02T12:00:00.000Z',
    });
    const merged = mergeLadderProfileWithLocal({
      uid: 'u1',
      displayName: 'CloudName',
      updatedAt: '2026-06-01T12:00:00.000Z',
    });
    expect(merged.displayName).toBe('LocalBoss');
    expect(merged.avatarUrl).toBe('data:image/jpeg;base64,abcd');
  });

  it('mergeLadderProfileWithLocal prefers remote https avatar when remote is newer', () => {
    loadProfile.mockReturnValue({
      uid: 'u1',
      displayName: 'Local',
      avatarUrl: 'data:image/jpeg;base64,abcd',
      updatedAt: '2026-06-02T12:00:00.000Z',
    });
    const https = 'https://cdn.example.com/a.jpg';
    const merged = mergeLadderProfileWithLocal({
      uid: 'u1',
      displayName: 'Cloud',
      avatarUrl: https,
      updatedAt: '2026-06-03T12:00:00.000Z',
    });
    expect(merged.avatarUrl).toBe(https);
    expect(merged.displayName).toBe('Cloud');
  });

  it('mergeLadderProfileWithLocal keeps newer local data avatar over stale remote https', () => {
    loadProfile.mockReturnValue({
      uid: 'u1',
      displayName: 'Local',
      avatarUrl: 'data:image/jpeg;base64,newpic',
      updatedAt: '2026-06-04T12:00:00.000Z',
    });
    const merged = mergeLadderProfileWithLocal({
      uid: 'u1',
      displayName: 'Cloud',
      avatarUrl: 'https://cdn.example.com/old.jpg',
      updatedAt: '2026-06-01T12:00:00.000Z',
    });
    expect(merged.avatarUrl).toBe('data:image/jpeg;base64,newpic');
    expect(merged.displayName).toBe('Local');
  });

  it('mergeLadderProfileWithLocal keeps local avatar when remote is newer but has none', () => {
    loadProfile.mockReturnValue({
      uid: 'u1',
      displayName: 'Local',
      avatarUrl: 'data:image/jpeg;base64,keep',
      updatedAt: '2026-06-01T12:00:00.000Z',
    });
    const merged = mergeLadderProfileWithLocal({
      uid: 'u1',
      displayName: 'Cloud',
      updatedAt: '2026-06-03T12:00:00.000Z',
    });
    expect(merged.avatarUrl).toBe('data:image/jpeg;base64,keep');
    expect(merged.displayName).toBe('Cloud');
  });

  it('finalizeLadderProfileMergeForLocalApply restores local data avatar when merge omitted it', () => {
    const dataUrl = 'data:image/jpeg;base64,abcd';
    const merged = finalizeLadderProfileMergeForLocalApply(
      {
        uid: 'local',
        displayName: 'Cloud',
        updatedAt: '2026-06-01T06:54:05.856Z',
      },
      {
        uid: 'local',
        displayName: 'ANNDREW',
        avatarUrl: dataUrl,
        updatedAt: '2026-06-01T06:53:27.030Z',
      }
    );
    expect(merged.avatarUrl).toBe(dataUrl);
  });

  it('falls back to local profile after Storage upload', () => {
    const https = 'https://firebasestorage.googleapis.com/v0/b/x/o/a.jpg';
    loadProfile.mockReturnValue({
      uid: 'u1',
      avatarUrl: https,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(resolveLeaderboardAvatarUrlForCloud()).toBe(https);
  });
});
