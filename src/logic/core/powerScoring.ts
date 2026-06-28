/**
 * Explosive power (vertical jump / standing long jump / sprint) — norm tables align with
 * reference-app `assessmentStandards.js`; sprint overflow above T100 uses a 4th-power warp
 * (`SPRINT_OVERFLOW_*`); vertical jump / standing long jump overflow uses meter-based
 * `INCREASING_OVERFLOW_*` warp to avoid elite dead-zone collapse at radar clamp 200.
 */
import type { ExplosivePowerRawPersisted, PowerInputsPersisted } from '../../types/powerInputs';
import type { PhysicalProfile } from '../../types/userProfile';
import type { ScoreMap } from '../../types/scoring';
import { applyExplosiveInputCapsForProfile, type ExplosiveCapApplied } from './explosiveInputCaps';
import { normalizeGenderForNormTables } from './genderNormalize';
import { isPhysicalProfileComplete } from './physicalProfile';
import { clampScoreMapValue } from './scoring';

export type { ExplosiveCapApplied } from './explosiveInputCaps';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Linear pts per second faster than T100 (deltaT = 0 → score stays 100). */
export const SPRINT_OVERFLOW_LINEAR_PER_SECOND = 20 as const;
/** Quartic coefficient for elite sprint warp above T100 anchor. */
export const SPRINT_OVERFLOW_QUARTIC_COEFFICIENT = 12 as const;

/** Sprint-only: score when time t ≤ T100 after `deltaT = T100 - t`. */
export function scoreSprintOverflowAboveT100(deltaT: number): number {
  const linearBonus = deltaT * SPRINT_OVERFLOW_LINEAR_PER_SECOND;
  const quarticBonus = Math.pow(deltaT, 4) * SPRINT_OVERFLOW_QUARTIC_COEFFICIENT;
  return round2(100 + linearBonus + quarticBonus);
}

/** Linear pts per meter beyond T100 distance anchor (deltaD = 0 → score stays 100). */
export const INCREASING_OVERFLOW_LINEAR_PER_METER = 40 as const;
/** Quartic coefficient for vertical jump / standing long jump elite-distance warp above T100. */
export const INCREASING_OVERFLOW_QUARTIC_COEFFICIENT = 45 as const;

/**
 * WHY: 100+ pts use quartic warp on both jump branches — linear excess×2 collapsed SLJ elites
 * into identical radar 200; mirrors sprint/cardio elite-overflow style across explosive axis.
 */
export function scoreIncreasingOverflowAboveT100(deltaD_meters: number): number {
  const linearBonus = deltaD_meters * INCREASING_OVERFLOW_LINEAR_PER_METER;
  const quarticBonus = Math.pow(deltaD_meters, 4) * INCREASING_OVERFLOW_QUARTIC_COEFFICIENT;
  return round2(100 + linearBonus + quarticBonus);
}

/** Fixed denominator for explosive composite (vertical / broad jump / sprint; missing = 0). */
export const EXPLOSIVE_COMPOSITE_FIXED_DENOMINATOR = 3 as const;

export type PowerAgeBucket =
  | '12-15'
  | '16-20'
  | '21-30'
  | '31-40'
  | '41-50'
  | '51-60'
  | '61-70'
  | '71-80';

/** Sprint / jump standard row: score anchors at 0, 50, 100 points. */
export type PowerStandardRow = Readonly<Record<0 | 50 | 100, number>>;

export const VERTICAL_JUMP_STANDARDS_MALE: Readonly<Record<PowerAgeBucket, PowerStandardRow>> = {
  '12-15': { 0: 25, 50: 45, 100: 65 },
  '16-20': { 0: 35, 50: 55, 100: 75 },
  '21-30': { 0: 30, 50: 50, 100: 70 },
  '31-40': { 0: 25, 50: 45, 100: 65 },
  '41-50': { 0: 20, 50: 40, 100: 60 },
  '51-60': { 0: 15, 50: 35, 100: 55 },
  '61-70': { 0: 10, 50: 30, 100: 50 },
  '71-80': { 0: 5, 50: 25, 100: 45 },
};

