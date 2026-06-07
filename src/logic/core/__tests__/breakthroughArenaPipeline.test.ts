import { describe, expect, it } from 'vitest';
import { resolveBreakthroughArenaPipelineBanner } from '../breakthroughArenaPipeline';
import { createEmptyLeaderboardSyncRunSummary } from '../leaderboardSyncTargets';

describe('resolveBreakthroughArenaPipelineBanner', () => {
  it('returns none when dashboard was not persisted in session', () => {
    expect(resolveBreakthroughArenaPipelineBanner(false, null)).toBe('none');
  });

  it('returns full-success when ladder updated at least one shard', () => {
    const summary = { ...createEmptyLeaderboardSyncRunSummary(), updated: 2, attempted: 2 };
    expect(resolveBreakthroughArenaPipelineBanner(true, summary)).toBe('full-success');
  });

  it('returns dashboard-only when persisted but ladder made no updates', () => {
    const summary = { ...createEmptyLeaderboardSyncRunSummary(), attempted: 3, unchanged: 3 };
    expect(resolveBreakthroughArenaPipelineBanner(true, summary)).toBe('dashboard-only');
  });
});
