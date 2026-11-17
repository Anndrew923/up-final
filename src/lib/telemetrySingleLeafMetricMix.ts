/**
 * Selfie left-hero mixed type (68px magnitude + 38px unit/reps).
 * WHY: Isolated from dualHero paint so the orchestrator stays ≤500 lines.
 */
import { TELEMETRY_SANS_FONT_STACK } from './telemetryCardFonts';
import { TELEMETRY_FEED_WALL_HARD_SHADOW } from './telemetryCardLayout';
import {
  clearCanvasShadow,
  type TelemetryDrawContext,
} from './telemetryCardTypes';

const SANS = TELEMETRY_SANS_FONT_STACK;

export const SELFIE_METRIC_PRIMARY_PX = 68;
export const SELFIE_METRIC_SECONDARY_PX = 38;
export const SELFIE_METRIC_PART_GAP_PX = 10;

export interface SelfieMetricParts {
  primary: string;
  secondary: string;
}

/**
 * Split raw metric into leading magnitude + unit/reps suffix for selfie mixed type.
 * WHY: Uniform 68px on "110 KG × 4" visually outweighed the right score column.
 */
export function splitSelfieMetricParts(raw: string): SelfieMetricParts {
  const text = raw.trim();
  if (!text) return { primary: '', secondary: '' };
  // Time codes stay monolithic — colon is not a magnitude separator here.
  if (text.includes(':')) return { primary: text, secondary: '' };
  const match = /^(\d+(?:\.\d+)?)(.*)$/.exec(text);
  if (!match) return { primary: text, secondary: '' };
  const primary = match[1] ?? text;
  const secondary = (match[2] ?? '').trim();
  return { primary, secondary };
}

function measureBoldWidth(
  ctx: TelemetryDrawContext,
  text: string,
  px: number,
  weight: 'bold' | '600'
): number {
  try {
    ctx.font = `${weight} ${px}px ${SANS}`;
    return ctx.measureText(text).width;
  } catch {
    try {
      ctx.font = `${weight} ${px}px sans-serif`;
      return ctx.measureText(text).width;
    } catch {
      return text.length * px * 0.55;
    }
  }
}

function paintMixedGlyph(
  ctx: TelemetryDrawContext,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string
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
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    try {
      ctx.font = font;
      ctx.fillText(text, x, y);
    } catch {
      try {
        ctx.font = '28px sans-serif';
        ctx.fillText(text, x, y);
      } catch {
        /* skip */
      }
    }
    clearCanvasShadow(ctx);
  };
  paintOnce(false);
  paintOnce(true);
}

/**
 * Selfie left hero — 68px magnitude + 38px unit/reps on a shared alphabetic baseline.
 */
export function paintSelfieMetricMixed(
  ctx: TelemetryDrawContext,
  raw: string,
  cx: number,
  midY: number,
  colMaxW: number
): void {
  const { primary, secondary } = splitSelfieMetricParts(raw);
  if (!primary) return;

  let primaryPx = SELFIE_METRIC_PRIMARY_PX;
  let secondaryPx = SELFIE_METRIC_SECONDARY_PX;
  const gap = SELFIE_METRIC_PART_GAP_PX;

  let pW = measureBoldWidth(ctx, primary, primaryPx, 'bold');
  let sW = secondary ? measureBoldWidth(ctx, secondary, secondaryPx, '600') : 0;
  let total = secondary ? pW + gap + sW : pW;
  if (total > colMaxW && total > 0) {
    const scale = colMaxW / total;
    primaryPx = Math.max(28, Math.floor(primaryPx * scale));
    secondaryPx = Math.max(16, Math.floor(secondaryPx * scale));
    pW = measureBoldWidth(ctx, primary, primaryPx, 'bold');
    sW = secondary ? measureBoldWidth(ctx, secondary, secondaryPx, '600') : 0;
    total = secondary ? pW + gap + sW : pW;
  }

  // Convert previous middle-anchor valueY into an alphabetic baseline for the 68px glyph.
  const baselineY = midY + primaryPx * 0.35;
  const startX = cx - total / 2;

  paintMixedGlyph(
    ctx,
    primary,
    startX,
    baselineY,
    `bold ${primaryPx}px ${SANS}`,
    '#FFFFFF'
  );
  if (secondary) {
    paintMixedGlyph(
      ctx,
      secondary,
      startX + pW + gap,
      baselineY,
      `600 ${secondaryPx}px ${SANS}`,
      'rgba(255, 255, 255, 0.86)'
    );
  }
}
