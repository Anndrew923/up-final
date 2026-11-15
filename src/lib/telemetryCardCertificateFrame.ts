/**
 * Carbon certificate frame craft — night plate, bevel gold rails, hex rivets, meter gems.
 * WHY: Keeps telemetryCardCertificate under the 500-line split while owning 3D metal paint.
 */
import {
  paintCarbonNightPlate,
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
  TELEMETRY_CERT_FRAME_INSET,
  TELEMETRY_CERT_METAL,
} from './telemetryCardBackground';
import { TELEMETRY_CERT_FOIL } from './telemetryCardCertificateChrome';
import { TELEMETRY_SANS_FONT_STACK } from './telemetryCardFonts';
import { resolveRivetCenters } from './telemetryCardLayout';
import { clearCanvasShadow, type TelemetryDrawContext } from './telemetryCardTypes';

/** Re-export plate inset SSOT for certificate stamp clearance math + tests. */
export { TELEMETRY_CERT_FRAME_INSET };

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
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

/** Hex rivet radius in logical plate pixels (matches prior circular rivet footprint). */
export const TELEMETRY_CERT_RIVET_RADIUS = 7;

/** Corner rivet centers for the default 9:16 plate — SSOT for unit assertions. */
export const TELEMETRY_CERT_RIVET_CENTERS = resolveRivetCenters(
  TELEMETRY_CARD_WIDTH,
  TELEMETRY_CARD_HEIGHT
);

export function withMicroEdgeShadow(ctx: TelemetryDrawContext, paint: () => void): void {
  // WHY: Metal hairlines (rails / rules) only — never wrap fillText; scaled blur fogs glyph edges.
  ctx.shadowColor = 'rgba(0,0,0,0.38)';
  ctx.shadowBlur = 0.5;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0.5;
  paint();
  clearCanvasShadow(ctx);
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
  // WHY: Any shadowBlur under ctx.scale(N) blooms into a soft halo on social JPEG re-encodes.
  clearCanvasShadow(ctx);
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
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
  clearCanvasShadow(ctx);
  ctx.strokeStyle = 'rgba(120,113,108,0.9)';
  ctx.lineWidth = 0.55;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx - 1.6, cy - 1.8, 1.8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(254,243,199,0.62)';
  ctx.fill();
  ctx.restore();
}

export function paintCertificateFrame(
  ctx: TelemetryDrawContext,
  plateWidth = TELEMETRY_CARD_WIDTH,
  plateHeight = TELEMETRY_CARD_HEIGHT
): void {
  const inset = TELEMETRY_CERT_FRAME_INSET;
  ctx.save();
  paintCarbonNightPlate(ctx, plateWidth, plateHeight);

  const outerW = plateWidth - inset * 2;
  const outerH = plateHeight - inset * 2;
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
  const innerW = plateWidth - innerInset * 2;
  const innerH = plateHeight - innerInset * 2;
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

  clearCanvasShadow(ctx);
  for (const [x, y] of resolveRivetCenters(plateWidth, plateHeight)) {
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
  clearCanvasShadow(ctx);
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
    clearCanvasShadow(ctx);
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

/** Column gap between 4:5 KPI strip cells (logical px). */
export const TELEMETRY_CERT_KPI_STRIP_GAP = 28;

/** Vertical offsets from strip band top → label / value / bar / badge baselines. */
export const TELEMETRY_CERT_KPI_STRIP_OFFSETS = {
  label: 18,
  value: 52,
  bar: 82,
  badge: 112,
} as const;

/**
 * 4:5 feed KPI strip — three equal columns (label, large value, gold bar, optional 超限).
 * WHY: Stacked calipers ate the 1350 plate; a strip frees crest/title breathing room.
 */
export function paintCertificateMeterStrip(
  ctx: TelemetryDrawContext,
  meters: readonly TelemetryMeterLine[],
  bandTopY: number
): void {
  const count = Math.min(3, meters.length);
  if (count === 0) return;

  const gap = TELEMETRY_CERT_KPI_STRIP_GAP;
  const colW = (CONTENT_WIDTH - gap * (count - 1)) / count;

  meters.slice(0, count).forEach((meter, index) => {
    const x0 = CONTENT_LEFT + index * (colW + gap);
    const cx = x0 + colW / 2;
    const labelY = bandTopY + TELEMETRY_CERT_KPI_STRIP_OFFSETS.label;
    const valueY = bandTopY + TELEMETRY_CERT_KPI_STRIP_OFFSETS.value;
    const barY = bandTopY + TELEMETRY_CERT_KPI_STRIP_OFFSETS.bar;
    const badgeY = bandTopY + TELEMETRY_CERT_KPI_STRIP_OFFSETS.badge;

    paintCertificateLabel(
      ctx,
      meter.label,
      cx,
      labelY,
      `18px ${FONT}`,
      'rgba(161,161,170,0.95)',
      'center',
      'middle',
      colW
    );
    paintCertificateLabel(
      ctx,
      meter.value,
      cx,
      valueY,
      `bold 36px ${FONT}`,
      meter.badge ? FOIL.light : '#f4f4f5',
      'center',
      'middle',
      colW
    );

    const barInset = 10;
    const barX = x0 + barInset;
    const barW = colW - barInset * 2;
    const fill = Math.min(100, Math.max(0, meter.fillPct));

    ctx.save();
    withMicroEdgeShadow(ctx, () => {
      ctx.strokeStyle = 'rgba(212,175,55,0.35)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(barX, barY);
      ctx.lineTo(barX + barW, barY);
      ctx.stroke();
    });
    if (fill > 0) {
      const fillW = Math.max(6, (barW * fill) / 100);
      const barMetal = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      barMetal.addColorStop(0, METAL.deep);
      barMetal.addColorStop(0.55, METAL.forged);
      barMetal.addColorStop(1, METAL.mirror);
      ctx.strokeStyle = barMetal;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(barX, barY);
      ctx.lineTo(barX + fillW, barY);
      ctx.stroke();
    }
    clearCanvasShadow(ctx);
    ctx.restore();

    if (meter.badge) {
      const bw = Math.min(72, colW - 8);
      const bh = 24;
      ctx.save();
      const badgeMetal = ctx.createLinearGradient(cx - bw / 2, badgeY, cx + bw / 2, badgeY);
      badgeMetal.addColorStop(0, METAL.deep);
      badgeMetal.addColorStop(0.5, METAL.forged);
      badgeMetal.addColorStop(1, METAL.mirror);
      ctx.strokeStyle = badgeMetal;
      ctx.lineWidth = 1.1;
      ctx.strokeRect(cx - bw / 2, badgeY - bh / 2, bw, bh);
      ctx.fillStyle = 'rgba(243,230,200,0.08)';
      ctx.fillRect(cx - bw / 2, badgeY - bh / 2, bw, bh);
      ctx.restore();
      paintCertificateLabel(
        ctx,
        meter.badge,
        cx,
        badgeY,
        `bold 14px ${FONT}`,
        FOIL.light,
        'center',
        'middle'
      );
    }
  });
}
