import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../../types/scoring';
import {
  resolveConsoleDataGridPrimary,
  resolveConsoleOverallAverageLabel,
  resolveConsoleRadarVertexLabel,
} from '../resolveConsoleAxisViewLabels';

const ZH_TELEMETRY_GRID: Record<SixAxisMetric, string> = {
  strength: '整車馬力 // HP',
  explosivePower: '瞬態扭矩 // TRQ',
  cardio: '核心續航 // STINT',
  muscleMass: '車體外觀 // CHSS',
  bodyFat: '引擎排量 // P2W',
  gripStrength: '機械抓地力 // GRIP',
};

const ZH_TELEMETRY_VERTEX: Record<SixAxisMetric, string> = {
  strength: '馬力',
  explosivePower: '扭矩',
  cardio: '續航',
  muscleMass: '外觀',
  bodyFat: '排量',
  gripStrength: '抓地',
};

describe('resolveConsoleAxisViewLabels', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it.each(SIX_AXIS_METRICS)('fitness radar vertex stays sport chart for %s', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    expect(resolveConsoleRadarVertexLabel(t, metric, 'fitness')).toBe(
      t(`home.radar.axisChart.${metric}`, { ns: 'common' })
    );
  });

  it.each(SIX_AXIS_METRICS)('telemetry radar vertex uses mechShort for %s', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    expect(resolveConsoleRadarVertexLabel(t, metric, 'telemetry')).toBe(
      ZH_TELEMETRY_VERTEX[metric]
    );
  });

  it.each(SIX_AXIS_METRICS)('fitness grid primary is pure sport for %s', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const primary = resolveConsoleDataGridPrimary(t, metric, 'fitness');
    expect(primary).toBe(t(`axisLexicon.input.grid.${metric}`, { ns: 'common' }));
    expect(primary).not.toMatch(/\/\//);
  });

  it.each(SIX_AXIS_METRICS)('telemetry grid primary is Noun // CODE for %s', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    expect(resolveConsoleDataGridPrimary(t, metric, 'telemetry')).toBe(
      ZH_TELEMETRY_GRID[metric]
    );
  });

  it('resolves dual-mode overall index labels without key leak', () => {
    const tZh = i18n.getFixedT('zh-Hant', 'common');
    const tEn = i18n.getFixedT('en', 'common');
    expect(resolveConsoleOverallAverageLabel(tZh, 'fitness')).toBe('綜合戰力指數');
    expect(resolveConsoleOverallAverageLabel(tZh, 'telemetry')).toBe('整車性能指數');
    expect(resolveConsoleOverallAverageLabel(tEn, 'fitness')).toBe('Overall Power Index');
    expect(resolveConsoleOverallAverageLabel(tEn, 'telemetry')).toBe('Overall Vehicle Index');
    expect(resolveConsoleOverallAverageLabel(tZh, 'fitness')).not.toContain('overallAverage');
  });

  it('keeps home.overallAverage leaf parity-locked to console telemetry overall label', () => {
    // WHY: Resonance / diagnostics still read the leaf; must stay the telemetry wording.
    for (const locale of ['zh-Hant', 'en'] as const) {
      const t = i18n.getFixedT(locale, 'common');
      expect(t('home.overallAverage', { ns: 'common' })).toBe(
        resolveConsoleOverallAverageLabel(t, 'telemetry')
      );
    }
  });
});
