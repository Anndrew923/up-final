/**
 * Cardio assessment scoring — Cooper 12-minute run + 5 km time trial.
 * Cooper norms match reference-app-fitness; 5 km uses sex-decoupled T0/T100 anchors with
 * 4th-power overflow above T100 (see RUN_5KM_OVERFLOW_*).
 */
import type { CardioInputsPersisted } from '../../types/cardioInputs';
import type { PhysicalProfile } from '../../types/userProfile';
import type { ScoreMap } from '../../types/scoring';
import { normalizeGenderForNormTables } from './genderNormalize';
import { clampScoreMapValue } from './scoring';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Cooper 12-minute distance ceiling for scoring (meters), aligned with elite 5,000 m track context.
 * Inputs above this are clamped so radar scores stay within a plausible field-test band.
 */
export const COOPER_MAX_DISTANCE_MALE_METERS = 4900;
export const COOPER_MAX_DISTANCE_FEMALE_METERS = 4400;

/** Upper distance bound used when converting Cooper meters → score (matches clamp in calculateCooperScore). */
export function getCooperMaxDistanceMetersForGender(gender: string | null | undefined): number {
  return normalizeGenderForCardio(gender) === 'female'
    ? COOPER_MAX_DISTANCE_FEMALE_METERS
    : COOPER_MAX_DISTANCE_MALE_METERS;
}

/** Cooper distance standards (meters) — male. Keys are score anchors 60/70/…/100. */
export const COOPER_STANDARDS_MALE: Readonly<
  Record<string, Readonly<Record<60 | 70 | 80 | 90 | 100, number>>>
> = {
  '13-14': { 100: 2700, 90: 2400, 80: 2200, 70: 2100, 60: 2100 },
  '15-16': { 100: 2800, 90: 2500, 80: 2300, 70: 2200, 60: 2200 },
  '17-20': { 100: 3000, 90: 2700, 80: 2500, 70: 2300, 60: 2300 },
  '20-29': { 100: 2800, 90: 2400, 80: 2200, 70: 1600, 60: 1600 },
  '30-39': { 100: 2700, 90: 2300, 80: 1900, 70: 1500, 60: 1500 },
  '40-49': { 100: 2500, 90: 2100, 80: 1700, 70: 1400, 60: 1400 },
  '50+': { 100: 2400, 90: 2000, 80: 1600, 70: 1300, 60: 1300 },
};

export const COOPER_STANDARDS_FEMALE: Readonly<
  Record<string, Readonly<Record<60 | 70 | 80 | 90 | 100, number>>>
> = {
  '13-14': { 100: 2000, 90: 1900, 80: 1600, 70: 1500, 60: 1500 },
  '15-16': { 100: 2100, 90: 2000, 80: 1700, 70: 1600, 60: 1600 },
  '17-20': { 100: 2300, 90: 2100, 80: 1800, 70: 1700, 60: 1700 },
  '20-29': { 100: 2700, 90: 2200, 80: 1800, 70: 1500, 60: 1500 },
  '30-39': { 100: 2500, 90: 2000, 80: 1700, 70: 1400, 60: 1400 },
  '40-49': { 100: 2300, 90: 1900, 80: 1500, 70: 1200, 60: 1200 },
  '50+': { 100: 2200, 90: 1700, 80: 1400, 70: 1100, 60: 1100 },
};

/** Alias for shared norm-table gender parsing (Cooper / muscle / explosive use the same rules). */
export const normalizeGenderForCardio = normalizeGenderForNormTables;

export function getCardioAgeRange(age: number | string | null | undefined): string | null {
  const ageNum = parseInt(String(age), 10);
  if (!ageNum || ageNum <= 0) return null;
  if (ageNum >= 13 && ageNum <= 14) return '13-14';
  if (ageNum >= 15 && ageNum <= 16) return '15-16';
  if (ageNum >= 17 && ageNum <= 20) return '17-20';
  if (ageNum >= 21 && ageNum <= 29) return '20-29';
  if (ageNum >= 30 && ageNum <= 39) return '30-39';
  if (ageNum >= 40 && ageNum <= 49) return '40-49';
  if (ageNum >= 50) return '50+';
  return null;
}

