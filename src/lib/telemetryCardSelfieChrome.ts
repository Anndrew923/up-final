/**
 * Selfie-plate chrome painted outside the right-column HUD clip.
 * WHY: Brand seal + corner reticles must survive bright gym-mirror backgrounds
 * without competing with the radar/text dock geometry contracts.
 */
import { paintGuillocheSeal } from './guillocheSealPaint';
import {
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
import type { TelemetryDrawContext } from './telemetryCardTypes';

/**
 * Top-right Guilloche seal — scaled crest shared with the carbon certificate.
 * yearDy clears the outer ring so "2026" sits under the seal without collision.
 */
export const TELEMETRY_BRAND_WATERMARK = {
  cx: 942,
  cy: 122,
  outerRadius: 54,
  yearDy: 70,
} as const;

/** Corner reticle arms — tactical viewfinder chrome inset from the plate edge. */
export const TELEMETRY_CORNER_RETICLE = {
  inset: 36,
  arm: 36,
} as const;

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

export function paintCornerReticles(ctx: TelemetryDrawContext): void {
  const { inset, arm } = TELEMETRY_CORNER_RETICLE;
  const chrome = TELEMETRY_SELFIE_CHROME;
  const corners: Array<{ x: number; y: number; sx: number; sy: number }> = [
    { x: inset, y: inset, sx: 1, sy: 1 },
    { x: TELEMETRY_CARD_WIDTH - inset, y: inset, sx: -1, sy: 1 },
    { x: inset, y: TELEMETRY_CARD_HEIGHT - inset, sx: 1, sy: -1 },
    { x: TELEMETRY_CARD_WIDTH - inset, y: TELEMETRY_CARD_HEIGHT - inset, sx: -1, sy: -1 },
  ];
  ctx.save();
  ctx.shadowColor = chrome.glow;
  ctx.shadowBlur = 8;
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
  ctx.restore();
}

export function paintBrandWatermark(ctx: TelemetryDrawContext, year: number): void {
  const { cx, cy, outerRadius, yearDy } = TELEMETRY_BRAND_WATERMARK;
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
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  paintChromeLabel(ctx, String(year), cx, cy + yearDy, `18px ${FONT}`, chrome.yearFill);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
}
