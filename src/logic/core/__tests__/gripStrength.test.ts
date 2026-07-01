import { describe, expect, it } from 'vitest';
import {
  applyGripPeakCap,
  calculateGripStrengthScore,
  GRIP_BASE_WEIGHT_KG_FEMALE,
  GRIP_BASE_WEIGHT_KG_MALE,
  GRIP_MAX_PEAK_KG,
  getGripRankMetadata,
  resolveGripAuraFromBandId,
  resolveGripBaseWeightKg,
  resolveGripStrengthScoreFromInputs,
  resolveGripWeightFactor,
} from '../gripStrength';

const MALE_ANCHOR = GRIP_BASE_WEIGHT_KG_MALE;
const FEMALE_ANCHOR = GRIP_BASE_WEIGHT_KG_FEMALE;

describe('resolveGripBaseWeightKg', () => {
  it('returns sex-specific golden anchors', () => {
    expect(resolveGripBaseWeightKg('male')).toBe(75);
    expect(resolveGripBaseWeightKg('female')).toBe(55);
    expect(resolveGripBaseWeightKg('女性')).toBe(55);
  });
});

describe('resolveGripWeightFactor', () => {
  it('returns 1.0 at each sex-specific anchor', () => {
    expect(resolveGripWeightFactor(75, 'male')).toBe(1);
    expect(resolveGripWeightFactor(55, 'female')).toBe(1);
  });

  it('applies 0.5 exponent below anchor and 0.33 above (male track)', () => {
    expect(resolveGripWeightFactor(60, 'male')).toBeCloseTo(Math.pow(75 / 60, 0.5), 5);
    expect(resolveGripWeightFactor(200, 'male')).toBeCloseTo(Math.pow(75 / 200, 0.3333), 4);
  });

  it('applies female 55 kg anchor curve independently', () => {
    expect(resolveGripWeightFactor(50, 'female')).toBeCloseTo(Math.pow(55 / 50, 0.5), 5);
    expect(resolveGripWeightFactor(70, 'female')).toBeCloseTo(Math.pow(55 / 70, 0.3333), 4);
  });

  it('defaults to sex-appropriate anchor when weight missing', () => {
    expect(resolveGripWeightFactor(null, 'male')).toBe(1);
    expect(resolveGripWeightFactor(undefined, 'female')).toBe(1);
  });
});

describe('calculateGripStrengthScore', () => {
  it('matches male golden anchor: 75 kg / 72 kg peak → 100.8', () => {
    expect(calculateGripStrengthScore(72, MALE_ANCHOR, 'male')).toBe(100.8);
  });

  it('matches male calibration samples at 75 kg anchor', () => {
    expect(calculateGripStrengthScore(45, MALE_ANCHOR, 'male')).toBe(63);
    expect(calculateGripStrengthScore(65, MALE_ANCHOR, 'male')).toBe(91);
    expect(calculateGripStrengthScore(160, MALE_ANCHOR, 'male')).toBe(224);
  });

  it('matches female golden anchor: 55 kg / 45 kg peak → 100.8', () => {
    expect(calculateGripStrengthScore(45, FEMALE_ANCHOR, 'female')).toBe(100.8);
    expect(calculateGripStrengthScore(45, FEMALE_ANCHOR, '女性')).toBe(100.8);
  });

  it('matches female general case at 55 kg anchor', () => {
    expect(calculateGripStrengthScore(40, FEMALE_ANCHOR, 'female')).toBe(89.6);
  });

  it('boosts female lightweight pocket rockets (50 kg / 35 kg peak)', () => {
    expect(calculateGripStrengthScore(35, 50, 'female')).toBe(82.2);
  });

  it('dampens female heavyweight frames without over-penalizing (70 kg / 48 kg peak)', () => {
    expect(calculateGripStrengthScore(48, 70, 'female')).toBe(99.2);
    expect(getGripRankMetadata(99.2).rankKey).toBe('TIER_90');
  });

  it('boosts lighter male athletes relative to anchor', () => {
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

  it('locks scoring at 160kg model cap regardless of body weight', () => {
    expect(calculateGripStrengthScore(180, MALE_ANCHOR, 'male')).toBe(
      calculateGripStrengthScore(160, MALE_ANCHOR, 'male'),
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
    expect(resolveGripAuraFromBandId('TIER_140')).toBe('void_flame');
    expect(resolveGripAuraFromBandId('LEGEND')).toBe('divine_light');
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
    expect(getGripRankMetadata(145)).toEqual({
      rankKey: 'TIER_140',
      color: 'black',
      aura: 'void_flame',
    });
    expect(getGripRankMetadata(150)).toEqual({
      rankKey: 'LEGEND',
      color: 'gold',
      aura: 'divine_light',
    });
  });

  it('returns PANTHEON with divine_light for scores at or above 160', () => {
    expect(getGripRankMetadata(160)).toEqual({
      rankKey: 'PANTHEON',
      color: 'gold',
      aura: 'divine_light',
    });
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
        weightKg: MALE_ANCHOR,
        updatedAt: '',
      },
      { peakKg: 180 },
    );
    expect(score).toBe(200);
  });

  it('applies male allometric factor from profile weight', () => {
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

  it('applies female 55 kg anchor from profile', () => {
    const score = resolveGripStrengthScoreFromInputs(
      {
        gender: 'female',
        age: 28,
        heightCm: 165,
        weightKg: FEMALE_ANCHOR,
        updatedAt: '',
      },
      { peakKg: 45 },
    );
    expect(score).toBe(100.8);
  });
});
