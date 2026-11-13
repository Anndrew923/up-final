/**
 * Scalable Guilloche seal painter shared by carbon certificate + selfie watermark.
 * WHY: One stroke pipeline prevents selfie hex/"UP" text from drifting away from the
 * AestheticSpecCard / certificate crest while still fitting a smaller top-right seal.
 */
import {
  GUILLOCHE_MONOGRAM_CENTER,
  GUILLOCHE_UP_POLYLINES,
} from './guillocheMonogramPaths';
import type { TelemetryDrawContext } from './telemetryCardTypes';

/** Certificate crest outer ring — reference scale for proportional geometry. */
export const GUILLOCHE_SEAL_REF_OUTER_RADIUS = 118;

export interface GuillocheSealBackdrop {
  /** Center stop color (typically dark for selfie, amber wash for carbon). */
  core: string;
  mid?: string;
  /** Outer fade — usually fully transparent. */
  edge?: string;
  /** Glow disc radius; defaults to outerRadius * (130/118). */
  radius?: number;
}

export interface PaintGuillocheSealInput {
  cx: number;
  cy: number;
  /** Outer gold ring radius in plate pixels. */
  outerRadius: number;
  backdrop?: GuillocheSealBackdrop;
}

function strokeMonogramPolyline(
  ctx: TelemetryDrawContext,
  points: ReadonlyArray<readonly [number, number]>,
  cx: number,
  cy: number,
  scale: number
): void {
  const first = points[0];
  if (!first) return;
  const origin = GUILLOCHE_MONOGRAM_CENTER;
  ctx.beginPath();
  ctx.moveTo(cx + (first[0] - origin) * scale, cy + (first[1] - origin) * scale);
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (!point) continue;
    ctx.lineTo(cx + (point[0] - origin) * scale, cy + (point[1] - origin) * scale);
  }
  ctx.stroke();
}

function paintApexDiamond(
  ctx: TelemetryDrawContext,
  cx: number,
  tipY: number,
  size: number
): void {
  ctx.beginPath();
  ctx.moveTo(cx, tipY - size);
  ctx.lineTo(cx + size * 0.55, tipY);
  ctx.lineTo(cx, tipY + size);
  ctx.lineTo(cx - size * 0.55, tipY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
  ctx.lineWidth = Math.max(0.6, size * 0.18);
  ctx.stroke();
}

/**
 * Paint dual rings, tick teeth, hex shield + apex diamonds, and vector UP monogram.
 * Never uses fillText("UP"). Clears any residual shadow before returning.
 */
export function paintGuillocheSeal(
  ctx: TelemetryDrawContext,
  input: PaintGuillocheSealInput
): void {
  const { cx, cy, outerRadius, backdrop } = input;
  const r = Math.max(1, outerRadius);
  const k = r / GUILLOCHE_SEAL_REF_OUTER_RADIUS;
  const ringInner = r * (108 / GUILLOCHE_SEAL_REF_OUTER_RADIUS);
  const tickOuter = r * (116 / GUILLOCHE_SEAL_REF_OUTER_RADIUS);
  const tickMajorInner = r * (100 / GUILLOCHE_SEAL_REF_OUTER_RADIUS);
  const tickMinorInner = r * (104 / GUILLOCHE_SEAL_REF_OUTER_RADIUS);
  const hexR = r * (72 / GUILLOCHE_SEAL_REF_OUTER_RADIUS);
  const monogramScale = hexR / 21;
  const glowR = backdrop?.radius ?? r * (130 / GUILLOCHE_SEAL_REF_OUTER_RADIUS);

  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (backdrop) {
    const glow = ctx.createRadialGradient(cx, cy, Math.max(2, glowR * 0.06), cx, cy, glowR);
    glow.addColorStop(0, backdrop.core);
    glow.addColorStop(0.55, backdrop.mid ?? backdrop.core);
    glow.addColorStop(1, backdrop.edge ?? 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(251,191,36,0.62)';
  ctx.lineWidth = Math.max(1, 2 * k);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = Math.max(0.75, 1.25 * k);
  ctx.beginPath();
  ctx.arc(cx, cy, ringInner, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 60; i += 1) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    const inner = major ? tickMajorInner : tickMinorInner;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * tickOuter, cy + Math.sin(a) * tickOuter);
    ctx.strokeStyle = major ? 'rgba(251,191,36,0.75)' : 'rgba(251,191,36,0.4)';
    ctx.lineWidth = major ? Math.max(1, 2 * k) : Math.max(0.6, 1 * k);
    ctx.stroke();
  }

  // Cardinal micro-tips (N/E/S/W) — reinforce compass lock beyond the 60-tooth ring.
  const cross = hexR * 0.12;
  ctx.strokeStyle = 'rgba(251,191,36,0.7)';
  ctx.lineWidth = Math.max(0.8, 1.2 * k);
  for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const ux = Math.cos(a - Math.PI / 2);
    const uy = Math.sin(a - Math.PI / 2);
    const ox = cx + ux * tickOuter;
    const oy = cy + uy * tickOuter;
    ctx.beginPath();
    ctx.moveTo(ox - uy * cross, oy + ux * cross);
    ctx.lineTo(ox + uy * cross, oy - ux * cross);
    ctx.stroke();
  }

  const hex: Array<[number, number]> = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 90);
    hex.push([cx + Math.cos(a) * hexR, cy + Math.sin(a) * hexR]);
  }
  ctx.beginPath();
  ctx.moveTo(hex[0]![0], hex[0]![1]);
  for (let i = 1; i < hex.length; i += 1) ctx.lineTo(hex[i]![0], hex[i]![1]);
  ctx.closePath();
  ctx.fillStyle = 'rgba(251,191,36,0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251,191,36,0.55)';
  ctx.lineWidth = Math.max(1.25, 3 * k);
  ctx.stroke();

  const diamond = Math.max(1.6, hexR * 0.085);
  paintApexDiamond(ctx, cx, cy - hexR, diamond);
  paintApexDiamond(ctx, cx, cy + hexR, diamond);

  ctx.strokeStyle = 'rgba(252, 211, 77, 0.88)';
  ctx.lineWidth = Math.max(1.4, 1.3 * (monogramScale / 2.2));
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const path of GUILLOCHE_UP_POLYLINES) {
    strokeMonogramPolyline(ctx, path, cx, cy, monogramScale);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
}
