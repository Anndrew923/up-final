import { describe, expect, it } from 'vitest';
import type { ScoreMap } from '../../../types/scoring';
import { SIX_AXIS_COUNT } from '../../../types/scoring';
import {
  calculateSixAxisOverall,
  calculateOverallScore,
  buildSixAxisRadarData,
  clampScoreMapValue,
  radarDisplayScaleMax,
  countCoreSixFilled,
} from '../scoring';

describe('core six dimensions (linear)', () => {
  it('overall is sum(clamped raw) / 6', () => {
    const scores: ScoreMap = {
      strength: 100,
      explosivePower: 100,
      cardio: 100,
      muscleMass: 100,
      bodyFat: 100,
      gripStrength: 100,
    };
    expect(calculateSixAxisOverall(scores)).toBe(100);
    expect(calculateOverallScore(scores)).toBe(calculateSixAxisOverall(scores));
  });

  it('empty map yields 0', () => {
    expect(calculateSixAxisOverall({})).toBe(0);
  });

  it('armSize does not affect overall', () => {
    const base: ScoreMap = {
      strength: 40,
      explosivePower: 40,
      cardio: 40,
      muscleMass: 40,
      bodyFat: 40,
      gripStrength: 40,
    };
    expect(calculateSixAxisOverall(base)).toBe(calculateSixAxisOverall({ ...base, armSize: 99 }));
  });

  it('single non-zero axis: overall = value/6', () => {
    const scores: ScoreMap = {
      strength: 90,
      explosivePower: 0,
      cardio: 0,
      muscleMass: 0,
      bodyFat: 0,
      gripStrength: 0,
    };
    expect(calculateSixAxisOverall(scores)).toBe(15);
  });

  it('radar row values equal clamped raw used in overall', () => {
    const scores: ScoreMap = {
      strength: 72,
      explosivePower: 65,
      cardio: 70,
      muscleMass: 68,
      bodyFat: 60,
      gripStrength: 75,
    };
    const radar = buildSixAxisRadarData(scores);
    expect(radar).toHaveLength(SIX_AXIS_COUNT);
    const mean = radar.reduce((a, p) => a + p.value, 0) / SIX_AXIS_COUNT;
    expect(mean).toBeCloseTo(calculateSixAxisOverall(scores), 2);
  });

  it('radarDisplayScaleMax is at least 100 and respects peaks', () => {
    const pts = [{ value: 40 }, { value: 120 }];
    expect(radarDisplayScaleMax(pts)).toBe(120);
    expect(radarDisplayScaleMax([{ value: 50 }])).toBe(100);
  });

  it('countCoreSixFilled', () => {
    expect(countCoreSixFilled({ strength: 1 })).toBe(1);
    expect(countCoreSixFilled({ armSize: 99 })).toBe(0);
  });

  it('clampScoreMapValue bounds input', () => {
    expect(clampScoreMapValue(150)).toBe(150);
    expect(clampScoreMapValue(250)).toBe(200);
    expect(clampScoreMapValue(-5)).toBe(0);
  });
});
