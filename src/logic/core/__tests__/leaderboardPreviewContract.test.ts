import { describe, expect, it } from 'vitest';
import {
  buildFullRadarScoresMapForFirestore,
  buildPositivePreviewRadarFromMergedScores,
  countPreviewRadarAxesFilled,
  isPreviewRadarComplete,
  resolvePreviewRadarMetric,
} from '../leaderboardPreviewContract';

describe('leaderboardPreviewContract', () => {
  it('maps shard metrics to preview radar axes', () => {
    expect(resolvePreviewRadarMetric('strength_totalFive')).toBe('strength');
    expect(resolvePreviewRadarMetric('cardio_5km')).toBe('cardio');
    expect(resolvePreviewRadarMetric('explosive_composite')).toBe('explosivePower');
    expect(resolvePreviewRadarMetric('bodyFat_ffmi')).toBe('bodyFat');
    expect(resolvePreviewRadarMetric('gripStrength')).toBe('gripStrength');
    expect(resolvePreviewRadarMetric('armSize')).toBeNull();
  });

  it('counts filled axes and completion', () => {
    expect(countPreviewRadarAxesFilled({ strength: 10 })).toBe(1);
    expect(isPreviewRadarComplete({ strength: 1, explosivePower: 1, cardio: 1, muscleMass: 1, bodyFat: 1, gripStrength: 1 })).toBe(true);
    expect(isPreviewRadarComplete({ strength: 1 })).toBe(false);
    expect(countPreviewRadarAxesFilled({ strength: 0 })).toBe(0);
  });

  it('buildFullRadarScoresMapForFirestore includes all six axes clamped', () => {
    const full = buildFullRadarScoresMapForFirestore({
      strength: 50,
      cardio: 0,
      explosivePower: 12,
      muscleMass: undefined,
      bodyFat: 101,
      gripStrength: 3,
    });
    expect(full.strength).toBe(50);
    expect(full.cardio).toBe(0);
    expect(full.explosivePower).toBe(12);
    expect(full.muscleMass).toBe(0);
    expect(full.bodyFat).toBe(101);
    expect(full.gripStrength).toBe(3);
  });

  it('builds positive-only radar snapshot from merged scores', () => {
    const snap = buildPositivePreviewRadarFromMergedScores({
      strength: 50,
      cardio: 0,
      explosivePower: 12,
      muscleMass: undefined,
      bodyFat: 101,
      gripStrength: 3,
    });
    expect(snap.strength).toBe(50);
    expect(snap.cardio).toBeUndefined();
    expect(snap.explosivePower).toBe(12);
    expect(snap.muscleMass).toBeUndefined();
    expect(snap.bodyFat).toBe(101);
    expect(snap.gripStrength).toBe(3);
  });
});
