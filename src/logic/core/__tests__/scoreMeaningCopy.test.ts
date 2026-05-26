import { describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import { resolveCodexBandRowCopy, translateScoreBandMeaning } from '../scoreMeaningCopy';

describe('scoreMeaningCopy', () => {
  it('resolveCodexBandRowCopy matches translateScoreBandMeaning at band.min', async () => {
    await i18n.changeLanguage('zh-Hant');
    const t = i18n.t.bind(i18n);

    const byScore = translateScoreBandMeaning(t, 'strength', 80);
    const byBand = resolveCodexBandRowCopy(t, 'strength', 'TIER_80');

    expect(byBand.title).toBe(byScore.title);
    expect(byBand.summary).toBe(byScore.summary);
  });

  it('uses fallback when band copy key is missing', async () => {
    await i18n.changeLanguage('en');
    const t = i18n.t.bind(i18n);
    const copy = resolveCodexBandRowCopy(t, 'strength', 'NONEXISTENT_BAND_XX');

    expect(copy.title).toBe(t('scoreMeaning.fallback.title'));
    expect(copy.summary).toBe(t('scoreMeaning.fallback.summary'));
  });
});
