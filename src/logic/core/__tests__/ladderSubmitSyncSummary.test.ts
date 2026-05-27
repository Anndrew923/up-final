import { describe, expect, it } from 'vitest';
import { createEmptyLeaderboardSyncRunSummary } from '../leaderboardSyncTargets';
import { applyLeaderboardSubmitToSyncSummary } from '../ladderSubmitSyncSummary';

describe('applyLeaderboardSubmitToSyncSummary', () => {
  it('classifies updated, unchanged, rate-limited, and errors', () => {
    const tally = createEmptyLeaderboardSyncRunSummary();

    applyLeaderboardSubmitToSyncSummary(tally, { ok: true, updated: true });
    applyLeaderboardSubmitToSyncSummary(tally, { ok: true, reason: 'unchanged', updated: false });
    applyLeaderboardSubmitToSyncSummary(tally, { ok: false, reason: 'rate-limited' });
    applyLeaderboardSubmitToSyncSummary(tally, { ok: false, reason: 'unknown' });

    expect(tally).toEqual({
      attempted: 0,
      updated: 1,
      unchanged: 1,
      rateLimited: 1,
      proRequired: 0,
      errors: 1,
    });
  });
});
