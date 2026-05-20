import { describe, expect, it } from 'vitest';
import type { CardioInputsPersisted } from '../../../types/cardioInputs';
import type { PhysicalProfile } from '../../../types/userProfile';
import {
  COOPER_MAX_DISTANCE_FEMALE_METERS,
  COOPER_MAX_DISTANCE_MALE_METERS,
  calculate5KmScore,
  calculateCooperScore,
  mergeScoreMapWithResolvedCardio,
  resolveCardioScoreForDisplay,
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
  it('scores above 100 when faster than 20 minutes', () => {
    expect(calculate5KmScore({ totalSeconds: 19 * 60, gender: 'male' })).toBeGreaterThan(100);
  });

  it('scores 100 at exactly 20 minutes', () => {
    expect(calculate5KmScore({ totalSeconds: 20 * 60, gender: 'male' })).toBe(100);
  });

  it('scores 0 at or beyond 45 minutes', () => {
    expect(calculate5KmScore({ totalSeconds: 45 * 60, gender: 'male' })).toBe(0);
    expect(calculate5KmScore({ totalSeconds: 50 * 60, gender: 'male' })).toBe(0);
  });

  it('floors male world-record-faster inputs at 740s while keeping bonus scoring', () => {
    const atFloor = calculate5KmScore({ totalSeconds: 740, gender: 'male' });
    const fasterThanFloor = calculate5KmScore({ totalSeconds: 700, gender: 'male' });
    expect(fasterThanFloor).toBe(atFloor);
    expect(atFloor).toBeGreaterThan(100);
  });

  it('floors female world-record-faster inputs at 825s while keeping bonus scoring', () => {
    const atFloor = calculate5KmScore({ totalSeconds: 825, gender: 'female' });
    const fasterThanFloor = calculate5KmScore({ totalSeconds: 780, gender: 'female' });
    expect(fasterThanFloor).toBe(atFloor);
    expect(atFloor).toBeGreaterThan(100);
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
