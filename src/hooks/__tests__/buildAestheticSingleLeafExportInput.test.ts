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

function fakeT(key: string, opts?: Record<string, unknown>): string {
  if (key === 'aesthetic.singleLeaf.rawMetricLabel') return '實測數據';
  if (key === 'aesthetic.singleLeaf.upRatingLabel') return '戰力評分';
  if (key === 'aesthetic.singleLeaf.verdictPlaceholder') return 'SPECIALIST TELEMETRY VERIFIED';
  if (key === 'aesthetic.singleLeaf.verifiedStamp') {
    return `VERIFIED PHYSIOLOGICAL SPECIFICATION // ${opts?.year}`;
  }
  if (key === 'aesthetic.labels.overflowBadge') return '超限';
  if (key === 'aesthetic.labels.brandHeader') return '最強肉體 // 生理統治力';
  if (key === 'dynoIntel.humanPraise.byDecade.80.populationClass') return '高階玩家';
  if (key.startsWith('dynoIntel.humanPraise.byDecade.')) return '嬰兒期';
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
    expect(input.verdictPlaceholder).toBe('SPECIALIST TELEMETRY VERIFIED');
    expect(input.verifiedStamp).toMatch(/^VERIFIED PHYSIOLOGICAL SPECIFICATION \/\/ /);
    expect(input).not.toHaveProperty('normRatingLine');
    expect(input).not.toHaveProperty('battleCode');
    expect(input).not.toHaveProperty('unlockedAxesLabel');
    expect(SINGLE_LEAF_VERDICT_SLOT_HEIGHT).toBe(92);
  });

  it('swaps tier capsule for overflow badge when heroScore >= 100', () => {
    const overflowLeaf: typeof leafOk = {
      ...leafOk,
      heroScore: 112.4,
      isOverflow: true,
    };
    const input = buildAestheticSingleLeafExportInput(
      fakeT as unknown as TFunction,
      overflowLeaf,
      { mode: 'selfie', aspectRatio: '4:5' }
    );
    expect(input.isOverflow).toBe(true);
    expect(input.overflowBadge).toBe('超限');
  });

  it('honors uiLocale override for selfie single-line English title', () => {
    const input = buildAestheticSingleLeafExportInput(fakeT as unknown as TFunction, leafOk, {
      mode: 'selfie',
      aspectRatio: '9:16',
      uiLocale: 'en',
    });
    expect(input.uiLocale).toBe('en');
    expect(input.leafTitleEn).toBe('BARBELL BENCH PRESS');
  });
});
