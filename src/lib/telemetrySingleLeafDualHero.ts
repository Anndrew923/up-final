/**
 * Dual-hero split paint helpers for single-leaf plates (raw metric | UP rating).
 * WHY: Keeps `telemetrySingleLeafPainter` focused on plate orchestration while
 * equal-weight column layout + font clamp live in one testable unit.
 * Selfie HUD (`hud: true`) owns larger type + inward column centers; carbon stays bit-stable.
 */
import {
  paintCertificateFoilTitle,
  TELEMETRY_CERT_TITLE_FOIL,
} from './telemetryCardCertificateChrome';
import {
  paintCertificateLabel,
  withMicroEdgeShadow,
} from './telemetryCardCertificateFrame';
import { TELEMETRY_SANS_FONT_STACK, TELEMETRY_SERIF_FONT_STACK } from './telemetryCardFonts';
import { TELEMETRY_FEED_WALL_HARD_SHADOW } from './telemetryCardLayout';
import {
  clearCanvasShadow,
  type TelemetryDrawContext,
} from './telemetryCardTypes';
import type { TelemetrySingleLeafCardInput } from './telemetryReportTypes';
import {
  paintSelfieCeremonialTierCapsule,
  resolveSelfieTierPillMaxWidth,
  resolveSelfieTierWingReachPx,
  SELFIE_TIER_CAPSULE_FILL,
  SELFIE_TIER_CAPSULE_FONT_PX,
  SELFIE_TIER_CAPSULE_HEIGHT,
  SELFIE_TIER_CAPSULE_MIN_WIDTH,
  SELFIE_TIER_CAPSULE_PAD_X,
  SELFIE_TIER_WING_DIAMOND_PX,
  SELFIE_TIER_WING_OUTSET_PX,
  SELFIE_TIER_WING_RAY_PX,
} from './telemetrySingleLeafTierPlaque';
import {
  paintSelfieMetricMixed,
  SELFIE_METRIC_PART_GAP_PX,
  SELFIE_METRIC_PRIMARY_PX,
  SELFIE_METRIC_SECONDARY_PX,
  splitSelfieMetricParts,
  type SelfieMetricParts,
} from './telemetrySingleLeafMetricMix';
import {
  resolveSelfieHudDropPx,
  resolveSelfieHudVerticalRhythm,
  SELFIE_BILINGUAL_TITLE_BLOCK_PX,
  SELFIE_HUD_DROP_4_5,
  SELFIE_HUD_DROP_9_16,
  SELFIE_TIER_CAPSULE_BELOW_DUAL,
  SELFIE_TIER_STAMP_GAP_MAX,
  SELFIE_TIER_STAMP_GAP_MIN,
  SELFIE_TIER_STAMP_GAP_PX,
  type SelfieHudVerticalRhythm,
} from './telemetrySingleLeafSelfieRhythm';

const SANS = TELEMETRY_SANS_FONT_STACK;
const SERIF = TELEMETRY_SERIF_FONT_STACK;

export const DUAL_HERO_GAP = 28;
export const DUAL_HERO_DIVIDER_PAD = 14;

/** Foil ZH title + EN subtitle block — carbon rhythm; do not enlarge for selfie. */
export const BILINGUAL_TITLE_BLOCK_PX = 52;

/** Selfie dual-hero inward centers — 35px gutter each side of plate mid (540). */
export const SELFIE_DUAL_HERO_LEFT_CX = 335;
export const SELFIE_DUAL_HERO_RIGHT_CX = 745;
export const SELFIE_DUAL_HERO_COL_MAX_W = 340;
export const SELFIE_DUAL_HERO_DIVIDER_X = 540;
export const SELFIE_DUAL_HERO_MAX_PX = 68;
export const SELFIE_DUAL_HERO_LABEL_PX = 25;
export const SELFIE_DUAL_HERO_TITLE_ZH_PX = 54;

