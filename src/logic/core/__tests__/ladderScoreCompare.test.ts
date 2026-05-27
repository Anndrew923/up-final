import { describe, expect, it } from 'vitest';
import { scoresEqualForLadderWrite } from '../ladderScoreCompare';

describe('scoresEqualForLadderWrite', () => {
  it('treats values equal at two decimal places', () => {
    expect(scoresEqualForLadderWrite(98.364, 98.36)).toBe(true);
    expect(scoresEqualForLadderWrite(100, 100)).toBe(true);
  });

  it('detects meaningful changes including lower scores', () => {
    expect(scoresEqualForLadderWrite(100, 99.99)).toBe(false);
    expect(scoresEqualForLadderWrite(120, 119)).toBe(false);
  });
});
