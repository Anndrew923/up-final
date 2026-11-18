/**
 * Carbon dual-hero vertical rhythm — stamp-anchored plaque + verdict slot.
 * WHY: Pure geometry SSOT keeps painter under 500 while filling bottom black air.
 */
import { CARBON_TIER_CAPSULE_HEIGHT } from './telemetrySingleLeafTierPlaque';
import {
  SINGLE_LEAF_VERDICT_SLOT_HEIGHT,
  type TelemetryReportAspect,
} from './telemetryReportTypes';

/** Must match `BILINGUAL_TITLE_BLOCK_PX` in dualHero — avoids circular imports. */
const CARBON_BILINGUAL_TITLE_BLOCK_PX = 52;

/** Dedicated coach-copy stage under mid-axis plaque (115–130). */
export const CARBON_VERDICT_SLOT_HEIGHT = SINGLE_LEAF_VERDICT_SLOT_HEIGHT;
export const CARBON_VERDICT_SLOT_MIN = 115;
export const CARBON_VERDICT_SLOT_MAX = 130;

export interface SingleLeafCarbonRhythm {
  crestCy: number;
  crestOuter: number;
  crestGlow: number;
  titleY: number;
  dualTop: number;
  dualBottom: number;
  /** Mid-axis ceremonial plaque center Y (cx = 540). */
  plaqueY: number;
  verdictTop: number;
  verdictHeight: number;
  stampY: number;
}

/**
 * Carbon certificate rhythm — crest/title dock from top; dual→plaque→verdict
 * reverse-anchor from stamp so bottom black void collapses.
 */
export function resolveSingleLeafCarbonRhythm(
  aspect: TelemetryReportAspect,
  stampMaxY: number
): SingleLeafCarbonRhythm {
  const isFeed = aspect === '4:5';
  const titleY = isFeed ? 372 : 520;
  const minDualTop = titleY + CARBON_BILINGUAL_TITLE_BLOCK_PX + (isFeed ? 26 : 44);
  const dualBand = isFeed ? 200 : 236;
  const plaqueH = CARBON_TIER_CAPSULE_HEIGHT;
  const verdictH = CARBON_VERDICT_SLOT_HEIGHT;
  const gapStamp = isFeed ? 18 : 26;
  const gapVerdictPlaque = isFeed ? 16 : 20;
  const gapPlaqueDual = isFeed ? 22 : 28;

  const stampY = stampMaxY;
  let verdictBottom = stampY - gapStamp;
  let verdictTop = verdictBottom - verdictH;
  let plaqueY = verdictTop - gapVerdictPlaque - plaqueH / 2;
  let dualBottom = plaqueY - plaqueH / 2 - gapPlaqueDual;
  let dualTop = dualBottom - dualBand;

  // WHY: Title collision → forward-dock dual, then re-seat plaque/verdict under it.
  if (dualTop < minDualTop) {
    dualTop = minDualTop;
    dualBottom = dualTop + dualBand;
    plaqueY = dualBottom + gapPlaqueDual + plaqueH / 2;
    verdictTop = plaqueY + plaqueH / 2 + gapVerdictPlaque;
    verdictBottom = verdictTop + verdictH;
    // Prefer keeping stamp clearance if the forward stack still fits.
    if (verdictBottom + gapStamp > stampY) {
      verdictTop = stampY - gapStamp - verdictH;
      plaqueY = verdictTop - gapVerdictPlaque - plaqueH / 2;
      dualBottom = plaqueY - plaqueH / 2 - gapPlaqueDual;
      dualTop = Math.min(dualBottom - Math.max(160, dualBand * 0.75), dualBottom - 160);
      dualTop = Math.max(minDualTop, dualTop);
    }
  }

  return {
    crestCy: isFeed ? 236 : 330,
    crestOuter: isFeed ? 84 : 104,
    crestGlow: isFeed ? 94 : 114,
    titleY,
    dualTop,
    dualBottom,
    plaqueY,
    verdictTop,
    verdictHeight: verdictH,
    stampY,
  };
}
