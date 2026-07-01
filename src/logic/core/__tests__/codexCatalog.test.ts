import { describe, expect, it } from 'vitest';
import {
  CODEX_TABS,
  formatCodexTierRange,
  getBandsForCodexTab,
  getMetricForCodexTab,
  getUserScoreForCodexTab,
  isOverallGradeBandId,
} from '../codexCatalog';

const SAMPLE_SCORES = {
  overall: 72,
  strength: 80,
  explosivePower: 65,
  gripStrength: 150,
  cardio: 55,
  muscleMass: 70,
  bodyFat: 60,
  armSize: 45,
} as const;

describe('codexCatalog', () => {
  it('maps UI tabs to score-meaning metrics', () => {
    expect(getMetricForCodexTab('overall')).toBeNull();
    expect(getMetricForCodexTab('cooper')).toBe('cooper');
    expect(getMetricForCodexTab('fiveK')).toBe('cardio');
    expect(getMetricForCodexTab('gripStrength')).toBe('gripStrength');
    expect(getMetricForCodexTab('armSize')).toBe('armSize');
  });

  it('returns correct band ladder lengths per tab', () => {
    expect(getBandsForCodexTab('gripStrength').length).toBe(14);
    expect(getBandsForCodexTab('strength').length).toBe(14);
    expect(getBandsForCodexTab('overall').length).toBe(14);
    expect(getBandsForCodexTab('cooper').length).toBe(14);
  });

  it('grip pantheon gate is lower than strength (160 vs 180)', () => {
    const gripPantheon = getBandsForCodexTab('gripStrength').find((band) => band.id === 'PANTHEON');
    const strengthPantheon = getBandsForCodexTab('strength').find((band) => band.id === 'PANTHEON');
    expect(gripPantheon?.min).toBe(160);
    expect(strengthPantheon?.min).toBe(180);
  });

  it('resolves user score with shared cardio for cooper and fiveK', () => {
    expect(getUserScoreForCodexTab('cooper', SAMPLE_SCORES)).toBe(55);
    expect(getUserScoreForCodexTab('fiveK', SAMPLE_SCORES)).toBe(55);
    expect(getUserScoreForCodexTab('overall', SAMPLE_SCORES)).toBe(72);
  });

  it('formats pantheon tier as open-ended min+', () => {
    const pantheon = getBandsForCodexTab('overall').find((band) => band.id === 'PANTHEON');
    expect(pantheon).toBeDefined();
    expect(formatCodexTierRange(pantheon!)).toBe(`${pantheon!.min}+`);
  });

  it('exposes nine codex tabs', () => {
    expect(CODEX_TABS).toHaveLength(9);
  });

  it('isOverallGradeBandId narrows overall tier ids', () => {
    expect(isOverallGradeBandId('TIER_80')).toBe(true);
    expect(isOverallGradeBandId('BASE')).toBe(true);
    expect(isOverallGradeBandId('NOT_A_TIER')).toBe(false);
  });
});
