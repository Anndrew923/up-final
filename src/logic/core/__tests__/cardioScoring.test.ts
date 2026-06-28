import { describe, expect, it } from 'vitest';
import type { CardioInputsPersisted } from '../../../types/cardioInputs';
import type { PhysicalProfile } from '../../../types/userProfile';
import {
  COOPER_MAX_DISTANCE_FEMALE_METERS,
  COOPER_MAX_DISTANCE_MALE_METERS,
  RUN_5KM_FEMALE,
  RUN_5KM_MALE,
  calculate5KmScore,
  calculateCooperScore,
  mergeScoreMapWithResolvedCardio,
  resolveCardioScoreForDisplay,
  resolveRun5KmNorm,
  run5KmCeilingScore,
  score5KmFromNorm,
  tryComputeCardioAssessmentScore,
  parse5KmFieldSplit,
} from '../cardioScoring';

const maleProfile: PhysicalProfile = {
  gender: 'male',
  age: 25,
  heightCm: 178,
  weightKg: 75,
  updatedAt: new Date().toISOString(),
};

describe('calculateCooperScore', () => {
  it('scores above 60 when distance exceeds the 60-point minimum for 20–29 male', () => {
    const s = calculateCooperScore({
      distanceMeters: 2800,
      age: 25,
      gender: 'male',
    });
    expect(s).toBeGreaterThan(60);
    expect(s).toBeLessThanOrEqual(100);
  });

  it('returns 0 for non-positive distance', () => {
    expect(calculateCooperScore({ distanceMeters: 0, age: 25, gender: 'male' })).toBe(0);
  });

  it(`caps male distance at ${COOPER_MAX_DISTANCE_MALE_METERS} m`, () => {
    const atCap = calculateCooperScore({
      distanceMeters: COOPER_MAX_DISTANCE_MALE_METERS,
      age: 25,
      gender: 'male',
    });
    const beyond = calculateCooperScore({
      distanceMeters: COOPER_MAX_DISTANCE_MALE_METERS + 800,
      age: 25,
      gender: 'male',
    });
    expect(beyond).toBe(atCap);
  });

  it(`caps female distance at ${COOPER_MAX_DISTANCE_FEMALE_METERS} m`, () => {
    const atCap = calculateCooperScore({
      distanceMeters: COOPER_MAX_DISTANCE_FEMALE_METERS,
      age: 25,
      gender: 'female',
    });
    const beyond = calculateCooperScore({
      distanceMeters: COOPER_MAX_DISTANCE_FEMALE_METERS + 500,
      age: 25,
      gender: 'female',
    });
    expect(beyond).toBe(atCap);
  });
});

describe('calculate5KmScore', () => {
  describe('male norms', () => {
    it('scores 100 at exactly 20 minutes', () => {
      expect(calculate5KmScore({ totalSeconds: 20 * 60, gender: 'male' })).toBe(100);
    });

    it('scores 0 at or beyond 45 minutes', () => {
      expect(calculate5KmScore({ totalSeconds: 45 * 60, gender: 'male' })).toBe(0);
      expect(calculate5KmScore({ totalSeconds: 50 * 60, gender: 'male' })).toBe(0);
    });

    it('scores above 100 when faster than 20 minutes', () => {
      expect(calculate5KmScore({ totalSeconds: 19 * 60, gender: 'male' })).toBeGreaterThan(100);
    });

    it('floors world-record-faster inputs at 740s (ceiling 146)', () => {
      expect(calculate5KmScore({ totalSeconds: 740, gender: 'male' })).toBe(
        run5KmCeilingScore(RUN_5KM_MALE)
      );
      expect(calculate5KmScore({ totalSeconds: 700, gender: 'male' })).toBe(
        run5KmCeilingScore(RUN_5KM_MALE)
      );
    });
  });

  describe('female norms (decoupled anchors)', () => {
    it('scores 100 at exactly 22:30', () => {
      expect(calculate5KmScore({ totalSeconds: RUN_5KM_FEMALE.t100Seconds, gender: 'female' })).toBe(
        100
      );
    });

    it('scores 0 at or beyond 50 minutes', () => {
      expect(calculate5KmScore({ totalSeconds: RUN_5KM_FEMALE.t0Seconds, gender: 'female' })).toBe(
        0
      );
      expect(calculate5KmScore({ totalSeconds: 55 * 60, gender: 'female' })).toBe(0);
    });

    it('scores 115 at 20:00 (elite overflow vs male 100-pt anchor)', () => {
      expect(calculate5KmScore({ totalSeconds: 20 * 60, gender: 'female' })).toBe(115);
    });

    it('floors world-record-faster inputs at 825s (ceiling 152.5)', () => {
      expect(calculate5KmScore({ totalSeconds: 825, gender: 'female' })).toBe(
        run5KmCeilingScore(RUN_5KM_FEMALE)
      );
      expect(calculate5KmScore({ totalSeconds: 780, gender: 'female' })).toBe(
        run5KmCeilingScore(RUN_5KM_FEMALE)
      );
      expect(run5KmCeilingScore(RUN_5KM_FEMALE)).toBe(152.5);
    });

    it('still scores above zero at 45:00 (decoupled T0 is 50:00)', () => {
      expect(calculate5KmScore({ totalSeconds: 45 * 60, gender: 'female' })).toBe(18.18);
    });

    it('scores higher than male at same 25:00 wall-clock time', () => {
      const male = calculate5KmScore({ totalSeconds: 25 * 60, gender: 'male' });
      const female = calculate5KmScore({ totalSeconds: 25 * 60, gender: 'female' });
      expect(male).toBe(80);
      expect(female).toBeCloseTo(90.91, 2);
      expect(female).toBeGreaterThan(male);
    });
  });

  describe('gender fallback', () => {
    it('defaults to male norms when gender is missing', () => {
      expect(calculate5KmScore({ totalSeconds: 20 * 60 })).toBe(100);
      expect(calculate5KmScore({ totalSeconds: 45 * 60 })).toBe(0);
      expect(calculate5KmScore({ totalSeconds: 740 })).toBe(146);
    });

    it('resolveRun5KmNorm maps unknown gender to male', () => {
      expect(resolveRun5KmNorm(undefined)).toEqual(RUN_5KM_MALE);
      expect(resolveRun5KmNorm('female')).toEqual(RUN_5KM_FEMALE);
    });
  });

  it('score5KmFromNorm matches calculate5KmScore at checkpoints', () => {
    expect(score5KmFromNorm(1200, RUN_5KM_MALE)).toBe(100);
    expect(score5KmFromNorm(1350, RUN_5KM_FEMALE)).toBe(100);
    expect(score5KmFromNorm(825, RUN_5KM_FEMALE)).toBe(run5KmCeilingScore(RUN_5KM_FEMALE));
    expect(score5KmFromNorm(0, RUN_5KM_MALE)).toBe(0);
    expect(score5KmFromNorm(-10, RUN_5KM_FEMALE)).toBe(0);
  });
});

