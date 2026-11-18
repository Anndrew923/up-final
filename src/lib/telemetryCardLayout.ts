/**
 * Dual-aspect layout profiles for offline telemetry plates.
 * WHY: IG/FB feed crops 9:16; 4:5 must reflow (never clip) while 9:16 stays bit-identical.
 */
import {
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
  TELEMETRY_CERT_FRAME_INSET,
} from './telemetryCardBackground';
import { GUILLOCHE_SEAL_REF_OUTER_RADIUS } from './guillocheSealPaint';
import type { TelemetryCardAspectRatio } from './telemetryCardTypes';

export interface TelemetryCarbonLayout {
  headerY: number;
  headerRuleY: number;
  crestCx: number;
  crestCy: number;
  crestOuterRadius: number;
  crestGlowRadius: number;
  titleY: number;
  specStartY: number;
  /** Vertical advance when a spec has no subtitle. */
  specEmptyGap: number;
  specSubtitleFirstDy: number;
  specSubtitleLineGap: number;
  specAfterSubtitlePad: number;
  meterMinY: number;
  meterGap: number;
  /**
   * 4:5 feed uses a single horizontal KPI strip instead of three stacked rows.
   * Height is the full strip band (label → value → bar → badge).
   */
  meterStripHeight: number;
  /** Minimum gap from last spec block to meter start (before meterMinY clamp). */
  meterAfterSpecGap: number;
  meterRuleAbove: number;
  battleCodeAboveStamp: number;
  footerRuleAboveBattle: number;
  stampClearance: number;
  innerFrameInset: number;
  stampMaxY: number;
  plateHeight: number;
  plateWidth: number;
}

export interface TelemetrySelfieLayout {
  watermark: {
    cx: number;
    cy: number;
    outerRadius: number;
    yearDy: number;
  };
  reticle: { inset: number; arm: number };
  radar: {
    cx: number;
    cy: number;
    outerRadius: number;
    labelRadius: number;
  };
  hud: {
    clip: { x: number; y: number; w: number; h: number };
    textX: number;
    brandY: number;
    scoreY: number;
    titleY: number;
    specStartY: number;
    specRowGap: number;
    specTitleDy: number;
    textMaxWidth: number;
  };
  /** Feed-wall anti-JPEG hard ink — only enabled for 4:5 selfie. */
  useFeedWallHardShadow: boolean;
  plateHeight: number;
  plateWidth: number;
}

/** Story / Reels default — exact legacy 9:16 carbon rhythm. */
const CARBON_9_16: TelemetryCarbonLayout = {
  headerY: 120,
  headerRuleY: 158,
  crestCx: TELEMETRY_CARD_WIDTH / 2,
  crestCy: 420,
  crestOuterRadius: GUILLOCHE_SEAL_REF_OUTER_RADIUS,
  crestGlowRadius: 130,
  titleY: 620,
  specStartY: 720,
  specEmptyGap: 72,
  specSubtitleFirstDy: 36,
  specSubtitleLineGap: 28,
  specAfterSubtitlePad: 36,
  meterMinY: 1180,
  meterGap: 90,
  /** Unused on 9:16 (stacked rows) — kept so layout typing stays uniform. */
  meterStripHeight: 0,
  meterAfterSpecGap: 64,
  meterRuleAbove: 48,
  battleCodeAboveStamp: 48,
  footerRuleAboveBattle: 40,
  stampClearance: 24,
  innerFrameInset: TELEMETRY_CERT_FRAME_INSET + 10,
  stampMaxY: TELEMETRY_CARD_HEIGHT - (TELEMETRY_CERT_FRAME_INSET + 10) - 24,
  plateHeight: TELEMETRY_CARD_HEIGHT,
  plateWidth: TELEMETRY_CARD_WIDTH,
};

/**
 * Feed post 4:5 — horizontal KPI strip frees ~200px so crest/title/specs breathe.
 * Frame inset stays 48 so rivets still sit on the bevel corners.
 */
const CARBON_4_5: TelemetryCarbonLayout = {
  headerY: 92,
  headerRuleY: 126,
  crestCx: TELEMETRY_CARD_WIDTH / 2,
  crestCy: 300,
  crestOuterRadius: 92,
  crestGlowRadius: 104,
  titleY: 448,
  specStartY: 520,
  specEmptyGap: 58,
  specSubtitleFirstDy: 32,
  specSubtitleLineGap: 24,
  specAfterSubtitlePad: 34,
  meterMinY: 980,
  meterGap: 0,
  meterStripHeight: 132,
  meterAfterSpecGap: 56,
  meterRuleAbove: 40,
  battleCodeAboveStamp: 40,
  footerRuleAboveBattle: 32,
  stampClearance: 20,
  innerFrameInset: TELEMETRY_CERT_FRAME_INSET + 10,
  stampMaxY: 1350 - (TELEMETRY_CERT_FRAME_INSET + 10) - 20,
  plateHeight: 1350,
  plateWidth: TELEMETRY_CARD_WIDTH,
};

