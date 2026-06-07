import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import {
  formatSixAxisDataGridTitle,
  formatSixAxisDataGridVisibleLabel,
  resolveSixAxisDataGridLabelParts,
} from '../resolveSixAxisDataGridLabel';
import { resolveSixAxisChartLabel } from '../resolveSixAxisChartLabel';
import { SIX_AXIS_METRICS, type SixAxisMetric } from '../../types/scoring';

const ZH_COLLAPSED_METRICS = [
  'cardio',
  'bodyFat',
  'muscleMass',
  'gripStrength',
] as const satisfies readonly SixAxisMetric[];

const ZH_DUAL_TRACK_METRICS = ['strength', 'explosivePower'] as const satisfies readonly SixAxisMetric[];

describe('resolveSixAxisDataGridLabelParts', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it.each(SIX_AXIS_METRICS)('zh-Hant %s bridges chart, fitness short, and code without raw keys', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);

    expect(parts.chart).toBe(resolveSixAxisChartLabel(t, metric));
    expect(parts.inputShort).toBe(t(`axisLexicon.input.short.${metric}`, { ns: 'common' }));
    expect(parts.code).toBe(t(`axisLexicon.output.code.${metric}`, { ns: 'common' }));
    expect(parts.chart).not.toContain('axisLexicon');
    expect(parts.inputShort).not.toContain('input.short');
    expect(parts.code.length).toBeGreaterThan(0);
  });

  it.each(ZH_DUAL_TRACK_METRICS)('zh-Hant %s visible label shows chart · fitness bridge', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, metric);
    const visible = formatSixAxisDataGridVisibleLabel(parts);

    expect(parts.chart).not.toBe(parts.inputShort);
    expect(visible).toBe(`${parts.chart} · ${parts.inputShort}`);
    expect(visible).not.toMatch(new RegExp(`${parts.chart}\\s*·\\s*${parts.chart}`));
  });

  it.each(ZH_COLLAPSED_METRICS)(
    'zh-Hant %s collapses to chart-only visible label (no duplicate 詞 · 詞)',
    (metric) => {
      const t = i18n.getFixedT('zh-Hant', 'common');
      const parts = resolveSixAxisDataGridLabelParts(t, metric);
      const visible = formatSixAxisDataGridVisibleLabel(parts);

      expect(parts.chart).toBe(parts.inputShort);
      expect(visible).toBe(parts.chart);
      expect(visible).not.toContain(' · ');
      expect(visible).not.toMatch(/(.+)\s·\s\1/);
    }
  );

  it('zh-Hant strength visible is 馬力 · 力量; title retains // HP', () => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, 'strength');
    expect(formatSixAxisDataGridVisibleLabel(parts)).toBe('馬力 · 力量');
    expect(formatSixAxisDataGridTitle(parts)).toBe('馬力 · 力量 // HP');
  });

  it('zh-Hant cardio visible is 續航 only (never 續航 · 續航)', () => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, 'cardio');
    expect(formatSixAxisDataGridVisibleLabel(parts)).toBe('續航');
    expect(formatSixAxisDataGridVisibleLabel(parts)).not.toBe('續航 · 續航');
    expect(formatSixAxisDataGridTitle(parts)).toBe('續航 · 續航 // STINT');
  });
});
