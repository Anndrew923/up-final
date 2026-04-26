/**
 * Muscle (SMM + SM%) composite scoring — norm tables match reference-app; final score is
 * unweighted mean of SMM branch and SM% branch (reference’s legacy ×1.25 on SMM removed).
 * SMM inputs above sex-based kg ceilings do not score or merge (see `SMM_KG_CEILING_*`).
 */
import type { MuscleInputsPersisted } from '../../types/muscleInputs';
import type { PhysicalProfile } from '../../types/userProfile';
import type { ScoreMap } from '../../types/scoring';
import {
  type MuscleAgeBucket,
  muscleStandardsFemaleSMM,
  muscleStandardsFemaleSMPercent,
  muscleStandardsMaleSMM,
  muscleStandardsMaleSMPercent,
} from './muscleStandards';
import { normalizeGenderForNormTables } from './genderNormalize';
import { isPhysicalProfileComplete } from './physicalProfile';
import { clampScoreMapValue } from './scoring';

const round2 = (n: number) => Math.round(n * 100) / 100;

export type { MuscleAgeBucket };

export function getMuscleAgeRange(age: number | string | null | undefined): MuscleAgeBucket | null {
  const ageNum = parseInt(String(age), 10);
  if (!ageNum || ageNum <= 0) return null;
  if (ageNum >= 10 && ageNum <= 12) return '10-12';
  if (ageNum >= 13 && ageNum <= 17) return '13-17';
  if (ageNum >= 18 && ageNum <= 30) return '18-30';
  if (ageNum >= 31 && ageNum <= 40) return '31-40';
  if (ageNum >= 41 && ageNum <= 50) return '41-50';
  if (ageNum >= 51 && ageNum <= 60) return '51-60';
  if (ageNum >= 61 && ageNum <= 70) return '61-70';
  if (ageNum >= 71 && ageNum <= 80) return '71-80';
  return null;
}

/** SMM (kg) ceiling — above this we do not score or merge (fantasy-proofing). */
export const SMM_KG_CEILING_MALE = 75;
export const SMM_KG_CEILING_FEMALE = 48;

export function getSmmKgCeilingForGender(gender: string | null | undefined): number {
  return normalizeGenderForNormTables(gender) === 'female' ? SMM_KG_CEILING_FEMALE : SMM_KG_CEILING_MALE;
}

export function isSmmKgAboveCeiling(smmKg: number, gender: string | null | undefined): boolean {
  if (!Number.isFinite(smmKg)) return false;
  return smmKg > getSmmKgCeilingForGender(gender);
}

/** Legacy scoring interpolation + extension beyond 100 (same as reference-app). */
export function calculateScoreFromStandard(
  value: number,
  standard: Readonly<Record<number, number>> | null | undefined
): number {
  const v = parseFloat(String(value));
  if (!standard || !Number.isFinite(v)) return 0;

  const s100 = standard[100];
  if (v >= s100) {
    const valueDiff = standard[100] - standard[90];
    const slope = valueDiff > 0 ? 10 / valueDiff : 0;
    const extraValue = v - standard[100];
    let extendedScore = 100 + extraValue * slope;

    if (extendedScore > 120) {
      extendedScore = 120 + (extendedScore - 120) * 0.5;
    }

    return parseFloat(extendedScore.toFixed(2));
  }

  if (v <= standard[0]) {
    return 0;
  }

  let lower = 0;
  let upper = 100;
  for (let i = 10; i <= 100; i += 10) {
    if (v < standard[i]) {
      upper = i;
      lower = i - 10;
      break;
    }
  }

  const lowerValue = standard[lower];
  const upperValue = standard[upper];
  if (upperValue === lowerValue) {
    return upper;
  }

  let rawScore = lower + ((v - lowerValue) / (upperValue - lowerValue)) * (upper - lower);
  rawScore = Math.round(rawScore * 100) / 100;
  return rawScore;
}

export interface MuscleScoresNullable {
  smPercent: number | null;
  smmScoreRaw: number | null;
  smPercentScoreRaw: number | null;
  finalRawScore: number | null;
}

function emptyMuscleScores(): MuscleScoresNullable {
  return {
    smPercent: null,
    smmScoreRaw: null,
    smPercentScoreRaw: null,
    finalRawScore: null,
  };
}

export function calculateMuscleScores(input: {
  smmKg: number;
  weightKg: number;
  age: number | string | null | undefined;
  gender: string | null | undefined;
}): MuscleScoresNullable {
  const w = parseFloat(String(input.weightKg));
  const smm = parseFloat(String(input.smmKg));
  if (!w || !smm || w <= 0 || smm <= 0) {
    return emptyMuscleScores();
  }

  if (isSmmKgAboveCeiling(smm, input.gender)) {
    return emptyMuscleScores();
  }

  const ageRange = getMuscleAgeRange(input.age);
  const g = normalizeGenderForNormTables(input.gender) ?? 'male';
  if (!ageRange) {
    return emptyMuscleScores();
  }

  const smPercent = (smm / w) * 100;

  const smmStandards = g === 'male' ? muscleStandardsMaleSMM : muscleStandardsFemaleSMM;
  const smPercentStandards =
    g === 'male' ? muscleStandardsMaleSMPercent : muscleStandardsFemaleSMPercent;

  const smmStandard = smmStandards[ageRange];
  const smPercentStandard = smPercentStandards[ageRange];
  if (!smmStandard || !smPercentStandard) {
    return emptyMuscleScores();
  }

  const smmRaw = calculateScoreFromStandard(smm, smmStandard);
  const smPercentRaw = calculateScoreFromStandard(smPercent, smPercentStandard);

  const finalRawScore = (smmRaw + smPercentRaw) / 2;

  return {
    smPercent: round2(smPercent),
    smmScoreRaw: round2(smmRaw),
    smPercentScoreRaw: round2(smPercentRaw),
    finalRawScore: round2(finalRawScore),
  };
}

