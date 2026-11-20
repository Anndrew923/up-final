import { describe, expect, it } from 'vitest';
import type { LocalHistoryRecord } from '../localHistoryRecord';
import {
  badgeMapFromReport,
  buildLogEvolutionReport,
  sortHistoryAscending,
} from '../logEvolutionReport';

function row(
  id: string,
  createdAt: string,
  overall: number,
  scores: LocalHistoryRecord['scores']
): LocalHistoryRecord {
  return { id, createdAt, overallScore: overall, scores };
}

const DAY1 = row('day1', '2026-01-01T00:00:00.000Z', 60, {
  strength: 50,
  explosivePower: 55,
  cardio: 60,
  muscleMass: 65,
  bodyFat: 70,
  gripStrength: 60,
});

const MID = row('mid', '2026-02-01T00:00:00.000Z', 72, {
  strength: 70,
  explosivePower: 68,
  cardio: 72,
  muscleMass: 74,
  bodyFat: 76,
  gripStrength: 72,
});

const NOW = row('now', '2026-03-01T00:00:00.000Z', 80, {
  strength: 85,
  explosivePower: 78,
  cardio: 80,
  muscleMass: 82,
  bodyFat: 84,
  gripStrength: 71,
});

describe('sortHistoryAscending', () => {
  it('defends against newest-first store order', () => {
    const sorted = sortHistoryAscending([NOW, DAY1, MID]);
    expect(sorted.map((r) => r.id)).toEqual(['day1', 'mid', 'now']);
  });
});

describe('buildLogEvolutionReport', () => {
  it('returns baseline_ready for empty archive', () => {
    const report = buildLogEvolutionReport([]);
    expect(report.mode).toBe('baseline_ready');
    expect(report.day1BaselineId).toBeNull();
    expect(report.current).toBeNull();
    expect(report.deltas).toEqual([]);
    expect(report.overallDelta).toBeNull();
    expect(report.badges).toEqual([]);
  });

  it('locks Day 1 on single-row archive without negative deltas', () => {
    const report = buildLogEvolutionReport([DAY1]);
    expect(report.mode).toBe('baseline_ready');
    expect(report.day1BaselineId).toBe('day1');
    expect(report.selectedBaselineId).toBe('day1');
    expect(report.current?.id).toBe('day1');
    expect(report.baseline?.id).toBe('day1');
    expect(report.deltas).toEqual([]);
    expect(report.overallDelta).toBeNull();
    expect(report.badges).toEqual([
      { id: 'day1', isDay1Baseline: true, isPersonalBest: false },
    ]);
  });

  it('compares Day 1 vs newest with round2 deltas by default', () => {
    const report = buildLogEvolutionReport([NOW, DAY1, MID]);
    expect(report.mode).toBe('comparing');
    expect(report.day1BaselineId).toBe('day1');
    expect(report.selectedBaselineId).toBe('day1');
    expect(report.previousLogId).toBe('mid');
    expect(report.current?.id).toBe('now');
    expect(report.baseline?.id).toBe('day1');
    expect(report.overallDelta).toBe(20);

    const strength = report.deltas.find((d) => d.axis === 'strength');
    expect(strength).toMatchObject({ from: 50, to: 85, delta: 35, isPersonalBest: true });

    const grip = report.deltas.find((d) => d.axis === 'gripStrength');
    expect(grip).toMatchObject({ from: 60, to: 71, delta: 11 });
    expect(grip?.isPersonalBest).toBe(false);
  });

  it('switches baseline to previous log when selected', () => {
    const report = buildLogEvolutionReport([DAY1, MID, NOW], {
      selectedBaselineId: 'mid',
    });
    expect(report.mode).toBe('comparing');
    expect(report.selectedBaselineId).toBe('mid');
    expect(report.baseline?.id).toBe('mid');
    expect(report.overallDelta).toBe(8);
    expect(report.deltas.find((d) => d.axis === 'strength')).toMatchObject({
      from: 70,
      to: 85,
      delta: 15,
    });
  });

  it('falls back to Day 1 when selectedBaselineId is missing or deleted', () => {
    const missing = buildLogEvolutionReport([DAY1, NOW], {
      selectedBaselineId: 'ghost',
    });
    expect(missing.selectedBaselineId).toBe('day1');
    expect(missing.baseline?.id).toBe('day1');

    const deleted = buildLogEvolutionReport([DAY1, NOW], {
      selectedBaselineId: 'mid',
    });
    expect(deleted.selectedBaselineId).toBe('day1');
  });

  it('stays baseline_ready when baseline equals current even with ≥2 rows', () => {
    const report = buildLogEvolutionReport([DAY1, NOW], {
      selectedBaselineId: 'now',
    });
    expect(report.mode).toBe('baseline_ready');
    expect(report.deltas).toEqual([]);
    expect(report.overallDelta).toBeNull();
  });

  it('skips axes missing on either side without NaN', () => {
    const sparseDay1 = row('day1', '2026-01-01T00:00:00.000Z', 50, {
      strength: 40,
      cardio: 50,
    });
    const sparseNow = row('now', '2026-03-01T00:00:00.000Z', 70, {
      strength: 80,
      explosivePower: 90,
      gripStrength: 60,
    });
    const report = buildLogEvolutionReport([sparseNow, sparseDay1]);
    expect(report.mode).toBe('comparing');
    expect(report.deltas.every((d) => Number.isFinite(d.delta))).toBe(true);
    expect(report.deltas.map((d) => d.axis)).toEqual(['strength']);
    expect(report.deltas[0]).toMatchObject({ from: 40, to: 80, delta: 40 });
  });

  it('marks PR badges on later rows that beat priors; Day 1 is never PR', () => {
    const report = buildLogEvolutionReport([DAY1, MID, NOW]);
    const map = badgeMapFromReport(report);
    expect(map.get('day1')).toEqual({
      id: 'day1',
      isDay1Baseline: true,
      isPersonalBest: false,
    });
    expect(map.get('mid')?.isPersonalBest).toBe(true);
    expect(map.get('now')?.isPersonalBest).toBe(true);
    expect(map.get('now')?.isDay1Baseline).toBe(false);
  });
});
