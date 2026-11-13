/**
 * Carbon-certificate crest + foil title + tracked stamp paint.
 * WHY: Keeps telemetryCardCertificate under the 500-line split while matching
 * AestheticSpecCard / GuillocheCrest DOM optics on the offline PNG plate.
 */
import {
  GUILLOCHE_MONOGRAM_CENTER,
  GUILLOCHE_UP_POLYLINES,
} from './guillocheMonogramPaths';
import {
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
import {
  TELEMETRY_SANS_FONT_STACK,
  TELEMETRY_SERIF_FONT_STACK,
} from './telemetryCardFonts';
import type { TelemetryDrawContext, TelemetryGradient } from './telemetryCardTypes';

const FOIL = {
  light: '#f3e6c8',
  mid: '#c9a227',
} as const;

export const TELEMETRY_CERT_TITLE_FOIL = {
  top: '#FFF3C4',
  mid: '#E6C26B',
  deep: '#B88A36',
  wingNear: 'rgba(230, 194, 107, 0.75)',
} as const;

const CONTENT_WIDTH = TELEMETRY_CARD_WIDTH - 96 * 2;
const SERIF_FONT = TELEMETRY_SERIF_FONT_STACK;
const SANS_FONT = TELEMETRY_SANS_FONT_STACK;

/** Re-export polyline SSOT for certificate unit assertions. */
export const TELEMETRY_CERT_GUILLOCHE_UP_PATHS = GUILLOCHE_UP_POLYLINES;

/** SVG hex circumradius ≈ 21 → canvas hexR 72. */
export const TELEMETRY_CERT_GUILLOCHE_SVG_SCALE = 72 / 21;

export const TELEMETRY_CERT_CREST_CENTER = {
  x: TELEMETRY_CARD_WIDTH / 2,
  y: 420,
} as const;

export const TELEMETRY_CERT_TITLE_Y = 620;
export const TELEMETRY_CERT_STAMP_TRACKING_PX = 3.2;

function measureWidth(
  ctx: TelemetryDrawContext,
  text: string,
  font: string,
  fallbackPerChar: number
): number {
  try {
    ctx.font = font;
    return ctx.measureText(text).width;
  } catch {
    return text.length * fallbackPerChar;
  }
}

function strokeGuillochePolyline(
  ctx: TelemetryDrawContext,
  points: ReadonlyArray<readonly [number, number]>,
  cx: number,
  cy: number,
  scale: number
): void {
  const first = points[0];
  if (!first) return;
  ctx.beginPath();
  const origin = GUILLOCHE_MONOGRAM_CENTER;
  ctx.moveTo(cx + (first[0] - origin) * scale, cy + (first[1] - origin) * scale);
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (!point) continue;
    ctx.lineTo(cx + (point[0] - origin) * scale, cy + (point[1] - origin) * scale);
  }
  ctx.stroke();
}

export function paintCertificateCrest(
  ctx: TelemetryDrawContext,
  cx: number,
  cy: number
): void {
  ctx.save();

  const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 130);
  glow.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
  glow.addColorStop(0.55, 'rgba(201, 162, 39, 0.08)');
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 130, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(251,191,36,0.62)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 118, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 60; i += 1) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    const inner = major ? 100 : 104;
    const outer = 116;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.strokeStyle = major ? 'rgba(251,191,36,0.75)' : 'rgba(251,191,36,0.4)';
    ctx.lineWidth = major ? 2 : 1;
    ctx.stroke();
  }

  const hexR = 72;
  const hex: Array<[number, number]> = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 90);
    hex.push([cx + Math.cos(a) * hexR, cy + Math.sin(a) * hexR]);
  }
  ctx.beginPath();
  ctx.moveTo(hex[0]![0], hex[0]![1]);
  for (let i = 1; i < hex.length; i += 1) ctx.lineTo(hex[i]![0], hex[i]![1]);
  ctx.closePath();
  ctx.fillStyle = 'rgba(251,191,36,0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251,191,36,0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(252, 211, 77, 0.88)';
  ctx.lineWidth = Math.max(2.8, 1.3 * (TELEMETRY_CERT_GUILLOCHE_SVG_SCALE / 2.2));
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const path of TELEMETRY_CERT_GUILLOCHE_UP_PATHS) {
    strokeGuillochePolyline(ctx, path, cx, cy, TELEMETRY_CERT_GUILLOCHE_SVG_SCALE);
  }
  ctx.restore();
}

