import { describe, expect, it } from 'vitest';
import { detectPromotion, detectTierMilestone } from '../leaderboardProgress';

describe('leaderboard progress logic', () => {
  it('detects upward promotion with delta', () => {
    const event = detectPromotion(52, 31);
    expect(event).toMatchObject({
      previousRank: 52,
      currentRank: 31,
      delta: 21,
    });
  });

  it('returns null when rank does not improve', () => {
    expect(detectPromotion(20, 22)).toBeNull();
    expect(detectPromotion(20, 20)).toBeNull();
  });

  it('detects milestone threshold crossing', () => {
    expect(detectTierMilestone(510, 490)).toBe(500);
    expect(detectTierMilestone(12, 2)).toBe(3);
  });
});
