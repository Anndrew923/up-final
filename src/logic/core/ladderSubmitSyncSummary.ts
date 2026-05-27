import type { LeaderboardSyncRunSummary } from './leaderboardSyncTargets';

/** Minimal submit result shape for batch/sync tally (keeps logic independent of services). */
export interface LeaderboardSubmitTallyInput {
  ok: boolean;
  updated?: boolean;
  reason?: string;
}

/**
 * Maps a single `submitLeaderboardScore` outcome into `LeaderboardSyncRunSummary` counters.
 */
export function applyLeaderboardSubmitToSyncSummary(
  tally: LeaderboardSyncRunSummary,
  result: LeaderboardSubmitTallyInput
): void {
  if (result.ok && result.updated) {
    tally.updated += 1;
    return;
  }
  if (result.ok && result.reason === 'unchanged') {
    tally.unchanged += 1;
    return;
  }
  if (!result.ok && result.reason === 'rate-limited') {
    tally.rateLimited += 1;
    return;
  }
  if (!result.ok && result.reason === 'pro-required') {
    tally.proRequired += 1;
    return;
  }
  if (!result.ok) {
    tally.errors += 1;
  }
}
