import type { LeaderboardShardId } from '../logic/core/ladderShards';
import {
  collectLadderCacheMetricsToClear,
  inferServerPreviewSynced,
  shouldInvalidateLadderCacheAfterBatch,
  shouldRunClientPreviewFallback,
} from '../logic/core/ladderBatchPostUploadPolicy';
import type {
  LeaderboardSyncRunSummary,
  LeaderboardSyncTarget,
} from '../logic/core/leaderboardSyncTargets';
import type { EntitlementState } from '../types/entitlement';
import type { ScoreMap } from '../types/scoring';
import type { LadderProfileProjection } from '../types/ladderProfile';
import {
  clearLeaderboardReadCaches,
  syncLeaderboardPreviewFullSixAxis,
} from './leaderboardService';
import { invalidateGuildLadderCache } from './guildLadderCacheService';
import { LEADERBOARD_SHARD_OVERALL } from '../logic/core/assessmentLeaderboardShards';

export const LADDER_CACHE_INVALIDATED_EVENT = 'up-final-ladder-cache-invalidated';

/** Notifies `LadderPage` (and others) to refetch after batch sync clears session cache. */
export function notifyLadderCacheInvalidated(metrics: readonly LeaderboardShardId[]): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(LADDER_CACHE_INVALIDATED_EVENT, { detail: { metrics: [...metrics] } })
  );
}

export { collectLadderCacheMetricsToClear } from '../logic/core/ladderBatchPostUploadPolicy';

/**
 * After batch ladder sync: invalidate list cache, refresh preview doc, nudge ladder UI to refetch.
 * WHY: Callable batch skipped client cache clears; avatar-only patches must still refresh the overall board.
 */
export async function runLeaderboardBatchPostUpload(options: {
  entitlement: EntitlementState;
  uid: string;
  displayName: string;
  targets: readonly LeaderboardSyncTarget[];
  summary: LeaderboardSyncRunSummary;
  resolvedAvatarUrl?: string;
  previewSnapshot?: {
    mergedScores: ScoreMap;
    profile?: Partial<LadderProfileProjection>;
  };
  /** When true, `ladderSyncBatch` already synced preview successfully — skip client duplicate. */
  serverSyncedPreview?: boolean;
  batchFailures?: readonly { metric: string }[];
}): Promise<void> {
  if (!shouldInvalidateLadderCacheAfterBatch(options.summary)) {
    return;
  }

  const metrics = collectLadderCacheMetricsToClear(options.targets);
  for (const metric of metrics) {
    clearLeaderboardReadCaches(metric);
  }
  notifyLadderCacheInvalidated(metrics);

  // Batch path: server fan-out runs inside ladderScore shard submit (score + identity patches).
  if (
    options.targets.some((t) => t.metric === LEADERBOARD_SHARD_OVERALL) &&
    (options.summary.updated > 0 ||
      (options.summary.avatarPatched ?? 0) > 0 ||
      (options.summary.identityPatched ?? 0) > 0)
  ) {
    invalidateGuildLadderCache();
  }

  const serverSyncedPreview =
    options.serverSyncedPreview ??
    inferServerPreviewSynced({
      summary: options.summary,
      failures: options.batchFailures ?? [],
    });

  if (
    serverSyncedPreview ||
    !options.previewSnapshot ||
    !shouldRunClientPreviewFallback(options.summary)
  ) {
    return;
  }

  await syncLeaderboardPreviewFullSixAxis({
    entitlement: options.entitlement,
    uid: options.uid,
    displayName: options.displayName,
    mergedScores: options.previewSnapshot.mergedScores,
    profile: options.previewSnapshot.profile,
    avatarUrl: options.resolvedAvatarUrl,
    skipAvatarStorageEnsure: true,
  });
}
