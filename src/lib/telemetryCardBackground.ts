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
import type { TelemetryDrawContext } from './telemetryCardTypes';

/** Logical layout size — all painters keep drawing in this coordinate space. */
export const TELEMETRY_CARD_WIDTH = 1080;
export const TELEMETRY_CARD_HEIGHT = 1920;

/**
 * Physical PNG export multiplier.
 * WHY: Retina / social share needs 3× raster (3240×5760) while layout math stays 1080×1920.
 */
export const TELEMETRY_CARD_EXPORT_SCALE = 3;
export const TELEMETRY_CARD_PIXEL_WIDTH = TELEMETRY_CARD_WIDTH * TELEMETRY_CARD_EXPORT_SCALE;
export const TELEMETRY_CARD_PIXEL_HEIGHT = TELEMETRY_CARD_HEIGHT * TELEMETRY_CARD_EXPORT_SCALE;

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
export function paintCarbonNightPlate(ctx: TelemetryDrawContext): void {
  const vertical = ctx.createLinearGradient(0, 0, 0, TELEMETRY_CARD_HEIGHT);
  vertical.addColorStop(0, TELEMETRY_CERT_NIGHT.top);
  vertical.addColorStop(1, TELEMETRY_CERT_NIGHT.bottom);
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, TELEMETRY_CARD_WIDTH, TELEMETRY_CARD_HEIGHT);

  const cx = TELEMETRY_CARD_WIDTH / 2;
  const cy = TELEMETRY_CARD_HEIGHT / 2;
  const radius = Math.hypot(TELEMETRY_CARD_WIDTH, TELEMETRY_CARD_HEIGHT) / 2;
  const vignette = ctx.createRadialGradient(cx, cy, radius * 0.12, cx, cy, radius);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(0.62, 'rgba(0,0,0,0.16)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, TELEMETRY_CARD_WIDTH, TELEMETRY_CARD_HEIGHT);

  // Micro brushed grain — opacity stays tiny so body copy contrast is unchanged.
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = 'rgba(212,175,55,0.55)';
  ctx.lineWidth = 0.4;
  for (let y = 0; y < TELEMETRY_CARD_HEIGHT; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TELEMETRY_CARD_WIDTH, y + 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Scrim starts lower so more of the selfie stays bright; dock text relies on its
 * own laser glow + ink shadow instead of a near-black veil.
 */
export const TELEMETRY_SELFIE_SCRIM_START_RATIO = 0.58;

/** Mid / floor stops for the navy eye-care veil (shared with unit assertions). */
export const TELEMETRY_SELFIE_SCRIM_STOPS = {
  midOffset: 0.45,
  mid: 'rgba(2,6,14,0.28)',
  floor: 'rgba(2,6,14,0.64)',
} as const;

function paintEyeCareScrim(ctx: TelemetryDrawContext): void {
  const y0 = TELEMETRY_CARD_HEIGHT * TELEMETRY_SELFIE_SCRIM_START_RATIO;
  const gradient = ctx.createLinearGradient(0, y0, 0, TELEMETRY_CARD_HEIGHT);
  gradient.addColorStop(0, 'rgba(2,6,14,0)');
  gradient.addColorStop(TELEMETRY_SELFIE_SCRIM_STOPS.midOffset, TELEMETRY_SELFIE_SCRIM_STOPS.mid);
  gradient.addColorStop(1, TELEMETRY_SELFIE_SCRIM_STOPS.floor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y0, TELEMETRY_CARD_WIDTH, TELEMETRY_CARD_HEIGHT - y0);
}

function paintSelfie(ctx: TelemetryDrawContext, background: TelemetryBackgroundSource): boolean {
  const size = readBackgroundSize(background);
  if (!size) return false;
  const crop = resolveCoverSourceRect(
    size.width,
    size.height,
    TELEMETRY_CARD_WIDTH,
    TELEMETRY_CARD_HEIGHT
  );
  if (!crop) return false;
  ctx.drawImage(
    background,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    TELEMETRY_CARD_WIDTH,
    TELEMETRY_CARD_HEIGHT
  );
  paintEyeCareScrim(ctx);
  return true;
}

/**
 * Attempt selfie cover + eye-care scrim. Returns false so the composer can
 * fall back to the black-gold certificate plate.
 */
export function tryPaintSelfieBackground(
  ctx: TelemetryDrawContext,
  background?: TelemetryBackgroundSource | null
): boolean {
  if (!background) return false;
  try {
    return paintSelfie(ctx, background);
  } catch {
    return false;
  }
}
