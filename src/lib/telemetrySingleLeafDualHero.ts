/**
 * Dual-hero split paint helpers for single-leaf plates (raw metric | UP rating).
 * WHY: Keeps `telemetrySingleLeafPainter` focused on plate orchestration while
 * equal-weight column layout + font clamp live in one testable unit.
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

const SANS = TELEMETRY_SANS_FONT_STACK;
const SERIF = TELEMETRY_SERIF_FONT_STACK;

export const DUAL_HERO_GAP = 28;
export const DUAL_HERO_DIVIDER_PAD = 14;

/** Foil ZH title + EN subtitle block — rhythm must clear this before dual-hero. */
export const BILINGUAL_TITLE_BLOCK_PX = 52;

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
  options?: { maxWidth?: number; hardShadow?: boolean }
): void {
  if (!text) return;
  clearCanvasShadow(ctx);
  if (options?.hardShadow) {
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
}

function paintTierCapsuleCentered(
  ctx: TelemetryDrawContext,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  options?: { gold?: boolean; hardShadow?: boolean; hud?: boolean }
): void {
  if (!text) return;
  let fontPx = options?.hud ? 20 : 22;
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

/** Left raw metric + right UP rating — equal visual weight, font-clamped. */
export function paintDualHeroSplit(
  ctx: TelemetryDrawContext,
  input: TelemetrySingleLeafCardInput,
  geom: DualHeroGeom,
  options?: { hud?: boolean; hardShadow?: boolean }
): void {
  const hud = options?.hud === true;
  const hard = options?.hardShadow === true;
  const maxHero = hud ? 52 : 58;
  const minHero = hud ? 26 : 28;
  const labelFont = hud ? `bold 18px ${SANS}` : `20px ${SANS}`;
  const labelFill = hud ? 'rgba(244,244,245,0.82)' : 'rgba(161,161,170,0.9)';
  const rawFill = hud ? '#FFFFFF' : '#f4f4f5';
  const scoreFill = hud ? '#FFE58F' : TELEMETRY_CERT_TITLE_FOIL.mid;

  paintVerticalDivider(ctx, geom.dividerX, geom.bandTop + 8, geom.bandBottom - 8, { hud });

  const paintKicker = (text: string, x: number) => {
    if (hud) {
      paintHudLabel(ctx, text, x, geom.labelY, labelFont, labelFill, 'center', 'middle', {
        maxWidth: geom.colMaxW,
        hardShadow: hard,
      });
    } else {
      paintCertificateLabel(
        ctx,
        text,
        x,
        geom.labelY,
        labelFont,
        labelFill,
        'center',
        'middle',
        geom.colMaxW
      );
    }
  };

  paintKicker(input.rawMetricLabel, geom.leftCx);
  paintKicker(input.upRatingLabel, geom.rightCx);

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

  if (hud) {
    paintHudLabel(
      ctx,
      input.rawReading,
      geom.leftCx,
      geom.valueY,
      `bold ${heroSize}px ${SANS}`,
      rawFill,
      'center',
      'middle',
      { maxWidth: geom.colMaxW, hardShadow: hard }
    );
    paintHudLabel(
      ctx,
      input.heroScoreText,
      geom.rightCx,
      geom.valueY,
      `bold ${heroSize}px ${SERIF}`,
      scoreFill,
      'center',
      'middle',
      { maxWidth: geom.colMaxW, hardShadow: hard }
    );
  } else {
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
  }

  const capsule = input.isOverflow ? input.overflowBadge : input.tierCapsule.trim();
  paintTierCapsuleCentered(ctx, capsule, geom.rightCx, geom.capsuleY, geom.colMaxW, {
    gold: input.isOverflow,
    hardShadow: hard,
    hud,
  });
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
      input.leafTitleZh,
      cx,
      titleY,
      `bold 34px ${SERIF}`,
      '#FFE58F',
      'center',
      'middle',
      { maxWidth: contentWidth, hardShadow: options?.hardShadow }
    );
    paintHudLabel(
      ctx,
      input.leafTitleEn,
      cx,
      titleY + 36,
      `18px ${SANS}`,
      'rgba(244,244,245,0.78)',
      'center',
      'middle',
      { maxWidth: contentWidth, hardShadow: options?.hardShadow }
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
