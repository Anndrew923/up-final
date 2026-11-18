import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { buildAestheticAxisSummaryExportInput } from '../buildAestheticAxisSummaryExportInput';

function fakeT(key: string, opts?: Record<string, unknown>): string {
  if (key === 'aesthetic.axisSummary.coverageLabel') return '評測覆蓋';
  if (key === 'aesthetic.axisSummary.coverageReadingZh') {
    return `${opts?.count ?? 0} 項綜合`;
  }
  if (key === 'aesthetic.axisSummary.coverageUnitLifts') return 'LIFTS';
  if (key === 'aesthetic.axisSummary.coverageUnitTests') return 'TESTS';
  if (key === 'aesthetic.axisSummary.strength.titleZh') return '力量綜合評測';
  if (key === 'aesthetic.axisSummary.strength.titleEn') return 'STRENGTH TEST';
  if (key === 'aesthetic.axisSummary.explosivePower.titleZh') return '爆發力綜合評測';
  if (key === 'aesthetic.axisSummary.explosivePower.titleEn') return 'EXPLOSIVE TEST';
  if (key === 'aesthetic.axisSummary.muscleMass.titleZh') return '骨骼肌綜合評測';
  if (key === 'aesthetic.axisSummary.muscleMass.titleEn') return 'MUSCLE MASS TEST';
  if (key === 'aesthetic.singleLeaf.upRatingLabel') return '戰力評分';
  if (key === 'aesthetic.singleLeaf.verifiedStamp') {
    return `VERIFIED PHYSIOLOGICAL SPECIFICATION // ${opts?.year}`;
  }
  if (key === 'aesthetic.labels.brandHeader') return '最強肉體 // 生理統治力';
  if (key === 'dynoIntel.humanPraise.byDecade.70.populationClass') return '進階訓練者';
  if (key === 'dynoIntel.humanPraise.byDecade.100.populationClass') return '凡體覺醒';
  if (key.startsWith('dynoIntel.humanPraise.byDecade.')) return '嬰兒期';
  return key;
}

function fakeEnT(key: string, opts?: Record<string, unknown>): string {
  if (key === 'aesthetic.axisSummary.coverageLabel') return 'COVERAGE';
  if (key === 'aesthetic.axisSummary.coverageUnitLifts') return 'LIFTS';
  if (key === 'aesthetic.axisSummary.coverageUnitTests') return 'TESTS';
  if (key === 'aesthetic.axisSummary.strength.titleZh') return '力量綜合評測';
  if (key === 'aesthetic.axisSummary.strength.titleEn') return 'STRENGTH TEST';
  if (key === 'aesthetic.axisSummary.explosivePower.titleZh') return '爆發力綜合評測';
  if (key === 'aesthetic.axisSummary.explosivePower.titleEn') return 'EXPLOSIVE TEST';
  if (key === 'aesthetic.axisSummary.muscleMass.titleZh') return '骨骼肌綜合評測';
  if (key === 'aesthetic.axisSummary.muscleMass.titleEn') return 'MUSCLE MASS TEST';
  if (key === 'aesthetic.singleLeaf.upRatingLabel') return 'UP RATING';
  if (key === 'aesthetic.singleLeaf.verifiedStamp') {
    return `VERIFIED PHYSIOLOGICAL SPECIFICATION // ${opts?.year}`;
  }
  if (key === 'aesthetic.labels.brandHeader') return 'ULTIMATE PHYSIQUE';
  if (key === 'dynoIntel.humanPraise.byDecade.70.populationClass') return 'Advanced Lifter';
  if (key.startsWith('dynoIntel.humanPraise.byDecade.')) return 'Rookie';
  return key;
}

