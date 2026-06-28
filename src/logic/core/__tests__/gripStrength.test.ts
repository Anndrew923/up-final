import { describe, expect, it } from 'vitest';
import {
  applyGripPeakCap,
  calculateGripStrengthScore,
  GRIP_BASE_WEIGHT_KG,
  GRIP_MAX_PEAK_KG,
  getGripRankMetadata,
  resolveGripAuraFromBandId,
  resolveGripStrengthScoreFromInputs,
  resolveGripWeightFactor,
} from '../gripStrength';

const ANCHOR_WEIGHT = GRIP_BASE_WEIGHT_KG;

describe('resolveGripWeightFactor', () => {
  it('returns 1.0 at the 75 kg anchor', () => {
    expect(resolveGripWeightFactor(75)).toBe(1);
  });

  it('applies 0.5 exponent below anchor and 0.33 above', () => {
    expect(resolveGripWeightFactor(60)).toBeCloseTo(Math.pow(75 / 60, 0.5), 5);
    expect(resolveGripWeightFactor(200)).toBeCloseTo(Math.pow(75 / 200, 0.3333), 4);
  });

  it('defaults to anchor when weight missing', () => {
    expect(resolveGripWeightFactor(null)).toBe(1);
    expect(resolveGripWeightFactor(undefined)).toBe(1);
  });
});

describe('calculateGripStrengthScore', () => {
  it('matches male calibration samples at 75 kg anchor', () => {
    expect(calculateGripStrengthScore(45, ANCHOR_WEIGHT, 'male')).toBe(63);
    expect(calculateGripStrengthScore(65, ANCHOR_WEIGHT, 'male')).toBe(91);
    expect(calculateGripStrengthScore(72, ANCHOR_WEIGHT, 'male')).toBe(100.8);
    expect(calculateGripStrengthScore(160, ANCHOR_WEIGHT, 'male')).toBe(224);
  });

  it('boosts lighter athletes relative to anchor', () => {
    expect(calculateGripStrengthScore(55, 60, 'male')).toBe(86.1);
  });

  it('dampens heavyweight absolute grip inflation (Hafthor-class)', () => {
    expect(calculateGripStrengthScore(140, 200, 'male')).toBe(141.3);
    expect(getGripRankMetadata(141.3).rankKey).toBe('TIER_140');
  });

  it('dampens Shaq-class heavy frames while preserving elite tier', () => {
    expect(calculateGripStrengthScore(110, 150, 'male')).toBe(122.2);
    expect(getGripRankMetadata(122.2).rankKey).toBe('TIER_120');
  });

  it('scores higher grip at same peak when body weight is lighter', () => {
    const atAnchor = calculateGripStrengthScore(65, 75, 'male');
    const lighter = calculateGripStrengthScore(65, 73, 'male');
    expect(lighter).toBeGreaterThan(atAnchor);
  });

  it('matches female compensation at anchor weight', () => {
    expect(calculateGripStrengthScore(40, ANCHOR_WEIGHT, 'female')).toBe(89.6);
    expect(calculateGripStrengthScore(40, ANCHOR_WEIGHT, '女性')).toBe(89.6);
  });

  it('locks scoring at 160kg model cap regardless of body weight', () => {
    expect(calculateGripStrengthScore(180, ANCHOR_WEIGHT, 'male')).toBe(
      calculateGripStrengthScore(160, ANCHOR_WEIGHT, 'male'),
    );
    expect(calculateGripStrengthScore(180, 200, 'female')).toBe(
      calculateGripStrengthScore(160, 200, 'female'),
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
    expect(applyGripPeakCap(160)).toEqual({
      inputKg: 160,
      usedKg: 160,
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
        weightKg: ANCHOR_WEIGHT,
        updatedAt: '',
      },
      { peakKg: 180 },
    );
    expect(score).toBe(200);
  });

  it('applies allometric factor from profile weight', () => {
    const score = resolveGripStrengthScoreFromInputs(
      {
        gender: 'male',
        age: 30,
        heightCm: 180,
        weightKg: 200,
        updatedAt: '',
      },
      { peakKg: 140 },
    );
    expect(score).toBe(141.3);
  });
});
