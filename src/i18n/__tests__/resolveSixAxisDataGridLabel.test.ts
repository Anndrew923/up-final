import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { resolveSixAxisDataGridLabelParts } from '../resolveSixAxisDataGridLabel';
import { resolveSixAxisChartLabel } from '../resolveSixAxisChartLabel';
import { SIX_AXIS_METRICS } from '../../types/scoring';

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

  it('zh-Hant strength line reads as 馬力 · 力量 // HP', () => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const parts = resolveSixAxisDataGridLabelParts(t, 'strength');
    expect(parts.chart).toBe('馬力');
    expect(parts.inputShort).toBe('力量');
    expect(parts.code).toBe('HP');
  });
});
