import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appendHistory, loadHistory, type LocalHistoryRecord } from '../localStorageService';

const HISTORY_KEY = 'up.history';
const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => storage.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    storage.set(key, value);
    return true;
  },
  safeRemoveItem: (key: string) => storage.delete(key),
}));

function validRecord(id: string): LocalHistoryRecord {
  return {
    id,
    createdAt: '2026-07-19T00:00:00.000Z',
    scores: { strength: 100 },
    overallScore: 100,
  };
}

describe('local history runtime guard', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('falls back safely when valid JSON has the wrong root schema', () => {
    storage.set(HISTORY_KEY, JSON.stringify({}));
    expect(loadHistory()).toEqual([]);
    expect(() => appendHistory(validRecord('new'))).not.toThrow();
  });

  it('drops malformed rows while preserving valid history', () => {
    storage.set(
      HISTORY_KEY,
      JSON.stringify([validRecord('ok'), { id: 'bad', createdAt: null, scores: {} }])
    );
    expect(loadHistory()).toEqual([validRecord('ok')]);
  });
});
