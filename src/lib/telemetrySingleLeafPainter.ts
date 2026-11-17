/**
 * Single-leaf carbon / selfie plate painter — dual-hero split (raw | UP rating).
 *
 * WHY: Isolated from `telemetryCardComposer` so full-axis HUD stays ≤490 lines and
 * raw metric + undiluted hero score share equal visual weight without touching locked SSOT.
 */
import {
  resolveTelemetryCardSize,
  tryPaintSelfieBackground,
} from './telemetryCardBackground';
import {
  paintCertificateCrest,
  paintCertificateTrackedStamp,
  TELEMETRY_CERT_SECONDARY_FILL,
  TELEMETRY_CERT_SECONDARY_WEIGHT,
  TELEMETRY_CERT_STAMP_FONT_PX,
  TELEMETRY_CERT_STAMP_TRACKING_PX,
} from './telemetryCardCertificateChrome';
import {
  paintCertificateFrame,
  paintCertificateLabel,
  withMicroEdgeShadow,
} from './telemetryCardCertificateFrame';
import { TELEMETRY_CARD_BRAND } from './telemetryCardComposer';
import { TELEMETRY_SANS_FONT_STACK } from './telemetryCardFonts';
import { resolveCarbonLayout, resolveSelfieLayout } from './telemetryCardLayout';
import {
  paintBrandWatermark,
  paintCornerReticles,
} from './telemetryCardSelfieChrome';
import type { TelemetryDrawContext } from './telemetryCardTypes';
import {
  BILINGUAL_TITLE_BLOCK_PX,
  paintBilingualTitle,
  paintDualHeroSplit,
  paintSingleLeafHudLabel,
  paintTierCapsuleCentered,
  resolveDualHeroGeom,
  resolveSelfieDualHeroGeom,
  resolveSelfieHudVerticalRhythm,
  resolveSelfieTierPillMaxWidth,
  SELFIE_DUAL_HERO_DIVIDER_X,
} from './telemetrySingleLeafDualHero';
import {
  SINGLE_LEAF_VERDICT_SLOT_HEIGHT,
  type TelemetrySingleLeafCardInput,
} from './telemetryReportTypes';

const SANS = TELEMETRY_SANS_FONT_STACK;

/** Selfie content band — lower third so upper musculature stays unobstructed. */
const SELFIE_CONTENT_TOP_RATIO = 0.58;
const SELFIE_CONTENT_BOTTOM_RATIO = 0.89;
const SELFIE_SCRIM_START_RATIO = 0.42;

