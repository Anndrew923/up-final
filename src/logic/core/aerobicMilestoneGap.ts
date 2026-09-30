/**
 * Aerobic milestone raw-gap — Cooper Δmeters + 5 km Δseconds.
 * WHY: Keep cardioScoring focused on forward paths; invert consumers stay separate.
 * NOTE: Specialty clock is 5 km (not 2.4 km); Cooper field test stays meters.
 * Forward scores match tryCompute / preview (unclamped) so decade gates align with scoreMeaning.
 */
import type { PhysicalProfileGender } from '../../types/userProfile';
import {
  calculate5KmScore,
  calculateCooperScore,
  getCardioAgeRange,
  getCooperMaxDistanceMetersForGender,
  getRun5KmFloorSecondsForGender,
} from './cardioScoring';

export type AerobicMilestoneGender = PhysicalProfileGender;

export type Run5KmMilestoneRawGap = {
  deltaSeconds: number;
};

export type CooperMilestoneRawGap = {
  deltaMeters: number;
};

/**
 * Production Cooper score (age/sex norms — same surface as tryCompute preview).
 * Monotonic: longer effective distance → higher or equal score.
 */
function forwardCooperScore(
  distanceMeters: number,
  age: number,
  gender: AerobicMilestoneGender
): number | null {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return null;
  if (!getCardioAgeRange(age)) return null;
  const raw = calculateCooperScore({ distanceMeters, age, gender });
  if (!Number.isFinite(raw)) return null;
  return raw;
}

/**
 * WHY: Spec panel shows how many more meters on the 12-min run to clear the next decade gate.
 * IMPACT: null when inputs invalid, already past, or unreachable above the sex distance ceiling.
 * Delta uses whole meters and verifies through production scoring (never under-promise after round2).
 */
export function resolveCooperMilestoneRawGap(params: {
  nextMilestoneScore: number;
  currentDistanceMeters: number;
  age: number;
  gender: AerobicMilestoneGender;
}): CooperMilestoneRawGap | null {
  const { nextMilestoneScore, age, gender } = params;

  if (
    !Number.isFinite(nextMilestoneScore) ||
    nextMilestoneScore <= 0 ||
    !Number.isFinite(params.currentDistanceMeters) ||
    params.currentDistanceMeters <= 0 ||
    !Number.isFinite(age) ||
    !getCardioAgeRange(age)
  ) {
    return null;
  }

  const maxM = getCooperMaxDistanceMetersForGender(gender);
  // Match calculateCooperScore clamp — over-cap inputs already score at the ceiling clock.
  const currentDistanceMeters = Math.min(params.currentDistanceMeters, maxM);

  const currentScore = forwardCooperScore(currentDistanceMeters, age, gender);
  if (currentScore === null) return null;
  if (currentScore >= nextMilestoneScore) return null;

  const ceilingScore = forwardCooperScore(maxM, age, gender);
  if (ceilingScore === null || ceilingScore < nextMilestoneScore) return null;

  // Integer-meter binary search: minimal whole meters that clear the gate.
  // WHY: UI promises whole meters; lo starts at floor(current) so mid stays in the discrete domain.
  let lo = Math.floor(currentDistanceMeters);
  let hi = maxM;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const score = forwardCooperScore(mid, age, gender);
    if (score !== null && score >= nextMilestoneScore) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  const targetMeters = hi;
  if (!(targetMeters > currentDistanceMeters)) return null;

  const exactDelta = targetMeters - currentDistanceMeters;
  let deltaMeters = Math.max(1, Math.ceil(exactDelta - 1e-12));
  const maxDelta = Math.max(1, Math.ceil(maxM - currentDistanceMeters));

  for (let guard = 0; guard < 64; guard += 1) {
    if (deltaMeters > maxDelta) return null;
    const nextDist = currentDistanceMeters + deltaMeters;
    if (nextDist > maxM) return null;

    const score = forwardCooperScore(nextDist, age, gender);
    if (score === null) return null;
    if (score >= nextMilestoneScore) {
      return { deltaMeters };
    }
    deltaMeters += 1;
  }

  return null;
}

/**
 * Production 5 km score (sex norms + overflow — same surface as tryCompute preview).
 * Monotonic: shorter effective time → higher or equal score.
 */
