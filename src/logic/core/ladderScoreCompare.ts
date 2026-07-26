import type { LeaderboardShardId } from './ladderShards';
import type { SixAxisMetric } from '../../types/scoring';

/**
 * Ladder write equality — 2dp normalize (aligned with radar / overall display).
 * WHY: Skip Firestore writes when the public score is unchanged; still allow worse scores for rank trials.
 */
export function normalizeLadderScoreForCompare(score: number): number {
  return Math.round(score * 100) / 100;
}

export function scoresEqualForLadderWrite(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return normalizeLadderScoreForCompare(a) === normalizeLadderScoreForCompare(b);
}

/**
 * List-row `scoreBest` is only comparable to preview when the shard stores the same
 * semantic as a radar axis (or overall average). Branch shards (kg / ratio / lifts)
 * intentionally diverge from composite radar — never flag those as drift.
 */
export type LadderPreviewComparable =
  | { kind: 'overall' }
  | { kind: 'axis'; metric: SixAxisMetric };

export function resolveLadderPreviewComparable(
  shardId: LeaderboardShardId | null | undefined
): LadderPreviewComparable | null {
  if (!shardId) return null;
  switch (shardId) {
    case 'ladderScore':
      return { kind: 'overall' };
    case 'muscleMass':
      return { kind: 'axis', metric: 'muscleMass' };
    case 'gripStrength':
      return { kind: 'axis', metric: 'gripStrength' };
    case 'bodyFat':
    case 'bodyFat_ffmi':
      return { kind: 'axis', metric: 'bodyFat' };
    case 'explosivePower':
    case 'explosive_composite':
      return { kind: 'axis', metric: 'explosivePower' };
    case 'strength_totalFive':
      return { kind: 'axis', metric: 'strength' };
    case 'cardio':
      return { kind: 'axis', metric: 'cardio' };
    default:
      return null;
  }
}

function isPositiveFiniteScore(score: number | null | undefined): score is number {
  return score != null && Number.isFinite(score) && score > 0;
}

/**
 * True when the overall-board row score and preview-derived six-axis average disagree (2dp).
 * WHY: Safety net if legacy data or a failed shard leaves `ladderScore` out of sync with `radarScores`.
 */
export function isLadderOverallEntryDriftFromPreview(
  entryScoreBest: number | null | undefined,
  previewOverall: number | null | undefined
): boolean {
  if (!isPositiveFiniteScore(entryScoreBest) || !isPositiveFiniteScore(previewOverall)) {
    return false;
  }
  return !scoresEqualForLadderWrite(entryScoreBest, previewOverall);
}

export type LadderEntryPreviewDriftResult = {
  drifted: boolean;
  comparable: LadderPreviewComparable | null;
  /** Preview-side score used for comparison (overall avg or axis). */
  previewScore: number | null;
};

/**
 * Detect list entry vs `leaderboard_previews` drift for the active shard.
 * WHY: Users tapping a muscle (etc.) row must not see scoreBest 116 vs radar axis 91 with no explanation.
 */
export function resolveLadderEntryPreviewDrift(params: {
  shardId: LeaderboardShardId | null | undefined;
  entryScoreBest: number | null | undefined;
  previewOverall: number | null | undefined;
  previewRadarScores?: Partial<Record<SixAxisMetric, number>> | null;
}): LadderEntryPreviewDriftResult {
  const comparable = resolveLadderPreviewComparable(params.shardId);
  if (!comparable || !isPositiveFiniteScore(params.entryScoreBest)) {
    return { drifted: false, comparable, previewScore: null };
  }

  if (comparable.kind === 'overall') {
    const previewScore = isPositiveFiniteScore(params.previewOverall)
      ? params.previewOverall
      : null;
    return {
      drifted: isLadderOverallEntryDriftFromPreview(params.entryScoreBest, previewScore),
      comparable,
      previewScore,
    };
  }

  const axisRaw = params.previewRadarScores?.[comparable.metric];
  const previewScore = isPositiveFiniteScore(axisRaw) ? axisRaw : null;
  if (previewScore == null) {
    return { drifted: false, comparable, previewScore: null };
  }

  return {
    drifted: !scoresEqualForLadderWrite(params.entryScoreBest, previewScore),
    comparable,
    previewScore,
  };
}
