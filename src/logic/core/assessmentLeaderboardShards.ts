import {
  getLeaderboardShardId,
  LADDER_PROJECT_NONE,
  type LeaderboardShardId,
} from './ladderShards';
import type { SixAxisMetric } from '../../types/scoring';
import type { StrengthLiftKey } from '../../types/strengthInputs';

/** Firestore shard for the composite score shown on Home radar / `ladderScore` division. */
export const LEADERBOARD_SHARD_OVERALL = 'ladderScore' as const satisfies LeaderboardShardId;

/** FFMI 評測寫入雷達使用 `bodyFat` 軸，但天梯榜單細項為 FFMI 分片。 */
export const LEADERBOARD_SHARD_FFMI = 'bodyFat_ffmi' as const satisfies LeaderboardShardId;

/** 五項槓鈴 model 分數「平均」榜（`stats_sbdTotal` → `total_five` → `strength_totalFive`）。 */
export const LEADERBOARD_SHARD_STRENGTH_TOTAL_FIVE: LeaderboardShardId = getLeaderboardShardId(
  'stats_sbdTotal',
  'total_five'
);

/** Radar explosive axis → composite leaderboard shard (not the vertical-only shard). */
export const LEADERBOARD_SHARD_EXPLOSIVE_COMPOSITE: LeaderboardShardId = getLeaderboardShardId(
  'stats_vertical',
  'composite'
);

/**
 * Maps a core six-axis radar metric to the default leaderboard shard used for uploads.
 * Aligns with `getLeaderboardShardId` defaults for each fitness division.
 * NOTE: `strength` shard stores **SBD 1RM kg 加總** (see `computeStrengthSbdOneRmSumKg`), not the radar strength score.
 */
export function leaderboardShardForSixAxisMetric(metric: SixAxisMetric): LeaderboardShardId {
  switch (metric) {
    case 'strength':
      return getLeaderboardShardId('stats_sbdTotal', 'total');
    case 'cardio':
      return getLeaderboardShardId('stats_cooper', 'cooper');
    case 'explosivePower':
      return LEADERBOARD_SHARD_EXPLOSIVE_COMPOSITE;
    case 'muscleMass':
      return getLeaderboardShardId('stats_ffmi', 'score');
    case 'bodyFat':
      return getLeaderboardShardId('stats_bodyFat', 'ffmi');
    case 'gripStrength':
      return getLeaderboardShardId('stats_grip', 'grip');
    default: {
      const _exhaustive: never = metric;
      return _exhaustive;
    }
  }
}

export function leaderboardShardForCardioTab(tab: 'cooper' | '5km'): LeaderboardShardId {
  return tab === '5km'
    ? getLeaderboardShardId('stats_cooper', '5km')
    : getLeaderboardShardId('stats_cooper', 'cooper');
}

export function leaderboardShardForArmSize(): LeaderboardShardId {
  return getLeaderboardShardId('armSize', LADDER_PROJECT_NONE);
}

/** `stats_sbdTotal` 子選項 → Firestore 細項分片（臥推、深蹲等）。 */
export function leaderboardShardForStrengthLift(lift: StrengthLiftKey): LeaderboardShardId {
  const project: Record<StrengthLiftKey, 'squat' | 'bench' | 'deadlift' | 'ohp' | 'latPull'> = {
    squat: 'squat',
    benchPress: 'bench',
    deadlift: 'deadlift',
    shoulderPress: 'ohp',
    latPulldown: 'latPull',
  };
  return getLeaderboardShardId('stats_sbdTotal', project[lift]);
}
