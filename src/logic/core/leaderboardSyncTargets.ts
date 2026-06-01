import type { CardioInputsPersisted } from '../../types/cardioInputs';
import type { MuscleInputsPersisted } from '../../types/muscleInputs';
import type { PowerInputsPersisted } from '../../types/powerInputs';
import type { ScoreMap } from '../../types/scoring';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import type { StrengthInputsPersisted } from '../../types/strengthInputs';
import type { PhysicalProfile } from '../../types/userProfile';
import { STRENGTH_LIFT_KEYS } from '../../types/strengthInputs';
import { isPhysicalProfileComplete } from './physicalProfile';
import {
  LEADERBOARD_SHARD_FFMI,
  LEADERBOARD_SHARD_OVERALL,
  LEADERBOARD_SHARD_STRENGTH_TOTAL_FIVE,
  leaderboardShardForArmSize,
  leaderboardShardForCardioTab,
  leaderboardShardForSixAxisMetric,
  leaderboardShardForStrengthLift,
} from './assessmentLeaderboardShards';
import { calculate5KmScore, calculateCooperScore } from './cardioScoring';
import type { LeaderboardShardId } from './ladderShards';
import { resolveMuscleLadderScoreBundle } from './muscleScoring';
import { resolveExplosiveLadderScoreBundle } from './powerScoring';
import {
  computeStrengthFiveLiftLadderMeanScore,
  computeStrengthSbdOneRmSumKg,
  strengthFormFromPersisted,
  tryComputeSingleLiftStrength,
} from './strengthAssessment';

export interface LeaderboardSyncTarget {
  metric: LeaderboardShardId;
  score: number;
}

function pushIfPositive(
  targets: LeaderboardSyncTarget[],
  metric: LeaderboardShardId,
  score: number | undefined
): void {
  if (score == null || !Number.isFinite(score) || score <= 0) return;
  targets.push({ metric, score });
}

/**
 * Per-lift ladder shards (`strength_bench`, …) — same scorer as the strength assessment page single-row preview.
 * WHY: Each lift has its own shard; the `strength` (SBD total kg) shard is filled separately from `mergedScores.strength`.
 */
function appendPerLiftStrengthLeaderboardTargets(
  targets: LeaderboardSyncTarget[],
  profile: PhysicalProfile | null | undefined,
  strengthInputs: StrengthInputsPersisted | null | undefined
): void {
  if (!profile || !isPhysicalProfileComplete(profile)) return;
  const form = strengthFormFromPersisted(strengthInputs);
  const profileReady = true;
  for (const lift of STRENGTH_LIFT_KEYS) {
    const res = tryComputeSingleLiftStrength({ lift, form, profile, profileReady });
    if (!res.ok) continue;
    pushIfPositive(targets, leaderboardShardForStrengthLift(lift), res.finalScore);
  }
}

/**
 * Cooper / 5 km each get their own shard when structured inputs produce a positive score.
 * When neither path yields a shard but `mergedScores.cardio` is set (e.g. legacy manual write),
 * falls back to the default Cooper shard so at least one cardio ladder can receive the value.
 */
export function appendCardioLeaderboardTargets(
  targets: LeaderboardSyncTarget[],
  profile: PhysicalProfile | null | undefined,
  inputs: CardioInputsPersisted | null | undefined,
  mergedCardio: number | undefined
): void {
  let addedFromStructured = 0;

  if (inputs) {
    const distanceMeters = Number(inputs.cardio?.distance);
    if (
      Number.isFinite(distanceMeters) &&
      distanceMeters > 0 &&
      profile?.age != null &&
      profile.gender
    ) {
      const s = calculateCooperScore({
        distanceMeters,
        age: profile.age,
        gender: profile.gender,
      });
      const len = targets.length;
      pushIfPositive(targets, leaderboardShardForCardioTab('cooper'), s);
      if (targets.length > len) addedFromStructured += 1;
    }

    const totalSeconds = Number(inputs.run_5km?.totalSeconds);
    if (Number.isFinite(totalSeconds) && totalSeconds > 0) {
      const s = calculate5KmScore({ totalSeconds, gender: profile?.gender });
      const len = targets.length;
      pushIfPositive(targets, leaderboardShardForCardioTab('5km'), s);
      if (targets.length > len) addedFromStructured += 1;
    }
  }

  if (
    addedFromStructured === 0 &&
    mergedCardio != null &&
    Number.isFinite(mergedCardio) &&
    mergedCardio > 0
  ) {
    pushIfPositive(targets, leaderboardShardForCardioTab('cooper'), mergedCardio);
  }
}

