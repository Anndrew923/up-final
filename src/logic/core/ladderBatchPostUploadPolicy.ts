import { LEADERBOARD_SHARD_OVERALL } from './assessmentLeaderboardShards';
import type { LeaderboardShardId } from './ladderShards';
import type {
  LeaderboardSyncRunSummary,
  LeaderboardSyncTarget,
} from './leaderboardSyncTargets';

/** Shards whose session list cache should refresh after a successful ladder write. */
export function collectLadderCacheMetricsToClear(
  targets: readonly LeaderboardSyncTarget[],
  extra?: readonly LeaderboardShardId[]
): LeaderboardShardId[] {
  const set = new Set<LeaderboardShardId>([
    LEADERBOARD_SHARD_OVERALL,
    ...targets.map((t) => t.metric),
  ]);
  for (const metric of extra ?? []) {
    set.add(metric);
  }
  return [...set];
}

/**
 * WHY: All rate-limited / invalid with zero writes should not force ladder refetch or preview I/O.
 */
export function shouldInvalidateLadderCacheAfterBatch(
  summary: LeaderboardSyncRunSummary
): boolean {
  return summary.updated > 0 || (summary.avatarPatched ?? 0) > 0;
}

export function hasHttpsLeaderboardAvatar(avatarUrl?: string | null): boolean {
  return Boolean(avatarUrl?.trim().startsWith('https://'));
}

/**
 * Client preview fallback after batch — mirrors server `ladderSyncBatch` preview gate.
 */
export function shouldRunClientPreviewFallback(
  summary: LeaderboardSyncRunSummary,
  hasHttpsAvatar: boolean
): boolean {
  if (!hasHttpsAvatar || summary.attempted <= 0) return false;
  return summary.updated > 0 || (summary.avatarPatched ?? 0) > 0;
}

/**
 * When Callable batch ran preview successfully, skip duplicate client preview.
 * If server recorded a preview failure, allow client retry.
 */
export function inferServerPreviewSynced(options: {
  summary: LeaderboardSyncRunSummary;
  hasHttpsAvatar: boolean;
  failures: readonly { metric: string }[];
}): boolean {
  if (!shouldRunClientPreviewFallback(options.summary, options.hasHttpsAvatar)) {
    return false;
  }
  const previewFailed = options.failures.some((f) => f.metric === 'preview');
  return !previewFailed;
}