/** Re-export selfie tokens so tests / painter keep a single import surface. */
export {
  resolveSelfieHudDropPx,
  resolveSelfieHudVerticalRhythm,
  resolveSelfieTierPillMaxWidth,
  resolveSelfieTierWingReachPx,
  SELFIE_BILINGUAL_TITLE_BLOCK_PX,
  SELFIE_HUD_DROP_4_5,
  SELFIE_HUD_DROP_9_16,
  SELFIE_TIER_CAPSULE_BELOW_DUAL,
  SELFIE_TIER_CAPSULE_FILL,
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
  SELFIE_METRIC_PART_GAP_PX,
  SELFIE_METRIC_PRIMARY_PX,
  SELFIE_METRIC_SECONDARY_PX,
  splitSelfieMetricParts,
  type SelfieHudVerticalRhythm,
  type SelfieMetricParts,
};

/** Locale-aware single-line selfie title (carbon still paints both Zh + En). */
export function resolveSelfieHeroTitle(input: TelemetrySingleLeafCardInput): string {
  return input.uiLocale === 'en' ? input.leafTitleEn : input.leafTitleZh;
}

export function fitBoldFontSize(
  ctx: TelemetryDrawContext,
  text: string,
  maxWidth: number,
  maxPx: number,
  minPx: number,
  stack: string
): number {
  let size = maxPx;
  while (size > minPx) {
    try {
      ctx.font = `bold ${size}px ${stack}`;
      if (ctx.measureText(text).width <= maxWidth) return size;
    } catch {
      return Math.max(minPx, size - 4);
    }
    size -= 2;
  }
  return minPx;
}

function paintHudLabel(
  ctx: TelemetryDrawContext,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string,
  align: CanvasTextAlign,
  baseline: CanvasTextBaseline,
  options?: { maxWidth?: number; hardShadow?: boolean; dualShadow?: boolean }
): void {
  if (!text) return;
  const paintOnce = (hard: boolean) => {
    clearCanvasShadow(ctx);
    if (hard) {
      ctx.shadowColor = TELEMETRY_FEED_WALL_HARD_SHADOW.color;
      ctx.shadowBlur = TELEMETRY_FEED_WALL_HARD_SHADOW.blur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = TELEMETRY_FEED_WALL_HARD_SHADOW.offsetY;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.92)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
    }
    ctx.fillStyle = fill;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    try {
      ctx.font = font;
      ctx.fillText(text, x, y, options?.maxWidth);
    } catch {
      try {
        ctx.font = '28px sans-serif';
        ctx.fillText(text, x, y, options?.maxWidth);
      } catch {
        /* skip */
      }
    }
    clearCanvasShadow(ctx);
  };

  if (options?.dualShadow) {
    paintOnce(false);
    paintOnce(true);
    return;
  }
  paintOnce(options?.hardShadow === true);
}

export function paintTierCapsuleCentered(
  ctx: TelemetryDrawContext,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  options?: { gold?: boolean; hardShadow?: boolean; hud?: boolean }
): void {
  if (!text) return;
  const hud = options?.hud === true;
  if (hud) {
    paintSelfieCeremonialTierCapsule(ctx, text, cx, y, maxWidth);
    return;
  }

  let fontPx = 22;
  let font = `bold ${fontPx}px ${SANS}`;
  try {
    ctx.font = font;
  } catch {
    ctx.font = `bold ${fontPx}px sans-serif`;
  }
  const padX = 12;
  let tw = ctx.measureText(text).width;
  while (tw + padX * 2 > maxWidth && fontPx > 14) {
    fontPx -= 1;
    font = `bold ${fontPx}px ${SANS}`;
    try {
      ctx.font = font;
    } catch {
      break;
    }
    tw = ctx.measureText(text).width;
  }
  const bw = Math.min(tw + padX * 2, maxWidth);
  const bh = fontPx + 14;
  const left = cx - bw / 2;
  const top = y - bh / 2;

  ctx.save();
  if (options?.hardShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
  }
  ctx.fillStyle = options?.gold ? 'rgba(243,230,200,0.22)' : 'rgba(201,162,39,0.14)';
  ctx.strokeStyle = options?.gold ? 'rgba(243,230,200,0.85)' : 'rgba(201,162,39,0.65)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(left, top, bw, bh);
  ctx.strokeRect(left, top, bw, bh);
  clearCanvasShadow(ctx);

  ctx.fillStyle = options?.gold ? '#f3e6c8' : '#f4f4f5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try {
    ctx.font = font;
    ctx.fillText(text, cx, y, bw - 8);
  } catch {
    /* skip */
  }
  ctx.restore();
}