/**
 * Deterministic list of (shard, score) pairs for a one-shot ladder sync, aligned with
 * per-page uploads + sync-all: radar shards, per-lift strength, total-five, explosive + muscle branch shards, FFMI, dual cardio.
 */
function appendExplosiveLeaderboardTargets(
  targets: LeaderboardSyncTarget[],
  profile: PhysicalProfile | null | undefined,
  powerInputs: PowerInputsPersisted | null | undefined,
  mergedExplosiveAxis: number | undefined
): void {
  const b = resolveExplosiveLadderScoreBundle(profile, powerInputs);
  const composite =
    b.composite ??
    (mergedExplosiveAxis != null && Number.isFinite(mergedExplosiveAxis) && mergedExplosiveAxis > 0
      ? mergedExplosiveAxis
      : undefined);
  pushIfPositive(targets, 'explosive_composite', composite);
  pushIfPositive(targets, 'explosive_vertical', b.vertical ?? undefined);
  pushIfPositive(targets, 'explosive_broad', b.broad ?? undefined);
  pushIfPositive(targets, 'explosive_sprint', b.sprint ?? undefined);
}

function appendMuscleLeaderboardTargets(
  targets: LeaderboardSyncTarget[],
  profile: PhysicalProfile | null | undefined,
  muscleInputs: MuscleInputsPersisted | null | undefined,
  mergedMuscleAxis: number | undefined
): void {
  const b = resolveMuscleLadderScoreBundle(profile, muscleInputs);
  const composite =
    b.composite ??
    (mergedMuscleAxis != null && Number.isFinite(mergedMuscleAxis) && mergedMuscleAxis > 0
      ? mergedMuscleAxis
      : undefined);
  pushIfPositive(targets, 'muscleMass', composite);
  pushIfPositive(targets, 'muscleMass_weightKg', b.weightBranchScore ?? undefined);
  pushIfPositive(targets, 'muscleMass_ratio', b.ratioBranchScore ?? undefined);
}

/**
 * One-shot shard list for ladder uploads. Strength zone semantics:
 * - Shard `strength` (三項細項): **SBD 1RM kg 加總** — not the radar strength model score in `mergedScores.strength`.
 * - Shard `strength_totalFive`: five-lift model composite (sum of slot scores / 5), same as radar.
 */
export function buildLeaderboardSyncTargets(args: {
  mergedScores: ScoreMap;
  overallScore: number;
  profile: PhysicalProfile | null | undefined;
  cardioInputs: CardioInputsPersisted | null | undefined;
  strengthInputs?: StrengthInputsPersisted | null | undefined;
  powerInputs?: PowerInputsPersisted | null | undefined;
  muscleInputs?: MuscleInputsPersisted | null | undefined;
}): LeaderboardSyncTarget[] {
  const { mergedScores, overallScore, profile, cardioInputs, strengthInputs, muscleInputs } = args;
  const raw: LeaderboardSyncTarget[] = [];

  pushIfPositive(raw, LEADERBOARD_SHARD_OVERALL, overallScore);

  for (const metric of SIX_AXIS_METRICS) {
    if (metric === 'cardio') continue;
    if (metric === 'explosivePower') continue;
    if (metric === 'muscleMass') continue;
    if (metric === 'strength') continue;
    const score = mergedScores[metric];
    pushIfPositive(raw, leaderboardShardForSixAxisMetric(metric), score);
  }

  const sbdOneRmSumKg = computeStrengthSbdOneRmSumKg(profile, strengthInputs);
  pushIfPositive(raw, leaderboardShardForSixAxisMetric('strength'), sbdOneRmSumKg ?? undefined);

  const totalFiveScore = computeStrengthFiveLiftLadderMeanScore(profile, strengthInputs);
  pushIfPositive(raw, LEADERBOARD_SHARD_STRENGTH_TOTAL_FIVE, totalFiveScore ?? undefined);

  appendPerLiftStrengthLeaderboardTargets(raw, profile, strengthInputs);

  appendCardioLeaderboardTargets(raw, profile, cardioInputs, mergedScores.cardio);

  appendExplosiveLeaderboardTargets(raw, profile, args.powerInputs, mergedScores.explosivePower);

  appendMuscleLeaderboardTargets(raw, profile, muscleInputs, mergedScores.muscleMass);

  const arm = mergedScores.armSize;
  pushIfPositive(raw, leaderboardShardForArmSize(), arm);

  const bf = mergedScores.bodyFat;
  if (bf != null && Number.isFinite(bf) && bf > 0) {
    pushIfPositive(raw, LEADERBOARD_SHARD_FFMI, bf);
  }

  const dedup = new Map<LeaderboardShardId, number>();
  for (const row of raw) {
    dedup.set(row.metric, row.score);
  }

  return Array.from(dedup.entries()).map(([metric, score]) => ({ metric, score }));
}

