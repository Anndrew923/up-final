/**
 * Five-lift strength assessment — DOTS / anchor pipeline lives in `scoring.ts`.
 *
 * WHY one internal scorer (`computeStrengthResultFromNumericLifts`):
 * - Preview/submit (`tryComputeStrengthAssessmentScore`) and Home merge (`resolveStrengthScoreFromInputs`)
 *   must stay bitwise-identical on valid data; divergent loops were technical debt.
 * - `forgiving` mode skips corrupt persisted cells (merge must not brick the radar); `strict` surfaces the first formula failure for interactive UX.
 * - `tryScoreLiftNumbers` is the only call site wrapping `calculateStrengthScore` for per-lift math (single-row UI + batch merge).
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

const MAX_REPS = 10;

const LIFT_TO_EXERCISE: Record<StrengthLiftKey, ExerciseType> = {
  benchPress: 'Bench Press',
  squat: 'Squat',
  deadlift: 'Deadlift',
  latPulldown: 'Lat Pulldown',
  shoulderPress: 'Overhead Press',
};

type StrengthNumericLifts = Partial<Record<StrengthLiftKey, { weightKg: number; reps: number }>>;

/** Single choke point for `calculateStrengthScore` (single-lift + batch merge). */
function tryScoreLiftNumbers(
  profile: PhysicalProfile,
  lift: StrengthLiftKey,
  weightKg: number,
  reps: number
): { ok: true; oneRepMax: number; finalScore: number } | { ok: false } {
  try {
    const breakdown = calculateStrengthScore({
      exerciseType: LIFT_TO_EXERCISE[lift],
      weight: weightKg,
      reps,
      bodyWeight: profile.weightKg,
      gender: profile.gender,
      age: profile.age,
    });
    return { ok: true, oneRepMax: breakdown.oneRepMax, finalScore: breakdown.finalScore };
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
  weightKg: number;
  reps: number;
  oneRepMax: number;
  finalScore: number;
}

export interface StrengthAssessmentBreakdown {
  branches: StrengthLiftBranch[];
  /** Mean of per-lift `finalScore` for completed lifts only. */
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
    if (w !== null && r !== null) {
      lifts[key] = { weightKg: w, reps: r };
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
  | { ok: true; oneRepMax: number; finalScore: number }
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
  if (r < 1 || r > MAX_REPS) {
    return { ok: false, error: 'reps-out-of-range' };
  }

  const scored = tryScoreLiftNumbers(profile, lift, w, r);
  if (!scored.ok) {
    return { ok: false, error: 'invalid-weight' };
  }
  return { ok: true, oneRepMax: scored.oneRepMax, finalScore: scored.finalScore };
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
  for (const key of STRENGTH_LIFT_KEYS) {
    const cell = lifts?.[key];
    if (!cell) continue;
    const w = cell.weightKg;
    const r = cell.reps;
    if (w === undefined || r === undefined) continue;
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r <= 0) continue;
    if (r > MAX_REPS || r < 1) continue;
    const scored = tryScoreLiftNumbers(profile, key, w, r);
    if (!scored.ok) {
      if (mode === 'strict') {
        return { ok: false, reason: 'scoring-failed' };
      }
      continue;
    }
    branches.push({
      lift: key,
      weightKg: w,
      reps: r,
      oneRepMax: scored.oneRepMax,
      finalScore: scored.finalScore,
    });
  }
  if (branches.length === 0) {
    return { ok: false, reason: 'no-valid-lift' };
  }
  const averageRaw = branches.reduce((acc, b) => acc + b.finalScore, 0) / branches.length;
  return { ok: true, branches, averageRaw };
}

/** Recompute strength axis from saved lifts + profile; null if nothing valid to score. */
export function resolveStrengthScoreFromInputs(
  profile: PhysicalProfile | null | undefined,
  inputs: StrengthInputsPersisted | null | undefined
): number | null {
  if (!isPhysicalProfileComplete(profile) || !profile) return null;
  const lifts = inputs?.lifts;
  if (!lifts || Object.keys(lifts).length === 0) return null;

  const computed = computeStrengthResultFromNumericLifts(profile, lifts, 'forgiving');
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
    if (r < 1 || r > MAX_REPS) {
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