function paintRule(
  ctx: TelemetryDrawContext,
  x0: number,
  x1: number,
  y: number,
  alpha = 0.28
): void {
  ctx.save();
  withMicroEdgeShadow(ctx, () => {
    ctx.strokeStyle = `rgba(201,162,39,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  });
  ctx.restore();
}

function paintPrecisionBand(
  ctx: TelemetryDrawContext,
  x0: number,
  x1: number,
  y: number
): void {
  paintRule(ctx, x0, x1, y, 0.34);
  const tick = 10;
  ctx.save();
  withMicroEdgeShadow(ctx, () => {
    ctx.strokeStyle = 'rgba(201,162,39,0.42)';
    ctx.lineWidth = 1;
    for (const x of [x0, x1]) {
      ctx.beginPath();
      ctx.moveTo(x, y - tick);
      ctx.lineTo(x, y + tick);
      ctx.stroke();
    }
  });
  ctx.restore();
}

function paintDataZoneGlow(
  ctx: TelemetryDrawContext,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, radius);
  glow.addColorStop(0, 'rgba(201,162,39,0.10)');
  glow.addColorStop(0.45, 'rgba(122,92,40,0.05)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintSelfieBottomScrim(
  ctx: TelemetryDrawContext,
  plateWidth: number,
  plateHeight: number
): void {
  const y0 = plateHeight * SELFIE_SCRIM_START_RATIO;
  const gradient = ctx.createLinearGradient(0, y0, 0, plateHeight);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.55)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y0, plateWidth, plateHeight - y0);
}

interface SingleLeafCarbonRhythm {
  crestCy: number;
  crestOuter: number;
  crestGlow: number;
  titleY: number;
  dualTop: number;
  dualBottom: number;
  verdictTop: number;
  stampY: number;
}

/** Tighter crest→dual-hero rhythm than full six-axis carbon. */
function resolveSingleLeafCarbonRhythm(
  aspect: TelemetrySingleLeafCardInput['aspectRatio'],
  stampMaxY: number
): SingleLeafCarbonRhythm {
  const isFeed = aspect === '4:5';
  const titleY = isFeed ? 372 : 520;
  // WHY: dualTop clears bilingual title block so EN subtitle never collides with heroes.
  const dualTop = titleY + BILINGUAL_TITLE_BLOCK_PX + (isFeed ? 26 : 44);
  const dualBottom = dualTop + (isFeed ? 210 : 250);
  const verdictTop = dualBottom + (isFeed ? 28 : 36);
  return {
    crestCy: isFeed ? 236 : 330,
    crestOuter: isFeed ? 84 : 104,
    crestGlow: isFeed ? 94 : 114,
    titleY,
    dualTop,
    dualBottom,
    verdictTop,
    stampY: stampMaxY,
  };
}

/** Carbon black-gold single-leaf plaque. */
export function paintSingleLeafCertificate(
  ctx: TelemetryDrawContext,
  input: TelemetrySingleLeafCardInput
): void {
  const layout = resolveCarbonLayout(input.aspectRatio);
  const w = layout.plateWidth;
  const contentLeft = 96;
  const contentRight = w - 96;
  const contentWidth = contentRight - contentLeft;
  const cx = w / 2;
  const rhythm = resolveSingleLeafCarbonRhythm(input.aspectRatio, layout.stampMaxY);

  paintCertificateFrame(ctx, layout.plateWidth, layout.plateHeight);

  const brand = input.brandHeader?.trim() || TELEMETRY_CARD_BRAND;
  const year = input.year ?? new Date().getFullYear();
  paintCertificateLabel(
    ctx,
    brand,
    contentLeft,
    layout.headerY,
    `26px ${SANS}`,
    'rgba(161,161,170,0.95)',
    'left',
    'middle',
    contentRight - contentLeft - 80
  );
  paintCertificateLabel(
    ctx,
    String(year),
    contentRight,
    layout.headerY,
    `26px ${SANS}`,
    'rgba(113,113,122,0.95)',
    'right',
    'middle'
  );
  paintRule(ctx, contentLeft, contentRight, layout.headerRuleY);

  paintCertificateCrest(
    ctx,
    layout.crestCx,
    rhythm.crestCy,
    rhythm.crestOuter,
    rhythm.crestGlow
  );

  paintDataZoneGlow(
    ctx,
    cx,
    (rhythm.dualTop + rhythm.dualBottom) / 2,
    input.aspectRatio === '4:5' ? 280 : 340
  );
  paintPrecisionBand(ctx, contentLeft + 40, contentRight - 40, rhythm.titleY - 48);

  paintBilingualTitle(ctx, input, cx, rhythm.titleY, contentWidth);

  paintPrecisionBand(ctx, contentLeft + 40, contentRight - 40, rhythm.dualTop - 16);

  const geom = resolveDualHeroGeom(
    contentLeft,
    contentRight,
    rhythm.dualTop,
    rhythm.dualBottom
  );
  paintDualHeroSplit(ctx, input, geom);

  paintPrecisionBand(ctx, contentLeft + 40, contentRight - 40, rhythm.verdictTop - 18);

  const verdictMid = rhythm.verdictTop + SINGLE_LEAF_VERDICT_SLOT_HEIGHT / 2;
  paintCertificateLabel(
    ctx,
    input.verdictPlaceholder,
    cx,
    verdictMid,
    `22px ${SANS}`,
    'rgba(161,161,170,0.72)',
    'center',
    'middle',
    contentWidth
  );

  paintPrecisionBand(
    ctx,
    contentLeft + 40,
    contentRight - 40,
    rhythm.verdictTop + SINGLE_LEAF_VERDICT_SLOT_HEIGHT + 12
  );

  const verified =
    input.verifiedStamp ?? `VERIFIED PHYSIOLOGICAL SPECIFICATION // ${year}`;
  paintCertificateTrackedStamp(
    ctx,
    verified,
    cx,
    rhythm.stampY,
    `${TELEMETRY_CERT_SECONDARY_WEIGHT} ${TELEMETRY_CERT_STAMP_FONT_PX}px ${SANS}`,
    TELEMETRY_CERT_SECONDARY_FILL,
    TELEMETRY_CERT_STAMP_TRACKING_PX
  );
}

/** Selfie HUD single-leaf — dual-hero in lower third over bottom scrim. */
export function paintSingleLeafSelfieHud(
  ctx: TelemetryDrawContext,
  input: TelemetrySingleLeafCardInput
): void {
  const layout = resolveSelfieLayout(input.aspectRatio);
  const year = input.year ?? new Date().getFullYear();
  paintBrandWatermark(ctx, year, layout);
  paintCornerReticles(ctx, layout);
  paintSelfieBottomScrim(ctx, layout.plateWidth, layout.plateHeight);

  const cx = layout.plateWidth / 2;
  const hard = layout.useFeedWallHardShadow;
  const h = layout.plateHeight;
  const contentLeft = 72;
  const contentRight = layout.plateWidth - 72;
  const contentWidth = contentRight - contentLeft;
  // WHY: Shared rhythm SSOT keeps stamp gap + 4:5 midline contracts testable without canvas.
  const rhythm = resolveSelfieHudVerticalRhythm(
    h,
    input.aspectRatio,
    SELFIE_CONTENT_TOP_RATIO,
    SELFIE_CONTENT_BOTTOM_RATIO
  );

  paintBilingualTitle(ctx, input, cx, rhythm.titleY, contentWidth, {
    hud: true,
    hardShadow: hard,
  });

  const geom = resolveSelfieDualHeroGeom(rhythm.dualTop, rhythm.dualBottom);
  paintDualHeroSplit(ctx, input, geom, { hud: true, hardShadow: hard });

  const capsuleText = input.isOverflow ? input.overflowBadge : input.tierCapsule.trim();
  paintTierCapsuleCentered(
    ctx,
    capsuleText,
    SELFIE_DUAL_HERO_DIVIDER_X,
    rhythm.capsuleY,
    resolveSelfieTierPillMaxWidth(contentWidth),
    { gold: input.isOverflow, hardShadow: hard, hud: true }
  );

  const verified =
    input.verifiedStamp ?? `VERIFIED PHYSIOLOGICAL SPECIFICATION // ${year}`;
  paintSingleLeafHudLabel(
    ctx,
    verified,
    cx,
    rhythm.stampY,
    `18px ${SANS}`,
    'rgba(244,244,245,0.82)',
    'center',
    'middle',
    { maxWidth: contentWidth, hardShadow: hard }
  );
}

/**
 * Rasterize a single-leaf plate. Selfie background failure falls back to carbon.
 */
export function paintSingleLeafReport(
  ctx: TelemetryDrawContext,
  input: TelemetrySingleLeafCardInput
): void {
  const plate = resolveTelemetryCardSize(input.aspectRatio);
  const usedSelfie =
    input.mode === 'selfie'
      ? tryPaintSelfieBackground(ctx, input.background, plate.width, plate.height)
      : false;

  if (usedSelfie) {
    paintSingleLeafSelfieHud(ctx, input);
  } else {
    paintSingleLeafCertificate(ctx, input);
  }
}
