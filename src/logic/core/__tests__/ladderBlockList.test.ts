import { describe, expect, it } from 'vitest';
import {
  filterBlockedLeaderboardRows,
  isUidBlocked,
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
});
