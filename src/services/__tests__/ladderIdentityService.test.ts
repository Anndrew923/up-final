import { describe, expect, it } from 'vitest';
import {
  LEADERBOARD_AVATAR_URL_MAX_CHARS,
  normalizeLadderDisplayName,
  sanitizeAvatarUrlForLeaderboard,
} from '../ladderIdentityService';

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
