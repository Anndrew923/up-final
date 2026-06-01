import type { LeaderboardBatchUploadResult } from './leaderboardBatchUploadService';
import { queueStructuredProfilePushFromCurrentEntitlement } from './userStructuredSyncService';

const DEBOUNCE_MS = 600;

/** Avoid pushing a baseline that would re-sync an avatar-stripped snapshot right after a failed Storage upload. */
export function shouldQueueStructuredProfileAfterLadderBatch(
  batch: Pick<LeaderboardBatchUploadResult, 'summary' | 'failures'>
): boolean {
  if (batch.summary.updated <= 0) return false;
  return !batch.failures.some((f) => f.reason === 'avatar-upload-failed');
}

/**
 * Debounced Pro profile push after radar writes and/or ladder batch sync.
 * Pass `batch` when caller is `runLeaderboardBatchUpload` so avatar-upload failures do not push a stripped snapshot.
 */
export function queueStructuredProfileAfterRadarSubmit(
  batch?: Pick<LeaderboardBatchUploadResult, 'summary' | 'failures'>
): void {
  if (batch && !shouldQueueStructuredProfileAfterLadderBatch(batch)) return;
  queueStructuredProfilePushFromCurrentEntitlement(DEBOUNCE_MS);
}
