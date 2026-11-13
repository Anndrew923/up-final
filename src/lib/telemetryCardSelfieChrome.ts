/**
 * Selfie-plate chrome painted outside the right-column HUD clip.
 * WHY: Brand seal + corner reticles must survive bright gym-mirror backgrounds
 * without competing with the radar/text dock geometry contracts.
 */
import {
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
import type { TelemetryDrawContext } from './telemetryCardTypes';

/** Top-right brand seal — outside the right-column clip so bright selfies still read UP. */
export const TELEMETRY_BRAND_WATERMARK = {
  cx: 960,
  cy: 110,
  hexRadius: 42,
  yearDy: 58,
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
  markFill: 'rgba(255, 229, 143, 0.95)',
  yearFill: 'rgba(244, 244, 245, 0.88)',
  hexFill: 'rgba(201, 162, 39, 0.18)',
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
  const { cx, cy, hexRadius, yearDy } = TELEMETRY_BRAND_WATERMARK;
  const chrome = TELEMETRY_SELFIE_CHROME;
  ctx.save();
  ctx.shadowColor = chrome.glow;
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 2;

  const hex: Array<[number, number]> = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 90);
    hex.push([cx + Math.cos(a) * hexRadius, cy + Math.sin(a) * hexRadius]);
  }
  ctx.beginPath();
  ctx.moveTo(hex[0]![0], hex[0]![1]);
  for (let i = 1; i < hex.length; i += 1) ctx.lineTo(hex[i]![0], hex[i]![1]);
  ctx.closePath();
  ctx.fillStyle = chrome.hexFill;
  ctx.fill();
  ctx.strokeStyle = chrome.stroke;
  ctx.lineWidth = 2.25;
  ctx.stroke();

  paintChromeLabel(ctx, 'UP', cx, cy + 4, `bold 28px ${FONT}`, chrome.markFill);
  paintChromeLabel(ctx, String(year), cx, cy + yearDy, `18px ${FONT}`, chrome.yearFill);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
}
