import { describe, expect, it, vi } from 'vitest';
import {
  composeEvolutionCard,
  EVOLUTION_CARD_EXPORT_SCALE,
  EVOLUTION_CARD_LOGIC_HEIGHT,
  EVOLUTION_CARD_LOGIC_WIDTH,
  EVOLUTION_CARD_PIXEL_HEIGHT,
  EVOLUTION_CARD_PIXEL_WIDTH,
  paintEvolutionCard,
  resolveEvolutionCardSize,
  type EvolutionCardComposeInput,
} from '../evolutionCardComposer';
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
      { key: 'muscleMass', label: 'SMM', value: 65 },
      { key: 'bodyFat', label: 'FFMI', value: 70 },
      { key: 'gripStrength', label: 'GRP', value: 60 },
    ],
    currentAxes: [
      { key: 'strength', label: 'STR', value: 85 },
      { key: 'explosivePower', label: 'PWR', value: 78 },
      { key: 'cardio', label: 'END', value: 80 },
      { key: 'muscleMass', label: 'SMM', value: 82 },
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
      overallLabel: 'OVERALL',
      baselineLocked: 'DAY 1 BASELINE LOCKED',
      prBadge: 'PR',
      emptyScore: '—',
      legendBaseline: 'Baseline (2026.01.01)',
      legendCurrent: 'Current (2026.03.01)',
      axisLabels: {
        strength: 'STR',
        explosivePower: 'PWR',
        cardio: 'END',
        muscleMass: 'SMM',
        bodyFat: 'FFMI',
        gripStrength: 'GRP',
      },
    },
    ...overrides,
  };
}

function recordingContext(): TelemetryDrawContext & {
  texts: string[];
  scales: Array<{ x: number; y: number }>;
} {
  const texts: string[] = [];
  const scales: Array<{ x: number; y: number }> = [];
  const gradient = { addColorStop: () => undefined };
  return {
    texts,
    scales,
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineJoin: 'round',
    lineCap: 'round',
    font: '',
    textAlign: 'left',
    textBaseline: 'middle',
    globalAlpha: 1,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
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
    fillText: (text: string) => {
      texts.push(text);
    },
    measureText: (text: string) => ({ width: text.length * 8 }),
    clip: () => undefined,
    rect: () => undefined,
    scale: (x: number, y: number) => {
      scales.push({ x, y });
    },
    drawImage: () => undefined,
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    setLineDash: () => undefined,
  };
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

describe('paintEvolutionCard', () => {
  it('renders brand, date range, radar legend, overall delta, and PR badge copy', () => {
    const ctx = recordingContext();
    paintEvolutionCard(ctx, baseInput());
    expect(ctx.texts).toContain('ULTIMATE PHYSIQUE // EVOLUTION LOG');
    expect(ctx.texts).toContain('DAY 1 (2026.01.01) → NOW (2026.03.01)');
    expect(ctx.texts).toContain('Baseline (2026.01.01)');
    expect(ctx.texts).toContain('Current (2026.03.01)');
    expect(ctx.texts.some((t) => t.includes('60.00') && t.includes('80.00'))).toBe(true);
    expect(ctx.texts).toContain('+20.00');
    expect(ctx.texts).toContain('PR');
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
