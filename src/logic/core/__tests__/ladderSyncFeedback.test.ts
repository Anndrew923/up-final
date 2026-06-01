import { describe, expect, it } from 'vitest';
import { createEmptyLeaderboardSyncRunSummary } from '../leaderboardSyncTargets';
import {
  hasAvatarUploadSyncFailure,
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
});