export function calculateCooperScore(input: {
  distanceMeters: number;
  age: number | string | null | undefined;
  gender: string | null | undefined;
}): number {
  const distRaw = parseFloat(String(input.distanceMeters));
  if (!distRaw || distRaw <= 0) return 0;

  const maxM = getCooperMaxDistanceMetersForGender(input.gender);
  const dist = Math.min(distRaw, maxM);

  const ageRange = getCardioAgeRange(input.age);
  const g = normalizeGenderForCardio(input.gender) ?? 'male';
  const standardMap = g === 'male' ? COOPER_STANDARDS_MALE : COOPER_STANDARDS_FEMALE;
  const standard = ageRange ? standardMap[ageRange] : undefined;
  if (!standard) return 0;

  const min = standard[60];
  const max = standard[100];
  if (!min || !max || max === min) return 0;

  const slope = 40 / (max - min);
  const calculatedScore = 60 + (dist - min) * slope;
  return round2(Math.max(0, calculatedScore));
}

/**
 * 5 km time-trial norm anchors — decoupled by sex for mixed-leaderboard fairness.
 * Missing / unknown gender defaults to male (same as `normalizeGenderForCardio` fallback).
 */
export const RUN_5KM_MALE = {
  t0Seconds: 45 * 60,
  t100Seconds: 20 * 60,
  floorSeconds: 740,
} as const;

export const RUN_5KM_FEMALE = {
  t0Seconds: 50 * 60,
  t100Seconds: 22 * 60 + 30,
  floorSeconds: 825,
} as const;

export type Run5KmNorm = typeof RUN_5KM_MALE;

/** Overflow above T100: linear pts per minute faster than T100 anchor. */
export const RUN_5KM_OVERFLOW_LINEAR_PER_MINUTE = 6 as const;
/** Quartic warp coefficient — elite aerobic times above 100-pt anchor. */
export const RUN_5KM_OVERFLOW_QUARTIC_COEFFICIENT = 0.0105 as const;

export function resolveRun5KmNorm(gender: string | null | undefined): Run5KmNorm {
  return normalizeGenderForCardio(gender) === 'female' ? RUN_5KM_FEMALE : RUN_5KM_MALE;
}

/** 4th-power aerobic warp when effective time ≤ T100 (deltaT in minutes from T100). */
export function score5KmOverflowAboveT100(
  effectiveSeconds: number,
  norm: Run5KmNorm
): number {
  const deltaTMinutes = (norm.t100Seconds - effectiveSeconds) / 60;
  const linear = deltaTMinutes * RUN_5KM_OVERFLOW_LINEAR_PER_MINUTE;
  const quartic =
    Math.pow(deltaTMinutes, 4) * RUN_5KM_OVERFLOW_QUARTIC_COEFFICIENT;
  return round2(100 + linear + quartic);
}

/** Linear 0–100 band; 4th-power overflow above T100 (minutes faster → higher score). */
export function score5KmFromNorm(totalSeconds: number, norm: Run5KmNorm): number {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return 0;

  const effectiveSeconds = Math.max(totalSeconds, norm.floorSeconds);

  if (effectiveSeconds > norm.t0Seconds) return 0;

  if (effectiveSeconds <= norm.t100Seconds) {
    return score5KmOverflowAboveT100(effectiveSeconds, norm);
  }

  const range = norm.t0Seconds - norm.t100Seconds;
  const diff = effectiveSeconds - norm.t100Seconds;
  return round2(100 - (diff / range) * 100);
}

/** Max raw score at the WR-aligned floor (after overflow math). */
export function run5KmCeilingScore(norm: Run5KmNorm): number {
  return score5KmFromNorm(norm.floorSeconds, norm);
}

/**
 * 5 km score — sex-specific T0/T100 anchors; WR-aligned floors before overflow math.
 */
export function calculate5KmScore(input: {
  totalSeconds: number;
  gender?: string | null | undefined;
}): number {
  const sec = parseInt(String(input.totalSeconds), 10);
  if (!sec || sec <= 0) return 0;
  return score5KmFromNorm(sec, resolveRun5KmNorm(input.gender));
}

