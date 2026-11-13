import { describe, expect, it, vi } from 'vitest';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import {
  TELEMETRY_CARD_BRAND,
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
  composeTelemetryCard,
  resolveCoverSourceRect,
  type TelemetryCanvasSurface,
  type TelemetryCardInput,
  type TelemetryDrawContext,
  type TelemetryGradient,
} from '../telemetryCardComposer';

type DrawCall =
  | { type: 'fillRect'; x: number; y: number; w: number; h: number; fillStyle: string | 'gradient' }
  | {
      type: 'drawImage';
      sx: number;
      sy: number;
      sw: number;
      sh: number;
      dx: number;
      dy: number;
      dw: number;
      dh: number;
    }
  | { type: 'createLinearGradient'; x0: number; y0: number; x1: number; y1: number }
  | { type: 'addColorStop'; offset: number; color: string }
  | { type: 'fillText'; text: string }
  | { type: 'strokeRect'; x: number; y: number; w: number; h: number };

function createRecordingSurface(options?: {
  drawImageImpl?: TelemetryDrawContext['drawImage'];
}): {
  surface: TelemetryCanvasSurface;
  calls: DrawCall[];
  blob: Blob;
} {
  const calls: DrawCall[] = [];
  const blob = new Blob(['png'], { type: 'image/png' });
  let fillStyle: string | TelemetryGradient = '#000';

  const gradient: TelemetryGradient = {
    addColorStop(offset, color) {
      calls.push({ type: 'addColorStop', offset, color });
    },
  };

  const ctx: TelemetryDrawContext = {
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(value) {
      fillStyle = value;
    },
    strokeStyle: '#fff',
    lineWidth: 1,
    lineJoin: 'round',
    font: '',
    textAlign: 'left',
    textBaseline: 'middle',
    globalAlpha: 1,
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect(x, y, w, h) {
      calls.push({
        type: 'fillRect',
        x,
        y,
        w,
        h,
        fillStyle: typeof fillStyle === 'string' ? fillStyle : 'gradient',
      });
    },
    strokeRect(x, y, w, h) {
      calls.push({ type: 'strokeRect', x, y, w, h });
    },
    fillText(text) {
      calls.push({ type: 'fillText', text });
    },
    clip: vi.fn(),
    rect: vi.fn(),
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      if (options?.drawImageImpl) {
        options.drawImageImpl(image, sx, sy, sw, sh, dx, dy, dw, dh);
        return;
      }
      calls.push({ type: 'drawImage', sx, sy, sw, sh, dx, dy, dw, dh });
    },
    createLinearGradient(x0, y0, x1, y1) {
      calls.push({ type: 'createLinearGradient', x0, y0, x1, y1 });
      return gradient;
    },
  };

  const surface: TelemetryCanvasSurface = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toBlob: (callback) => callback(blob),
  };

  return { surface, calls, blob };
}

const baseAxes = SIX_AXIS_METRICS.map((key) => ({
  key,
  label: key,
  value: key === 'strength' ? 120 : 55,
}));

function baseInput(overrides?: Partial<TelemetryCardInput>): TelemetryCardInput {
  return {
    mode: 'carbon',
    battleCode: 'UP-ALPHA',
    title: 'PEAK MORTAL',
    overallScore: 72.4,
    specs: [
      { kicker: 'VISUAL', title: 'Marble', subtitle: 'BF 12%' },
      { kicker: 'FORCE', title: 'Iron', subtitle: 'Grip locked' },
      { kicker: 'KINETIC', title: 'Launch', subtitle: 'Ready' },
    ],
    axes: baseAxes,
    ...overrides,
  };
}

describe('resolveCoverSourceRect', () => {
  it('crops the sides of a wider source', () => {
    const rect = resolveCoverSourceRect(2000, 1000, 1080, 1920);
    expect(rect).not.toBeNull();
    expect(rect?.sy).toBe(0);
    expect(rect?.sh).toBe(1000);
    expect(rect?.sw).toBeCloseTo(1000 * (1080 / 1920), 5);
    expect(rect?.sx).toBeCloseTo((2000 - (rect?.sw ?? 0)) / 2, 5);
  });

  it('crops the top and bottom of a taller source', () => {
    const rect = resolveCoverSourceRect(900, 2400, 1080, 1920);
    expect(rect).not.toBeNull();
    expect(rect?.sx).toBe(0);
    expect(rect?.sw).toBe(900);
    expect(rect?.sh).toBeCloseTo(900 / (1080 / 1920), 5);
    expect(rect?.sy).toBeCloseTo((2400 - (rect?.sh ?? 0)) / 2, 5);
  });

  it('returns null for invalid dimensions', () => {
    expect(resolveCoverSourceRect(0, 100, 1080, 1920)).toBeNull();
  });
});

