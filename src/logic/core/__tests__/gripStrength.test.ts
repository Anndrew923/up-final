import { describe, expect, it } from 'vitest';
import {
  applyGripPeakCap,
  calculateGripStrengthScore,
  GRIP_MAX_PEAK_KG,
  getGripRankMetadata,
  resolveGripStrengthScoreFromInputs,
} from '../gripStrength';

describe('calculateGripStrengthScore', () => {
  it('matches male calibration samples', () => {
    expect(calculateGripStrengthScore(45, 'male')).toBe(63);
    expect(calculateGripStrengthScore(65, 'male')).toBe(91);
    expect(calculateGripStrengthScore(72, 'male')).toBe(100.8);
    expect(calculateGripStrengthScore(160, 'male')).toBe(224);
  });

  it('matches female compensation sample', () => {
    expect(calculateGripStrengthScore(40, 'female')).toBe(89.6);
  });

  it('locks scoring at 160kg model cap', () => {
    expect(calculateGripStrengthScore(180, 'male')).toBe(calculateGripStrengthScore(160, 'male'));
    expect(calculateGripStrengthScore(180, 'female')).toBe(calculateGripStrengthScore(160, 'female'));
  });
});

describe('applyGripPeakCap', () => {
  it('caps values above max and reports capped state', () => {
    expect(applyGripPeakCap(180)).toEqual({
      inputKg: 180,
      usedKg: GRIP_MAX_PEAK_KG,
      capped: true,
    });
  });

  it('passes through values at or below cap', () => {
    expect(applyGripPeakCap(160)).toEqual({
      inputKg: 160,
      usedKg: 160,
      capped: false,
    });
  });
});

describe('getGripRankMetadata', () => {
  it('returns divine rank for high scores', () => {
    expect(getGripRankMetadata(224).rankKey).toBe('godHand');
  });
});

describe('resolveGripStrengthScoreFromInputs', () => {
  it('returns null when profile incomplete', () => {
    expect(resolveGripStrengthScoreFromInputs(null, { peakKg: 50 })).toBeNull();
  });

  it('uses capped value when persisted peak exceeds model max', () => {
    const score = resolveGripStrengthScoreFromInputs(
      {
        gender: 'male',
        age: 30,
        heightCm: 180,
        weightKg: 80,
        updatedAt: '',
      },
      { peakKg: 180 }
    );
    expect(score).toBe(200);
  });
});
