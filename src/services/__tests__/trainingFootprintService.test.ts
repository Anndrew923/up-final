import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyMergedFootprint,
  clearTrainingFootprint,
  loadTrainingFootprint,
  persistUnlockedBadgeUnion,
  recordTrainingFootprint,
  TRAINING_FOOTPRINT_STORAGE_KEY,
} from '../trainingFootprintService';
import { emptyTrainingFootprint } from '../../logic/core/trainingFootprint';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('../../lib/safeLocalStorage', () => ({
  safeGetItem: (key: string) => storage.get(key) ?? null,
  safeSetItem: (key: string, value: string) => {
    storage.set(key, value);
    return true;
  },
  safeRemoveItem: (key: string) => storage.delete(key),
}));

describe('trainingFootprintService', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('persists a new local day and no-ops the same level', () => {
    const now = new Date(2026, 7, 16, 9, 0, 0);
    const first = recordTrainingFootprint(1, now);
    expect(first.lifetimeDays).toBe(1);
    expect(first.days['2026-08-16']).toBe(1);
    expect(storage.get(TRAINING_FOOTPRINT_STORAGE_KEY)).toContain('2026-08-16');

    const before = storage.get(TRAINING_FOOTPRINT_STORAGE_KEY);
    recordTrainingFootprint(1, now);
    expect(storage.get(TRAINING_FOOTPRINT_STORAGE_KEY)).toBe(before);

    const upgraded = recordTrainingFootprint(3, now);
    expect(upgraded.days['2026-08-16']).toBe(3);
    expect(upgraded.lifetimeDays).toBe(1);
    expect(upgraded.unlockedBadgeIds).toContain('IGN-01');
    expect(upgraded.unlockedBadgeIds).toContain('PR-01');
  });

  it('falls back when stored JSON is invalid', () => {
    storage.set(TRAINING_FOOTPRINT_STORAGE_KEY, '{not-json');
    expect(loadTrainingFootprint().lifetimeDays).toBe(0);
  });

  it('clears the persisted footprint key', () => {
    recordTrainingFootprint(2, new Date(2026, 7, 16));
    clearTrainingFootprint();
    expect(storage.get(TRAINING_FOOTPRINT_STORAGE_KEY)).toBeUndefined();
    expect(loadTrainingFootprint().lifetimeDays).toBe(0);
  });

  it('unions HIST-10 from badge context even when the day level is unchanged', () => {
    const now = new Date(2026, 7, 16, 9, 0, 0);
    recordTrainingFootprint(2, now);
    const before = storage.get(TRAINING_FOOTPRINT_STORAGE_KEY);
    const next = recordTrainingFootprint(2, now, { scores: {}, historyLength: 10 });
    expect(next.unlockedBadgeIds).toContain('HIST-10');
    expect(storage.get(TRAINING_FOOTPRINT_STORAGE_KEY)).not.toBe(before);
  });

  it('does not drop previously unlocked IDs when later writes omit scores/history', () => {
    const now = new Date(2026, 7, 16, 9, 0, 0);
    recordTrainingFootprint(2, now, { scores: {}, historyLength: 10 });
    const again = recordTrainingFootprint(1, now);
    expect(again.unlockedBadgeIds).toContain('HIST-10');
    expect(again.unlockedBadgeIds).toContain('IGN-01');
  });

  it('unions HIST-10 without requiring a new attendance day', () => {
    persistUnlockedBadgeUnion({ scores: {}, historyLength: 10 });
    expect(loadTrainingFootprint().unlockedBadgeIds).toContain('HIST-10');
  });

  it('merges a remote footprint into local without dropping existing ids', () => {
    recordTrainingFootprint(1, new Date(2026, 7, 16, 9, 0, 0));
    const merged = applyMergedFootprint({
      schemaVersion: 1,
      days: { '2026-08-15': 2 },
      lifetimeDays: 20,
      unlockedBadgeIds: ['SOM-01'],
    });
    expect(merged.unlockedBadgeIds).toContain('IGN-01');
    expect(merged.unlockedBadgeIds).toContain('SOM-01');
    expect(merged.lifetimeDays).toBe(20);
    expect(merged.days['2026-08-16']).toBe(1);
    expect(merged.days['2026-08-15']).toBe(2);
  });

  it('does not rewrite storage when the merged blob is unchanged', () => {
    const unchanged = applyMergedFootprint(emptyTrainingFootprint());
    expect(unchanged.lifetimeDays).toBe(0);
    expect(storage.get(TRAINING_FOOTPRINT_STORAGE_KEY)).toBeUndefined();
  });
});
