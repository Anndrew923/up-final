/**
 * Precision Dyno Telemetry radar painter for the evolution share plate.
 *
 * WHY: Isolated from `evolutionCardComposer` plate chrome so the dual-radar
 * instrument layer can mirror on-screen `HexRadarChart` ritual optics
 * (violet dish, neon bloom via `lighter`, glowing gold baseline orbs) without mutating
 * `composeTelemetryCard` / HexRadarChart internals.
 *
 * Layout lock: callers pass fixed cx/cy/outerRadius from EVOLUTION_CARD_LAYOUT;
 * this module must never invent vertical bands that collide with spoke labels.
 *
 * Dash vocabulary: Baseline polygon + quiet dish orbit ring may dash;
 * the 100-score hex stays a solid etch (never a second orange dashed hex).
 */
import {
  computeSixAxisRadarVertices,
  type RadarGeometryPoint,
  type RadarPoint2D,
  type SixAxisRadarGeometry,
} from '../logic/core/radarGeometry';
import type { LogEvolutionAxisDelta } from '../logic/core/logEvolutionReport';
import type { SixAxisMetric } from '../types/scoring';
import { clearCanvasShadow, type TelemetryDrawContext } from './telemetryCardTypes';

const FONT_STACK = '"PingFang TC", "Noto Sans TC", "Helvetica Neue", sans-serif';

/**
 * Fill contracts — luminous holographic plate (indigo → sky → cyan).
 * WHY: Three-stop radial kills center black-hole while keeping gold baseline readable.
 */
export const EVOLUTION_RADAR_FILL = {
  currentCore: 'rgba(79, 70, 229, 0.28)',
  currentMid: 'rgba(56, 189, 248, 0.24)',
  currentRim: 'rgba(34, 211, 238, 0.42)',
  dishCore: 'rgba(88, 28, 135, 0.52)',
  dishMid: 'rgba(76, 29, 149, 0.34)',
  dishEdge: 'rgba(0, 0, 0, 0)',
} as const;

/**
 * Dish envelope vs hex outerRadius.
 * WHY: App ritual pool extends past hex vertices (~1.16×) but must stay under label band
 * (`radarRadius + radarLabelExtra` = 216 when radius = 184 → dish ≈ 213).
 */
export const EVOLUTION_RADAR_DISH_RADIUS_SCALE = 1.16 as const;

/** Violet track + bezel ticks sit between hex edge and dish fade. */
export const EVOLUTION_RADAR_ORBIT_RADIUS_SCALE = 1.1 as const;

/** Baseline history dash — matches legend `---` vocabulary. */
export const EVOLUTION_RADAR_BASELINE_DASH = [10, 7] as const;

/** Quiet violet orbit ring on the ritual dish (not the baseline polygon). */
export const EVOLUTION_RADAR_DISH_ORBIT_DASH = [4, 5] as const;

/** Bright violet dish track — must read clearly against the dark violet pool. */
export const EVOLUTION_RADAR_DISH_ORBIT_STROKE = 'rgba(192, 132, 252, 0.42)' as const;

/** High-saturation amber gold — shared by baseline polygon + plate legend swatch. */
export const EVOLUTION_RADAR_BASELINE_STROKE = '#FBBF24' as const;

/** Dashed baseline tube weight — App-scale warm gold history stroke. */
export const EVOLUTION_RADAR_BASELINE_LINE_WIDTH = 3.5 as const;

/** Solid 100-score etch — exported so tests lock “no dash” without magic strings. */
export const EVOLUTION_RADAR_WORLD_RECORD_STROKE = 'rgba(245, 158, 11, 0.28)' as const;

/**
 * High-voltage neon stack for the current polygon.
 * Drawn under `globalCompositeOperation = 'lighter'` for true optical bloom.
 */
export const EVOLUTION_RADAR_NEON = {
  bloom: '#06B6D4',
  bloomBlur: 24,
  bloomWidth: 6.5,
  main: '#22D3EE',
  mainWidth: 3.5,
  core: '#ECFEFF',
  coreWidth: 1.5,
  origin: '#22D3EE',
  originGlow: 'rgba(34, 211, 238, 0.85)',
  originGlowBlur: 18,
  originOuterR: 6.5,
  originInnerR: 2.4,
} as const;

/**
 * Baseline glowing golden orbs — three-layer App ritual markers.
 * Soft radial bloom → bright ring → warm white-gold core.
 */
