import { describe, expect, it } from 'vitest';
import {
  BILINGUAL_TITLE_BLOCK_PX,
  fitBoldFontSize,
  resolveDualHeroGeom,
  resolveSelfieDualHeroGeom,
  resolveCarbonPrimaryTitle,
  resolveCarbonSecondaryTitle,
  resolveLocalePrimaryTitle,
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
  CARBON_METRIC_PART_GAP_PX,
  CARBON_METRIC_PRIMARY_PX,
  CARBON_METRIC_SECONDARY_PX,
  CARBON_TIER_CAPSULE_FONT_PX,
  CARBON_TIER_CAPSULE_HEIGHT,
  CARBON_TIER_CAPSULE_MIN_WIDTH,
  CARBON_VERDICT_SLOT_HEIGHT,
  CARBON_VERDICT_SLOT_MAX,
  CARBON_VERDICT_SLOT_MIN,
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
  resolveSingleLeafCarbonRhythm,
  splitMetricParts,
  splitSelfieMetricParts,
} from '../telemetrySingleLeafDualHero';
import { SINGLE_LEAF_VERDICT_SLOT_HEIGHT } from '../telemetryReportTypes';
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
    rawMetricLabel: '實測數據',
    upRatingLabel: '戰力評分',
    tierCapsule: '高階玩家',
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

  it('splits metric parts for selfie + carbon mixed type presets', () => {
    expect(splitMetricParts('110 KG × 4')).toEqual({
      primary: '110',
      secondary: 'KG × 4',
    });
    expect(splitSelfieMetricParts('5 項綜合')).toEqual({
      primary: '5',
      secondary: '項綜合',
    });
    expect(splitMetricParts('5 LIFTS')).toEqual({
      primary: '5',
      secondary: 'LIFTS',
    });
    expect(splitSelfieMetricParts('60 CM')).toEqual({
      primary: '60',
      secondary: 'CM',
    });
    expect(splitSelfieMetricParts('70.5 KG')).toEqual({
      primary: '70.5',
      secondary: 'KG',
    });
    expect(splitSelfieMetricParts('21:30')).toEqual({
      primary: '21:30',
      secondary: '',
    });
    expect(SELFIE_METRIC_PRIMARY_PX).toBe(68);
    expect(SELFIE_METRIC_SECONDARY_PX).toBe(38);
    expect(SELFIE_METRIC_PART_GAP_PX).toBe(10);
    expect(CARBON_METRIC_PRIMARY_PX).toBe(58);
    expect(CARBON_METRIC_SECONDARY_PX).toBe(33);
    expect(CARBON_METRIC_PART_GAP_PX).toBe(9);
  });

  it('locks carbon mid-axis plaque + verdict slot contracts', () => {
    expect(CARBON_TIER_CAPSULE_FONT_PX).toBe(29);
    expect(CARBON_TIER_CAPSULE_HEIGHT).toBe(58);
    expect(CARBON_TIER_CAPSULE_MIN_WIDTH).toBe(260);
    expect(CARBON_VERDICT_SLOT_HEIGHT).toBe(122);
    expect(SINGLE_LEAF_VERDICT_SLOT_HEIGHT).toBe(122);
    expect(CARBON_VERDICT_SLOT_HEIGHT).toBeGreaterThanOrEqual(CARBON_VERDICT_SLOT_MIN);
    expect(CARBON_VERDICT_SLOT_HEIGHT).toBeLessThanOrEqual(CARBON_VERDICT_SLOT_MAX);

    const storyStampMaxY = 1920 - (48 + 10) - 24;
    const story = resolveSingleLeafCarbonRhythm('9:16', storyStampMaxY);
    expect(story.plaqueY).toBeGreaterThan(story.dualBottom);
    expect(story.verdictTop).toBeGreaterThan(story.plaqueY);
    expect(story.verdictHeight).toBe(122);
    expect(story.verdictTop + story.verdictHeight).toBeLessThan(story.stampY);
    // Mid-axis plaque sits on plate centerline (cx = 540) — rhythm owns Y only.
    expect(SELFIE_DUAL_HERO_DIVIDER_X).toBe(540);

    const feedStampMaxY = 1350 - (48 + 10) - 20;
    const feed = resolveSingleLeafCarbonRhythm('4:5', feedStampMaxY);
    expect(feed.verdictTop + feed.verdictHeight).toBeLessThan(feed.stampY);
    expect(feed.dualTop).toBeLessThan(feed.dualBottom);
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

    // Long 100–150+ EN populationClass titles must fit ceremonial plaque + pad without
    // forcing pill wider than gutter-safe max (font may shrink; geometry must hold).
    const longEnTiers = [
      'Breakout',
      'Transcendent',
      'Historic Tier',
      'Mythic',
      'Monster Domain',
      'Apex',
    ];
    const state = { font: '' };
    const ctx = {
      get font() {
        return state.font;
      },
      set font(v: string) {
        state.font = v;
      },
      measureText(text: string) {
        const size = Number(/(\d+)px/.exec(state.font)?.[1] ?? SELFIE_TIER_CAPSULE_FONT_PX);
        return { width: text.length * size * 0.58 };
      },
    } as unknown as TelemetryDrawContext;
    for (const title of longEnTiers) {
      ctx.font = `bold ${SELFIE_TIER_CAPSULE_FONT_PX}px sans-serif`;
      const needed =
        ctx.measureText(title).width + SELFIE_TIER_CAPSULE_PAD_X * 2;
      const pillW = Math.min(pillMax, Math.max(SELFIE_TIER_CAPSULE_MIN_WIDTH, needed));
      expect(pillW).toBeLessThanOrEqual(pillMax);
      expect(pillW + 2 * wingReach).toBeLessThanOrEqual(contentWidth);
      // Overflow gold still carries decade populationClass as plaque copy.
      const overflowPlate = baseInput({
        isOverflow: true,
        tierCapsule: title,
        heroScore: 140,
      });
      expect(overflowPlate.isOverflow).toBe(true);
      expect(overflowPlate.tierCapsule).toBe(title);
    }
  });

  it('resolves locale-aware selfie hero title', () => {
    expect(resolveSelfieHeroTitle(baseInput({ uiLocale: 'zh' }))).toBe('槓鈴臥推');
    expect(resolveSelfieHeroTitle(baseInput({ uiLocale: 'en' }))).toBe(
      'BARBELL BENCH PRESS'
    );
  });

  it('swaps Carbon primary/secondary titles for en vs zh', () => {
    const zhPlate = baseInput({ uiLocale: 'zh' });
    expect(resolveLocalePrimaryTitle(zhPlate)).toBe('槓鈴臥推');
    expect(resolveCarbonPrimaryTitle(zhPlate)).toBe('槓鈴臥推');
    expect(resolveCarbonSecondaryTitle(zhPlate)).toBe('BARBELL BENCH PRESS');

    const enPlate = baseInput({ uiLocale: 'en' });
    expect(resolveLocalePrimaryTitle(enPlate)).toBe('BARBELL BENCH PRESS');
    expect(resolveCarbonPrimaryTitle(enPlate)).toBe('BARBELL BENCH PRESS');
    expect(resolveCarbonSecondaryTitle(enPlate)).toBe('槓鈴臥推');
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