export const VERTICAL_JUMP_STANDARDS_FEMALE: Readonly<Record<PowerAgeBucket, PowerStandardRow>> = {
  '12-15': { 0: 20, 50: 35, 100: 50 },
  '16-20': { 0: 25, 50: 40, 100: 55 },
  '21-30': { 0: 22, 50: 38, 100: 52 },
  '31-40': { 0: 18, 50: 32, 100: 46 },
  '41-50': { 0: 15, 50: 28, 100: 42 },
  '51-60': { 0: 10, 50: 25, 100: 40 },
  '61-70': { 0: 5, 50: 20, 100: 35 },
  '71-80': { 0: 0, 50: 15, 100: 30 },
};

export const STANDING_LONG_JUMP_STANDARDS_MALE: Readonly<Record<PowerAgeBucket, PowerStandardRow>> =
  {
    '12-15': { 0: 150, 50: 200, 100: 250 },
    '16-20': { 0: 180, 50: 230, 100: 280 },
    '21-30': { 0: 170, 50: 220, 100: 270 },
    '31-40': { 0: 150, 50: 200, 100: 250 },
    '41-50': { 0: 130, 50: 180, 100: 230 },
    '51-60': { 0: 110, 50: 160, 100: 210 },
    '61-70': { 0: 90, 50: 140, 100: 190 },
    '71-80': { 0: 70, 50: 120, 100: 170 },
  };

export const STANDING_LONG_JUMP_STANDARDS_FEMALE: Readonly<
  Record<PowerAgeBucket, PowerStandardRow>
> = {
  '12-15': { 0: 120, 50: 170, 100: 220 },
  '16-20': { 0: 140, 50: 190, 100: 240 },
  '21-30': { 0: 130, 50: 180, 100: 230 },
  '31-40': { 0: 115, 50: 165, 100: 215 },
  '41-50': { 0: 100, 50: 150, 100: 200 },
  '51-60': { 0: 80, 50: 130, 100: 180 },
  '61-70': { 0: 60, 50: 110, 100: 160 },
  '71-80': { 0: 40, 50: 90, 100: 140 },
};

/** Lower seconds = better (0 / 50 / 100 score anchors). */
export const SPRINT_STANDARDS_MALE: Readonly<Record<PowerAgeBucket, PowerStandardRow>> = {
  '12-15': { 0: 18, 50: 15, 100: 12 },
  '16-20': { 0: 17, 50: 14, 100: 11 },
  '21-30': { 0: 17, 50: 14, 100: 11 },
  '31-40': { 0: 18, 50: 15, 100: 12 },
  '41-50': { 0: 19, 50: 16, 100: 13 },
  '51-60': { 0: 20, 50: 17, 100: 14 },
  '61-70': { 0: 22, 50: 19, 100: 16 },
  '71-80': { 0: 24, 50: 21, 100: 18 },
};

export const SPRINT_STANDARDS_FEMALE: Readonly<Record<PowerAgeBucket, PowerStandardRow>> = {
  '12-15': { 0: 19, 50: 16, 100: 13 },
  '16-20': { 0: 18, 50: 15, 100: 12 },
  '21-30': { 0: 18, 50: 15, 100: 12 },
  '31-40': { 0: 19, 50: 16, 100: 13 },
  '41-50': { 0: 20, 50: 17, 100: 14 },
  '51-60': { 0: 21, 50: 18, 100: 15 },
  '61-70': { 0: 23, 50: 20, 100: 17 },
  '71-80': { 0: 25, 50: 22, 100: 19 },
};

/**
 * Age buckets match reference-app power tables (12–80). Profile in this app starts at 13;
 * ages 13–15 use the `12-15` row. Above 80 → null (no table).
 */
export function getPowerAgeRange(age: number | string | null | undefined): PowerAgeBucket | null {
  const a = parseInt(String(age), 10);
  if (!a || a <= 0) return null;
  if (a >= 12 && a <= 15) return '12-15';
  if (a >= 16 && a <= 20) return '16-20';
  if (a >= 21 && a <= 30) return '21-30';
  if (a >= 31 && a <= 40) return '31-40';
  if (a >= 41 && a <= 50) return '41-50';
  if (a >= 51 && a <= 60) return '51-60';
  if (a >= 61 && a <= 70) return '61-70';
  if (a >= 71 && a <= 80) return '71-80';
  return null;
}

