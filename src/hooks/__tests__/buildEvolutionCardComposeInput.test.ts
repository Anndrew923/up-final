import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { buildLogEvolutionReport } from '../../logic/core/logEvolutionReport';
import type { LocalHistoryRecord } from '../../logic/core/localHistoryRecord';
import { buildEvolutionCardComposeInput } from '../buildEvolutionCardComposeInput';

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

const NOW = row('now', '2026-03-01T00:00:00.000Z', 80, {
  strength: 85,
  explosivePower: 78,
  cardio: 80,
  muscleMass: 82,
  bodyFat: 84,
  gripStrength: 71,
});

const COPY: Record<string, string> = {
  'history.valueEmpty': '—',
  'history.evolution.cardBrand': 'ULTIMATE PHYSIQUE // EVOLUTION LOG',
  'history.evolution.cardDateRange': 'DAY 1 ({{from}}) → NOW ({{to}})',
  'history.evolution.overallLabel': 'OVERALL POWER',
  'history.evolution.baselineLocked': 'DAY 1 BASELINE LOCKED',
  'history.evolution.prBadge': 'PR',
  'history.evolution.legendBaseline': 'Baseline ({{date}})',
  'history.evolution.legendCurrent': 'Current ({{date}})',
  'home.radar.axisChart.strength': 'STR',
  'home.radar.axisChart.explosivePower': 'PWR',
  'home.radar.axisChart.cardio': 'END',
  'home.radar.axisChart.muscleMass': 'SMM',
  'home.radar.axisChart.bodyFat': 'FFMI',
  'home.radar.axisChart.gripStrength': 'GRP',
};

const fakeT = ((key: string, options?: Record<string, unknown>) => {
  const template = COPY[key] ?? key;
  if (!options) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options[name] ?? ''));
}) as unknown as TFunction;

describe('buildEvolutionCardComposeInput', () => {
  it('maps comparing report into canvas copy without hardcoding brand strings', () => {
    const report = buildLogEvolutionReport([DAY1, NOW]);
    const input = buildEvolutionCardComposeInput(report, fakeT);
    expect(input.mode).toBe('comparing');
    expect(input.copy.brandHeader).toBe('ULTIMATE PHYSIQUE // EVOLUTION LOG');
    expect(input.copy.dateRange).toContain('DAY 1 (');
    expect(input.copy.dateRange).toContain('→ NOW (');
    expect(input.baselineAxes).toHaveLength(6);
    expect(input.currentAxes).toHaveLength(6);
    expect(input.overallDelta).toBe(20);
    expect(input.deltas.some((d) => d.axis === 'strength' && d.isPersonalBest)).toBe(true);
    expect(input.copy.legendBaseline).toContain('Baseline (');
    expect(input.copy.legendCurrent).toContain('Current (');
  });
});
