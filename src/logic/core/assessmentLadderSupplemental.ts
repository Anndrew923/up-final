/**
 * Ephemeral assessment → ladder upload bundles (grip-style "calculate then sync").
 * WHY: Page preview lives in React state; `useMergedScoresFromLocalStores` only sees persisted store/inputs.
 */
import type { CardioAssessmentTab } from './cardioScoring';
import { tryComputeCardioAssessmentScore } from './cardioScoring';
import {
  LEADERBOARD_SHARD_FFMI,
  LEADERBOARD_SHARD_STRENGTH_TOTAL_FIVE,
  leaderboardShardForArmSize,
  leaderboardShardForCardioTab,
  leaderboardShardForSixAxisMetric,
  leaderboardShardForStrengthLift,
} from './assessmentLeaderboardShards';
import type { FfmiScoringBreakdown } from './ffmiScoring';
import { resolvePreviewRadarMetric } from './leaderboardPreviewContract';
import { resolveMuscleLadderScoreBundle, tryComputeMuscleAssessmentScore } from './muscleScoring';
import { resolveExplosiveLadderScoreBundle, tryComputeExplosiveAssessmentScore } from './powerScoring';
import {
  computeStrengthFiveLiftLadderMeanScore,
  computeStrengthSbdOneRmSumKg,
  persistedFromStrengthForm,
  resolveStrengthScoreFromInputs,
  tryComputeSingleLiftStrength,
  type StrengthFormStrings,
} from './strengthAssessment';
import {
  pushLeaderboardSyncTargetIfPositive,
  type LeaderboardSyncTarget,
} from './leaderboardSyncTargets';
import { clampScoreMapValue } from './scoring';
import type { ScoreMap, SixAxisMetric } from '../../types/scoring';
import type { PhysicalProfile } from '../../types/userProfile';
import type { PowerInputsPersisted } from '../../types/powerInputs';
import { STRENGTH_LIFT_KEYS } from '../../types/strengthInputs';

export interface AssessmentLadderUploadBundle {
  supplemental: LeaderboardSyncTarget[];
  /** Fresh six-axis slots for preview + overall before shard-specific ladder rows. */
  mergedOverrides?: Partial<ScoreMap>;
}

/** Maps supplemental shard scores onto six-axis keys for `mergedForUpload` / preview snapshot. */
export function applySupplementalTargetsToMergedScores(
  baseMerged: ScoreMap,
  supplemental: LeaderboardSyncTarget[] | undefined
): ScoreMap {
  if (!supplemental?.length) return { ...baseMerged };
  const next: ScoreMap = { ...baseMerged };
  for (const { metric, score } of supplemental) {
    const axis = resolvePreviewRadarMetric(metric);
    if (!axis || !Number.isFinite(score) || score <= 0) continue;
    next[axis] = clampScoreMapValue(score);
  }
  return next;
}

function applyOverrides(base: ScoreMap, overrides: Partial<ScoreMap> | undefined): ScoreMap {
  if (!overrides) return { ...base };
  const next: ScoreMap = { ...base };
  for (const key of Object.keys(overrides) as SixAxisMetric[]) {
    const v = overrides[key];
    if (v != null && Number.isFinite(v) && v > 0) {
      next[key] = clampScoreMapValue(v);
    }
  }
  return next;
}

/**
 * Preview/store merge + supplemental shard axis overlay — single upload truth for hook + preview.
 * Order: persisted `baseMerged` → `mergedOverrides` → supplemental axis map (shard wins on conflict).
 */
export function mergeMergedScoresForAssessmentUpload(
  baseMerged: ScoreMap,
  bundle?: AssessmentLadderUploadBundle | null
): ScoreMap {
  const withOverrides = applyOverrides(baseMerged, bundle?.mergedOverrides);
  return applySupplementalTargetsToMergedScores(withOverrides, bundle?.supplemental);
}

export function buildFfmiAssessmentSupplementalTargets(
  breakdown: FfmiScoringBreakdown | null | undefined
): AssessmentLadderUploadBundle {
  if (!breakdown?.allowsRadarSubmit) {
    return { supplemental: [] };
  }
  const score = breakdown.submittedScore;
  if (!Number.isFinite(score) || score <= 0) {
    return { supplemental: [] };
  }
  const clamped = clampScoreMapValue(score);
  return {
    supplemental: [{ metric: LEADERBOARD_SHARD_FFMI, score: clamped }],
    mergedOverrides: { bodyFat: clamped },
  };
}

export function buildCardioAssessmentSupplementalTargets(args: {
  tab: CardioAssessmentTab;
  distanceInput: string;
  runMinutesInput: string;
  runSecondsInput: string;
  profile: PhysicalProfile | null;
  profileReady: boolean;
}): AssessmentLadderUploadBundle {
  const result = tryComputeCardioAssessmentScore({
    tab: args.tab,
    distanceInput: args.distanceInput,
    runMinutesInput: args.runMinutesInput,
    runSecondsInput: args.runSecondsInput,
    profile: args.profile,
    profileReady: args.profileReady,
  });
  if (!result.ok) {
    return { supplemental: [] };
  }
  const score = clampScoreMapValue(result.score);
  const tabKey = args.tab === 'cooper' ? 'cooper' : '5km';
  return {
    supplemental: [{ metric: leaderboardShardForCardioTab(tabKey), score }],
    mergedOverrides: { cardio: score },
  };
}

