import { describe, expect, it } from 'vitest';
import { createEmptyLeaderboardSyncRunSummary } from '../../logic/core/leaderboardSyncTargets';
import {
  shouldQueueStructuredProfileAfterLadderBatch,
} from '../structuredSyncAfterRadarSubmit';

describe('shouldQueueStructuredProfileAfterLadderBatch', () => {
  it('returns false when no shards updated', () => {
    expect(
      shouldQueueStructuredProfileAfterLadderBatch({
        summary: createEmptyLeaderboardSyncRunSummary(),
        failures: [],
      })
    ).toBe(false);
  });

  it('returns false when avatar upload failed', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    summary.updated = 2;
    expect(
      shouldQueueStructuredProfileAfterLadderBatch({
        summary,
        failures: [{ metric: 'avatar', reason: 'avatar-upload-failed' }],
      })
    ).toBe(false);
  });

  it('returns true when shards updated and no avatar failure', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    summary.updated = 1;
    expect(
      shouldQueueStructuredProfileAfterLadderBatch({
        summary,
        failures: [],
      })
    ).toBe(true);
  });
});
