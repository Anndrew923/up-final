import { describe, expect, it } from 'vitest';
import { EVOLUTION_CARD_LAYOUT } from '../evolutionCardComposer';
import {
  EVOLUTION_RADAR_BASELINE_DASH,
  EVOLUTION_RADAR_BASELINE_HALO,
  EVOLUTION_RADAR_BASELINE_LINE_WIDTH,
  EVOLUTION_RADAR_BASELINE_STROKE,
  EVOLUTION_RADAR_DISH_ORBIT_DASH,
  EVOLUTION_RADAR_DISH_ORBIT_STROKE,
  EVOLUTION_RADAR_DISH_RADIUS_SCALE,
  EVOLUTION_RADAR_FILL,
  EVOLUTION_RADAR_NEON,
  EVOLUTION_RADAR_ORBIT_RADIUS_SCALE,
  EVOLUTION_RADAR_WORLD_RECORD_STROKE,
  paintEvolutionDualRadar,
  resolveEvolutionVertexHighlight,
} from '../evolutionRadarPainter';
import type { TelemetryDrawContext, TelemetryGradient } from '../telemetryCardTypes';

function recordingContext(): TelemetryDrawContext & {
  strokeStyles: string[];
  fillStyles: string[];
  dashCalls: number[][];
  colorStops: Array<{ offset: number; color: string }>;
  compositeOps: GlobalCompositeOperation[];
  paintOrder: string[];
  radialCount: number;
  arcCount: number;
  maxShadowBlur: number;
} {
  const strokeStyles: string[] = [];
  const fillStyles: string[] = [];
  const dashCalls: number[][] = [];
  const colorStops: Array<{ offset: number; color: string }> = [];
  const compositeOps: GlobalCompositeOperation[] = [];
  const paintOrder: string[] = [];
  let radialCount = 0;
  let arcCount = 0;
  let maxShadowBlur = 0;
  let strokeStyleValue: string | TelemetryGradient = '#000';
  let fillStyleValue: string | TelemetryGradient = '#000';
  let compositeOp: GlobalCompositeOperation = 'source-over';
  let shadowBlurValue = 0;
  const makeGradient = (): TelemetryGradient => ({
    addColorStop: (offset: number, color: string) => {
      colorStops.push({ offset, color });
    },
  });
  const ctx = {
    strokeStyles,
    fillStyles,
    dashCalls,
    colorStops,
    compositeOps,
    paintOrder,
    get radialCount() {
      return radialCount;
    },
    get arcCount() {
      return arcCount;
    },
    get maxShadowBlur() {
      return maxShadowBlur;
    },
    get fillStyle() {
      return fillStyleValue as string;
    },
    set fillStyle(value: string | TelemetryGradient) {
      fillStyleValue = value;
    },
    get strokeStyle() {
      return strokeStyleValue as string;
    },
    set strokeStyle(value: string | TelemetryGradient) {
      strokeStyleValue = value;
    },
    get globalCompositeOperation() {
      return compositeOp;
    },
    set globalCompositeOperation(value: GlobalCompositeOperation) {
      compositeOp = value;
      compositeOps.push(value);
    },
    lineWidth: 1,
    lineJoin: 'round' as CanvasLineJoin,
    lineCap: 'round' as CanvasLineCap,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'middle' as CanvasTextBaseline,
    globalAlpha: 1,
    shadowColor: 'transparent',
    get shadowBlur() {
      return shadowBlurValue;
    },
    set shadowBlur(value: number) {
      shadowBlurValue = value;
      if (value > maxShadowBlur) maxShadowBlur = value;
    },
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high' as ImageSmoothingQuality,
    save: () => undefined,
    restore: () => undefined,
    beginPath: () => undefined,
    closePath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    arc: () => {
      arcCount += 1;
    },
    fill: () => {
      const token =
        typeof fillStyleValue === 'string' ? fillStyleValue : 'gradient';
      fillStyles.push(token);
      paintOrder.push(`fill:${token}`);
    },
    stroke: () => {
      const token =
        typeof strokeStyleValue === 'string' ? strokeStyleValue : 'gradient';
      strokeStyles.push(token);
      paintOrder.push(`stroke:${token}`);
    },
    fillRect: () => undefined,
    strokeRect: () => undefined,
    fillText: () => undefined,
    measureText: (text: string) => ({ width: text.length * 8 }),
    clip: () => undefined,
    rect: () => undefined,
    scale: () => undefined,
    drawImage: () => undefined,
    createLinearGradient: () => makeGradient(),
    createRadialGradient: () => {
      radialCount += 1;
      return makeGradient();
    },
    setLineDash: (segments: number[]) => {
      dashCalls.push([...segments]);
    },
  };
  return ctx;
}

