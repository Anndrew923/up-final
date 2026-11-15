/**
 * Carbon certificate frame craft — night plate, bevel gold rails, hex rivets, meter gems.
 * WHY: Keeps telemetryCardCertificate under the 500-line split while owning 3D metal paint.
 */
import {
  paintCarbonNightPlate,
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
  TELEMETRY_CERT_METAL,
} from './telemetryCardBackground';
import { TELEMETRY_CERT_FOIL } from './telemetryCardCertificateChrome';
import { TELEMETRY_SANS_FONT_STACK } from './telemetryCardFonts';
import type { TelemetryDrawContext } from './telemetryCardTypes';

/** Outer foil inset — SSOT for frame stroke, rivets, and stamp clearance math. */
export const TELEMETRY_CERT_FRAME_INSET = 48;

/** Meter row contract shared by plate layout + export input builders. */
export interface TelemetryMeterLine {
  label: string;
  value: string;
  fillPct: number;
  badge: string | null;
}

const FOIL = TELEMETRY_CERT_FOIL;
const METAL = TELEMETRY_CERT_METAL;
const FONT = TELEMETRY_SANS_FONT_STACK;
const CONTENT_LEFT = 96;
const CONTENT_RIGHT = TELEMETRY_CARD_WIDTH - 96;

/** Hex rivet radius in logical plate pixels (matches prior circular rivet footprint). */
export const TELEMETRY_CERT_RIVET_RADIUS = 7;

/** Corner rivet centers — SSOT for craft paint + unit assertions. */
export const TELEMETRY_CERT_RIVET_CENTERS: ReadonlyArray<readonly [number, number]> = [
  [TELEMETRY_CERT_FRAME_INSET + 18, TELEMETRY_CERT_FRAME_INSET + 18],
  [TELEMETRY_CARD_WIDTH - TELEMETRY_CERT_FRAME_INSET - 18, TELEMETRY_CERT_FRAME_INSET + 18],
  [TELEMETRY_CERT_FRAME_INSET + 18, TELEMETRY_CARD_HEIGHT - TELEMETRY_CERT_FRAME_INSET - 18],
  [
    TELEMETRY_CARD_WIDTH - TELEMETRY_CERT_FRAME_INSET - 18,
    TELEMETRY_CARD_HEIGHT - TELEMETRY_CERT_FRAME_INSET - 18,
  ],
];

function clearMicroShadow(ctx: TelemetryDrawContext): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function withMicroEdgeShadow(ctx: TelemetryDrawContext, paint: () => void): void {
  // WHY: Sub-pixel hairlines read soft on phone screens; a 0.5 blur micro-shadow locks edges.
  ctx.shadowColor = 'rgba(0,0,0,0.38)';
  ctx.shadowBlur = 0.5;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0.5;
  paint();
  clearMicroShadow(ctx);
}

export function paintCertificateLabel(
  ctx: TelemetryDrawContext,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string,
  align: CanvasTextAlign,
  baseline: CanvasTextBaseline,
  maxWidth?: number
): void {
  if (!text) return;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  withMicroEdgeShadow(ctx, () => {
    try {
      ctx.font = font;
      ctx.fillText(text, x, y, maxWidth);
    } catch {
      try {
        ctx.font = '28px sans-serif';
        ctx.fillText(text, x, y, maxWidth);
      } catch {
        /* plate still encodes without this run */
      }
    }
  });
}

function paintHexRivet(ctx: TelemetryDrawContext, cx: number, cy: number): void {
  const r = TELEMETRY_CERT_RIVET_RADIUS;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 2.5;
  ctx.shadowOffsetX = 0.5;
  ctx.shadowOffsetY = 1;

  const fill = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0.6, cx, cy, r);
  fill.addColorStop(0, METAL.mirror);
  fill.addColorStop(0.42, METAL.forged);
  fill.addColorStop(1, METAL.deep);

  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 90);
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  clearMicroShadow(ctx);
  ctx.strokeStyle = 'rgba(120,113,108,0.9)';
  ctx.lineWidth = 0.55;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx - 1.6, cy - 1.8, 1.8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(254,243,199,0.62)';
  ctx.fill();
  ctx.restore();
}

