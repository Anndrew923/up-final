import type {
  LeaderboardSyncRunSummary,
  LeaderboardSyncTarget,
} from '../logic/core/leaderboardSyncTargets';
import { createEmptyLeaderboardSyncRunSummary } from '../logic/core/leaderboardSyncTargets';
import type { EntitlementState } from '../types/entitlement';
import type { ScoreMap } from '../types/scoring';
import type { LadderProfileProjection } from '../types/ladderProfile';
import { submitLeaderboardScore, syncLeaderboardPreviewFullSixAxis } from './leaderboardService';

const DEFAULT_INTER_SHARD_DELAY_MS = 60;

/**
 * Sequential ladder writes (same contract as single `submitLeaderboardScore` calls).
 * Used by global sync-all and per-assessment batch buttons.
 */
export async function runLeaderboardBatchUpload(options: {
  targets: readonly LeaderboardSyncTarget[];
  uid: string;
  displayName: string;
  entitlement: EntitlementState;
  delayMs?: number;
  /** When at least one shard succeeds, refreshes `leaderboard_previews` from merged six-axis scores (one write). */
  previewSnapshot?: {
    mergedScores: ScoreMap;
    profile?: Partial<LadderProfileProjection>;
    avatarUrl?: string | null;
  };
}): Promise<LeaderboardSyncRunSummary> {
  const {
    targets,
    uid,
    displayName,
    entitlement,
    delayMs = DEFAULT_INTER_SHARD_DELAY_MS,
    previewSnapshot,
  } = options;
  const tally = createEmptyLeaderboardSyncRunSummary();

  for (const { metric, score } of targets) {
    tally.attempted += 1;
    const result = await submitLeaderboardScore({
      entitlement,
      input: {
        uid,
        metric,
        score,
        displayName,
      },
    });

    if (result.ok && result.updated) tally.updated += 1;
    else if (!result.ok && result.reason === 'rate-limited') tally.rateLimited += 1;
    else if (!result.ok && result.reason === 'pro-required') tally.proRequired += 1;
    else if (!result.ok) tally.errors += 1;

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, delayMs);
    });
  }

  if (previewSnapshot && tally.updated > 0) {
    await syncLeaderboardPreviewFullSixAxis({
      entitlement,
      uid,
      displayName,
      mergedScores: previewSnapshot.mergedScores,
      profile: previewSnapshot.profile,
      avatarUrl: previewSnapshot.avatarUrl,
    });
  }

  return tally;
}
