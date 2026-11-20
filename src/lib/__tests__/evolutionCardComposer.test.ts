import { describe, expect, it, vi } from 'vitest';
import {
  composeEvolutionCard,
  EVOLUTION_CARD_EXPORT_SCALE,
  EVOLUTION_CARD_LAYOUT,
  EVOLUTION_CARD_LOGIC_HEIGHT,
  EVOLUTION_CARD_LOGIC_WIDTH,
  EVOLUTION_CARD_PIXEL_HEIGHT,
  EVOLUTION_CARD_PIXEL_WIDTH,
  paintEvolutionCard,
  resolveEvolutionCardSize,
  resolveEvolutionLegendAnchors,
  resolveEvolutionLegendClearancePx,
  resolveEvolutionRadarBottomLabelY,
  resolveEvolutionScoreDeltaClearancePx,
  type EvolutionCardComposeInput,
} from '../evolutionCardComposer';
import { EVOLUTION_RADAR_BASELINE_STROKE } from '../evolutionRadarPainter';
import type { TelemetryCanvasSurface, TelemetryDrawContext } from '../telemetryCardTypes';

function baseInput(
  overrides: Partial<EvolutionCardComposeInput> = {}
): EvolutionCardComposeInput {
  return {
    mode: 'comparing',
    baselineOverall: 60,
    currentOverall: 80,
    overallDelta: 20,
    baselineAxes: [
      { key: 'strength', label: 'STR', value: 50 },
      { key: 'explosivePower', label: 'PWR', value: 55 },
      { key: 'cardio', label: 'END', value: 60 },
      { key: 'muscleMass', label: 'Skeletal Muscle', value: 65 },
      { key: 'bodyFat', label: 'FFMI', value: 70 },
      { key: 'gripStrength', label: 'GRP', value: 60 },
    ],
    currentAxes: [
      { key: 'strength', label: 'STR', value: 85 },
      { key: 'explosivePower', label: 'PWR', value: 78 },
      { key: 'cardio', label: 'END', value: 80 },
      { key: 'muscleMass', label: 'Skeletal Muscle', value: 82 },
      { key: 'bodyFat', label: 'FFMI', value: 84 },
      { key: 'gripStrength', label: 'GRP', value: 71 },
    ],
    deltas: [
      {
        axis: 'strength',
        from: 50,
        to: 85,
        delta: 35,
        isPersonalBest: true,
      },
    ],
    copy: {
      brandHeader: 'ULTIMATE PHYSIQUE // EVOLUTION LOG',
      dateRange: 'DAY 1 (2026.01.01) → NOW (2026.03.01)',
      overallLabel: 'OVERALL POWER',
      baselineLocked: 'DAY 1 BASELINE LOCKED',
      prBadge: 'PR',
      emptyScore: '—',
      legendBaseline: 'Baseline (2026.01.01)',
      legendCurrent: 'Current (2026.03.01)',
      axisLabels: {
        strength: 'STR',
        explosivePower: 'PWR',
        cardio: 'END',
        muscleMass: 'Skeletal Muscle',
        bodyFat: 'FFMI',
        gripStrength: 'GRP',
      },
    },
    ...overrides,
  };
}

function recordingContext(): TelemetryDrawContext & {
  texts: string[];
  textPositions: Array<{
    text: string;
    x: number;
    y: number;
    maxWidth?: number;
    fillStyle: string;
  }>;
  scales: Array<{ x: number; y: number }>;
  radialCount: number;
} {
  const texts: string[] = [];
  const textPositions: Array<{
    text: string;
    x: number;
    y: number;
    maxWidth?: number;
    fillStyle: string;
  }> = [];
  const scales: Array<{ x: number; y: number }> = [];
  let radialCount = 0;
  const gradient = { addColorStop: () => undefined };
  const ctx = {
    texts,
    textPositions,
    scales,
    get radialCount() {
      return radialCount;
    },
    fillStyle: '#000' as string | CanvasGradient,
    strokeStyle: '#000' as string | CanvasGradient,
    lineWidth: 1,
    lineJoin: 'round' as CanvasLineJoin,
    lineCap: 'round' as CanvasLineCap,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'middle' as CanvasTextBaseline,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
    shadowColor: 'transparent',
    shadowBlur: 0,
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
    arc: () => undefined,
    fill: () => undefined,
    stroke: () => undefined,
    fillRect: () => undefined,
    strokeRect: () => undefined,
    fillText: (text: string, x: number, y: number, maxWidth?: number) => {
      texts.push(text);
      textPositions.push({
        text,
        x,
        y,
        maxWidth,
        fillStyle: typeof ctx.fillStyle === 'string' ? ctx.fillStyle : 'gradient',
      });
    },
    measureText: (text: string) => ({ width: text.length * 8 }),
    clip: () => undefined,
    rect: () => undefined,
    scale: (x: number, y: number) => {
      scales.push({ x, y });
    },
    drawImage: () => undefined,
    createLinearGradient: () => gradient,
    createRadialGradient: () => {
      radialCount += 1;
      return gradient;
    },
    setLineDash: () => undefined,
  };
  return ctx;
}

