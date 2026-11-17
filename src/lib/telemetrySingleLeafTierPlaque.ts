/**
 * Ceremonial mid-axis tier plaque for single-leaf selfie HUD only.
 * WHY: Keeps dual-hero orchestration under the 500-line split threshold while
 * carbon retains its simple single-stroke capsule in dualHero.
 */
import { TELEMETRY_SANS_FONT_STACK } from './telemetryCardFonts';
import {
  clearCanvasShadow,
  type TelemetryDrawContext,
} from './telemetryCardTypes';

const SANS = TELEMETRY_SANS_FONT_STACK;

export const SELFIE_TIER_CAPSULE_FONT_PX = 34;
export const SELFIE_TIER_CAPSULE_PAD_X = 48;
export const SELFIE_TIER_CAPSULE_HEIGHT = 66;
export const SELFIE_TIER_CAPSULE_MIN_WIDTH = 280;
export const SELFIE_TIER_CAPSULE_FILL = '#FDE68A';
export const SELFIE_TIER_WING_OUTSET_PX = 14;
export const SELFIE_TIER_WING_DIAMOND_PX = 6;
export const SELFIE_TIER_WING_RAY_PX = 96;

/** Half-span of diamond + ray past the pill edge — keeps wings inside content gutters. */
export function resolveSelfieTierWingReachPx(): number {
  return (
    SELFIE_TIER_WING_OUTSET_PX +
    SELFIE_TIER_WING_DIAMOND_PX / 2 +
    SELFIE_TIER_WING_RAY_PX
  );
}

export function resolveSelfieTierPillMaxWidth(contentWidth: number): number {
  return Math.max(140, contentWidth - 2 * resolveSelfieTierWingReachPx());
}

function paintDiamond(
  ctx: TelemetryDrawContext,
  cx: number,
  cy: number,
  size: number,
  fill: string
): void {
  const h = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx + h, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx - h, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Dual-frame metal plaque + flanking diamond wing rays (selfie HUD only). */
export function paintSelfieCeremonialTierCapsule(
  ctx: TelemetryDrawContext,
  text: string,
  cx: number,
  y: number,
  maxWidth: number
): void {
  let fontPx = SELFIE_TIER_CAPSULE_FONT_PX;
  let font = `bold ${fontPx}px ${SANS}`;
  try {
    ctx.font = font;
  } catch {
    ctx.font = `bold ${fontPx}px sans-serif`;
  }
  const padX = SELFIE_TIER_CAPSULE_PAD_X;
  let tw = ctx.measureText(text).width;
  while (tw + padX * 2 > maxWidth && fontPx > 16) {
    fontPx -= 1;
    font = `bold ${fontPx}px ${SANS}`;
    try {
      ctx.font = font;
    } catch {
      break;
    }
    tw = ctx.measureText(text).width;
  }
  // WHY: minWidth 280 keeps short ZH titles (高階玩家) on a thick metal plaque base.
  const bw = Math.min(maxWidth, Math.max(SELFIE_TIER_CAPSULE_MIN_WIDTH, tw + padX * 2));
  const bh = SELFIE_TIER_CAPSULE_HEIGHT;
  const left = cx - bw / 2;
  const top = y - bh / 2;
  const right = left + bw;

  ctx.save();
  // Wings under the plate so metal occludes the inner ray tips.
  for (const side of [-1, 1] as const) {
    const edge = side < 0 ? left : right;
    const diamondCx = edge + side * SELFIE_TIER_WING_OUTSET_PX;
    const rayStart = diamondCx + side * (SELFIE_TIER_WING_DIAMOND_PX / 2);
    const rayEnd = rayStart + side * SELFIE_TIER_WING_RAY_PX;
    const grad = ctx.createLinearGradient(rayStart, y, rayEnd, y);
    grad.addColorStop(0, 'rgba(212, 175, 55, 0.65)');
    grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(rayStart, y);
    ctx.lineTo(rayEnd, y);
    ctx.stroke();
    paintDiamond(ctx, diamondCx, y, SELFIE_TIER_WING_DIAMOND_PX, '#D4AF37');
  }

  const plateGrad = ctx.createLinearGradient(left, y, right, y);
  plateGrad.addColorStop(0, 'rgba(212, 175, 55, 0.26)');
  plateGrad.addColorStop(0.5, 'rgba(253, 230, 138, 0.14)');
  plateGrad.addColorStop(1, 'rgba(212, 175, 55, 0.26)');
  ctx.shadowColor = 'rgba(212, 175, 55, 0.42)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = plateGrad;
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  ctx.fillRect(left, top, bw, bh);
  ctx.strokeRect(left, top, bw, bh);
  clearCanvasShadow(ctx);

  ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
  ctx.lineWidth = 0.75;
  ctx.strokeRect(left + 4, top + 4, bw - 8, bh - 8);

  ctx.shadowColor = 'rgba(0,0,0,0.88)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = SELFIE_TIER_CAPSULE_FILL;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try {
    ctx.font = font;
    ctx.fillText(text, cx, y, bw - 12);
  } catch {
    /* skip */
  }
  clearCanvasShadow(ctx);
  ctx.restore();
}
