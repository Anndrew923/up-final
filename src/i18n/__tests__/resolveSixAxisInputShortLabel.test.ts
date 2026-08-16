import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import { zhHantCommon } from '../locales/common';
import { resolveSixAxisInputShortLabel } from '../resolveSixAxisInputShortLabel';

type AxisLexiconBundle = {
  input: { short: Record<string, string> };
  output: { full: Record<string, string> };
};

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
    const lexicon = zhHantCommon.axisLexicon as AxisLexiconBundle;
    const inputLabel = resolveSixAxisInputShortLabel(t, metric);
    const outputLabel = lexicon.output.full[metric];
    expect(inputLabel).toBe(lexicon.input.short[metric]);
    expect(inputLabel).not.toBe(outputLabel);
  });
});
