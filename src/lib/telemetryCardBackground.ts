/**
 * Selfie plate background for the offline telemetry card.
 * WHY: Isolates cover-crop + eye-care scrim from HUD/certificate paint.
 * Carbon (no-selfie) plates are painted by telemetryCardCertificate — the old
 * weave grid is intentionally gone so Share Card matches the DOM plaque.
 */
import {
  readBackgroundSize,
  resolveCoverSourceRect,
  type TelemetryBackgroundSource,
} from './telemetryCardCover';
import type { TelemetryCardAspectRatio, TelemetryDrawContext } from './telemetryCardTypes';

export type { TelemetryCardAspectRatio } from './telemetryCardTypes';

/** Logical width is shared — only height changes between aspects. */
export const TELEMETRY_CARD_WIDTH = 1080;

/**
 * Outer foil inset shared by frame paint + layout rivet math.
 * WHY: Lives next to plate size SSOT so layout cannot drift from certificateFrame.
 */
export const TELEMETRY_CERT_FRAME_INSET = 48;

/**
 * Physical PNG export multiplier.
 * WHY: 2× stays Retina-sharp without the social-thumbnail bilinear mush of 3×.
 */
export const TELEMETRY_CARD_EXPORT_SCALE = 2;

const LOGICAL_SIZE_BY_ASPECT = {
  '9:16': { width: TELEMETRY_CARD_WIDTH, height: 1920 },
  '4:5': { width: TELEMETRY_CARD_WIDTH, height: 1350 },
} as const;

export interface TelemetryCardSize {
  aspect: TelemetryCardAspectRatio;
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
  exportScale: number;
}

export function resolveTelemetryCardSize(
  aspect: TelemetryCardAspectRatio = '9:16'
): TelemetryCardSize {
  const logical = LOGICAL_SIZE_BY_ASPECT[aspect];
  return {
    aspect,
    width: logical.width,
    height: logical.height,
    pixelWidth: logical.width * TELEMETRY_CARD_EXPORT_SCALE,
    pixelHeight: logical.height * TELEMETRY_CARD_EXPORT_SCALE,
    exportScale: TELEMETRY_CARD_EXPORT_SCALE,
  };
}

/** 9:16 logical height — kept as number (not literal) so aspect-aware painters can pass 1350. */
export const TELEMETRY_CARD_HEIGHT: number = LOGICAL_SIZE_BY_ASPECT['9:16'].height;
export const TELEMETRY_CARD_PIXEL_WIDTH: number =
  LOGICAL_SIZE_BY_ASPECT['9:16'].width * TELEMETRY_CARD_EXPORT_SCALE;
export const TELEMETRY_CARD_PIXEL_HEIGHT: number =
  LOGICAL_SIZE_BY_ASPECT['9:16'].height * TELEMETRY_CARD_EXPORT_SCALE;

/** Night-metal plate stops — eliminates flat `#07080c` banding on carbon exports. */
export const TELEMETRY_CERT_NIGHT = {
  top: '#0F1115',
  bottom: '#050608',
} as const;

/** Cast-metal foil stops shared by bevel frame + hex rivets + meter gems. */
export const TELEMETRY_CERT_METAL = {
  mirror: '#FFFDF2',
  forged: '#D4AF37',
  deep: '#5C4714',
} as const;

/**
 * Dark brushed night plate under the carbon certificate chrome.
 * WHY: Pure black fills clip on OLED / compressed JPEG re-encodes; a vertical
 * metal wash + soft concentric vignette keeps depth without shifting layout.
 */
export function paintCarbonNightPlate(
  ctx: TelemetryDrawContext,
  plateWidth = TELEMETRY_CARD_WIDTH,
  plateHeight = TELEMETRY_CARD_HEIGHT
): void {
  const vertical = ctx.createLinearGradient(0, 0, 0, plateHeight);
  vertical.addColorStop(0, TELEMETRY_CERT_NIGHT.top);
  vertical.addColorStop(1, TELEMETRY_CERT_NIGHT.bottom);
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, plateWidth, plateHeight);

  const cx = plateWidth / 2;
  const cy = plateHeight / 2;
  const radius = Math.hypot(plateWidth, plateHeight) / 2;
  const vignette = ctx.createRadialGradient(cx, cy, radius * 0.12, cx, cy, radius);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.62, 'rgba(0,0,0,0.16)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, plateWidth, plateHeight);

  // Micro brushed grain — opacity stays tiny so body copy contrast is unchanged.
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = 'rgba(212,175,55,0.55)';
  ctx.lineWidth = 0.4;
  for (let y = 0; y < plateHeight; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(plateWidth, y + 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Scrim starts mid-frame so the lowered HUD sits on a dark bed; floor opacity
 * must crush bright shirts / gym-mirror glare under radar labels + score dock.
 */
export const TELEMETRY_SELFIE_SCRIM_START_RATIO = 0.45;

/** Mid / floor stops for the navy eye-care veil (shared with unit assertions). */
export const TELEMETRY_SELFIE_SCRIM_STOPS = {
  midOffset: 0.45,
  mid: 'rgba(2,6,14,0.42)',
  floor: 'rgba(2,6,14,0.86)',
} as const;

function paintEyeCareScrim(
  ctx: TelemetryDrawContext,
  plateWidth: number,
  plateHeight: number
): void {
  const y0 = plateHeight * TELEMETRY_SELFIE_SCRIM_START_RATIO;
  const gradient = ctx.createLinearGradient(0, y0, 0, plateHeight);
  gradient.addColorStop(0, 'rgba(2,6,14,0)');
  gradient.addColorStop(TELEMETRY_SELFIE_SCRIM_STOPS.midOffset, TELEMETRY_SELFIE_SCRIM_STOPS.mid);
  gradient.addColorStop(1, TELEMETRY_SELFIE_SCRIM_STOPS.floor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y0, plateWidth, plateHeight - y0);
}

function paintSelfie(
  ctx: TelemetryDrawContext,
  background: TelemetryBackgroundSource,
  plateWidth: number,
  plateHeight: number
): boolean {
  const size = readBackgroundSize(background);
  if (!size) return false;
  const crop = resolveCoverSourceRect(size.width, size.height, plateWidth, plateHeight);
  if (!crop) return false;
  ctx.drawImage(
    background,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    plateWidth,
    plateHeight
  );
  paintEyeCareScrim(ctx, plateWidth, plateHeight);
  return true;
}

/**
 * Attempt selfie cover + eye-care scrim. Returns false so the composer can
 * fall back to the black-gold certificate plate.
 */
export function tryPaintSelfieBackground(
  ctx: TelemetryDrawContext,
  background?: TelemetryBackgroundSource | null,
  plateWidth = TELEMETRY_CARD_WIDTH,
  plateHeight = TELEMETRY_CARD_HEIGHT
): boolean {
  if (!background) return false;
  try {
    return paintSelfie(ctx, background, plateWidth, plateHeight);
  } catch {
    return false;
  }
}
