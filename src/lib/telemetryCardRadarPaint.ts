/**
 * Selfie HUD holographic six-axis radar paint.
 * WHY: Keeps neon/tactical Canvas detail out of the composer orchestrator so both
 * stay under the 500-line split threshold without touching carbon certificate paint.
 */
import {
  computeSixAxisRadarVertices,
  type RadarGeometryPoint,
  type RadarPoint2D,
} from '../logic/core/radarGeometry';
import type { TelemetryDrawContext } from './telemetryCardTypes';

/**
 * Selfie HUD radar — left-biased so long EN axis labels stay left of the corridor.
 * WHY: Centered labels at labelRadius spilled "Explosive Power" into the right HUD.
 */
export const TELEMETRY_RADAR_LAYOUT = {
  cx: 248,
  cy: 1460,
  outerRadius: 140,
  labelRadius: 180,
} as const;

/** Tactical dashed ring — outside hex, inside label orbit (outerRadius+12 < labelRadius). */
export const TELEMETRY_RADAR_TACTICAL_RING_RADIUS =
  TELEMETRY_RADAR_LAYOUT.outerRadius + 12;

/**
 * Absolute right edge for any radar axis label — keeps ≥55px corridor before textX=585.
 */
export const TELEMETRY_RADAR_LABEL_MAX_RIGHT_X = 530;

/** Right-spoke labels start just outside the hex ring, left-aligned into the corridor. */
export const TELEMETRY_RADAR_RIGHT_LABEL_GAP = 16;

/** Warm amber tip for overflow (>100) vertices. */
export const TELEMETRY_RADAR_OVERFLOW_NODE = '#FDE047';

/** Laser HUD palette — single SSOT so grid / ring / dual-stroke cannot drift apart. */
export const TELEMETRY_RADAR_LASER = {
  grid: 'rgba(103, 232, 249, 0.55)',
  spoke: 'rgba(103, 232, 249, 0.5)',
  tickMajor: 'rgba(103, 232, 249, 0.6)',
  tickMinor: 'rgba(103, 232, 249, 0.45)',
  energyCore: 'rgba(103, 232, 249, 0.48)',
  energyEdge: 'rgba(6, 182, 212, 0.18)',
  neon: '#00E5FF',
  coreStroke: '#CFFAFE',
  nodeBound: '#00E5FF',
  nodeCore: '#FFFFFF',
  label: 'rgba(244, 244, 245, 0.96)',
} as const;

const OVERFLOW_STROKE = TELEMETRY_RADAR_LASER.coreStroke;
const RING_SCALES = [1, 0.66, 0.33] as const;
const LABEL_FONT = '"PingFang TC", "Noto Sans TC", "Helvetica Neue", sans-serif';
const VERTICAL_BAND_PX = 10;

export interface SelfieRadarLabelPaint {
  x: number;
  y: number;
  align: CanvasTextAlign;
  maxWidth?: number;
}

/**
 * Resolve selfie radar label anchor so EN long names never cross the corridor wall.
 * Top/bottom stay centered; right spokes left-align from the ring; left spokes right-align.
 */
export function resolveSelfieRadarLabelPaint(input: {
  cx: number;
  outerRadius: number;
  xLabel: number;
  yLabel: number;
}): SelfieRadarLabelPaint {
  const { cx, outerRadius, xLabel, yLabel } = input;
  const dx = xLabel - cx;
  if (Math.abs(dx) <= VERTICAL_BAND_PX) {
    return { x: xLabel, y: yLabel, align: 'center' };
  }
  if (dx > VERTICAL_BAND_PX) {
    const x = cx + outerRadius + TELEMETRY_RADAR_RIGHT_LABEL_GAP;
    return {
      x,
      y: yLabel,
      align: 'left',
      maxWidth: Math.max(1, TELEMETRY_RADAR_LABEL_MAX_RIGHT_X - x),
    };
  }
  return { x: xLabel, y: yLabel, align: 'right' };
}

function clearNeonShadow(ctx: TelemetryDrawContext): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
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

