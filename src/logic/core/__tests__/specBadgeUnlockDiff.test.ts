import { describe, expect, it } from 'vitest';
import { diffNewlyUnlocked } from '../specBadgeUnlockDiff';

describe('diffNewlyUnlocked', () => {
  it('returns empty when nothing changed', () => {
    expect(diffNewlyUnlocked(['A', 'B'], ['A', 'B'])).toEqual([]);
  });

  it('returns newly added IDs preserving order', () => {
    expect(diffNewlyUnlocked(['A'], ['A', 'B', 'C'])).toEqual(['B', 'C']);
  });

  it('returns all when previous was empty', () => {
    expect(diffNewlyUnlocked([], ['X', 'Y'])).toEqual(['X', 'Y']);
  });

  it('returns empty when current is empty', () => {
    expect(diffNewlyUnlocked(['A'], [])).toEqual([]);
  });

  it('ignores removed IDs', () => {
    expect(diffNewlyUnlocked(['A', 'B'], ['B'])).toEqual([]);
  });
});
