/**
 * Offline 9:16 telemetry card orchestrator.
 *
 * WHY: Share plates must rasterize on-device. This module never fetches,
 * never touches Firestore, and degrades a bad selfie to the carbon certificate
 * so a missing photo cannot reject the export.
 */
import type { RadarGeometryPoint } from '../logic/core/radarGeometry';
import { formatOverallResonanceScore } from '../logic/core/scoring';
import {
  tryPaintSelfieBackground,
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
import {
  paintCertificatePlate,
  type TelemetryMeterLine,
} from './telemetryCardCertificate';
import type { TelemetryBackgroundSource } from './telemetryCardCover';
import {
  ensureTelemetrySerifFontsReady,
  TELEMETRY_SERIF_FONT_STACK,
} from './telemetryCardFonts';
import {
  paintHolographicRadar,
  TELEMETRY_RADAR_LABEL_MAX_RIGHT_X,
} from './telemetryCardRadarPaint';
import {
  paintBrandWatermark,
  paintCornerReticles,
} from './telemetryCardSelfieChrome';
import {
  TelemetryComposeError,
  type TelemetryCanvasSurface,
  type TelemetryDrawContext,
  type TelemetryGradient,
} from './telemetryCardTypes';

export {
  resolveCoverSourceRect,
  type CoverSourceRect,
  type TelemetryBackgroundSource,
} from './telemetryCardCover';
export {
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
export {
  TelemetryComposeError,
  type TelemetryCanvasSurface,
  type TelemetryComposeErrorCode,
  type TelemetryDrawContext,
  type TelemetryGradient,
} from './telemetryCardTypes';
export type { TelemetryMeterLine } from './telemetryCardCertificate';
export {
  TELEMETRY_BRAND_WATERMARK,
  TELEMETRY_CORNER_RETICLE,
} from './telemetryCardSelfieChrome';
export {
  TELEMETRY_RADAR_LABEL_MAX_RIGHT_X,
  TELEMETRY_RADAR_LASER,
  TELEMETRY_RADAR_LAYOUT,
  TELEMETRY_RADAR_OVERFLOW_NODE,
  TELEMETRY_RADAR_RIGHT_LABEL_GAP,
  TELEMETRY_RADAR_TACTICAL_RING_RADIUS,
  resolveSelfieRadarLabelPaint,
} from './telemetryCardRadarPaint';
export { TELEMETRY_SELFIE_CHROME } from './telemetryCardSelfieChrome';
export {
  TELEMETRY_SELFIE_SCRIM_START_RATIO,
  TELEMETRY_SELFIE_SCRIM_STOPS,
} from './telemetryCardBackground';

export const TELEMETRY_CARD_BRAND = 'ULTIMATE PHYSIQUE // DOMINANCE';

/**
 * Right-column HUD dock — brand → score → champagne title → specs.
 * WHY: Vertical rhythm is intentionally open (1220–1694) so the dock breathes into
 * unused lower plate space without colliding with corner reticles near ~1884.
 */
export const TELEMETRY_HUD_LAYOUT = {
  clip: { x: 585, y: 1040, w: 435, h: 800 },
  textX: 585,
  brandY: 1220,
  scoreY: 1315,
  titleY: 1395,
  specStartY: 1488,
  specRowGap: 88,
  /** Baseline delta from each spec kicker to its title. */
  specTitleDy: 30,
  textMaxWidth: 435,
} as const;

/** Bottom edge of the third right-column spec title — dual-column vertical lock. */
export const TELEMETRY_HUD_RIGHT_BOTTOM_Y =
  TELEMETRY_HUD_LAYOUT.specStartY +
  2 * TELEMETRY_HUD_LAYOUT.specRowGap +
  TELEMETRY_HUD_LAYOUT.specTitleDy;

/**
 * Horizontal hairline between the score/title block and the three spec rows.
 * WHY: Midpoint + clip inset keep the rule glued to title/spec anchors if rhythm shifts.
 */
export const TELEMETRY_HUD_SPEC_RULE = {
  x0: TELEMETRY_HUD_LAYOUT.textX,
  x1: TELEMETRY_HUD_LAYOUT.clip.x + TELEMETRY_HUD_LAYOUT.clip.w - 40,
  y: Math.round(
    (TELEMETRY_HUD_LAYOUT.titleY + TELEMETRY_HUD_LAYOUT.specStartY) / 2
  ),
  stroke: 'rgba(255, 255, 255, 0.16)',
} as const;

/**
 * Corridor divider between radar labels and the right HUD — paints before clip.
 * WHY: y0/y1 derive from HUD anchors so a layout tweak cannot leave a floating mid-line.
 */
export const TELEMETRY_HUD_COLUMN_DIVIDER = {
  x: 556,
  y0: TELEMETRY_HUD_LAYOUT.brandY,
  y1: TELEMETRY_HUD_RIGHT_BOTTOM_Y,
  stroke: 'rgba(165, 243, 252, 0.22)',
} as const;

/** Radar cy vs right-column vertical midpoint — center symmetry contract. */
export const TELEMETRY_HUD_COLUMN_MID_Y =
  (TELEMETRY_HUD_LAYOUT.brandY + TELEMETRY_HUD_RIGHT_BOTTOM_Y) / 2;

/** Geometry contract: hard label wall (≤530) vs right-column textX. */
export const TELEMETRY_RADAR_HUD_CLEARANCE_PX =
  TELEMETRY_HUD_LAYOUT.textX - TELEMETRY_RADAR_LABEL_MAX_RIGHT_X;

const HUD_FONT_FAMILY = '"PingFang TC", "Noto Sans TC", "Helvetica Neue", sans-serif';
const HUD_TITLE_FONT_FAMILY = TELEMETRY_SERIF_FONT_STACK;
/** High-contrast silver labels for bright gym-mirror selfies. */
export const TELEMETRY_HUD_MUTED_FILL = 'rgba(244, 244, 245, 0.94)';
/** Spec meter titles — pure white against the lighter scrim. */
export const TELEMETRY_HUD_SPEC_TITLE_FILL = '#FFFFFF';
/** Champagne foil title — cold cyan score/radar vs warm gold stamp. */
export const TELEMETRY_HUD_TITLE_FOIL = '#FFE58F';
/** Ice-cyan overall score fill for the laser HUD pass. */
export const TELEMETRY_HUD_SCORE_FILL = '#A5F3FC';
/** Deep ink shadow keeps small HUD labels readable on bright photos. */
export const TELEMETRY_HUD_TEXT_SHADOW = {
  color: 'rgba(0,0,0,0.85)',
  blur: 8,
  offsetY: 2,
} as const;
/** Laser glow for the oversized overall score. */
export const TELEMETRY_HUD_SCORE_GLOW = {
  color: '#00E5FF',
  blur: 20,
  offsetY: 0,
} as const;
/** Warm micro-glow for the champagne title. */
export const TELEMETRY_HUD_TITLE_GLOW = {
  color: 'rgba(251, 191, 36, 0.65)',
  blur: 12,
  offsetY: 0,
} as const;

type HudShadowPreset = {
  color: string;
  blur: number;
  offsetY: number;
};

export type TelemetryCardMode = 'carbon' | 'selfie';

export interface TelemetrySpecLine {
  kicker: string;
  title: string;
  subtitle?: string;
}

export interface TelemetryCardInput {
  mode: TelemetryCardMode;
  battleCode: string;
  title: string;
  overallScore: number;
  specs: readonly TelemetrySpecLine[];
  axes: readonly RadarGeometryPoint[];
  meters?: readonly TelemetryMeterLine[];
  year?: number;
  verifiedStamp?: string;
  background?: TelemetryBackgroundSource | null;
  /**
   * Stamp on the PNG plate. Default is the English brand mark so social share
   * stays language-stable until the UI slice wires an i18n override.
   */
  brandHeader?: string;
}

export interface TelemetryComposeDeps {
  createSurface?: () => TelemetryCanvasSurface;
}

function clearTextShadow(ctx: TelemetryDrawContext): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function applyHudShadow(ctx: TelemetryDrawContext, shadow: HudShadowPreset): void {
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = shadow.blur;
  ctx.shadowOffsetY = shadow.offsetY;
}

function paintLabel(
  ctx: TelemetryDrawContext,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string,
  align: CanvasTextAlign,
  baseline: CanvasTextBaseline,
  options?: { maxWidth?: number; shadow?: HudShadowPreset }
): void {
  if (!text) return;
  const shadow = options?.shadow;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) applyHudShadow(ctx, shadow);
  try {
    ctx.font = font;
    ctx.fillText(text, x, y, options?.maxWidth);
  } catch {
    try {
      ctx.font = '24px sans-serif';
      ctx.fillText(text, x, y, options?.maxWidth);
    } catch {
      // Skip this run. The rest of the plate still encodes.
    }
  }
  if (shadow) clearTextShadow(ctx);
}

function strokeSegment(
  ctx: TelemetryDrawContext,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stroke: string | TelemetryGradient
): void {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

function paintColumnDivider(ctx: TelemetryDrawContext): void {
  const divider = TELEMETRY_HUD_COLUMN_DIVIDER;
  const gradient = ctx.createLinearGradient(divider.x, divider.y0, divider.x, divider.y1);
  gradient.addColorStop(0, 'rgba(165, 243, 252, 0)');
  gradient.addColorStop(0.5, divider.stroke);
  gradient.addColorStop(1, 'rgba(165, 243, 252, 0)');
  strokeSegment(ctx, divider.x, divider.y0, divider.x, divider.y1, gradient);
}

function paintSpecRule(ctx: TelemetryDrawContext): void {
  const rule = TELEMETRY_HUD_SPEC_RULE;
  strokeSegment(ctx, rule.x0, rule.y, rule.x1, rule.y, rule.stroke);
}

function paintHud(ctx: TelemetryDrawContext, input: TelemetryCardInput): void {
  const year = input.year ?? new Date().getFullYear();
  // WHY: Watermark + reticles must paint before the right-column clip or they vanish.
  paintBrandWatermark(ctx, year);
  paintCornerReticles(ctx);
  paintHolographicRadar(ctx, input.axes);
  paintColumnDivider(ctx);

  const hud = TELEMETRY_HUD_LAYOUT;
  const brand = input.brandHeader?.trim() || TELEMETRY_CARD_BRAND;
  const maxW = hud.textMaxWidth;

  ctx.save();
  ctx.beginPath();
  ctx.rect(hud.clip.x, hud.clip.y, hud.clip.w, hud.clip.h);
  ctx.clip();

  const inkShadow = { maxWidth: maxW, shadow: TELEMETRY_HUD_TEXT_SHADOW } as const;
  paintLabel(
    ctx,
    brand,
    hud.textX,
    hud.brandY,
    `22px ${HUD_FONT_FAMILY}`,
    TELEMETRY_HUD_MUTED_FILL,
    'left',
    'middle',
    inkShadow
  );
  paintLabel(
    ctx,
    formatOverallResonanceScore(input.overallScore),
    hud.textX,
    hud.scoreY,
    `92px ${HUD_FONT_FAMILY}`,
    TELEMETRY_HUD_SCORE_FILL,
    'left',
    'middle',
    { maxWidth: maxW, shadow: TELEMETRY_HUD_SCORE_GLOW }
  );
  paintLabel(
    ctx,
    input.title,
    hud.textX,
    hud.titleY,
    `700 44px ${HUD_TITLE_FONT_FAMILY}`,
    TELEMETRY_HUD_TITLE_FOIL,
    'left',
    'middle',
    { maxWidth: maxW, shadow: TELEMETRY_HUD_TITLE_GLOW }
  );
  paintSpecRule(ctx);

  input.specs.slice(0, 3).forEach((spec, index) => {
    const y = hud.specStartY + index * hud.specRowGap;
    paintLabel(
      ctx,
      spec.kicker,
      hud.textX,
      y,
      `16px ${HUD_FONT_FAMILY}`,
      TELEMETRY_HUD_MUTED_FILL,
      'left',
      'middle',
      inkShadow
    );
    paintLabel(
      ctx,
      spec.title,
      hud.textX,
      y + hud.specTitleDy,
      `24px ${HUD_FONT_FAMILY}`,
      TELEMETRY_HUD_SPEC_TITLE_FILL,
      'left',
      'middle',
      inkShadow
    );
  });
  ctx.restore();
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
        error instanceof TelemetryComposeError ? error : new TelemetryComposeError('encode-failed')
      );
    }
  });
}