function paintVerticalDivider(
  ctx: TelemetryDrawContext,
  x: number,
  y0: number,
  y1: number,
  options?: { hud?: boolean }
): void {
  ctx.save();
  withMicroEdgeShadow(ctx, () => {
    ctx.strokeStyle = options?.hud ? 'rgba(251,191,36,0.45)' : 'rgba(201,162,39,0.38)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
  });
  ctx.restore();
}

export interface DualHeroGeom {
  leftCx: number;
  rightCx: number;
  colMaxW: number;
  dividerX: number;
  labelY: number;
  valueY: number;
  capsuleY: number;
  bandTop: number;
  bandBottom: number;
}

export function resolveDualHeroGeom(
  contentLeft: number,
  contentRight: number,
  bandTop: number,
  bandBottom: number
): DualHeroGeom {
  const mid = (contentLeft + contentRight) / 2;
  const colW = (contentRight - contentLeft - DUAL_HERO_GAP) / 2;
  const band = bandBottom - bandTop;
  return {
    leftCx: contentLeft + colW / 2,
    rightCx: contentRight - colW / 2,
    colMaxW: Math.max(40, colW - DUAL_HERO_DIVIDER_PAD),
    dividerX: mid,
    labelY: bandTop + band * 0.14,
    valueY: bandTop + band * 0.48,
    capsuleY: bandTop + band * 0.82,
    bandTop,
    bandBottom,
  };
}

/**
 * Selfie dual-hero dock — fixed inward centers; mid-axis capsule sits below the band.
 * WHY: Equal-split from content margins left heroes too far from the gold divider.
 */
export function resolveSelfieDualHeroGeom(
  bandTop: number,
  bandBottom: number
): DualHeroGeom {
  const band = bandBottom - bandTop;
  const labelY = bandTop + band * 0.18;
  const valueY = bandTop + band * 0.58;
  return {
    leftCx: SELFIE_DUAL_HERO_LEFT_CX,
    rightCx: SELFIE_DUAL_HERO_RIGHT_CX,
    colMaxW: SELFIE_DUAL_HERO_COL_MAX_W,
    dividerX: SELFIE_DUAL_HERO_DIVIDER_X,
    labelY,
    valueY,
    // Unused for hud paint (capsule moves to plate mid-axis below the divider).
    capsuleY: bandBottom + SELFIE_TIER_CAPSULE_BELOW_DUAL,
    bandTop,
    bandBottom,
  };
}

