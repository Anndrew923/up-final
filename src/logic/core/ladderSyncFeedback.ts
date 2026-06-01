import type {
  LadderSyncShardFailure,
  LeaderboardSyncRunSummary,
} from './leaderboardSyncTargets';

/** Show batch sync UI when shards ran or a preflight failure (e.g. avatar upload) blocked the batch. */
export function shouldShowLadderSyncFeedback(
  summary: LeaderboardSyncRunSummary | null,
  failures: readonly LadderSyncShardFailure[]
): boolean {
  if (failures.length > 0) return summary !== null;
  return summary !== null && summary.attempted > 0;
}

export function hasAvatarUploadSyncFailure(failures: readonly LadderSyncShardFailure[]): boolean {
  return failures.some((f) => f.reason === 'avatar-upload-failed');
}
