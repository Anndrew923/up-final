import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSpecBadgeSeen,
  hasUnseenSpecBadges,
  loadSeenBadgeIds,
  markBadgesAsSeen,
  resolveGrandfatheredSeen,
  SPEC_BADGE_SEEN_STORAGE_KEY,
  subscribeSpecBadgeSeen,
} from '../specBadgeSeenService';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => storage.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    storage.set(key, value);
    return true;
  },
  safeRemoveItem: (key: string) => storage.delete(key),
}));

describe('specBadgeSeenService', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('returns null when no seen record exists', () => {
    expect(loadSeenBadgeIds()).toBeNull();
  });

  it('resolves grandfathered unlocks without writing during the read path', () => {
    const seen = resolveGrandfatheredSeen(['IGN-01', 'PR-01']);
    expect(seen).toEqual(['IGN-01', 'PR-01']);
    expect(loadSeenBadgeIds()).toBeNull();
    expect(hasUnseenSpecBadges(['IGN-01', 'PR-01'])).toBe(false);
  });

  it('treats a persisted empty seen set as initialized, not first launch', () => {
    markBadgesAsSeen([]);
    expect(loadSeenBadgeIds()).toEqual([]);
    expect(hasUnseenSpecBadges(['ARC-01'])).toBe(true);
  });

  it('unions newly seen IDs without shrinking the store', () => {
    markBadgesAsSeen(['IGN-01']);
    markBadgesAsSeen(['PR-01']);
    expect(loadSeenBadgeIds()).toEqual(['IGN-01', 'PR-01']);
  });

  it('drops unknown catalog IDs', () => {
    markBadgesAsSeen(['TOOL-20', 'IGN-01']);
    expect(loadSeenBadgeIds()).toEqual(['IGN-01']);
  });

  it('notifies subscribers and clears with the dedicated key', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeSpecBadgeSeen(onChange);
    markBadgesAsSeen(['IGN-01']);
    expect(onChange).toHaveBeenCalledTimes(1);
    clearSpecBadgeSeen();
    expect(storage.has(SPEC_BADGE_SEEN_STORAGE_KEY)).toBe(false);
    expect(loadSeenBadgeIds()).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
