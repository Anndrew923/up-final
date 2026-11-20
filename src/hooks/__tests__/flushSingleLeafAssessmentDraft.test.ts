/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  flushAllStrengthLiftDrafts,
  flushCardioDraft,
  flushExplosiveDraft,
  flushGripDraft,
  flushMuscleDraft,
  flushStrengthLiftDraft,
} from '../flushSingleLeafAssessmentDraft';
import {
  loadCardioInputs,
  loadGripInputs,
  loadMuscleInputs,
  loadPowerInputs,
  loadStrengthInputs,
} from '../../services/localStorageService';
import {
  explosiveBranchFlushTab,
  pickHighestExplosiveLeaf,
} from '../../logic/aesthetic/pickHighestExplosiveLeaf';
import { tryComputeExplosiveAssessmentScore } from '../../logic/core/powerScoring';
import type { PhysicalProfile } from '../../types/userProfile';

const memory = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => memory.clear(),
  key: () => null,
  length: 0,
});

describe('flushSingleLeafAssessmentDraft', () => {
  beforeEach(() => {
    memory.clear();
  });

  it('flushes a strength lift into local drafts without touching other lifts', () => {
    flushStrengthLiftDraft({
      lift: 'benchPress',
      weightKg: 140,
      reps: 3,
      bodyWeightKg: 80,
    });
    flushStrengthLiftDraft({
      lift: 'squat',
      weightKg: 180,
      reps: 2,
      bodyWeightKg: 80,
    });
    const saved = loadStrengthInputs();
    expect(saved?.lifts?.benchPress).toEqual({ weightKg: 140, reps: 3 });
    expect(saved?.lifts?.squat).toEqual({ weightKg: 180, reps: 2 });
    expect(saved?.bodyWeightKgSnapshot).toBe(80);
  });

  it('flushes all scored strength lifts in one draft write', () => {
    flushAllStrengthLiftDrafts({
      lifts: [
        { lift: 'benchPress', weightKg: 110, reps: 1 },
        { lift: 'deadlift', weightKg: 160, reps: 2 },
      ],
      bodyWeightKg: 82,
    });
    const saved = loadStrengthInputs();
    expect(saved?.lifts?.benchPress).toEqual({ weightKg: 110, reps: 1 });
    expect(saved?.lifts?.deadlift).toEqual({ weightKg: 160, reps: 2 });
    expect(saved?.bodyWeightKgSnapshot).toBe(82);
  });

  it('flushes grip / muscle / cardio drafts for contextual report open', () => {
    flushGripDraft({ peakKg: 70.5, gender: 'male' });
    expect(loadGripInputs()?.peakKg).toBe(70.5);

    expect(flushMuscleDraft('42.3')).toBe(true);
    expect(loadMuscleInputs()?.muscle?.smmKg).toBe(42.3);

    expect(
      flushCardioDraft({
        tab: 'cooper',
        distanceInput: '2800',
        runMinutesInput: '',
        runSecondsInput: '',
        gender: 'male',
      })
    ).toBe(true);
    expect(loadCardioInputs()?.cardio?.distance).toBe(2800);
  });
});

describe('pickHighestExplosiveLeaf', () => {
  it('returns the highest undiluted branch leaf', () => {
    expect(
      pickHighestExplosiveLeaf({
        verticalJumpRaw: 90,
        standingLongJumpRaw: 110,
        sprintRaw: 80,
        averageRaw: 100,
      })
    ).toBe('explosive.standingLongJump');
  });

  it('uses clamped scores so uncapped sprint overflow cannot beat a full jump', () => {
    expect(
      pickHighestExplosiveLeaf({
        verticalJumpRaw: 200,
        standingLongJumpRaw: null,
        sprintRaw: 700,
        averageRaw: 100,
      })
    ).toBe('explosive.verticalJump');
  });

  it('returns null when no branch is scored', () => {
    expect(
      pickHighestExplosiveLeaf({
        verticalJumpRaw: null,
        standingLongJumpRaw: null,
        sprintRaw: null,
        averageRaw: null,
      })
    ).toBeNull();
  });

  it('maps branch cards to draft flush tabs without sprint100m ids', () => {
    expect(explosiveBranchFlushTab('verticalJump')).toBe('jumps');
    expect(explosiveBranchFlushTab('standingLongJump')).toBe('jumps');
    expect(explosiveBranchFlushTab('sprint')).toBe('sprint');
  });
});

describe('flushExplosiveDraft sprint cap parity', () => {
  const male45: PhysicalProfile = {
    gender: 'male',
    age: 45,
    heightCm: 175,
    weightKg: 75,
    updatedAt: '',
  };

  beforeEach(() => {
    memory.clear();
  });

  it('stores the same floored sprint seconds as tryCompute submit', () => {
    flushExplosiveDraft({
      tab: 'sprint',
      verticalJumpCm: null,
      standingLongJumpCm: null,
      sprintSeconds: 9.58,
      profile: male45,
    });
    const draftSec = loadPowerInputs()?.explosivePower?.sprintSeconds;
    expect(draftSec).toBe(9.8);

    const submit = tryComputeExplosiveAssessmentScore({
      verticalJumpInput: '',
      standingLongJumpInput: '',
      sprintInput: '9.58',
      profile: male45,
      profileReady: true,
    });
    expect(submit.ok).toBe(true);
    if (!submit.ok) return;
    expect(submit.persisted.sprintSeconds).toBe(draftSec);
  });

  it('no-ops when profile is null (never writes uncapped sprint)', () => {
    flushExplosiveDraft({
      tab: 'sprint',
      verticalJumpCm: null,
      standingLongJumpCm: null,
      sprintSeconds: 9.58,
      profile: null,
    });
    expect(loadPowerInputs()?.explosivePower?.sprintSeconds).toBeUndefined();
  });
});
