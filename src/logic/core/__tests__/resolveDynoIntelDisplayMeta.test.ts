import { describe, expect, it } from 'vitest';
import { resolveDynoIntelDisplayMeta } from '../resolveDynoIntelDisplayMeta';
import type { DynoIntelContextV1 } from '../dynoIntelTypes';

function baseContext(overrides: Partial<DynoIntelContextV1> = {}): DynoIntelContextV1 {
  return {
    schemaVersion: 1,
    locale: 'zh-Hant',
    mode: 'cross-axis',
    focusAxis: null,
    axes: [
      {
        axis: 'strength',
        score: 87.8,
        tierBandId: 'TIER_80',
        meaningI18nPrefix: 'scoreMeaning.axis.strength',
        weightInvariant: false,
        cardCopy: { title: '350hp雙門跑車', summary: 'summary' },
      },
    ],
    overallScore: null,
    vehicleClassId: null,
    weightSimulation: null,
    profile: null,
    momentum: { hasHistory: false, deltas: [], overallDelta: null },
    gaps: [],
    weakestAxis: 'gripStrength',
    supplementalMetrics: [],
    focusSupplemental: null,
    scoringMethodologyBriefs: [],
    assessmentDeepDiveNudge: '',
    replyClosingCue: '',
    closingBeatKind: 'return-ritual',
    closingBeatSecondLine: '',
    questionFocusAxis: 'strength',
    intent: 'status',
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('resolveDynoIntelDisplayMeta', () => {
  it('surfaces score and tier for focused axis status questions', () => {
    const meta = resolveDynoIntelDisplayMeta(
      baseContext(),
      '我的力量表現如何？'
    );
    expect(meta.scoreLabel).toBe('87.8');
    expect(meta.tierTitle).toBe('350hp雙門跑車');
    expect(meta.axisKey).toBe('strength');
  });

  it('surfaces methodology nudge without score cards', () => {
    const meta = resolveDynoIntelDisplayMeta(
      baseContext({
        intent: 'methodology',
        closingBeatSecondLine: '可到力量評測頁展開完整給分說明。',
      }),
      '本 App 力量怎麼計分？'
    );
    expect(meta.scoreLabel).toBeNull();
    expect(meta.tierTitle).toBeNull();
    expect(meta.methodologyNudge).toContain('力量評測頁');
  });

  it('surfaces overall score for macro chassis reads', () => {
    const meta = resolveDynoIntelDisplayMeta(
      baseContext({
        overallScore: 95.2,
        questionFocusAxis: null,
      }),
      '我的總分成績如何？'
    );
    expect(meta.scoreLabel).toBe('95.2');
    expect(meta.axisKey).toBe('overall');
  });

  it('surfaces armSize supplemental card when question mentions arm girth', () => {
    const meta = resolveDynoIntelDisplayMeta(
      baseContext({
        questionFocusAxis: null,
        supplementalMetrics: [
          {
            metric: 'armSize',
            score: 91.6,
            tierBandId: 'TIER_90',
            meaningI18nPrefix: 'scoreMeaning.bands.armSize.TIER_90',
            cardCopy: { title: '21吋極致深緣多輻拋邊', summary: '臂圍高位。' },
          },
        ],
      }),
      '我的臂圍在一般人裡算粗嗎？'
    );
    expect(meta.scoreLabel).toBe('91.6');
    expect(meta.tierTitle).toBe('21吋極致深緣多輻拋邊');
    expect(meta.axisKey).toBe('armSize');
  });

  it('prefers armSize supplemental over stale six-axis questionFocusAxis', () => {
    const meta = resolveDynoIntelDisplayMeta(
      baseContext({
        questionFocusAxis: 'strength',
        supplementalMetrics: [
          {
            metric: 'armSize',
            score: 87.9,
            tierBandId: 'TIER_80',
            meaningI18nPrefix: 'scoreMeaning.bands.armSize.TIER_80',
            cardCopy: { title: '20吋前後配賽道大尺寸', summary: '撐袖水準。' },
          },
        ],
      }),
      '我的臂圍表現如何？'
    );
    expect(meta.axisKey).toBe('armSize');
    expect(meta.tierTitle).toBe('20吋前後配賽道大尺寸');
    expect(meta.tierTitle).not.toBe('350hp雙門跑車');
  });

  it('surfaces cooper supplemental card for Cooper test questions', () => {
    const meta = resolveDynoIntelDisplayMeta(
      baseContext({
        questionFocusAxis: null,
        supplementalMetrics: [
          {
            metric: 'cooper',
            score: 118,
            tierBandId: 'TIER_110',
            meaningI18nPrefix: 'scoreMeaning.bands.cooper.TIER_110',
            cardCopy: { title: '2.8Bar工廠賽車高溫壓極限排溫', summary: '12 分鐘跑高位。' },
          },
        ],
      }),
      '我的 Cooper 測驗分數怎麼看？'
    );
    expect(meta.scoreLabel).toBe('118');
    expect(meta.axisKey).toBe('cooper');
    expect(meta.tierTitle).toContain('2.8Bar');
  });

  it('surfaces 5km supplemental card for five-kilometer questions', () => {
    const meta = resolveDynoIntelDisplayMeta(
      baseContext({
        questionFocusAxis: 'cardio',
        supplementalMetrics: [
          {
            metric: '5km',
            score: 102,
            tierBandId: 'TIER_100',
            meaningI18nPrefix: 'scoreMeaning.bands.cardio.TIER_100',
            cardCopy: { title: '2.4Bar超跑全載散熱系統', summary: '五公里配速高位。' },
          },
        ],
      }),
      '我的 5km 跑分算厲害嗎？'
    );
    expect(meta.scoreLabel).toBe('102');
    expect(meta.axisKey).toBe('5km');
    expect(meta.tierTitle).toContain('2.4Bar');
  });

  it('uses focusSupplemental when question has no supplemental keyword', () => {
    const meta = resolveDynoIntelDisplayMeta(
      baseContext({
        questionFocusAxis: null,
        focusSupplemental: 'armSize',
        supplementalMetrics: [
          {
            metric: 'armSize',
            score: 42,
            tierBandId: 'TIER_40',
            meaningI18nPrefix: 'scoreMeaning.bands.armSize.TIER_40',
            cardCopy: { title: '15吋鑄造鋁合金圈', summary: '成長潛力大。' },
          },
        ],
      }),
      '我的表現如何？'
    );
    expect(meta.axisKey).toBe('armSize');
    expect(meta.tierTitle).toBe('15吋鑄造鋁合金圈');
  });
});
