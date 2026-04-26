import { describe, expect, it } from 'vitest';
import { mergeScoreMapForHomeRadar } from '../radarMergedScores';

describe('mergeScoreMapForHomeRadar', () => {
  it('returns a score map for empty persisted inputs without throwing', () => {
    const out = mergeScoreMapForHomeRadar({
      scores: {},
      profile: null,
      cardioInputs: null,
      muscleInputs: null,
      powerInputs: null,
      strengthInputs: null,
      gripInputs: null,
    });
    expect(typeof out).toBe('object');
  });
});
