/**
 * Five-lift strength assessment — DOTS / anchor pipeline lives in `scoring.ts`.
 *
 * WHY one internal scorer (`computeStrengthResultFromNumericLifts`):
 * - Preview/submit (`tryComputeStrengthAssessmentScore`) and Home merge (`resolveStrengthScoreFromInputs`)
 *   must stay bitwise-identical on valid data; divergent loops were technical debt.
 * - `forgiving` mode skips corrupt persisted cells (merge must not brick the radar); `strict` surfaces the first formula failure for interactive UX.
 * - `tryScoreLiftNumbers` is the only call site wrapping `calculateStrengthScore` for per-lift math (single-row UI + batch merge).
 * - Per-lift barbell/stack weights clamp to `strengthWeightLimits` before scoring; persisted lifts store the clamped kg.
 * - Reps must be whole numbers in 1..`STRENGTH_ASSESSMENT_MAX_REPS` (matches numeric inputs); fractional values are rejected to stay aligned with Brzycki / UX nudges.
 */
import type { PhysicalProfile } from '../../types/userProfile';
import type { ScoreMap } from '../../types/scoring';
import type {
  StrengthInputsPersisted,
  StrengthLiftKey,
  StrengthLiftPersisted,
} from '../../types/strengthInputs';
import { STRENGTH_LIFT_KEYS } from '../../types/strengthInputs';
import { isPhysicalProfileComplete } from './physicalProfile';
import { calculateStrengthScore, clampScoreMapValue, type ExerciseType } from './scoring';
import { clampStrengthWeightKg } from './strengthWeightLimits';

/** Fixed denominator for strength composite / five-lift ladder (always divide by 5, missing lift = 0). */
export const STRENGTH_COMPOSITE_FIXED_DENOMINATOR = 5 as const;

export const STRENGTH_ASSESSMENT_MAX_REPS = 10;

/** Reps at or above this (within max) show a UI nudge: fewer reps → typically more reliable Brzycki 1RM. */
export const STRENGTH_REPS_ACCURACY_NUDGE_FROM_REP = 7;

const LIFT_TO_EXERCISE: Record<StrengthLiftKey, ExerciseType> = {
  benchPress: 'Bench Press',
  squat: 'Squat',
  deadlift: 'Deadlift',
  latPulldown: 'Lat Pulldown',
  shoulderPress: 'Overhead Press',
};

type StrengthNumericLifts = Partial<Record<StrengthLiftKey, { weightKg: number; reps: number }>>;

/** Single choke point for `calculateStrengthScore` (single-lift + batch merge). Applies per-lift weight ceiling. */
function tryScoreLiftNumbers(
  profile: PhysicalProfile,
  lift: StrengthLiftKey,
  weightKgInput: number,
  reps: number
):
  | {
      ok: true;
      oneRepMax: number;
      finalScore: number;
      weightUsedKg: number;
      weightInputKg: number;
      weightCapped: boolean;
      /** Model ceiling (kg) for this lift — surfaced to UI without importing limit tables in components. */
      modelMaxKg: number;
    }
  | { ok: false } {
  const { usedKg, capped, maxKg } = clampStrengthWeightKg(lift, weightKgInput);
  try {
    const breakdown = calculateStrengthScore({
      exerciseType: LIFT_TO_EXERCISE[lift],
      weight: usedKg,
      reps,
      bodyWeight: profile.weightKg,
      gender: profile.gender,
      age: profile.age,
    });
    return {
      ok: true,
      oneRepMax: breakdown.oneRepMax,
      finalScore: breakdown.finalScore,
      weightUsedKg: usedKg,
      weightInputKg: weightKgInput,
      weightCapped: capped,
      modelMaxKg: maxKg,
    };
  } catch {
    return { ok: false };
  }
}

export type StrengthAssessmentComputeError =
  | 'missing-profile'
  | 'no-inputs'
  | 'pair-incomplete'
  | 'invalid-weight'
  | 'invalid-reps'
  | 'reps-out-of-range';

export interface StrengthLiftBranch {
  lift: StrengthLiftKey;
  /** Weight (kg) used in the formula after model ceiling. */
  weightKg: number;
  reps: number;
  oneRepMax: number;
  finalScore: number;
  /** True when `weightKg` was clamped from a higher parsed input. */
  weightCapped?: boolean;
  /** Parsed user weight before cap (present when `weightCapped`). */
  inputWeightKg?: number;
  /** Same movement model ceiling passed to i18n for cap notices (present when `weightCapped`). */
  modelMaxKg?: number;
}

export interface StrengthAssessmentBreakdown {
  branches: StrengthLiftBranch[];
  /** Fixed-denominator composite: sum of per-lift `finalScore` (missing slot = 0) / 5, `round2`. */
  averageRaw: number;
}