export const EVOLUTION_RADAR_BASELINE_HALO = {
  glowRadius: 14,
  glowCore: 'rgba(251, 191, 36, 0.38)',
  glowEdge: 'rgba(251, 191, 36, 0)',
  ringRadius: 8.5,
  lineWidth: 2.4,
  /** Ring hue — SSOT with dashed baseline stroke. */
  stroke: EVOLUTION_RADAR_BASELINE_STROKE,
  coreRadius: 3.5,
  coreFill: '#FEF3C7',
  glow: '#F59E0B',
  glowBlur: 14,
} as const;

const RADAR = {
  grid: 'rgba(63, 63, 70, 0.28)',
  spoke: 'rgba(63, 63, 70, 0.18)',
  worldRecord: EVOLUTION_RADAR_WORLD_RECORD_STROKE,
  dishOrbit: EVOLUTION_RADAR_DISH_ORBIT_STROKE,
  bezelTick: 'rgba(167, 139, 250, 0.22)',
  bezelTickMajor: 'rgba(167, 139, 250, 0.38)',
  nodeHalo: 'rgba(34, 211, 238, 0.35)',
  ink: '#f4f4f5',
} as const;

const INNER_RING_SCALES = [0.66, 0.33] as const;

export interface EvolutionDualRadarPaintInput {
  baselineAxes: readonly RadarGeometryPoint[];
  currentAxes: readonly RadarGeometryPoint[];
  deltas: readonly LogEvolutionAxisDelta[];
  cx: number;
  cy: number;
  outerRadius: number;
  labelExtra: number;
  labelFontPx: number;
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

function scaleHex(
  hexagon: readonly RadarPoint2D[],
  cx: number,
  cy: number,
  scale: number
): RadarPoint2D[] {
  return hexagon.map((p) => ({
    x: cx + (p.x - cx) * scale,
    y: cy + (p.y - cy) * scale,
  }));
}

/**
 * Ritual circular dish — full-enveloping violet pool past hex vertices.
 * Dish ≤ outerRadius×1.16; orbit/ticks at ×1.10 — never reach label band (×1 + labelExtra).
 */
function paintRitualDish(
  ctx: TelemetryDrawContext,
  cx: number,
  cy: number,
  outerRadius: number
): void {
  const dishRadius = outerRadius * EVOLUTION_RADAR_DISH_RADIUS_SCALE;
  const orbitRadius = outerRadius * EVOLUTION_RADAR_ORBIT_RADIUS_SCALE;

  ctx.save();
  const dish = ctx.createRadialGradient(cx, cy, 4, cx, cy, dishRadius);
  dish.addColorStop(0, EVOLUTION_RADAR_FILL.dishCore);
  dish.addColorStop(0.55, EVOLUTION_RADAR_FILL.dishMid);
  dish.addColorStop(1, EVOLUTION_RADAR_FILL.dishEdge);
  ctx.beginPath();
  ctx.arc(cx, cy, dishRadius, 0, Math.PI * 2);
  ctx.fillStyle = dish;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
  ctx.strokeStyle = RADAR.dishOrbit;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([...EVOLUTION_RADAR_DISH_ORBIT_DASH]);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let deg = 0; deg < 360; deg += 6) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const outer = orbitRadius;
    const inner = orbitRadius - (isMajor ? 9 : 4.5);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    ctx.beginPath();
    ctx.moveTo(cx + cos * outer, cy + sin * outer);
    ctx.lineTo(cx + cos * inner, cy + sin * inner);
    ctx.strokeStyle = isMajor ? RADAR.bezelTickMajor : RADAR.bezelTick;
    ctx.lineWidth = isMajor ? 0.95 : 0.55;
    ctx.lineCap = 'butt';
    ctx.stroke();
  }
  ctx.restore();
}

function paintGridAndSpokes(
  ctx: TelemetryDrawContext,
  geo: SixAxisRadarGeometry,
  cx: number,
  cy: number
): void {
  ctx.setLineDash([]);
  for (const scale of INNER_RING_SCALES) {
    tracePolygon(ctx, scaleHex(geo.hexagon, cx, cy, scale));
    ctx.strokeStyle = RADAR.grid;
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }

  // WHY: Solid fine 100-ring — never a second orange dashed hex competing with Baseline.
  tracePolygon(ctx, geo.hexagon);
  ctx.strokeStyle = RADAR.worldRecord;
  ctx.lineWidth = 1.05;
  ctx.stroke();

  for (const vertex of geo.hexagon) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(vertex.x, vertex.y);
    ctx.strokeStyle = RADAR.spoke;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
}

