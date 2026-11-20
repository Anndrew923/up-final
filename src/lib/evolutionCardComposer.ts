/**
 * Offscreen Evolution Telemetry Card (4:5).
 *
 * WHY: Isolated from `composeTelemetryCard` / `telemetryCardLayout` so Carbon /
 * Selfie optical regressions stay green while LOGS ships a dual-radar share plate
 * that mirrors on-screen `HexRadarChart` ritual compare (amber dashed baseline +
 * cyan solid current) without mutating those modules.
 */
import {
  computeSixAxisRadarVertices,
  type RadarGeometryPoint,
  type RadarPoint2D,
} from '../logic/core/radarGeometry';
import { formatSignedDelta } from '../logic/core/formatSignedDelta';
import type { LogEvolutionAxisDelta, LogEvolutionMode } from '../logic/core/logEvolutionReport';
import type { SixAxisMetric } from '../types/scoring';
import {
  clearCanvasShadow,
  TelemetryComposeError,
  type TelemetryCanvasSurface,
  type TelemetryDrawContext,
} from './telemetryCardTypes';

/** Logical plate — Instagram / FB 4:5 feed. */
export const EVOLUTION_CARD_LOGIC_WIDTH = 1080;
export const EVOLUTION_CARD_LOGIC_HEIGHT = 1350;
/** Retina export multiplier → 2160×2700 physical. */
export const EVOLUTION_CARD_EXPORT_SCALE = 2;

export const EVOLUTION_CARD_PIXEL_WIDTH =
  EVOLUTION_CARD_LOGIC_WIDTH * EVOLUTION_CARD_EXPORT_SCALE;
export const EVOLUTION_CARD_PIXEL_HEIGHT =
  EVOLUTION_CARD_LOGIC_HEIGHT * EVOLUTION_CARD_EXPORT_SCALE;

const FONT_STACK = '"PingFang TC", "Noto Sans TC", "Helvetica Neue", sans-serif';

const COLORS = {
  bgTop: '#0a0a0b',
  bgBottom: '#000000',
  hairline: 'rgba(255, 140, 0, 0.35)',
  brand: '#fbbf24',
  muted: 'rgba(161, 161, 170, 0.92)',
  ink: '#f4f4f5',
  cyan: '#22d3ee',
  cyanFill: 'rgba(34, 211, 238, 0.22)',
  amber: '#fbbf24',
  green: '#4ade80',
  grid: 'rgba(63, 63, 70, 0.85)',
  card: 'rgba(24, 24, 27, 0.72)',
  pr: '#fbbf24',
} as const;

export interface EvolutionCardCopy {
  brandHeader: string;
  dateRange: string;
  overallLabel: string;
  baselineLocked: string;
  prBadge: string;
  emptyScore: string;
  /** Fully localized legend row — e.g. `基準（2026.01.01）`. */
  legendBaseline: string;
  legendCurrent: string;
  axisLabels: Record<SixAxisMetric, string>;
}

export interface EvolutionCardComposeInput {
  mode: LogEvolutionMode;
  baselineOverall: number | null;
  currentOverall: number | null;
  overallDelta: number | null;
  baselineAxes: readonly RadarGeometryPoint[];
  currentAxes: readonly RadarGeometryPoint[];
  deltas: readonly LogEvolutionAxisDelta[];
  copy: EvolutionCardCopy;
}

export interface EvolutionComposeDeps {
  createSurface?: () => TelemetryCanvasSurface;
}

export function resolveEvolutionCardSize(): {
  width: number;
  height: number;
  exportScale: number;
  pixelWidth: number;
  pixelHeight: number;
} {
  return {
    width: EVOLUTION_CARD_LOGIC_WIDTH,
    height: EVOLUTION_CARD_LOGIC_HEIGHT,
    exportScale: EVOLUTION_CARD_EXPORT_SCALE,
    pixelWidth: EVOLUTION_CARD_PIXEL_WIDTH,
    pixelHeight: EVOLUTION_CARD_PIXEL_HEIGHT,
  };
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
        error instanceof TelemetryComposeError
          ? error
          : new TelemetryComposeError('encode-failed')
      );
    }
  });
}

function formatScore(value: number | null, empty: string): string {
  if (value == null || !Number.isFinite(value)) return empty;
  return value.toFixed(2);
}

function deltaFill(delta: number | null): string {
  if (delta == null || !Number.isFinite(delta) || delta === 0) return COLORS.muted;
  return delta > 0 ? COLORS.green : COLORS.amber;
}

