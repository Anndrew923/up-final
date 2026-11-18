/**
 * Carbon black-gold single-leaf / axis-summary vertical rhythm (hud === false).
 *
 * Design Intent (WHY):
 * Compact Centered Stack — pack crest → title → dual → plaque → verdict into one
 * tight group, then center that group between header rule and stamp so 4:5 / 9:16
 * share the same mid-plate balance (no top-docked title + stamp reverse-anchor void).
 *
 * Isolation: Selfie HUD (`hud === true`) never imports this module for Y math.
 */
import { resolveCarbonLayout } from './telemetryCardLayout';
import { CARBON_TIER_CAPSULE_HEIGHT } from './telemetrySingleLeafTierPlaque';
import {
  SINGLE_LEAF_VERDICT_SLOT_HEIGHT,
  type TelemetryReportAspect,
} from './telemetryReportTypes';

/**
 * Foil ZH title + EN subtitle block height.
 * WHY: Owned here so dualHero re-exports one value — no 52px twin constants.
 */
export const CARBON_BILINGUAL_TITLE_BLOCK_PX = 52;

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

/** Crest radii — story vs feed. */
export const CARBON_CREST_OUTER_STORY = 104;
export const CARBON_CREST_OUTER_FEED = 84;
export const CARBON_CREST_GLOW_STORY = 114;
export const CARBON_CREST_GLOW_FEED = 94;

/** Crest → title gap (crest bottom → primary title baseline). */
export const GAP_CREST_TITLE_STORY = 30;
export const GAP_CREST_TITLE_FEED = 26;
/** Title block → dual band top. */
export const GAP_TITLE_DUAL_STORY = 52;
export const GAP_TITLE_DUAL_FEED = 48;
/** Dual bottom → plaque top; plaque bottom → verdict top. */
export const GAP_STACK_STORY = 36;
export const GAP_STACK_FEED = 34;
/** Dual hero band height (compact vs legacy 236/200). */
export const DUAL_BAND_STORY = 200;
export const DUAL_BAND_FEED = 176;
/** Breathing room under header rule / above stamp before centering. */
export const STAGE_PAD_TOP_STORY = 28;
export const STAGE_PAD_TOP_FEED = 20;
export const STAGE_PAD_BOTTOM_STORY = 28;
export const STAGE_PAD_BOTTOM_FEED = 20;

/**
 * Compact Centered Stack for Carbon plates.
 * @param headerRuleY — bottom of header rule; defaults from `resolveCarbonLayout`.
 * @param stampMaxY — verified-stamp baseline (content stage bottom anchor).
 */
export function resolveSingleLeafCarbonRhythm(
  aspect: TelemetryReportAspect,
  stampMaxY: number,
  headerRuleY = resolveCarbonLayout(aspect).headerRuleY
): SingleLeafCarbonRhythm {
  const isFeed = aspect === '4:5';
  const crestOuter = isFeed ? CARBON_CREST_OUTER_FEED : CARBON_CREST_OUTER_STORY;
  const crestGlow = isFeed ? CARBON_CREST_GLOW_FEED : CARBON_CREST_GLOW_STORY;
  const gapCrestTitle = isFeed ? GAP_CREST_TITLE_FEED : GAP_CREST_TITLE_STORY;
  const gapTitleDual = isFeed ? GAP_TITLE_DUAL_FEED : GAP_TITLE_DUAL_STORY;
  const gapStack = isFeed ? GAP_STACK_FEED : GAP_STACK_STORY;
  const dualBand = isFeed ? DUAL_BAND_FEED : DUAL_BAND_STORY;
  const stagePadTop = isFeed ? STAGE_PAD_TOP_FEED : STAGE_PAD_TOP_STORY;
  const stagePadBottom = isFeed ? STAGE_PAD_BOTTOM_FEED : STAGE_PAD_BOTTOM_STORY;
  const plaqueH = CARBON_TIER_CAPSULE_HEIGHT;
  const verdictH = CARBON_VERDICT_SLOT_HEIGHT;

  // Relative stack from crest top (y = 0) — gaps match Compact Centered Stack brief.
  const crestTop = 0;
  const crestCy = crestTop + crestOuter;
  const titleY = crestCy + crestOuter + gapCrestTitle;
  const dualTop = titleY + CARBON_BILINGUAL_TITLE_BLOCK_PX + gapTitleDual;
  const dualBottom = dualTop + dualBand;
  const plaqueTop = dualBottom + gapStack;
  const plaqueY = plaqueTop + plaqueH / 2;
  const verdictTop = plaqueTop + plaqueH + gapStack;
  const verdictBottom = verdictTop + verdictH;
  const stackH = verdictBottom - crestTop;

  const stageTop = headerRuleY + stagePadTop;
  const stageBottom = stampMaxY - stagePadBottom;
  const stageSpan = stageBottom - stageTop;
  // Center the compact group; if stage is tighter than stack, pin to stageTop.
  const offset = stageTop + Math.max(0, (stageSpan - stackH) / 2);

  return {
    crestCy: crestCy + offset,
    crestOuter,
    crestGlow,
    titleY: titleY + offset,
    dualTop: dualTop + offset,
    dualBottom: dualBottom + offset,
    plaqueY: plaqueY + offset,
    verdictTop: verdictTop + offset,
    verdictHeight: verdictH,
    stampY: stampMaxY,
  };
}
