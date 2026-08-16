import { describe, expect, it } from 'vitest';
import type { LocalHistoryRecord } from '../localHistoryRecord';
import {
  applyFootprintRecord,
  buildMonthDotMatrix,
  countActiveDaysInLocalWeek,
  deriveFootprintDashboard,
  EMPTY_TRAINING_FOOTPRINT,
  historicalMaxForMetric,
  isPersonalRecord,
  localDateKey,
  mergeFootprintLevel,
  parseLocalDateKey,
  resolveAssessmentFootprintLevel,
  startOfLocalIsoWeek,
  WEEKLY_RHYTHM_TARGET,
} from '../trainingFootprint';

function record(id: string, scores: LocalHistoryRecord['scores']): LocalHistoryRecord {
  return {
    id,
    createdAt: '2026-01-01T00:00:00.000Z',
    scores,
    overallScore: 50,
  };
}

describe('trainingFootprint date keys', () => {
  it('formats device-local YYYY-MM-DD without UTC shift', () => {
    const localEvening = new Date(2026, 7, 16, 22, 30, 0);
    expect(localDateKey(localEvening)).toBe('2026-08-16');
    expect(parseLocalDateKey('2026-08-16')).toEqual(new Date(2026, 7, 16));
    expect(parseLocalDateKey('2026-13-01')).toBeNull();
  });

  it('starts the local week on Monday', () => {
    const sunday = new Date(2026, 7, 16);
    const monday = startOfLocalIsoWeek(sunday);
    expect(localDateKey(monday)).toBe('2026-08-10');
  });
});

describe('trainingFootprint merge', () => {
  it('upgrades same-day level and no-ops equal or lower', () => {
    expect(mergeFootprintLevel(undefined, 1)).toEqual({ next: 1, changed: true });
    expect(mergeFootprintLevel(1, 2)).toEqual({ next: 2, changed: true });
    expect(mergeFootprintLevel(3, 2)).toEqual({ next: 3, changed: false });
    expect(mergeFootprintLevel(2, 2)).toEqual({ next: 2, changed: false });
  });

  it('increments lifetimeDays only for a new calendar day', () => {
    const now = new Date(2026, 7, 16);
    const first = applyFootprintRecord(EMPTY_TRAINING_FOOTPRINT, '2026-08-16', 1, now);
    expect(first.changed).toBe(true);
    expect(first.state.lifetimeDays).toBe(1);

    const upgrade = applyFootprintRecord(first.state, '2026-08-16', 2, now);
    expect(upgrade.changed).toBe(true);
    expect(upgrade.state.lifetimeDays).toBe(1);
    expect(upgrade.state.days['2026-08-16']).toBe(2);

    const noop = applyFootprintRecord(upgrade.state, '2026-08-16', 1, now);
    expect(noop.changed).toBe(false);
    expect(noop.state).toBe(upgrade.state);
  });

  it('keeps unlocked badge ids when pruning heatmap days', () => {
    const now = new Date(2026, 7, 16);
    const start = {
      schemaVersion: 1 as const,
      days: { '2024-01-01': 3 as const, '2026-08-16': 1 as const },
      lifetimeDays: 40,
      unlockedBadgeIds: ['PR-01' as const, 'IGN-01' as const],
    };
    const upgraded = applyFootprintRecord(start, '2026-08-16', 2, now);
    expect(upgraded.state.days['2024-01-01']).toBeUndefined();
    expect(upgraded.state.lifetimeDays).toBe(40);
    expect(upgraded.state.unlockedBadgeIds).toEqual(['IGN-01', 'PR-01']);
  });

  it('counts unique active days in the Monday week', () => {
    const now = new Date(2026, 7, 16);
    const days = {
      '2026-08-10': 1 as const,
      '2026-08-12': 2 as const,
      '2026-08-16': 3 as const,
      '2026-08-09': 1 as const,
    };
    expect(countActiveDaysInLocalWeek(days, now)).toBe(3);
  });
});

describe('trainingFootprint PR', () => {
  it('treats the first finite score as archive (L2), not a PR', () => {
    expect(isPersonalRecord('strength', 90, undefined, [])).toBe(false);
    expect(resolveAssessmentFootprintLevel('strength', 90, undefined, [])).toBe(2);
  });

  it('detects a beat against history-axis max and prior live score', () => {
    const history = [record('a', { strength: 80 }), record('b', { strength: 88 })];
    expect(historicalMaxForMetric('strength', history)).toBe(88);
    expect(isPersonalRecord('strength', 88.1, 70, history)).toBe(true);
    expect(isPersonalRecord('strength', 88, 70, history)).toBe(false);
    expect(isPersonalRecord('strength', 85, 90, [])).toBe(false);
    expect(isPersonalRecord('strength', 91, 90, [])).toBe(true);
    expect(resolveAssessmentFootprintLevel('gripStrength', 120, 100, [])).toBe(3);
  });
});

describe('trainingFootprint month matrix', () => {
  it('aligns the first of the month to Monday columns', () => {
    const now = new Date(2026, 7, 16);
    const cells = buildMonthDotMatrix({ '2026-08-16': 3 }, now);
    expect(cells.length % 7).toBe(0);
    const first = cells.find((cell) => cell.dayOfMonth === 1);
    expect(first?.dateKey).toBe('2026-08-01');
    const highlighted = cells.find((cell) => cell.dateKey === '2026-08-16');
    expect(highlighted?.level).toBe(3);
  });

  it('derives weekly target and lifetime for the dashboard', () => {
    const now = new Date(2026, 7, 16);
    const view = deriveFootprintDashboard(
      { schemaVersion: 1, days: { '2026-08-16': 2 }, lifetimeDays: 12, unlockedBadgeIds: [] },
      now
    );
    expect(view.weeklyTarget).toBe(WEEKLY_RHYTHM_TARGET);
    expect(view.weeklyCount).toBe(1);
    expect(view.lifetimeDays).toBe(12);
  });
});
