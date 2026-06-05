import { describe, expect, it } from 'vitest';
import {
  hasNextLeaderboardPage,
  isLadderProfileFilterActive,
  paginateLeaderboardRowsWithRank,
  resolveLadderEffectiveRank,
  resolveLadderFilteredRank,
  resolveLadderJumpTargetPage,
  resolveLeaderboardMaxPage,
  shouldShowLadderFloatingRankBar,
} from '../ladderFilteredRank';

describe('ladderFilteredRank', () => {
  const baseFilters = {
    gender: 'all' as const,
    ageBucket: 'all' as const,
    heightBucket: 'all' as const,
    weightBucket: 'all' as const,
    jobCategory: 'all' as const,
    countryCode: 'all' as const,
    city: 'all' as const,
    district: 'all' as const,
  };

  it('detects active profile filters', () => {
    expect(isLadderProfileFilterActive(baseFilters)).toBe(false);
    expect(isLadderProfileFilterActive({ ...baseFilters, gender: 'male' })).toBe(true);
  });

  it('resolves filtered rank for auth uid', () => {
    const rows = [{ uid: 'a' }, { uid: 'b' }, { uid: 'me' }];
    expect(resolveLadderFilteredRank(rows, 'me')).toEqual({
      myFilteredRank: 3,
      isMeInFilteredList: true,
    });
    expect(resolveLadderFilteredRank(rows, 'missing')).toEqual({
      myFilteredRank: null,
      isMeInFilteredList: false,
    });
  });

  it('paginates filtered rows with sub-rank numbers', () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ uid: `u${i}` }));
    const page2 = paginateLeaderboardRowsWithRank(rows, 2, 25);
    expect(page2).toHaveLength(5);
    expect(page2[0]?.rank).toBe(26);
    expect(page2[0]?.uid).toBe('u25');
  });

  it('computes hasNextLeaderboardPage from filtered totals', () => {
    expect(hasNextLeaderboardPage(30, 1, 25)).toBe(true);
    expect(hasNextLeaderboardPage(25, 1, 25)).toBe(false);
    expect(hasNextLeaderboardPage(26, 2, 25)).toBe(false);
  });

  it('resolves effective jump rank for global vs filtered modes', () => {
    expect(
      resolveLadderEffectiveRank({
        isFilterActive: false,
        isMeInFilteredList: true,
        myFilteredRank: null,
        myRank: 100,
      })
    ).toBe(100);
    expect(
      resolveLadderEffectiveRank({
        isFilterActive: true,
        isMeInFilteredList: true,
        myFilteredRank: 12,
        myRank: 100,
      })
    ).toBe(12);
    expect(
      resolveLadderEffectiveRank({
        isFilterActive: true,
        isMeInFilteredList: false,
        myFilteredRank: null,
        myRank: 100,
      })
    ).toBeNull();
  });

  it('resolves jump target page and max page', () => {
    expect(resolveLadderJumpTargetPage(100, 25)).toBe(4);
    expect(resolveLeaderboardMaxPage(30, 25)).toBe(2);
    expect(resolveLeaderboardMaxPage(0, 25)).toBe(1);
  });

  it('shows floating bar when filtered out or row is off-screen', () => {
    const entry = { scoreBest: 12.5 };
    expect(
      shouldShowLadderFloatingRankBar({
        myRank: 9,
        myEntry: entry,
        isFilterActive: true,
        isMeInFilteredList: false,
        forceFloatingBarAtTop: false,
        myRowInViewport: true,
      })
    ).toBe(true);
    expect(
      shouldShowLadderFloatingRankBar({
        myRank: 9,
        myEntry: entry,
        isFilterActive: false,
        isMeInFilteredList: true,
        forceFloatingBarAtTop: false,
        myRowInViewport: true,
      })
    ).toBe(false);
  });
});