describe('resolveEvolutionCardSize', () => {
  it('locks 4:5 logical plate and 2× retina export pixels', () => {
    const size = resolveEvolutionCardSize();
    expect(size).toEqual({
      width: EVOLUTION_CARD_LOGIC_WIDTH,
      height: EVOLUTION_CARD_LOGIC_HEIGHT,
      exportScale: EVOLUTION_CARD_EXPORT_SCALE,
      pixelWidth: EVOLUTION_CARD_PIXEL_WIDTH,
      pixelHeight: EVOLUTION_CARD_PIXEL_HEIGHT,
    });
    expect(size.width / size.height).toBeCloseTo(4 / 5, 5);
    expect(size.pixelWidth).toBe(2160);
    expect(size.pixelHeight).toBe(2700);
  });
});

describe('EVOLUTION_CARD_LAYOUT anti-overlap contracts', () => {
  it('keeps ≥36px clear air under the bottom spoke label before the legend band', () => {
    expect(resolveEvolutionLegendClearancePx()).toBeGreaterThanOrEqual(36);
    expect(resolveEvolutionRadarBottomLabelY()).toBe(
      EVOLUTION_CARD_LAYOUT.radarCy +
        EVOLUTION_CARD_LAYOUT.radarRadius +
        EVOLUTION_CARD_LAYOUT.radarLabelExtra
    );
  });

  it('anchors EN Baseline / Current with ≥48px center gap and maxWidth clamps', () => {
    const anchors = resolveEvolutionLegendAnchors();
    expect(anchors.centerGap).toBeGreaterThanOrEqual(48);
    expect(anchors.rightTextLeftX - anchors.leftTextRightX).toBe(anchors.centerGap);
    expect(anchors.maxTextWidth).toBe(EVOLUTION_CARD_LAYOUT.legendMaxTextWidth);
    expect(anchors.fontPx).toBeGreaterThanOrEqual(22);
    expect(anchors.fontPx).toBeLessThanOrEqual(24);
  });

  it('keeps ≥32px air from legend to OVERALL POWER and ≥12px score → delta optical gap', () => {
    const legendBottom =
      EVOLUTION_CARD_LAYOUT.legendY + EVOLUTION_CARD_LAYOUT.legendFontPx * 0.55;
    expect(EVOLUTION_CARD_LAYOUT.overallLabelY - legendBottom).toBeGreaterThanOrEqual(32);
    expect(resolveEvolutionScoreDeltaClearancePx()).toBeGreaterThanOrEqual(12);
  });

  it('keeps compact axis grid above the frame floor', () => {
    const rows = 3;
    const bottom =
      EVOLUTION_CARD_LAYOUT.axisGridStartY +
      rows * EVOLUTION_CARD_LAYOUT.axisCardH +
      (rows - 1) * EVOLUTION_CARD_LAYOUT.axisGapY;
    expect(bottom).toBeLessThan(
      EVOLUTION_CARD_LOGIC_HEIGHT - EVOLUTION_CARD_LAYOUT.frameInset - 24
    );
    expect(EVOLUTION_CARD_LAYOUT.axisCardH).toBeLessThanOrEqual(82);
    expect(EVOLUTION_CARD_LAYOUT.axisGapY).toBeLessThanOrEqual(10);
  });
});

