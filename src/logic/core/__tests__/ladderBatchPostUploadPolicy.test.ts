import { describe, expect, it } from 'vitest';
import { LEADERBOARD_SHARD_OVERALL } from '../assessmentLeaderboardShards';
import { createEmptyLeaderboardSyncRunSummary } from '../leaderboardSyncTargets';
import {
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

  it('shouldRunClientPreviewFallback requires https avatar and a write signal', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    summary.attempted = 1;
    summary.avatarPatched = 1;
    expect(shouldRunClientPreviewFallback(summary, true)).toBe(true);
    expect(shouldRunClientPreviewFallback(summary, false)).toBe(false);

    summary.avatarPatched = 0;
    expect(shouldRunClientPreviewFallback(summary, true)).toBe(false);
  });

  it('inferServerPreviewSynced allows client retry when preview shard failed', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    summary.attempted = 1;
    summary.updated = 1;
    expect(
      inferServerPreviewSynced({
        summary,
        hasHttpsAvatar: true,
        failures: [{ metric: 'preview' }],
      })
    ).toBe(false);
    expect(
      inferServerPreviewSynced({
        summary,
        hasHttpsAvatar: true,
        failures: [],
      })
    ).toBe(true);
  });
});