function paintAxisLabel(ctx: TelemetryDrawContext, text: string, paint: SelfieRadarLabelPaint): void {
  if (!text) return;
  // WHY: Lighter scrim leaves axis labels over brighter pixels — ink shadow prevents washout.
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = TELEMETRY_RADAR_LASER.label;
  ctx.textAlign = paint.align;
  ctx.textBaseline = 'middle';
  try {
    ctx.font = `20px ${LABEL_FONT}`;
    ctx.fillText(text, paint.x, paint.y, paint.maxWidth);
  } catch {
    try {
      ctx.font = '20px sans-serif';
      ctx.fillText(text, paint.x, paint.y, paint.maxWidth);
    } catch {
      /* plate still encodes */
    }
  }
  clearNeonShadow(ctx);
}

function paintTacticalRing(ctx: TelemetryDrawContext, cx: number, cy: number, radius: number): void {
  const laser = TELEMETRY_RADAR_LASER;
  ctx.save();
  ctx.strokeStyle = laser.grid;
  ctx.lineWidth = 1.35;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < 36; i += 1) {
    const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
    const major = i % 3 === 0;
    const inner = radius - (major ? 8 : 4);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.strokeStyle = major ? laser.tickMajor : laser.tickMinor;
    ctx.lineWidth = major ? 1.5 : 1;
    ctx.stroke();
  }

  const cross = 10;
  ctx.strokeStyle = laser.tickMajor;
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  ctx.moveTo(cx - cross, cy);
  ctx.lineTo(cx + cross, cy);
  ctx.moveTo(cx, cy - cross);
  ctx.lineTo(cx, cy + cross);
  ctx.stroke();
  ctx.restore();
}

export function paintHolographicRadar(
  ctx: TelemetryDrawContext,
  axes: readonly RadarGeometryPoint[]
): void {
  if (axes.length === 0) return;
  const layout = TELEMETRY_RADAR_LAYOUT;
  const laser = TELEMETRY_RADAR_LASER;
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

  paintTacticalRing(ctx, layout.cx, layout.cy, TELEMETRY_RADAR_TACTICAL_RING_RADIUS);

  for (const scale of RING_SCALES) {
    tracePolygon(ctx, scalePolygon(geometry.hexagon, layout.cx, layout.cy, scale));
    ctx.strokeStyle = laser.grid;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  for (const vertex of geometry.hexagon) {
    ctx.moveTo(layout.cx, layout.cy);
    ctx.lineTo(vertex.x, vertex.y);
  }
  ctx.strokeStyle = laser.spoke;
  ctx.lineWidth = 1.25;
  ctx.stroke();

  const energyFill = ctx.createRadialGradient(
    layout.cx,
    layout.cy,
    8,
    layout.cx,
    layout.cy,
    layout.outerRadius
  );
  energyFill.addColorStop(0, laser.energyCore);
  energyFill.addColorStop(1, laser.energyEdge);
  tracePolygon(ctx, geometry.scorePolygon);
  ctx.fillStyle = energyFill;
  ctx.fill();

  // Outer laser glow pass, then ice-white core stroke (path retained after fill).
  ctx.shadowColor = laser.neon;
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = laser.neon;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  clearNeonShadow(ctx);
  ctx.strokeStyle = laser.coreStroke;
  ctx.lineWidth = 1.5;
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
    const tipX = vertex.overflowing ? vertex.xOverflow : vertex.xBase;
    const tipY = vertex.overflowing ? vertex.yOverflow : vertex.yBase;
    const glow = vertex.overflowing ? TELEMETRY_RADAR_OVERFLOW_NODE : laser.nodeBound;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    clearNeonShadow(ctx);
    ctx.beginPath();
    ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
    ctx.fillStyle = laser.nodeCore;
    ctx.fill();
    paintAxisLabel(
      ctx,
      vertex.label,
      resolveSelfieRadarLabelPaint({
        cx: layout.cx,
        outerRadius: layout.outerRadius,
        xLabel: vertex.xLabel,
        yLabel: vertex.yLabel,
      })
    );
  }
  ctx.restore();
}
