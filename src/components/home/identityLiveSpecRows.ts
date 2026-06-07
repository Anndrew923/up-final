import type { TFunction } from 'i18next';
import { translateScoreBandMeaning } from '../../logic/core/scoreMeaningCopy';
import { SIX_AXIS_METRICS } from '../../types/scoring';
import type { IdentityLiveSpecRow } from './IdentityLiveSpecList';

export interface RadarPointForLiveSpec {
  key: string;
  value: number;
}

/** Single resolver for identity card + resonance overlay — avoids band/i18n drift. */
export function buildIdentityLiveSpecRows(
  t: TFunction,
  radarPoints: ReadonlyArray<RadarPointForLiveSpec>
): IdentityLiveSpecRow[] {
  const byKey = new Map(radarPoints.map((point) => [point.key, point]));
  return SIX_AXIS_METRICS.map((metric) => {
    const point = byKey.get(metric);
    const value = point?.value ?? 0;
    const { title } = translateScoreBandMeaning(t, metric, value);
    return {
      metric,
      bandTitle: title,
    };
  });
}
