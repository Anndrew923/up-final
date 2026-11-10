import { describe, expect, it } from 'vitest';
import { createEmptyLeaderboardSyncRunSummary } from '../leaderboardSyncTargets';
import {
  formatLadderSyncHudScore,
  hasAvatarUploadSyncFailure,
  resolveLadderSyncHudCopy,
  shouldShowLadderSyncFeedback,
} from '../ladderSyncFeedback';

describe('ladderSyncFeedback', () => {
  it('shows feedback when avatar preflight fails with zero attempts', () => {
    const summary = createEmptyLeaderboardSyncRunSummary();
    const failures = [{ metric: 'avatar', reason: 'avatar-upload-failed' }];
    expect(shouldShowLadderSyncFeedback(summary, failures)).toBe(true);
    expect(hasAvatarUploadSyncFailure(failures)).toBe(true);
  });

  it('hides feedback when summary is null', () => {
    expect(shouldShowLadderSyncFeedback(null, [])).toBe(false);
  });

  it('resolves competitive HUD kinds from batch tallies', () => {
    expect(
      resolveLadderSyncHudCopy({
        ...createEmptyLeaderboardSyncRunSummary(),
        attempted: 6,
        updated: 2,
        errors: 0,
      }, { currentLadderScore: 90.28 })
    ).toEqual({ kind: 'success-with-score', scoreLabel: '90.28' });

    expect(
      resolveLadderSyncHudCopy({
        ...createEmptyLeaderboardSyncRunSummary(),
        attempted: 6,
        updated: 1,
        errors: 0,
      })
    ).toEqual({ kind: 'success' });

    expect(
      resolveLadderSyncHudCopy({
        ...createEmptyLeaderboardSyncRunSummary(),
        attempted: 6,
        updated: 0,
        unchanged: 6,
        errors: 0,
      })
    ).toEqual({ kind: 'ready' });

    expect(
      resolveLadderSyncHudCopy({
        ...createEmptyLeaderboardSyncRunSummary(),
        attempted: 6,
        updated: 1,
        errors: 2,
      })
    ).toEqual({ kind: 'error' });
  });

  it('formats HUD scores with trimmed decimals', () => {
    expect(formatLadderSyncHudScore(90.28)).toBe('90.28');
    expect(formatLadderSyncHudScore(90)).toBe('90');
    expect(formatLadderSyncHudScore(Number.NaN)).toBe('');
  });

  it('prefers error over success when shard errors are present', () => {
    expect(
      resolveLadderSyncHudCopy({
        ...createEmptyLeaderboardSyncRunSummary(),
        attempted: 6,
        updated: 3,
        errors: 1,
      }, { currentLadderScore: 88 })
    ).toEqual({ kind: 'error' });
  });

  it('omits score label when composite is missing or non-positive', () => {
    expect(
      resolveLadderSyncHudCopy({
        ...createEmptyLeaderboardSyncRunSummary(),
        attempted: 2,
        updated: 1,
        errors: 0,
      }, { currentLadderScore: 0 })
    ).toEqual({ kind: 'success' });
  });
});
