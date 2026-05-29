import { describe, expect, it } from 'vitest';
import { createEmptyLeaderboardSyncRunSummary } from '../leaderboardSyncTargets';
import {
  applyLeaderboardSubmitToSyncSummary,
  recordLadderSyncShardFailure,
} from '../ladderSubmitSyncSummary';

describe('applyLeaderboardSubmitToSyncSummary', () => {
  it('classifies updated, unchanged, rate-limited, invalid-input, and internal', () => {
    const tally = createEmptyLeaderboardSyncRunSummary();
    const failures: { metric: string; reason: string; message?: string }[] = [];

    applyLeaderboardSubmitToSyncSummary(tally, { ok: true, updated: true });
    applyLeaderboardSubmitToSyncSummary(tally, { ok: true, reason: 'unchanged', updated: false });
    applyLeaderboardSubmitToSyncSummary(
      tally,
      { ok: false, reason: 'rate-limited' },
      { metric: 'armSize', failures }
    );
    applyLeaderboardSubmitToSyncSummary(
      tally,
      { ok: false, reason: 'invalid-input' },
      { metric: 'strength_bench', failures, message: 'Unknown shard' }
    );
    applyLeaderboardSubmitToSyncSummary(
      tally,
      { ok: false, reason: 'unknown' },
      { metric: 'cardio', failures }
    );

    expect(tally).toEqual({
      attempted: 0,
      updated: 1,
      unchanged: 1,
      rateLimited: 1,
      proRequired: 0,
      invalidInput: 1,
      internal: 1,
      errors: 2,
    });
    expect(failures).toHaveLength(2);
    expect(failures[0]).toMatchObject({ metric: 'strength_bench', reason: 'invalid-input' });
    expect(failures[1]).toMatchObject({ metric: 'cardio', reason: 'unknown' });
  });

  it('recordLadderSyncShardFailure appends structured rows', () => {
    const failures: { metric: string; reason: string; message?: string }[] = [];
    recordLadderSyncShardFailure(failures, 'gripStrength', 'internal', 'Firestore transaction failed');
    expect(failures[0]?.message).toContain('transaction');
  });
});
