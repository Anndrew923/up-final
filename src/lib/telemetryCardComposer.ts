/**
 * Offline 9:16 telemetry card orchestrator.
 *
 * WHY: Share plates must rasterize on-device. This module never fetches,
 * never touches Firestore, and degrades a bad selfie to the carbon plate
 * so a missing photo cannot reject the export.
 */
import {
  computeSixAxisRadarVertices,
  type RadarGeometryPoint,
  type RadarPoint2D,
} from '../logic/core/radarGeometry';
import { formatOverallResonanceScore } from '../logic/core/scoring';
import {
  paintTelemetryBackground,
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
import type { TelemetryBackgroundSource } from './telemetryCardCover';
import {
  TelemetryComposeError,
  type TelemetryCanvasSurface,
  type TelemetryDrawContext,
} from './telemetryCardTypes';

export {
  resolveCoverSourceRect,
  type CoverSourceRect,
  type TelemetryBackgroundSource,
} from './telemetryCardCover';
export {
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
export {
  TelemetryComposeError,
  type TelemetryCanvasSurface,
  type TelemetryComposeErrorCode,
  type TelemetryDrawContext,
  type TelemetryGradient,
} from './telemetryCardTypes';

export const TELEMETRY_CARD_BRAND = 'ULTIMATE PHYSIQUE // TELEMETRY';

/** Docked radar sits in the lower half, inside the selfie scrim. */
export const TELEMETRY_RADAR_LAYOUT = {
  cx: 310,
  cy: 1460,
  outerRadius: 168,
  labelRadius: 230,
} as const;

/** Right-column HUD dock — single source so paint + future UI preview stay aligned. */
export const TELEMETRY_HUD_LAYOUT = {
  clip: { x: 560, y: 1000, w: 480, h: 840 },
  textX: 580,
  brandY: 1080,
  battleCodeY: 1160,
  titleY: 1248,
  scoreY: 1388,
  specStartY: 1540,
  specRowGap: 96,
} as const;

const HUD_FONT_FAMILY = '"PingFang TC", "Noto Sans TC", "Helvetica Neue", sans-serif';
const OVERFLOW_STROKE = '#e0fbff';
const RING_SCALES = [1, 0.66, 0.33] as const;

export type TelemetryCardMode = 'carbon' | 'selfie';

export interface TelemetrySpecLine {
  kicker: string;
  title: string;
  subtitle?: string;
}

export interface TelemetryCardInput {
  mode: TelemetryCardMode;
  battleCode: string;
  title: string;
  overallScore: number;
  specs: readonly TelemetrySpecLine[];
  axes: readonly RadarGeometryPoint[];
  background?: TelemetryBackgroundSource | null;
  /**
   * Stamp on the PNG plate. Default is the English brand mark so social share
   * stays language-stable until the UI slice wires an i18n override.
   */
  brandHeader?: string;
}

export interface TelemetryComposeDeps {
  createSurface?: () => TelemetryCanvasSurface;
}

function paintLabel(
  ctx: TelemetryDrawContext,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string,
  align: CanvasTextAlign,
  baseline: CanvasTextBaseline
): void {
  if (!text) return;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  try {
    ctx.font = font;
    ctx.fillText(text, x, y);
  } catch {
    try {
      ctx.font = '24px sans-serif';
      ctx.fillText(text, x, y);
    } catch {
      // Skip this run. The rest of the plate still encodes.
    }
  }
}

function scalePolygon(
  points: readonly RadarPoint2D[],
  cx: number,
  cy: number,
  scale: number
): RadarPoint2D[] {
  return points.map((point) => ({
    x: cx + (point.x - cx) * scale,
    y: cy + (point.y - cy) * scale,
  }));
}

function tracePolygon(ctx: TelemetryDrawContext, points: readonly RadarPoint2D[]): void {
  const first = points[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (point) ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
}

function paintRadar(ctx: TelemetryDrawContext, axes: readonly RadarGeometryPoint[]): void {
  if (axes.length === 0) return;
  const layout = TELEMETRY_RADAR_LAYOUT;
  const geometry = computeSixAxisRadarVertices({
    points: axes,
    cx: layout.cx,
    cy: layout.cy,
    outerRadius: layout.outerRadius,
    labelRadius: layout.labelRadius,
  });

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 1;

  for (const scale of RING_SCALES) {
    tracePolygon(ctx, scalePolygon(geometry.hexagon, layout.cx, layout.cy, scale));
    ctx.strokeStyle = 'rgba(148, 184, 198, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  for (const vertex of geometry.hexagon) {
    ctx.moveTo(layout.cx, layout.cy);
    ctx.lineTo(vertex.x, vertex.y);
  }
  ctx.strokeStyle = 'rgba(148, 184, 198, 0.35)';
  ctx.lineWidth = 1.25;
  ctx.stroke();

  tracePolygon(ctx, geometry.scorePolygon);
  ctx.fillStyle = 'rgba(34, 211, 238, 0.28)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.95)';
  ctx.lineWidth = 4;
  ctx.stroke();

  if (geometry.hasOverflow) {
    tracePolygon(ctx, geometry.overflowPolygon);
    ctx.strokeStyle = OVERFLOW_STROKE;
    ctx.lineWidth = 3;
    ctx.stroke();
    for (const vertex of geometry.vertices) {
      if (!vertex.overflowing) continue;
      ctx.beginPath();
      ctx.moveTo(vertex.xOuter, vertex.yOuter);
      ctx.lineTo(vertex.xOverflow, vertex.yOverflow);
      ctx.strokeStyle = OVERFLOW_STROKE;
      ctx.lineWidth = vertex.overflowExtra === geometry.maxOverflowExtra ? 4 : 2.5;
      ctx.stroke();
    }
  }

  for (const vertex of geometry.vertices) {
    ctx.beginPath();
    ctx.arc(vertex.xBase, vertex.yBase, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee';
    ctx.fill();
    paintLabel(
      ctx,
      vertex.label,
      vertex.xLabel,
      vertex.yLabel,
      `20px ${HUD_FONT_FAMILY}`,
      'rgba(228, 232, 236, 0.92)',
      vertex.textAnchor === 'start' ? 'left' : vertex.textAnchor === 'end' ? 'right' : 'center',
      'middle'
    );
  }
  ctx.restore();
}

function paintHud(ctx: TelemetryDrawContext, input: TelemetryCardInput): void {
  paintRadar(ctx, input.axes);

  const hud = TELEMETRY_HUD_LAYOUT;
  const brand = input.brandHeader?.trim() || TELEMETRY_CARD_BRAND;

  ctx.save();
  ctx.beginPath();
  ctx.rect(hud.clip.x, hud.clip.y, hud.clip.w, hud.clip.h);
  ctx.clip();

  paintLabel(
    ctx,
    brand,
    hud.textX,
    hud.brandY,
    `22px ${HUD_FONT_FAMILY}`,
    'rgba(186, 204, 214, 0.92)',
    'left',
    'middle'
  );
  paintLabel(
    ctx,
    input.battleCode,
    hud.textX,
    hud.battleCodeY,
    `26px ${HUD_FONT_FAMILY}`,
    'rgba(244, 244, 245, 0.96)',
    'left',
    'middle'
  );
  paintLabel(
    ctx,
    input.title,
    hud.textX,
    hud.titleY,
    `48px ${HUD_FONT_FAMILY}`,
    '#f4f4f5',
    'left',
    'middle'
  );
  paintLabel(
    ctx,
    formatOverallResonanceScore(input.overallScore),
    hud.textX,
    hud.scoreY,
    `92px ${HUD_FONT_FAMILY}`,
    '#67e8f9',
    'left',
    'middle'
  );

  input.specs.slice(0, 3).forEach((spec, index) => {
    const y = hud.specStartY + index * hud.specRowGap;
    paintLabel(
      ctx,
      spec.kicker,
      hud.textX,
      y,
      `16px ${HUD_FONT_FAMILY}`,
      'rgba(148, 184, 198, 0.9)',
      'left',
      'middle'
    );
    paintLabel(
      ctx,
      spec.title,
      hud.textX,
      y + 32,
      `26px ${HUD_FONT_FAMILY}`,
      '#f4f4f5',
      'left',
      'middle'
    );
    if (spec.subtitle) {
      paintLabel(
        ctx,
        spec.subtitle,
        hud.textX,
        y + 60,
        `16px ${HUD_FONT_FAMILY}`,
        'rgba(212, 212, 216, 0.8)',
        'left',
        'middle'
      );
    }
  });
  ctx.restore();
}

function createDomSurface(): TelemetryCanvasSurface {
  if (typeof document === 'undefined') {
    throw new TelemetryComposeError('no-document');
  }
  const canvas = document.createElement('canvas');
  return {
    get width() {
      return canvas.width;
    },
    set width(value: number) {
      canvas.width = value;
    },
    get height() {
      return canvas.height;
    },
    set height(value: number) {
      canvas.height = value;
    },
    getContext: () => canvas.getContext('2d') as TelemetryDrawContext | null,
    toBlob: (callback, type) => {
      canvas.toBlob((blob) => callback(blob), type ?? 'image/png');
    },
  };
}

function surfaceToPngBlob(surface: TelemetryCanvasSurface): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      surface.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new TelemetryComposeError('encode-failed'));
      }, 'image/png');
    } catch (error) {
      reject(
        error instanceof TelemetryComposeError ? error : new TelemetryComposeError('encode-failed')
      );
    }
  });
}

/**
 * Rasterize a local telemetry card to a PNG blob.
 * Selfie mode cover-crops `background` and lays a bottom-weighted black scrim under the HUD.
 * Any background failure paints the carbon plate instead of rejecting.
 */
export async function composeTelemetryCard(
  input: TelemetryCardInput,
  deps?: TelemetryComposeDeps
): Promise<Blob> {
  const surface = (deps?.createSurface ?? createDomSurface)();
  surface.width = TELEMETRY_CARD_WIDTH;
  surface.height = TELEMETRY_CARD_HEIGHT;
  const ctx = surface.getContext('2d');
  if (!ctx) throw new TelemetryComposeError('no-context');
  paintTelemetryBackground(ctx, input.mode, input.background);
  paintHud(ctx, input);
  return surfaceToPngBlob(surface);
}