function paintBaselineStroke(
  ctx: TelemetryDrawContext,
  geo: SixAxisRadarGeometry
): void {
  // WHY: Thick warm amber dashed history — must punch through holographic cyan glass.
  tracePolygon(ctx, geo.scorePolygon);
  ctx.shadowColor = EVOLUTION_RADAR_BASELINE_HALO.glow;
  ctx.shadowBlur = EVOLUTION_RADAR_BASELINE_HALO.glowBlur;
  ctx.strokeStyle = EVOLUTION_RADAR_BASELINE_STROKE;
  ctx.lineWidth = EVOLUTION_RADAR_BASELINE_LINE_WIDTH;
  ctx.setLineDash([...EVOLUTION_RADAR_BASELINE_DASH]);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.setLineDash([]);
  clearCanvasShadow(ctx);
}

/**
 * Three-layer glowing golden orbs — painted after neon so `lighter` cannot wash them out.
 */
function paintBaselineOrbs(
  ctx: TelemetryDrawContext,
  geo: SixAxisRadarGeometry
): void {
  for (const vertex of geo.vertices) {
    const { xBase: x, yBase: y } = vertex;
    const glow = ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      EVOLUTION_RADAR_BASELINE_HALO.glowRadius
    );
    glow.addColorStop(0, EVOLUTION_RADAR_BASELINE_HALO.glowCore);
    glow.addColorStop(1, EVOLUTION_RADAR_BASELINE_HALO.glowEdge);
    ctx.beginPath();
    ctx.arc(x, y, EVOLUTION_RADAR_BASELINE_HALO.glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, EVOLUTION_RADAR_BASELINE_HALO.ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = EVOLUTION_RADAR_BASELINE_HALO.stroke;
    ctx.lineWidth = EVOLUTION_RADAR_BASELINE_HALO.lineWidth;
    ctx.shadowColor = EVOLUTION_RADAR_BASELINE_HALO.glow;
    ctx.shadowBlur = EVOLUTION_RADAR_BASELINE_HALO.glowBlur;
    ctx.stroke();
    clearCanvasShadow(ctx);

    ctx.beginPath();
    ctx.arc(x, y, EVOLUTION_RADAR_BASELINE_HALO.coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = EVOLUTION_RADAR_BASELINE_HALO.coreFill;
    ctx.fill();
  }
}

/**
 * Indigo→cyan volumetric fill only (normal composite).
 * WHY: Separated from neon so baseline gold can paint above the glass and still punch through.
 */
function paintCurrentFill(
  ctx: TelemetryDrawContext,
  geo: SixAxisRadarGeometry,
  cx: number,
  cy: number,
  outerRadius: number
): void {
  tracePolygon(ctx, geo.scorePolygon);
  const fill = ctx.createRadialGradient(cx, cy, 8, cx, cy, outerRadius * 0.95);
  fill.addColorStop(0, EVOLUTION_RADAR_FILL.currentCore);
  fill.addColorStop(0.5, EVOLUTION_RADAR_FILL.currentMid);
  fill.addColorStop(1, EVOLUTION_RADAR_FILL.currentRim);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * Additive neon tube stack — after baseline dash, before gold orbs.
 * WHY: `lighter` approximates SVG feDropShadow; orbs must paint afterward so bloom
 * cannot wash App-scale golden highlights.
 */
function paintCurrentNeonStroke(
  ctx: TelemetryDrawContext,
  geo: SixAxisRadarGeometry
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Pass 1 — wide high-voltage bloom (#06B6D4).
  tracePolygon(ctx, geo.scorePolygon);
  ctx.shadowColor = EVOLUTION_RADAR_NEON.bloom;
  ctx.shadowBlur = EVOLUTION_RADAR_NEON.bloomBlur;
  ctx.strokeStyle = EVOLUTION_RADAR_NEON.bloom;
  ctx.lineWidth = EVOLUTION_RADAR_NEON.bloomWidth;
  ctx.stroke();
  clearCanvasShadow(ctx);

  // Pass 2 — bright cyan main tube (#22D3EE).
  tracePolygon(ctx, geo.scorePolygon);
  ctx.strokeStyle = EVOLUTION_RADAR_NEON.main;
  ctx.lineWidth = EVOLUTION_RADAR_NEON.mainWidth;
  ctx.stroke();

  // Pass 3 — white-cyan laser core (#ECFEFF).
  tracePolygon(ctx, geo.scorePolygon);
  ctx.strokeStyle = EVOLUTION_RADAR_NEON.core;
  ctx.lineWidth = EVOLUTION_RADAR_NEON.coreWidth;
  ctx.stroke();

  ctx.restore();
}

/** Exported for contract tests — PR / ≥100 vertices use champagne halo. */
export function resolveEvolutionVertexHighlight(
  axis: SixAxisMetric | string,
  raw: number,
  deltas: readonly LogEvolutionAxisDelta[]
): boolean {
  if (raw >= 100) return true;
  return deltas.some((row) => row.axis === axis && row.isPersonalBest);
}

function paintVertexNodes(
  ctx: TelemetryDrawContext,
  geo: SixAxisRadarGeometry,
  deltas: readonly LogEvolutionAxisDelta[]
): void {
  for (const vertex of geo.vertices) {
    const isHighlight = resolveEvolutionVertexHighlight(vertex.key, vertex.raw, deltas);
    const halo = isHighlight ? EVOLUTION_RADAR_BASELINE_HALO.glow : RADAR.nodeHalo;
    const core = isHighlight ? EVOLUTION_RADAR_BASELINE_STROKE : EVOLUTION_RADAR_NEON.main;

    ctx.beginPath();
    ctx.arc(vertex.xBase, vertex.yBase, 6.5, 0, Math.PI * 2);
    ctx.strokeStyle = halo;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(vertex.xBase, vertex.yBase, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();
  }
}

function paintOriginCore(ctx: TelemetryDrawContext, cx: number, cy: number): void {
  // WHY: Dual-layer cyan reactor origin — soft outer bloom + bright solid core.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  ctx.beginPath();
  ctx.arc(cx, cy, EVOLUTION_RADAR_NEON.originOuterR, 0, Math.PI * 2);
  ctx.shadowColor = EVOLUTION_RADAR_NEON.originGlow;
  ctx.shadowBlur = EVOLUTION_RADAR_NEON.originGlowBlur;
  ctx.fillStyle = EVOLUTION_RADAR_NEON.origin;
  ctx.fill();
  clearCanvasShadow(ctx);

  ctx.beginPath();
  ctx.arc(cx, cy, EVOLUTION_RADAR_NEON.originInnerR, 0, Math.PI * 2);
  ctx.fillStyle = EVOLUTION_RADAR_NEON.core;
  ctx.fill();

  ctx.restore();
}

function paintSpokeLabels(
  ctx: TelemetryDrawContext,
  geo: SixAxisRadarGeometry,
  labelFontPx: number
): void {
  ctx.fillStyle = RADAR.ink;
  ctx.font = `${labelFontPx}px ${FONT_STACK}`;
  ctx.textBaseline = 'middle';
  for (const vertex of geo.vertices) {
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

/**
 * Paint the precision dual-radar instrument into a logical-coordinate canvas.
 */
export function paintEvolutionDualRadar(
  ctx: TelemetryDrawContext,
  input: EvolutionDualRadarPaintInput
): void {
  const { cx, cy, outerRadius, labelExtra, labelFontPx } = input;
  const labelRadius = outerRadius + labelExtra;
  if (input.currentAxes.length === 0 && input.baselineAxes.length === 0) return;

  const currentGeo =
    input.currentAxes.length > 0
      ? computeSixAxisRadarVertices({
          points: input.currentAxes,
          cx,
          cy,
          outerRadius,
          labelRadius,
        })
      : null;
  const baselineGeo =
    input.baselineAxes.length > 0
      ? computeSixAxisRadarVertices({
          points: input.baselineAxes,
          cx,
          cy,
          outerRadius,
          labelRadius,
        })
      : null;
  const gridGeo = currentGeo ?? baselineGeo;
  if (!gridGeo) return;

  paintRitualDish(ctx, cx, cy, outerRadius);
  paintGridAndSpokes(ctx, gridGeo, cx, cy);

  // Stack (bottom→top): glass → baseline dash → neon tube → gold orbs → nodes/labels → origin.
  // WHY: Rich holographic fill would mute gold dash if drawn first; orbs must sit above
  // `lighter` neon or additive bloom washes the App-scale golden highlights.
  if (currentGeo) {
    paintCurrentFill(ctx, currentGeo, cx, cy, outerRadius);
  }
  if (baselineGeo) {
    paintBaselineStroke(ctx, baselineGeo);
  }
  if (currentGeo) {
    paintCurrentNeonStroke(ctx, currentGeo);
  }
  if (baselineGeo) {
    paintBaselineOrbs(ctx, baselineGeo);
  }
  if (currentGeo) {
    paintVertexNodes(ctx, currentGeo, input.deltas);
    paintSpokeLabels(ctx, currentGeo, labelFontPx);
  }

  paintOriginCore(ctx, cx, cy);
}
