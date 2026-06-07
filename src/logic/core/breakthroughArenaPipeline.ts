import type { LeaderboardSyncRunSummary } from './leaderboardSyncTargets';

export type BreakthroughArenaPipelineBanner = 'none' | 'dashboard-only' | 'full-success';

/**
 * Maps dashboard-then-Arena pipeline outcome to modal banner tone.
 * WHY: Partial success (local OK, ladder blocked) must not reuse full-success copy/class.
 */
export function resolveBreakthroughArenaPipelineBanner(
  dashboardPersistedInSession: boolean,
  summary: LeaderboardSyncRunSummary | null | undefined
): BreakthroughArenaPipelineBanner {
  if (!dashboardPersistedInSession) return 'none';
  if (summary != null && summary.updated > 0) return 'full-success';
  return 'dashboard-only';
}