function parsePositiveKg(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseReps(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function isValidStrengthRepsForScoring(r: number): boolean {
  return Number.isInteger(r) && r >= 1 && r <= STRENGTH_ASSESSMENT_MAX_REPS;
}

/** When weight is a valid positive kg and reps are an integer in [nudgeFrom, max], suggest using a lower-rep set if available. */
export function shouldShowStrengthRepsAccuracyNudge(weightStr: string, repsStr: string): boolean {
  const w = parsePositiveKg(weightStr);
  if (w === null) return false;
  const r = parseReps(repsStr);
  if (r === null || !isValidStrengthRepsForScoring(r)) return false;
  return r >= STRENGTH_REPS_ACCURACY_NUDGE_FROM_REP;
}

function isRowEmpty(weightStr: string, repsStr: string): boolean {
  return weightStr.trim() === '' && repsStr.trim() === '';
}

function isRowPartial(weightStr: string, repsStr: string): boolean {
  const w = weightStr.trim() !== '';
  const r = repsStr.trim() !== '';
  return w !== r;
}

export type StrengthFormRow = { weight: string; reps: string };
export type StrengthFormStrings = Record<StrengthLiftKey, StrengthFormRow>;

export function strengthFormFromPersisted(
  persisted: StrengthInputsPersisted | null | undefined
): StrengthFormStrings {
  const lifts = persisted?.lifts ?? {};
  return STRENGTH_LIFT_KEYS.reduce((acc, key) => {
    const v = lifts[key];
    acc[key] = {
      weight: v?.weightKg != null && Number.isFinite(v.weightKg) ? String(v.weightKg) : '',
      reps: v?.reps != null && Number.isFinite(v.reps) ? String(v.reps) : '',
    };
    return acc;
  }, {} as StrengthFormStrings);
}

export function persistedFromStrengthForm(
  form: StrengthFormStrings,
  bodyWeightKgSnapshot: number
): StrengthInputsPersisted {
  const lifts: StrengthNumericLifts = {};
  for (const key of STRENGTH_LIFT_KEYS) {
    const w = parsePositiveKg(form[key].weight);
    const r = parseReps(form[key].reps);
    if (w !== null && r !== null && isValidStrengthRepsForScoring(r)) {
      const { usedKg } = clampStrengthWeightKg(key, w);
      lifts[key] = { weightKg: usedKg, reps: r };
    }
  }
  const out: StrengthInputsPersisted = { bodyWeightKgSnapshot };
  if (Object.keys(lifts).length > 0) {
    out.lifts = lifts;
  }
  return out;
}

/** Per-row interactive scoring (one lift only). */
export type StrengthSingleLiftError =
  | 'missing-profile'
  | 'empty-row'
  | 'pair-incomplete'
  | 'invalid-weight'
  | 'invalid-reps'
  | 'reps-out-of-range';

export function tryComputeSingleLiftStrength(args: {
  lift: StrengthLiftKey;
  form: StrengthFormStrings;
  profile: PhysicalProfile | null;
  profileReady: boolean;
}):
  | {
      ok: true;
      oneRepMax: number;
      finalScore: number;
      weightUsedKg: number;
      weightInputKg: number;
      weightCapped: boolean;
      modelMaxKg: number;
    }
  | { ok: false; error: StrengthSingleLiftError } {
  const { lift, form, profile, profileReady } = args;
  if (!profileReady || !profile || !isPhysicalProfileComplete(profile)) {
    return { ok: false, error: 'missing-profile' };
  }

  const { weight, reps } = form[lift];
  if (isRowEmpty(weight, reps)) {
    return { ok: false, error: 'empty-row' };
  }
  if (isRowPartial(weight, reps)) {
    return { ok: false, error: 'pair-incomplete' };
  }

  const w = parsePositiveKg(weight);
  if (w === null) {
    return { ok: false, error: 'invalid-weight' };
  }
  const r = parseReps(reps);
  if (r === null) {
    return { ok: false, error: 'invalid-reps' };
  }
  if (!Number.isInteger(r)) {
    return { ok: false, error: 'invalid-reps' };
  }
  if (!isValidStrengthRepsForScoring(r)) {
    return { ok: false, error: 'reps-out-of-range' };
  }

  const scored = tryScoreLiftNumbers(profile, lift, w, r);
  if (!scored.ok) {
    return { ok: false, error: 'invalid-weight' };
  }
  return {
    ok: true,
    oneRepMax: scored.oneRepMax,
    finalScore: scored.finalScore,
    weightUsedKg: scored.weightUsedKg,
    weightInputKg: scored.weightInputKg,
    weightCapped: scored.weightCapped,
    modelMaxKg: scored.modelMaxKg,
  };
}

type ComputeStrengthMode = 'strict' | 'forgiving';

type ComputeStrengthNumericResult =
  | { ok: true; branches: StrengthLiftBranch[]; averageRaw: number }
  | { ok: false; reason: 'no-valid-lift' }
  | { ok: false; reason: 'scoring-failed' };

function computeStrengthResultFromNumericLifts(
  profile: PhysicalProfile,
  lifts: Partial<Record<StrengthLiftKey, StrengthLiftPersisted>> | undefined,
  mode: ComputeStrengthMode
): ComputeStrengthNumericResult {
  const branches: StrengthLiftBranch[] = [];
  let sumForComposite = 0;
  for (const key of STRENGTH_LIFT_KEYS) {
    const cell = lifts?.[key];
    if (!cell) {
      continue;
    }
    const w = cell.weightKg;
    const r = cell.reps;
    if (w === undefined || r === undefined) continue;
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r <= 0) continue;
    if (!isValidStrengthRepsForScoring(r)) continue;
    const scored = tryScoreLiftNumbers(profile, key, w, r);
    if (!scored.ok) {
      if (mode === 'strict') {
        return { ok: false, reason: 'scoring-failed' };
      }
      continue;
    }
    sumForComposite += scored.finalScore;
    branches.push({
      lift: key,
      weightKg: scored.weightUsedKg,
      reps: r,
      oneRepMax: scored.oneRepMax,
      finalScore: scored.finalScore,
      ...(scored.weightCapped
        ? {
            weightCapped: true,
            inputWeightKg: scored.weightInputKg,
            modelMaxKg: scored.modelMaxKg,
          }
        : {}),
    });
  }
  if (branches.length === 0) {
    return { ok: false, reason: 'no-valid-lift' };
  }
  const averageRaw = Math.round((sumForComposite / STRENGTH_COMPOSITE_FIXED_DENOMINATOR) * 100) / 100;
  return { ok: true, branches, averageRaw };
}

/**
 * Forgiving parse of persisted strength cells — shared by radar merge, ladder raw, and total-five score.
 */
export function computeStrengthBranchesFromPersisted(
  profile: PhysicalProfile | null | undefined,
  inputs: StrengthInputsPersisted | null | undefined
): StrengthLiftBranch[] | null {
  if (!profile || !isPhysicalProfileComplete(profile)) return null;
  const lifts = inputs?.lifts;
  if (!lifts || Object.keys(lifts).length === 0) return null;
  const computed = computeStrengthResultFromNumericLifts(profile, lifts, 'forgiving');
  if (!computed.ok) return null;
  return computed.branches;
}

/** Squat / bench / dead only — stable order for SBD totals. */
const STRENGTH_SBD_LIFT_KEYS = ['squat', 'benchPress', 'deadlift'] as const satisfies readonly StrengthLiftKey[];

/**
 * Sum of estimated 1RM (kg) for squat + bench + deadlift only.
 * WHY: `strength` Firestore shard ranks by raw total mass moved, not radar model average score.
 * IMPACT: Returns null unless all three lifts resolve from persisted cells (same bar as a real SBD total).
 */
export function computeStrengthSbdOneRmSumKg(
  profile: PhysicalProfile | null | undefined,
  inputs: StrengthInputsPersisted | null | undefined
): number | null {
  const branches = computeStrengthBranchesFromPersisted(profile, inputs);
  if (!branches?.length) return null;
  let sum = 0;
  for (const key of STRENGTH_SBD_LIFT_KEYS) {
    const b = branches.find((x) => x.lift === key);
    if (!b || !Number.isFinite(b.oneRepMax) || b.oneRepMax <= 0) return null;
    sum += b.oneRepMax;
  }
  return Number.isFinite(sum) && sum > 0 ? Math.round(sum * 10) / 10 : null;
}

/**
 * Five-lift ladder composite: identical to the strength radar axis from saved lifts.
 * WHY: `strength_totalFive` shard must match {@link resolveStrengthScoreFromInputs} (sum / 5, then clamp).
 */
export function computeStrengthFiveLiftLadderMeanScore(
  profile: PhysicalProfile | null | undefined,
  inputs: StrengthInputsPersisted | null | undefined
): number | null {
  return resolveStrengthScoreFromInputs(profile, inputs);
}


/** kg label for strength diagnostics (mean 1RM vs five-lift 1RM sum); not written to leaderboard rows. */
export interface StrengthLadderWeightKgSummary {
  weightKg: number;
  unit: 'kg';
}

/**
 * `composite` = sum of 1RM per five lift slots (missing = 0) / 5; `fiveTotal` = sum of 1RM for filled lifts.
 * NOTE: Firestore `strength` / `strength_totalFive` shards use {@link computeStrengthSbdOneRmSumKg} and
 * {@link computeStrengthFiveLiftLadderMeanScore} respectively — this helper is diagnostics / UI copy only.
 */
export function resolveStrengthLadderWeightKgSummary(
  profile: PhysicalProfile | null | undefined,
  inputs: StrengthInputsPersisted | null | undefined,
  variant: 'composite' | 'fiveTotal'
): StrengthLadderWeightKgSummary | undefined {
  const branches = computeStrengthBranchesFromPersisted(profile, inputs);
  if (!branches?.length) return undefined;
  const byLift = new Map(branches.map((b) => [b.lift, b] as const));
  let sumSlots = 0;
  for (const key of STRENGTH_LIFT_KEYS) {
    const b = byLift.get(key);
    if (b && Number.isFinite(b.oneRepMax) && b.oneRepMax > 0) {
      sumSlots += b.oneRepMax;
    }
  }
  if (!Number.isFinite(sumSlots) || sumSlots <= 0) return undefined;
  const sumOneRm = branches.reduce((a, b) => a + b.oneRepMax, 0);
  if (!Number.isFinite(sumOneRm) || sumOneRm <= 0) return undefined;
  const weightKg =
    variant === 'composite'
      ? Math.round((sumSlots / STRENGTH_COMPOSITE_FIXED_DENOMINATOR) * 10) / 10
      : Math.round(sumOneRm * 10) / 10;
  return { weightKg, unit: 'kg' };
}

/** Recompute strength axis from saved lifts + profile; null if nothing valid to score. */
export function resolveStrengthScoreFromInputs(
  profile: PhysicalProfile | null | undefined,
  inputs: StrengthInputsPersisted | null | undefined
): number | null {
  if (!profile || !isPhysicalProfileComplete(profile)) return null;
  const computed = computeStrengthResultFromNumericLifts(profile, inputs?.lifts, 'forgiving');
  if (!computed.ok) return null;
  return clampScoreMapValue(computed.averageRaw);
}

export function mergeScoreMapWithResolvedStrength(
  scores: ScoreMap,
  profile: PhysicalProfile | null | undefined,
  inputs: StrengthInputsPersisted | null | undefined
): ScoreMap {
  const resolved = resolveStrengthScoreFromInputs(profile, inputs);
  if (resolved === null) return { ...scores };
  return { ...scores, strength: resolved };
}

export function tryComputeStrengthAssessmentScore(args: {
  form: StrengthFormStrings;
  profile: PhysicalProfile | null;
  profileReady: boolean;
}):
  | {
      ok: true;
      score: number;
      breakdown: StrengthAssessmentBreakdown;
      persisted: StrengthInputsPersisted;
    }
  | { ok: false; error: StrengthAssessmentComputeError } {
  const { form, profile, profileReady } = args;
  if (!profileReady || !profile || !isPhysicalProfileComplete(profile)) {
    return { ok: false, error: 'missing-profile' };
  }

  for (const key of STRENGTH_LIFT_KEYS) {
    const { weight, reps } = form[key];
    if (isRowPartial(weight, reps)) {
      return { ok: false, error: 'pair-incomplete' };
    }
  }

  /** Parsed kg before clamp — `tryScoreLiftNumbers` applies ceilings so branches can show cap notices. */
  const numericLifts: StrengthNumericLifts = {};
  for (const key of STRENGTH_LIFT_KEYS) {
    const { weight, reps } = form[key];
    if (isRowEmpty(weight, reps)) continue;

    const w = parsePositiveKg(weight);
    if (w === null) {
      return { ok: false, error: 'invalid-weight' };
    }
    const r = parseReps(reps);
    if (r === null) {
      return { ok: false, error: 'invalid-reps' };
    }
    if (!Number.isInteger(r)) {
      return { ok: false, error: 'invalid-reps' };
    }
    if (!isValidStrengthRepsForScoring(r)) {
      return { ok: false, error: 'reps-out-of-range' };
    }
    numericLifts[key] = { weightKg: w, reps: r };
  }

  if (Object.keys(numericLifts).length === 0) {
    return { ok: false, error: 'no-inputs' };
  }

  const computed = computeStrengthResultFromNumericLifts(profile, numericLifts, 'strict');
  if (!computed.ok) {
    if (computed.reason === 'scoring-failed') {
      return { ok: false, error: 'invalid-weight' };
    }
    return { ok: false, error: 'no-inputs' };
  }

  const score = clampScoreMapValue(computed.averageRaw);
  const persisted = persistedFromStrengthForm(form, profile.weightKg);

  return {
    ok: true,
    score,
    breakdown: {
      branches: computed.branches,
      averageRaw: computed.averageRaw,
    },
    persisted,
  };
}