/** Resolved norm rows for explosive reference UI (null when profile incomplete or age outside tables). */
export type ExplosivePowerNormAnchors = NonNullable<
  ReturnType<typeof getPowerStandardsForProfile>
>;

export function getPowerStandardsForProfile(profile: PhysicalProfile): {
  vjump: PowerStandardRow;
  slj: PowerStandardRow;
  sprint: PowerStandardRow;
  ageRange: PowerAgeBucket;
} | null {
  const range = getPowerAgeRange(profile.age);
  if (!range) return null;
  const g = normalizeGenderForNormTables(profile.gender) ?? 'male';
  const vjMap = g === 'male' ? VERTICAL_JUMP_STANDARDS_MALE : VERTICAL_JUMP_STANDARDS_FEMALE;
  const sljMap =
    g === 'male' ? STANDING_LONG_JUMP_STANDARDS_MALE : STANDING_LONG_JUMP_STANDARDS_FEMALE;
  const spMap = g === 'male' ? SPRINT_STANDARDS_MALE : SPRINT_STANDARDS_FEMALE;
  const vjump = vjMap[range];
  const slj = sljMap[range];
  const sprint = spMap[range];
  if (!vjump || !slj || !sprint) return null;
  return { vjump, slj, sprint, ageRange: range };
}

export function calculateScoreIncreasing(value: number, standard: PowerStandardRow): number {
  const v = parseFloat(String(value));
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (v < standard[0]) return 0;

  if (v >= standard[100]) {
    const deltaD_meters = (v - standard[100]) / 100;
    return scoreIncreasingOverflowAboveT100(deltaD_meters);
  }

  if (v < standard[50]) {
    const denom = standard[50] - standard[0];
    if (denom <= 0) return 0;
    return round2(((v - standard[0]) / denom) * 50);
  }
  const denomHigh = standard[100] - standard[50];
  if (denomHigh <= 0) return 50;
  return round2(50 + ((v - standard[50]) / denomHigh) * 50);
}

export function calculateScoreDecreasing(value: number, standard: PowerStandardRow): number {
  const v = parseFloat(String(value));
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (v > standard[0]) return 0;

  if (v <= standard[100]) {
    // 4th-power warp above T100: linear preserves anchor; quartic models near-limit sprint output.
    return scoreSprintOverflowAboveT100(standard[100] - v);
  }

  if (v > standard[50]) {
    const denom = standard[0] - standard[50];
    if (denom <= 0) return 0;
    return round2(((standard[0] - v) / denom) * 50);
  }
  const denomLow = standard[50] - standard[100];
  if (denomLow <= 0) return 50;
  return round2(50 + ((standard[50] - v) / denomLow) * 50);
}

/** Per-metric raw scores (may exceed 100) plus fixed-denominator composite (sum / 3, missing = 0). */
export interface ExplosivePowerBreakdown {
  verticalJumpRaw: number | null;
  standingLongJumpRaw: number | null;
  sprintRaw: number | null;
  /** `(vj + slj + sprint) / 3` with null branches as 0, `round2` — same value fed into radar clamp. */
  averageRaw: number;
}

export function calculateExplosivePowerBreakdown(input: {
  verticalJumpCm: number | null;
  standingLongJumpCm: number | null;
  sprintSeconds: number | null;
  profile: PhysicalProfile;
}): ExplosivePowerBreakdown | null {
  const std = getPowerStandardsForProfile(input.profile);
  if (!std) return null;

  const verticalJumpRaw =
    input.verticalJumpCm !== null && input.verticalJumpCm > 0
      ? calculateScoreIncreasing(input.verticalJumpCm, std.vjump)
      : null;
  const standingLongJumpRaw =
    input.standingLongJumpCm !== null && input.standingLongJumpCm > 0
      ? calculateScoreIncreasing(input.standingLongJumpCm, std.slj)
      : null;
  const sprintRaw =
    input.sprintSeconds !== null && input.sprintSeconds > 0
      ? calculateScoreDecreasing(input.sprintSeconds, std.sprint)
      : null;

  const hasAnyBranch =
    verticalJumpRaw !== null || standingLongJumpRaw !== null || sprintRaw !== null;
  if (!hasAnyBranch) return null;

  const vj = verticalJumpRaw !== null && Number.isFinite(verticalJumpRaw) ? verticalJumpRaw : 0;
  const slj =
    standingLongJumpRaw !== null && Number.isFinite(standingLongJumpRaw) ? standingLongJumpRaw : 0;
  const sp = sprintRaw !== null && Number.isFinite(sprintRaw) ? sprintRaw : 0;
  const averageRaw = round2((vj + slj + sp) / EXPLOSIVE_COMPOSITE_FIXED_DENOMINATOR);
  return { verticalJumpRaw, standingLongJumpRaw, sprintRaw, averageRaw };
}

