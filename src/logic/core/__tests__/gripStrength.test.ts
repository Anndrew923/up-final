import { describe, expect, it } from 'vitest';
import {
  applyGripPeakCap,
  calculateGripStrengthScore,
  GRIP_MAX_PEAK_KG,
  getGripRankMetadata,
  resolveGripAuraFromBandId,
  resolveGripStrengthScoreFromInputs,
} from '../gripStrength';

describe('calculateGripStrengthScore', () => {
  it('matches male calibration samples', () => {
    expect(calculateGripStrengthScore(45, 'male')).toBe(63);
    expect(calculateGripStrengthScore(65, 'male')).toBe(91);
    expect(calculateGripStrengthScore(72, 'male')).toBe(100.8);
    expect(calculateGripStrengthScore(175, 'male')).toBe(245);
  });

  it('matches female compensation sample', () => {
    expect(calculateGripStrengthScore(40, 'female')).toBe(89.6);
  });

  it('locks scoring at 175kg model cap', () => {
    expect(calculateGripStrengthScore(180, 'male')).toBe(calculateGripStrengthScore(175, 'male'));
    expect(calculateGripStrengthScore(180, 'female')).toBe(
      calculateGripStrengthScore(175, 'female')
    );
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
    expect(applyGripPeakCap(175)).toEqual({
      inputKg: 175,
      usedKg: 175,
      capped: false,
    });
  });
});

describe('resolveGripAuraFromBandId', () => {
  it('maps decade grip bands to aura tiers', () => {
    expect(resolveGripAuraFromBandId('BASE')).toBe('none');
    expect(resolveGripAuraFromBandId('TIER_50')).toBe('none');
    expect(resolveGripAuraFromBandId('TIER_60')).toBe('pulse');
    expect(resolveGripAuraFromBandId('TIER_80')).toBe('flow');
    expect(resolveGripAuraFromBandId('TIER_90')).toBe('shimmer');
    expect(resolveGripAuraFromBandId('TIER_100')).toBe('shimmer');
    expect(resolveGripAuraFromBandId('TIER_110')).toBe('lightning');
    expect(resolveGripAuraFromBandId('TIER_130')).toBe('void_flame');
    expect(resolveGripAuraFromBandId('TIER_150')).toBe('void_flame');
    expect(resolveGripAuraFromBandId('TIER_170')).toBe('void_flame');
    expect(resolveGripAuraFromBandId('PANTHEON')).toBe('divine_light');
  });
});

describe('getGripRankMetadata', () => {
  it('derives rankKey from decade score bands', () => {
    expect(getGripRankMetadata(63)).toEqual({
      rankKey: 'TIER_60',
      color: 'green',
      aura: 'pulse',
    });
    expect(getGripRankMetadata(92)).toEqual({
      rankKey: 'TIER_90',
      color: 'purple',
      aura: 'shimmer',
    });
    expect(getGripRankMetadata(135)).toEqual({
      rankKey: 'TIER_130',
      color: 'black',
      aura: 'void_flame',
    });
  });

  it('returns PANTHEON with divine_light for scores at or above 180', () => {
    expect(getGripRankMetadata(185)).toEqual({
      rankKey: 'PANTHEON',
      color: 'gold',
      aura: 'divine_light',
    });
    expect(getGripRankMetadata(224)).toEqual({
      rankKey: 'PANTHEON',
      color: 'gold',
      aura: 'divine_light',
    });
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
