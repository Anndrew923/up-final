import type {
  LadderSyncShardFailure,
  LeaderboardSyncRunSummary,
} from './leaderboardSyncTargets';

/** Minimal submit result shape for batch/sync tally (keeps logic independent of services). */
export interface LeaderboardSubmitTallyInput {
  ok: boolean;
  updated?: boolean;
  reason?: string;
  message?: string;
}

export interface ApplyLeaderboardSubmitToSyncSummaryOptions {
  metric: string;
  failures?: LadderSyncShardFailure[];
  /** Optional detail when the upstream layer already knows the message (e.g. Callable failures). */
  message?: string;
}

/**
 * Appends a structured failure row and bumps the matching summary counter.
 * WHY: UI and ops need metric + reason — not a single "errors" count.
 */
export function recordLadderSyncShardFailure(
  failures: LadderSyncShardFailure[],
  metric: string,
  reason: string,
  message?: string
): void {
  failures.push(message ? { metric, reason, message } : { metric, reason });
}

function applyFailureReasonToTally(tally: LeaderboardSyncRunSummary, reason: string): void {
  if (reason === 'rate-limited') {
    tally.rateLimited += 1;
    return;
  }
  if (reason === 'pro-required') {
    tally.proRequired += 1;
    return;
  }
  if (reason === 'invalid-input') {
    tally.invalidInput += 1;
    tally.errors += 1;
    return;
  }
  tally.internal += 1;
  tally.errors += 1;
}

/**
 * Maps a single `submitLeaderboardScore` outcome into `LeaderboardSyncRunSummary` counters.
 * When `options.failures` is provided, failed shards are recorded for UI / DEV inspection.
 */
export function applyLeaderboardSubmitToSyncSummary(
  tally: LeaderboardSyncRunSummary,
  result: LeaderboardSubmitTallyInput,
  options?: ApplyLeaderboardSubmitToSyncSummaryOptions
): void {
  if (result.ok && result.updated) {
    tally.updated += 1;
    return;
  }
  if (result.ok && result.reason === 'unchanged') {
    tally.unchanged += 1;
    return;
  }

  if (!result.ok) {
    const reason = result.reason ?? 'internal';
    const metric = options?.metric ?? 'unknown';
    const message = options?.message ?? result.message;

    // WHY: Rate-limit / Pro already have dedicated summary counters — failures list is for diagnosis.
    const shouldRecordFailure =
      reason === 'invalid-input' ||
      reason === 'internal' ||
      reason === 'unknown' ||
      reason === 'anonymous';
    if (options?.failures && shouldRecordFailure) {
      recordLadderSyncShardFailure(options.failures, metric, reason, message);
    }
    applyFailureReasonToTally(tally, reason);
  }
}