function tracePolygon(ctx: TelemetryDrawContext, points: readonly RadarPoint2D[]): void {
  const first = points[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (point) ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
}

function paintBackground(ctx: TelemetryDrawContext, w: number, h: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, COLORS.bgTop);
  gradient.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = COLORS.hairline;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, 36, w - 72, h - 72);
}

function paintDualRadar(
  ctx: TelemetryDrawContext,
  baselineAxes: readonly RadarGeometryPoint[],
  currentAxes: readonly RadarGeometryPoint[],
  cx: number,
  cy: number,
  outerRadius: number
): void {
  const labelRadius = outerRadius + 36;
  const rings = [1, 0.66, 0.33] as const;

  const paintGrid = (axes: readonly RadarGeometryPoint[]) => {
    if (axes.length === 0) return;
    const geo = computeSixAxisRadarVertices({
      points: axes,
      cx,
      cy,
      outerRadius,
      labelRadius,
    });
    for (const scale of rings) {
      tracePolygon(
        ctx,
        geo.hexagon.map((p) => ({
          x: cx + (p.x - cx) * scale,
          y: cy + (p.y - cy) * scale,
        }))
      );
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
    for (const vertex of geo.hexagon) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(vertex.x, vertex.y);
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  paintGrid(currentAxes.length > 0 ? currentAxes : baselineAxes);

  if (baselineAxes.length > 0) {
    const baselineGeo = computeSixAxisRadarVertices({
      points: baselineAxes,
      cx,
      cy,
      outerRadius,
      labelRadius,
    });
    // WHY: Match ritual HexRadarChart compare layer — amber dashed, no fill.
    tracePolygon(ctx, baselineGeo.scorePolygon);
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (currentAxes.length > 0) {
    const currentGeo = computeSixAxisRadarVertices({
      points: currentAxes,
      cx,
      cy,
      outerRadius,
      labelRadius,
    });
    tracePolygon(ctx, currentGeo.scorePolygon);
    ctx.fillStyle = COLORS.cyanFill;
    ctx.fill();
    ctx.shadowColor = 'rgba(34, 211, 238, 0.55)';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 3;
    ctx.stroke();
    clearCanvasShadow(ctx);

    for (const vertex of currentGeo.vertices) {
      ctx.beginPath();
      ctx.arc(vertex.xBase, vertex.yBase, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.cyan;
      ctx.fill();
    }

    ctx.fillStyle = COLORS.ink;
    ctx.font = `20px ${FONT_STACK}`;
    ctx.textBaseline = 'middle';
    for (const vertex of currentGeo.vertices) {
      const align =
        vertex.textAnchor === 'start'
          ? 'left'
          : vertex.textAnchor === 'end'
            ? 'right'
            : 'center';
      ctx.textAlign = align;
      ctx.fillText(vertex.label, vertex.xLabel, vertex.yLabel);
    }
  }
}

/**
 * Dual-line legend under the hex — mirrors on-screen LogEvolutionCard so social
 * viewers can decode amber dashed vs cyan solid without the in-app chrome.
 */
function paintRadarLegend(
  ctx: TelemetryDrawContext,
  copy: EvolutionCardCopy,
  cy: number
): void {
  const midX = EVOLUTION_CARD_LOGIC_WIDTH / 2;
  const y = cy + 248;
  const leftX = midX - 220;
  const rightX = midX + 40;

  ctx.save();
  ctx.strokeStyle = COLORS.amber;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(leftX, y);
  ctx.lineTo(leftX + 36, y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = COLORS.ink;
  ctx.font = `15px ${FONT_STACK}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(copy.legendBaseline, leftX + 46, y);

  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(34, 211, 238, 0.45)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(rightX, y);
  ctx.lineTo(rightX + 36, y);
  ctx.stroke();
  clearCanvasShadow(ctx);

  ctx.fillStyle = COLORS.ink;
  ctx.fillText(copy.legendCurrent, rightX + 46, y);
  ctx.restore();
}

function paintOverallFocus(
  ctx: TelemetryDrawContext,
  input: EvolutionCardComposeInput,
  y: number
): void {
  const { copy, mode, baselineOverall, currentOverall, overallDelta } = input;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (mode === 'baseline_ready') {
    ctx.fillStyle = COLORS.brand;
    ctx.font = `700 28px ${FONT_STACK}`;
    ctx.fillText(copy.baselineLocked, EVOLUTION_CARD_LOGIC_WIDTH / 2, y);
    return;
  }

  ctx.fillStyle = COLORS.muted;
  ctx.font = `12px ${FONT_STACK}`;
  ctx.fillText(copy.overallLabel, EVOLUTION_CARD_LOGIC_WIDTH / 2, y - 34);

  const from = formatScore(baselineOverall, copy.emptyScore);
  const to = formatScore(currentOverall, copy.emptyScore);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `700 44px ${FONT_STACK}`;
  ctx.fillText(`${from}  →  ${to}`, EVOLUTION_CARD_LOGIC_WIDTH / 2, y + 8);

  const badge = formatSignedDelta(overallDelta, copy.emptyScore);
  ctx.fillStyle = deltaFill(overallDelta);
  ctx.font = `700 26px ${FONT_STACK}`;
  ctx.fillText(badge, EVOLUTION_CARD_LOGIC_WIDTH / 2, y + 52);
}

function paintAxisGrid(
  ctx: TelemetryDrawContext,
  deltas: readonly LogEvolutionAxisDelta[],
  copy: EvolutionCardCopy,
  startY: number
): void {
  const cols = 2;
  const cardW = 460;
  const cardH = 92;
  const gapX = 28;
  const gapY = 18;
  const originX = (EVOLUTION_CARD_LOGIC_WIDTH - (cols * cardW + gapX)) / 2;

  deltas.forEach((row, index) => {
    const col = index % cols;
    const rowIdx = Math.floor(index / cols);
    const x = originX + col * (cardW + gapX);
    const y = startY + rowIdx * (cardH + gapY);

    ctx.fillStyle = COLORS.card;
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.9)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeRect(x, y, cardW, cardH);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.muted;
    ctx.font = `13px ${FONT_STACK}`;
    ctx.fillText(copy.axisLabels[row.axis], x + 18, y + 24);

    if (row.isPersonalBest) {
      ctx.fillStyle = COLORS.pr;
      ctx.font = `700 12px ${FONT_STACK}`;
      ctx.textAlign = 'right';
      ctx.fillText(copy.prBadge, x + cardW - 18, y + 24);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 22px ${FONT_STACK}`;
    ctx.fillText(
      `${formatScore(row.from, copy.emptyScore)} → ${formatScore(row.to, copy.emptyScore)}`,
      x + 18,
      y + 58
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = deltaFill(row.delta);
    ctx.font = `700 20px ${FONT_STACK}`;
    ctx.fillText(formatSignedDelta(row.delta, copy.emptyScore), x + cardW - 18, y + 58);
  });
}

/**
 * Paint evolution plate into a draw context (logical 1080×1350 coords).
 * Exported for contract tests without requiring a PNG encode path.
 */
export function paintEvolutionCard(
  ctx: TelemetryDrawContext,
  input: EvolutionCardComposeInput
): void {
  const w = EVOLUTION_CARD_LOGIC_WIDTH;
  const h = EVOLUTION_CARD_LOGIC_HEIGHT;
  paintBackground(ctx, w, h);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.brand;
  ctx.font = `700 22px ${FONT_STACK}`;
  ctx.fillText(input.copy.brandHeader, 72, 88);

  ctx.fillStyle = COLORS.muted;
  ctx.font = `16px ${FONT_STACK}`;
  ctx.fillText(input.copy.dateRange, 72, 122);

  paintDualRadar(ctx, input.baselineAxes, input.currentAxes, w / 2, 420, 200);
  paintRadarLegend(ctx, input.copy, 420);
  paintOverallFocus(ctx, input, 730);

  if (input.mode === 'comparing' && input.deltas.length > 0) {
    paintAxisGrid(ctx, input.deltas, input.copy, 810);
  }
}

/**
 * Rasterize the evolution dual-radar share card to a PNG blob (2160×2700).
 */
export async function composeEvolutionCard(
  input: EvolutionCardComposeInput,
  deps?: EvolutionComposeDeps
): Promise<Blob> {
  const plate = resolveEvolutionCardSize();
  const surface = (deps?.createSurface ?? createDomSurface)();
  surface.width = plate.pixelWidth;
  surface.height = plate.pixelHeight;
  const ctx = surface.getContext('2d');
  if (!ctx) throw new TelemetryComposeError('no-context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(plate.exportScale, plate.exportScale);
  paintEvolutionCard(ctx, input);
  return surfaceToPngBlob(surface);
}