export function calculateExplosivePowerFinalRaw(input: {
  verticalJumpCm: number | null;
  standingLongJumpCm: number | null;
  sprintSeconds: number | null;
  profile: PhysicalProfile;
}): number | null {
  const b = calculateExplosivePowerBreakdown(input);
  return b ? b.averageRaw : null;
}

function persistedNumber(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * When saved explosive inputs + complete profile produce a score, override stored `explosivePower` for display
 * (same idea as Cooper for cardio).
 */
export function resolveExplosivePowerScoreForDisplay(
  profile: PhysicalProfile | null | undefined,
  inputs: PowerInputsPersisted | null | undefined
): number | null {
  if (!profile || !isPhysicalProfileComplete(profile)) return null;
  const block = inputs?.explosivePower;
  if (!block) return null;

  const verticalJumpCm = persistedNumber(block.verticalJumpCm);
  const standingLongJumpCm = persistedNumber(block.standingLongJumpCm);
  const sprintSeconds = persistedNumber(block.sprintSeconds);
  if (verticalJumpCm === null && standingLongJumpCm === null && sprintSeconds === null) return null;

  const capped = applyExplosiveInputCapsForProfile(profile, {
    verticalJumpCm,
    standingLongJumpCm,
    sprintSeconds,
  });

  const raw = calculateExplosivePowerFinalRaw({
    verticalJumpCm: capped.verticalJumpCm,
    standingLongJumpCm: capped.standingLongJumpCm,
    sprintSeconds: capped.sprintSeconds,
    profile,
  });
  if (raw === null || !Number.isFinite(raw)) return null;
  return clampScoreMapValue(raw);
}

export function mergeScoreMapWithResolvedExplosivePower(
  scores: ScoreMap,
  profile: PhysicalProfile | null | undefined,
  inputs: PowerInputsPersisted | null | undefined
): ScoreMap {
  const resolved = resolveExplosivePowerScoreForDisplay(profile, inputs);
  if (resolved === null) return { ...scores };
  return { ...scores, explosivePower: resolved };
}

/** Per-shard ladder scores derived from the same capped inputs as radar (branch = single-test norm score, clamped). */
export interface ExplosiveLadderScoreBundle {
  composite: number | null;
  vertical: number | null;
  broad: number | null;
  sprint: number | null;
}

/**
 * Maps persisted explosive inputs → composite (radar axis) + three branch scores for separate leaderboard shards.
 * WHY: `explosive_composite` must stay the fixed-denominator radar composite; branch shards must not receive each other's points.
 */
export function resolveExplosiveLadderScoreBundle(
  profile: PhysicalProfile | null | undefined,
  inputs: PowerInputsPersisted | null | undefined
): ExplosiveLadderScoreBundle {
  const empty: ExplosiveLadderScoreBundle = {
    composite: null,
    vertical: null,
    broad: null,
    sprint: null,
  };
  if (!profile || !isPhysicalProfileComplete(profile)) return empty;
  const block = inputs?.explosivePower;
  if (!block) return empty;

  const verticalJumpCm = persistedNumber(block.verticalJumpCm);
  const standingLongJumpCm = persistedNumber(block.standingLongJumpCm);
  const sprintSeconds = persistedNumber(block.sprintSeconds);
  if (verticalJumpCm === null && standingLongJumpCm === null && sprintSeconds === null)
    return empty;

  const capped = applyExplosiveInputCapsForProfile(profile, {
    verticalJumpCm,
    standingLongJumpCm,
    sprintSeconds,
  });

  const breakdown = calculateExplosivePowerBreakdown({
    verticalJumpCm: capped.verticalJumpCm,
    standingLongJumpCm: capped.standingLongJumpCm,
    sprintSeconds: capped.sprintSeconds,
    profile,
  });
  if (breakdown === null || !Number.isFinite(breakdown.averageRaw)) return empty;

  return {
    composite: clampScoreMapValue(breakdown.averageRaw),
    vertical:
      breakdown.verticalJumpRaw != null && Number.isFinite(breakdown.verticalJumpRaw)
        ? clampScoreMapValue(breakdown.verticalJumpRaw)
        : null,
    broad:
      breakdown.standingLongJumpRaw != null && Number.isFinite(breakdown.standingLongJumpRaw)
        ? clampScoreMapValue(breakdown.standingLongJumpRaw)
        : null,
    sprint:
      breakdown.sprintRaw != null && Number.isFinite(breakdown.sprintRaw)
        ? clampScoreMapValue(breakdown.sprintRaw)
        : null,
  };
}

export type ExplosiveAssessmentComputeError =
  | 'missing-profile'
  | 'age-out-of-range'
  | 'power-no-standard'
  | 'no-inputs'
  | 'invalid-vertical-jump'
  | 'invalid-standing-long-jump'
  | 'invalid-sprint';

type FieldParse = 'empty' | { value: number } | 'invalid';

function parsePowerMeasurementField(raw: string): FieldParse {
  const t = raw.trim();
  if (!t) return 'empty';
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n <= 0) return 'invalid';
  return { value: n };
}