/**
 * When saved SMM + complete profile produce a score, override stored `muscleMass` for display
 * (same precedence idea as Cooper/5 km for cardio).
 */
export function resolveMuscleScoreForDisplay(
  profile: PhysicalProfile | null | undefined,
  inputs: MuscleInputsPersisted | null | undefined
): number | null {
  if (!inputs?.muscle?.smmKg) return null;
  const smmKg = Number(inputs.muscle.smmKg);
  if (!Number.isFinite(smmKg) || smmKg <= 0) return null;
  if (!isPhysicalProfileComplete(profile)) return null;
  if (isSmmKgAboveCeiling(smmKg, profile!.gender)) return null;

  const r = calculateMuscleScores({
    smmKg,
    weightKg: profile!.weightKg,
    age: profile!.age,
    gender: profile!.gender,
  });
  if (r.finalRawScore === null || !Number.isFinite(r.finalRawScore)) return null;
  return clampScoreMapValue(r.finalRawScore);
}

export function mergeScoreMapWithResolvedMuscle(
  scores: ScoreMap,
  profile: PhysicalProfile | null | undefined,
  inputs: MuscleInputsPersisted | null | undefined
): ScoreMap {
  const resolved = resolveMuscleScoreForDisplay(profile, inputs);
  if (resolved === null) return { ...scores };
  return { ...scores, muscleMass: resolved };
}

/** Norm-based branch scores for separate muscle ladder shards (same inputs as radar). */
export interface MuscleLadderScoreBundle {
  composite: number | null;
  /** SMM (kg) branch norm score, clamped — maps to `muscleMass_weightKg` shard. */
  weightBranchScore: number | null;
  /** SM% branch norm score, clamped — maps to `muscleMass_ratio` shard. */
  ratioBranchScore: number | null;
}

/**
 * WHY: Radar `muscleMass` is the mean of two branches; weight/ratio sub-ladders must each use its own norm score,
 * not the composite (otherwise kg-only signal would not rank on the weight shard).
 */
export function resolveMuscleLadderScoreBundle(
  profile: PhysicalProfile | null | undefined,
  inputs: MuscleInputsPersisted | null | undefined
): MuscleLadderScoreBundle {
  const empty: MuscleLadderScoreBundle = { composite: null, weightBranchScore: null, ratioBranchScore: null };
  if (!inputs?.muscle?.smmKg) return empty;
  const smmKg = Number(inputs.muscle.smmKg);
  if (!Number.isFinite(smmKg) || smmKg <= 0) return empty;
  if (!profile || !isPhysicalProfileComplete(profile)) return empty;
  if (isSmmKgAboveCeiling(smmKg, profile.gender)) return empty;

  const raw = calculateMuscleScores({
    smmKg,
    weightKg: profile.weightKg,
    age: profile.age,
    gender: profile.gender,
  });
  if (
    raw.finalRawScore === null ||
    raw.smmScoreRaw === null ||
    raw.smPercentScoreRaw === null ||
    !Number.isFinite(raw.finalRawScore)
  ) {
    return empty;
  }

  return {
    composite: clampScoreMapValue(raw.finalRawScore),
    weightBranchScore: clampScoreMapValue(raw.smmScoreRaw),
    ratioBranchScore: clampScoreMapValue(raw.smPercentScoreRaw),
  };
}

/** Parsed positive SMM (kg) or null. */
export function parseSmmKg(raw: string): number | null {
  const n = parseFloat(raw.trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export type MuscleAssessmentComputeError =
  | 'missing-profile'
  | 'invalid-smm'
  | 'age-out-of-range'
  | 'smm-exceeds-ceiling'
  | 'standards-not-found';

export interface MuscleAssessmentBreakdown {
  smPercent: number;
  smmScoreRaw: number;
  smPercentScoreRaw: number;
}

/** Single source for preview + submit (clamped score matches persisted radar value). */
export function tryComputeMuscleAssessmentScore(args: {
  smmInput: string;
  profile: PhysicalProfile | null;
  profileReady: boolean;
}): { ok: true; score: number; breakdown: MuscleAssessmentBreakdown } | { ok: false; error: MuscleAssessmentComputeError } {
  if (!args.profileReady || !args.profile) {
    return { ok: false, error: 'missing-profile' };
  }

  const smmNum = parseSmmKg(args.smmInput);
  if (smmNum === null) {
    return { ok: false, error: 'invalid-smm' };
  }

  const ageRange = getMuscleAgeRange(args.profile.age);
  if (!ageRange) {
    return { ok: false, error: 'age-out-of-range' };
  }

  if (isSmmKgAboveCeiling(smmNum, args.profile.gender)) {
    return { ok: false, error: 'smm-exceeds-ceiling' };
  }

  const raw = calculateMuscleScores({
    smmKg: smmNum,
    weightKg: args.profile.weightKg,
    age: args.profile.age,
    gender: args.profile.gender,
  });

  if (
    raw.finalRawScore === null ||
    raw.smPercent === null ||
    raw.smmScoreRaw === null ||
    raw.smPercentScoreRaw === null
  ) {
    return { ok: false, error: 'standards-not-found' };
  }

  return {
    ok: true,
    score: clampScoreMapValue(raw.finalRawScore),
    breakdown: {
      smPercent: raw.smPercent,
      smmScoreRaw: raw.smmScoreRaw,
      smPercentScoreRaw: raw.smPercentScoreRaw,
    },
  };
}
