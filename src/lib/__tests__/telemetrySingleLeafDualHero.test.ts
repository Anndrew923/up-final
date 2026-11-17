import { describe, expect, it } from 'vitest';
import {
  BILINGUAL_TITLE_BLOCK_PX,
  fitBoldFontSize,
  resolveDualHeroGeom,
  resolveSelfieDualHeroGeom,
  resolveSelfieHeroTitle,
  resolveSelfieHudDropPx,
  resolveSelfieHudVerticalRhythm,
  resolveSelfieTierPillMaxWidth,
  resolveSelfieTierWingReachPx,
  SELFIE_BILINGUAL_TITLE_BLOCK_PX,
  SELFIE_DUAL_HERO_COL_MAX_W,
  SELFIE_DUAL_HERO_DIVIDER_X,
  SELFIE_DUAL_HERO_LABEL_PX,
  SELFIE_DUAL_HERO_LEFT_CX,
  SELFIE_DUAL_HERO_MAX_PX,
  SELFIE_DUAL_HERO_RIGHT_CX,
  SELFIE_DUAL_HERO_TITLE_ZH_PX,
  SELFIE_HUD_DROP_4_5,
  SELFIE_HUD_DROP_9_16,
  SELFIE_METRIC_PART_GAP_PX,
  SELFIE_METRIC_PRIMARY_PX,
  SELFIE_METRIC_SECONDARY_PX,
  SELFIE_TIER_CAPSULE_BELOW_DUAL,
  SELFIE_TIER_CAPSULE_FONT_PX,
  SELFIE_TIER_CAPSULE_HEIGHT,
  SELFIE_TIER_CAPSULE_MIN_WIDTH,
  SELFIE_TIER_CAPSULE_PAD_X,
  SELFIE_TIER_STAMP_GAP_MAX,
  SELFIE_TIER_STAMP_GAP_MIN,
  SELFIE_TIER_STAMP_GAP_PX,
  SELFIE_TIER_WING_DIAMOND_PX,
  SELFIE_TIER_WING_OUTSET_PX,
  SELFIE_TIER_WING_RAY_PX,
  splitSelfieMetricParts,
} from '../telemetrySingleLeafDualHero';
import type { TelemetryDrawContext } from '../telemetryCardTypes';
import type { TelemetrySingleLeafCardInput } from '../telemetryReportTypes';

function baseInput(
  overrides: Partial<TelemetrySingleLeafCardInput> = {}
): TelemetrySingleLeafCardInput {
  return {
    reportType: 'single-leaf',
    mode: 'selfie',
    aspectRatio: '9:16',
    leaf: 'strength.benchPress',
    leafTitleZh: '槓鈴臥推',
    leafTitleEn: 'BARBELL BENCH PRESS',
    uiLocale: 'zh',
    rawReading: '110 KG × 4',
    heroScore: 89.41,
    heroScoreText: '89.41',
    isOverflow: false,
    overflowBadge: '超限',
    rawMetricLabel: '實測數據',
    upRatingLabel: '戰力評分',
    tierCapsule: '高階玩家',
    verdictPlaceholder: 'SPECIALIST TELEMETRY VERIFIED',
    ...overrides,
  };
}

