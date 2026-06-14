import { describe, expect, it } from 'vitest';
import type { PhysicalProfile } from '../../../types/userProfile';
import { buildDynoIntelSupplementalMetrics } from '../buildDynoIntelSupplementalMetrics';

const baseProfile: PhysicalProfile = {
  gender: 'male',
  age: 28,
  heightCm: 175,
  weightKg: 80,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('buildDynoIntelSupplementalMetrics', () => {
  it('includes armSize when stored score is positive', () => {
    const metrics = buildDynoIntelSupplementalMetrics({
      scores: { armSize: 130 },
      profile: baseProfile,
      cardioInputs: null,
      muscleInputs: null,
      powerInputs: null,
      strengthInputs: null,
      gripInputs: null,
    });

    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      metric: 'armSize',
      score: 130,
      tierBandId: 'TIER_130',
    });
    expect(metrics[0].meaningI18nPrefix).toContain('scoreMeaning.bands.armSize');
  });

  it('builds cooper and 5km entries from persisted cardio inputs', () => {
    const metrics = buildDynoIntelSupplementalMetrics({
      scores: {},
      profile: baseProfile,
      cardioInputs: {
        cardio: { distance: 2800 },
        run_5km: { minutes: 22, seconds: 30, totalSeconds: 1350 },
      },
      muscleInputs: null,
      powerInputs: null,
      strengthInputs: null,
      gripInputs: null,
    });

    const ids = metrics.map((m) => m.metric);
    expect(ids).toContain('cooper');
    expect(ids).toContain('5km');
    expect(metrics.find((m) => m.metric === 'cooper')?.score).toBeGreaterThan(0);
    expect(metrics.find((m) => m.metric === '5km')?.score).toBeGreaterThan(0);
  });

  it('returns empty array when no supplemental scores exist', () => {
    const metrics = buildDynoIntelSupplementalMetrics({
      scores: {},
      profile: null,
      cardioInputs: null,
      muscleInputs: null,
      powerInputs: null,
      strengthInputs: null,
      gripInputs: null,
    });

    expect(metrics).toEqual([]);
  });
});
