import { describe, expect, it } from 'vitest';
import {
  filterBlockedLeaderboardRows,
  formatLadderBlockedMicroUid,
  isUidBlocked,
  normalizeLadderBlockedEntries,
  normalizeLadderBlockedEntry,
  resolveLadderBlockedTitle,
} from '../ladderBlockList';

describe('ladderBlockList', () => {
  it('isUidBlocked returns false for empty uid', () => {
    expect(isUidBlocked(new Set(['a']), '')).toBe(false);
    expect(isUidBlocked(new Set(['a']), null)).toBe(false);
  });

  it('filterBlockedLeaderboardRows removes blocked uids', () => {
    const rows = [
      { uid: 'u1', displayName: 'A', scoreBest: 1, updatedAt: '' },
      { uid: 'u2', displayName: 'B', scoreBest: 2, updatedAt: '' },
    ];
    const filtered = filterBlockedLeaderboardRows(rows, new Set(['u1']));
    expect(filtered.map((r) => r.uid)).toEqual(['u2']);
  });

  it('formatLadderBlockedMicroUid keeps short ids intact', () => {
    expect(formatLadderBlockedMicroUid('abc')).toBe('abc');
  });

  it('formatLadderBlockedMicroUid truncates long ids', () => {
    expect(formatLadderBlockedMicroUid('34RNn2GsqwWCTkYd9KITrWgjg7t1')).toBe('34RNn2...g7t1');
  });

  it('resolveLadderBlockedTitle prefers displayName', () => {
    expect(
      resolveLadderBlockedTitle({
        uid: '34RNn2GsqwWCTkYd9KITrWgjg7t1',
        displayName: '學員甲',
      })
    ).toBe('學員甲');
  });

  it('resolveLadderBlockedTitle falls back to micro uid', () => {
    expect(
      resolveLadderBlockedTitle({
        uid: '34RNn2GsqwWCTkYd9KITrWgjg7t1',
        displayName: '  ',
      })
    ).toBe('34RNn2...g7t1');
  });

  it('normalizeLadderBlockedEntry accepts legacy string and object shapes', () => {
    expect(normalizeLadderBlockedEntry('uid-1')).toEqual({ uid: 'uid-1', displayName: '' });
    expect(normalizeLadderBlockedEntry({ uid: 'uid-2', displayName: 'Bob' })).toEqual({
      uid: 'uid-2',
      displayName: 'Bob',
    });
    expect(normalizeLadderBlockedEntry({ uid: '  ', displayName: 'x' })).toBeNull();
  });

  it('normalizeLadderBlockedEntries dedupes mixed legacy payloads preferring names', () => {
    expect(
      normalizeLadderBlockedEntries([
        'uid-a',
        { uid: 'uid-a', displayName: 'A' },
        { uid: 'uid-b', displayName: 'B' },
        null,
      ])
    ).toEqual([
      { uid: 'uid-a', displayName: 'A' },
      { uid: 'uid-b', displayName: 'B' },
    ]);
  });
});
