import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMemoryStorage(): Storage {
  const memory = new Map<string, string>();
  return {
    get length() {
      return memory.size;
    },
    clear: () => memory.clear(),
    getItem: (key: string) => memory.get(key) ?? null,
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    removeItem: (key: string) => {
      memory.delete(key);
    },
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
}

const localMemory = createMemoryStorage();
const sessionMemory = createMemoryStorage();

vi.stubGlobal('localStorage', localMemory);
vi.stubGlobal('sessionStorage', sessionMemory);

const {
  dismissLadderGenesisEarlyBird,
  hasDismissedLadderGenesisEarlyBird,
  hasSessionDismissedLadderGenesisEarlyBird,
  shouldShowLadderGenesisEarlyBird,
} = await import('../ladderGenesisPrefService');

describe('ladderGenesisPrefService', () => {
  beforeEach(() => {
    localMemory.clear();
    sessionMemory.clear();
  });

  afterEach(() => {
    localMemory.clear();
    sessionMemory.clear();
  });

  it('shows by default when no dismiss flags are set', () => {
    expect(shouldShowLadderGenesisEarlyBird()).toBe(true);
  });

  it('session dismiss suppresses without permanent flag', () => {
    dismissLadderGenesisEarlyBird(false);
    expect(hasSessionDismissedLadderGenesisEarlyBird()).toBe(true);
    expect(hasDismissedLadderGenesisEarlyBird()).toBe(false);
    expect(shouldShowLadderGenesisEarlyBird()).toBe(false);
  });

  it('permanent dismiss sets both session and persistent flags', () => {
    dismissLadderGenesisEarlyBird(true);
    expect(hasSessionDismissedLadderGenesisEarlyBird()).toBe(true);
    expect(hasDismissedLadderGenesisEarlyBird()).toBe(true);
    expect(shouldShowLadderGenesisEarlyBird()).toBe(false);
  });
});