describe('composeTelemetryCard', () => {
  it('paints the carbon plate at 1080×1920 and returns a PNG blob', async () => {
    const { surface, calls, blob } = createRecordingSurface();
    const result = await composeTelemetryCard(baseInput({ mode: 'carbon' }), {
      createSurface: () => surface,
    });

    expect(surface.width).toBe(TELEMETRY_CARD_WIDTH);
    expect(surface.height).toBe(TELEMETRY_CARD_HEIGHT);
    expect(result).toBe(blob);
    expect(result.type).toBe('image/png');

    expect(calls.some((call) => call.type === 'fillRect' && call.fillStyle === '#07080c')).toBe(
      true
    );
    expect(
      calls.some(
        (call) =>
          call.type === 'strokeRect' &&
          call.x === 28 &&
          call.y === 28 &&
          call.w === TELEMETRY_CARD_WIDTH - 56
      )
    ).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === TELEMETRY_CARD_BRAND)).toBe(
      true
    );
    expect(calls.some((call) => call.type === 'fillText' && call.text === '72.40')).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'PEAK MORTAL')).toBe(true);
    expect(calls.some((call) => call.type === 'drawImage')).toBe(false);
  });

  it('cover-crops the selfie and paints the eye-care scrim', async () => {
    const { surface, calls } = createRecordingSurface();
    await composeTelemetryCard(
      baseInput({
        mode: 'selfie',
        background: { width: 2000, height: 1000 },
      }),
      { createSurface: () => surface }
    );

    const draw = calls.find((call) => call.type === 'drawImage');
    expect(draw).toMatchObject({
      type: 'drawImage',
      sy: 0,
      sh: 1000,
      dx: 0,
      dy: 0,
      dw: TELEMETRY_CARD_WIDTH,
      dh: TELEMETRY_CARD_HEIGHT,
    });
    if (draw?.type === 'drawImage') {
      expect(draw.sw).toBeCloseTo(1000 * (1080 / 1920), 5);
      expect(draw.sx).toBeCloseTo((2000 - draw.sw) / 2, 5);
    }

    const gradient = calls.find((call) => call.type === 'createLinearGradient');
    expect(gradient).toEqual({
      type: 'createLinearGradient',
      x0: 0,
      y0: TELEMETRY_CARD_HEIGHT * 0.5,
      x1: 0,
      y1: TELEMETRY_CARD_HEIGHT,
    });
    expect(calls.some((call) => call.type === 'addColorStop' && call.offset === 0)).toBe(true);
    expect(calls.some((call) => call.type === 'addColorStop' && call.offset === 1)).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'fillRect' &&
          call.fillStyle === 'gradient' &&
          call.y === TELEMETRY_CARD_HEIGHT * 0.5
      )
    ).toBe(true);
  });

  it('falls back to carbon when selfie background is invalid', async () => {
    const { surface, calls } = createRecordingSurface();
    await composeTelemetryCard(
      baseInput({
        mode: 'selfie',
        background: { width: 0, height: 0 },
      }),
      { createSurface: () => surface }
    );

    expect(calls.some((call) => call.type === 'drawImage')).toBe(false);
    expect(calls.some((call) => call.type === 'fillRect' && call.fillStyle === '#07080c')).toBe(
      true
    );
  });

  it('falls back to carbon when drawImage throws', async () => {
    const { surface, calls } = createRecordingSurface({
      drawImageImpl: () => {
        throw new Error('decode-failed');
      },
    });

    await expect(
      composeTelemetryCard(
        baseInput({
          mode: 'selfie',
          background: { width: 1200, height: 1600 },
        }),
        { createSurface: () => surface }
      )
    ).resolves.toBeInstanceOf(Blob);

    expect(calls.some((call) => call.type === 'fillRect' && call.fillStyle === '#07080c')).toBe(
      true
    );
  });

  it('falls back to carbon when selfie mode has no background', async () => {
    const { surface, calls } = createRecordingSurface();
    await composeTelemetryCard(baseInput({ mode: 'selfie', background: null }), {
      createSurface: () => surface,
    });
    expect(calls.some((call) => call.type === 'drawImage')).toBe(false);
    expect(calls.some((call) => call.type === 'fillRect' && call.fillStyle === '#07080c')).toBe(
      true
    );
  });

  it('honors brandHeader override on the PNG stamp', async () => {
    const { surface, calls } = createRecordingSurface();
    await composeTelemetryCard(baseInput({ brandHeader: '最強肉體 // TELEMETRY' }), {
      createSurface: () => surface,
    });
    expect(
      calls.some((call) => call.type === 'fillText' && call.text === '最強肉體 // TELEMETRY')
    ).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === TELEMETRY_CARD_BRAND)).toBe(
      false
    );
  });
});