/** Stable failure reasons returned by Callable batch + client sequential sync. */
export type LadderSyncFailureReason =
  | 'invalid-input'
  | 'rate-limited'
  | 'pro-required'
  | 'internal'
  | 'unknown'
  | 'anonymous';

/** Per-shard diagnostic row — mirrors Functions `runLadderSyncBatch` failures payload. */
export interface LadderSyncShardFailure {
  metric: string;
  reason: LadderSyncFailureReason | string;
  message?: string;
}

/** Outcome tallies for sequential multi-shard uploads (sync-all + per-assessment batch). */
export interface LeaderboardSyncRunSummary {
  attempted: number;
  updated: number;
  /** Score matched cloud row — no write, no quota consumed. */
  unchanged: number;
  /** Portrait-only merge on an existing entry (no score write, no hourly quota). */
  avatarPatched?: number;
  /**
   * Legacy aggregate for quick display: `invalidInput + internal` only.
   * WHY: Rate-limit and Pro blocks are counted separately and must not inflate "errors".
   */
  errors: number;
  /** Shard id / score rejected before or during validation (e.g. unknown metric on server). */
  invalidInput: number;
  /** Callable/Firestore/transaction failures — needs ops attention. */
  internal: number;
  rateLimited: number;
  proRequired: number;
}

export function createEmptyLeaderboardSyncRunSummary(): LeaderboardSyncRunSummary {
  return {
    attempted: 0,
    updated: 0,
    unchanged: 0,
    avatarPatched: 0,
    errors: 0,
    invalidInput: 0,
    internal: 0,
    rateLimited: 0,
    proRequired: 0,
  };
}

/**
 * Which Firestore shards belong to a single assessment surface (subset of `buildLeaderboardSyncTargets`).
 * WHY: One button per page must push the same shards that used to be separate `LeaderboardUploadBar` rows.
 */
export type AssessmentLadderSyncScope =
  | 'strength'
  | 'explosivePower'
  | 'muscleMass'
  | 'cardio'
  | 'armSize'
  | 'gripStrength'
  | 'bodyFat_ffmi';

const ASSESSMENT_SCOPE_SHARD_IDS: Record<AssessmentLadderSyncScope, readonly LeaderboardShardId[]> =
  {
    strength: [
      'strength',
      'strength_totalFive',
      'strength_squat',
      'strength_bench',
      'strength_deadlift',
      'strength_ohp',
      'strength_latPull',
    ],
    explosivePower: [
      'explosive_composite',
      'explosive_vertical',
      'explosive_broad',
      'explosive_sprint',
    ],
    muscleMass: ['muscleMass', 'muscleMass_weightKg', 'muscleMass_ratio'],
    cardio: ['cardio', 'cardio_5km'],
    armSize: ['armSize'],
    gripStrength: ['gripStrength'],
    bodyFat_ffmi: ['bodyFat_ffmi'],
  };

export function pickLeaderboardSyncTargetsForAssessmentScope(
  all: LeaderboardSyncTarget[],
  scope: AssessmentLadderSyncScope
): LeaderboardSyncTarget[] {
  const allow = new Set(ASSESSMENT_SCOPE_SHARD_IDS[scope]);
  return all.filter((t) => allow.has(t.metric));
}

/**
 * Merges optional page-local scores (e.g. arm preview before `scoreStore` write) over the filtered sync list.
 * Supplemental entries win on duplicate `metric`.
 */
export function mergeLeaderboardSyncTargetsWithSupplemental(
  base: LeaderboardSyncTarget[],
  supplemental: LeaderboardSyncTarget[] | undefined
): LeaderboardSyncTarget[] {
  if (!supplemental?.length) return base;
  const map = new Map<LeaderboardShardId, number>();
  for (const t of base) map.set(t.metric, t.score);
  for (const t of supplemental) {
    if (t.score > 0 && Number.isFinite(t.score)) map.set(t.metric, t.score);
  }
  return Array.from(map.entries()).map(([metric, score]) => ({ metric, score }));
}
