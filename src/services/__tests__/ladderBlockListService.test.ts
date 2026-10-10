import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addBlockedEntry,
  LADDER_BLOCKED_UIDS_STORAGE_KEY,
  loadBlockedEntries,
  removeBlockedEntry,
} from '../ladderBlockListService';

const memory = new Map<string, string>();

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => memory.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    memory.set(key, value);
  },
}));

describe('ladderBlockListService', () => {
  beforeEach(() => {
    memory.clear();
  });

  it('loads legacy string arrays as empty-name entries and rewrites storage', () => {
    memory.set(LADDER_BLOCKED_UIDS_STORAGE_KEY, JSON.stringify(['uid-legacy']));
    expect(loadBlockedEntries()).toEqual([{ uid: 'uid-legacy', displayName: '' }]);
    expect(JSON.parse(memory.get(LADDER_BLOCKED_UIDS_STORAGE_KEY) ?? '[]')).toEqual([
      { uid: 'uid-legacy', displayName: '' },
    ]);
  });

  it('persists object entries and upgrades legacy empty names', () => {
    const afterAdd = addBlockedEntry({ uid: 'uid-1', displayName: 'Neo' }, []);
    expect(afterAdd).toEqual([{ uid: 'uid-1', displayName: 'Neo' }]);
    expect(JSON.parse(memory.get(LADDER_BLOCKED_UIDS_STORAGE_KEY) ?? '[]')).toEqual([
      { uid: 'uid-1', displayName: 'Neo' },
    ]);

    const upgraded = addBlockedEntry(
      { uid: 'uid-legacy', displayName: 'Legacy User' },
      [{ uid: 'uid-legacy', displayName: '' }]
    );
    expect(upgraded).toEqual([{ uid: 'uid-legacy', displayName: 'Legacy User' }]);
  });

  it('removeBlockedEntry drops by uid', () => {
    const next = removeBlockedEntry('uid-a', [
      { uid: 'uid-a', displayName: 'A' },
      { uid: 'uid-b', displayName: 'B' },
    ]);
    expect(next).toEqual([{ uid: 'uid-b', displayName: 'B' }]);
  });
});