const axes = [
  { key: 'strength', label: 'STR', value: 110 },
  { key: 'explosivePower', label: 'PWR', value: 78 },
  { key: 'cardio', label: 'END', value: 80 },
  { key: 'muscleMass', label: 'Skeletal Muscle', value: 82 },
  { key: 'bodyFat', label: 'FFMI', value: 84 },
  { key: 'gripStrength', label: 'GRP', value: 71 },
] as const;

describe('resolveEvolutionVertexHighlight', () => {
  it('lights champagne for PR axes and raw ≥ 100', () => {
    expect(
      resolveEvolutionVertexHighlight('strength', 85, [
        {
          axis: 'strength',
          from: 50,
          to: 85,
          delta: 35,
          isPersonalBest: true,
        },
      ])
    ).toBe(true);
    expect(resolveEvolutionVertexHighlight('cardio', 100, [])).toBe(true);
    expect(resolveEvolutionVertexHighlight('cardio', 99, [])).toBe(false);
  });
});

describe('EVOLUTION_RADAR_FILL / neon contracts', () => {
  it('locks holographic fill, enveloping violet dish, and glowing gold orbs', () => {
    expect(EVOLUTION_RADAR_FILL.currentCore).toBe('rgba(79, 70, 229, 0.28)');
    expect(EVOLUTION_RADAR_FILL.currentMid).toBe('rgba(56, 189, 248, 0.24)');
    expect(EVOLUTION_RADAR_FILL.currentRim).toBe('rgba(34, 211, 238, 0.42)');
    expect(EVOLUTION_RADAR_FILL.dishCore).toBe('rgba(88, 28, 135, 0.52)');
    expect(EVOLUTION_RADAR_FILL.dishMid).toBe('rgba(76, 29, 149, 0.34)');
    expect(EVOLUTION_RADAR_DISH_RADIUS_SCALE).toBe(1.16);
    expect(EVOLUTION_RADAR_ORBIT_RADIUS_SCALE).toBe(1.1);
    expect(EVOLUTION_RADAR_DISH_ORBIT_STROKE).toBe('rgba(192, 132, 252, 0.42)');
    expect(EVOLUTION_RADAR_NEON.bloom).toBe('#06B6D4');
    expect(EVOLUTION_RADAR_NEON.bloomBlur).toBe(24);
    expect(EVOLUTION_RADAR_NEON.main).toBe('#22D3EE');
    expect(EVOLUTION_RADAR_NEON.mainWidth).toBe(3.5);
    expect(EVOLUTION_RADAR_NEON.core).toBe('#ECFEFF');
    expect(EVOLUTION_RADAR_NEON.coreWidth).toBe(1.5);
    expect(EVOLUTION_RADAR_NEON.originGlowBlur).toBe(18);
    expect(EVOLUTION_RADAR_BASELINE_STROKE).toBe('#FBBF24');
    expect(EVOLUTION_RADAR_BASELINE_LINE_WIDTH).toBe(3.5);
    expect(EVOLUTION_RADAR_BASELINE_DASH).toEqual([10, 7]);
    expect(EVOLUTION_RADAR_BASELINE_HALO.glowRadius).toBe(14);
    expect(EVOLUTION_RADAR_BASELINE_HALO.glowCore).toBe('rgba(251, 191, 36, 0.38)');
    expect(EVOLUTION_RADAR_BASELINE_HALO.ringRadius).toBe(8.5);
    expect(EVOLUTION_RADAR_BASELINE_HALO.lineWidth).toBe(2.4);
    expect(EVOLUTION_RADAR_BASELINE_HALO.coreRadius).toBe(3.5);
    expect(EVOLUTION_RADAR_BASELINE_HALO.coreFill).toBe('#FEF3C7');
    expect(EVOLUTION_RADAR_BASELINE_HALO.stroke).toBe(EVOLUTION_RADAR_BASELINE_STROKE);
    expect(EVOLUTION_RADAR_BASELINE_HALO.glow).toBe('#F59E0B');
    expect(EVOLUTION_RADAR_BASELINE_HALO.glowBlur).toBe(14);
  });
});

