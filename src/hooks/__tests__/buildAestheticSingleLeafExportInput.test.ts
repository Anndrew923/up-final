import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { buildAestheticSingleLeafExportInput } from '../buildAestheticSingleLeafExportInput';
import type { SingleLeafReportResult } from '../../logic/aesthetic/singleLeafReport';
import { SINGLE_LEAF_VERDICT_SLOT_HEIGHT } from '../../lib/telemetryReportTypes';

const leafOk: Extract<SingleLeafReportResult, { status: 'ok' }> = {
  status: 'ok',
  leaf: 'strength.benchPress',
  axisBucket: 'strength',
  labelKey: 'aesthetic.singleLeaf.labels.benchPress',
  rawReading: '110 KG × 1',
  heroScore: 80.31,
  isOverflow: false,
};

/** Decade populationClass mirrors dynoIntel.humanPraise.byDecade SSOT (zh). */
const ZH_POPULATION_CLASS: Record<string, string> = {
  '0': '嬰兒期',
  '80': '高階玩家',
  '100': '凡體覺醒',
  '110': '超凡入聖',
  '120': '歷史級別',
  '130': '統計神話',
  '140': '怪物領域',
  '150': '地表最強',
};

const EN_POPULATION_CLASS: Record<string, string> = {
  '80': 'Highly Trained',
  '100': 'Genetic Outlier',
  '110': 'Elite',
  '120': 'World Class',
  '130': 'Historic',
  '140': 'Open',
  '150': 'Apex',
};

function fakeT(key: string, opts?: Record<string, unknown>): string {
  if (key === 'aesthetic.singleLeaf.rawMetricLabel') return '實測數據';
  if (key === 'aesthetic.singleLeaf.upRatingLabel') return '戰力評分';
  if (key === 'aesthetic.singleLeaf.verifiedStamp') {
    return `VERIFIED PHYSIOLOGICAL SPECIFICATION // ${opts?.year}`;
  }
  if (key === 'aesthetic.labels.brandHeader') return '最強肉體 // 生理統治力';
  const decadeMatch = /^dynoIntel\.humanPraise\.byDecade\.(\d+)\.populationClass$/.exec(key);
  if (decadeMatch) {
    return ZH_POPULATION_CLASS[decadeMatch[1]] ?? '嬰兒期';
  }
  return key;
}

function fakeEnT(key: string, opts?: Record<string, unknown>): string {
  if (key === 'aesthetic.singleLeaf.rawMetricLabel') return 'RAW METRIC';
  if (key === 'aesthetic.singleLeaf.upRatingLabel') return 'UP RATING';
  if (key === 'aesthetic.singleLeaf.verifiedStamp') {
    return `VERIFIED PHYSIOLOGICAL SPECIFICATION // ${opts?.year}`;
  }
  if (key === 'aesthetic.labels.brandHeader') return 'ULTIMATE PHYSIQUE // DOMINANCE';
  const decadeMatch = /^dynoIntel\.humanPraise\.byDecade\.(\d+)\.populationClass$/.exec(key);
  if (decadeMatch) {
    return EN_POPULATION_CLASS[decadeMatch[1]] ?? 'Highly Trained';
  }
  return key;
}

describe('buildAestheticSingleLeafExportInput', () => {
  it('builds dual-hero plate copy with language-stable bilingual titles', () => {
    const input = buildAestheticSingleLeafExportInput(fakeT as unknown as TFunction, leafOk, {
      mode: 'carbon',
      aspectRatio: '9:16',
    });

    expect(input.reportType).toBe('single-leaf');
    expect(input.leafTitleZh).toBe('槓鈴臥推');
    expect(input.leafTitleEn).toBe('BARBELL BENCH PRESS');
    expect(input.uiLocale).toBe('zh');
    expect(input.rawReading).toBe('110 KG × 1');
    expect(input.heroScoreText).toBe('80.31');
    expect(input.rawMetricLabel).toBe('實測數據');
    expect(input.upRatingLabel).toBe('戰力評分');
    expect(input.tierCapsule).toBe('高階玩家');
    expect(input.verdict?.epithet).toBe('重載穩壓者');
    expect(input.verdict?.critique).toBe(
      '紮實肌力千錘百鍊，力量輸出媲美優秀專項競技運動員。'
    );
    expect(input.verdict?.critiqueLines.length).toBeGreaterThanOrEqual(1);
    expect(input.verdict?.critiqueLines.length).toBeLessThanOrEqual(2);
    expect(input.verdict?.critiqueLines.join('')).toContain('紮實肌力');
    expect(input.verifiedStamp).toMatch(/^VERIFIED PHYSIOLOGICAL SPECIFICATION \/\/ /);
    expect(input).not.toHaveProperty('normRatingLine');
    expect(input).not.toHaveProperty('battleCode');
    expect(input).not.toHaveProperty('unlockedAxesLabel');
    expect(SINGLE_LEAF_VERDICT_SLOT_HEIGHT).toBe(125);
  });

  it('keeps decade populationClass on tierCapsule when heroScore >= 100 (overflow gold only)', () => {
    const cases: Array<{ score: number; decade: string; zh: string }> = [
      { score: 100, decade: '100', zh: '凡體覺醒' },
      { score: 110, decade: '110', zh: '超凡入聖' },
      { score: 120, decade: '120', zh: '歷史級別' },
      { score: 130, decade: '130', zh: '統計神話' },
      { score: 140, decade: '140', zh: '怪物領域' },
      { score: 150, decade: '150', zh: '地表最強' },
      { score: 165, decade: '150', zh: '地表最強' },
    ];

    for (const { score, decade, zh } of cases) {
      const overflowLeaf: typeof leafOk = {
        ...leafOk,
        heroScore: score,
        isOverflow: true,
      };
      const input = buildAestheticSingleLeafExportInput(
        fakeT as unknown as TFunction,
        overflowLeaf,
        { mode: 'selfie', aspectRatio: '4:5' }
      );
      expect(input.isOverflow).toBe(true);
      expect(input.tierCapsule).toBe(zh);
      expect(input).not.toHaveProperty('overflowBadge');
      expect(EN_POPULATION_CLASS[decade]).toBeTruthy();
    }
  });

  it('honors uiLocale override for selfie single-line English title', () => {
    const input = buildAestheticSingleLeafExportInput(fakeT as unknown as TFunction, leafOk, {
      mode: 'selfie',
      aspectRatio: '9:16',
      uiLocale: 'en',
    });
    expect(input.uiLocale).toBe('en');
    expect(input.leafTitleEn).toBe('BARBELL BENCH PRESS');
    expect(input.verdict).toBeUndefined();
  });

  it.each(['en', 'en-US'] as const)(
    'resolves English carbon verdict from t.language=%s',
    (language) => {
      const tEn = Object.assign(
        (key: string, opts?: Record<string, unknown>) => fakeEnT(key, opts),
        { language }
      ) as unknown as TFunction;
      const input = buildAestheticSingleLeafExportInput(tEn, leafOk, {
        mode: 'carbon',
        aspectRatio: '9:16',
      });
      expect(input.uiLocale).toBe('en');
      expect(input.verdict?.epithet).toBe('IRON STABILIZER');
      expect(input.verdict?.critique).toMatch(/Hard-forged muscular strength/);
      expect(input.leafTitleEn).toBe('BARBELL BENCH PRESS');
      expect(input.leafTitleZh).toBe('槓鈴臥推');
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
});
