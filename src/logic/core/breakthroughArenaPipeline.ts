import type {
  LadderSyncShardFailure,
  LeaderboardSyncRunSummary,
} from './leaderboardSyncTargets';

export type BreakthroughArenaPipelineBanner =
  | 'none'
  | 'dashboard-only'
  | 'full-success'
  | 'guild-success'
  | 'arena-guild-success';

/**
 * Cloud leg outcome after breakthrough persist-then-sync.
 * WHY: Dual "arena then guild" must retain a composite signal — guild must not erase arena.
 */
export type BreakthroughCloudOutcome =
  | 'arena'
  | 'guild'
  | 'arena+guild'
  | 'dashboard-only'
  | null;

/**
 * Whether the global batch leg may continue into dual guild follow-up.
 * WHY: Shard hard-fail (failures, zero writes/patches) must not be treated as arena success.
 * All-unchanged / soft identity patches still count as a completed reconcile.
 */
export function didArenaBatchLegSucceed(
  summary: LeaderboardSyncRunSummary,
  failures: readonly LadderSyncShardFailure[]
): boolean {
  if (summary.updated > 0) return true;
  if ((summary.avatarPatched ?? 0) > 0) return true;
  if ((summary.identityPatched ?? 0) > 0) return true;
  if (failures.length > 0) return false;
  return true;
}

/**
 * Guild leg success → cloud outcome.
 * WHY: Centralize dual promotion so hooks cannot silently demote arena+guild back to guild.
 */
export function resolveCloudOutcomeAfterGuildSuccess(
  afterArena: boolean
): Extract<BreakthroughCloudOutcome, 'guild' | 'arena+guild'> {
  return afterArena ? 'arena+guild' : 'guild';
}

/**
 * Maps dashboard-then-cloud pipeline outcome to modal banner tone.
 * WHY: Partial success (local OK, ladder blocked) must not reuse full-success copy/class.
 */
export function resolveBreakthroughArenaPipelineBanner(
  dashboardPersistedInSession: boolean,
  summary: LeaderboardSyncRunSummary | null | undefined,
  cloudOutcome: BreakthroughCloudOutcome = null
): BreakthroughArenaPipelineBanner {
  if (!dashboardPersistedInSession) return 'none';
  if (cloudOutcome === 'arena+guild') return 'arena-guild-success';
  if (cloudOutcome === 'guild') return 'guild-success';
  if (cloudOutcome === 'arena') {
    // Arena leg ran; only celebrate shards when at least one write landed.
    return summary != null && summary.updated > 0 ? 'full-success' : 'dashboard-only';
  }
  if (cloudOutcome === 'dashboard-only') return 'dashboard-only';
  if (summary != null && summary.updated > 0) return 'full-success';
  return 'dashboard-only';
}
