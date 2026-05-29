import type {
  LadderSyncShardFailure,
  LeaderboardSyncRunSummary,
  LeaderboardSyncTarget,
} from '../logic/core/leaderboardSyncTargets';
import {
  applyLeaderboardSubmitToSyncSummary,
  recordLadderSyncShardFailure,
} from '../logic/core/ladderSubmitSyncSummary';
import { createEmptyLeaderboardSyncRunSummary } from '../logic/core/leaderboardSyncTargets';
import { isLadderCallableWritesEnabled } from '../config/ladderCallable';
import { logLadderCallableError } from '../lib/ladderCallableDevLog';
import type { EntitlementState } from '../types/entitlement';
import type { ScoreMap } from '../types/scoring';
import type { LadderProfileProjection } from '../types/ladderProfile';
import { getFirestoreDb } from './firebaseClient';
import { callLadderSyncBatch } from './ladderCallableService';
import { submitLeaderboardScore, syncLeaderboardPreviewFullSixAxis } from './leaderboardService';

const DEFAULT_INTER_SHARD_DELAY_MS = 60;

export type LeaderboardBatchUploadResult = {
  summary: LeaderboardSyncRunSummary;
  failures: LadderSyncShardFailure[];
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
  const emptyFailures: LadderSyncShardFailure[] = [];

  const callableWrites = isLadderCallableWritesEnabled();
  const hasFirestore = Boolean(getFirestoreDb());

  // WHY: Production bundles without Callable use getDoc+setDoc; P2 rules block setDoc (no ladderSyncBatch in Network).
  if (import.meta.env.PROD && hasFirestore && !callableWrites && targets.length > 0) {
    console.error(
      '[ladder] This build was compiled without VITE_LADDER_CALLABLE_WRITES=true. ' +
        'Run `npm run build` after updating `.env` / `.env.production`, then reinstall or `npm run preview`.'
    );
  }

  // WHY: Prefer server batch whenever Callable writes are on — same failure payload for home + assessment.
  if (targets.length > 0 && callableWrites && hasFirestore) {
    try {
      const batch = await callLadderSyncBatch({
        targets: targets.map((t) => ({ metric: t.metric, score: t.score })),
        displayName,
        avatarUrl: previewSnapshot?.avatarUrl,
        profile: previewSnapshot?.profile,
        fullSync: fullSync || undefined,
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
              failures: batch.failures,
              fullSyncBlock: {
                reason: batch.reason,
                nextAllowedAt: batch.nextAllowedAt,
              },
            };
          }
          return { summary: empty, failures: batch.failures };
        }
        return { summary: batch.summary, failures: batch.failures };
      }
    } catch (err) {
      logLadderCallableError('runLeaderboardBatchUpload/ladderSyncBatch', err);
      return { summary: empty, failures: emptyFailures };
    }
  }

  const tally = createEmptyLeaderboardSyncRunSummary();
  const failures: LadderSyncShardFailure[] = [];

  for (const { metric, score } of targets) {
    tally.attempted += 1;
    try {
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

      applyLeaderboardSubmitToSyncSummary(tally, result, { metric, failures });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      recordLadderSyncShardFailure(failures, metric, 'internal', message);
      tally.internal += 1;
      tally.errors += 1;
      if (import.meta.env.DEV) {
        logLadderCallableError(`runLeaderboardBatchUpload/submit/${metric}`, err);
      }
    }

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

  if (import.meta.env.DEV && failures.length > 0) {
    console.warn('[ladder] sequential batch shard failures', failures);
  }

  return { summary: tally, failures };
}
