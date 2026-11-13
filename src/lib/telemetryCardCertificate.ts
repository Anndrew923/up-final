/**
 * Offline carbon plate — raster black-gold physiological certificate (1080×1920).
 * WHY: Share Card without a selfie must match the DOM AestheticSpecCard, not the
 * dark telemetry weave + radar HUD used under selfie scrims.
 */
import { formatOverallResonanceScore } from '../logic/core/scoring';
import {
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
import {
  paintCertificateCrest,
  paintCertificateFoilTitle,
  paintCertificateTrackedStamp,
  TELEMETRY_CERT_CREST_CENTER,
  TELEMETRY_CERT_FOIL,
  TELEMETRY_CERT_STAMP_TRACKING_PX,
  TELEMETRY_CERT_TITLE_Y,
} from './telemetryCardCertificateChrome';
import { TELEMETRY_SANS_FONT_STACK } from './telemetryCardFonts';
import type { TelemetryDrawContext } from './telemetryCardTypes';

const FOIL = TELEMETRY_CERT_FOIL;
const CERT_BASE = '#07080c';
const FONT = TELEMETRY_SANS_FONT_STACK;
const INSET = 48;
/** Distance from canvas edge to the inner foil stroke (outer INSET + inner offset). */
export const TELEMETRY_CERT_INNER_FRAME_INSET = INSET + 10;
/** Stamp baseline must stay this many px above the inner foil bottom edge. */
export const TELEMETRY_CERT_STAMP_CLEARANCE_PX = 24;
export const TELEMETRY_CERT_STAMP_MAX_Y =
  TELEMETRY_CARD_HEIGHT - TELEMETRY_CERT_INNER_FRAME_INSET - TELEMETRY_CERT_STAMP_CLEARANCE_PX;
const BATTLE_CODE_ABOVE_STAMP_PX = 48;
const FOOTER_RULE_ABOVE_BATTLE_PX = 40;
const CONTENT_LEFT = 96;
const CONTENT_RIGHT = TELEMETRY_CARD_WIDTH - 96;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

export interface TelemetryMeterLine {
  label: string;
  value: string;
  fillPct: number;
  badge: string | null;
}

export interface TelemetryCertificatePaintInput {
  brandHeader: string;
  overallScore: number;
  title: string;
  battleCode: string;
  year: number;
  verifiedStamp: string;
  specs: readonly { kicker: string; title: string; subtitle?: string }[];
  meters: readonly TelemetryMeterLine[];
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
  maxWidth?: number
): void {
  if (!text) return;
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

function wrapLines(
  ctx: TelemetryDrawContext,
  text: string,
  font: string,
  maxWidth: number,
  maxLines: number
): string[] {
  if (!text) return [];
  ctx.font = font;
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = '';
  for (const ch of chars) {
    const next = current + ch;
    let width = 0;
    try {
      width = ctx.measureText(next).width;
    } catch {
      width = next.length * 14;
    }
    if (width > maxWidth && current) {
      lines.push(current);
      current = ch;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function paintFrame(ctx: TelemetryDrawContext): void {
  ctx.save();
  ctx.fillStyle = CERT_BASE;
  ctx.fillRect(0, 0, TELEMETRY_CARD_WIDTH, TELEMETRY_CARD_HEIGHT);

  ctx.strokeStyle = 'rgba(201,162,39,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(INSET, INSET, TELEMETRY_CARD_WIDTH - INSET * 2, TELEMETRY_CARD_HEIGHT - INSET * 2);
  ctx.strokeStyle = 'rgba(161,161,170,0.28)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    INSET + 10,
    INSET + 10,
    TELEMETRY_CARD_WIDTH - (INSET + 10) * 2,
    TELEMETRY_CARD_HEIGHT - (INSET + 10) * 2
  );

  const rivets: Array<[number, number]> = [
    [INSET + 18, INSET + 18],
    [TELEMETRY_CARD_WIDTH - INSET - 18, INSET + 18],
    [INSET + 18, TELEMETRY_CARD_HEIGHT - INSET - 18],
    [TELEMETRY_CARD_WIDTH - INSET - 18, TELEMETRY_CARD_HEIGHT - INSET - 18],
  ];
  for (const [x, y] of rivets) {
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = FOIL.mid;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 1.5, y - 1.5, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = FOIL.light;
    ctx.fill();
  }
  ctx.restore();
}

function paintMeterRow(
  ctx: TelemetryDrawContext,
  meter: TelemetryMeterLine,
  y: number
): void {
  const labelX = CONTENT_LEFT;
  const valueX = CONTENT_LEFT + 210;
  const trackX = CONTENT_LEFT + 320;
  const trackW = 420;
  const badgeX = CONTENT_RIGHT;

  paintLabel(
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
  paintLabel(
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
  ctx.strokeStyle = 'rgba(201,162,39,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(trackX, y);
  ctx.lineTo(trackX + trackW, y);
  ctx.stroke();
  for (let i = 0; i <= 20; i += 1) {
    const tx = trackX + (trackW * i) / 20;
    ctx.beginPath();
    ctx.moveTo(tx, y - 5);
    ctx.lineTo(tx, y + 5);
    ctx.strokeStyle = 'rgba(201,162,39,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const fill = Math.min(100, Math.max(0, meter.fillPct));
  const needleX = trackX + (trackW * fill) / 100;
  ctx.beginPath();
  ctx.arc(needleX, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = FOIL.light;
  ctx.fill();
  ctx.restore();

  if (meter.badge) {
    const bw = 78;
    const bh = 28;
    ctx.save();
    ctx.strokeStyle = 'rgba(201,162,39,0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(badgeX - bw, y - bh / 2, bw, bh);
    ctx.fillStyle = 'rgba(243,230,200,0.12)';
    ctx.fillRect(badgeX - bw, y - bh / 2, bw, bh);
    ctx.restore();
    paintLabel(
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

function measureWidth(
  ctx: TelemetryDrawContext,
  text: string,
  font: string,
  fallbackPerChar: number
): number {
  try {
    ctx.font = font;
    return ctx.measureText(text).width;
  } catch {
    return text.length * fallbackPerChar;
  }
}

function paintRule(ctx: TelemetryDrawContext, y: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(201,162,39,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CONTENT_LEFT, y);
  ctx.lineTo(CONTENT_RIGHT, y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Paint the full black-gold certificate plate.
 * WHY: Spec block height varies with wrapped subtitles — meter/footer Y is derived
 * from content so long copy cannot collide with calipers, and a fixed bottom band
 * keeps the last meter clear of the foil frame.
 */
export function paintCertificatePlate(
  ctx: TelemetryDrawContext,
  input: TelemetryCertificatePaintInput
): void {
  paintFrame(ctx);

  const brand = input.brandHeader.trim();
  const brandFont = `26px ${FONT}`;
  const scoreFont = `bold 30px ${FONT}`;
  const yearFont = `26px ${FONT}`;
  const scoreText = formatOverallResonanceScore(input.overallScore);
  const yearText = String(input.year);
  const scoreW = measureWidth(ctx, scoreText, scoreFont, 18);
  const yearW = measureWidth(ctx, yearText, yearFont, 16);
  // Leave room for score + year on the same baseline — long EN brand must truncate first.
  const brandMax = Math.max(160, CONTENT_WIDTH - scoreW - yearW - 48);
  const brandWidth = Math.min(measureWidth(ctx, brand, brandFont, 16), brandMax);

  paintLabel(
    ctx,
    brand,
    CONTENT_LEFT,
    120,
    brandFont,
    'rgba(161,161,170,0.95)',
    'left',
    'middle',
    brandMax
  );
  paintLabel(
    ctx,
    scoreText,
    CONTENT_LEFT + brandWidth + 20,
    120,
    scoreFont,
    '#f4f4f5',
    'left',
    'middle'
  );
  paintLabel(
    ctx,
    yearText,
    CONTENT_RIGHT,
    120,
    yearFont,
    'rgba(113,113,122,0.95)',
    'right',
    'middle'
  );

  paintRule(ctx, 158);
  paintCertificateCrest(ctx, TELEMETRY_CERT_CREST_CENTER.x, TELEMETRY_CERT_CREST_CENTER.y);
  paintCertificateFoilTitle(
    ctx,
    input.title,
    TELEMETRY_CARD_WIDTH / 2,
    TELEMETRY_CERT_TITLE_Y
  );

  let specY = 720;
  for (const spec of input.specs.slice(0, 3)) {
    paintLabel(
      ctx,
      spec.kicker,
      CONTENT_LEFT,
      specY,
      `22px ${FONT}`,
      'rgba(201,162,39,0.85)',
      'left',
      'middle',
      220
    );
    paintLabel(
      ctx,
      spec.title,
      CONTENT_LEFT + 250,
      specY,
      `bold 30px ${FONT}`,
      '#f4f4f5',
      'left',
      'middle',
      CONTENT_WIDTH - 250
    );
    if (spec.subtitle) {
      const subFont = `22px ${FONT}`;
      const lines = wrapLines(ctx, spec.subtitle, subFont, CONTENT_WIDTH - 250, 2);
      lines.forEach((line, index) => {
        paintLabel(
          ctx,
          line,
          CONTENT_LEFT + 250,
          specY + 36 + index * 28,
          subFont,
          'rgba(113,113,122,0.95)',
          'left',
          'middle',
          CONTENT_WIDTH - 250
        );
      });
      specY += 36 + lines.length * 28 + 36;
    } else {
      specY += 72;
    }
  }

  const meterGap = 90;
  const meterCount = Math.min(3, input.meters.length);
  const metersBlock = meterCount > 0 ? meterCount * meterGap : 0;
  // WHY: Named caps — long wrapped specs must never push stamp onto the inner foil.
  const stampMaxY = TELEMETRY_CERT_STAMP_MAX_Y;
  const battleCodeMaxY = stampMaxY - BATTLE_CODE_ABOVE_STAMP_PX;
  const footerRuleMaxY = battleCodeMaxY - FOOTER_RULE_ABOVE_BATTLE_PX;
  const footerBand = TELEMETRY_CARD_HEIGHT - footerRuleMaxY + 36;

  // Anchor meters above the locked footer so long specs cannot push text onto the foil.
  const meterStartY = Math.min(
    Math.max(specY + 64, 1180),
    TELEMETRY_CARD_HEIGHT - footerBand - metersBlock
  );
  paintRule(ctx, meterStartY - 48);

  input.meters.slice(0, 3).forEach((meter, index) => {
    paintMeterRow(ctx, meter, meterStartY + index * meterGap);
  });

  const footerRuleY = Math.min(meterStartY + metersBlock + 36, footerRuleMaxY);
  const battleCodeY = Math.min(footerRuleY + BATTLE_CODE_ABOVE_STAMP_PX, battleCodeMaxY);
  const stampY = Math.min(battleCodeY + BATTLE_CODE_ABOVE_STAMP_PX, stampMaxY);
  paintRule(ctx, footerRuleY);

  paintLabel(
    ctx,
    input.battleCode,
    TELEMETRY_CARD_WIDTH / 2,
    battleCodeY,
    `24px ${FONT}`,
    'rgba(201,162,39,0.75)',
    'center',
    'middle',
    CONTENT_WIDTH
  );
  paintCertificateTrackedStamp(
    ctx,
    input.verifiedStamp,
    TELEMETRY_CARD_WIDTH / 2,
    stampY,
    `18px ${FONT}`,
    'rgba(113,113,122,0.9)',
    TELEMETRY_CERT_STAMP_TRACKING_PX
  );
}
