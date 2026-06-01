import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LEADERBOARD_AVATAR_URL_MAX_CHARS,
  normalizeLadderDisplayName,
  resolveLeaderboardAvatarUrlForCloud,
  sanitizeAvatarUrlForLeaderboard,
} from '../ladderIdentityService';

const { loadProfile } = vi.hoisted(() => ({
  loadProfile: vi.fn(),
}));

vi.mock('../localStorageService', () => ({
  loadProfile,
  saveProfile: vi.fn(),
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