describe('paintEvolutionDualRadar', () => {
  it('paints ritual dish, gold orbs above lighter neon, and origin core', () => {
    const ctx = recordingContext();
    paintEvolutionDualRadar(ctx, {
      baselineAxes: axes.map((row) => ({ ...row, value: row.value - 20 })),
      currentAxes: [...axes],
      deltas: [
        {
          axis: 'strength',
          from: 90,
          to: 110,
          delta: 20,
          isPersonalBest: true,
        },
      ],
      cx: EVOLUTION_CARD_LAYOUT.radarCx,
      cy: EVOLUTION_CARD_LAYOUT.radarCy,
      outerRadius: EVOLUTION_CARD_LAYOUT.radarRadius,
      labelExtra: EVOLUTION_CARD_LAYOUT.radarLabelExtra,
      labelFontPx: EVOLUTION_CARD_LAYOUT.radarLabelFontPx,
    });

    // Dish radial + current 3-stop fill (+ orb glows after baseline).
    expect(ctx.radialCount).toBeGreaterThanOrEqual(2);
    const stops = ctx.colorStops.map((stop) => stop.color);
    expect(stops.slice(0, 6)).toEqual([
      EVOLUTION_RADAR_FILL.dishCore,
      EVOLUTION_RADAR_FILL.dishMid,
      EVOLUTION_RADAR_FILL.dishEdge,
      EVOLUTION_RADAR_FILL.currentCore,
      EVOLUTION_RADAR_FILL.currentMid,
      EVOLUTION_RADAR_FILL.currentRim,
    ]);
    expect(stops).toContain(EVOLUTION_RADAR_BASELINE_HALO.glowCore);

    // Solid 100-ring; dashed vocabulary = dish orbit + baseline only.
    expect(ctx.strokeStyles).toContain(EVOLUTION_RADAR_WORLD_RECORD_STROKE);
    expect(ctx.dashCalls.some((dash) => dash[0] === 5 && dash[1] === 5)).toBe(false);
    const nonEmptyDashes = ctx.dashCalls.filter((dash) => dash.length > 0);
    expect(nonEmptyDashes).toContainEqual([...EVOLUTION_RADAR_DISH_ORBIT_DASH]);
    expect(nonEmptyDashes).toContainEqual([...EVOLUTION_RADAR_BASELINE_DASH]);

    expect(ctx.strokeStyles).toContain(EVOLUTION_RADAR_DISH_ORBIT_STROKE);
    expect(ctx.strokeStyles).toContain(EVOLUTION_RADAR_BASELINE_STROKE);
    expect(ctx.strokeStyles).toContain(EVOLUTION_RADAR_NEON.bloom);
    expect(ctx.strokeStyles).toContain(EVOLUTION_RADAR_NEON.main);
    expect(ctx.strokeStyles).toContain(EVOLUTION_RADAR_NEON.core);

    // Layer lock: glass → baseline dash → neon → gold orbs (orbs above additive bloom).
    const glassFillIdxs = ctx.paintOrder
      .map((token, index) => (token === 'fill:gradient' ? index : -1))
      .filter((index) => index >= 0);
    const currentGlassIdx = glassFillIdxs[1];
    const baselineIdx = ctx.paintOrder.indexOf(
      `stroke:${EVOLUTION_RADAR_BASELINE_STROKE}`
    );
    const neonBloomIdx = ctx.paintOrder.indexOf(
      `stroke:${EVOLUTION_RADAR_NEON.bloom}`
    );
    const orbCoreIdx = ctx.paintOrder.indexOf(
      `fill:${EVOLUTION_RADAR_BASELINE_HALO.coreFill}`
    );
    expect(currentGlassIdx).toBeDefined();
    expect(baselineIdx).toBeGreaterThan(currentGlassIdx!);
    expect(neonBloomIdx).toBeGreaterThan(baselineIdx);
    expect(orbCoreIdx).toBeGreaterThan(neonBloomIdx);

    // Additive neon bloom for current tube + origin reactor.
    expect(ctx.compositeOps).toContain('lighter');
    expect(ctx.maxShadowBlur).toBeGreaterThanOrEqual(EVOLUTION_RADAR_NEON.bloomBlur);

    // Baseline gold orbs (6) + current nodes + origin + dish arcs.
    expect(ctx.arcCount).toBeGreaterThanOrEqual(20);
    expect(ctx.fillStyles).toContain(EVOLUTION_RADAR_NEON.origin);
    expect(ctx.fillStyles).toContain(EVOLUTION_RADAR_NEON.core);
    expect(ctx.fillStyles).toContain(EVOLUTION_RADAR_BASELINE_STROKE);
    expect(ctx.fillStyles).toContain(EVOLUTION_RADAR_BASELINE_HALO.coreFill);
    expect(ctx.strokeStyles).toContain(EVOLUTION_RADAR_BASELINE_HALO.stroke);
  });

  it('keeps enveloping dish under label band (≤1.16× radius, < label radius)', () => {
    const radii: number[] = [];
    const ctx = recordingContext();
    const originalArc = ctx.arc.bind(ctx);
    ctx.arc = (x: number, y: number, radius: number, start: number, end: number) => {
      if (
        Math.abs(x - EVOLUTION_CARD_LAYOUT.radarCx) < 0.01 &&
        Math.abs(y - EVOLUTION_CARD_LAYOUT.radarCy) < 0.01
      ) {
        radii.push(radius);
      }
      return originalArc(x, y, radius, start, end);
    };

    paintEvolutionDualRadar(ctx, {
      baselineAxes: [],
      currentAxes: [...axes],
      deltas: [],
      cx: EVOLUTION_CARD_LAYOUT.radarCx,
      cy: EVOLUTION_CARD_LAYOUT.radarCy,
      outerRadius: EVOLUTION_CARD_LAYOUT.radarRadius,
      labelExtra: EVOLUTION_CARD_LAYOUT.radarLabelExtra,
      labelFontPx: EVOLUTION_CARD_LAYOUT.radarLabelFontPx,
    });

    const dishCap =
      EVOLUTION_CARD_LAYOUT.radarRadius * EVOLUTION_RADAR_DISH_RADIUS_SCALE;
    const labelBand =
      EVOLUTION_CARD_LAYOUT.radarRadius + EVOLUTION_CARD_LAYOUT.radarLabelExtra;
    expect(radii.length).toBeGreaterThan(0);
    expect(Math.max(...radii)).toBeLessThanOrEqual(dishCap);
    expect(Math.max(...radii)).toBeLessThan(labelBand);
    expect(radii).toContain(
      EVOLUTION_CARD_LAYOUT.radarRadius * EVOLUTION_RADAR_ORBIT_RADIUS_SCALE
    );
    // Current-only: dish orbit may dash; baseline [10,7] must be absent.
    expect(
      ctx.dashCalls.some(
        (dash) =>
          dash[0] === EVOLUTION_RADAR_BASELINE_DASH[0] &&
          dash[1] === EVOLUTION_RADAR_BASELINE_DASH[1]
      )
    ).toBe(false);
    expect(ctx.fillStyles).toContain(EVOLUTION_RADAR_NEON.origin);
    expect(ctx.compositeOps).toContain('lighter');
  });
});
