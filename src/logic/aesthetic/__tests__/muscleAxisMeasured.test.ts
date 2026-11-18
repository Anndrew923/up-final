import { describe, expect, it } from 'vitest';
import {
  formatMuscleAxisMeasuredReading,
  isValidMuscleAxisMeasured,
} from '../muscleAxisMeasured';

const LABELS = { kg: 'kg', lb: 'lb' };

describe('isValidMuscleAxisMeasured', () => {
  it('accepts positive finite dual metrics', () => {
    expect(isValidMuscleAxisMeasured({ smmKg: 32.5, smPercent: 42.1 })).toBe(true);
  });

  it('rejects missing or non-positive values', () => {
    expect(isValidMuscleAxisMeasured(undefined)).toBe(false);
    expect(isValidMuscleAxisMeasured({ smmKg: 0, smPercent: 42 })).toBe(false);
    expect(isValidMuscleAxisMeasured({ smmKg: 32, smPercent: 0 })).toBe(false);
    expect(isValidMuscleAxisMeasured({ smmKg: NaN, smPercent: 42 })).toBe(false);
  });
});

describe('formatMuscleAxisMeasuredReading', () => {
  it('formats metric kg + percent', () => {
    expect(
      formatMuscleAxisMeasuredReading({ smmKg: 32.5, smPercent: 42.14 }, 'metric', LABELS)
    ).toBe('32.5 kg · 42.1%');
  });

  it('formats imperial lb + percent', () => {
    expect(
      formatMuscleAxisMeasuredReading({ smmKg: 32.5, smPercent: 42.14 }, 'imperial', LABELS)
    ).toBe('71.7 lb · 42.1%');
  });
});