function toCertificateInput(input: TelemetryCardInput) {
  const year = input.year ?? new Date().getFullYear();
  return {
    brandHeader: input.brandHeader?.trim() || TELEMETRY_CARD_BRAND,
    overallScore: input.overallScore,
    title: input.title,
    battleCode: input.battleCode,
    year,
    verifiedStamp:
      input.verifiedStamp ?? `VERIFIED PHYSIOLOGICAL SPECIFICATION // ${year}`,
    specs: input.specs,
    meters: input.meters ?? [],
  };
}

/**
 * Rasterize a local telemetry card to a PNG blob.
 * Selfie mode cover-crops `background` and lays a lowered navy eye-care scrim under the HUD.
 * Any background failure paints the black-gold certificate instead of rejecting.
 */
export async function composeTelemetryCard(
  input: TelemetryCardInput,
  deps?: TelemetryComposeDeps
): Promise<Blob> {
  await ensureTelemetrySerifFontsReady();

  const surface = (deps?.createSurface ?? createDomSurface)();
  surface.width = TELEMETRY_CARD_WIDTH;
  surface.height = TELEMETRY_CARD_HEIGHT;
  const ctx = surface.getContext('2d');
  if (!ctx) throw new TelemetryComposeError('no-context');

  const usedSelfie =
    input.mode === 'selfie' ? tryPaintSelfieBackground(ctx, input.background) : false;

  if (usedSelfie) {
    paintHud(ctx, input);
  } else {
    paintCertificatePlate(ctx, toCertificateInput(input));
  }

  return surfaceToPngBlob(surface);
}
