import { describe, expect, it } from 'vitest';
import {
  ARM_SIZE_BASE_BODY_FAT_PCT_FEMALE,
  ARM_SIZE_BASE_BODY_FAT_PCT_MALE,
  ARM_SIZE_BENCHMARK_CM_FEMALE,
  ARM_SIZE_BENCHMARK_CM_MALE,
  ARM_SIZE_BODY_FAT_MAX_PCT,
  ARM_SIZE_BODY_FAT_MIN_PCT,
  ARM_SIZE_MAX_CM,
  evaluateArmSizeScore,
  resolveArmSizeNorm,
} from '../armSizeScoring';

describe('armSizeScoring', () => {
  it('returns null for invalid arm or non-numeric arm', () => {
    expect(evaluateArmSizeScore({ armCircumferenceCm: 0, bodyFatPct: 20 })).toBeNull();
    expect(evaluateArmSizeScore({ armCircumferenceCm: Number.NaN, bodyFatPct: 20 })).toBeNull();
    expect(evaluateArmSizeScore({ armCircumferenceCm: 70.1, bodyFatPct: 20 })).toBeNull();
    expect(evaluateArmSizeScore({ armCircumferenceCm: 71, bodyFatPct: 20 })).toBeNull();
  });

  it('returns null when body fat outside 3–50%', () => {
    expect(evaluateArmSizeScore({ armCircumferenceCm: 40, bodyFatPct: 2 })).toBeNull();
    expect(evaluateArmSizeScore({ armCircumferenceCm: 40, bodyFatPct: 51 })).toBeNull();
    expect(evaluateArmSizeScore({ armCircumferenceCm: 40, bodyFatPct: 0 })).toBeNull();
  });

  it('accepts boundary arm 70 and body fat 3 / 50', () => {
    expect(evaluateArmSizeScore({ armCircumferenceCm: 70, bodyFatPct: 3 })).not.toBeNull();
    expect(evaluateArmSizeScore({ armCircumferenceCm: 70, bodyFatPct: 50 })).not.toBeNull();
    expect(evaluateArmSizeScore({ armCircumferenceCm: 1, bodyFatPct: 20 })).not.toBeNull();
  });

  describe('male norms', () => {
    it('preserves legacy male formula with two-decimal rounding', () => {
      const result = evaluateArmSizeScore({
        armCircumferenceCm: 42,
        bodyFatPct: 18,
        gender: 'male',
      });
      expect(result).not.toBeNull();
      expect(result?.rawScore).toBe(85.68);
      expect(result?.submittedScore).toBe(85.68);
      expect(result?.limitedByAxisCap).toBe(false);
    });

    it('higher body fat lowers score at fixed arm circumference', () => {
      const lowFat = evaluateArmSizeScore({ armCircumferenceCm: 45, bodyFatPct: 12, gender: 'male' });
      const highFat = evaluateArmSizeScore({ armCircumferenceCm: 45, bodyFatPct: 28, gender: 'male' });
      expect(lowFat).not.toBeNull();
      expect(highFat).not.toBeNull();
      expect((lowFat?.rawScore ?? 0) > (highFat?.rawScore ?? 0)).toBe(true);
    });

    it('max valid male inputs stay under global axis ceiling (200)', () => {
      const result = evaluateArmSizeScore({
        armCircumferenceCm: ARM_SIZE_MAX_CM,
        bodyFatPct: ARM_SIZE_BODY_FAT_MIN_PCT,
        gender: 'male',
      });
      expect(result).not.toBeNull();
      expect(result!.rawScore).toBe(163.8);
      expect(result!.submittedScore).toBeLessThanOrEqual(200);
      expect(result!.limitedByAxisCap).toBe(false);
    });

    it('anchors 100 at 50 cm / 20% body fat', () => {
      const result = evaluateArmSizeScore({
        armCircumferenceCm: ARM_SIZE_BENCHMARK_CM_MALE,
        bodyFatPct: ARM_SIZE_BASE_BODY_FAT_PCT_MALE,
        gender: 'male',
      });
      expect(result?.rawScore).toBe(100);
      expect(result?.submittedScore).toBe(100);
    });
  });

  describe('female norms (decoupled aesthetics)', () => {
    it('anchors 100 at 35 cm / 18% body fat', () => {
      const result = evaluateArmSizeScore({
        armCircumferenceCm: ARM_SIZE_BENCHMARK_CM_FEMALE,
        bodyFatPct: ARM_SIZE_BASE_BODY_FAT_PCT_FEMALE,
        gender: 'female',
      });
      expect(result?.rawScore).toBe(100);
      expect(result?.submittedScore).toBe(100);
    });

    it('scores lean elite 33 cm / 13% at 99.00', () => {
      const result = evaluateArmSizeScore({
        armCircumferenceCm: 33,
        bodyFatPct: 13,
        gender: 'female',
      });
      expect(result?.rawScore).toBe(99);
      expect(result?.submittedScore).toBe(99);
    });

    it('scores hard-training 30 cm / 18% at 85.71', () => {
      const result = evaluateArmSizeScore({
        armCircumferenceCm: 30,
        bodyFatPct: 18,
        gender: 'female',
      });
      expect(result?.rawScore).toBe(85.71);
    });

    it('scores higher than male norm for same 33 cm / 13%', () => {
      const female = evaluateArmSizeScore({ armCircumferenceCm: 33, bodyFatPct: 13, gender: 'female' });
      const male = evaluateArmSizeScore({ armCircumferenceCm: 33, bodyFatPct: 13, gender: 'male' });
      expect(female?.rawScore).toBe(99);
      expect(male?.rawScore).toBe(70.62);
      expect((female?.rawScore ?? 0) > (male?.rawScore ?? 0)).toBe(true);
    });

    it('caps max female inputs at axis ceiling 200', () => {
      const result = evaluateArmSizeScore({
        armCircumferenceCm: ARM_SIZE_MAX_CM,
        bodyFatPct: ARM_SIZE_BODY_FAT_MIN_PCT,
        gender: 'female',
      });
      expect(result).not.toBeNull();
      expect(result!.rawScore).toBe(230);
      expect(result!.submittedScore).toBe(200);
      expect(result!.limitedByAxisCap).toBe(true);
    });
  });

  describe('gender fallback', () => {
    it('defaults to male norms when gender is missing', () => {
      const withGender = evaluateArmSizeScore({
        armCircumferenceCm: 50,
        bodyFatPct: 20,
        gender: 'male',
      });
      const undefinedGender = evaluateArmSizeScore({
        armCircumferenceCm: 50,
        bodyFatPct: 20,
      });
      expect(undefinedGender?.rawScore).toBe(100);
      expect(undefinedGender?.rawScore).toBe(withGender?.rawScore);
    });

    it('resolveArmSizeNorm maps female and unknown gender', () => {
      expect(resolveArmSizeNorm('female').benchmarkCm).toBe(ARM_SIZE_BENCHMARK_CM_FEMALE);
      expect(resolveArmSizeNorm(undefined).benchmarkCm).toBe(ARM_SIZE_BENCHMARK_CM_MALE);
    });
  });

  it('documents product input bounds as exported constants', () => {
    expect(ARM_SIZE_MAX_CM).toBe(70);
    expect(ARM_SIZE_BODY_FAT_MIN_PCT).toBe(3);
    expect(ARM_SIZE_BODY_FAT_MAX_PCT).toBe(50);
  });
});
