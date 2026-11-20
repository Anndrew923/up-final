/**
 * Offscreen Evolution Telemetry Card (4:5).
 *
 * WHY: Isolated from `composeTelemetryCard` / `telemetryCardLayout` so Carbon /
 * Selfie optical regressions stay green while LOGS ships a dual-radar share plate
 * that mirrors on-screen `HexRadarChart` ritual compare (warm `#FBBF24` dashed
 * baseline + high-voltage cyan bloom current) without mutating those modules.
 *
 * Layout WHY: Vertical bands are hard-separated so EN long labels
 * (`Skeletal Muscle`, `Baseline (YYYY.MM.DD)`) never share a Y band with the
 * legend or hero score — social readers must decode the plate in one glance.
 */
import type { RadarGeometryPoint } from '../logic/core/radarGeometry';
import { formatSignedDelta } from '../logic/core/formatSignedDelta';
import type { LogEvolutionAxisDelta, LogEvolutionMode } from '../logic/core/logEvolutionReport';
import type { SixAxisMetric } from '../types/scoring';
import {
  EVOLUTION_RADAR_BASELINE_DASH,
  EVOLUTION_RADAR_BASELINE_STROKE,
  EVOLUTION_RADAR_NEON,
  paintEvolutionDualRadar,
} from './evolutionRadarPainter';
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

/**
 * Vertical / horizontal band SSOT (logical px).
 * WHY exported so layout contracts can assert EN anti-overlap without screenshot diffs.
 */
export const EVOLUTION_CARD_LAYOUT = {
  frameInset: 36,
  frameInnerInset: 44,
  bracketLen: 32,
  radarCx: EVOLUTION_CARD_LOGIC_WIDTH / 2,
  /** Raised ~22px vs prior 420 — frees mid-plate for legend / hero. */
  radarCy: 398,
  /** Shrunk ~16px vs prior 200. */
  radarRadius: 184,
  radarLabelExtra: 32,
  /** Must match `paintEvolutionDualRadar` label font — clearance math SSOT. */
  radarLabelFontPx: 20,
  /**
   * Legend band center — bottom spoke label sits at cy+radius+labelExtra;
   * keep ≥36px clear air under that label's glyph box.
   */
  legendY: 678,
  legendFontPx: 23,
  /** Minimum clear gap between EN Baseline / Current text boxes at mid-plate. */
  legendCenterGap: 48,
  legendSwatch: 36,
  legendSwatchGap: 10,
  legendMaxTextWidth: 300,
  /** ≥32px air under legend glyph box before OVERALL POWER. */
  overallLabelY: 740,
  overallLabelFontPx: 12,
  overallScoreY: 786,
  overallScoreFontPx: 44,
  /**
   * WHY: Center-to-center must clear both em-halves plus ≥12px optical air;
   * prior 814 packed a 44px score into a 26px +Δ and visually crushed the hero.
   */
  overallDeltaY: 837,
  overallDeltaFontPx: 26,
  axisGridStartY: 866,
  axisCardW: 460,
  axisCardH: 80,
  axisGapX: 28,
  axisGapY: 8,
} as const;

/** Em half-box factor for middle-baseline clearance math (matches canvas optical feel). */
const GLYPH_HALF_EM = 0.55;

