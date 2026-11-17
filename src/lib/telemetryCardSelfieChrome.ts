/**
 * Selfie-plate chrome painted outside the right-column HUD clip.
 * WHY: Brand seal + corner reticles must survive bright gym-mirror backgrounds
 * without competing with the radar/text dock geometry contracts. Halo + dual
 * HUD text shadows live here so telemetryCardComposer stays under 490 lines.
 */
import { paintGuillocheSeal } from './guillocheSealPaint';
import type { TelemetrySelfieLayout } from './telemetryCardLayout';
import {
  resolveSelfieLayout,
  TELEMETRY_FEED_WALL_HARD_SHADOW,
} from './telemetryCardLayout';
import {
  clearCanvasShadow,
  type TelemetryDrawContext,
} from './telemetryCardTypes';

export type HudShadowPreset = {
  color: string;
  blur: number;
  offsetY: number;
};

/** Hard ink kiss — keeps glyph edges sharp on white fabric. */
export const TELEMETRY_HUD_DUAL_HARD_SHADOW: HudShadowPreset = {
  color: 'rgba(0, 0, 0, 0.95)',
  blur: 1,
  offsetY: 1,
};

/** Soft bloom under hard ink — kills local specular glare. */
export const TELEMETRY_HUD_DUAL_SOFT_SHADOW: HudShadowPreset = {
  color: 'rgba(0, 0, 0, 0.78)',
  blur: 12,
  offsetY: 3,
};

/**
 * Top-right Guilloche seal — 9:16 defaults (SSOT for unit assertions).
 * yearDy clears the outer ring so "2026" sits under the seal without collision.
 */
export const TELEMETRY_BRAND_WATERMARK = resolveSelfieLayout('9:16').watermark;

/** Corner reticle arms — 9:16 defaults. */
export const TELEMETRY_CORNER_RETICLE = resolveSelfieLayout('9:16').reticle;

/** Shared champagne chrome stroke / glow at laser-pass opacity. */
export const TELEMETRY_SELFIE_CHROME = {
  stroke: 'rgba(243, 208, 120, 0.78)',
  glow: 'rgba(251, 191, 36, 0.45)',
  yearFill: 'rgba(244, 244, 245, 0.88)',
} as const;

const FONT = '"PingFang TC", "Noto Sans TC", "Helvetica Neue", sans-serif';

function paintChromeLabel(
  ctx: TelemetryDrawContext,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string
): void {
  if (!text) return;
  ctx.fillStyle = fill;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try {
    ctx.font = font;
    ctx.fillText(text, x, y);
  } catch {
    try {
      ctx.font = '24px sans-serif';
      ctx.fillText(text, x, y);
    } catch {
      /* plate still encodes */
    }
  }
}

