import { describe, expect, it } from 'vitest';
import {
  isLadderOverallEntryDriftFromPreview,
  scoresEqualForLadderWrite,
} from '../ladderScoreCompare';

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

describe('isLadderOverallEntryDriftFromPreview', () => {
  it('flags drift between list score and preview average', () => {
    expect(isLadderOverallEntryDriftFromPreview(98.82, 93.31)).toBe(true);
    expect(isLadderOverallEntryDriftFromPreview(93.31, 93.31)).toBe(false);
  });

  it('returns false when inputs are missing', () => {
    expect(isLadderOverallEntryDriftFromPreview(null, 90)).toBe(false);
    expect(isLadderOverallEntryDriftFromPreview(90, null)).toBe(false);
  });
});
