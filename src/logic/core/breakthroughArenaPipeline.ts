import type { LeaderboardSyncRunSummary } from './leaderboardSyncTargets';

export type BreakthroughArenaPipelineBanner =
  | 'none'
  | 'dashboard-only'
  | 'full-success'
  | 'guild-success';

export type BreakthroughCloudOutcome = 'arena' | 'guild' | null;

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
  if (cloudOutcome === 'guild') return 'guild-success';
  if (summary != null && summary.updated > 0) return 'full-success';
  return 'dashboard-only';
}