export function paintCornerReticles(
  ctx: TelemetryDrawContext,
  layout: TelemetrySelfieLayout = resolveSelfieLayout('9:16')
): void {
  const { inset, arm } = layout.reticle;
  const chrome = TELEMETRY_SELFIE_CHROME;
  const corners: Array<{ x: number; y: number; sx: number; sy: number }> = [
    { x: inset, y: inset, sx: 1, sy: 1 },
    { x: layout.plateWidth - inset, y: inset, sx: -1, sy: 1 },
    { x: inset, y: layout.plateHeight - inset, sx: 1, sy: -1 },
    {
      x: layout.plateWidth - inset,
      y: layout.plateHeight - inset,
      sx: -1,
      sy: -1,
    },
  ];
  ctx.save();
  ctx.shadowColor = chrome.glow;
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = chrome.stroke;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'miter';
  for (const corner of corners) {
    ctx.beginPath();
    ctx.moveTo(corner.x + corner.sx * arm, corner.y);
    ctx.lineTo(corner.x, corner.y);
    ctx.lineTo(corner.x, corner.y + corner.sy * arm);
    ctx.stroke();
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
}

export function paintBrandWatermark(
  ctx: TelemetryDrawContext,
  year: number,
  layout: TelemetrySelfieLayout = resolveSelfieLayout('9:16')
): void {
  const { cx, cy, outerRadius, yearDy } = layout.watermark;
  const chrome = TELEMETRY_SELFIE_CHROME;

  // WHY: Bright gym walls wash out gold strokes — dark radial bed keeps the seal legible.
  paintGuillocheSeal(ctx, {
    cx,
    cy,
    outerRadius,
    backdrop: {
      core: 'rgba(8, 10, 15, 0.55)',
      mid: 'rgba(8, 10, 15, 0.22)',
      edge: 'rgba(8, 10, 15, 0)',
    },
  });

  ctx.save();
  if (layout.useFeedWallHardShadow) {
    ctx.shadowColor = TELEMETRY_FEED_WALL_HARD_SHADOW.color;
    ctx.shadowBlur = TELEMETRY_FEED_WALL_HARD_SHADOW.blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = TELEMETRY_FEED_WALL_HARD_SHADOW.offsetY;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
  }
  paintChromeLabel(ctx, String(year), cx, cy + yearDy, `18px ${FONT}`, chrome.yearFill);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
}

/**
 * Soft radial bed behind the left radar so axis labels stay readable on bright shirts.
 * WHY: Bottom scrim alone still leaves mid-frame glare under the hex label orbit.
 */
export function paintSelfieRadarHalo(
  ctx: TelemetryDrawContext,
  radar: { cx: number; cy: number; labelRadius: number }
): void {
  const outer = radar.labelRadius * 1.38;
  const gradient = ctx.createRadialGradient(
    radar.cx,
    radar.cy,
    radar.labelRadius * 0.12,
    radar.cx,
    radar.cy,
    outer
  );
  gradient.addColorStop(0, 'rgba(2, 6, 14, 0.58)');
  gradient.addColorStop(0.55, 'rgba(2, 6, 14, 0.3)');
  gradient.addColorStop(1, 'rgba(2, 6, 14, 0)');
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(radar.cx, radar.cy, outer, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function applyHudShadow(ctx: TelemetryDrawContext, shadow: HudShadowPreset): void {
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = shadow.blur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = shadow.offsetY;
}

/** Single-pass HUD label (brand / kickers) with optional ink or feed-wall shadow. */
export function paintHudLabel(
  ctx: TelemetryDrawContext,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string,
  align: CanvasTextAlign,
  baseline: CanvasTextBaseline,
  options?: { maxWidth?: number; shadow?: HudShadowPreset }
): void {
  if (!text) return;
  const shadow = options?.shadow;
  clearCanvasShadow(ctx);
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) applyHudShadow(ctx, shadow);
  try {
    ctx.font = font;
    ctx.fillText(text, x, y, options?.maxWidth);
  } catch {
    try {
      ctx.font = '24px sans-serif';
      ctx.fillText(text, x, y, options?.maxWidth);
    } catch {
      /* plate still encodes */
    }
  }
  clearCanvasShadow(ctx);
}

/**
 * Dual-pass anti-glare text — soft bloom then hard kiss (feed wall may replace hard).
 * WHY: Single soft blur washes out on IG JPEG; hard-only looks cut-out on neon gym lights.
 */
export function paintHudLabelWithDualShadow(
  ctx: TelemetryDrawContext,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string,
  align: CanvasTextAlign,
  baseline: CanvasTextBaseline,
  options: {
    maxWidth?: number;
    useFeedWallHardShadow?: boolean;
    soft?: HudShadowPreset;
    hard?: HudShadowPreset;
  }
): void {
  if (!text) return;
  const soft = options.soft ?? TELEMETRY_HUD_DUAL_SOFT_SHADOW;
  const hard = options.useFeedWallHardShadow
    ? TELEMETRY_FEED_WALL_HARD_SHADOW
    : (options.hard ?? TELEMETRY_HUD_DUAL_HARD_SHADOW);
  paintHudLabel(ctx, text, x, y, font, fill, align, baseline, {
    maxWidth: options.maxWidth,
    shadow: soft,
  });
  paintHudLabel(ctx, text, x, y, font, fill, align, baseline, {
    maxWidth: options.maxWidth,
    shadow: hard,
  });
}

export function resolveHudTextShadow(
  layout: TelemetrySelfieLayout,
  holographic: HudShadowPreset
): HudShadowPreset {
  if (!layout.useFeedWallHardShadow) return holographic;
  return TELEMETRY_FEED_WALL_HARD_SHADOW;
}
