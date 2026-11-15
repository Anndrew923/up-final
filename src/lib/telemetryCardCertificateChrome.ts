/**
 * Carbon-certificate crest + foil title + tracked stamp paint.
 * WHY: Keeps telemetryCardCertificate under the 500-line split while matching
 * AestheticSpecCard / GuillocheCrest DOM optics on the offline PNG plate.
 */
import { GUILLOCHE_UP_POLYLINES } from './guillocheMonogramPaths';
import {
  GUILLOCHE_SEAL_REF_OUTER_RADIUS,
  paintGuillocheSeal,
} from './guillocheSealPaint';
import {
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
import {
  TELEMETRY_SANS_FONT_STACK,
  TELEMETRY_SERIF_FONT_STACK,
} from './telemetryCardFonts';
import {
  clearCanvasShadow,
  type TelemetryDrawContext,
  type TelemetryGradient,
} from './telemetryCardTypes';

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

/**
 * Secondary body copy (spec subtitles + verified stamp).
 * WHY: Silver mid-tone + 600 weight survives social JPEG chroma crush better than zinc-500.
 */
export const TELEMETRY_CERT_SECONDARY_FILL = '#B8C0CC';
export const TELEMETRY_CERT_SUBTITLE_FONT_PX = 25;
export const TELEMETRY_CERT_STAMP_FONT_PX = 21;
export const TELEMETRY_CERT_SECONDARY_WEIGHT = 600;

const CONTENT_WIDTH = TELEMETRY_CARD_WIDTH - 96 * 2;
const SERIF_FONT = TELEMETRY_SERIF_FONT_STACK;
const SANS_FONT = TELEMETRY_SANS_FONT_STACK;

/** Re-export polyline SSOT for certificate unit assertions. */
export const TELEMETRY_CERT_GUILLOCHE_UP_PATHS = GUILLOCHE_UP_POLYLINES;

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

export function paintCertificateCrest(
  ctx: TelemetryDrawContext,
  cx: number,
  cy: number,
  outerRadius = GUILLOCHE_SEAL_REF_OUTER_RADIUS,
  glowRadius = 130
): void {
  paintGuillocheSeal(ctx, {
    cx,
    cy,
    outerRadius,
    backdrop: {
      core: 'rgba(245, 158, 11, 0.16)',
      mid: 'rgba(201, 162, 39, 0.08)',
      edge: 'rgba(245, 158, 11, 0)',
      radius: glowRadius,
    },
  });
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
  // WHY: Foil title must stay crisp after export scale — ink shadow becomes a fog halo.
  clearCanvasShadow(ctx);
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
  clearCanvasShadow(ctx);
  ctx.fillStyle = fill;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  try {
    ctx.font = font;
  } catch {
    ctx.font = `${TELEMETRY_CERT_SECONDARY_WEIGHT} ${TELEMETRY_CERT_STAMP_FONT_PX}px sans-serif`;
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
