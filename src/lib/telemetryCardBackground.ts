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

export const TELEMETRY_CARD_WIDTH = 1080;
export const TELEMETRY_CARD_HEIGHT = 1920;

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
