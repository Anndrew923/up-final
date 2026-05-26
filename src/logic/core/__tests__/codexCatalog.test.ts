import { describe, expect, it } from 'vitest';
import {
  CODEX_TABS,
  formatCodexTierRange,
  getBandsForCodexTab,
  getMetricForCodexTab,
  getUserScoreForCodexTab,
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
    expect(getBandsForCodexTab('gripStrength').length).toBe(16);
    expect(getBandsForCodexTab('strength').length).toBe(14);
    expect(getBandsForCodexTab('overall').length).toBe(14);
    expect(getBandsForCodexTab('cooper').length).toBe(14);
  });

  it('grip ladder differs from strength ladder', () => {
    expect(getBandsForCodexTab('gripStrength').map((band) => band.id)).not.toEqual(
      getBandsForCodexTab('strength').map((band) => band.id)
    );
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
});