function paintTitleWing(
  ctx: TelemetryDrawContext,
  xInner: number,
  xOuter: number,
  y: number
): void {
  const gradient = ctx.createLinearGradient(xInner, y, xOuter, y);
  gradient.addColorStop(0, TELEMETRY_CERT_TITLE_FOIL.wingNear);
  gradient.addColorStop(1, 'rgba(230, 194, 107, 0)');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(xInner, y);
  ctx.lineTo(xOuter, y);
  ctx.stroke();
}

export function paintCertificateFoilTitle(
  ctx: TelemetryDrawContext,
  title: string,
  cx: number,
  y: number
): void {
  if (!title) return;
  const font = `700 52px ${SERIF_FONT}`;
  const width = measureWidth(ctx, title, font, 28);
  const half = width / 2;
  const gap = 22;
  const wing = Math.min(72, Math.max(36, (CONTENT_WIDTH - width) / 2 - gap));

  ctx.save();
  if (wing >= 24) {
    paintTitleWing(ctx, cx - half - gap, cx - half - gap - wing, y);
    paintTitleWing(ctx, cx + half + gap, cx + half + gap + wing, y);
  }

  const foil: TelemetryGradient = ctx.createLinearGradient(cx, y - 30, cx, y + 30);
  foil.addColorStop(0, TELEMETRY_CERT_TITLE_FOIL.top);
  foil.addColorStop(0.55, TELEMETRY_CERT_TITLE_FOIL.mid);
  foil.addColorStop(1, TELEMETRY_CERT_TITLE_FOIL.deep);
  ctx.fillStyle = foil;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  try {
    ctx.font = font;
    ctx.fillText(title, cx, y, CONTENT_WIDTH);
  } catch {
    try {
      ctx.font = `700 52px ${SANS_FONT}`;
      ctx.fillText(title, cx, y, CONTENT_WIDTH);
    } catch {
      /* plate still encodes */
    }
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
}

export function paintCertificateTrackedStamp(
  ctx: TelemetryDrawContext,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string,
  trackingPx: number
): void {
  if (!text) return;
  ctx.save();
  ctx.fillStyle = fill;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  try {
    ctx.font = font;
  } catch {
    ctx.font = '18px sans-serif';
  }
  if (typeof ctx.letterSpacing === 'string') {
    ctx.letterSpacing = `${trackingPx}px`;
    ctx.textAlign = 'center';
    try {
      ctx.fillText(text, x, y, CONTENT_WIDTH);
    } catch {
      /* skip */
    }
    ctx.letterSpacing = '0px';
    ctx.restore();
    return;
  }

  const chars = Array.from(text);
  const widths = chars.map((ch) => {
    try {
      return ctx.measureText(ch).width;
    } catch {
      return 10;
    }
  });
  const gaps = Math.max(0, chars.length - 1) * trackingPx;
  const total = widths.reduce((sum, w) => sum + w, 0) + gaps;
  let cursor = x - total / 2;
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    if (ch === undefined) continue;
    try {
      ctx.fillText(ch, cursor, y);
    } catch {
      /* skip glyph */
    }
    cursor += (widths[i] ?? 10) + trackingPx;
  }
  ctx.restore();
}

/** Re-export foil mid/light for the plate frame rivets. */
export const TELEMETRY_CERT_FOIL = FOIL;
