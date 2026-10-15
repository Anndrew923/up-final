import { describe, expect, it } from 'vitest';
import type { AssessmentRawInputsV1 } from '../../../types/assessmentRawInputs';
import {
  buildHistoryRawTelemetryViewModel,
  formatClockMmSs,
} from '../historyRawTelemetryViewModel';
import { calculateOneRmBrzycki } from '../trainingTools';

const FULL_RAW: AssessmentRawInputsV1 = {
  schemaVersion: 1,
  physicalProfileSnapshot: {
    gender: 'male',
    age: 28,
    heightCm: 178,
    weightKg: 82,
  },
  strength: {
    lifts: {
      benchPress: { weightKg: 100, reps: 5 },
      squat: { weightKg: 140, reps: 3 },
      deadlift: { weightKg: 180, reps: 2 },
      latPulldown: { weightKg: 80, reps: 8 },
      shoulderPress: { weightKg: 60, reps: 6 },
    },
  },
  power: {
    explosivePower: {
      verticalJumpCm: 55,
      standingLongJumpCm: 250,
      sprintSeconds: 11.4,
    },
  },
  cardio: {
    cardio: { distance: 2800 },
    run_5km: { minutes: 22, seconds: 30, totalSeconds: 1350, paceInSeconds: 270 },
  },
  muscle: { muscle: { smmKg: 38.5 } },
  grip: { peakKg: 62 },
  armSize: { armCircumferenceCm: 41, bodyFatPct: 12 },
  ffmi: { bodyFatPct: 12 },
};

describe('buildHistoryRawTelemetryViewModel', () => {
  it('downgrades missing rawInputs to scores-only', () => {
    expect(buildHistoryRawTelemetryViewModel(undefined)).toEqual({
      hasRawArchive: false,
      hasDisplayableTelemetry: false,
      strengthLifts: [],
      power: null,
      cardio: null,
      physique: null,
      gripPeakKg: null,
    });
  });

  it('marks archive present but empty when raw blob has no measurable fields', () => {
    expect(buildHistoryRawTelemetryViewModel({ schemaVersion: 1 })).toEqual({
      hasRawArchive: true,
      hasDisplayableTelemetry: false,
      strengthLifts: [],
      power: null,
      cardio: null,
      physique: null,
      gripPeakKg: null,
    });
  });

  it('projects partial raw (grip + cooper only)', () => {
    const model = buildHistoryRawTelemetryViewModel({
      schemaVersion: 1,
      grip: { peakKg: 48 },
      cardio: { cardio: { distance: 2600 } },
    });
    expect(model.hasRawArchive).toBe(true);
    expect(model.hasDisplayableTelemetry).toBe(true);
    expect(model.gripPeakKg).toBe(48);
    expect(model.cardio).toEqual({ cooperDistanceM: 2600 });
    expect(model.strengthLifts).toEqual([]);
    expect(model.power).toBeNull();
  });

  it('projects full raw with Brzycki 1RM for strength lifts', () => {
    const model = buildHistoryRawTelemetryViewModel(FULL_RAW);
    expect(model.hasDisplayableTelemetry).toBe(true);
    expect(model.strengthLifts).toHaveLength(5);
    expect(model.strengthLifts[0]).toEqual({
      liftKey: 'benchPress',
      weightKg: 100,
      reps: 5,
      oneRmKg: calculateOneRmBrzycki(100, 5),
    });
    expect(model.power).toEqual({
      verticalJumpCm: 55,
      standingLongJumpCm: 250,
      sprintSeconds: 11.4,
    });
    expect(model.cardio?.cooperDistanceM).toBe(2800);
    expect(model.cardio?.run5Km?.totalSeconds).toBe(1350);
    expect(model.physique).toMatchObject({
      bodyFatPct: 12,
      smmKg: 38.5,
      armCircumferenceCm: 41,
      heightCm: 178,
      weightKg: 82,
    });
    expect(model.gripPeakKg).toBe(62);
  });
});

describe('formatClockMmSs', () => {
  it('formats total seconds as m:ss', () => {
    expect(formatClockMmSs(1350)).toBe('22:30');
    expect(formatClockMmSs(65)).toBe('1:05');
    expect(formatClockMmSs(0)).toBe('0:00');
  });
});
