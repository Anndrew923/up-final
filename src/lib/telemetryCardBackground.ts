/**
 * Carbon weave + selfie plate backgrounds for the offline telemetry card.
 * WHY: Isolates expensive fill loops from HUD paint so the composer stays under
 * the 500-line split threshold without mixing layout and weave concerns.
 */
import {
  readBackgroundSize,
  resolveCoverSourceRect,
  type TelemetryBackgroundSource,
} from './telemetryCardCover';
import type { TelemetryDrawContext } from './telemetryCardTypes';

export const TELEMETRY_CARD_WIDTH = 1080;
export const TELEMETRY_CARD_HEIGHT = 1920;

const CARBON_BASE = '#07080c';
/** Scrim is clear at mid-frame and opaque at the bottom edge, over the score dock. */
const SCRIM_START_RATIO = 0.5;

function paintCarbon(ctx: TelemetryDrawContext): void {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = CARBON_BASE;
  ctx.fillRect(0, 0, TELEMETRY_CARD_WIDTH, TELEMETRY_CARD_HEIGHT);

  // Twill: two shallow diagonals. Deterministic — no noise image, no network.
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let offset = -TELEMETRY_CARD_HEIGHT; offset < TELEMETRY_CARD_WIDTH; offset += 16) {
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + TELEMETRY_CARD_HEIGHT, TELEMETRY_CARD_HEIGHT);
  }
  ctx.stroke();

  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  for (let offset = 0; offset < TELEMETRY_CARD_WIDTH + TELEMETRY_CARD_HEIGHT; offset += 16) {
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset - TELEMETRY_CARD_HEIGHT, TELEMETRY_CARD_HEIGHT);
  }
  ctx.stroke();

  // Telemetry grid sits above the weave so the plate still reads as an instrument, not a photo filter.
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = 'rgba(120, 168, 184, 0.45)';
  ctx.beginPath();
  for (let x = 0; x <= TELEMETRY_CARD_WIDTH; x += 54) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TELEMETRY_CARD_HEIGHT);
  }
  for (let y = 0; y <= TELEMETRY_CARD_HEIGHT; y += 54) {
    ctx.moveTo(0, y);
    ctx.lineTo(TELEMETRY_CARD_WIDTH, y);
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(196, 204, 214, 0.72)';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, TELEMETRY_CARD_WIDTH - 56, TELEMETRY_CARD_HEIGHT - 56);
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, TELEMETRY_CARD_WIDTH - 80, TELEMETRY_CARD_HEIGHT - 80);
  ctx.restore();
}

function paintEyeCareScrim(ctx: TelemetryDrawContext): void {
  const y0 = TELEMETRY_CARD_HEIGHT * SCRIM_START_RATIO;
  const gradient = ctx.createLinearGradient(0, y0, 0, TELEMETRY_CARD_HEIGHT);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.45, 'rgba(0,0,0,0.72)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.94)');
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

export function paintTelemetryBackground(
  ctx: TelemetryDrawContext,
  mode: 'carbon' | 'selfie',
  background?: TelemetryBackgroundSource | null
): void {
  if (mode === 'selfie' && background) {
    try {
      if (paintSelfie(ctx, background)) return;
    } catch {
      // A decode or draw failure must still leave a finished plate.
    }
  }
  paintCarbon(ctx);
}