describe('resolveCardioScoreForDisplay', () => {
  it('applies Cooper distance cap when resolving from stored inputs', () => {
    const inputs: CardioInputsPersisted = {
      cardio: { distance: COOPER_MAX_DISTANCE_MALE_METERS + 1000 },
    };
    const capped = resolveCardioScoreForDisplay(maleProfile, inputs);
    const expected = calculateCooperScore({
      distanceMeters: COOPER_MAX_DISTANCE_MALE_METERS,
      age: maleProfile.age,
      gender: maleProfile.gender,
    });
    expect(capped).toBe(expected);
  });

  it('prefers Cooper when distance and profile are valid', () => {
    const inputs: CardioInputsPersisted = {
      cardio: { distance: 2600 },
      run_5km: { totalSeconds: 25 * 60 },
    };
    const c = resolveCardioScoreForDisplay(maleProfile, inputs);
    const only5k = calculate5KmScore({ totalSeconds: 25 * 60, gender: maleProfile.gender });
    const onlyCooper = calculateCooperScore({
      distanceMeters: 2600,
      age: maleProfile.age,
      gender: maleProfile.gender,
    });
    expect(c).toBe(onlyCooper);
    expect(onlyCooper).not.toBe(only5k);
    expect(c).not.toBe(only5k);
  });

  it('falls back to 5 km when Cooper distance missing', () => {
    const inputs: CardioInputsPersisted = {
      run_5km: { totalSeconds: 30 * 60 },
    };
    expect(resolveCardioScoreForDisplay(maleProfile, inputs)).toBe(
      calculate5KmScore({ totalSeconds: 30 * 60, gender: maleProfile.gender })
    );
  });

  it('resolves female 5 km with decoupled norms', () => {
    const femaleProfile: PhysicalProfile = {
      gender: 'female',
      age: 28,
      heightCm: 165,
      weightKg: 58,
      updatedAt: '',
    };
    const inputs: CardioInputsPersisted = {
      run_5km: { totalSeconds: 20 * 60 },
    };
    expect(resolveCardioScoreForDisplay(femaleProfile, inputs)).toBe(115);
  });
});

describe('parse5KmFieldSplit', () => {
  it('returns total seconds from minutes and seconds', () => {
    expect(parse5KmFieldSplit('24', '30')).toEqual({
      minutes: 24,
      seconds: 30,
      totalSeconds: 24 * 60 + 30,
    });
  });

  it('returns null for non-positive total', () => {
    expect(parse5KmFieldSplit('0', '0')).toBeNull();
  });
});

describe('tryComputeCardioAssessmentScore', () => {
  it('requires profile for Cooper', () => {
    const r = tryComputeCardioAssessmentScore({
      tab: 'cooper',
      distanceInput: '2600',
      runMinutesInput: '',
      runSecondsInput: '',
      profile: null,
      profileReady: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('missing-profile-cooper');
  });

  it('computes 5 km without full profile when time is valid', () => {
    const r = tryComputeCardioAssessmentScore({
      tab: '5km',
      distanceInput: '',
      runMinutesInput: '25',
      runSecondsInput: '0',
      profile: null,
      profileReady: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.score).toBe(calculate5KmScore({ totalSeconds: 25 * 60, gender: 'male' }));
  });

  it('uses female norms when profile sex is female on 5 km tab', () => {
    const femaleProfile: PhysicalProfile = {
      gender: 'female',
      age: 28,
      heightCm: 165,
      weightKg: 58,
      updatedAt: '',
    };
    const r = tryComputeCardioAssessmentScore({
      tab: '5km',
      distanceInput: '',
      runMinutesInput: '22',
      runSecondsInput: '30',
      profile: femaleProfile,
      profileReady: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.score).toBe(100);
  });
});

describe('mergeScoreMapWithResolvedCardio', () => {
  it('overrides stored cardio when inputs resolve', () => {
    const merged = mergeScoreMapWithResolvedCardio({ cardio: 10, strength: 50 }, maleProfile, {
      cardio: { distance: 2800 },
    });
    expect(merged.strength).toBe(50);
    expect(merged.cardio).toBeGreaterThan(10);
  });

  it('keeps stored scores when no cardio inputs resolve', () => {
    const merged = mergeScoreMapWithResolvedCardio({ cardio: 77 }, maleProfile, null);
    expect(merged.cardio).toBe(77);
  });
});