/** Left raw metric + right UP rating — equal visual weight, font-clamped. */
export function paintDualHeroSplit(
  ctx: TelemetryDrawContext,
  input: TelemetrySingleLeafCardInput,
  geom: DualHeroGeom,
  options?: { hud?: boolean; hardShadow?: boolean }
): void {
  const hud = options?.hud === true;
  const hard = options?.hardShadow === true;
  const maxHero = hud ? SELFIE_DUAL_HERO_MAX_PX : 58;
  const minHero = 28;
  const labelFont = hud
    ? `bold ${SELFIE_DUAL_HERO_LABEL_PX}px ${SANS}`
    : `20px ${SANS}`;
  const labelFill = hud ? 'rgba(255, 255, 255, 0.80)' : 'rgba(161,161,170,0.9)';
  // Selfie left magnitude uses paintSelfieMetricMixed (#FFFFFF); carbon keeps uniform fill.
  const rawFill = '#f4f4f5';
  const scoreFill = hud ? '#FFE58F' : TELEMETRY_CERT_TITLE_FOIL.mid;

  // WHY: Hud divider frames only the level 2-layer columns; mid-axis capsule sits below.
  const divPad = hud ? 0 : 8;
  paintVerticalDivider(
    ctx,
    geom.dividerX,
    geom.bandTop + divPad,
    geom.bandBottom - divPad,
    { hud }
  );

  const paintKicker = (text: string, x: number, y: number) => {
    if (hud) {
      paintHudLabel(ctx, text, x, y, labelFont, labelFill, 'center', 'middle', {
        maxWidth: geom.colMaxW,
        dualShadow: true,
      });
    } else {
      paintCertificateLabel(
        ctx,
        text,
        x,
        y,
        labelFont,
        labelFill,
        'center',
        'middle',
        geom.colMaxW
      );
    }
  };

  paintKicker(input.rawMetricLabel, geom.leftCx, geom.labelY);
  paintKicker(input.upRatingLabel, geom.rightCx, geom.labelY);

  if (hud) {
    paintSelfieMetricMixed(ctx, input.rawReading, geom.leftCx, geom.valueY, geom.colMaxW);
    const scoreSize = fitBoldFontSize(
      ctx,
      input.heroScoreText,
      geom.colMaxW,
      maxHero,
      minHero,
      SERIF
    );
    paintHudLabel(
      ctx,
      input.heroScoreText,
      geom.rightCx,
      geom.valueY,
      `bold ${scoreSize}px ${SERIF}`,
      scoreFill,
      'center',
      'middle',
      { maxWidth: geom.colMaxW, dualShadow: true }
    );
  } else {
    const rawSize = fitBoldFontSize(
      ctx,
      input.rawReading,
      geom.colMaxW,
      maxHero,
      minHero,
      SANS
    );
    const scoreSize = fitBoldFontSize(
      ctx,
      input.heroScoreText,
      geom.colMaxW,
      maxHero,
      minHero,
      SERIF
    );
    // Keep columns optically balanced — both heroes share the smaller fitted size.
    const heroSize = Math.min(rawSize, scoreSize);
    paintCertificateLabel(
      ctx,
      input.rawReading,
      geom.leftCx,
      geom.valueY,
      `bold ${heroSize}px ${SANS}`,
      rawFill,
      'center',
      'middle',
      geom.colMaxW
    );
    paintCertificateLabel(
      ctx,
      input.heroScoreText,
      geom.rightCx,
      geom.valueY,
      `bold ${heroSize}px ${SERIF}`,
      scoreFill,
      'center',
      'middle',
      geom.colMaxW
    );
    const capsule = input.isOverflow ? input.overflowBadge : input.tierCapsule.trim();
    paintTierCapsuleCentered(ctx, capsule, geom.rightCx, geom.capsuleY, geom.colMaxW, {
      gold: input.isOverflow,
      hardShadow: hard,
      hud: false,
    });
  }
}

/** Chinese foil primary + formal English secondary. */
export function paintBilingualTitle(
  ctx: TelemetryDrawContext,
  input: TelemetrySingleLeafCardInput,
  cx: number,
  titleY: number,
  contentWidth: number,
  options?: { hud?: boolean; hardShadow?: boolean }
): void {
  const hud = options?.hud === true;
  if (hud) {
    paintHudLabel(
      ctx,
      resolveSelfieHeroTitle(input),
      cx,
      titleY,
      `bold ${SELFIE_DUAL_HERO_TITLE_ZH_PX}px ${SERIF}`,
      '#FFE58F',
      'center',
      'middle',
      { maxWidth: contentWidth, dualShadow: true }
    );
    return;
  }

  paintCertificateFoilTitle(ctx, input.leafTitleZh, cx, titleY);
  paintCertificateLabel(
    ctx,
    input.leafTitleEn,
    cx,
    titleY + 44,
    `22px ${SANS}`,
    'rgba(161,161,170,0.85)',
    'center',
    'middle',
    contentWidth
  );
}

/** Re-export HUD label for selfie verdict/stamp rows in the orchestrator. */
export { paintHudLabel as paintSingleLeafHudLabel };