describe('paintEvolutionCard', () => {
  it('renders brand, EN legend, champagne current score, warm radial, and PR badge', () => {
    const ctx = recordingContext();
    paintEvolutionCard(ctx, baseInput());
    expect(ctx.texts).toContain('ULTIMATE PHYSIQUE // EVOLUTION LOG');
    expect(ctx.texts).toContain('DAY 1 (2026.01.01) → NOW (2026.03.01)');
    expect(ctx.texts).toContain('Baseline (2026.01.01)');
    expect(ctx.texts).toContain('Current (2026.03.01)');
    expect(ctx.texts).toContain('Skeletal Muscle');
    expect(ctx.texts).toContain('60.00');
    expect(ctx.texts).toContain('80.00');
    expect(ctx.texts).toContain('+20.00');
    expect(ctx.texts).toContain('PR');
    expect(ctx.radialCount).toBeGreaterThanOrEqual(1);

    const anchors = resolveEvolutionLegendAnchors();
    const baseline = ctx.textPositions.find((row) => row.text === 'Baseline (2026.01.01)');
    const current = ctx.textPositions.find((row) => row.text === 'Current (2026.03.01)');
    expect(baseline?.y).toBe(anchors.legendY);
    expect(current?.y).toBe(anchors.legendY);
    expect(baseline?.x).toBe(anchors.leftTextRightX);
    expect(current?.x).toBeGreaterThanOrEqual(anchors.rightTextLeftX);
    expect(baseline?.maxWidth).toBe(anchors.maxTextWidth);
    expect(current?.maxWidth).toBe(anchors.maxTextWidth);

    const muscle = ctx.textPositions.filter((row) => row.text === 'Skeletal Muscle');
    expect(muscle.length).toBeGreaterThan(0);
    const muscleBottom =
      Math.min(...muscle.map((row) => row.y)) + EVOLUTION_CARD_LAYOUT.radarLabelFontPx * 0.55;
    const legendTop = anchors.legendY - EVOLUTION_CARD_LAYOUT.legendFontPx * 0.55;
    expect(legendTop - muscleBottom).toBeGreaterThanOrEqual(36);

    const baselineScore = ctx.textPositions.find((row) => row.text === '60.00');
    const currentScore = ctx.textPositions.find((row) => row.text === '80.00');
    expect(baselineScore?.fillStyle).toBe('rgba(212, 212, 216, 0.88)');
    expect(currentScore?.fillStyle).toBe(EVOLUTION_RADAR_BASELINE_STROKE);
    expect(ctx.textPositions.find((row) => row.text === '+20.00')?.fillStyle).toBe('#4ade80');
  });

  it('shows zh legend without colliding the bottom spoke band', () => {
    const ctx = recordingContext();
    paintEvolutionCard(
      ctx,
      baseInput({
        currentAxes: baseInput().currentAxes.map((axis) =>
          axis.key === 'muscleMass' ? { ...axis, label: '骨骼肌量' } : axis
        ),
        copy: {
          ...baseInput().copy,
          overallLabel: '綜合戰力',
          legendBaseline: '基準（2026.01.01）',
          legendCurrent: '當前（2026.03.01）',
          axisLabels: {
            ...baseInput().copy.axisLabels,
            muscleMass: '骨骼肌量',
          },
        },
      })
    );
    expect(ctx.texts).toContain('基準（2026.01.01）');
    expect(ctx.texts).toContain('當前（2026.03.01）');
    expect(ctx.texts).toContain('骨骼肌量');

    const anchors = resolveEvolutionLegendAnchors();
    const muscle = ctx.textPositions.filter((row) => row.text === '骨骼肌量');
    const legend = ctx.textPositions.find((row) => row.text === '基準（2026.01.01）');
    expect(muscle.length).toBeGreaterThan(0);
    expect(legend?.y).toBe(anchors.legendY);
    const muscleBottom =
      Math.min(...muscle.map((row) => row.y)) + EVOLUTION_CARD_LAYOUT.radarLabelFontPx * 0.55;
    const legendTop = anchors.legendY - EVOLUTION_CARD_LAYOUT.legendFontPx * 0.55;
    expect(legendTop - muscleBottom).toBeGreaterThanOrEqual(36);
  });

  it('shows baseline locked copy when mode is baseline_ready', () => {
    const ctx = recordingContext();
    paintEvolutionCard(
      ctx,
      baseInput({
        mode: 'baseline_ready',
        overallDelta: null,
        deltas: [],
      })
    );
    expect(ctx.texts).toContain('DAY 1 BASELINE LOCKED');
  });
});

describe('composeEvolutionCard', () => {
  it('applies export scale and encodes a PNG blob via deps surface', async () => {
    const ctx = recordingContext();
    const surface: TelemetryCanvasSurface = {
      width: 0,
      height: 0,
      getContext: () => ctx,
      toBlob: (callback) => callback(new Blob(['evo'], { type: 'image/png' })),
    };
    const createSurface = vi.fn(() => surface);

    const blob = await composeEvolutionCard(baseInput(), { createSurface });
    expect(createSurface).toHaveBeenCalledTimes(1);
    expect(surface.width).toBe(EVOLUTION_CARD_PIXEL_WIDTH);
    expect(surface.height).toBe(EVOLUTION_CARD_PIXEL_HEIGHT);
    expect(ctx.scales).toEqual([{ x: 2, y: 2 }]);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});
