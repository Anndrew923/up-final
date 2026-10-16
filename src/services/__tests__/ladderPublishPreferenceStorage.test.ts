import { beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => memory.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    memory.set(key, value);
    return true;
  },
  safeRemoveItem: (key: string) => {
    memory.delete(key);
  },
}));

import {
  LADDER_PUBLISH_WANTS_GLOBAL_KEY,
  loadWantsGlobalLadderPublish,
  saveWantsGlobalLadderPublish,
} from '../ladderPublishPreferenceStorage';

describe('ladderPublishPreferenceStorage', () => {
  beforeEach(() => {
    memory.clear();
  });

  it('defaults to true when unset', () => {
    expect(loadWantsGlobalLadderPublish()).toBe(true);
  });

  it('persists false and true', () => {
    saveWantsGlobalLadderPublish(false);
    expect(loadWantsGlobalLadderPublish()).toBe(false);
    expect(memory.get(LADDER_PUBLISH_WANTS_GLOBAL_KEY)).toBe('0');
    saveWantsGlobalLadderPublish(true);
    expect(loadWantsGlobalLadderPublish()).toBe(true);
  });
});
