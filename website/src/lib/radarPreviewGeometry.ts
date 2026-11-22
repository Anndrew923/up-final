/**
 * Website-local six-axis geometry — mirrors app `radarGeometry` + overflow mapping.
 * WHY: Keep score polygon locked to the 100-ring; >100 bursts via overflowExtra only.
 */

import { RADAR_PREVIEW } from './radarPreviewTokens';

const BASE_CAP = 100;

export interface RadarPoint2D {
  x: number;
  y: number;
}

export interface RadarPreviewAxisInput {
  key: string;
  label: string;
  value: number;
}

export interface RadarPreviewVertex {
  key: string;
  label: string;
  raw: number;
  overflowing: boolean;
  overflowExtra: number;
  xBase: number;
  yBase: number;
  xOuter: number;
  yOuter: number;
  xOverflow: number;
  yOverflow: number;
  xLabel: number;
  yLabel: number;
}

export interface RadarPreviewGeometry {
  vertices: RadarPreviewVertex[];
  hexagon: RadarPoint2D[];
  scorePolygon: RadarPoint2D[];
  overflowPolygon: RadarPoint2D[];
  hasOverflow: boolean;
  maxOverflowExtra: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** HUD readout: integers bare; fractions 2dp — mirrors app `formatAxisScoreReadout`. */
export function formatAxisScoreReadout(
  value: number | undefined,
  emptyPlaceholder = '—',
): string {
  if (value == null || !Number.isFinite(value)) return emptyPlaceholder;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/**
 * Overclock burst radius — sqrt compression past the 100 elite ring.
 * Mirrored from app `radarOverflowExtraRadius`.
 */
export function radarOverflowExtraRadius(
  value: number,
  maxExtraRadius = RADAR_PREVIEW.geometry.maxOverflowExtra,
): number {
  const numeric = Math.max(0, Number(value) || 0);
  const overflow = Math.max(0, numeric - BASE_CAP);
  const capped = Math.min(overflow, 100);
  return round2(maxExtraRadius * Math.sqrt(capped / 100));
}

export function formatRadarPolygonAttr(points: readonly RadarPoint2D[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

export function computeRadarPreviewGeometry(input: {
  points: readonly RadarPreviewAxisInput[];
  cx: number;
  cy: number;
  outerRadius: number;
  labelRadius: number;
}): RadarPreviewGeometry {
  const { points, cx, cy, outerRadius, labelRadius } = input;
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

  const denom = BASE_CAP;
  const count = points.length;

  const vertices: RadarPreviewVertex[] = points.map((point, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const raw = Math.max(0, Number(point.value) || 0);
    const baseRadius = outerRadius * (Math.min(denom, raw) / denom);
    const overflowExtra = radarOverflowExtraRadius(raw);
    return {
      key: point.key,
      label: point.label,
      raw,
      overflowing: overflowExtra > 0,
      overflowExtra,
      xBase: cx + baseRadius * ux,
      yBase: cy + baseRadius * uy,
      xOuter: cx + outerRadius * ux,
      yOuter: cy + outerRadius * uy,
      xOverflow: cx + (outerRadius + overflowExtra) * ux,
      yOverflow: cy + (outerRadius + overflowExtra) * uy,
      xLabel: cx + labelRadius * ux,
      yLabel: cy + labelRadius * uy,
    };
  });

  let maxOverflowExtra = 0;
  for (const v of vertices) {
    if (v.overflowExtra > maxOverflowExtra) maxOverflowExtra = v.overflowExtra;
  }

  return {
    vertices,
    hexagon: vertices.map((v) => ({ x: v.xOuter, y: v.yOuter })),
    scorePolygon: vertices.map((v) => ({ x: v.xBase, y: v.yBase })),
    overflowPolygon: vertices.map((v) => ({ x: v.xOverflow, y: v.yOverflow })),
    hasOverflow: vertices.some((v) => v.overflowing),
    maxOverflowExtra,
  };
}
