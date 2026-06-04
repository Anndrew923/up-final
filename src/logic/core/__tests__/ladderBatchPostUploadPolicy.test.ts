import { describe, expect, it } from 'vitest';
import { LEADERBOARD_SHARD_OVERALL } from '../assessmentLeaderboardShards';
import { createEmptyLeaderboardSyncRunSummary } from '../leaderboardSyncTargets';
import {
  batchSummaryWarrantsPreviewSync,
  collectLadderCacheMetricsToClear,
  inferServerPreviewSynced,
  shouldInvalidateLadderCacheAfterBatch,
  shouldRunClientPreviewFallback,
} from '../ladderBatchPostUploadPolicy';

describe('ladderBatchPostUploadPolicy', () => {
  it('collectLadderCacheMetricsToClear includes overall and targets', () => {
    const metrics = collectLadderCacheMetricsToClear([
      { metric: 'bodyFat_ffmi', score: 90 },
    ]);
    expect(metrics).toContain('bodyFat_ffmi');
    expect(metrics).toContain(LEADERBOARD_SHARD_OVERALL);
  });

  it('shouldInvalidateLadderCacheAfterBatch is false when nothing changed on server', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    summary.attempted = 3;
    summary.rateLimited = 3;
    expect(shouldInvalidateLadderCacheAfterBatch(summary)).toBe(false);
  });

  it('shouldInvalidateLadderCacheAfterBatch is true after score or avatar writes', () => {
    const updated = createEmptyLeaderboardSyncRunSummary();
    updated.updated = 1;
    expect(shouldInvalidateLadderCacheAfterBatch(updated)).toBe(true);

    const avatar = createEmptyLeaderboardSyncRunSummary();
    avatar.avatarPatched = 1;
    expect(shouldInvalidateLadderCacheAfterBatch(avatar)).toBe(true);
  });

  it('shouldRunClientPreviewFallback does not require https avatar', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    summary.attempted = 1;
    summary.unchanged = 1;
    expect(shouldRunClientPreviewFallback(summary)).toBe(true);
  });

  it('shouldRunClientPreviewFallback is true for unchanged-only batch', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    summary.attempted = 4;
    summary.unchanged = 4;
    expect(batchSummaryWarrantsPreviewSync(summary)).toBe(true);
    expect(shouldRunClientPreviewFallback(summary)).toBe(true);
  });

  it('shouldRunClientPreviewFallback is false when no shard outcomes', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    summary.attempted = 2;
    summary.rateLimited = 2;
    expect(shouldRunClientPreviewFallback(summary)).toBe(false);
  });

  it('inferServerPreviewSynced allows client retry when preview shard failed', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    summary.attempted = 1;
    summary.updated = 1;
    expect(
      inferServerPreviewSynced({
        summary,
        failures: [{ metric: 'preview' }],
      })
    ).toBe(false);
    expect(
      inferServerPreviewSynced({
        summary,
        failures: [],
      })
    ).toBe(true);
  });
});
