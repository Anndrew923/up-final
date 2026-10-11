import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { resolveSixAxisChartLabel } from '../resolveSixAxisChartLabel';

describe('resolveSixAxisChartLabel', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('zh-Hant');
  });

  it('returns fitness-first compact chart labels without raw key fallback', () => {
    const t = i18n.getFixedT('zh-Hant', 'common');
    expect(resolveSixAxisChartLabel(t, 'bodyFat')).toBe('FFMI');
    expect(resolveSixAxisChartLabel(t, 'strength')).toBe('力量');
    expect(resolveSixAxisChartLabel(t, 'explosivePower')).toBe('爆發力');
    expect(resolveSixAxisChartLabel(t, 'strength')).not.toContain('axisChart');
  });
});
