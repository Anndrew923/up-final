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
 * WHY: Dual runs club-first (broadcast baseline) then arena — composite must survive both legs.
 */
export type BreakthroughCloudOutcome =
  | 'arena'
  | 'guild'
  | 'arena+guild'
  | 'dashboard-only'
  | null;

/**
 * Whether the global batch leg counts as a successful arena reconcile.
 * WHY: Shard hard-fail (failures, zero writes/patches) must not claim arena success.
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
 * Combine dual-pipeline leg results into a single cloud outcome.
 * WHY: Club-first then arena — never demote a successful club publish when arena fails,
 * and never claim arena+guild unless both legs landed.
 */
export function resolveDualPipelineCloudOutcome(
  guildOk: boolean,
  arenaOk: boolean
): Exclude<BreakthroughCloudOutcome, null> {
  if (guildOk && arenaOk) return 'arena+guild';
  if (guildOk) return 'guild';
  if (arenaOk) return 'arena';
  return 'dashboard-only';
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