function forward5KmScore(
  totalSeconds: number,
  gender: AerobicMilestoneGender
): number | null {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  // Match calculate5KmScore's parseInt truncation so invert + verify share one clock domain.
  const wholeSeconds = Math.floor(totalSeconds);
  if (wholeSeconds <= 0) return null;
  const raw = calculate5KmScore({ totalSeconds: wholeSeconds, gender });
  if (!Number.isFinite(raw)) return null;
  return raw;
}

/**
 * Find the slowest finish time (largest seconds) that still clears targetScore.
 * WHY: Minimal athletic improvement = current − that time; integer binary search stays deterministic.
 */
function invertScoreToMaxSecondsClearingGate(params: {
  targetScore: number;
  currentSeconds: number;
  floorSeconds: number;
  gender: AerobicMilestoneGender;
}): number | null {
  const { targetScore, currentSeconds, floorSeconds, gender } = params;
  if (!(currentSeconds > floorSeconds)) return null;

  const floorScore = forward5KmScore(floorSeconds, gender);
  if (floorScore === null || floorScore < targetScore) return null;

  // Invariant: lo clears gate (fast enough), hi does not (at/slower than current).
  let lo = floorSeconds;
  let hi = currentSeconds;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const score = forward5KmScore(mid, gender);
    if (score !== null && score >= targetScore) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const loScore = forward5KmScore(lo, gender);
  if (loScore === null || loScore < targetScore) return null;
  return lo;
}

/**
 * WHY: Spec panel shows how many seconds faster on 5 km to clear the next decade gate.
 * IMPACT: null when inputs invalid, already past, or gate unreachable above the WR floor.
 */
export function resolve5KmMilestoneRawGap(params: {
  nextMilestoneScore: number;
  currentTimeSeconds: number;
  gender: AerobicMilestoneGender;
}): Run5KmMilestoneRawGap | null {
  const { nextMilestoneScore, gender } = params;

  if (
    !Number.isFinite(nextMilestoneScore) ||
    nextMilestoneScore <= 0 ||
    !Number.isFinite(params.currentTimeSeconds) ||
    params.currentTimeSeconds <= 0
  ) {
    return null;
  }

  // Whole-second clock — same domain as parse5KmTotalSeconds / calculate5KmScore.
  const currentTimeSeconds = Math.floor(params.currentTimeSeconds);
  if (currentTimeSeconds <= 0) return null;

  const floorSeconds = getRun5KmFloorSecondsForGender(gender);
  const currentScore = forward5KmScore(currentTimeSeconds, gender);
  if (currentScore === null) return null;
  if (currentScore >= nextMilestoneScore) return null;

  // Unreachable above WR-aligned ceiling (same forward path as invert's floor probe).
  const ceilingAtFloor = forward5KmScore(floorSeconds, gender);
  if (ceilingAtFloor === null || ceilingAtFloor < nextMilestoneScore) return null;

  const targetSeconds = invertScoreToMaxSecondsClearingGate({
    targetScore: nextMilestoneScore,
    currentSeconds: currentTimeSeconds,
    floorSeconds,
    gender,
  });
  if (targetSeconds === null) return null;

  const exactDelta = currentTimeSeconds - targetSeconds;
  if (exactDelta <= 0) return null;

  // Integer seconds — never under-promise after display formatting.
  let deltaSeconds = Math.max(1, Math.ceil(exactDelta - 1e-12));

  for (let guard = 0; guard < 120; guard += 1) {
    const nextTime = currentTimeSeconds - deltaSeconds;
    if (nextTime < floorSeconds) return null;

    const score = forward5KmScore(nextTime, gender);
    if (score === null) return null;
    if (score >= nextMilestoneScore) {
      return { deltaSeconds };
    }
    deltaSeconds += 1;
  }

  return null;
}

/**
 * Format Δseconds for milestone copy (omit trailing 0s seconds when whole minutes).
 */
export function formatAerobicDeltaTimeParts(deltaSeconds: number): {
  minutes: number;
  seconds: number;
  underOneMinute: boolean;
} {
  const safe = Math.max(0, Math.floor(deltaSeconds));
  if (safe < 60) {
    return { minutes: 0, seconds: safe, underOneMinute: true };
  }
  return {
    minutes: Math.floor(safe / 60),
    seconds: safe % 60,
    underOneMinute: false,
  };
}
