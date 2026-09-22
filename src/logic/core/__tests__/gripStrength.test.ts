import { describe, expect, it } from 'vitest';
import {
  applyGripPeakCap,
  calculateGripStrengthScore,
  GRIP_BASE_WEIGHT_KG_FEMALE,
  GRIP_BASE_WEIGHT_KG_MALE,
  GRIP_CENTURY_PEAK_KG_FEMALE,
  GRIP_CENTURY_PEAK_KG_MALE,
  GRIP_CENTURY_SCORE,
  GRIP_ELITE_SLOPE_FEMALE,
  GRIP_ELITE_SLOPE_MALE,
  GRIP_MAX_PEAK_KG_FEMALE,
  GRIP_MAX_PEAK_KG_MALE,
  invertGripStrengthScoreToPeakKg,
  resolveGripBaseWeightKg,
  resolveGripMaxPeakKg,
  resolveGripMilestoneRawGap,
  resolveGripStrengthScoreFromInputs,
  resolveGripWeightFactor,
} from '../gripStrength';
import { SCORE_AXIS_MAX } from '../scoring';
import { resolveScoreMeaningMilestone } from '../scoreMeaningCatalog';

const MALE_ANCHOR = GRIP_BASE_WEIGHT_KG_MALE;
const FEMALE_ANCHOR = GRIP_BASE_WEIGHT_KG_FEMALE;

describe('resolveGripBaseWeightKg', () => {
  it('returns sex-specific golden anchors', () => {
    expect(resolveGripBaseWeightKg('male')).toBe(75);
    expect(resolveGripBaseWeightKg('female')).toBe(55);
    expect(resolveGripBaseWeightKg('女性')).toBe(55);
  });
});

