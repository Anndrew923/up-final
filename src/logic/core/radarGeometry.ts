/**
 * Six-axis radar vertex geometry.
 *
 * WHY: Home SVG and the offline telemetry card must share one spoke formula.
 * Overflow bursts from the full 100-ring (`outerRadius`) while the score polygon
 * shrinks with ritual `fill`, matching `HexRadarChart` so a partial charge still
 * reads as a breakout past the hex instead of a scaled-down ring.
 */
import type { RadarChartPoint } from '../../types/radarDisplay';
import { RADAR_DISPLAY_MIN, radarOverflowExtraRadius } from './scoring';

export interface RadarPoint2D {
  x: number;
  y: number;
}

/** Alias — same contract as Home radar points; kept so share/composer call sites stay explicit. */
export type RadarGeometryPoint = RadarChartPoint;

export type RadarLabelAnchor = 'start' | 'middle' | 'end';
export type RadarLabelBaseline = 'hanging' | 'auto' | 'middle';

/**
 * Flat spoke payload — property names match the former `HexRadarChart` `axisNodes`
 * so SVG callers can swap the useMemo for this function without remapping fields.
 */
export interface SixAxisRadarVertex {
  key: string;
  label: string;
  /** Non-negative raw score. Magnitudes above 100 stay intact so overflow can fire. */
  raw: number;
  overflowing: boolean;
  /** Pixels past `outerRadius` along this spoke. Already scaled by `fill`. */
  overflowExtra: number;
  ux: number;
  uy: number;
  /** Score polygon vertex, capped at the 100-ring then scaled by fill. */
  xBase: number;
  yBase: number;
  /** 100-ring hex vertex (not scaled by ritual fill). */
  xOuter: number;
  yOuter: number;
  /** Burst vertex: outer ring plus `overflowExtra`. */
  xOverflow: number;
  yOverflow: number;
  xLabel: number;
  yLabel: number;
  textAnchor: RadarLabelAnchor;
  dominantBaseline: RadarLabelBaseline;
}

export interface SixAxisRadarGeometry {
  vertices: SixAxisRadarVertex[];
  /** Base hexagon in axis order (the 100-ring). */
  hexagon: RadarPoint2D[];
  /** Actual value polygon. */
  scorePolygon: RadarPoint2D[];
  /** Overflow polygon. Coincides with the hex when no axis exceeds 100. */
  overflowPolygon: RadarPoint2D[];
  hasOverflow: boolean;
  maxOverflowExtra: number;
}

export interface SixAxisRadarGeometryInput {
  points: readonly RadarGeometryPoint[];
  cx: number;
  cy: number;
  outerRadius: number;
  labelRadius: number;
  /**
   * Spoke scale cap. The chart passes its live `scaleMax`; the denom is
   * `min(scaleMax, 100)` so elite scores still sit on the 100-ring.
   * Default 100.
   */
  scaleMax?: number;
  /**
   * 0–1 Home ritual charge. Default 1 (fully drawn).
   * Score radius and overflow extra both scale; the hex ring does not.
   */
  fill?: number;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function labelAnchor(ux: number): RadarLabelAnchor {
  if (ux > 0.35) return 'start';
  if (ux < -0.35) return 'end';
  return 'middle';
}

function labelBaseline(uy: number): RadarLabelBaseline {
  if (uy > 0.45) return 'hanging';
  if (uy < -0.45) return 'auto';
  return 'middle';
}

/** SVG `points=""` attribute from geometry polygons — one formatter for score / overflow / rings. */
export function formatRadarPolygonAttr(points: readonly RadarPoint2D[]): string {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
}

/**
 * Map axis scores to hex, score, overflow, and label coordinates.
 * Vertex count follows `points.length` so partial charts stay on the same spokes.
 * Axis 0 points up (`-π/2`), then clockwise in caller order — the Home six-axis order.
 */
export function computeSixAxisRadarVertices(
  input: SixAxisRadarGeometryInput
): SixAxisRadarGeometry {
  const points = input.points;
  if (points.length === 0) {
    return {
      vertices: [],
      hexagon: [],
      scorePolygon: [],
      overflowPolygon: [],
      hasOverflow: false,
      maxOverflowExtra: 0,
    };
  }

  const cx = finiteOr(input.cx, 0);
  const cy = finiteOr(input.cy, 0);
  const outerRadius = Math.max(0, finiteOr(input.outerRadius, 0));
  const labelRadius = Math.max(0, finiteOr(input.labelRadius, 0));
  const scaleMax = finiteOr(input.scaleMax ?? RADAR_DISPLAY_MIN, RADAR_DISPLAY_MIN);
  const denom = Math.max(Math.min(scaleMax, RADAR_DISPLAY_MIN), 1e-6);
  const fill = Math.min(1, Math.max(0, finiteOr(input.fill ?? 1, 0)));
  const count = points.length;

  const vertices: SixAxisRadarVertex[] = points.map((point, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const raw = Math.max(0, Number(point.value) || 0);
    const baseRadius = outerRadius * (Math.min(denom, raw) / denom) * fill;
    const overflowExtra = radarOverflowExtraRadius(raw) * fill;
    return {
      key: point.key,
      label: point.label,
      raw,
      overflowing: overflowExtra > 0,
      overflowExtra,
      ux,
      uy,
      xBase: cx + baseRadius * ux,
      yBase: cy + baseRadius * uy,
      xOuter: cx + outerRadius * ux,
      yOuter: cy + outerRadius * uy,
      xOverflow: cx + (outerRadius + overflowExtra) * ux,
      yOverflow: cy + (outerRadius + overflowExtra) * uy,
      xLabel: cx + labelRadius * ux,
      yLabel: cy + labelRadius * uy,
      textAnchor: labelAnchor(ux),
      dominantBaseline: labelBaseline(uy),
    };
  });

  let maxOverflowExtra = 0;
  for (const vertex of vertices) {
    if (vertex.overflowExtra > maxOverflowExtra) maxOverflowExtra = vertex.overflowExtra;
  }

  return {
    vertices,
    hexagon: vertices.map((vertex) => ({ x: vertex.xOuter, y: vertex.yOuter })),
    scorePolygon: vertices.map((vertex) => ({ x: vertex.xBase, y: vertex.yBase })),
    overflowPolygon: vertices.map((vertex) => ({ x: vertex.xOverflow, y: vertex.yOverflow })),
    hasOverflow: vertices.some((vertex) => vertex.overflowing),
    maxOverflowExtra,
  };
}
