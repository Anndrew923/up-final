import { describe, expect, it } from 'vitest';
import { SCORE_AXIS_MAX } from '../scoring';
import {
  FFMI_HUMAN_CAP_FEMALE,
  FFMI_HUMAN_CAP_MALE,
  evaluateFfmiScoring,
  computeAdjustedFfmi,
  parseFfmiBodyFatPctInput,
} from '../ffmiScoring';

describe('evaluateFfmiScoring', () => {
  it('blocks radar submit when male FFMI exceeds world-record anchor but keeps capped breakdown fields', () => {
    const r = evaluateFfmiScoring({
      gender: 'male',
      heightCm: 160,
      weightKg: 100,
      bodyFatPct: 1,
    });
    expect(r.rawAdjustedFfmi).toBeGreaterThan(FFMI_HUMAN_CAP_MALE);
    expect(r.cappedAdjustedFfmi).toBe(FFMI_HUMAN_CAP_MALE);
    expect(r.submittedScore).toBe(165);
    expect(r.uncappedScore).toBeGreaterThan(165);
    expect(r.submittedScore).toBeLessThanOrEqual(SCORE_AXIS_MAX);
    expect(r.limitedByHumanCap).toBe(true);
    expect(r.allowsRadarSubmit).toBe(false);
  });

  it('blocks radar submit when female FFMI exceeds world-record anchor', () => {
    const r = evaluateFfmiScoring({
      gender: 'female',
      heightCm: 150,
      weightKg: 75,
      bodyFatPct: 6,
    });
    expect(r.rawAdjustedFfmi).toBeGreaterThan(FFMI_HUMAN_CAP_FEMALE);
    expect(r.cappedAdjustedFfmi).toBe(FFMI_HUMAN_CAP_FEMALE);
    expect(r.submittedScore).toBe(145);
    expect(r.uncappedScore).toBeGreaterThan(145);
    expect(r.submittedScore).toBeLessThanOrEqual(SCORE_AXIS_MAX);
    expect(r.limitedByHumanCap).toBe(true);
    expect(r.allowsRadarSubmit).toBe(false);
  });

  it('allows radar submit when FFMI is at or below physiological ceiling', () => {
    const r = evaluateFfmiScoring({
      gender: 'male',
      heightCm: 175,
      weightKg: 75,
      bodyFatPct: 15,
    });
    expect(r.rawAdjustedFfmi).toBeLessThanOrEqual(FFMI_HUMAN_CAP_MALE);
    expect(r.limitedByHumanCap).toBe(false);
    expect(r.allowsRadarSubmit).toBe(true);
    expect(r.submittedScore).toBe(r.uncappedScore);
  });
});

describe('computeAdjustedFfmi', () => {
  it('returns 0 for invalid geometry', () => {
    expect(computeAdjustedFfmi(0, 80, 15)).toBe(0);
    expect(computeAdjustedFfmi(1.75, 0, 15)).toBe(0);
  });

  it('adds 6*(heightM-1.8) when height exceeds 1.8 m', () => {
    const heightM = 1.9;
    const weightKg = 100;
    const bodyFatPct = 15;
    const ffm = weightKg * (1 - bodyFatPct / 100);
    const raw = ffm / (heightM * heightM);
    const unrounded = raw + 6 * (heightM - 1.8);
    const adjusted = computeAdjustedFfmi(heightM, weightKg, bodyFatPct);
    expect(adjusted).toBeCloseTo(Math.round(unrounded * 100) / 100, 5);
  });
});

describe('parseFfmiBodyFatPctInput', () => {
  it('returns null for empty or out-of-band values', () => {
    expect(parseFfmiBodyFatPctInput('')).toBeNull();
    expect(parseFfmiBodyFatPctInput('  ')).toBeNull();
    expect(parseFfmiBodyFatPctInput('2')).toBeNull();
    expect(parseFfmiBodyFatPctInput('61')).toBeNull();
  });

  it('accepts comma decimal and in-range percent', () => {
    expect(parseFfmiBodyFatPctInput('15,5')).toBe(15.5);
    expect(parseFfmiBodyFatPctInput('12')).toBe(12);
  });
});
