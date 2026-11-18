/**
 * Dual-hero left-column mixed type (magnitude + unit/reps).
 * WHY: Isolated from dualHero paint so the orchestrator stays ≤500 lines.
 * Selfie uses 68/38; Carbon uses 58/33 — same splitter, different presets.
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

/** Carbon certificate left hero — matches right-column 58px score weight. */
export const CARBON_METRIC_PRIMARY_PX = 58;
export const CARBON_METRIC_SECONDARY_PX = 33;
export const CARBON_METRIC_PART_GAP_PX = 9;

export interface MetricParts {
  primary: string;
  secondary: string;
}

/** @deprecated Prefer `MetricParts` — kept for existing selfie import surfaces. */
export type SelfieMetricParts = MetricParts;

/**
 * Split raw metric into leading magnitude + unit/reps suffix.
 * WHY: Uniform hero px on "110 KG × 4" outweighed the right score column.
 */
export function splitMetricParts(raw: string): MetricParts {
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

/** Alias — keeps selfie call sites / tests bit-stable. */
export const splitSelfieMetricParts = splitMetricParts;

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
  fill: string,
  dualShadow: boolean
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
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = dualShadow ? 12 : 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = dualShadow ? 3 : 1;
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
  if (dualShadow) paintOnce(true);
}

export interface MetricMixPreset {
  primaryPx: number;
  secondaryPx: number;
  gap: number;
  dualShadow: boolean;
  minPrimaryPx?: number;
  minSecondaryPx?: number;
}

const SELFIE_PRESET: MetricMixPreset = {
  primaryPx: SELFIE_METRIC_PRIMARY_PX,
  secondaryPx: SELFIE_METRIC_SECONDARY_PX,
  gap: SELFIE_METRIC_PART_GAP_PX,
  dualShadow: true,
  minPrimaryPx: 28,
  minSecondaryPx: 16,
};

const CARBON_PRESET: MetricMixPreset = {
  primaryPx: CARBON_METRIC_PRIMARY_PX,
  secondaryPx: CARBON_METRIC_SECONDARY_PX,
  gap: CARBON_METRIC_PART_GAP_PX,
  dualShadow: false,
  minPrimaryPx: 26,
  minSecondaryPx: 16,
};

function paintMetricMixedWithPreset(
  ctx: TelemetryDrawContext,
  raw: string,
  cx: number,
  midY: number,
  colMaxW: number,
  preset: MetricMixPreset
): void {
  const { primary, secondary } = splitMetricParts(raw);
  if (!primary) return;

  let primaryPx = preset.primaryPx;
  let secondaryPx = preset.secondaryPx;
  const gap = preset.gap;
  const minP = preset.minPrimaryPx ?? 26;
  const minS = preset.minSecondaryPx ?? 16;

  let pW = measureBoldWidth(ctx, primary, primaryPx, 'bold');
  let sW = secondary ? measureBoldWidth(ctx, secondary, secondaryPx, '600') : 0;
  let total = secondary ? pW + gap + sW : pW;
  if (total > colMaxW && total > 0) {
    const scale = colMaxW / total;
    primaryPx = Math.max(minP, Math.floor(primaryPx * scale));
    secondaryPx = Math.max(minS, Math.floor(secondaryPx * scale));
    pW = measureBoldWidth(ctx, primary, primaryPx, 'bold');
    sW = secondary ? measureBoldWidth(ctx, secondary, secondaryPx, '600') : 0;
    total = secondary ? pW + gap + sW : pW;
  }

  const baselineY = midY + primaryPx * 0.35;
  const startX = cx - total / 2;

  paintMixedGlyph(
    ctx,
    primary,
    startX,
    baselineY,
    `bold ${primaryPx}px ${SANS}`,
    '#FFFFFF',
    preset.dualShadow
  );
  if (secondary) {
    paintMixedGlyph(
      ctx,
      secondary,
      startX + pW + gap,
      baselineY,
      `600 ${secondaryPx}px ${SANS}`,
      'rgba(255, 255, 255, 0.86)',
      preset.dualShadow
    );
  }
}

/** Selfie left hero — 68px magnitude + 38px unit/reps on a shared alphabetic baseline. */
export function paintSelfieMetricMixed(
  ctx: TelemetryDrawContext,
  raw: string,
  cx: number,
  midY: number,
  colMaxW: number
): void {
  paintMetricMixedWithPreset(ctx, raw, cx, midY, colMaxW, SELFIE_PRESET);
}

/** Carbon left hero — 58px magnitude + 33px unit/reps (no feed-wall dual shadow). */
export function paintCarbonMetricMixed(
  ctx: TelemetryDrawContext,
  raw: string,
  cx: number,
  midY: number,
  colMaxW: number
): void {
  paintMetricMixedWithPreset(ctx, raw, cx, midY, colMaxW, CARBON_PRESET);
}
