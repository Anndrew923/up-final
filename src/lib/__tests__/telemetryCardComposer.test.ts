import { describe, expect, it, vi } from 'vitest';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import {
  TELEMETRY_CERT_INNER_FRAME_INSET,
  TELEMETRY_CERT_STAMP_CLEARANCE_PX,
  TELEMETRY_CERT_STAMP_MAX_Y,
} from '../telemetryCardCertificate';
import {
  TELEMETRY_CERT_CREST_CENTER,
  TELEMETRY_CERT_GUILLOCHE_UP_PATHS,
  TELEMETRY_CERT_TITLE_FOIL,
  TELEMETRY_CERT_TITLE_Y,
} from '../telemetryCardCertificateChrome';
import { TELEMETRY_SERIF_FONT_STACK } from '../telemetryCardFonts';
import {
  TELEMETRY_BRAND_WATERMARK,
  TELEMETRY_CARD_BRAND,
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
  TELEMETRY_CORNER_RETICLE,
  TELEMETRY_HUD_LAYOUT,
  TELEMETRY_HUD_MUTED_FILL,
  TELEMETRY_HUD_SCORE_FILL,
  TELEMETRY_HUD_SCORE_GLOW,
  TELEMETRY_HUD_SPEC_TITLE_FILL,
  TELEMETRY_HUD_TEXT_SHADOW,
  TELEMETRY_HUD_TITLE_FOIL,
  TELEMETRY_HUD_TITLE_GLOW,
  TELEMETRY_HUD_COLUMN_DIVIDER,
  TELEMETRY_HUD_COLUMN_MID_Y,
  TELEMETRY_HUD_RIGHT_BOTTOM_Y,
  TELEMETRY_HUD_SPEC_RULE,
  TELEMETRY_RADAR_HUD_CLEARANCE_PX,
  TELEMETRY_RADAR_LABEL_MAX_RIGHT_X,
  TELEMETRY_RADAR_LASER,
  TELEMETRY_RADAR_LAYOUT,
  TELEMETRY_RADAR_OVERFLOW_NODE,
  TELEMETRY_RADAR_RIGHT_LABEL_GAP,
  TELEMETRY_RADAR_TACTICAL_RING_RADIUS,
  TELEMETRY_SELFIE_CHROME,
  TELEMETRY_SELFIE_SCRIM_START_RATIO,
  TELEMETRY_SELFIE_SCRIM_STOPS,
  composeTelemetryCard,
  resolveCoverSourceRect,
  resolveSelfieRadarLabelPaint,
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
  | {
      type: 'createRadialGradient';
      x0: number;
      y0: number;
      r0: number;
      x1: number;
      y1: number;
      r1: number;
    }
  | { type: 'setLineDash'; segments: number[] }
  | { type: 'addColorStop'; offset: number; color: string }
  | {
      type: 'fillText';
      text: string;
      fillStyle: string;
      shadowBlur: number;
      shadowColor: string;
    }
  | { type: 'strokeRect'; x: number; y: number; w: number; h: number }
  | { type: 'arc'; x: number; y: number; radius: number };

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
    lineCap: 'round',
    font: '',
    textAlign: 'left',
    textBaseline: 'middle',
    letterSpacing: '0px',
    globalAlpha: 1,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetY: 0,
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc(x, y, radius) {
      calls.push({ type: 'arc', x, y, radius });
    },
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
      calls.push({
        type: 'fillText',
        text,
        fillStyle: typeof fillStyle === 'string' ? fillStyle : 'gradient',
        shadowBlur: ctx.shadowBlur,
        shadowColor: ctx.shadowColor,
      });
    },
    measureText(text) {
      return { width: text.length * 12 };
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
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      calls.push({ type: 'createRadialGradient', x0, y0, r0, x1, y1, r1 });
      return gradient;
    },
    setLineDash(segments) {
      calls.push({ type: 'setLineDash', segments: [...segments] });
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
    year: 2026,
    verifiedStamp: 'VERIFIED PHYSIOLOGICAL SPECIFICATION // 2026',
    specs: [
      { kicker: 'VISUAL', title: 'Marble', subtitle: 'BF 12%' },
      { kicker: 'FORCE', title: 'Iron', subtitle: 'Grip locked' },
      { kicker: 'KINETIC', title: 'Launch', subtitle: 'Ready' },
    ],
    meters: [
      { label: 'FORM PURITY', value: '88.30', fillPct: 88.3, badge: null },
      { label: 'RIGID BURST', value: '85.00', fillPct: 85, badge: null },
      { label: 'PEAK STAMINA', value: '100.00', fillPct: 100, badge: 'OVERDRIVE' },
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

describe('selfie HUD geometry isolation', () => {
  it('locks EN label wall, open right-column rhythm, and radar center symmetry', () => {
    const layout = TELEMETRY_RADAR_LAYOUT;
    const hud = TELEMETRY_HUD_LAYOUT;
    const radarTop = layout.cy - layout.labelRadius;
    const rightLabelStart =
      layout.cx + layout.outerRadius + TELEMETRY_RADAR_RIGHT_LABEL_GAP;
    const rightLabelPaint = resolveSelfieRadarLabelPaint({
      cx: layout.cx,
      outerRadius: layout.outerRadius,
      xLabel: layout.cx + layout.labelRadius,
      yLabel: layout.cy,
    });
    const topLabelPaint = resolveSelfieRadarLabelPaint({
      cx: layout.cx,
      outerRadius: layout.outerRadius,
      xLabel: layout.cx,
      yLabel: radarTop,
    });
    const leftLabelPaint = resolveSelfieRadarLabelPaint({
      cx: layout.cx,
      outerRadius: layout.outerRadius,
      xLabel: layout.cx - layout.labelRadius,
      yLabel: layout.cy,
    });

    expect(layout.cx).toBe(248);
    expect(layout.cy).toBe(1460);
    expect(layout.outerRadius).toBe(140);
    expect(layout.labelRadius).toBe(180);
    expect(TELEMETRY_RADAR_TACTICAL_RING_RADIUS).toBe(152);
    expect(TELEMETRY_RADAR_TACTICAL_RING_RADIUS).toBeLessThan(layout.labelRadius);
    expect(TELEMETRY_RADAR_OVERFLOW_NODE).toBe('#FDE047');
    expect(TELEMETRY_RADAR_LABEL_MAX_RIGHT_X).toBe(530);
    expect(hud.textX).toBe(585);
    expect(hud.clip.x).toBe(585);
    expect(hud.clip.w).toBe(435);
    expect(hud.textMaxWidth).toBe(435);
    expect(TELEMETRY_RADAR_HUD_CLEARANCE_PX).toBe(55);
    expect(TELEMETRY_RADAR_HUD_CLEARANCE_PX).toBeGreaterThanOrEqual(55);

    expect(topLabelPaint.align).toBe('center');
    expect(leftLabelPaint.align).toBe('right');
    expect(rightLabelPaint.align).toBe('left');
    expect(rightLabelPaint.x).toBe(rightLabelStart);
    expect(rightLabelPaint.maxWidth).toBe(TELEMETRY_RADAR_LABEL_MAX_RIGHT_X - rightLabelStart);
    expect(rightLabelPaint.x + (rightLabelPaint.maxWidth ?? 0)).toBeLessThanOrEqual(
      TELEMETRY_RADAR_LABEL_MAX_RIGHT_X
    );
    expect(TELEMETRY_HUD_LAYOUT.textX - TELEMETRY_RADAR_LABEL_MAX_RIGHT_X).toBeGreaterThanOrEqual(
      55
    );

    expect(hud.brandY).toBe(1220);
    expect(hud.scoreY).toBe(1315);
    expect(hud.titleY).toBe(1395);
    expect(hud.specStartY).toBe(1488);
    expect(hud.specRowGap).toBe(88);
    expect(hud.specTitleDy).toBe(30);
    expect(TELEMETRY_HUD_RIGHT_BOTTOM_Y).toBe(1694);
    expect(TELEMETRY_HUD_RIGHT_BOTTOM_Y).toBe(
      hud.specStartY + 2 * hud.specRowGap + hud.specTitleDy
    );
    expect(TELEMETRY_HUD_SPEC_RULE.y).toBe(
      Math.round((hud.titleY + hud.specStartY) / 2)
    );
    expect(TELEMETRY_HUD_SPEC_RULE.x0).toBe(hud.textX);
    expect(TELEMETRY_HUD_SPEC_RULE.x1).toBe(hud.clip.x + hud.clip.w - 40);
    expect(TELEMETRY_HUD_SPEC_RULE.y).toBeGreaterThan(hud.titleY);
    expect(TELEMETRY_HUD_SPEC_RULE.y).toBeLessThan(hud.specStartY);
    expect(TELEMETRY_HUD_COLUMN_MID_Y).toBe((hud.brandY + TELEMETRY_HUD_RIGHT_BOTTOM_Y) / 2);
    expect(Math.abs(layout.cy - TELEMETRY_HUD_COLUMN_MID_Y)).toBeLessThanOrEqual(5);
    expect(TELEMETRY_HUD_COLUMN_DIVIDER.x).toBe(556);
    expect(TELEMETRY_HUD_COLUMN_DIVIDER.y0).toBe(hud.brandY);
    expect(TELEMETRY_HUD_COLUMN_DIVIDER.y1).toBe(TELEMETRY_HUD_RIGHT_BOTTOM_Y);
    expect(TELEMETRY_HUD_LAYOUT).not.toHaveProperty('battleCodeY');
  });
});

describe('carbon certificate footer clearance', () => {
  it('keeps stamp baseline above the inner foil with a fixed gutter', () => {
    expect(TELEMETRY_CERT_INNER_FRAME_INSET).toBe(58);
    expect(TELEMETRY_CERT_STAMP_CLEARANCE_PX).toBe(24);
    expect(TELEMETRY_CERT_STAMP_MAX_Y).toBe(
      TELEMETRY_CARD_HEIGHT - TELEMETRY_CERT_INNER_FRAME_INSET - TELEMETRY_CERT_STAMP_CLEARANCE_PX
    );
    expect(TELEMETRY_CERT_STAMP_MAX_Y).toBe(1838);
  });
});

describe('composeTelemetryCard', () => {
  it('paints the black-gold carbon certificate at 1080×1920', async () => {
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
          call.x === 48 &&
          call.y === 48 &&
          call.w === TELEMETRY_CARD_WIDTH - 96
      )
    ).toBe(true);
    expect(calls.some((call) => call.type === 'arc' && call.radius === 7)).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === TELEMETRY_CARD_BRAND)).toBe(
      true
    );
    expect(calls.some((call) => call.type === 'fillText' && call.text === '72.40')).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === '2026')).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'PEAK MORTAL')).toBe(true);
    // WHY: Crest is vector Guilloche strokes — never fillText("UP").
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'UP')).toBe(false);
    expect(TELEMETRY_CERT_GUILLOCHE_UP_PATHS).toHaveLength(3);
    expect(
      calls.some(
        (call) =>
          call.type === 'createRadialGradient' &&
          call.x0 === TELEMETRY_CERT_CREST_CENTER.x &&
          call.y0 === TELEMETRY_CERT_CREST_CENTER.y &&
          call.r1 === 130
      )
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'createLinearGradient' &&
          call.x0 === TELEMETRY_CARD_WIDTH / 2 &&
          call.y0 === TELEMETRY_CERT_TITLE_Y - 30 &&
          call.y1 === TELEMETRY_CERT_TITLE_Y + 30
      )
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'addColorStop' && call.color === TELEMETRY_CERT_TITLE_FOIL.top
      )
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'addColorStop' && call.color === TELEMETRY_CERT_TITLE_FOIL.wingNear
      )
    ).toBe(true);
    expect(TELEMETRY_SERIF_FONT_STACK).toContain('UPSerifTC');
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'FORM PURITY')).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'OVERDRIVE')).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'UP-ALPHA')).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'fillText' &&
          call.text === 'VERIFIED PHYSIOLOGICAL SPECIFICATION // 2026'
      )
    ).toBe(true);
    expect(TELEMETRY_CERT_STAMP_MAX_Y).toBe(1838);
    expect(calls.some((call) => call.type === 'drawImage')).toBe(false);
  });

  it('cover-crops the selfie and paints the eye-care scrim with compact HUD', async () => {
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

    const scrimY0 = TELEMETRY_CARD_HEIGHT * TELEMETRY_SELFIE_SCRIM_START_RATIO;
    const scrimGradient = calls.find(
      (call) =>
        call.type === 'createLinearGradient' && call.x0 === 0 && call.y0 === scrimY0
    );
    expect(TELEMETRY_SELFIE_SCRIM_START_RATIO).toBe(0.58);
    expect(scrimGradient).toEqual({
      type: 'createLinearGradient',
      x0: 0,
      y0: scrimY0,
      x1: 0,
      y1: TELEMETRY_CARD_HEIGHT,
    });
    expect(
      calls.some(
        (call) =>
          call.type === 'createLinearGradient' &&
          call.x0 === TELEMETRY_HUD_COLUMN_DIVIDER.x &&
          call.y0 === TELEMETRY_HUD_COLUMN_DIVIDER.y0 &&
          call.y1 === TELEMETRY_HUD_COLUMN_DIVIDER.y1
      )
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'addColorStop' &&
          call.offset === TELEMETRY_SELFIE_SCRIM_STOPS.midOffset &&
          call.color === TELEMETRY_SELFIE_SCRIM_STOPS.mid
      )
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'addColorStop' &&
          call.offset === 1 &&
          call.color === TELEMETRY_SELFIE_SCRIM_STOPS.floor
      )
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'fillRect' &&
          call.fillStyle === 'gradient' &&
          call.y === scrimY0
      )
    ).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === '72.40')).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'PEAK MORTAL')).toBe(true);
    // WHY: Selfie brand seal is Guilloche vector strokes — never fillText("UP").
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'UP')).toBe(false);
    expect(calls.some((call) => call.type === 'fillText' && call.text === '2026')).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'UP-ALPHA')).toBe(false);
    expect(
      calls.some(
        (call) =>
          call.type === 'createRadialGradient' &&
          call.x0 === TELEMETRY_BRAND_WATERMARK.cx &&
          call.y0 === TELEMETRY_BRAND_WATERMARK.cy
      )
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'createRadialGradient' &&
          call.x0 === TELEMETRY_RADAR_LAYOUT.cx &&
          call.y0 === TELEMETRY_RADAR_LAYOUT.cy &&
          call.r1 === TELEMETRY_RADAR_LAYOUT.outerRadius
      )
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'addColorStop' &&
          call.offset === 0 &&
          call.color === TELEMETRY_RADAR_LASER.energyCore
      )
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.type === 'arc' &&
          call.x === TELEMETRY_RADAR_LAYOUT.cx &&
          call.y === TELEMETRY_RADAR_LAYOUT.cy &&
          call.radius === TELEMETRY_RADAR_TACTICAL_RING_RADIUS
      )
    ).toBe(true);
    expect(calls.some((call) => call.type === 'setLineDash' && call.segments[0] === 5)).toBe(true);
    const scorePaint = calls.find((call) => call.type === 'fillText' && call.text === '72.40');
    expect(scorePaint).toMatchObject({
      type: 'fillText',
      fillStyle: TELEMETRY_HUD_SCORE_FILL,
      shadowBlur: TELEMETRY_HUD_SCORE_GLOW.blur,
      shadowColor: TELEMETRY_HUD_SCORE_GLOW.color,
    });
    const titlePaint = calls.find(
      (call) => call.type === 'fillText' && call.text === 'PEAK MORTAL'
    );
    expect(titlePaint).toMatchObject({
      type: 'fillText',
      fillStyle: TELEMETRY_HUD_TITLE_FOIL,
      shadowBlur: TELEMETRY_HUD_TITLE_GLOW.blur,
      shadowColor: TELEMETRY_HUD_TITLE_GLOW.color,
    });
    expect(TELEMETRY_HUD_MUTED_FILL).toBe('rgba(244, 244, 245, 0.94)');
    expect(TELEMETRY_HUD_SPEC_TITLE_FILL).toBe('#FFFFFF');
    expect(TELEMETRY_HUD_TITLE_FOIL).toBe('#FFE58F');
    expect(TELEMETRY_HUD_SCORE_FILL).toBe('#A5F3FC');
    expect(TELEMETRY_HUD_TEXT_SHADOW.blur).toBe(8);
    expect(TELEMETRY_SELFIE_CHROME.stroke).toBe('rgba(243, 208, 120, 0.78)');
    expect(TELEMETRY_RADAR_LASER.neon).toBe('#00E5FF');
    expect(TELEMETRY_RADAR_LASER.coreStroke).toBe('#CFFAFE');
    expect(TELEMETRY_BRAND_WATERMARK.cx).toBe(942);
    expect(TELEMETRY_BRAND_WATERMARK.cy).toBe(122);
    expect(TELEMETRY_BRAND_WATERMARK.outerRadius).toBe(54);
    expect(TELEMETRY_BRAND_WATERMARK.yearDy).toBe(70);
    expect(TELEMETRY_CORNER_RETICLE.arm).toBe(36);
    expect(TELEMETRY_RADAR_LAYOUT.cx).toBe(248);
    expect(TELEMETRY_HUD_LAYOUT.textX).toBe(585);
  });

  it('falls back to certificate when selfie background is invalid', async () => {
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
    expect(
      calls.some(
        (call) =>
          call.type === 'createRadialGradient' &&
          call.x0 === TELEMETRY_CERT_CREST_CENTER.x &&
          call.y0 === TELEMETRY_CERT_CREST_CENTER.y
      )
    ).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'UP')).toBe(false);
  });

  it('falls back to certificate when drawImage throws', async () => {
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
    expect(
      calls.some(
        (call) =>
          call.type === 'createRadialGradient' &&
          call.x0 === TELEMETRY_CERT_CREST_CENTER.x &&
          call.y0 === TELEMETRY_CERT_CREST_CENTER.y
      )
    ).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === 'UP')).toBe(false);
  });

  it('falls back to certificate when selfie mode has no background', async () => {
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
    await composeTelemetryCard(baseInput({ brandHeader: '最強肉體 // 生理統治力' }), {
      createSurface: () => surface,
    });
    expect(
      calls.some((call) => call.type === 'fillText' && call.text === '最強肉體 // 生理統治力')
    ).toBe(true);
    expect(calls.some((call) => call.type === 'fillText' && call.text === TELEMETRY_CARD_BRAND)).toBe(
      false
    );
  });
});
