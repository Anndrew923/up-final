/**
 * Offline carbon plate — raster black-gold physiological certificate.
 * WHY: Share Card without a selfie must match the DOM AestheticSpecCard, not the
 * dark telemetry weave + radar HUD used under selfie scrims. Layout is aspect-aware.
 */
import { formatOverallResonanceScore } from '../logic/core/scoring';
import {
  TELEMETRY_CARD_HEIGHT,
  TELEMETRY_CARD_WIDTH,
} from './telemetryCardBackground';
import type { TelemetryCardAspectRatio } from './telemetryCardTypes';
import {
  paintCertificateCrest,
  paintCertificateFoilTitle,
  paintCertificateTrackedStamp,
  TELEMETRY_CERT_SECONDARY_FILL,
  TELEMETRY_CERT_SECONDARY_WEIGHT,
  TELEMETRY_CERT_STAMP_FONT_PX,
  TELEMETRY_CERT_STAMP_TRACKING_PX,
  TELEMETRY_CERT_SUBTITLE_FONT_PX,
} from './telemetryCardCertificateChrome';
import {
  paintCertificateFrame,
  paintCertificateLabel,
  paintCertificateMeterRow,
  paintCertificateMeterStrip,
  TELEMETRY_CERT_FRAME_INSET,
  withMicroEdgeShadow,
  type TelemetryMeterLine,
} from './telemetryCardCertificateFrame';
import { TELEMETRY_SANS_FONT_STACK } from './telemetryCardFonts';
import { resolveCarbonLayout } from './telemetryCardLayout';
import type { TelemetryDrawContext } from './telemetryCardTypes';

export type { TelemetryMeterLine } from './telemetryCardCertificateFrame';
export {
  TELEMETRY_CERT_FRAME_INSET,
  TELEMETRY_CERT_KPI_STRIP_GAP,
  TELEMETRY_CERT_KPI_STRIP_OFFSETS,
  TELEMETRY_CERT_RIVET_CENTERS,
  TELEMETRY_CERT_RIVET_RADIUS,
  paintCertificateMeterStrip,
} from './telemetryCardCertificateFrame';

const FONT = TELEMETRY_SANS_FONT_STACK;
/** Distance from canvas edge to the inner foil stroke (outer inset + inner offset). */
export const TELEMETRY_CERT_INNER_FRAME_INSET = TELEMETRY_CERT_FRAME_INSET + 10;
/** Stamp baseline must stay this many px above the inner foil bottom edge. */
export const TELEMETRY_CERT_STAMP_CLEARANCE_PX = 24;
/** 9:16 stamp ceiling — kept for legacy unit assertions. */
export const TELEMETRY_CERT_STAMP_MAX_Y =
  TELEMETRY_CARD_HEIGHT - TELEMETRY_CERT_INNER_FRAME_INSET - TELEMETRY_CERT_STAMP_CLEARANCE_PX;
const CONTENT_LEFT = 96;
const CONTENT_RIGHT = TELEMETRY_CARD_WIDTH - 96;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

export interface TelemetryCertificatePaintInput {
  brandHeader: string;
  overallScore: number;
  title: string;
  battleCode: string;
  year: number;
  verifiedStamp: string;
  specs: readonly { kicker: string; title: string; subtitle?: string }[];
  meters: readonly TelemetryMeterLine[];
  aspectRatio?: TelemetryCardAspectRatio;
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
  withMicroEdgeShadow(ctx, () => {
    ctx.strokeStyle = 'rgba(201,162,39,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CONTENT_LEFT, y);
    ctx.lineTo(CONTENT_RIGHT, y);
    ctx.stroke();
  });
  ctx.restore();
}

/**
 * Paint the full black-gold certificate plate.
 * WHY: Spec block height varies with wrapped subtitles — meter/footer Y is derived
 * from content so long copy cannot collide with calipers, and a fixed bottom band
 * keeps the last meter clear of the foil frame. 4:5 uses a compressed layout profile.
 */