/** Single source for preview + submit so radar cannot drift from visible inputs. */
export function tryComputeExplosiveAssessmentScore(args: {
  verticalJumpInput: string;
  standingLongJumpInput: string;
  sprintInput: string;
  profile: PhysicalProfile | null;
  profileReady: boolean;
}):
  | {
      ok: true;
      score: number;
      persisted: ExplosivePowerRawPersisted;
      breakdown: ExplosivePowerBreakdown;
      capApplied: ExplosiveCapApplied;
    }
  | { ok: false; error: ExplosiveAssessmentComputeError } {
  if (!args.profileReady || !args.profile) {
    return { ok: false, error: 'missing-profile' };
  }

  if (!getPowerAgeRange(args.profile.age)) {
    return { ok: false, error: 'age-out-of-range' };
  }

  const vj = parsePowerMeasurementField(args.verticalJumpInput);
  const slj = parsePowerMeasurementField(args.standingLongJumpInput);
  const sp = parsePowerMeasurementField(args.sprintInput);

  if (vj === 'empty' && slj === 'empty' && sp === 'empty') {
    return { ok: false, error: 'no-inputs' };
  }
  if (vj === 'invalid') return { ok: false, error: 'invalid-vertical-jump' };
  if (slj === 'invalid') return { ok: false, error: 'invalid-standing-long-jump' };
  if (sp === 'invalid') return { ok: false, error: 'invalid-sprint' };

  const uncapped = {
    verticalJumpCm: vj === 'empty' ? null : vj.value,
    standingLongJumpCm: slj === 'empty' ? null : slj.value,
    sprintSeconds: sp === 'empty' ? null : sp.value,
  };
  const capped = applyExplosiveInputCapsForProfile(args.profile, uncapped);

  const breakdown = calculateExplosivePowerBreakdown({
    verticalJumpCm: capped.verticalJumpCm,
    standingLongJumpCm: capped.standingLongJumpCm,
    sprintSeconds: capped.sprintSeconds,
    profile: args.profile,
  });

  if (breakdown === null || !Number.isFinite(breakdown.averageRaw)) {
    return { ok: false, error: 'power-no-standard' };
  }

  const persisted: ExplosivePowerRawPersisted = {};
  if (vj !== 'empty') persisted.verticalJumpCm = capped.verticalJumpCm!;
  if (slj !== 'empty') persisted.standingLongJumpCm = capped.standingLongJumpCm!;
  if (sp !== 'empty') persisted.sprintSeconds = capped.sprintSeconds!;

  return {
    ok: true,
    score: clampScoreMapValue(breakdown.averageRaw),
    persisted,
    breakdown,
    capApplied: capped.capApplied,
  };
}
