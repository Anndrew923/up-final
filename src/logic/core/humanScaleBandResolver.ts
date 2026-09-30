import type { TFunction } from 'i18next';
import {
  resolveScoreMeaningBand,
  type ScoreMeaningBandMetric,
} from './scoreMeaningCatalog';

/** Decade keys aligned with Dyno Intel hall-of-fame / human-praise matrix. */
export type HumanScaleDecadeKey =
  | '0'
  | '40'
  | '50'
  | '60'
  | '70'
  | '80'
  | '90'
  | '100'
  | '110'
  | '120'
  | '130'
  | '140'
  | '150';

export const HUMAN_SCALE_DECADE_KEYS: readonly HumanScaleDecadeKey[] = [
  '0',
  '40',
  '50',
  '60',
  '70',
  '80',
  '90',
  '100',
  '110',
  '120',
  '130',
  '140',
  '150',
] as const;

/**
 * Maps scoreMeaning bandId → human-scale decadeKey.
 * WHY: Badge / hall-of-fame / praise matrix share one decade ladder; LEGEND+PANTHEON collapse to 150.
 * PARITY: Keep in lockstep with `functions/dynoIntel/scoreBandResolver.js` → `resolveHumanScaleDecadeKey`.
 */
export function resolveDecadeKeyFromBandId(bandId: string): HumanScaleDecadeKey {
  if (bandId === 'BASE') return '0';
  if (bandId === 'LEGEND' || bandId === 'PANTHEON') return '150';
  // WHY: Defensive — any TIER_150+ style id must still land on the pantheon decade cell.
  if (/^TIER_1[567]0$/.test(bandId)) return '150';
  const match = /^TIER_(\d+)$/.exec(bandId);
  if (!match) return '0';
  const decade = Math.floor(Number(match[1]) / 10) * 10;
  const clamped = Math.max(0, Math.min(150, decade));
  if (clamped < 40) return '0';
  return String(clamped) as HumanScaleDecadeKey;
}

export function resolveDecadeKeyFromScore(
  metric: ScoreMeaningBandMetric,
  score: number
): HumanScaleDecadeKey {
  return resolveDecadeKeyFromBandId(resolveScoreMeaningBand(metric, score).id);
}

export function getPopulationClassI18nKey(decadeKey: string): string {
  return `dynoIntel.humanPraise.byDecade.${decadeKey}.populationClass`;
}

/** Resolves populationClass via i18n with decade-"0" fallback when a key is missing. */
export function translatePopulationClass(t: TFunction, decadeKey: string): string {
  const key = getPopulationClassI18nKey(decadeKey);
  const resolved = t(key);
  if (resolved !== key && String(resolved).trim()) return String(resolved);
  const fallbackKey = getPopulationClassI18nKey('0');
  const fallback = t(fallbackKey);
  return fallback === fallbackKey ? '' : String(fallback);
}

export interface HumanScaleBandMeta {
  bandId: string;
  decadeKey: HumanScaleDecadeKey;
  populationClass: string;
}

/**
 * Decade + populationClass from an already-resolved bandId.
 * WHY: Callers that already walked `resolveScoreMeaningMilestone` must not re-resolve the band table.
 */
export function resolveHumanScaleMetaFromBandId(
  t: TFunction,
  bandId: string
): Pick<HumanScaleBandMeta, 'decadeKey' | 'populationClass'> {
  const decadeKey = resolveDecadeKeyFromBandId(bandId);
  return {
    decadeKey,
    populationClass: translatePopulationClass(t, decadeKey),
  };
}

export function resolveHumanScaleBandMeta(
  t: TFunction,
  metric: ScoreMeaningBandMetric,
  score: number
): HumanScaleBandMeta {
  const bandId = resolveScoreMeaningBand(metric, score).id;
  return {
    bandId,
    ...resolveHumanScaleMetaFromBandId(t, bandId),
  };
}
