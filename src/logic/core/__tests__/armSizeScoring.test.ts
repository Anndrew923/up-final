import { describe, expect, it } from 'vitest';
import {
  ARM_SIZE_BASE_BODY_FAT_PCT,
  ARM_SIZE_BENCHMARK_CM,
  ARM_SIZE_BODY_FAT_MAX_PCT,
  ARM_SIZE_BODY_FAT_MIN_PCT,
  ARM_SIZE_MAX_CM,
  evaluateArmSizeScore,
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

  it('preserves legacy formula with two-decimal rounding', () => {
    const result = evaluateArmSizeScore({ armCircumferenceCm: 42, bodyFatPct: 18 });
    expect(result).not.toBeNull();
    expect(result?.rawScore).toBe(85.68);
    expect(result?.submittedScore).toBe(85.68);
    expect(result?.limitedByAxisCap).toBe(false);
  });

  it('higher body fat lowers score at fixed arm circumference', () => {
    const lowFat = evaluateArmSizeScore({ armCircumferenceCm: 45, bodyFatPct: 12 });
    const highFat = evaluateArmSizeScore({ armCircumferenceCm: 45, bodyFatPct: 28 });
    expect(lowFat).not.toBeNull();
    expect(highFat).not.toBeNull();
    expect((lowFat?.rawScore ?? 0) > (highFat?.rawScore ?? 0)).toBe(true);
  });

  it('max valid inputs stay under global axis ceiling (200)', () => {
    const result = evaluateArmSizeScore({ armCircumferenceCm: ARM_SIZE_MAX_CM, bodyFatPct: ARM_SIZE_BODY_FAT_MIN_PCT });
    expect(result).not.toBeNull();
    expect(result!.submittedScore).toBeLessThanOrEqual(200);
    expect(result!.limitedByAxisCap).toBe(false);
  });

  it('base constants keep neutral score at 50 cm / 20%', () => {
    const result = evaluateArmSizeScore({
      armCircumferenceCm: ARM_SIZE_BENCHMARK_CM,
      bodyFatPct: ARM_SIZE_BASE_BODY_FAT_PCT,
    });
    expect(result?.rawScore).toBe(100);
    expect(result?.submittedScore).toBe(100);
  });

  it('documents product input bounds as exported constants', () => {
    expect(ARM_SIZE_MAX_CM).toBe(70);
    expect(ARM_SIZE_BODY_FAT_MIN_PCT).toBe(3);
    expect(ARM_SIZE_BODY_FAT_MAX_PCT).toBe(50);
  });
});
