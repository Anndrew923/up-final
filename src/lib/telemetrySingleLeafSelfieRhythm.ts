/**
 * Selfie single-leaf vertical rhythm (drop + stamp-anchored plaque).
 * WHY: Pure geometry SSOT — keeps dualHero paint under the 500-line split threshold.
 */
import type { TelemetryReportAspect } from './telemetryReportTypes';
import { SELFIE_TIER_CAPSULE_HEIGHT } from './telemetrySingleLeafTierPlaque';

export const SELFIE_BILINGUAL_TITLE_BLOCK_PX = 56;
/** Gap from dual-hero band bottom to mid-axis capsule center. */
export const SELFIE_TIER_CAPSULE_BELOW_DUAL = 16 + SELFIE_TIER_CAPSULE_HEIGHT / 2;
/** Preferred air between capsule bottom edge and verifiedStamp baseline. */
export const SELFIE_TIER_STAMP_GAP_PX = 34;
export const SELFIE_TIER_STAMP_GAP_MIN = 30;
export const SELFIE_TIER_STAMP_GAP_MAX = 38;
export const SELFIE_HUD_DROP_9_16 = 120;
export const SELFIE_HUD_DROP_4_5 = 70;

export function resolveSelfieHudDropPx(aspect: TelemetryReportAspect): number {
  return aspect === '4:5' ? SELFIE_HUD_DROP_4_5 : SELFIE_HUD_DROP_9_16;
}

export interface SelfieHudVerticalRhythm {
  drop: number;
  bandTop: number;
  bandBottom: number;
  titleY: number;
  dualTop: number;
  dualBottom: number;
  capsuleY: number;
  stampY: number;
  stampGap: number;
}

/**
 * Selfie HUD vertical dock — stamp-anchored so plaque→footer gap stays in [30, 38].
 * `contentTopRatio` / `contentBottomRatio` match painter SELFIE_CONTENT_* constants.
 */
export function resolveSelfieHudVerticalRhythm(
  plateHeight: number,
  aspect: TelemetryReportAspect,
  contentTopRatio = 0.58,
  contentBottomRatio = 0.89
): SelfieHudVerticalRhythm {
  const drop = resolveSelfieHudDropPx(aspect);
  const bandTop = plateHeight * contentTopRatio + drop;
  const bandBottom = plateHeight * contentBottomRatio;
  const band = Math.max(120, bandBottom - bandTop);
  const stampY = bandBottom;
  const capsuleY = stampY - SELFIE_TIER_STAMP_GAP_PX - SELFIE_TIER_CAPSULE_HEIGHT / 2;
  const dualBottom = capsuleY - SELFIE_TIER_CAPSULE_BELOW_DUAL;
  const dualHeight = Math.min(band * 0.42, dualBottom - (bandTop + band * 0.12));
  const dualTop = Math.max(bandTop + band * 0.1, dualBottom - Math.max(160, dualHeight));
  const titleY = Math.max(bandTop + 8, dualTop - SELFIE_BILINGUAL_TITLE_BLOCK_PX - 10);
  const stampGap = stampY - (capsuleY + SELFIE_TIER_CAPSULE_HEIGHT / 2);
  return {
    drop,
    bandTop,
    bandBottom,
    titleY,
    dualTop,
    dualBottom,
    capsuleY,
    stampY,
    stampGap,
  };
}
