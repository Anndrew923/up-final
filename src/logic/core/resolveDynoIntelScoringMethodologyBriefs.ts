import type { TFunction } from 'i18next';
import {
  COOPER_MAX_DISTANCE_FEMALE_METERS,
  COOPER_MAX_DISTANCE_MALE_METERS,
} from './cardioScoring';
import {
  DYNO_SCORING_METHODOLOGY_CATALOG,
} from './dynoIntelScoringMethodologyCatalog';
import type { DynoScoringMethodologyBrief } from './dynoIntelTypes';

const METHODOLOGY_I18N_INTERPOLATIONS: Record<string, Record<string, number>> = {
  'cardio.cooperInfo.p5': {
    maleCap: COOPER_MAX_DISTANCE_MALE_METERS,
    femaleCap: COOPER_MAX_DISTANCE_FEMALE_METERS,
  },
};

function resolveCatalogLine(t: TFunction, key: string): string {
  const interpolation = METHODOLOGY_I18N_INTERPOLATIONS[key];
  const resolved = interpolation ? t(key, interpolation) : t(key);
  if (resolved === key) return '';
  return resolved.trim();
}

function resolveCatalogBody(t: TFunction, bodyKeys: readonly string[]): string {
  const paragraphs = bodyKeys
    .map((key) => resolveCatalogLine(t, key))
    .filter((line) => line.length > 0);
  return paragraphs.join('\n\n');
}

/**
 * Resolves full App scoring methodology briefs for Callable context.
 * WHY: Full six-axis + supplemental coverage so Cooper / 5km / armSize questions never hit off-topic.
 */
export function resolveDynoIntelScoringMethodologyBriefs(
  t: TFunction
): DynoScoringMethodologyBrief[] {
  return DYNO_SCORING_METHODOLOGY_CATALOG.map((entry) => ({
    metric: entry.metric,
    title: resolveCatalogLine(t, entry.titleKey),
    body: resolveCatalogBody(t, entry.bodyKeys),
  })).filter((brief) => brief.title.length > 0 && brief.body.length > 0);
}
