import { describe, expect, it } from 'vitest';
import {
  formatAerobicDeltaTimeParts,
  resolve5KmMilestoneRawGap,
  resolveCooperMilestoneRawGap,
} from '../aerobicMilestoneGap';
import {
  calculate5KmScore,
  calculateCooperScore,
  getCooperMaxDistanceMetersForGender,
  getRun5KmFloorSecondsForGender,
} from '../cardioScoring';
import { resolveScoreMeaningMilestone } from '../scoreMeaningCatalog';

function preview5Km(totalSeconds: number, gender: 'male' | 'female'): number {
  return calculate5KmScore({ totalSeconds, gender });
}

function previewCooper(
  distanceMeters: number,
  age: number,
  gender: 'male' | 'female'
): number {
  return calculateCooperScore({ distanceMeters, age, gender });
}

describe('resolveCooperMilestoneRawGap', () => {
  it('exposes Δmeters toward the next decade gate', () => {
    const gender = 'male' as const;
    const age = 28;
    const currentDistanceMeters = 1900; // ≈ 70 pts for male 20-29

    const score = previewCooper(currentDistanceMeters, age, gender);
    expect(score).toBe(70);
    const { nextMilestone } = resolveScoreMeaningMilestone('cooper', score);
    expect(nextMilestone).toBe(80);

    const gap = resolveCooperMilestoneRawGap({
      nextMilestoneScore: nextMilestone!,
      currentDistanceMeters,
      age,
      gender,
    });
    expect(gap).not.toBeNull();
    expect(gap!.deltaMeters).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(gap!.deltaMeters)).toBe(true);
    expect(gap!.deltaMeters).toBe(300);

    const nextScore = previewCooper(
      currentDistanceMeters + gap!.deltaMeters,
      age,
      gender
    );
    expect(nextScore).toBeGreaterThanOrEqual(nextMilestone!);
  });

  it('works for female norms', () => {
    const gender = 'female' as const;
    const age = 28;
    const currentDistanceMeters = 1600;

    const score = previewCooper(currentDistanceMeters, age, gender);
    const { nextMilestone } = resolveScoreMeaningMilestone('cooper', score);
    expect(nextMilestone).not.toBeNull();

    const gap = resolveCooperMilestoneRawGap({
      nextMilestoneScore: nextMilestone!,
      currentDistanceMeters,
      age,
      gender,
    });
    expect(gap).not.toBeNull();

    const nextScore = previewCooper(
      currentDistanceMeters + gap!.deltaMeters,
      age,
      gender
    );
    expect(nextScore).toBeGreaterThanOrEqual(nextMilestone!);
  });

  it('returns null when already at or past the gate', () => {
    expect(
      resolveCooperMilestoneRawGap({
        nextMilestoneScore: 70,
        currentDistanceMeters: 1900,
        age: 28,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('returns null when gate exceeds sex distance ceiling', () => {
    expect(
      resolveCooperMilestoneRawGap({
        nextMilestoneScore: 200,
        currentDistanceMeters: 2000,
        age: 28,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('returns null at the model ceiling distance', () => {
    const maxM = getCooperMaxDistanceMetersForGender('male');
    expect(
      resolveCooperMilestoneRawGap({
        nextMilestoneScore: 150,
        currentDistanceMeters: maxM,
        age: 28,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('returns null for ages outside Cooper bands', () => {
    expect(
      resolveCooperMilestoneRawGap({
        nextMilestoneScore: 80,
        currentDistanceMeters: 2000,
        age: 10,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('never under-promises: delta-1 m must stay below the gate when delta > 1', () => {
    const gender = 'male' as const;
    const age = 28;
    const currentDistanceMeters = 2000;
    const score = previewCooper(currentDistanceMeters, age, gender);
    const { nextMilestone } = resolveScoreMeaningMilestone('cooper', score);
    expect(nextMilestone).not.toBeNull();

    const gap = resolveCooperMilestoneRawGap({
      nextMilestoneScore: nextMilestone!,
      currentDistanceMeters,
      age,
      gender,
    });
    expect(gap).not.toBeNull();
    if (gap!.deltaMeters > 1) {
      const under = previewCooper(
        currentDistanceMeters + gap!.deltaMeters - 1,
        age,
        gender
      );
      expect(under).toBeLessThan(nextMilestone!);
    }
  });
});

describe('resolve5KmMilestoneRawGap', () => {
  it('exposes Δseconds faster toward the next decade gate', () => {
    const gender = 'male' as const;
    const currentTimeSeconds = 25 * 60; // 25:00 → exactly 80; next gate is 90

    const score = preview5Km(currentTimeSeconds, gender);
    const { nextMilestone } = resolveScoreMeaningMilestone('cardio', score);
    expect(nextMilestone).not.toBeNull();

    const gap = resolve5KmMilestoneRawGap({
      nextMilestoneScore: nextMilestone!,
      currentTimeSeconds,
      gender,
    });
    expect(gap).not.toBeNull();
    expect(gap!.deltaSeconds).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(gap!.deltaSeconds)).toBe(true);

    const nextScore = preview5Km(currentTimeSeconds - gap!.deltaSeconds, gender);
    expect(nextScore).toBeGreaterThanOrEqual(nextMilestone!);
  });

  it('works for female norms at a mid-pack pace', () => {
    const gender = 'female' as const;
    const currentTimeSeconds = 28 * 60;

    const score = preview5Km(currentTimeSeconds, gender);
    const { nextMilestone } = resolveScoreMeaningMilestone('cardio', score);
    expect(nextMilestone).not.toBeNull();

    const gap = resolve5KmMilestoneRawGap({
      nextMilestoneScore: nextMilestone!,
      currentTimeSeconds,
      gender,
    });
    expect(gap).not.toBeNull();

    const nextScore = preview5Km(currentTimeSeconds - gap!.deltaSeconds, gender);
    expect(nextScore).toBeGreaterThanOrEqual(nextMilestone!);
  });

  it('returns null when already at or past the gate', () => {
    const gender = 'male' as const;
    const currentTimeSeconds = 20 * 60; // 100 pts T100
    const score = preview5Km(currentTimeSeconds, gender);
    expect(score).toBe(100);

    expect(
      resolve5KmMilestoneRawGap({
        nextMilestoneScore: 100,
        currentTimeSeconds,
        gender,
      })
    ).toBeNull();
  });

  it('returns null when gate exceeds WR-floor ceiling', () => {
    expect(
      resolve5KmMilestoneRawGap({
        nextMilestoneScore: 200,
        currentTimeSeconds: 30 * 60,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('returns null for invalid inputs', () => {
    expect(
      resolve5KmMilestoneRawGap({
        nextMilestoneScore: 80,
        currentTimeSeconds: 0,
        gender: 'male',
      })
    ).toBeNull();
    expect(
      resolve5KmMilestoneRawGap({
        nextMilestoneScore: -10,
        currentTimeSeconds: 1800,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('returns null at or under the WR floor (already at model ceiling clock)', () => {
    const floor = getRun5KmFloorSecondsForGender('male');
    expect(
      resolve5KmMilestoneRawGap({
        nextMilestoneScore: 150,
        currentTimeSeconds: floor,
        gender: 'male',
      })
    ).toBeNull();
    expect(
      resolve5KmMilestoneRawGap({
        nextMilestoneScore: 150,
        currentTimeSeconds: floor - 10,
        gender: 'male',
      })
    ).toBeNull();
  });

  it('never under-promises: delta-1 second must stay below the gate when delta > 1', () => {
    const gender = 'male' as const;
    const currentTimeSeconds = 22 * 60 + 30;
    const score = preview5Km(currentTimeSeconds, gender);
    const { nextMilestone } = resolveScoreMeaningMilestone('cardio', score);
    expect(nextMilestone).not.toBeNull();

    const gap = resolve5KmMilestoneRawGap({
      nextMilestoneScore: nextMilestone!,
      currentTimeSeconds,
      gender,
    });
    expect(gap).not.toBeNull();
    if (gap!.deltaSeconds > 1) {
      const under = preview5Km(currentTimeSeconds - (gap!.deltaSeconds - 1), gender);
      expect(under).toBeLessThan(nextMilestone!);
    }
  });
});

describe('formatAerobicDeltaTimeParts', () => {
  it('formats under one minute as seconds-only', () => {
    expect(formatAerobicDeltaTimeParts(45)).toEqual({
      minutes: 0,
      seconds: 45,
      underOneMinute: true,
    });
  });

  it('formats whole minutes without residual seconds', () => {
    expect(formatAerobicDeltaTimeParts(120)).toEqual({
      minutes: 2,
      seconds: 0,
      underOneMinute: false,
    });
  });

  it('formats mixed minutes and seconds', () => {
    expect(formatAerobicDeltaTimeParts(95)).toEqual({
      minutes: 1,
      seconds: 35,
      underOneMinute: false,
    });
  });
});
