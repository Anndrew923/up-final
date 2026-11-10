import type {
  LadderSyncShardFailure,
  LeaderboardSyncRunSummary,
} from './leaderboardSyncTargets';

/** Competitive HUD outcome for batch ladder sync (result-oriented, not shard tallies). */
export type LadderSyncHudKind =
  | { kind: 'success-with-score'; scoreLabel: string }
  | { kind: 'success' }
  | { kind: 'ready' }
  | { kind: 'error' }
  | { kind: 'none' };

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

/**
 * Compact score for HUD (max 2dp, trim trailing zeros).
 * WHY: Match club-dispatch display contract without pulling Functions helpers into the client.
 */
export function formatLadderSyncHudScore(score: number): string {
  if (!Number.isFinite(score)) return '';
  const rounded = Math.round(score * 100) / 100;
  return String(rounded);
}

/**
 * Map batch tally → competitive HUD copy kind.
 * WHY: Users care about "did my power update?" — not shard write counters.
 *
 * Priority: errors → writes → ready/no-op. Avatar/identity-only soft successes are
 * handled by the presentational layer before calling this.
 */
export function resolveLadderSyncHudCopy(
  summary: LeaderboardSyncRunSummary,
  options?: { currentLadderScore?: number | null }
): LadderSyncHudKind {
  if (summary.errors > 0) {
    return { kind: 'error' };
  }

  if (summary.updated > 0) {
    const raw = options?.currentLadderScore;
    const scoreLabel =
      typeof raw === 'number' && Number.isFinite(raw) && raw > 0
        ? formatLadderSyncHudScore(raw)
        : '';
    if (scoreLabel) {
      return { kind: 'success-with-score', scoreLabel };
    }
    return { kind: 'success' };
  }

  if (summary.attempted > 0) {
    return { kind: 'ready' };
  }

  return { kind: 'none' };
}

/** Auto-dismiss window for sync HUD (fade starts slightly earlier). */
export const LADDER_SYNC_HUD_AUTO_DISMISS_MS = 4000;
/** Must match Tailwind `duration-700` on LadderSyncSummaryStatus. */
export const LADDER_SYNC_HUD_FADE_MS = 700;
