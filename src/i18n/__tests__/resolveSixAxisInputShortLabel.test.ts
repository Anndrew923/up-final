import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import { zhHantCommon } from '../locales/common';
import { resolveSixAxisInputShortLabel } from '../resolveSixAxisInputShortLabel';

describe('resolveSixAxisInputShortLabel', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('returns fitness-science labels without raw key fallback', () => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    expect(resolveSixAxisInputShortLabel(t, 'strength')).toBe('力量');
    expect(resolveSixAxisInputShortLabel(t, 'bodyFat')).toBe('FFMI');
    expect(resolveSixAxisInputShortLabel(t, 'strength')).not.toContain('input.short');
  });

  it.each(SIX_AXIS_METRICS)('zh-Hant %s stays on input.short track, not output.full', (metric) => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    const inputLabel = resolveSixAxisInputShortLabel(t, metric);
    const outputLabel = zhHantCommon.axisLexicon.output.full[metric];
    expect(inputLabel).toBe(zhHantCommon.axisLexicon.input.short[metric]);
    expect(inputLabel).not.toBe(outputLabel);
  });
});
