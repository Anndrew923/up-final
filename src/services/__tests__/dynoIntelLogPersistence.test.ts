import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as safeLocalStorage from '../../lib/safeLocalStorage';
import {
  clearAllDynoIntelLogs,
  DYNO_INTEL_LOG_STORAGE_KEY_PREFIX,
  loadDynoIntelLogs,
  saveDynoIntelLogs,
} from '../dynoIntelLogPersistence';
import type { DynoIntelLogEntry } from '../../logic/core/dynoIntelLogTypes';

function makeEntry(uid: string, timestamp = 1): DynoIntelLogEntry {
  return {
    id: `log-${timestamp}`,
    uid,
    timestamp,
    focusAxis: 'strength',
    userQuestion: 'q',
    commentary: 'c',
    closingBeatKind: 'return-ritual',
  };
}

describe('dynoIntelLogPersistence', () => {
  let memory: Record<string, string>;

  beforeEach(() => {
    memory = {};
    vi.spyOn(safeLocalStorage, 'safeGetItem').mockImplementation((key) => memory[key] ?? null);
    vi.spyOn(safeLocalStorage, 'safeSetItem').mockImplementation((key, value) => {
      memory[key] = value;
      return true;
    });
    vi.spyOn(safeLocalStorage, 'safeRemoveItem').mockImplementation((key) => {
      delete memory[key];
    });
    vi.spyOn(safeLocalStorage, 'listStorageKeys').mockImplementation(() => Object.keys(memory));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('round-trips valid entries per uid', () => {
    const entry = makeEntry('user-a');
    saveDynoIntelLogs('user-a', [entry]);
    expect(loadDynoIntelLogs('user-a')).toEqual([entry]);
    expect(loadDynoIntelLogs('user-b')).toEqual([]);
  });

  it('filters invalid closingBeatKind on load', () => {
    memory[`${DYNO_INTEL_LOG_STORAGE_KEY_PREFIX}:user-a`] = JSON.stringify([
      makeEntry('user-a'),
      { ...makeEntry('user-a'), id: 'bad', closingBeatKind: 'invalid-kind' },
    ]);
    expect(loadDynoIntelLogs('user-a')).toHaveLength(1);
  });

  it('defensively caps direct persistence writes at 100 newest entries', () => {
    const entries = Array.from({ length: 101 }, (_, index) => makeEntry('user-a', index + 1));
    expect(saveDynoIntelLogs('user-a', entries)).toBe(true);

    const saved = loadDynoIntelLogs('user-a');
    expect(saved).toHaveLength(100);
    expect(saved[0]?.timestamp).toBe(101);
    expect(saved.at(-1)?.timestamp).toBe(2);
  });

  it('clearAllDynoIntelLogs removes every uid shard', () => {
    saveDynoIntelLogs('user-a', [makeEntry('user-a')]);
    saveDynoIntelLogs('user-b', [makeEntry('user-b')]);
    clearAllDynoIntelLogs();
    expect(loadDynoIntelLogs('user-a')).toEqual([]);
    expect(loadDynoIntelLogs('user-b')).toEqual([]);
  });
});
