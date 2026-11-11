import { describe, expect, it } from 'vitest';
import {
  didArenaBatchLegSucceed,
  resolveBreakthroughArenaPipelineBanner,
  resolveCloudOutcomeAfterGuildSuccess,
} from '../breakthroughArenaPipeline';
import { createEmptyLeaderboardSyncRunSummary } from '../leaderboardSyncTargets';

describe('resolveBreakthroughArenaPipelineBanner', () => {
  it('returns none when dashboard was not persisted in session', () => {
    expect(resolveBreakthroughArenaPipelineBanner(false, null)).toBe('none');
  });

  it('returns full-success when arena outcome has shard updates', () => {
    const summary = { ...createEmptyLeaderboardSyncRunSummary(), updated: 2, attempted: 2 };
    expect(resolveBreakthroughArenaPipelineBanner(true, summary, 'arena')).toBe('full-success');
  });

  it('returns full-success from summary when cloud outcome is null', () => {
    const summary = { ...createEmptyLeaderboardSyncRunSummary(), updated: 2, attempted: 2 };
    expect(resolveBreakthroughArenaPipelineBanner(true, summary)).toBe('full-success');
  });

  it('returns dashboard-only when persisted but ladder made no updates', () => {
    const summary = { ...createEmptyLeaderboardSyncRunSummary(), attempted: 3, unchanged: 3 };
    expect(resolveBreakthroughArenaPipelineBanner(true, summary)).toBe('dashboard-only');
  });

  it('returns dashboard-only from explicit cloud outcome', () => {
    expect(resolveBreakthroughArenaPipelineBanner(true, null, 'dashboard-only')).toBe(
      'dashboard-only'
    );
  });

  it('returns guild-success from guild cloud outcome', () => {
    expect(resolveBreakthroughArenaPipelineBanner(true, null, 'guild')).toBe('guild-success');
  });

  it('returns arena-guild-success for dual composite outcome', () => {
    const summary = { ...createEmptyLeaderboardSyncRunSummary(), updated: 2, attempted: 2 };
    expect(resolveBreakthroughArenaPipelineBanner(true, summary, 'arena+guild')).toBe(
      'arena-guild-success'
    );
  });

  it('does not demote arena+guild to guild-success even when summary is null', () => {
    expect(resolveBreakthroughArenaPipelineBanner(true, null, 'arena+guild')).toBe(
      'arena-guild-success'
    );
  });
});

describe('didArenaBatchLegSucceed', () => {
  it('succeeds when shards updated', () => {
    const summary = { ...createEmptyLeaderboardSyncRunSummary(), attempted: 2, updated: 1 };
    expect(didArenaBatchLegSucceed(summary, [])).toBe(true);
  });

  it('succeeds on identity/avatar soft patch', () => {
    const avatar = { ...createEmptyLeaderboardSyncRunSummary(), avatarPatched: 1 };
    const identity = { ...createEmptyLeaderboardSyncRunSummary(), identityPatched: 1 };
    expect(didArenaBatchLegSucceed(avatar, [])).toBe(true);
    expect(didArenaBatchLegSucceed(identity, [])).toBe(true);
  });

  it('succeeds when all unchanged with no failures', () => {
    const summary = { ...createEmptyLeaderboardSyncRunSummary(), attempted: 3, unchanged: 3 };
    expect(didArenaBatchLegSucceed(summary, [])).toBe(true);
  });

  it('fails when there are shard failures and no writes/patches', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    expect(
      didArenaBatchLegSucceed(summary, [{ metric: 'strength', reason: 'permission-denied' }])
    ).toBe(false);
  });
});

describe('resolveCloudOutcomeAfterGuildSuccess', () => {
  it('promotes dual follow-up to arena+guild', () => {
    expect(resolveCloudOutcomeAfterGuildSuccess(true)).toBe('arena+guild');
  });

  it('keeps guild-only when not after arena', () => {
    expect(resolveCloudOutcomeAfterGuildSuccess(false)).toBe('guild');
  });
});