describe('resolveGripMaxPeakKg', () => {
  it('returns sex-specific peak ceilings', () => {
    expect(resolveGripMaxPeakKg('male')).toBe(GRIP_MAX_PEAK_KG_MALE);
    expect(resolveGripMaxPeakKg('female')).toBe(GRIP_MAX_PEAK_KG_FEMALE);
    expect(resolveGripMaxPeakKg('女性')).toBe(110);
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

  it('matches male linear-zone samples at 75 kg anchor', () => {
    expect(calculateGripStrengthScore(45, MALE_ANCHOR, 'male')).toBe(63);
    expect(calculateGripStrengthScore(65, MALE_ANCHOR, 'male')).toBe(91);
  });

  it('maps world-record class 178 kg to ~183 at male anchor (dual-slope elite zone)', () => {
    expect(calculateGripStrengthScore(178, MALE_ANCHOR, 'male')).toBe(183);
  });

  it('closes male model ceiling at 200 kg → SCORE_AXIS_MAX', () => {
    expect(calculateGripStrengthScore(200, MALE_ANCHOR, 'male')).toBe(SCORE_AXIS_MAX);
    expect(calculateGripStrengthScore(220, MALE_ANCHOR, 'male')).toBe(SCORE_AXIS_MAX);
  });

  it('keeps century-gate continuous with derived elite slopes (W_factor = 1)', () => {
    expect(GRIP_ELITE_SLOPE_MALE).toBeCloseTo(0.775, 10);
    expect(GRIP_ELITE_SLOPE_FEMALE).toBeCloseTo(99.2 / 65, 10);
    expect(calculateGripStrengthScore(GRIP_CENTURY_PEAK_KG_MALE, MALE_ANCHOR, 'male')).toBe(
      GRIP_CENTURY_SCORE
    );
    expect(calculateGripStrengthScore(GRIP_CENTURY_PEAK_KG_FEMALE, FEMALE_ANCHOR, 'female')).toBe(
      GRIP_CENTURY_SCORE
    );
  });

  it('matches female golden anchor: 55 kg / 45 kg peak → 100.8', () => {
    expect(calculateGripStrengthScore(45, FEMALE_ANCHOR, 'female')).toBe(100.8);
    expect(calculateGripStrengthScore(45, FEMALE_ANCHOR, '女性')).toBe(100.8);
  });

  it('matches female linear-zone sample at 55 kg anchor', () => {
    expect(calculateGripStrengthScore(40, FEMALE_ANCHOR, 'female')).toBe(89.6);
  });

  it('closes female model ceiling at 110 kg → SCORE_AXIS_MAX', () => {
    expect(calculateGripStrengthScore(110, FEMALE_ANCHOR, 'female')).toBe(SCORE_AXIS_MAX);
    expect(calculateGripStrengthScore(180, FEMALE_ANCHOR, 'female')).toBe(SCORE_AXIS_MAX);
  });

  it('boosts female lightweight pocket rockets (50 kg / 35 kg peak)', () => {
    expect(calculateGripStrengthScore(35, 50, 'female')).toBe(82.2);
  });

  it('dampens female heavyweight frames with elite-slope dual track (70 kg / 48 kg peak)', () => {
    expect(calculateGripStrengthScore(48, 70, 'female')).toBe(97.2);
  });

  it('boosts lighter male athletes relative to anchor', () => {
    expect(calculateGripStrengthScore(55, 60, 'male')).toBe(86.1);
  });

  it('dampens heavyweight absolute grip inflation (Hafthor-class) under dual-slope', () => {
    expect(calculateGripStrengthScore(140, 200, 'male')).toBe(110.7);
  });

  it('dampens Shaq-class heavy frames under dual-slope', () => {
    expect(calculateGripStrengthScore(110, 150, 'male')).toBe(103.4);
  });

  it('scores higher grip at same peak when body weight is lighter', () => {
    const atAnchor = calculateGripStrengthScore(65, 75, 'male');
    const lighter = calculateGripStrengthScore(65, 73, 'male');
    expect(lighter).toBeGreaterThan(atAnchor);
  });

  it('locks scoring at sex-specific model caps regardless of body weight', () => {
    expect(calculateGripStrengthScore(220, MALE_ANCHOR, 'male')).toBe(
      calculateGripStrengthScore(200, MALE_ANCHOR, 'male')
    );
    expect(calculateGripStrengthScore(180, FEMALE_ANCHOR, 'female')).toBe(
      calculateGripStrengthScore(110, FEMALE_ANCHOR, 'female')
    );
  });
});

describe('applyGripPeakCap', () => {
  it('caps male values above 200 kg and reports capped state', () => {
    expect(applyGripPeakCap(220, 'male')).toEqual({
      inputKg: 220,
      usedKg: GRIP_MAX_PEAK_KG_MALE,
      capped: true,
      maxKg: GRIP_MAX_PEAK_KG_MALE,
    });
  });

  it('caps female values above 110 kg', () => {
    expect(applyGripPeakCap(150, 'female')).toEqual({
      inputKg: 150,
      usedKg: GRIP_MAX_PEAK_KG_FEMALE,
      capped: true,
      maxKg: GRIP_MAX_PEAK_KG_FEMALE,
    });
  });

  it('passes through values at or below sex-specific cap', () => {
    expect(applyGripPeakCap(200, 'male')).toEqual({
      inputKg: 200,
      usedKg: 200,
      capped: false,
      maxKg: GRIP_MAX_PEAK_KG_MALE,
    });
    expect(applyGripPeakCap(110, 'female')).toEqual({
      inputKg: 110,
      usedKg: 110,
      capped: false,
      maxKg: GRIP_MAX_PEAK_KG_FEMALE,
    });
  });
});

describe('resolveGripStrengthScoreFromInputs', () => {
  it('returns null when profile incomplete', () => {
    expect(resolveGripStrengthScoreFromInputs(null, { peakKg: 50 })).toBeNull();
  });

  it('uses capped value when persisted male peak exceeds model max', () => {
    const score = resolveGripStrengthScoreFromInputs(
      {
        gender: 'male',
        age: 30,
        heightCm: 180,
        weightKg: MALE_ANCHOR,
        updatedAt: '',
      },
      { peakKg: 220 }
    );
    expect(score).toBe(SCORE_AXIS_MAX);
  });

  it('uses capped value when persisted female peak exceeds model max', () => {
    const score = resolveGripStrengthScoreFromInputs(
      {
        gender: 'female',
        age: 28,
        heightCm: 165,
        weightKg: FEMALE_ANCHOR,
        updatedAt: '',
      },
      { peakKg: 150 }
    );
    expect(score).toBe(SCORE_AXIS_MAX);
  });

  it('applies male allometric factor from profile weight under dual-slope', () => {
    const score = resolveGripStrengthScoreFromInputs(
      {
        gender: 'male',
        age: 30,
        heightCm: 180,
        weightKg: 200,
        updatedAt: '',
      },
      { peakKg: 140 }
    );
    expect(score).toBe(110.7);
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
      { peakKg: 45 }
    );
    expect(score).toBe(100.8);
  });
});

describe('invertGripStrengthScoreToPeakKg', () => {
  it('returns null for non-positive or non-finite targets', () => {
    expect(invertGripStrengthScoreToPeakKg(0, MALE_ANCHOR, 'male')).toBeNull();
    expect(invertGripStrengthScoreToPeakKg(-10, MALE_ANCHOR, 'male')).toBeNull();
    expect(invertGripStrengthScoreToPeakKg(Number.NaN, MALE_ANCHOR, 'male')).toBeNull();
  });

  it('inverts male golden century gate at W_factor = 1', () => {
    expect(invertGripStrengthScoreToPeakKg(GRIP_CENTURY_SCORE, MALE_ANCHOR, 'male')).toBe(
      GRIP_CENTURY_PEAK_KG_MALE
    );
  });

  it('inverts female golden century gate at W_factor = 1', () => {
    expect(invertGripStrengthScoreToPeakKg(GRIP_CENTURY_SCORE, FEMALE_ANCHOR, 'female')).toBe(
      GRIP_CENTURY_PEAK_KG_FEMALE
    );
  });

  it('inverts male linear-zone samples (below century peak)', () => {
    expect(invertGripStrengthScoreToPeakKg(63, MALE_ANCHOR, 'male')).toBe(45);
    expect(invertGripStrengthScoreToPeakKg(91, MALE_ANCHOR, 'male')).toBe(65);
  });

  it('inverts across the male elite-slope boundary (above century peak)', () => {
    const peak = invertGripStrengthScoreToPeakKg(183, MALE_ANCHOR, 'male');
    expect(peak).toBe(178);
    expect(calculateGripStrengthScore(peak!, MALE_ANCHOR, 'male')).toBe(183);
  });

  it('inverts female linear-zone and elite-slope samples', () => {
    expect(invertGripStrengthScoreToPeakKg(89.6, FEMALE_ANCHOR, 'female')).toBe(40);
    const elitePeak = invertGripStrengthScoreToPeakKg(SCORE_AXIS_MAX, FEMALE_ANCHOR, 'female');
    expect(elitePeak).toBe(GRIP_MAX_PEAK_KG_FEMALE);
  });

  it('round-trips: forward(invert(score)) >= score for decade gates', () => {
    const gates = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
    for (const gate of gates) {
      const peak = invertGripStrengthScoreToPeakKg(gate, MALE_ANCHOR, 'male');
      expect(peak).not.toBeNull();
      expect(calculateGripStrengthScore(peak!, MALE_ANCHOR, 'male')).toBeGreaterThanOrEqual(gate);
    }
  });

  it('accounts for allometric W_factor (lighter body needs less peak kg)', () => {
    const atAnchor = invertGripStrengthScoreToPeakKg(90, 75, 'male');
    const lighter = invertGripStrengthScoreToPeakKg(90, 60, 'male');
    expect(atAnchor).not.toBeNull();
    expect(lighter).not.toBeNull();
    expect(lighter!).toBeLessThan(atAnchor!);
  });

  it('returns null when target exceeds sex-specific ceiling score', () => {
    expect(
      invertGripStrengthScoreToPeakKg(SCORE_AXIS_MAX + 1, MALE_ANCHOR, 'male')
    ).toBeNull();
  });

  it('closes male model at SCORE_AXIS_MAX → max peak kg', () => {
    expect(invertGripStrengthScoreToPeakKg(SCORE_AXIS_MAX, MALE_ANCHOR, 'male')).toBe(
      GRIP_MAX_PEAK_KG_MALE
    );
  });
});

describe('resolveGripMilestoneRawGap', () => {
  it('exposes delta kg toward the next decade gate', () => {
    const currentPeakKg = 45;
    const score = calculateGripStrengthScore(currentPeakKg, MALE_ANCHOR, 'male');
    expect(score).toBe(63);
    const { nextMilestone } = resolveScoreMeaningMilestone('gripStrength', score);
    expect(nextMilestone).toBe(70);
    const gap = resolveGripMilestoneRawGap({
      currentPeakKg,
      targetScore: nextMilestone!,
      weightKg: MALE_ANCHOR,
      gender: 'male',
    });
    expect(gap).toEqual({
      delta: expect.any(Number),
      unit: 'kg',
    });
    expect(gap!.delta).toBeGreaterThanOrEqual(0.1);
    const required = invertGripStrengthScoreToPeakKg(70, MALE_ANCHOR, 'male');
    expect(gap!.delta).toBe(Math.max(0.1, Math.round((required! - currentPeakKg) * 10) / 10));
  });

  it('floors delta at 0.1 kg near the gate', () => {
    const requiredFor90 = invertGripStrengthScoreToPeakKg(90, MALE_ANCHOR, 'male');
    expect(requiredFor90).not.toBeNull();
    const almostThere = requiredFor90! - 0.05;
    const gap = resolveGripMilestoneRawGap({
      currentPeakKg: almostThere,
      targetScore: 90,
      weightKg: MALE_ANCHOR,
      gender: 'male',
    });
    expect(gap?.delta).toBe(0.1);
  });

  it('returns null when current peak already meets or exceeds required kg', () => {
    const required = invertGripStrengthScoreToPeakKg(70, MALE_ANCHOR, 'male');
    expect(required).not.toBeNull();
    expect(
      resolveGripMilestoneRawGap({
        currentPeakKg: required!,
        targetScore: 70,
        weightKg: MALE_ANCHOR,
        gender: 'male',
      })
    ).toBeNull();
    expect(
      resolveGripMilestoneRawGap({
        currentPeakKg: required! + 2,
        targetScore: 70,
        weightKg: MALE_ANCHOR,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('returns null when current peak is invalid', () => {
    expect(
      resolveGripMilestoneRawGap({
        currentPeakKg: 0,
        targetScore: 70,
        weightKg: MALE_ANCHOR,
        gender: 'male',
      })
    ).toBeNull();
  });
});