describe('telemetrySingleLeafDualHero', () => {
  it('reduces bold font size until the string fits maxWidth', () => {
    const state = { font: '' };
    const ctx = {
      get font() {
        return state.font;
      },
      set font(v: string) {
        state.font = v;
      },
      measureText() {
        const size = Number(/(\d+)px/.exec(state.font)?.[1] ?? 16);
        return { width: (400 / 58) * size };
      },
    } as unknown as TelemetryDrawContext;

    const size = fitBoldFontSize(ctx, '140.5 KG × 10', 200, 58, 28, 'sans-serif');
    expect(size).toBeLessThan(58);
    expect(size).toBeGreaterThanOrEqual(28);
  });

  it('resolves equal-width dual columns with a center divider (carbon)', () => {
    const geom = resolveDualHeroGeom(96, 984, 600, 850);
    expect(geom.dividerX).toBe(540);
    expect(geom.leftCx).toBeCloseTo(96 + (984 - 96 - 28) / 4, 5);
    expect(geom.rightCx).toBeCloseTo(984 - (984 - 96 - 28) / 4, 5);
    expect(geom.colMaxW).toBeGreaterThan(0);
  });

  it('locks selfie dual-hero inward centers with level columns', () => {
    const geom = resolveSelfieDualHeroGeom(700, 1100);
    expect(geom.leftCx).toBe(SELFIE_DUAL_HERO_LEFT_CX);
    expect(geom.rightCx).toBe(SELFIE_DUAL_HERO_RIGHT_CX);
    expect(geom.colMaxW).toBe(340);
    expect(geom.dividerX).toBe(SELFIE_DUAL_HERO_DIVIDER_X);
    expect(geom.capsuleY).toBe(1100 + SELFIE_TIER_CAPSULE_BELOW_DUAL);
  });

  it('splits selfie metric parts into 68px magnitude + 38px unit/reps', () => {
    expect(splitSelfieMetricParts('110 KG × 4')).toEqual({
      primary: '110',
      secondary: 'KG × 4',
    });
    expect(splitSelfieMetricParts('60 CM')).toEqual({
      primary: '60',
      secondary: 'CM',
    });
    expect(splitSelfieMetricParts('70.5 KG')).toEqual({
      primary: '70.5',
      secondary: 'KG',
    });
    expect(splitSelfieMetricParts('2850 M')).toEqual({
      primary: '2850',
      secondary: 'M',
    });
    expect(splitSelfieMetricParts('21:30')).toEqual({
      primary: '21:30',
      secondary: '',
    });
    expect(SELFIE_METRIC_PRIMARY_PX).toBe(68);
    expect(SELFIE_METRIC_SECONDARY_PX).toBe(38);
    expect(SELFIE_METRIC_PART_GAP_PX).toBe(10);
  });

  it('exports large ceremonial plaque + wing constants', () => {
    expect(BILINGUAL_TITLE_BLOCK_PX).toBe(52);
    expect(SELFIE_BILINGUAL_TITLE_BLOCK_PX).toBe(56);
    expect(SELFIE_DUAL_HERO_TITLE_ZH_PX).toBe(54);
    expect(SELFIE_DUAL_HERO_MAX_PX).toBe(68);
    expect(SELFIE_DUAL_HERO_LABEL_PX).toBe(25);
    expect(SELFIE_TIER_CAPSULE_FONT_PX).toBe(34);
    expect(SELFIE_TIER_CAPSULE_PAD_X).toBe(48);
    expect(SELFIE_TIER_CAPSULE_HEIGHT).toBe(66);
    expect(SELFIE_TIER_CAPSULE_MIN_WIDTH).toBe(280);
    expect(SELFIE_TIER_WING_DIAMOND_PX).toBe(6);
    expect(SELFIE_TIER_WING_OUTSET_PX).toBe(14);
    expect(SELFIE_TIER_WING_RAY_PX).toBe(96);
    expect(SELFIE_HUD_DROP_9_16).toBe(120);
    expect(SELFIE_HUD_DROP_4_5).toBe(70);
    expect(SELFIE_TIER_STAMP_GAP_PX).toBe(34);
  });

  it('anchors selfie HUD stamp gap in [30, 38] and keeps 4:5 title below mid-line', () => {
    expect(resolveSelfieHudDropPx('9:16')).toBe(120);
    expect(resolveSelfieHudDropPx('4:5')).toBe(70);

    const story = resolveSelfieHudVerticalRhythm(1920, '9:16');
    expect(story.stampGap).toBe(SELFIE_TIER_STAMP_GAP_PX);
    expect(story.stampGap).toBeGreaterThanOrEqual(SELFIE_TIER_STAMP_GAP_MIN);
    expect(story.stampGap).toBeLessThanOrEqual(SELFIE_TIER_STAMP_GAP_MAX);

    const feed = resolveSelfieHudVerticalRhythm(1350, '4:5');
    expect(feed.titleY).toBeGreaterThan(675);
    expect(feed.stampGap).toBeGreaterThanOrEqual(SELFIE_TIER_STAMP_GAP_MIN);
    expect(feed.stampGap).toBeLessThanOrEqual(SELFIE_TIER_STAMP_GAP_MAX);
  });

  it('keeps enlarged wing span inside content gutters for long EN tiers', () => {
    const contentWidth = 1080 - 72 * 2;
    const pillMax = resolveSelfieTierPillMaxWidth(contentWidth);
    const wingReach = resolveSelfieTierWingReachPx();
    expect(pillMax + 2 * wingReach).toBeLessThanOrEqual(contentWidth);
    expect(pillMax).toBeGreaterThanOrEqual(SELFIE_TIER_CAPSULE_MIN_WIDTH);
  });

  it('resolves locale-aware selfie hero title', () => {
    expect(resolveSelfieHeroTitle(baseInput({ uiLocale: 'zh' }))).toBe('槓鈴臥推');
    expect(resolveSelfieHeroTitle(baseInput({ uiLocale: 'en' }))).toBe(
      'BARBELL BENCH PRESS'
    );
  });

  it('clamps long selfie hero strings under 340 without colliding the mid line', () => {
    const state = { font: '' };
    const ctx = {
      get font() {
        return state.font;
      },
      set font(v: string) {
        state.font = v;
      },
      measureText(text: string) {
        const size = Number(/(\d+)px/.exec(state.font)?.[1] ?? 16);
        return { width: text.length * size * 0.62 };
      },
    } as unknown as TelemetryDrawContext;

    const size = fitBoldFontSize(
      ctx,
      '110 KG × 12',
      SELFIE_DUAL_HERO_COL_MAX_W,
      SELFIE_DUAL_HERO_MAX_PX,
      28,
      'sans-serif'
    );
    expect(size).toBeLessThanOrEqual(SELFIE_DUAL_HERO_MAX_PX);
  });
});