export function paintCertificateFrame(ctx: TelemetryDrawContext): void {
  const inset = TELEMETRY_CERT_FRAME_INSET;
  ctx.save();
  paintCarbonNightPlate(ctx);

  const outerW = TELEMETRY_CARD_WIDTH - inset * 2;
  const outerH = TELEMETRY_CARD_HEIGHT - inset * 2;
  const outerMetal = ctx.createLinearGradient(inset, inset, inset + outerW, inset + outerH);
  outerMetal.addColorStop(0, METAL.mirror);
  outerMetal.addColorStop(0.45, METAL.forged);
  outerMetal.addColorStop(1, METAL.deep);
  ctx.strokeStyle = outerMetal;
  ctx.lineWidth = 3.25;
  ctx.shadowColor = 'rgba(212,175,55,0.32)';
  ctx.shadowBlur = 0.5;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeRect(inset, inset, outerW, outerH);

  const innerInset = inset + 10;
  const innerW = TELEMETRY_CARD_WIDTH - innerInset * 2;
  const innerH = TELEMETRY_CARD_HEIGHT - innerInset * 2;
  const innerMetal = ctx.createLinearGradient(
    innerInset + innerW,
    innerInset + innerH,
    innerInset,
    innerInset
  );
  innerMetal.addColorStop(0, METAL.deep);
  innerMetal.addColorStop(0.5, METAL.forged);
  innerMetal.addColorStop(1, 'rgba(255,253,242,0.55)');
  ctx.strokeStyle = innerMetal;
  ctx.lineWidth = 1.75;
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 0.5;
  ctx.strokeRect(innerInset, innerInset, innerW, innerH);

  clearMicroShadow(ctx);
  for (const [x, y] of TELEMETRY_CERT_RIVET_CENTERS) {
    paintHexRivet(ctx, x, y);
  }
  ctx.restore();
}

export function paintCertificateMeterRow(
  ctx: TelemetryDrawContext,
  meter: TelemetryMeterLine,
  y: number
): void {
  const labelX = CONTENT_LEFT;
  const valueX = CONTENT_LEFT + 210;
  const trackX = CONTENT_LEFT + 320;
  const trackW = 420;
  const badgeX = CONTENT_RIGHT;

  paintCertificateLabel(
    ctx,
    meter.label,
    labelX,
    y,
    `22px ${FONT}`,
    'rgba(161,161,170,0.95)',
    'left',
    'middle',
    200
  );
  paintCertificateLabel(
    ctx,
    meter.value,
    valueX,
    y,
    `bold 26px ${FONT}`,
    meter.badge ? FOIL.light : '#f4f4f5',
    'left',
    'middle',
    100
  );

  ctx.save();
  // Gold gear-rail: spine + 21 teeth (same fillPct geometry as before).
  withMicroEdgeShadow(ctx, () => {
    ctx.strokeStyle = 'rgba(212,175,55,0.62)';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(trackX, y);
    ctx.lineTo(trackX + trackW, y);
    ctx.stroke();
  });
  for (let i = 0; i <= 20; i += 1) {
    const tx = trackX + (trackW * i) / 20;
    const major = i % 5 === 0;
    ctx.beginPath();
    ctx.moveTo(tx, y - (major ? 6.5 : 4.5));
    ctx.lineTo(tx, y + (major ? 6.5 : 4.5));
    ctx.strokeStyle = major ? 'rgba(255,253,242,0.55)' : 'rgba(212,175,55,0.42)';
    ctx.lineWidth = major ? 1.15 : 0.75;
    ctx.stroke();
  }

  const fill = Math.min(100, Math.max(0, meter.fillPct));
  const needleX = trackX + (trackW * fill) / 100;
  const gemR = 6;
  const gem = ctx.createRadialGradient(needleX - 2, y - 2.4, 0.4, needleX, y, gemR);
  gem.addColorStop(0, METAL.mirror);
  gem.addColorStop(0.35, FOIL.light);
  gem.addColorStop(0.72, METAL.forged);
  gem.addColorStop(1, METAL.deep);
  ctx.shadowColor = 'rgba(212,175,55,0.55)';
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.arc(needleX, y, gemR, 0, Math.PI * 2);
  ctx.fillStyle = gem;
  ctx.fill();
  clearMicroShadow(ctx);
  // Micro star glint — reads as a bearing jewel at 3× export.
  ctx.strokeStyle = 'rgba(255,253,242,0.88)';
  ctx.lineWidth = 0.65;
  ctx.beginPath();
  ctx.moveTo(needleX, y - gemR - 1.4);
  ctx.lineTo(needleX, y + gemR + 1.4);
  ctx.moveTo(needleX - gemR - 1.4, y);
  ctx.lineTo(needleX + gemR + 1.4, y);
  ctx.stroke();
  ctx.restore();

  if (meter.badge) {
    const bw = 78;
    const bh = 28;
    ctx.save();
    const badgeMetal = ctx.createLinearGradient(badgeX - bw, y, badgeX, y);
    badgeMetal.addColorStop(0, METAL.deep);
    badgeMetal.addColorStop(0.5, METAL.forged);
    badgeMetal.addColorStop(1, METAL.mirror);
    ctx.strokeStyle = badgeMetal;
    ctx.lineWidth = 1.1;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 0.5;
    ctx.strokeRect(badgeX - bw, y - bh / 2, bw, bh);
    clearMicroShadow(ctx);
    ctx.fillStyle = 'rgba(243,230,200,0.08)';
    ctx.fillRect(badgeX - bw, y - bh / 2, bw, bh);
    ctx.restore();
    paintCertificateLabel(
      ctx,
      meter.badge,
      badgeX - bw / 2,
      y,
      `bold 16px ${FONT}`,
      FOIL.light,
      'center',
      'middle'
    );
  }
}