export function paintCertificatePlate(
  ctx: TelemetryDrawContext,
  input: TelemetryCertificatePaintInput
): void {
  const layout = resolveCarbonLayout(input.aspectRatio ?? '9:16');
  paintCertificateFrame(ctx, layout.plateWidth, layout.plateHeight);

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

  paintCertificateLabel(
    ctx,
    brand,
    CONTENT_LEFT,
    layout.headerY,
    brandFont,
    'rgba(161,161,170,0.95)',
    'left',
    'middle',
    brandMax
  );
  paintCertificateLabel(
    ctx,
    scoreText,
    CONTENT_LEFT + brandWidth + 20,
    layout.headerY,
    scoreFont,
    '#f4f4f5',
    'left',
    'middle'
  );
  paintCertificateLabel(
    ctx,
    yearText,
    CONTENT_RIGHT,
    layout.headerY,
    yearFont,
    'rgba(113,113,122,0.95)',
    'right',
    'middle'
  );

  paintRule(ctx, layout.headerRuleY);
  paintCertificateCrest(
    ctx,
    layout.crestCx,
    layout.crestCy,
    layout.crestOuterRadius,
    layout.crestGlowRadius
  );
  paintCertificateFoilTitle(
    ctx,
    input.title,
    TELEMETRY_CARD_WIDTH / 2,
    layout.titleY
  );

  let specY = layout.specStartY;
  for (const spec of input.specs.slice(0, 3)) {
    paintCertificateLabel(
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
    paintCertificateLabel(
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
      const subFont = `${TELEMETRY_CERT_SECONDARY_WEIGHT} ${TELEMETRY_CERT_SUBTITLE_FONT_PX}px ${FONT}`;
      const lines = wrapLines(ctx, spec.subtitle, subFont, CONTENT_WIDTH - 250, 2);
      lines.forEach((line, index) => {
        paintCertificateLabel(
          ctx,
          line,
          CONTENT_LEFT + 250,
          specY + layout.specSubtitleFirstDy + index * layout.specSubtitleLineGap,
          subFont,
          TELEMETRY_CERT_SECONDARY_FILL,
          'left',
          'middle',
          CONTENT_WIDTH - 250
        );
      });
      specY +=
        layout.specSubtitleFirstDy +
        lines.length * layout.specSubtitleLineGap +
        layout.specAfterSubtitlePad;
    } else {
      specY += layout.specEmptyGap;
    }
  }

  const aspect = input.aspectRatio ?? '9:16';
  const useKpiStrip = aspect === '4:5';
  const meterGap = layout.meterGap;
  const meterCount = Math.min(3, input.meters.length);
  const metersBlock = useKpiStrip
    ? meterCount > 0
      ? layout.meterStripHeight
      : 0
    : meterCount > 0
      ? meterCount * meterGap
      : 0;
  const stampMaxY = layout.stampMaxY;
  const battleCodeMaxY = stampMaxY - layout.battleCodeAboveStamp;
  const footerRuleMaxY = battleCodeMaxY - layout.footerRuleAboveBattle;
  const footerBand = layout.plateHeight - footerRuleMaxY + 36;

  const meterStartY = Math.min(
    Math.max(specY + layout.meterAfterSpecGap, layout.meterMinY),
    layout.plateHeight - footerBand - metersBlock
  );
  paintRule(ctx, meterStartY - layout.meterRuleAbove);

  if (useKpiStrip) {
    paintCertificateMeterStrip(ctx, input.meters.slice(0, 3), meterStartY);
  } else {
    input.meters.slice(0, 3).forEach((meter, index) => {
      paintCertificateMeterRow(ctx, meter, meterStartY + index * meterGap);
    });
  }

  const footerRuleY = Math.min(meterStartY + metersBlock + 36, footerRuleMaxY);
  const battleCodeY = Math.min(
    footerRuleY + layout.battleCodeAboveStamp,
    battleCodeMaxY
  );
  const stampY = Math.min(battleCodeY + layout.battleCodeAboveStamp, stampMaxY);
  paintRule(ctx, footerRuleY);

  paintCertificateLabel(
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
    `${TELEMETRY_CERT_SECONDARY_WEIGHT} ${TELEMETRY_CERT_STAMP_FONT_PX}px ${FONT}`,
    TELEMETRY_CERT_SECONDARY_FILL,
    TELEMETRY_CERT_STAMP_TRACKING_PX
  );
}
