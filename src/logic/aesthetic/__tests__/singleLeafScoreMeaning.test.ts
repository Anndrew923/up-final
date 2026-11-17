import { describe, expect, it } from 'vitest';
import {
  SINGLE_LEAF_EN_TITLE,
  SINGLE_LEAF_ENGLISH_NAME_KEY,
  SINGLE_LEAF_SCORE_MEANING_METRIC,
  SINGLE_LEAF_ZH_TITLE,
  scoreMeaningMetricForSingleLeaf,
  singleLeafEnTitle,
  singleLeafEnglishNameKey,
  singleLeafZhTitle,
} from '../singleLeafScoreMeaning';
import { SINGLE_LEAF_IDS } from '../singleLeafReport';
import enAesthetic from '../../../i18n/locales/en/common/aesthetic.json';
import zhAesthetic from '../../../i18n/locales/zh-Hant/common/aesthetic.json';

describe('singleLeafScoreMeaning', () => {
  it('covers every SingleLeafId with score-meaning + title maps', () => {
    for (const leaf of SINGLE_LEAF_IDS) {
      expect(SINGLE_LEAF_SCORE_MEANING_METRIC[leaf]).toBeTruthy();
      expect(SINGLE_LEAF_ENGLISH_NAME_KEY[leaf]).toBeTruthy();
      expect(SINGLE_LEAF_ZH_TITLE[leaf]).toBeTruthy();
      expect(SINGLE_LEAF_EN_TITLE[leaf]).toBeTruthy();
      expect(scoreMeaningMetricForSingleLeaf(leaf)).toBe(
        SINGLE_LEAF_SCORE_MEANING_METRIC[leaf]
      );
      expect(singleLeafEnglishNameKey(leaf)).toBe(SINGLE_LEAF_ENGLISH_NAME_KEY[leaf]);
      expect(singleLeafZhTitle(leaf)).toBe(SINGLE_LEAF_ZH_TITLE[leaf]);
      expect(singleLeafEnTitle(leaf)).toBe(SINGLE_LEAF_EN_TITLE[leaf]);
    }
  });

  it('maps specialty leaves to the expected band metrics', () => {
    expect(scoreMeaningMetricForSingleLeaf('ffmi')).toBe('bodyFat');
    expect(scoreMeaningMetricForSingleLeaf('grip')).toBe('gripStrength');
    expect(scoreMeaningMetricForSingleLeaf('cardio.cooper')).toBe('cooper');
    expect(scoreMeaningMetricForSingleLeaf('armSize')).toBe('armSize');
  });

  it('keeps plate titles in parity with aesthetic.json catalogs', () => {
    for (const leaf of SINGLE_LEAF_IDS) {
      const key = singleLeafEnglishNameKey(leaf);
      expect(singleLeafZhTitle(leaf)).toBe(zhAesthetic.aesthetic.singleLeaf.labels[key]);
      expect(singleLeafEnTitle(leaf)).toBe(
        zhAesthetic.aesthetic.singleLeaf.englishNames[key]
      );
      expect(singleLeafEnTitle(leaf)).toBe(
        enAesthetic.aesthetic.singleLeaf.englishNames[key]
      );
      expect(singleLeafEnTitle(leaf)).toMatch(/^[A-Z0-9][A-Z0-9 \-]*$/);
    }
  });

  it('rejects vehicle jargon in plate title copy', () => {
    const banned = ['馬力', '進氣', '扭矩', '底盤', '增壓', '排量', '車體', 'horsepower', 'chassis'];
    const blob = JSON.stringify({
      zh: SINGLE_LEAF_ZH_TITLE,
      en: SINGLE_LEAF_EN_TITLE,
    });
    for (const word of banned) {
      expect(blob.toLowerCase().includes(word.toLowerCase())).toBe(false);
    }
  });
});