/**
 * Radar precedence matches reference `RadarChartSection`: Cooper if valid, else 5 km.
 * Returns null when no structured inputs produce a score (caller keeps stored manual cardio).
 */
export function resolveCardioScoreForDisplay(
  profile: PhysicalProfile | null | undefined,
  inputs: CardioInputsPersisted | null | undefined
): number | null {
  if (!inputs) return null;

  const cooper = (() => {
    const distanceMeters = Number(inputs.cardio?.distance);
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return null;
    const age = profile?.age;
    const gender = profile?.gender;
    if (age == null || !gender) return null;
    const computed = calculateCooperScore({ distanceMeters, age, gender });
    return Number.isFinite(computed) ? computed : null;
  })();

  if (cooper !== null) return cooper;

  const fiveKm = (() => {
    const totalSeconds = Number(inputs.run_5km?.totalSeconds);
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
    const computed = calculate5KmScore({ totalSeconds, gender: profile?.gender });
    return Number.isFinite(computed) ? computed : null;
  })();

  return fiveKm;
}

export function mergeScoreMapWithResolvedCardio(
  scores: ScoreMap,
  profile: PhysicalProfile | null | undefined,
  inputs: CardioInputsPersisted | null | undefined
): ScoreMap {
  const resolved = resolveCardioScoreForDisplay(profile, inputs);
  if (resolved === null) return { ...scores };
  return { ...scores, cardio: clampScoreMapValue(resolved) };
}

/** Text field → positive distance (m) or null. */
export function parseCooperDistanceMeters(raw: string): number | null {
  const d = parseFloat(raw.trim());
  if (!Number.isFinite(d) || d <= 0) return null;
  return d;
}

/** Parsed 5 km clock split for persistence (`run_5km`). */
export function parse5KmFieldSplit(
  minutesRaw: string,
  secondsRaw: string
): { minutes: number; seconds: number; totalSeconds: number } | null {
  const minutes = parseInt(minutesRaw || '0', 10) || 0;
  const seconds = parseInt(secondsRaw || '0', 10) || 0;
  const totalSeconds = minutes * 60 + seconds;
  if (!totalSeconds || totalSeconds <= 0) return null;
  return { minutes, seconds, totalSeconds };
}

export function parse5KmTotalSeconds(minutesRaw: string, secondsRaw: string): number | null {
  const split = parse5KmFieldSplit(minutesRaw, secondsRaw);
  return split ? split.totalSeconds : null;
}

export type CardioAssessmentComputeError =
  | 'missing-profile-cooper'
  | 'invalid-cooper-distance'
  | 'cooper-no-standard'
  | 'invalid-5km-time';

export type CardioAssessmentTab = 'cooper' | '5km';

/** Single source for preview + submit so saved scores cannot drift from visible inputs. */
export function tryComputeCardioAssessmentScore(args: {
  tab: CardioAssessmentTab;
  distanceInput: string;
  runMinutesInput: string;
  runSecondsInput: string;
  profile: PhysicalProfile | null;
  profileReady: boolean;
}): { ok: true; score: number } | { ok: false; error: CardioAssessmentComputeError } {
  if (args.tab === 'cooper') {
    if (!args.profileReady || !args.profile) {
      return { ok: false, error: 'missing-profile-cooper' };
    }
    const d = parseCooperDistanceMeters(args.distanceInput);
    if (d === null) return { ok: false, error: 'invalid-cooper-distance' };
    if (!getCardioAgeRange(args.profile.age)) return { ok: false, error: 'cooper-no-standard' };
    const raw = calculateCooperScore({
      distanceMeters: d,
      age: args.profile.age,
      gender: args.profile.gender,
    });
    if (!Number.isFinite(raw)) return { ok: false, error: 'invalid-cooper-distance' };
    return { ok: true, score: raw };
  }

  const split = parse5KmFieldSplit(args.runMinutesInput, args.runSecondsInput);
  if (!split) return { ok: false, error: 'invalid-5km-time' };
  return {
    ok: true,
    score: calculate5KmScore({ totalSeconds: split.totalSeconds, gender: args.profile?.gender }),
  };
}
