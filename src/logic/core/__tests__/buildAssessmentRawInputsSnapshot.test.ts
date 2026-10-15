import { describe, expect, it } from 'vitest';
import { buildAssessmentRawInputsSnapshot } from '../buildAssessmentRawInputsSnapshot';
import type { PhysicalProfile } from '../../../types/userProfile';

const profile: PhysicalProfile = {
  gender: 'male',
  age: 28,
  heightCm: 178,
  weightKg: 82,
  updatedAt: '2026-10-15T00:00:00.000Z',
};

describe('buildAssessmentRawInputsSnapshot', () => {
  it('returns undefined when all sources are empty', () => {
    expect(buildAssessmentRawInputsSnapshot({})).toBeUndefined();
    expect(
      buildAssessmentRawInputsSnapshot({
        strengthInputs: null,
        powerInputs: null,
        cardioInputs: null,
        muscleInputs: null,
        gripInputs: null,
        armSizeInputs: null,
        ffmiDraft: null,
        physicalProfile: null,
      })
    ).toBeUndefined();
    expect(buildAssessmentRawInputsSnapshot({ strengthInputs: {} })).toBeUndefined();
    expect(buildAssessmentRawInputsSnapshot({ ffmiDraft: { bodyFatPctInput: '' } })).toBeUndefined();
    expect(
      buildAssessmentRawInputsSnapshot({ ffmiDraft: { bodyFatPctInput: '2' } })
    ).toBeUndefined();
  });

  it('packs partial axis inputs without requiring every module', () => {
    const snap = buildAssessmentRawInputsSnapshot({
      gripInputs: { peakKg: 55, genderSnapshot: 'male' },
      cardioInputs: { cardio: { distance: 2800 } },
      ffmiDraft: { bodyFatPctInput: '12,5' },
    });
    expect(snap).toEqual({
      schemaVersion: 1,
      grip: { peakKg: 55, genderSnapshot: 'male' },
      cardio: { cardio: { distance: 2800 } },
      ffmi: { bodyFatPct: 12.5 },
    });
    expect(snap?.strength).toBeUndefined();
    expect(snap?.physicalProfileSnapshot).toBeUndefined();
  });

  it('packs a full multi-axis snapshot with physical profile', () => {
    const snap = buildAssessmentRawInputsSnapshot({
      physicalProfile: profile,
      strengthInputs: {
        lifts: { benchPress: { weightKg: 100, reps: 5 } },
        bodyWeightKgSnapshot: 82,
      },
      powerInputs: {
        explosivePower: { verticalJumpCm: 60, standingLongJumpCm: 250, sprintSeconds: 11.2 },
      },
      cardioInputs: {
        cardio: { distance: 3000 },
        run_5km: { minutes: 22, seconds: 30, totalSeconds: 1350, paceInSeconds: 270 },
      },
      muscleInputs: { muscle: { smmKg: 38.5 } },
      gripInputs: { peakKg: 62 },
      armSizeInputs: { armCircumferenceCm: 41, bodyFatPct: 12 },
      ffmiDraft: { bodyFatPctInput: '12' },
    });

    expect(snap).toEqual({
      schemaVersion: 1,
      physicalProfileSnapshot: {
        gender: 'male',
        age: 28,
        heightCm: 178,
        weightKg: 82,
      },
      strength: {
        lifts: { benchPress: { weightKg: 100, reps: 5 } },
        bodyWeightKgSnapshot: 82,
      },
      power: {
        explosivePower: { verticalJumpCm: 60, standingLongJumpCm: 250, sprintSeconds: 11.2 },
      },
      cardio: {
        cardio: { distance: 3000 },
        run_5km: { minutes: 22, seconds: 30, totalSeconds: 1350, paceInSeconds: 270 },
      },
      muscle: { muscle: { smmKg: 38.5 } },
      grip: { peakKg: 62 },
      armSize: { armCircumferenceCm: 41, bodyFatPct: 12 },
      ffmi: { bodyFatPct: 12 },
    });
  });

  it('deep-clones nested persist trees so live draft mutation cannot rewrite archives', () => {
    const lifts = { benchPress: { weightKg: 100, reps: 5 } };
    const strengthInputs = { lifts };
    const snap = buildAssessmentRawInputsSnapshot({ strengthInputs });
    expect(snap?.strength).toEqual(strengthInputs);
    expect(snap?.strength).not.toBe(strengthInputs);
    expect(snap?.strength?.lifts).not.toBe(lifts);
    lifts.benchPress.weightKg = 999;
    expect(snap?.strength?.lifts?.benchPress?.weightKg).toBe(100);
  });

  it('includes physical profile alone when no axis drafts exist', () => {
    expect(buildAssessmentRawInputsSnapshot({ physicalProfile: profile })).toEqual({
      schemaVersion: 1,
      physicalProfileSnapshot: {
        gender: 'male',
        age: 28,
        heightCm: 178,
        weightKg: 82,
      },
    });
  });
});