export function buildMuscleAssessmentSupplementalTargets(args: {
  smmInput: string;
  profile: PhysicalProfile | null;
  profileReady: boolean;
}): AssessmentLadderUploadBundle {
  const result = tryComputeMuscleAssessmentScore({
    smmInput: args.smmInput,
    profile: args.profile,
    profileReady: args.profileReady,
  });
  if (!result.ok) {
    return { supplemental: [] };
  }

  const smmKg = Number(parseFloat(args.smmInput.trim()));
  const inputs =
    Number.isFinite(smmKg) && smmKg > 0 ? { muscle: { smmKg } } : null;
  const ladder = resolveMuscleLadderScoreBundle(args.profile, inputs);
  const supplemental: LeaderboardSyncTarget[] = [];
  pushLeaderboardSyncTargetIfPositive(supplemental, 'muscleMass', ladder.composite);
  pushLeaderboardSyncTargetIfPositive(supplemental, 'muscleMass_weightKg', ladder.weightBranchScore);
  pushLeaderboardSyncTargetIfPositive(supplemental, 'muscleMass_ratio', ladder.ratioBranchScore);

  const axisScore = ladder.composite ?? result.score;
  return {
    supplemental,
    mergedOverrides: { muscleMass: clampScoreMapValue(axisScore) },
  };
}

export function buildExplosiveAssessmentSupplementalTargets(args: {
  verticalJumpInput: string;
  standingLongJumpInput: string;
  sprintInput: string;
  profile: PhysicalProfile | null;
  profileReady: boolean;
}): AssessmentLadderUploadBundle {
  const result = tryComputeExplosiveAssessmentScore({
    verticalJumpInput: args.verticalJumpInput,
    standingLongJumpInput: args.standingLongJumpInput,
    sprintInput: args.sprintInput,
    profile: args.profile,
    profileReady: args.profileReady,
  });
  if (!result.ok) {
    return { supplemental: [] };
  }

  const persisted: PowerInputsPersisted = { explosivePower: result.persisted };
  const ladder = resolveExplosiveLadderScoreBundle(args.profile, persisted);
  const supplemental: LeaderboardSyncTarget[] = [];
  pushLeaderboardSyncTargetIfPositive(supplemental, 'explosive_composite', ladder.composite);
  pushLeaderboardSyncTargetIfPositive(supplemental, 'explosive_vertical', ladder.vertical);
  pushLeaderboardSyncTargetIfPositive(supplemental, 'explosive_broad', ladder.broad);
  pushLeaderboardSyncTargetIfPositive(supplemental, 'explosive_sprint', ladder.sprint);

  const axisScore = ladder.composite ?? result.score;
  return {
    supplemental,
    mergedOverrides: { explosivePower: clampScoreMapValue(axisScore) },
  };
}

export function buildStrengthAssessmentSupplementalTargets(args: {
  form: StrengthFormStrings;
  profile: PhysicalProfile | null;
  profileReady: boolean;
  combinedScore: number | null;
}): AssessmentLadderUploadBundle {
  if (!args.profileReady || !args.profile) {
    return { supplemental: [] };
  }

  const persisted = persistedFromStrengthForm(args.form, args.profile.weightKg);
  const supplemental: LeaderboardSyncTarget[] = [];

  for (const lift of STRENGTH_LIFT_KEYS) {
    const res = tryComputeSingleLiftStrength({
      lift,
      form: args.form,
      profile: args.profile,
      profileReady: true,
    });
    if (res.ok) {
      pushLeaderboardSyncTargetIfPositive(
        supplemental,
        leaderboardShardForStrengthLift(lift),
        res.finalScore
      );
    }
  }

  pushLeaderboardSyncTargetIfPositive(
    supplemental,
    'strength',
    computeStrengthSbdOneRmSumKg(args.profile, persisted)
  );
  const totalFive =
    args.combinedScore != null && Number.isFinite(args.combinedScore) && args.combinedScore > 0
      ? args.combinedScore
      : computeStrengthFiveLiftLadderMeanScore(args.profile, persisted);
  pushLeaderboardSyncTargetIfPositive(supplemental, LEADERBOARD_SHARD_STRENGTH_TOTAL_FIVE, totalFive);

  const strengthAxis = resolveStrengthScoreFromInputs(args.profile, persisted);
  const mergedOverrides: Partial<ScoreMap> = {};
  if (strengthAxis != null && strengthAxis > 0) {
    mergedOverrides.strength = strengthAxis;
  }

  return {
    supplemental,
    mergedOverrides: Object.keys(mergedOverrides).length > 0 ? mergedOverrides : undefined,
  };
}

export function buildGripAssessmentSupplementalTargets(
  previewScore: number | null | undefined
): AssessmentLadderUploadBundle {
  if (previewScore == null || !Number.isFinite(previewScore) || previewScore <= 0) {
    return { supplemental: [] };
  }
  const score = clampScoreMapValue(previewScore);
  return {
    supplemental: [{ metric: leaderboardShardForSixAxisMetric('gripStrength'), score }],
    mergedOverrides: { gripStrength: score },
  };
}

/**
 * Arm size is a dedicated ladder shard only — excluded from `SIX_AXIS_METRICS` / overall.
 * WHY: No `mergedOverrides`; preview snapshot keeps other axes from store while arm shard updates.
 */
export function buildArmSizeAssessmentSupplementalTargets(args: {
  previewScore: number | null;
  submittedScore: number | null;
}): AssessmentLadderUploadBundle {
  const raw = args.previewScore ?? args.submittedScore;
  if (raw == null || !Number.isFinite(raw) || raw <= 0) {
    return { supplemental: [] };
  }
  const score = clampScoreMapValue(raw);
  return {
    supplemental: [{ metric: leaderboardShardForArmSize(), score }],
  };
}