describe('buildAestheticAxisSummaryExportInput', () => {
  it('builds strength composite plate at 70.40 with coverage + Advanced Lifter tier', () => {
    const input = buildAestheticAxisSummaryExportInput(
      fakeT as unknown as TFunction,
      { axis: 'strength', heroScore: 70.4, coveredCount: 5 },
      { mode: 'carbon', aspectRatio: '9:16', uiLocale: 'zh' }
    );

    expect(input.reportType).toBe('axis-summary');
    expect(input.axis).toBe('strength');
    expect(input.leafTitleZh).toBe('力量綜合評測');
    expect(input.leafTitleEn).toBe('STRENGTH TEST');
    expect(input.rawMetricLabel).toBe('評測覆蓋');
    expect(input.rawReading).toBe('5 項綜合');
    expect(input.heroScoreText).toBe('70.40');
    expect(input.tierCapsule).toBe('進階訓練者');
    expect(input.isOverflow).toBe(false);
    expect(input).not.toHaveProperty('leaf');
    expect(input.verdict?.epithet).toBe('阻力征服者');
    expect(input.verdict?.critique).toBe(
      '躋身健身房前段班；穩紮穩打遠離傷病，當前力量已足以稱霸一方。'
    );
    expect(input.verdict?.critiqueLines.length).toBeGreaterThanOrEqual(1);
    expect(input.verdict?.critiqueLines.length).toBeLessThanOrEqual(2);
  });

  it('formats EN strength coverage as N LIFTS for selfie mixed type', () => {
    const input = buildAestheticAxisSummaryExportInput(
      Object.assign(fakeEnT, { language: 'en' }) as unknown as TFunction,
      { axis: 'strength', heroScore: 70.4, coveredCount: 5 },
      { mode: 'selfie', aspectRatio: '4:5', uiLocale: 'en' }
    );
    expect(input.rawReading).toBe('5 LIFTS');
    expect(input.rawMetricLabel).toBe('COVERAGE');
    expect(input.tierCapsule).toBe('Advanced Lifter');
    expect(input.verdict).toBeUndefined();
  });

  it.each(['en', 'en-US'] as const)(
    'resolves English carbon verdict + titles from t.language=%s',
    (language) => {
      const tEn = Object.assign(
        (key: string, opts?: Record<string, unknown>) => fakeEnT(key, opts),
        { language }
      ) as unknown as TFunction;
      const input = buildAestheticAxisSummaryExportInput(
        tEn,
        { axis: 'strength', heroScore: 70.4, coveredCount: 5 },
        { mode: 'carbon', aspectRatio: '9:16' }
      );
      expect(input.uiLocale).toBe('en');
      expect(input.verdict?.epithet).toBe('LOAD CONQUEROR');
      expect(input.verdict?.critique).toMatch(/Among the strongest lifters/);
      expect(input.leafTitleEn).toBe('STRENGTH TEST');
      expect(input.rawReading).toBe('5 LIFTS');
      // Visible plate fields (not leafTitleZh payload) must stay CJK-free.
      const visible = [
        input.leafTitleEn,
        input.rawMetricLabel,
        input.rawReading,
        input.upRatingLabel,
        input.heroScoreText,
        input.tierCapsule,
        input.brandHeader ?? '',
        input.verifiedStamp ?? '',
        input.verdict?.epithet ?? '',
        input.verdict?.critique ?? '',
        ...(input.verdict?.critiqueLines ?? []),
      ].join('\n');
      expect(/[\u4e00-\u9fff]/.test(visible)).toBe(false);
    }
  );

  it('formats explosive/muscle EN coverage as N TESTS and golds at >= 100', () => {
    const explosive = buildAestheticAxisSummaryExportInput(
      Object.assign(fakeEnT, { language: 'en' }) as unknown as TFunction,
      { axis: 'explosivePower', heroScore: 88, coveredCount: 2 },
      { mode: 'carbon', aspectRatio: '9:16', uiLocale: 'en' }
    );
    expect(explosive.rawReading).toBe('2 TESTS');
    expect(explosive.leafTitleEn).toBe('EXPLOSIVE TEST');

    const overflow = buildAestheticAxisSummaryExportInput(
      fakeT as unknown as TFunction,
      { axis: 'muscleMass', heroScore: 105, coveredCount: 2 },
      { mode: 'carbon', aspectRatio: '9:16', uiLocale: 'zh' }
    );
    expect(overflow.isOverflow).toBe(true);
    expect(overflow.tierCapsule).toBe('凡體覺醒');
    expect(overflow.leafTitleZh).toBe('骨骼肌綜合評測');
  });
});