/**
 * Shared HUD vertical rhythm relative to radar.cy.
 * WHY: Single SSOT so 4:5 cannot reintroduce top-edge skew vs 9:16 (was +44px).
 */
const SELFIE_HUD_FROM_RADAR_CY = {
  brandY: -200,
  scoreY: -105,
  titleY: -25,
  specStartY: 68,
  clipY: -380,
  specRowGap: 88,
  specTitleDy: 30,
} as const;

const SELFIE_HUD_COLUMN = {
  textX: 630,
  clipX: 630,
  clipW: 402,
  textMaxWidth: 402,
} as const;

/** Left-biased radar — same cx/radius on both aspects; only cy reflows with plate height. */
const SELFIE_RADAR_BASE = {
  cx: 290,
  outerRadius: 164,
  labelRadius: 208,
} as const;

function buildSelfieHud(
  radarCy: number,
  clipHeight: number
): TelemetrySelfieLayout['hud'] {
  const o = SELFIE_HUD_FROM_RADAR_CY;
  const c = SELFIE_HUD_COLUMN;
  return {
    clip: { x: c.clipX, y: radarCy + o.clipY, w: c.clipW, h: clipHeight },
    textX: c.textX,
    brandY: radarCy + o.brandY,
    scoreY: radarCy + o.scoreY,
    titleY: radarCy + o.titleY,
    specStartY: radarCy + o.specStartY,
    specRowGap: o.specRowGap,
    specTitleDy: o.specTitleDy,
    textMaxWidth: c.textMaxWidth,
  };
}

/**
 * Story 9:16 selfie dock — open vertical rhythm with optical vertical leveling.
 * WHY: Radar −24px / HUD +16px offsets the top-heavy score glyph so both columns
 * read level; third spec stays inside the h:800 clip above reticles.
 */
const SELFIE_9_16_RADAR_CY = 1436;
const SELFIE_9_16_CLIP_H = 800;
const SELFIE_9_16: TelemetrySelfieLayout = {
  watermark: { cx: 942, cy: 122, outerRadius: 54, yearDy: 70 },
  reticle: { inset: 36, arm: 36 },
  radar: { ...SELFIE_RADAR_BASE, cy: SELFIE_9_16_RADAR_CY },
  hud: buildSelfieHud(SELFIE_9_16_RADAR_CY, SELFIE_9_16_CLIP_H),
  useFeedWallHardShadow: false,
  plateHeight: TELEMETRY_CARD_HEIGHT,
  plateWidth: TELEMETRY_CARD_WIDTH,
};

/**
 * Feed 4:5 selfie dock — derived from the same cy-relative HUD SSOT as 9:16.
 * WHY clip.h = plate − reticle − clip.y: shorter plate must still clear L-frame arms.
 */
const SELFIE_4_5_RADAR_CY = 1023;
const SELFIE_4_5_PLATE_H = 1350;
const SELFIE_4_5_RETICLE_INSET = 28;
const SELFIE_4_5_CLIP_Y = SELFIE_4_5_RADAR_CY + SELFIE_HUD_FROM_RADAR_CY.clipY;
const SELFIE_4_5_CLIP_H = SELFIE_4_5_PLATE_H - SELFIE_4_5_RETICLE_INSET - SELFIE_4_5_CLIP_Y;
const SELFIE_4_5: TelemetrySelfieLayout = {
  watermark: { cx: 942, cy: 88, outerRadius: 42, yearDy: 54 },
  reticle: { inset: SELFIE_4_5_RETICLE_INSET, arm: 30 },
  radar: { ...SELFIE_RADAR_BASE, cy: SELFIE_4_5_RADAR_CY },
  hud: buildSelfieHud(SELFIE_4_5_RADAR_CY, SELFIE_4_5_CLIP_H),
  useFeedWallHardShadow: true,
  plateHeight: SELFIE_4_5_PLATE_H,
  plateWidth: TELEMETRY_CARD_WIDTH,
};

/** High-contrast hard ink for FB/IG 4:2:0 feed JPEG — only on 4:5 selfie text. */
export const TELEMETRY_FEED_WALL_HARD_SHADOW = {
  color: 'rgba(0, 0, 0, 0.92)',
  blur: 2,
  offsetY: 2,
} as const;

export function resolveCarbonLayout(
  aspect: TelemetryCardAspectRatio = '9:16'
): TelemetryCarbonLayout {
  return aspect === '4:5' ? CARBON_4_5 : CARBON_9_16;
}

export function resolveSelfieLayout(
  aspect: TelemetryCardAspectRatio = '9:16'
): TelemetrySelfieLayout {
  return aspect === '4:5' ? SELFIE_4_5 : SELFIE_9_16;
}

export function resolveRivetCenters(
  plateWidth: number,
  plateHeight: number
): ReadonlyArray<readonly [number, number]> {
  const inset = TELEMETRY_CERT_FRAME_INSET;
  return [
    [inset + 18, inset + 18],
    [plateWidth - inset - 18, inset + 18],
    [inset + 18, plateHeight - inset - 18],
    [plateWidth - inset - 18, plateHeight - inset - 18],
  ];
}
