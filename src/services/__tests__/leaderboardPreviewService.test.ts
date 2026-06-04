import { describe, expect, it } from 'vitest';
import { buildLadderUserPreviewFromEntry } from '../leaderboardPreviewService';
import type { LeaderboardEntry } from '../leaderboardCacheService';

describe('buildLadderUserPreviewFromEntry', () => {
  it('maps list row fields and leaves radar empty for graceful degradation', () => {
    const entry: LeaderboardEntry = {
      uid: 'uid-fallback',
      displayName: 'SINN',
      scoreBest: 102.11,
      updatedAt: '2026-06-04T02:57:06.000Z',
      gender: 'male',
      ageBucket: '30-39',
      avatarUrl: 'https://cdn.example.com/a.jpg',
    };
    const preview = buildLadderUserPreviewFromEntry(entry);
    expect(preview.uid).toBe('uid-fallback');
    expect(preview.displayName).toBe('SINN');
    expect(preview.avatarUrl).toBe('https://cdn.example.com/a.jpg');
    expect(preview.gender).toBe('male');
    expect(preview.ageBucket).toBe('30-39');
    expect(preview.radarScores).toEqual({});
    expect(preview.radarAxisCount).toBe(0);
    expect(preview.radarComplete).toBe(false);
  });

  it('strips invalid avatar URLs and hides identity for anonymous rows', () => {
    const entry: LeaderboardEntry = {
      uid: 'anon',
      displayName: 'Hidden',
      scoreBest: 50,
      updatedAt: '2026-06-04T00:00:00.000Z',
      isAnonymousInLadder: true,
      avatarUrl: 'http://insecure.example/a.jpg',
    };
    const preview = buildLadderUserPreviewFromEntry(entry);
    expect(preview.displayName).toBe('Anonymous');
    expect(preview.avatarUrl).toBeUndefined();
    expect(preview.isAnonymousInLadder).toBe(true);
  });
});
