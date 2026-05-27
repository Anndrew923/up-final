import type {
  LeaderboardSyncRunSummary,
  LeaderboardSyncTarget,
} from '../logic/core/leaderboardSyncTargets';
import { applyLeaderboardSubmitToSyncSummary } from '../logic/core/ladderSubmitSyncSummary';
import { createEmptyLeaderboardSyncRunSummary } from '../logic/core/leaderboardSyncTargets';
import { isLadderCallableWritesEnabled } from '../config/ladderCallable';
import type { EntitlementState } from '../types/entitlement';
import type { ScoreMap } from '../types/scoring';
import type { LadderProfileProjection } from '../types/ladderProfile';
import { getFirestoreDb } from './firebaseClient';
import { callLadderSyncBatch } from './ladderCallableService';
import { submitLeaderboardScore, syncLeaderboardPreviewFullSixAxis } from './leaderboardService';

const DEFAULT_INTER_SHARD_DELAY_MS = 60;

export type LeaderboardBatchUploadResult = {
  summary: LeaderboardSyncRunSummary;
  /** Set when server rejects a full-sync-all attempt (P2 Callable). */
  fullSyncBlock?: {
    reason: 'full-sync-cooldown' | 'full-sync-daily-cap';
    nextAllowedAt?: string;
  };
};

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
  /** When true, server enforces 90 min + 3/day full-sync cap (home sync-all only). */
  fullSync?: boolean;
  /** When at least one shard succeeds, refreshes `leaderboard_previews` from merged six-axis scores (one write). */
  previewSnapshot?: {
    mergedScores: ScoreMap;
    profile?: Partial<LadderProfileProjection>;
    avatarUrl?: string | null;
  };
}): Promise<LeaderboardBatchUploadResult> {
  const {
    targets,
    uid,
    displayName,
    entitlement,
    delayMs = DEFAULT_INTER_SHARD_DELAY_MS,
    fullSync = false,
    previewSnapshot,
  } = options;

  const empty = createEmptyLeaderboardSyncRunSummary();

  if (
    targets.length > 0 &&
    fullSync &&
    isLadderCallableWritesEnabled() &&
    getFirestoreDb()
  ) {
    try {
      const batch = await callLadderSyncBatch({
        targets: targets.map((t) => ({ metric: t.metric, score: t.score })),
        displayName,
        avatarUrl: previewSnapshot?.avatarUrl,
        profile: previewSnapshot?.profile,
        fullSync: true,
        preview: previewSnapshot
          ? { mergedScores: previewSnapshot.mergedScores }
          : undefined,
      });
      if (batch) {
        if (!batch.ok) {
          if (
            batch.reason === 'full-sync-cooldown' ||
            batch.reason === 'full-sync-daily-cap'
          ) {
            return {
              summary: empty,
              fullSyncBlock: {
                reason: batch.reason,
                nextAllowedAt: batch.nextAllowedAt,
              },
            };
          }
          return { summary: empty };
        }
        return { summary: batch.summary };
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[leaderboard] ladderSyncBatch callable error', err);
      }
      return { summary: empty };
    }
  }

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
      options: {
        skipPreviewUpdate: true,
        skipOverallPreviewSync: true,
      },
    });

    applyLeaderboardSubmitToSyncSummary(tally, result);

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

  return { summary: tally };
}