const COLORS = {
  bgTop: '#0c0a09',
  bgBottom: '#000000',
  warmGoldCore: 'rgba(217, 119, 6, 0.14)',
  warmGoldEdge: 'rgba(245, 158, 11, 0)',
  frameOuter: 'rgba(217, 119, 6, 0.42)',
  frameInner: 'rgba(245, 158, 11, 0.28)',
  bracket: 'rgba(245, 158, 11, 0.72)',
  /** Plate gold — SSOT with radar baseline / PR nodes. */
  brand: EVOLUTION_RADAR_BASELINE_STROKE,
  muted: 'rgba(161, 161, 170, 0.92)',
  ink: '#f4f4f5',
  baselineScore: 'rgba(212, 212, 216, 0.88)',
  currentScore: EVOLUTION_RADAR_BASELINE_STROKE,
  /** Legend current swatch — SSOT with neon main tube. */
  cyan: EVOLUTION_RADAR_NEON.main,
  cyanGlow: 'rgba(34, 211, 238, 0.4)',
  /** Legend baseline swatch — SSOT with radar baseline stroke. */
  baselineStroke: EVOLUTION_RADAR_BASELINE_STROKE,
  amber: EVOLUTION_RADAR_BASELINE_STROKE,
  green: '#4ade80',
  card: 'rgba(24, 24, 27, 0.72)',
  cardStroke: 'rgba(120, 113, 108, 0.45)',
  pr: EVOLUTION_RADAR_BASELINE_STROKE,
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

export interface EvolutionLegendAnchors {
  midX: number;
  legendY: number;
  leftTextRightX: number;
  rightTextLeftX: number;
  centerGap: number;
  maxTextWidth: number;
  fontPx: number;
}

/** Bottom spoke label center Y (muscle / Skeletal Muscle). */
export function resolveEvolutionRadarBottomLabelY(
  layout: typeof EVOLUTION_CARD_LAYOUT = EVOLUTION_CARD_LAYOUT
): number {
  return layout.radarCy + layout.radarRadius + layout.radarLabelExtra;
}

/**
 * Clear air from bottom-spoke label glyph box bottom → legend glyph box top.
 */
export function resolveEvolutionLegendClearancePx(
  layout: typeof EVOLUTION_CARD_LAYOUT = EVOLUTION_CARD_LAYOUT
): number {
  const labelHalf = layout.radarLabelFontPx * GLYPH_HALF_EM;
  const legendHalf = layout.legendFontPx * GLYPH_HALF_EM;
  return layout.legendY - legendHalf - (resolveEvolutionRadarBottomLabelY(layout) + labelHalf);
}

/**
 * Clear air from overall score glyph box bottom → +Δ glyph box top.
 */
export function resolveEvolutionScoreDeltaClearancePx(
  layout: typeof EVOLUTION_CARD_LAYOUT = EVOLUTION_CARD_LAYOUT
): number {
  const scoreHalf = layout.overallScoreFontPx * GLYPH_HALF_EM;
  const deltaHalf = layout.overallDeltaFontPx * GLYPH_HALF_EM;
  return layout.overallDeltaY - deltaHalf - (layout.overallScoreY + scoreHalf);
}

export function resolveEvolutionLegendAnchors(
  layout: typeof EVOLUTION_CARD_LAYOUT = EVOLUTION_CARD_LAYOUT
): EvolutionLegendAnchors {
  const midX = layout.radarCx;
  const halfGap = layout.legendCenterGap / 2;
  return {
    midX,
    legendY: layout.legendY,
    leftTextRightX: midX - halfGap,
    rightTextLeftX: midX + halfGap,
    centerGap: layout.legendCenterGap,
    maxTextWidth: layout.legendMaxTextWidth,
    fontPx: layout.legendFontPx,
  };
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

function paintCornerBrackets(
  ctx: TelemetryDrawContext,
  inset: number,
  len: number,
  w: number,
  h: number
): void {
  ctx.strokeStyle = COLORS.bracket;
  ctx.lineWidth = 2;
  ctx.lineCap = 'square';
  const corners: Array<[number, number, number, number, number, number]> = [
    [inset, inset + len, inset, inset, inset + len, inset],
    [w - inset - len, inset, w - inset, inset, w - inset, inset + len],
    [inset, h - inset - len, inset, h - inset, inset + len, h - inset],
    [w - inset - len, h - inset, w - inset, h - inset, w - inset, h - inset - len],
  ];
  for (const [x0, y0, x1, y1, x2, y2] of corners) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function paintBackground(ctx: TelemetryDrawContext, w: number, h: number): void {
  const linear = ctx.createLinearGradient(0, 0, 0, h);
  linear.addColorStop(0, COLORS.bgTop);
  linear.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = linear;
  ctx.fillRect(0, 0, w, h);

  // WHY: Soft champagne radial behind the hex — warms the cold cyan polygon without glitter.
  const warm = ctx.createRadialGradient(
    EVOLUTION_CARD_LAYOUT.radarCx,
    EVOLUTION_CARD_LAYOUT.radarCy,
    40,
    EVOLUTION_CARD_LAYOUT.radarCx,
    EVOLUTION_CARD_LAYOUT.radarCy,
    420
  );
  warm.addColorStop(0, COLORS.warmGoldCore);
  warm.addColorStop(1, COLORS.warmGoldEdge);
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);

  const inset = EVOLUTION_CARD_LAYOUT.frameInset;
  const inner = EVOLUTION_CARD_LAYOUT.frameInnerInset;
  ctx.strokeStyle = COLORS.frameOuter;
  ctx.lineWidth = 1.75;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.strokeStyle = COLORS.frameInner;
  ctx.lineWidth = 1;
  ctx.strokeRect(inner, inner, w - inner * 2, h - inner * 2);
  paintCornerBrackets(ctx, inset, EVOLUTION_CARD_LAYOUT.bracketLen, w, h);
}

/**
 * Dual-line legend under the hex — right/left text anchors hug a fixed center gap
 * so EN `Baseline (YYYY.MM.DD)` never collides with `Current (YYYY.MM.DD)`.
 */
function paintRadarLegend(ctx: TelemetryDrawContext, copy: EvolutionCardCopy): void {
  const anchors = resolveEvolutionLegendAnchors();
  const { legendY, leftTextRightX, rightTextLeftX, maxTextWidth, fontPx } = anchors;
  const swatch = EVOLUTION_CARD_LAYOUT.legendSwatch;
  const swatchGap = EVOLUTION_CARD_LAYOUT.legendSwatchGap;

  ctx.save();
  ctx.font = `${fontPx}px ${FONT_STACK}`;
  ctx.textBaseline = 'middle';

  const leftTextW = Math.min(ctx.measureText(copy.legendBaseline).width, maxTextWidth);
  const leftSwatchRight = leftTextRightX - leftTextW - swatchGap;
  const leftSwatchLeft = leftSwatchRight - swatch;

  ctx.strokeStyle = COLORS.baselineStroke;
  ctx.lineWidth = 2.5;
  // WHY: Same dash SSOT as radar baseline — legend `---` must never drift.
  ctx.setLineDash([...EVOLUTION_RADAR_BASELINE_DASH]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(leftSwatchLeft, legendY);
  ctx.lineTo(leftSwatchRight, legendY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = 'right';
  ctx.fillText(copy.legendBaseline, leftTextRightX, legendY, maxTextWidth);

  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 3;
  ctx.shadowColor = COLORS.cyanGlow;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(rightTextLeftX, legendY);
  ctx.lineTo(rightTextLeftX + swatch, legendY);
  ctx.stroke();
  clearCanvasShadow(ctx);

  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = 'left';
  ctx.fillText(
    copy.legendCurrent,
    rightTextLeftX + swatch + swatchGap,
    legendY,
    maxTextWidth
  );
  ctx.restore();
}

function paintOverallFocus(ctx: TelemetryDrawContext, input: EvolutionCardComposeInput): void {
  const { copy, mode, baselineOverall, currentOverall, overallDelta } = input;
  const midX = EVOLUTION_CARD_LAYOUT.radarCx;
  const labelY = EVOLUTION_CARD_LAYOUT.overallLabelY;
  const scoreY = EVOLUTION_CARD_LAYOUT.overallScoreY;
  const deltaY = EVOLUTION_CARD_LAYOUT.overallDeltaY;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (mode === 'baseline_ready') {
    ctx.fillStyle = COLORS.brand;
    ctx.font = `700 28px ${FONT_STACK}`;
    ctx.fillText(copy.baselineLocked, midX, scoreY);
    return;
  }

  ctx.fillStyle = COLORS.muted;
  ctx.font = `${EVOLUTION_CARD_LAYOUT.overallLabelFontPx}px ${FONT_STACK}`;
  ctx.fillText(copy.overallLabel, midX, labelY);

  const from = formatScore(baselineOverall, copy.emptyScore);
  const to = formatScore(currentOverall, copy.emptyScore);
  const arrow = '  →  ';
  ctx.font = `700 ${EVOLUTION_CARD_LAYOUT.overallScoreFontPx}px ${FONT_STACK}`;
  const fromW = ctx.measureText(from).width;
  const arrowW = ctx.measureText(arrow).width;
  const toW = ctx.measureText(to).width;
  const totalW = fromW + arrowW + toW;
  let cursor = midX - totalW / 2;
  ctx.textAlign = 'left';
  // WHY: Cool baseline vs champagne current — “past calm → present glory” without glitter FX.
  ctx.fillStyle = COLORS.baselineScore;
  ctx.fillText(from, cursor, scoreY);
  cursor += fromW;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(arrow, cursor, scoreY);
  cursor += arrowW;
  ctx.fillStyle = COLORS.currentScore;
  ctx.fillText(to, cursor, scoreY);

  ctx.textAlign = 'center';
  const badge = formatSignedDelta(overallDelta, copy.emptyScore);
  ctx.fillStyle = deltaFill(overallDelta);
  ctx.font = `700 ${EVOLUTION_CARD_LAYOUT.overallDeltaFontPx}px ${FONT_STACK}`;
  ctx.fillText(badge, midX, deltaY);
}

function paintAxisGrid(
  ctx: TelemetryDrawContext,
  deltas: readonly LogEvolutionAxisDelta[],
  copy: EvolutionCardCopy
): void {
  const cols = 2;
  const cardW = EVOLUTION_CARD_LAYOUT.axisCardW;
  const cardH = EVOLUTION_CARD_LAYOUT.axisCardH;
  const gapX = EVOLUTION_CARD_LAYOUT.axisGapX;
  const gapY = EVOLUTION_CARD_LAYOUT.axisGapY;
  const startY = EVOLUTION_CARD_LAYOUT.axisGridStartY;
  const originX = (EVOLUTION_CARD_LOGIC_WIDTH - (cols * cardW + gapX)) / 2;

  deltas.forEach((row, index) => {
    const col = index % cols;
    const rowIdx = Math.floor(index / cols);
    const x = originX + col * (cardW + gapX);
    const y = startY + rowIdx * (cardH + gapY);

    ctx.fillStyle = COLORS.card;
    ctx.strokeStyle = COLORS.cardStroke;
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeRect(x, y, cardW, cardH);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.muted;
    ctx.font = `13px ${FONT_STACK}`;
    ctx.fillText(copy.axisLabels[row.axis], x + 18, y + 22);

    if (row.isPersonalBest) {
      ctx.fillStyle = COLORS.pr;
      ctx.font = `700 12px ${FONT_STACK}`;
      ctx.textAlign = 'right';
      ctx.fillText(copy.prBadge, x + cardW - 18, y + 22);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 20px ${FONT_STACK}`;
    ctx.fillText(
      `${formatScore(row.from, copy.emptyScore)} → ${formatScore(row.to, copy.emptyScore)}`,
      x + 18,
      y + 52
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = deltaFill(row.delta);
    ctx.font = `700 18px ${FONT_STACK}`;
    ctx.fillText(formatSignedDelta(row.delta, copy.emptyScore), x + cardW - 18, y + 52);
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
  const layout = EVOLUTION_CARD_LAYOUT;
  paintBackground(ctx, w, h);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.brand;
  ctx.font = `700 22px ${FONT_STACK}`;
  ctx.fillText(input.copy.brandHeader, 72, 88);

  ctx.fillStyle = COLORS.muted;
  ctx.font = `16px ${FONT_STACK}`;
  ctx.fillText(input.copy.dateRange, 72, 122);

  paintEvolutionDualRadar(ctx, {
    baselineAxes: input.baselineAxes,
    currentAxes: input.currentAxes,
    deltas: input.deltas,
    cx: layout.radarCx,
    cy: layout.radarCy,
    outerRadius: layout.radarRadius,
    labelExtra: layout.radarLabelExtra,
    labelFontPx: layout.radarLabelFontPx,
  });
  paintRadarLegend(ctx, input.copy);
  paintOverallFocus(ctx, input);

  if (input.mode === 'comparing' && input.deltas.length > 0) {
    paintAxisGrid(ctx, input.deltas, input.copy);
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
