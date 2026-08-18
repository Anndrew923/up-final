import { describe, expect, it } from 'vitest';
import {
  getUnseenBadgeIds,
  hasUnseenBadges,
  resolveSeenIdsForFirstLaunch,
} from '../specBadgeSeen';

describe('specBadgeSeen', () => {
  it('returns unlocked IDs that are not in the seen set', () => {
    expect(getUnseenBadgeIds(['IGN-01', 'PR-01', 'SPEC-6'], ['IGN-01'])).toEqual([
      'PR-01',
      'SPEC-6',
    ]);
  });

  it('dedupes unlocked IDs and ignores empty tokens', () => {
    expect(getUnseenBadgeIds(['IGN-01', '', 'IGN-01', 'ARC-01'], [])).toEqual([
      'IGN-01',
      'ARC-01',
    ]);
  });

  it('reports no unseen when every unlock is already seen', () => {
    expect(hasUnseenBadges(['IGN-01'], ['IGN-01', 'PR-01'])).toBe(false);
    expect(hasUnseenBadges(['PR-01'], ['IGN-01'])).toBe(true);
  });

  it('grandfathers first launch by copying current unlocks into seen', () => {
    expect(resolveSeenIdsForFirstLaunch(null, ['IGN-01', 'PR-01'])).toEqual([
      'IGN-01',
      'PR-01',
    ]);
    expect(hasUnseenBadges(['IGN-01', 'PR-01'], resolveSeenIdsForFirstLaunch(null, ['IGN-01', 'PR-01']))).toBe(
      false
    );
  });

  it('keeps an explicit empty seen store so later unlocks stay unread', () => {
    expect(resolveSeenIdsForFirstLaunch([], ['IGN-01'])).toEqual([]);
    expect(hasUnseenBadges(['IGN-01'], resolveSeenIdsForFirstLaunch([], ['IGN-01']))).toBe(true);
  });
});
